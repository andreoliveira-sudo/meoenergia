/**
 * ═══════════════════════════════════════════════════════════════════
 * RevoCred Batch Manager — Server-Side Singleton
 * ═══════════════════════════════════════════════════════════════════
 *
 * Runs the batch simulation loop INSIDE the Node.js process (Docker).
 * Survives page navigations, logout, browser close, etc.
 * Only stops when an admin explicitly clicks "Parar".
 *
 * Architecture:
 * - Global state stored in `globalThis` (persists across HTTP requests)
 * - Calls the /simulate SSE endpoint on localhost via fetch streaming
 * - Updates Supabase activity table for cross-client visibility
 * - Heartbeat every 10 seconds to signal liveness
 * - Error recovery: retries after 30s on any error, never dies
 */

import { createClient } from "@supabase/supabase-js";

/* ─── Types ─── */

interface BatchResult {
  kdi: string;
  customerName: string;
  resultado: "APROVADO" | "REPROVADO";
  detail: string;
}

interface StepEntry {
  step: string;
  status: string;
  detail?: string;
  timestamp: string;
}

interface PendingOrder {
  kdi: string;
  customerName: string;
  cpfCnpj: string;
  systemPower: number;
  equipmentValue: number;
  laborValue: number;
  monthlyBillValue: number;
}

export interface BatchState {
  status: "idle" | "running" | "waiting" | "stopped";
  startedBy: string;
  batchDate: string;
  batchStatusFilter: string;
  batchStepDelay: number;
  batchInterval: number;
  currentKdi: string | null;
  currentOrderIndex: number;
  totalOrders: number;
  processedCount: number;
  results: BatchResult[];
  nextRunAt: string | null;
  currentSteps: StepEntry[];
  error: string | null;
  startedAt: string | null;
}

/* ─── Global Singleton (survives across HTTP requests in same Node.js process) ─── */

const g = globalThis as unknown as {
  __batchState?: BatchState;
  __batchAbort?: boolean;
  __batchTimer?: ReturnType<typeof setTimeout> | null;
  __batchRunning?: boolean;
};

const DEFAULT_STATE: BatchState = {
  status: "idle",
  startedBy: "",
  batchDate: "",
  batchStatusFilter: "analysis_pending",
  batchStepDelay: 3,
  batchInterval: 5,
  currentKdi: null,
  currentOrderIndex: 0,
  totalOrders: 0,
  processedCount: 0,
  results: [],
  nextRunAt: null,
  currentSteps: [],
  error: null,
  startedAt: null,
};

function getState(): BatchState {
  if (!g.__batchState) {
    g.__batchState = { ...DEFAULT_STATE };
  }
  return g.__batchState;
}

function isRunning(): boolean {
  return g.__batchRunning === true;
}

/* ─── Helpers ─── */

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials");
  return createClient(url, key);
}

function getBaseUrl(): string {
  const port = process.env.PORT || "3000";
  return `http://localhost:${port}`;
}

/* ─── Sync activity table in Supabase (for cross-client polling) ─── */

