import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"

import { AuthFormTabs } from "@/components/auth-form-tabs"

const HomePage = () => {
	return (
		<div className="relative  flex min-h-svh flex-col items-center p-6 md:p-10">
			{/* Imagem de fundo ocupando a tela inteira */}
			<Image
				src="/banner-3.jpeg" // Substitua pelo caminho da sua imagem
				alt="Background"
				fill
				className="object-cover z-[-1]"
				priority // Opcional: carrega a imagem com prioridade
				quality={75} // Opcional: ajusta a qualidade da imagem
			/>

			{/* Conteúdo original */}
			<div className="w-full max-w-sm md:max-w-md relative z-10">
				<Image src="/logo-azul-branco.png" alt="MEO Leasing" width={300} height={150} className="mx-auto" />
				<Suspense fallback={<div className="w-full h-[400px] bg-white/10 animate-pulse rounded-lg" />}>
					<AuthFormTabs />
				</Suspense>
				<div className="text-white mt-6 text-center text-xs text-balance">
					<p>
						Ao continuar, você concorda com nossos{" "}
						<Link href="#" className="underline underline-offset-4 hover:text-primary">
							Termos de Serviço
						</Link>{" "}
						e{" "}
						<Link href="#" className="underline underline-offset-4 hover:text-primary">
							Política de Privacidade
						</Link>
						.
					</p>
				</div>
			</div>
		</div>
	)
}

export default HomePage
