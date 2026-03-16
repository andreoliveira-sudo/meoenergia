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
  // APROVADO → approved; anything else (REPROVADO, INDEFINIDO, ERRO) → rejected
  let newStatus: string;
  if (resultado === "APROVADO") {
    newStatus = "analysis_approved";
  } else {
    newStatus = "analysis_rejected";
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
