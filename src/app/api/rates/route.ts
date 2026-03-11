import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") as "pf" | "pj" | null

  if (!type || !["pf", "pj"].includes(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()

    // Buscar TODAS as taxas do tipo selecionado
    const prefix = type // 'pf' ou 'pj'
    const { data: rates, error } = await supabase
      .from("rates")
      .select("id, value")
      .or(`id.like.${prefix}_%,id.eq.interest_rate,id.eq.service_fee`)

    if (error || !rates) {
      return NextResponse.json({ error: "Erro ao buscar taxas" }, { status: 500 })
    }

    // Transformar em objeto { id: value }
    const ratesMap: Record<string, number> = {}
    for (const r of rates) {
      ratesMap[r.id] = r.value
    }

    // Montar resposta estruturada para o simulador
    const gestaoPercent = ratesMap[`${prefix}_management_fee`] ?? (type === "pj" ? 4 : 8)
    const contratacaoPercent = ratesMap[`${prefix}_service_fee`] ?? 8

    // Montar prazos com taxas de juros do banco
    const prazosMeses = type === "pj" ? [24, 36, 48, 60] : [24, 30, 36, 48, 60, 72, 84, 96]
    const prazos = prazosMeses.map((meses) => {
      const interestKey = `${prefix}_interest_rate_${meses}`
      const taxaJuros = ratesMap[interestKey] ?? ratesMap["interest_rate"] ?? 2.6
      return { meses, taxaJuros: taxaJuros / 100 } // Converter de % para decimal
    })

    return NextResponse.json({
      gestaoPercent,
      contratacaoPercent,
      prazos,
    })
  } catch (e) {
    console.error("Erro na API de taxas:", e)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
