import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { Zap, Shield, TrendingUp, Sun } from "lucide-react"

import { AuthFormTabs } from "@/components/auth-form-tabs"

const HomePage = () => {
	return (
		<div className="relative flex min-h-svh">
			{/* ==========================================
			    LADO ESQUERDO - Hero/Branding (desktop only)
			    ========================================== */}
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

				{/* Conteúdo do hero */}
				<div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
					{/* Logo e marca */}
					<div className="meo-slide-up">
						<Image
							src="/logo-azul-branco.png"
							alt="MEO Energia"
							width={180}
							height={90}
							className="drop-shadow-lg"
							priority
						/>
					</div>

					{/* Mensagem principal */}
					<div className="flex-1 flex flex-col justify-center max-w-lg">
						<div className="meo-slide-up-delay-1">
							<div className="meo-divider w-16 mb-8" />
							<h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
								Energia solar ao
								<span className="block meo-shimmer">alcance de todos</span>
							</h1>
							<p className="text-lg text-white/70 leading-relaxed mb-10">
								Plataforma completa de gestão para financiamento
								de energia solar. Simples, segura e eficiente.
							</p>
						</div>

						{/* Feature cards */}
						<div className="grid grid-cols-2 gap-4 meo-slide-up-delay-2">
							<div className="meo-feature-card meo-glass-dark rounded-xl p-4">
								<div className="flex items-center gap-3 mb-2">
									<div className="w-9 h-9 rounded-lg bg-meo-blue/20 flex items-center justify-center">
										<Zap className="w-5 h-5 text-meo-blue-light" />
									</div>
									<span className="text-sm font-semibold text-white">Rápido</span>
								</div>
								<p className="text-xs text-white/50">Aprovação em minutos</p>
							</div>

							<div className="meo-feature-card meo-glass-dark rounded-xl p-4">
								<div className="flex items-center gap-3 mb-2">
									<div className="w-9 h-9 rounded-lg bg-meo-green/20 flex items-center justify-center">
										<Shield className="w-5 h-5 text-meo-green-light" />
									</div>
									<span className="text-sm font-semibold text-white">Seguro</span>
								</div>
								<p className="text-xs text-white/50">Dados protegidos</p>
							</div>

							<div className="meo-feature-card meo-glass-dark rounded-xl p-4">
								<div className="flex items-center gap-3 mb-2">
									<div className="w-9 h-9 rounded-lg bg-meo-cyan/20 flex items-center justify-center">
										<TrendingUp className="w-5 h-5 text-meo-cyan" />
									</div>
									<span className="text-sm font-semibold text-white">Eficiente</span>
								</div>
								<p className="text-xs text-white/50">Gestão simplificada</p>
							</div>

							<div className="meo-feature-card meo-glass-dark rounded-xl p-4">
								<div className="flex items-center gap-3 mb-2">
									<div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
										<Sun className="w-5 h-5 text-amber-400" />
									</div>
									<span className="text-sm font-semibold text-white">Sustentável</span>
								</div>
								<p className="text-xs text-white/50">Energia limpa</p>
							</div>
						</div>
					</div>

					{/* Footer do hero */}
					<div className="meo-slide-up-delay-3">
						<div className="flex items-center gap-3 text-white/30 text-sm">
							<div className="w-2 h-2 rounded-full bg-meo-green meo-pulse" />
							<span>Sistema operacional</span>
						</div>
					</div>
				</div>
			</div>

			{/* ==========================================
			    LADO DIREITO - Formulário de Login
			    ========================================== */}
			<div className="flex-1 flex flex-col relative">
				{/* Background para mobile - gradient ao invés de imagem */}
				<div className="absolute inset-0 lg:hidden meo-login-gradient">
					<div className="meo-orb-1 absolute -top-20 -right-20 w-72 h-72 rounded-full bg-meo-blue/20 blur-3xl" />
					<div className="meo-orb-2 absolute bottom-1/4 -left-10 w-64 h-64 rounded-full bg-meo-green/15 blur-3xl" />
				</div>

				{/* Container do formulário */}
				<div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 md:p-10">
					{/* Logo mobile */}
					<div className="lg:hidden mb-8 meo-slide-up">
						<Image
							src="/logo-azul-branco.png"
							alt="MEO Energia"
							width={220}
							height={110}
							className="drop-shadow-lg"
							priority
						/>
					</div>

					{/* Título desktop */}
					<div className="hidden lg:block text-center mb-8 meo-slide-up">
						<h2 className="text-2xl font-bold text-meo-navy mb-2">
							Bem-vindo ao MEO
						</h2>
						<p className="text-meo-gray-light text-sm">
							Acesse sua conta ou cadastre-se como parceiro
						</p>
						<div className="meo-divider w-12 mx-auto mt-4" />
					</div>

					{/* Card do formulário */}
					<div className="w-full max-w-md meo-slide-up-delay-1">
						<Suspense
							fallback={
								<div className="w-full h-[400px] bg-white/10 animate-pulse rounded-2xl" />
							}
						>
							<AuthFormTabs />
						</Suspense>
					</div>

					{/* Termos */}
					<div className="mt-8 text-center text-xs text-balance meo-slide-up-delay-2 max-w-md">
						<p className="text-meo-gray-light lg:text-meo-gray">
							Ao continuar, você concorda com nossos{" "}
							<Link
								href="#"
								className="text-meo-blue hover:text-meo-blue-light underline underline-offset-4 transition-colors"
							>
								Termos de Serviço
							</Link>{" "}
							e{" "}
							<Link
								href="#"
								className="text-meo-blue hover:text-meo-blue-light underline underline-offset-4 transition-colors"
							>
								Política de Privacidade
							</Link>
							.
						</p>
					</div>
				</div>

				{/* Footer desktop */}
				<div className="hidden lg:flex items-center justify-center p-6 text-xs text-meo-gray-light">
					<span>&copy; {new Date().getFullYear()} MEO Energia. Todos os direitos reservados.</span>
				</div>
			</div>
		</div>
	)
}

export default HomePage
