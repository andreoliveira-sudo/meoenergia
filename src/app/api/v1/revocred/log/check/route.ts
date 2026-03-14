import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/v1/revocred/log/check?kdis=1326,1336,1340
 * Returns which KDIs have at least one log entry in revocred_simulation_logs
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kdisParam = searchParams.get("kdis");

  if (!kdisParam) {
    return Response.json({ error: "kdis parameter is required (comma-separated)" }, { status: 400 });
  }

  const kdis = kdisParam.split(",").map((k) => k.trim()).filter(Boolean);

  if (kdis.length === 0) {
    return Response.json({ kdisWithLogs: [] });
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

  // Query distinct KDIs that have logs
  const { data, error } = await (supabase.from("revocred_simulation_logs") as ReturnType<typeof supabase.from>)
    .select("kdi")
    .in("kdi", kdis);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Extract unique KDIs
  const kdisWithLogs = [...new Set((data || []).map((row: { kdi: string }) => row.kdi))];

  return Response.json({ kdisWithLogs });
}
