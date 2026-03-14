import { createClient } from "@supabase/supabase-js";

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

  const { data: order, error } = await supabase
    .from("orders")
    .select("kdi, status, system_power, equipment_value, labor_value, monthly_bill_value, customers(name, cpf, cnpj)")
    .eq("kdi", kdi)
    .single();

  if (error || !order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  const customer = order.customers as unknown as Record<string, unknown> | null;

  return Response.json({
    kdi: order.kdi,
    status: order.status,
    customerName: (customer?.name as string) || "—",
    cpfCnpj: (customer?.cpf as string) || (customer?.cnpj as string) || "—",
    systemPower: order.system_power,
    equipmentValue: order.equipment_value,
    laborValue: order.labor_value,
    monthlyBillValue: order.monthly_bill_value,
  });
}
