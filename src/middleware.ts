import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const PUBLIC_ROUTES = [
	/^\/simulacao($|\/)/, // /simulacao, /simulacao/resultado, etc (página pública - será criada por FRONT-06)
	/^\/api\/v1\/simulations($|\/)/, // API de simulações públicas
	/^\/api\/v1\/orders($|\/)/, //  API de criação de pedidos (requer validação de API Key, mas é pública para clientes externos)
	/^\/api\/v1\// // Todas as outras APIs (requerem API Key)
]

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname

	// ─── CORS for RevoCred API routes (needed when Vercel PROD calls VM101 remote server) ───
	if (pathname.startsWith("/api/v1/revocred")) {
		// Handle preflight OPTIONS request
		if (request.method === "OPTIONS") {
			return new NextResponse(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization",
					"Access-Control-Max-Age": "86400",
				},
			})
		}

		// For actual requests, add CORS headers to response
		const isPublicRoute = PUBLIC_ROUTES.some(pattern => pattern.test(pathname))
		const response = isPublicRoute
			? NextResponse.next()
			: await updateSession(request)

		response.headers.set("Access-Control-Allow-Origin", "*")
		response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		return response
	}

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
