import { createClient } from "@supabase/supabase-js";

interface LogEntry {
  kdi: string;
  customer_name?: string;
  cpf_cnpj?: string;
  mode: "manual" | "batch";
  status_before?: string;
  resultado: string;
  resultado_detail?: string;
  parcelas?: unknown[];
  steps_log?: unknown[];
  error_message?: string;
  duration_ms?: number;
  batch_date?: string;
  batch_status_filter?: string;
  status_updated_to?: string;
  system_power?: number;
  equipment_value?: number;
  labor_value?: number;
  monthly_bill_value?: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kdi = searchParams.get("kdi");

  if (!kdi) {
    return Response.json({ error: "kdi is required" }, { status: 400 });
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

  const { data, error } = await (supabase.from("revocred_simulation_logs") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("kdi", kdi)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 404 });
  }

  return Response.json({ log: data });
}

export async function POST(request: Request) {
  try {
    const body: LogEntry = await request.json();

    if (!body.kdi || !body.resultado) {
      return Response.json(
        { error: "kdi and resultado are required" },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { error: "Supabase credentials not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await (supabase.from("revocred_simulation_logs") as ReturnType<typeof supabase.from>)
      .insert({
        kdi: body.kdi,
        customer_name: body.customer_name || null,
        cpf_cnpj: body.cpf_cnpj || null,
        mode: body.mode,
        status_before: body.status_before || null,
        resultado: body.resultado,
        resultado_detail: body.resultado_detail || null,
        parcelas: body.parcelas || null,
        steps_log: body.steps_log || null,
        error_message: body.error_message || null,
        duration_ms: body.duration_ms || null,
        batch_date: body.batch_date || null,
        batch_status_filter: body.batch_status_filter || null,
        status_updated_to: body.status_updated_to || null,
        system_power: body.system_power || null,
        equipment_value: body.equipment_value || null,
        labor_value: body.labor_value || null,
        monthly_bill_value: body.monthly_bill_value || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting revocred log:", error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, id: data?.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error in revocred log route:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
