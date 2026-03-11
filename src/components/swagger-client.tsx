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
            <SwaggerUI 
                spec={spec}
                docExpansion="list"
                defaultModelsExpandDepth={1}
                defaultModelExpandDepth={1}
                displayRequestDuration={true}
                filter={true}
                tryItOutEnabled={true}
                persistAuthorization={true}
            />
            
            <style jsx global>{`
                .swagger-ui .topbar {
                    display: none;
                }

                .swagger-ui .info {
                    margin: 30px 0;
                }

                .swagger-ui .info .title {
                    font-size: 32px;
                    margin-bottom: 20px;
                }

                .swagger-ui .opblock {
                    border-radius: 6px;
                    margin-bottom: 15px;
                }
            `}</style>
        </div>
    )
}