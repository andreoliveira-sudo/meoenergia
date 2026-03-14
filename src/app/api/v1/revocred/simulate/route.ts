import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer-core";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Resolve the Chrome/Chromium executable path for puppeteer-core.
 * Checks CHROME_PATH env var first, then common Windows/Linux locations.
 */
function getChromePath(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  // Windows common locations
  const winPaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  // Linux common locations
  const linuxPaths = [
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];

  const paths = process.platform === "win32" ? winPaths : linuxPaths;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs");
  for (const p of paths) {
    try { if (fs.existsSync(p)) return p; } catch { /* ignore */ }
  }

  // Fallback — let puppeteer-core try its default
  return process.platform === "win32" ? winPaths[0] : "/usr/bin/google-chrome";
}

function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return cpf;
}

function formatBRL(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toFixed(2).replace(".", ",");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kdi = searchParams.get("kdi");
  const stepDelay = Math.max(1, Math.min(10, Number(searchParams.get("stepDelay")) || 2));

  if (!kdi) {
    return new Response(JSON.stringify({ error: "kdi is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function sendEvent(step: string, status: string, detail: string) {
        const data = JSON.stringify({ step, status, detail });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }

      let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

      try {
        // ─── a) Fetch order data from Supabase ───
        sendEvent("fetch_order", "running", "Buscando dados do pedido...");

        const supabaseUrl =
          process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          sendEvent("fetch_order", "error", "Supabase credentials not configured");
          controller.close();
          return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("*, customers(*)")
          .eq("kdi", kdi)
          .single();

        if (orderError || !order) {
          sendEvent(
            "fetch_order",
            "error",
            `Pedido nao encontrado: ${orderError?.message || "not found"}`
          );
          controller.close();
          return;
        }

        const customer = order.customers as Record<string, unknown> | null;
        const cpfCnpj =
          (customer?.cpf as string) || (customer?.cnpj as string) || "";
        const systemPower = order.system_power as number;
        const equipmentValue = order.equipment_value as number;
        const laborValue = order.labor_value as number;
        const monthlyBillValue = order.monthly_bill_value as number;
        const orderKdi = order.kdi as string;

        sendEvent(
          "fetch_order",
          "done",
          `Pedido ${orderKdi} encontrado - CPF/CNPJ: ${cpfCnpj}`
        );

        // ─── b) Launch Puppeteer ───
        sendEvent("launch_browser", "running", "Iniciando navegador...");

        browser = await puppeteer.launch({
          headless: true,
          executablePath: getChromePath(),
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        sendEvent("launch_browser", "done", "Navegador iniciado");

        // ─── c) Login to RevoCred ───
        sendEvent("login", "running", "Fazendo login na RevoCred...");

        await page.goto("https://app.revocred.com.br/login", {
          waitUntil: "networkidle2",
        });
        await wait(stepDelay * 1000);

        // Fill email — try multiple selectors
        const emailInput = await page.$(
          'input[type="email"], input[name="email"], input[placeholder*="mail"], input[placeholder*="Mail"]'
        );
        if (emailInput) {
          await emailInput.click();
          await emailInput.type(process.env.REVOCRED_EMAIL || "rpa@meoenergia.com.br", { delay: 50 });
        } else {
          // Fallback: first visible text input
          const firstInput = await page.$('input[type="text"], input:not([type])');
          if (firstInput) {
            await firstInput.click();
            await firstInput.type(process.env.REVOCRED_EMAIL || "rpa@meoenergia.com.br", { delay: 50 });
          }
        }

        // Fill password — try multiple selectors
        const passwordInput = await page.$(
          'input[type="password"], input[name="password"]'
        );
        if (passwordInput) {
          await passwordInput.click();
          await passwordInput.type(process.env.REVOCRED_PASSWORD || "#Meo_2026", { delay: 50 });
        }

        // Click login button — find by text or type
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll("button"));
          const btn =
            buttons.find((b) => b.getAttribute("type") === "submit") ||
            buttons.find((b) =>
              b.textContent?.toLowerCase().includes("entrar") ||
              b.textContent?.toLowerCase().includes("login") ||
              b.textContent?.toLowerCase().includes("acessar")
            );
          if (btn) btn.click();
        });

        // Wait for redirect after login (could be /propostas or /dashboard or other)
        await page.waitForFunction(
          () => !window.location.pathname.includes("/login"),
          { timeout: 15000 }
        );
        await wait(stepDelay * 1500);

        sendEvent("login", "done", "Login realizado com sucesso");

        // ─── d) Navigate to simulation page ───
        sendEvent("navigate", "running", "Navegando para simulacao...");

        await page.goto("https://app.revocred.com.br/simulacao", {
          waitUntil: "networkidle2",
        });
        await wait(stepDelay * 1500);

        sendEvent("navigate", "done", "Pagina de simulacao carregada");

        // ─── e) Fill form ───
        // RevoCred uses Livewire — inputs have NO name attributes.
        // We identify fields by placeholder text and position (mapped from real DOM).
        // Input order: [0]=hidden _token, [1]=search distribuidor, [2]=conta luz,
        //              [3]=CPF/CNPJ, [4]=kWp(number), [5]=valor produtos,
        //              [6]=valor mao obra, [7]=codigo pedido
        // Select order: [0]=product selector(top), [1]=data primeira parcela

        sendEvent("fill_form", "running", "Selecionando distribuidor Sol+...");

        // Distribuidor: custom dropdown — click the button that opens the list
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll("button"));
          const btn = buttons.find(
            (b) =>
              b.textContent?.includes("Selecione") &&
              !b.textContent?.includes("parcela")
          );
          if (btn) btn.click();
        });
        await wait(stepDelay * 1000);

        // Type "Sol+" in the search input that appeared (input index 1)
        const searchInput = await page.$('input[placeholder*="Buscar"]');
        if (searchInput) {
          await searchInput.type("Sol+", { delay: 80 });
          await wait(stepDelay * 1000);
        }

        // Click the Sol+ option in the list
        await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll("li span, li div"));
          const solItem = items.find((el) =>
            el.textContent?.trim().startsWith("Sol+")
          );
          if (solItem) (solItem as HTMLElement).click();
        });
        await wait(stepDelay * 1000);

        sendEvent("fill_form", "running", "Preenchendo conta de luz...");

        // Conta de luz — input with placeholder "R$ 0,00" (index 2)
        const inputs = await page.$$("input");
        if (inputs[2]) {
          await inputs[2].click({ clickCount: 3 });
          await inputs[2].type(formatBRL(monthlyBillValue), { delay: 60 });
        }
        await wait(stepDelay * 1000);

        sendEvent("fill_form", "running", "Preenchendo CPF/CNPJ...");

        // CPF/CNPJ — input with placeholder "CPF/CNPJ" (index 3)
        const formattedDoc =
          cpfCnpj.replace(/\D/g, "").length === 11
            ? formatCPF(cpfCnpj)
            : cpfCnpj;
        if (inputs[3]) {
          await inputs[3].click();
          await inputs[3].type(formattedDoc, { delay: 60 });
        }
        await wait(stepDelay * 1000);

        sendEvent("fill_form", "running", "Preenchendo kWp do sistema...");

        // kWp — number input (index 4)
        if (inputs[4]) {
          await inputs[4].click({ clickCount: 3 });
          await inputs[4].type(String(systemPower), { delay: 60 });
        }
        await wait(stepDelay * 1000);

        sendEvent("fill_form", "running", "Preenchendo valor dos equipamentos...");

        // Valor dos produtos (index 5)
        if (inputs[5]) {
          await inputs[5].click({ clickCount: 3 });
          await inputs[5].type(formatBRL(equipmentValue), { delay: 60 });
        }
        await wait(stepDelay * 1000);

        sendEvent("fill_form", "running", "Preenchendo valor mao de obra...");

        // Valor mao de obra (index 6)
        if (inputs[6]) {
          await inputs[6].click({ clickCount: 3 });
          await inputs[6].type(formatBRL(laborValue), { delay: 60 });
        }
        await wait(stepDelay * 1000);

        sendEvent("fill_form", "running", "Preenchendo codigo do pedido...");

        // Codigo do pedido (index 7)
        if (inputs[7]) {
          await inputs[7].click({ clickCount: 3 });
          await inputs[7].type(String(orderKdi), { delay: 60 });
        }
        await wait(stepDelay * 1000);

        sendEvent("fill_form", "running", "Selecionando data da primeira parcela...");

        // Data da primeira parcela — native <select>, pick first available (index 1)
        await page.evaluate(() => {
          const selects = Array.from(document.querySelectorAll("select"));
          const parcelaSel = selects.find((s) =>
            Array.from(s.options).some((o) => o.text.includes("/"))
          );
          if (parcelaSel && parcelaSel.options.length > 1) {
            parcelaSel.value = parcelaSel.options[1].value;
            parcelaSel.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
        await wait(stepDelay * 1000);

        sendEvent("fill_form", "done", "Formulario preenchido com sucesso");

        // ─── f) Click Simular ───
        sendEvent("simulate", "running", "Clicando em Simular...");

        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll("button"));
          const btn = buttons.find((b) =>
            b.textContent?.trim().toLowerCase() === "simular"
          );
          if (btn) btn.click();
        });
        await wait(stepDelay * 1500);

        sendEvent("simulate", "done", "Simulacao enviada");

        // ─── g) Handle authorization modal ───
        sendEvent("authorization", "running", "Aguardando autorizacao...");

        try {
          await wait(stepDelay * 1000);
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("button"));
            const btn = buttons.find((b) =>
              b.textContent?.toLowerCase().includes("aceitar")
            );
            if (btn) btn.click();
          });
          await wait(stepDelay * 4000);

          sendEvent("authorization", "done", "Autorizacao aceita");
        } catch {
          sendEvent(
            "authorization",
            "done",
            "Modal de autorizacao nao apareceu, continuando..."
          );
        }

        // ─── h) Read result ───
        sendEvent("read_result", "running", "Lendo resultado...");

        const result = await page.evaluate(() => {
          const body = document.body.innerText || "";

          if (body.includes("Não encontramos") || body.includes("nao encontramos")) {
            return { status: "REPROVADO", parcelas: [] as Array<{prazo: string; valor: string; taxa: string}> };
          }

          if (
            body.includes("pré-aprovado") ||
            body.includes("pre-aprovado") ||
            body.includes("aprovado")
          ) {
            return { status: "APROVADO", parcelas: [] as Array<{prazo: string; valor: string; taxa: string}> };
          }

          return { status: "INDEFINIDO", parcelas: [] as Array<{prazo: string; valor: string; taxa: string}> };
        });

        if (result.status === "APROVADO") {
          // Click Continuar and scrape parcelas table
          const continuarBtn = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("button"));
            const btn = buttons.find((b) =>
              b.textContent?.toLowerCase().includes("continuar")
            );
            if (btn) {
              btn.click();
              return true;
            }
            return false;
          });

          if (continuarBtn) {
            await wait(stepDelay * 1500);

            const parcelas = await page.evaluate(() => {
              // Parcelas are displayed as radio options with text like "36X de R$ 257,27" and "1.75% a.m"
              const body = document.body.innerText || "";
              const lines = body.split("\n").filter((l) => l.match(/^\d+X de R\$/));
              const results: Array<{prazo: string; valor: string; taxa: string}> = [];
              for (const line of lines) {
                const match = line.match(/(\d+X)\s+de\s+(R\$\s*[\d.,]+)/);
                if (match) {
                  // Find the taxa on the same line or nearby
                  const taxaMatch = line.match(/([\d.,]+%\s*a\.m)/);
                  results.push({
                    prazo: match[1],
                    valor: match[2],
                    taxa: taxaMatch ? taxaMatch[1] : "",
                  });
                }
              }
              // Fallback: scrape from the structured layout
              if (results.length === 0) {
                const items = document.querySelectorAll('[class*="radio"], [class*="option"], label');
                items.forEach((item) => {
                  const text = item.textContent || "";
                  const m = text.match(/(\d+X).*?(R\$\s*[\d.,]+).*?([\d.,]+%\s*a\.m)/);
                  if (m) results.push({ prazo: m[1], valor: m[2], taxa: m[3] });
                });
              }
              return results;
            });

            result.parcelas = parcelas;
          }

          sendEvent(
            "read_result",
            "done",
            JSON.stringify({
              resultado: "APROVADO",
              parcelas: result.parcelas,
            })
          );
        } else if (result.status === "REPROVADO") {
          sendEvent(
            "read_result",
            "done",
            JSON.stringify({ resultado: "REPROVADO", motivo: "Credito nao aprovado" })
          );
        } else {
          sendEvent(
            "read_result",
            "done",
            JSON.stringify({
              resultado: "INDEFINIDO",
              motivo: "Nao foi possivel determinar o resultado",
            })
          );
        }

        sendEvent("complete", "done", "Simulacao finalizada");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        sendEvent("error", "error", `Erro na simulacao: ${message}`);
      } finally {
        // ─── i) Close browser ───
        if (browser) {
          try {
            await browser.close();
          } catch {
            // ignore close errors
          }
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/**
 * OPTIONS handler for CORS preflight (needed when Vercel PROD calls DEV server)
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
