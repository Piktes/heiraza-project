import { headers } from "next/headers";
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const headersList = headers();
    const host = headersList.get("host")?.split(',')[0].trim() || "heiraza.com";
    const proto = headersList.get("x-forwarded-proto")?.split(',')[0].trim() || "https";
    const baseUrl = `${proto}://${host}`;

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
        },
        {
            url: `${baseUrl}/#concerts`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/#about`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/#gallery`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/#shop`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/#contact`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.5,
        },
    ];
}
