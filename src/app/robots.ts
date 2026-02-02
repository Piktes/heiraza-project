import { headers } from "next/headers";
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    // HARDCODED fallback - LiteSpeed sends duplicate headers
    let baseUrl = "https://heiraza.com";

    try {
        const headersList = headers();
        const host = (headersList.get("host") || "").split(',')[0].trim() || "heiraza.com";
        const proto = (headersList.get("x-forwarded-proto") || "").split(',')[0].trim() || "https";
        baseUrl = `${proto}://${host}`;
    } catch (e) {
        console.error("[Robots] Header parsing failed, using fallback");
    }

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/admin", "/api/"],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
