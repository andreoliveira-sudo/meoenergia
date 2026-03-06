import { getApiDocs } from "@/lib/swagger"
import SwaggerClient from "@/components/swagger-client"

export default async function ApiDocsPage() {
    const spec = await getApiDocs()

    return <SwaggerClient spec={spec} />
}
