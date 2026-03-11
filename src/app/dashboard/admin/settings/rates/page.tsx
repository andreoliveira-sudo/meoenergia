import { RateForm } from "@/components/forms/rate-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const RatesPage = () => {
	return (
		<div className="flex flex-col gap-8">
			<div className="space-y-1.5">
				<h1 className="text-3xl font-bold tracking-tight">Taxas e Parâmetros</h1>
				<p className="text-muted-foreground">Ajuste os parâmetros globais que afetam os cálculos e simulações.</p>
			</div>

			<Tabs defaultValue="pj" className="w-full">
				<TabsList className="grid w-full max-w-md grid-cols-2">
					<TabsTrigger value="pj">Pessoa Jurídica (PJ)</TabsTrigger>
					<TabsTrigger value="pf">Pessoa Física (PF)</TabsTrigger>
				</TabsList>

				{/* PJ */}
				<TabsContent value="pj">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
						<Card>
							<CardHeader>
								<CardTitle>Taxas Gerais - PJ</CardTitle>
								<CardDescription>Taxas aplicadas sobre o investimento.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<RateForm rateId="pj_management_fee" label="Taxa de Gestão" />
								<RateForm rateId="pj_service_fee" label="Taxa de Serviços" />
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Taxa de Juros - PJ</CardTitle>
								<CardDescription>Taxas de juros mensais por prazo.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<RateForm rateId="pj_interest_rate_24" label="24 meses" />
								<RateForm rateId="pj_interest_rate_36" label="36 meses" />
								<RateForm rateId="pj_interest_rate_48" label="48 meses" />
								<RateForm rateId="pj_interest_rate_60" label="60 meses" />
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Taxa de Serviços - PJ</CardTitle>
								<CardDescription>Taxas de serviços por prazo.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<RateForm rateId="pj_service_fee_24" label="24 meses" />
								<RateForm rateId="pj_service_fee_36" label="36 meses" />
								<RateForm rateId="pj_service_fee_48" label="48 meses" />
								<RateForm rateId="pj_service_fee_60" label="60 meses" />
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* PF */}
				<TabsContent value="pf">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
						<Card>
							<CardHeader>
								<CardTitle>Taxas Gerais - PF</CardTitle>
								<CardDescription>Taxas aplicadas sobre o investimento.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<RateForm rateId="pf_management_fee" label="Taxa de Gestão" />
								<RateForm rateId="pf_service_fee" label="Taxa de Serviços" />
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Taxa de Juros - PF</CardTitle>
								<CardDescription>Taxas de juros mensais por prazo.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<RateForm rateId="pf_interest_rate_24" label="24 meses" />
								<RateForm rateId="pf_interest_rate_30" label="30 meses" />
								<RateForm rateId="pf_interest_rate_36" label="36 meses" />
								<RateForm rateId="pf_interest_rate_48" label="48 meses" />
								<RateForm rateId="pf_interest_rate_60" label="60 meses" />
								<RateForm rateId="pf_interest_rate_72" label="72 meses" />
								<RateForm rateId="pf_interest_rate_84" label="84 meses" />
								<RateForm rateId="pf_interest_rate_96" label="96 meses" />
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Taxa de Serviços - PF</CardTitle>
								<CardDescription>Taxas de serviços por prazo.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<RateForm rateId="pf_service_fee_24" label="24 meses" />
								<RateForm rateId="pf_service_fee_30" label="30 meses" />
								<RateForm rateId="pf_service_fee_36" label="36 meses" />
								<RateForm rateId="pf_service_fee_48" label="48 meses" />
								<RateForm rateId="pf_service_fee_60" label="60 meses" />
								<RateForm rateId="pf_service_fee_72" label="72 meses" />
								<RateForm rateId="pf_service_fee_84" label="84 meses" />
								<RateForm rateId="pf_service_fee_96" label="96 meses" />
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	)
}

export default RatesPage
