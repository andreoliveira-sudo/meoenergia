import { getCurrentUser } from "@/actions/auth"
import { MyAccountForm } from "@/components/forms/my-account-form"

export default async function MyAccountPage() {
	// Buscamos os dados do usuário no servidor para garantir que estão corretos
	const user = await getCurrentUser()

	if (!user || !user.role) {
		// Adicionar um tratamento caso o usuário ou a role não sejam encontrados
		return (
			<div className="flex flex-col gap-8">
				<h1 className="text-3xl font-bold tracking-tight text-destructive">Erro</h1>
				<p className="text-muted-foreground">Não foi possível carregar os dados da sua conta. Por favor, tente novamente mais tarde.</p>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="space-y-1.5">
				<h1 className="text-3xl font-bold tracking-tight">Minha Conta</h1>
				<p className="text-muted-foreground">Gerencie suas informações pessoais e de segurança.</p>
			</div>
			{/* Passamos o objeto de usuário completo para o formulário do lado do cliente */}
			<MyAccountForm user={{ name: user.name || "", email: user.email || "", role: user.role }} />
		</div>
	)
}
