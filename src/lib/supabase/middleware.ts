import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request
	})

	const supabaseUrl = process.env.SUPABASE_URL
	const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

	if (!supabaseUrl || !supabaseServiceRoleKey) {
		throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable")
	}

	const supabase = createServerClient(supabaseUrl, supabaseServiceRoleKey, {
		cookies: {
			getAll() {
				return request.cookies.getAll()
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
				supabaseResponse = NextResponse.next({
					request
				})
				cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
			}
		}
	})

	// Do not run code between createServerClient and
	// supabase.auth.getUser(). A simple mistake could make it very hard to debug
	// issues with users being randomly logged out.

	// IMPORTANT: DO NOT REMOVE auth.getUser()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	const pathname = request.nextUrl.pathname

	// Rotas públicas (qualquer um pode acessar)
	const publicPaths = ["/", "/_next", "/favicon.ico", "/register-partner", "/api/auth"]

	// Rotas permitidas para partners pendentes/inativos
	const pendingAllowedPaths = ["/awaiting-approval", "/api/auth"]

	const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))
	const isPendingAllowed = pendingAllowedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))

	// Usuário logado tentando acessar a home → redireciona ao dashboard
	if (user && pathname === "/") {
		const url = request.nextUrl.clone()
		url.pathname = "/dashboard/home"
		return NextResponse.redirect(url)
	}

	// Usuário não logado tentando acessar rota protegida → redireciona ao login
	if (!user && !isPublic) {
		const url = request.nextUrl.clone()
		url.pathname = "/"
		return NextResponse.redirect(url)
	}

	// Se o usuário está logado e tentando acessar rota protegida, validar status do parceiro
	if (user && !isPublic && !isPendingAllowed) {
		try {
			// Buscar role do usuário
			const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

			if (userData?.role === "partner") {
				// Buscar status e is_active do parceiro
				const { data: partner } = await supabase.from("partners").select("status, is_active").eq("user_id", user.id).is("deleted_at", null).single()

				// Se parceiro não existe, não está aprovado, ou está inativo → bloquear acesso
				if (!partner || partner.status !== "approved" || !partner.is_active) {
					const url = request.nextUrl.clone()
					url.pathname = "/awaiting-approval"
					const redirectResponse = NextResponse.redirect(url)
					// Preservar cookies da sessão
					for (const cookie of supabaseResponse.cookies.getAll()) {
						redirectResponse.cookies.set(cookie.name, cookie.value)
					}
					return redirectResponse
				}
			}
		} catch (error) {
			// Em caso de erro na verificação, permitir acesso para não travar usuários legítimos
			console.error("[Middleware] Erro ao verificar status do parceiro:", error)
		}
	}

	// Parceiro pendente/inativo tentando acessar /awaiting-approval → permitir
	// Parceiro aprovado tentando acessar /awaiting-approval → redirecionar para dashboard
	if (user && pathname === "/awaiting-approval") {
		try {
			const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

			if (userData?.role === "partner") {
				const { data: partner } = await supabase.from("partners").select("status, is_active").eq("user_id", user.id).is("deleted_at", null).single()

				// Se parceiro aprovado e ativo tentando acessar awaiting-approval, redirecionar para dashboard
				if (partner?.status === "approved" && partner?.is_active) {
					const url = request.nextUrl.clone()
					url.pathname = "/dashboard/home"
					const redirectResponse = NextResponse.redirect(url)
					for (const cookie of supabaseResponse.cookies.getAll()) {
						redirectResponse.cookies.set(cookie.name, cookie.value)
					}
					return redirectResponse
				}
			} else if (userData?.role === "admin" || userData?.role === "staff" || userData?.role === "seller") {
				// Admins, staff e sellers não devem ver a página awaiting-approval
				const url = request.nextUrl.clone()
				url.pathname = "/dashboard/home"
				const redirectResponse = NextResponse.redirect(url)
				for (const cookie of supabaseResponse.cookies.getAll()) {
					redirectResponse.cookies.set(cookie.name, cookie.value)
				}
				return redirectResponse
			}
		} catch (error) {
			console.error("[Middleware] Erro ao verificar acesso ao awaiting-approval:", error)
		}
	}

	// IMPORTANT: You *must* return the supabaseResponse object as it is.
	// If you're creating a new response object with NextResponse.next() make sure to:
	// 1. Pass the request in it, like so:
	//    const myNewResponse = NextResponse.next({ request })
	// 2. Copy over the cookies, like so:
	//    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
	// 3. Change the myNewResponse object to fit your needs, but avoid changing
	//    the cookies!
	// 4. Finally:
	//    return myNewResponse
	// If this is not done, you may be causing the browser and server to go out
	// of sync and terminate the user's session prematurely!

	return supabaseResponse
}

export { updateSession }

