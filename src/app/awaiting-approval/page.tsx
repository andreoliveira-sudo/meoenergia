import { Clock, LogOut, Mail, ShieldX, Lock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { signOut } from "@/actions/auth"
import { getCurrentPartnerDetails } from "@/actions/partners"
import { Button } from "@/components/ui/button"

const statusConfig = {
	pending: {
		title: "Cadastro em Análise",
		description: "Seu cadastro está sendo analisado pela nossa equipe. Assim que a análise for concluída, você receberá uma notificação e poderá acessar o sistema normalmente.",
		icon: Clock,
		iconBg: "bg-amber-100",
		iconColor: "text-amber-600",
		borderColor: "border-l-amber-500",
		badgeText: "Em análise",
		badgeBg: "bg-amber-50 text-amber-700 border-amber-200"
	},
	rejected: {
		title: "Cadastro Não Aprovado",
		description: "Infelizmente seu cadastro não foi aprovado pela nossa equipe. Caso tenha dúvidas sobre o motivo, entre em contato com o suporte para obter mais informações.",
		icon: ShieldX,
		iconBg: "bg-red-100",
		iconColor: "text-red-600",
		borderColor: "border-l-red-500",
		badgeText: "Rejeitado",
		badgeBg: "bg-red-50 text-red-700 border-red-200"
	},
	inactive: {
		title: "Conta Desativada",
		description: "Sua conta foi temporariamente desativada por um administrador. Para reativar seu acesso, entre em contato com o suporte da MEO Energia.",
		icon: Lock,
		iconBg: "bg-gray-100",
		iconColor: "text-gray-600",
		borderColor: "border-l-gray-400",
		badgeText: "Desativado",
		badgeBg: "bg-gray-50 text-gray-600 border-gray-200"
	}
}

export const AwaitingApprovalPage = async () => {
	const partnerDetails = await getCurrentPartnerDetails()

	// Determinar qual mensagem exibir
	let statusKey: "pending" | "rejected" | "inactive" = "pending"

	if (partnerDetails) {
		if (partnerDetails.status === "rejected") {
			statusKey = "rejected"
		} else if (partnerDetails.status === "approved" && !partnerDetails.isActive) {
			statusKey = "inactive"
		}
	}

	const config = statusConfig[statusKey]
	const StatusIcon = config.icon

	const handleLogout = async () => {
		"use server"
		await signOut()
	}

	return (
		<div className="relative flex min-h-svh">
			{/* Lado Esquerdo - Branding (mesmo padrão da tela de login) */}
			<div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden meo-login-gradient">
				{/* Orbs decorativos animados */}
				<div className="absolute inset-0 overflow-hidden">
					<div className="meo-orb-1 absolute -top-20 -left-20 w-72 h-72 rounded-full bg-meo-blue/20 blur-3xl" />
					<div className="meo-orb-2 absolute top-1/3 right-10 w-96 h-96 rounded-full bg-meo-green/15 blur-3xl" />
					<div className="meo-orb-3 absolute bottom-10 left-1/4 w-80 h-80 rounded-full bg-meo-cyan/10 blur-3xl" />
					{/* Grid pattern overlay */}
					<div
						className="absolute inset-0 opacity-[0.03]"
						style={{
							backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
							backgroundSize: "40px 40px"
						}}
					/>
				</div>

				<div className="relative z-10 text-center px-12">
					<div className="mb-8 flex justify-center">
						<Image
							src="/logo-azul-branco.png"
							alt="MEO Energia"
							width={200}
							height={100}
							className="drop-shadow-lg"
							priority
						/>
					</div>
					<h2 className="text-3xl font-bold text-white mb-4">
						Sistema de Gestão
					</h2>
					<p className="text-meo-gray-light text-lg max-w-md mx-auto">
						Gerencie seus pedidos, simulações e clientes de forma simples e eficiente.
					</p>
				</div>
			</div>

			{/* Lado Direito - Conteúdo */}
			<div className="flex flex-1 items-center justify-center bg-gradient-to-b from-white to-gray-50/80 p-6 md:p-10">
				<div className="w-full max-w-md">
					{/* Logo mobile */}
					<div className="lg:hidden flex justify-center mb-8">
						<Image
							src="/logo-azul-branco.png"
							alt="MEO Energia"
							width={160}
							height={80}
							priority
						/>
					</div>

					{/* Card principal */}
					<div className={`bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden border-l-4 ${config.borderColor}`}>
						<div className="p-8">
							{/* Ícone e Badge */}
							<div className="flex flex-col items-center mb-6">
								<div className={`w-16 h-16 rounded-2xl ${config.iconBg} flex items-center justify-center mb-4 shadow-sm`}>
									<StatusIcon className={`w-8 h-8 ${config.iconColor}`} />
								</div>
								<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.badgeBg}`}>
									{config.badgeText}
								</span>
							</div>

							{/* Título e Descrição */}
							<div className="text-center mb-8">
								<h1 className="text-2xl font-bold text-meo-navy mb-3">
									{config.title}
								</h1>
								<p className="text-sm text-meo-gray-light leading-relaxed">
									{config.description}
								</p>
							</div>

							{/* Info box */}
							{statusKey === "pending" && (
								<div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6">
									<div className="flex gap-3">
										<Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
										<div>
											<p className="text-sm font-medium text-amber-800">Tempo de análise</p>
											<p className="text-xs text-amber-600 mt-0.5">
												O processo de análise geralmente leva até 48 horas úteis. Agradecemos sua paciência.
											</p>
										</div>
									</div>
								</div>
							)}

							{statusKey === "rejected" && (
								<div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-6">
									<div className="flex gap-3">
										<ShieldX className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
										<div>
											<p className="text-sm font-medium text-red-800">O que fazer?</p>
											<p className="text-xs text-red-600 mt-0.5">
												Entre em contato com o suporte para entender o motivo e verificar se é possível realizar um novo cadastro.
											</p>
										</div>
									</div>
								</div>
							)}

							{statusKey === "inactive" && (
								<div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-6">
									<div className="flex gap-3">
										<Lock className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
										<div>
											<p className="text-sm font-medium text-gray-800">Conta suspensa</p>
											<p className="text-xs text-gray-600 mt-0.5">
												Sua conta foi desativada temporariamente. Entre em contato com o suporte para solicitar a reativação.
											</p>
										</div>
									</div>
								</div>
							)}

							{/* Botões */}
							<div className="space-y-3">
								<form action={handleLogout}>
									<Button
										type="submit"
										variant="outline"
										className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50 text-sm font-medium"
									>
										<LogOut className="w-4 h-4 mr-2" />
										Sair da Conta
									</Button>
								</form>

								<Link
									href="mailto:suporte@meoenergia.com.br"
									className="flex items-center justify-center gap-2 w-full h-12 rounded-xl text-sm font-medium text-meo-blue hover:bg-meo-blue/5 transition-colors"
								>
									<Mail className="w-4 h-4" />
									Contatar Suporte
								</Link>
							</div>
						</div>
					</div>

					{/* Footer */}
					<p className="text-center text-xs text-muted-foreground mt-6">
						MEO Energia &copy; {new Date().getFullYear()} &mdash; Todos os direitos reservados
					</p>
				</div>
			</div>
		</div>
	)
}

export default AwaitingApprovalPage
