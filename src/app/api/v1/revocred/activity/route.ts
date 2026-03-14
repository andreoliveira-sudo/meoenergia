import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * GET /api/v1/revocred/activity
 * Returns current activity state (singleton row)
 */
export async function GET() {
  const supabase = getSupabase();
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });

  const { data, error } = await (supabase.from("revocred_activity") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Check heartbeat — if running but no heartbeat for 60 seconds, mark as stopped
  if (data && (data.status === "running" || data.status === "waiting")) {
    const lastHeartbeat = data.last_heartbeat ? new Date(data.last_heartbeat as string).getTime() : 0;
    const now = Date.now();
    if (now - lastHeartbeat > 60_000) {
      // Activity died — mark as stopped
      await (supabase.from("revocred_activity") as ReturnType<typeof supabase.from>)
        .update({
          status: "stopped",
          error_message: "Atividade interrompida (sem heartbeat)",
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq("id", 1);

      data.status = "stopped";
      data.error_message = "Atividade interrompida (sem heartbeat)";
    }
  }

  return Response.json({ activity: data });
}

/**
 * POST /api/v1/revocred/activity
 * Actions: start, update, heartbeat, stop, reset
 */
export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });

  const body = await request.json();
  const { action } = body as { action: string };

  if (action === "start") {
    // Check if already running
    const { data: current } = await (supabase.from("revocred_activity") as ReturnType<typeof supabase.from>)
      .select("status, last_heartbeat")
      .eq("id", 1)
      .single();

    if (current && (current.status === "running" || current.status === "waiting")) {
      // Check heartbeat to see if it's really alive
      const lastHb = current.last_heartbeat ? new Date(current.last_heartbeat as string).getTime() : 0;
      if (Date.now() - lastHb < 60_000) {
        return Response.json({
          error: "Já existe uma atividade em andamento. Apenas uma integração pode rodar por vez.",
          locked: true,
        }, { status: 409 });
      }
      // Dead activity — allow overriding
    }

    const {
      started_by, batch_date, batch_status_filter,
      batch_step_delay, batch_interval, total_orders,
    } = body as Record<string, unknown>;

    const { error } = await (supabase.from("revocred_activity") as ReturnType<typeof supabase.from>)
      .update({
        status: "running",
        started_by: started_by || null,
        started_at: new Date().toISOString(),
        batch_date: batch_date || null,
        batch_status_filter: batch_status_filter || null,
        batch_step_delay: batch_step_delay || 3,
        batch_interval: batch_interval || 5,
        current_kdi: null,
        current_order_index: 0,
        total_orders: total_orders || 0,
        processed_count: 0,
        next_run_at: null,
        results: [],
        batch_steps: [],
        error_message: null,
        last_heartbeat: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", 1);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  }

  if (action === "update") {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      last_heartbeat: new Date().toISOString(),
    };

    // Copy allowed fields
    const allowedFields = [
      "status", "current_kdi", "current_order_index", "total_orders",
      "processed_count", "next_run_at", "results", "batch_steps", "error_message",
    ];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { error } = await (supabase.from("revocred_activity") as ReturnType<typeof supabase.from>)
      .update(updateData)
      .eq("id", 1);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  }

  if (action === "heartbeat") {
    const { error } = await (supabase.from("revocred_activity") as ReturnType<typeof supabase.from>)
      .update({
        last_heartbeat: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", 1);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  }

  if (action === "stop" || action === "reset") {
    const { error } = await (supabase.from("revocred_activity") as ReturnType<typeof supabase.from>)
      .update({
        status: action === "reset" ? "idle" : "stopped",
        current_kdi: null,
        current_order_index: 0,
        next_run_at: null,
        batch_steps: [],
        error_message: action === "stop" ? "Parado pelo usuário" : null,
        last_heartbeat: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(action === "reset" ? { results: [], processed_count: 0, total_orders: 0 } : {}),
      } as Record<string, unknown>)
      .eq("id", 1);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
