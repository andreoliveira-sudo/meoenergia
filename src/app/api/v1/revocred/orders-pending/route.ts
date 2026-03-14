import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // YYYY-MM-DD
  const status = searchParams.get("status") || "analysis_pending";

  if (!date) {
    return Response.json({ error: "date is required (YYYY-MM-DD)" }, { status: 400 });
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

  const dateFrom = `${date}T00:00:00.000Z`;
  const dateTo = `${date}T23:59:59.999Z`;

  const { data: orders, error } = await supabase
    .from("orders")
    .select("kdi, status, created_at, system_power, equipment_value, labor_value, monthly_bill_value, customers(name, cpf, cnpj)")
    .eq("status", status)
    .is("deleted_at", null)
    .gte("created_at", dateFrom)
    .lte("created_at", dateTo)
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const result = (orders || []).map((o) => {
    const customer = o.customers as unknown as Record<string, unknown> | null;
    return {
      kdi: o.kdi,
      customerName: (customer?.name as string) || "—",
      cpfCnpj: (customer?.cpf as string) || (customer?.cnpj as string) || "—",
      systemPower: o.system_power,
      equipmentValue: o.equipment_value,
      laborValue: o.labor_value,
      monthlyBillValue: o.monthly_bill_value,
      createdAt: o.created_at,
    };
  });

  return Response.json({ orders: result, total: result.length });
}
