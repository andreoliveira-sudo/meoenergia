import { getApiDocs } from "@/lib/swagger"
import SwaggerClient from "@/components/swagger-client"

export default async function AdminApiDocsPage() {
    const spec = await getApiDocs()

    return <SwaggerClient spec={spec} />
}