async function syncActivity(updates: Record<string, unknown>) {
  try {
    const supabase = getSupabase();
    await (
      supabase.from("revocred_activity") as ReturnType<typeof supabase.from>
    )
      .update({
        ...updates,
        last_heartbeat: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", 1);
  } catch (err) {
    console.error("[BatchManager] syncActivity error:", err);
  }
}

/* ─── Fetch pending orders ─── */

async function fetchPendingOrders(
  date: string,
  statusFilter: string
): Promise<PendingOrder[]> {
  const supabase = getSupabase();
  const dateFrom = `${date}T00:00:00.000Z`;
  const dateTo = `${date}T23:59:59.999Z`;

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "kdi, status, created_at, system_power, equipment_value, labor_value, monthly_bill_value, customers(name, cpf, cnpj)"
    )
    .eq("status", statusFilter)
    .is("deleted_at", null)
    .gte("created_at", dateFrom)
    .lte("created_at", dateTo)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (orders || []).map((o: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customer = o.customers as any;
    return {
      kdi: o.kdi,
      customerName: customer?.name || "—",
      cpfCnpj: customer?.cpf || customer?.cnpj || "—",
      systemPower: o.system_power,
      equipmentValue: o.equipment_value,
      laborValue: o.labor_value,
      monthlyBillValue: o.monthly_bill_value,
    };
  });
}

/* ─── Run simulation via SSE endpoint (localhost server-to-server) ─── */

async function runSimulation(
  kdi: string,
  stepDelay: number
): Promise<{
  resultado: string;
  detail: string;
  parcelas?: unknown[];
  stepsLog?: unknown[];
}> {
  const state = getState();
  const url = `${getBaseUrl()}/meo/api/v1/revocred/simulate?kdi=${encodeURIComponent(kdi)}&stepDelay=${stepDelay}`;
  const collectedSteps: StepEntry[] = [];
  let finalResult = {
    resultado: "INDEFINIDO",
    detail: "",
    parcelas: [] as unknown[],
    stepsLog: [] as unknown[],
  };

  try {
    const response = await fetch(url);
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      if (g.__batchAbort) break;

      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      while (buffer.includes("\n")) {
        const idx = buffer.indexOf("\n");
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);

        if (!line.startsWith("data: ")) continue;

        try {
          const data = JSON.parse(line.slice(6));
          collectedSteps.push({
            step: data.step,
            status: data.status,
            detail: data.detail,
            timestamp: new Date().toISOString(),
          });

          // Update live steps for UI polling (deduplicated)
          if (data.step !== "complete" && data.step !== "read_result") {
            const stepMap = new Map<string, StepEntry>();
            for (const s of collectedSteps) {
              if (s.step !== "complete" && s.step !== "read_result") {
                stepMap.set(s.step, s);
              }
            }
            state.currentSteps = Array.from(stepMap.values());
          }

          if (
            data.step === "read_result" &&
            data.status === "done" &&
            data.detail
          ) {
            try {
              const parsed = JSON.parse(data.detail);
              finalResult = {
                resultado: parsed.resultado,
                detail: parsed.motivo || "",
                parcelas: parsed.parcelas || [],
                stepsLog: collectedSteps,
              };
              if (
                parsed.resultado === "APROVADO" &&
                parsed.parcelas?.length > 0
              ) {
                finalResult.detail = parsed.parcelas
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .map(
                    (p: any) => `${p.prazo} de ${p.valor} (${p.taxa})`
                  )
                  .join(", ");
              }
            } catch {
              finalResult = {
                resultado: "INDEFINIDO",
                detail: data.detail,
                parcelas: [],
                stepsLog: collectedSteps,
              };
            }
          }

          if (data.step === "error") {
            finalResult = {
              resultado: "ERRO",
              detail: data.detail || "Erro desconhecido",
              parcelas: [],
              stepsLog: collectedSteps,
            };
          }

          if (data.step === "complete") {
            finalResult.stepsLog = collectedSteps;
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      resultado: "ERRO",
      detail: message || "Erro na simulação",
      parcelas: [],
      stepsLog: collectedSteps,
    };
  }

  finalResult.stepsLog = collectedSteps;
  return finalResult;
}

/* ─── Update order status ─── */

async function updateOrderStatus(kdi: string, resultado: string) {
  const supabase = getSupabase();
  const newStatus =
    resultado === "APROVADO" ? "analysis_approved" : "analysis_rejected";
  await (
    supabase.from("orders") as unknown as {
      update: (d: Record<string, unknown>) => {
        eq: (c: string, v: string) => Promise<unknown>;
      };
    }
  )
    .update({ status: newStatus })
    .eq("kdi", kdi);
}

/* ─── Save log ─── */

async function saveLog(logData: Record<string, unknown>) {
  try {
    const supabase = getSupabase();
    await (
      supabase.from("revocred_simulation_logs") as ReturnType<
        typeof supabase.from
      >
    ).insert(logData as Record<string, unknown>);
  } catch (err) {
    console.error("[BatchManager] saveLog error:", err);
  }
}

/* ─── Main Batch Loop (runs indefinitely until stopped) ─── */

async function runBatchLoop() {
  const state = getState();
  const processedKdis = new Set<string>();
  let orderIndex = 0;

  // Heartbeat every 10 seconds to signal liveness
  const heartbeatInterval = setInterval(() => {
    if (!g.__batchRunning) return;
    syncActivity({
      status: state.status,
      current_kdi: state.currentKdi,
      current_order_index: state.currentOrderIndex,
      total_orders: state.totalOrders,
      processed_count: state.processedCount,
      next_run_at: state.nextRunAt,
      results: state.results,
    });
  }, 10_000);

  try {
    while (!g.__batchAbort) {
      try {
        // 1. Fresh fetch — re-query DB each iteration to capture new orders
        const freshOrders = await fetchPendingOrders(
          state.batchDate,
          state.batchStatusFilter
        );
        if (g.__batchAbort) break;

        // 2. Filter out already processed in this batch run
        const remaining = freshOrders.filter(
          (o) => !processedKdis.has(o.kdi)
        );
        state.totalOrders = freshOrders.length;

        if (remaining.length === 0) {
          // No pending orders — wait interval and check again (NEVER stop)
          state.status = "waiting";
          state.currentKdi = null;
          state.currentSteps = [];
          const nextTime = new Date(
            Date.now() + state.batchInterval * 60 * 1000
          );
          state.nextRunAt = nextTime.toISOString();

          syncActivity({
            status: "waiting",
            current_kdi: null,
            next_run_at: nextTime.toISOString(),
            total_orders: freshOrders.length,
          });

          await new Promise<void>((resolve) => {
            g.__batchTimer = setTimeout(() => {
              state.nextRunAt = null;
              resolve();
            }, state.batchInterval * 60 * 1000);
          });

          if (g.__batchAbort) break;
          continue;
        }

        // 3. Take the first unprocessed order
        const order = remaining[0];
        const orderIdx = freshOrders.findIndex((o) => o.kdi === order.kdi);
        state.status = "running";
        state.currentKdi = order.kdi;
        state.currentOrderIndex = orderIdx;
        state.currentSteps = [];
        state.nextRunAt = null;

        syncActivity({
          status: "running",
          current_kdi: order.kdi,
          current_order_index: orderIdx,
          total_orders: freshOrders.length,
        });

        // 4. Run simulation (opens browser, processes, closes browser)
        const simStartTime = Date.now();
        const res = await runSimulation(order.kdi, state.batchStepDelay);
        if (g.__batchAbort) break;

        // 5. Normalize resultado: anything NOT APROVADO → REPROVADO
        const normalizedResultado =
          res.resultado === "APROVADO" ? "APROVADO" : "REPROVADO";
        const statusUpdatedTo =
          normalizedResultado === "APROVADO"
            ? "analysis_approved"
            : "analysis_rejected";

        // 6. Update order status in database
        await updateOrderStatus(order.kdi, normalizedResultado);

        // 7. Save detailed log
        await saveLog({
          kdi: order.kdi,
          customer_name: order.customerName,
          cpf_cnpj: order.cpfCnpj,
          mode: "batch",
          status_before: state.batchStatusFilter,
          resultado: normalizedResultado,
          resultado_detail:
            res.detail ||
            (res.resultado === "ERRO"
              ? `Erro: ${res.detail}`
              : res.resultado === "INDEFINIDO"
                ? "Resultado indeterminado"
                : res.detail),
          parcelas: res.parcelas || null,
          steps_log: res.stepsLog || null,
          error_message:
            res.resultado === "ERRO" || res.resultado === "INDEFINIDO"
              ? res.detail || res.resultado
              : null,
          duration_ms: Date.now() - simStartTime,
          batch_date: state.batchDate,
          batch_status_filter: state.batchStatusFilter,
          status_updated_to: statusUpdatedTo,
          system_power: order.systemPower,
          equipment_value: order.equipmentValue,
          labor_value: order.laborValue,
          monthly_bill_value: order.monthlyBillValue,
        });

        // 8. Record result
        const resultEntry: BatchResult = {
          kdi: order.kdi,
          customerName: order.customerName,
          resultado: normalizedResultado as "APROVADO" | "REPROVADO",
          detail:
            res.detail ||
            (res.resultado !== "APROVADO"
              ? `Original: ${res.resultado}`
              : ""),
        };

        state.results = [
          ...state.results.filter((r) => r.kdi !== order.kdi),
          resultEntry,
        ];
        processedKdis.add(order.kdi);
        orderIndex++;
        state.processedCount = orderIndex;

        syncActivity({
          processed_count: orderIndex,
          results: state.results,
        });

        if (g.__batchAbort) break;

        // 9. Wait interval before next order
        state.status = "waiting";
        state.currentKdi = null;
        state.currentSteps = [];
        const nextTime = new Date(
          Date.now() + state.batchInterval * 60 * 1000
        );
        state.nextRunAt = nextTime.toISOString();

        syncActivity({
          status: "waiting",
          current_kdi: null,
          next_run_at: nextTime.toISOString(),
        });

        await new Promise<void>((resolve) => {
          g.__batchTimer = setTimeout(() => {
            state.nextRunAt = null;
            resolve();
          }, state.batchInterval * 60 * 1000);
        });

        if (g.__batchAbort) break;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[BatchManager] Error in batch loop:", message);
        state.error = message || "Erro desconhecido";
        // Don't stop — wait 30s and retry
        console.log("[BatchManager] Retrying in 30 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 30_000));
        if (g.__batchAbort) break;
      }
    }
  } finally {
    clearInterval(heartbeatInterval);
    state.status = "stopped";
    state.currentKdi = null;
    state.currentSteps = [];
    state.nextRunAt = null;
    g.__batchRunning = false;

    syncActivity({
      status: "stopped",
      current_kdi: null,
      next_run_at: null,
    });

    console.log(
      `[BatchManager] Batch stopped. Processed: ${state.processedCount}, Approved: ${state.results.filter((r) => r.resultado === "APROVADO").length}, Rejected: ${state.results.filter((r) => r.resultado === "REPROVADO").length}`
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════
 * Public API
 * ═══════════════════════════════════════════════════════════════════ */

export function startBatch(params: {
  startedBy: string;
  batchDate: string;
  batchStatusFilter: string;
  batchStepDelay: number;
  batchInterval: number;
  totalOrders: number;
}): { success: boolean; error?: string } {
  if (isRunning()) {
    const state = getState();
    return {
      success: false,
      error: `Já existe uma integração em andamento (iniciada por ${state.startedBy})`,
    };
  }

  const state = getState();
  Object.assign(state, {
    ...DEFAULT_STATE,
    status: "running" as const,
    startedBy: params.startedBy,
    batchDate: params.batchDate,
    batchStatusFilter: params.batchStatusFilter,
    batchStepDelay: params.batchStepDelay,
    batchInterval: params.batchInterval,
    totalOrders: params.totalOrders,
    startedAt: new Date().toISOString(),
  });

  g.__batchAbort = false;
  g.__batchRunning = true;

  // Sync initial state to activity table
  syncActivity({
    status: "running",
    started_by: params.startedBy,
    started_at: new Date().toISOString(),
    batch_date: params.batchDate,
    batch_status_filter: params.batchStatusFilter,
    batch_step_delay: params.batchStepDelay,
    batch_interval: params.batchInterval,
    total_orders: params.totalOrders,
    current_kdi: null,
    current_order_index: 0,
    processed_count: 0,
    next_run_at: null,
    results: [],
    batch_steps: [],
    error_message: null,
  });

  // Start loop asynchronously — fire and forget
  console.log(
    `[BatchManager] Starting batch: date=${params.batchDate}, status=${params.batchStatusFilter}, by=${params.startedBy}`
  );

  runBatchLoop().catch((err) => {
    console.error("[BatchManager] Fatal error:", err);
    state.status = "stopped";
    state.error = err.message;
    g.__batchRunning = false;
  });

  return { success: true };
}

export function stopBatch(): { success: boolean } {
  console.log("[BatchManager] Stopping batch...");

  g.__batchAbort = true;
  g.__batchRunning = false;

  if (g.__batchTimer) {
    clearTimeout(g.__batchTimer);
    g.__batchTimer = null;
  }

  const state = getState();
  state.status = "stopped";
  state.currentKdi = null;
  state.currentSteps = [];
  state.nextRunAt = null;

  syncActivity({
    status: "stopped",
    current_kdi: null,
    next_run_at: null,
    error_message: "Parado pelo usuário",
  });

  return { success: true };
}

export function getBatchStatus(): BatchState & { running: boolean } {
  return { ...getState(), running: isRunning() };
}

export function resetBatch(): { success: boolean } {
  if (isRunning()) return { success: false };

  g.__batchState = { ...DEFAULT_STATE };

  syncActivity({
    status: "idle",
    results: [],
    processed_count: 0,
    total_orders: 0,
    current_kdi: null,
    next_run_at: null,
    error_message: null,
  });

  return { success: true };
}
