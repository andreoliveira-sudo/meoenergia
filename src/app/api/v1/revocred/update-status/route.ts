import { createClient } from "@supabase/supabase-js";
import { fireWebhookByKdi } from "@/lib/webhook-sender";

export async function POST(request: Request) {
  const body = await request.json();
  const { kdi, resultado } = body as { kdi?: string; resultado?: string };

  if (!kdi || !resultado) {
    return Response.json({ error: "kdi and resultado are required" }, { status: 400 });
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ error: "Supabase credentials not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Map resultado to order status
  // APROVADO → approved; REPROVADO → rejected.
  // Qualquer outro (ERRO, INDEFINIDO, ERRO_VALIDACAO...) é falha do robô:
  // NÃO altera o status (o pedido continua em Ag. Análise).
  let newStatus: string;
  if (resultado === "APROVADO") {
    newStatus = "analysis_approved";
  } else if (resultado === "REPROVADO") {
    newStatus = "analysis_rejected";
  } else {
    return Response.json({
      updated: false,
      kdi,
      reason: `Resultado "${resultado}" não é final; status mantido`,
    });
  }

  const { error } = await (supabase
    .from("orders") as unknown as { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> } })
    .update({ status: newStatus })
    .eq("kdi", kdi);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Disparar webhook para o parceiro (fire-and-forget)
  fireWebhookByKdi(kdi, newStatus).catch((err) =>
    console.error(`[update-status] Erro webhook KDI ${kdi}:`, err)
  );

  return Response.json({ updated: true, kdi, newStatus });
}
