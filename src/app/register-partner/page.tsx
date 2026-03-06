import Image from "next/image"

import { RegisterPartnerForm } from "@/components/forms/register-partner-form"

const RegisterPage = () => (
	<div className="bg-gradient-to-br from-background to-primary/20 flex min-h-svh flex-col items-center  p-6 md:p-10">
		<div className="w-full max-w-sm md:max-w-md">
			<Image src="/logo.png" alt="MEO Leasing" width={300} height={200} className="w-full" />
			<RegisterPartnerForm />
			<div className="text-muted-foreground *:[a]:hover:text-primary mt-6 text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
				Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
			</div>
		</div>
	</div>
)

export default RegisterPage
