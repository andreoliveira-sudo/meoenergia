import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const PUBLIC_ROUTES = [
	/^\/simulacao($|\/)/, // /simulacao, /simulacao/resultado, etc (página pública - será criada por FRONT-06)
	/^\/api\/v1\/simulations($|\/)/, // API de simulações públicas
]

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname

	// Se é rota pública: pula updateSession, apenas passa adiante
	const isPublicRoute = PUBLIC_ROUTES.some(pattern => pattern.test(pathname))

	if (isPublicRoute) {
		return NextResponse.next()
	}

	return await updateSession(request)
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * Feel free to modify this pattern to include more paths.
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
	]
}
