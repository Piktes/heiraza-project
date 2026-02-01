import { headers } from "next/headers";
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const headersList = headers();
    const host = headersList.get("host")?.split(',')[0].trim() || "heiraza.com";
    const proto = headersList.get("x-forwarded-proto")?.split(',')[0].trim() || "https";
    const baseUrl = `${proto}://${host}`;

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
