"use client"

import { useSearchParams } from "next/navigation"

import { RegisterPartnerForm } from "@/components/forms/register-partner-form"
import { SignInForm } from "@/components/forms/sign-in-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const AuthFormTabs = () => {
	const searchParams = useSearchParams()
	const defaultTab = searchParams.get("view") === "register" ? "register" : "signin"

	return (
		<Tabs defaultValue={defaultTab} className="w-full max-w-md mx-auto">
			<TabsList className="grid grid-cols-2 w-full h-12 rounded-xl bg-meo-navy/5 lg:bg-meo-navy/5 p-1">
				<TabsTrigger
					value="signin"
					className="rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-meo-navy data-[state=active]:shadow-md data-[state=inactive]:text-meo-gray-light lg:data-[state=inactive]:text-meo-gray"
				>
					Entrar
				</TabsTrigger>
				<TabsTrigger
					value="register"
					className="rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-meo-navy data-[state=active]:shadow-md data-[state=inactive]:text-meo-gray-light lg:data-[state=inactive]:text-meo-gray"
				>
					Cadastre-se
				</TabsTrigger>
			</TabsList>

			<TabsContent value="signin" className="mt-4">
				<div className="meo-glass rounded-2xl shadow-xl lg:shadow-lg overflow-hidden">
					<SignInForm />
				</div>
			</TabsContent>

			<TabsContent value="register" className="mt-4">
				<div className="meo-glass rounded-2xl shadow-xl lg:shadow-lg overflow-hidden">
					<RegisterPartnerForm />
				</div>
			</TabsContent>
		</Tabs>
	)
}

export { AuthFormTabs }
