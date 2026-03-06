"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import "swagger-ui-react/swagger-ui.css"

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
    ssr: false,
    loading: () => (
        <div className="p-8 flex items-center gap-2">
            <Loader2 className="animate-spin" /> Carregando documentação...
        </div>
    ),
})

export default function SwaggerClient({ spec }: { spec: Record<string, any> }) {
    return (
        <div className="container mx-auto py-6 max-w-7xl bg-white dark:bg-zinc-900 min-h-screen">
            <div className="prose dark:prose-invert max-w-none">
                <SwaggerUI spec={spec} />
            </div>
        </div>
    )
}
