import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { normalizeCountry } from "@/lib/country-utils";

export async function GET(request: NextRequest) {
    const session = await getServerSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const period = searchParams.get("period") || "week"; // week, month, year
    const country = searchParams.get("country") || null; // Country filter
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const engagementFilter = searchParams.get("engagement") || "all"; // all, subscribers, messaged

    try {
        // Calculate date range based on period
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case "today":
                startDate.setHours(0, 0, 0, 0);
                break;
            case "year":
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case "month":
                startDate.setMonth(now.getMonth() - 1);
                break;
            case "week":
            default:
                startDate.setDate(now.getDate() - 7);
                break;
        }

        // Build additional filter clauses
        const countryFilter = country ? ` AND country = '${country.replace(/'/g, "''")}'` : "";
        let engagementClause = "";
        if (engagementFilter === "subscribers") {
            engagementClause = " AND isSubscriber = 1";
        } else if (engagementFilter === "messaged") {
            engagementClause = " AND hasMessaged = 1";
        }

        // Get visitors grouped by visitorHash with their engagement status
        const visitors = await prisma.$queryRawUnsafe<Array<{
            visitorHash: string;
            country: string | null;
            city: string | null;
            lastVisit: Date;
            visitCount: bigint;
            isSubscriber: number;
            hasMessaged: number;
        }>>(`
            SELECT 
                visitorHash,
                country,
                city,
                MAX(visitedAt) as lastVisit,
                COUNT(*) as visitCount,
                MAX(isSubscriber) as isSubscriber,
                MAX(hasMessaged) as hasMessaged
            FROM VisitorLog
            WHERE visitedAt >= ? ${countryFilter} ${engagementClause}
            GROUP BY visitorHash, country, city
            ORDER BY lastVisit DESC
            LIMIT ?
            OFFSET ?
        `, startDate, limit, (page - 1) * limit);

        // Get total unique visitors (with engagement filter)
        const totalResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
            SELECT COUNT(DISTINCT visitorHash) as count
            FROM VisitorLog
            WHERE visitedAt >= ? ${countryFilter} ${engagementClause}
        `, startDate);
        const totalUniqueVisitors = Number(totalResult[0].count);

        // Get total visits (for all, not filtered by engagement)
        const totalVisitsResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
            SELECT COUNT(*) as count
            FROM VisitorLog
            WHERE visitedAt >= ? ${countryFilter}
        `, startDate);
        const totalVisits = Number(totalVisitsResult[0].count);

        // Get subscribers count (from stored boolean)
        const subscribersResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
            SELECT COUNT(DISTINCT visitorHash) as count
            FROM VisitorLog
            WHERE visitedAt >= ? AND isSubscriber = 1 ${countryFilter}
        `, startDate);
        const subscribersCount = Number(subscribersResult[0].count);

        // Get messagers count (from stored boolean)
        const messagersResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
            SELECT COUNT(DISTINCT visitorHash) as count
            FROM VisitorLog
            WHERE visitedAt >= ? AND hasMessaged = 1 ${countryFilter}
        `, startDate);
        const messagersCount = Number(messagersResult[0].count);

        // Get top 3 countries by visitor count (apply engagement filter)
        let topCountriesQuery = `
            SELECT 
                country,
                COUNT(DISTINCT visitorHash) as visitorCount
            FROM VisitorLog
            WHERE visitedAt >= ? AND country IS NOT NULL ${engagementClause}
            GROUP BY country
            ORDER BY visitorCount DESC
            LIMIT 3
        `;
        const topCountriesRaw = await prisma.$queryRawUnsafe<Array<{
            country: string;
            visitorCount: bigint;
        }>>(topCountriesQuery, startDate);

        // Normalize and merge countries (e.g., Turkey + Türkiye = Türkiye)
        const countryMap = new Map<string, number>();
        for (const c of topCountriesRaw) {
            const normalized = normalizeCountry(c.country) || c.country;
            countryMap.set(normalized, (countryMap.get(normalized) || 0) + Number(c.visitorCount));
        }
        const topCountries = Array.from(countryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([country, count]) => ({ country, count }));

        // Get all available countries for filter dropdown (also normalized)
        const availableCountriesRaw = await prisma.$queryRaw<Array<{ country: string }>>`
            SELECT DISTINCT country
            FROM VisitorLog
            WHERE visitedAt >= ${startDate} AND country IS NOT NULL
            ORDER BY country ASC
        `;
        // Normalize and dedupe
        const availableCountriesSet = new Set<string>();
        for (const c of availableCountriesRaw) {
            availableCountriesSet.add(normalizeCountry(c.country) || c.country);
        }
        const availableCountries = Array.from(availableCountriesSet).sort();

        // Format visitors response (normalize countries)
        const visitorsWithEngagement = visitors.map(v => ({
            visitorHash: v.visitorHash?.substring(0, 12) + "...", // Show truncated hash for display
            country: normalizeCountry(v.country) || v.country,
            city: v.city,
            lastVisit: v.lastVisit,
            visitCount: Number(v.visitCount),
            isSubscriber: Boolean(v.isSubscriber),
            hasMessaged: Boolean(v.hasMessaged),
        }));

        return NextResponse.json({
            visitors: visitorsWithEngagement,
            pagination: {
                page,
                limit,
                total: totalUniqueVisitors,
                totalPages: Math.ceil(totalUniqueVisitors / limit),
            },
            stats: {
                totalVisits,
                uniqueVisitors: totalUniqueVisitors,
                subscribersCount,
                messagesCount: messagersCount,
                conversionRate: totalUniqueVisitors > 0
                    ? ((subscribersCount / totalUniqueVisitors) * 100).toFixed(1)
                    : "0.0",
            },
            topCountries,
            availableCountries,
            period,
            countryFilter: country,
            engagementFilter,
        });
    } catch (error) {
        console.error("Error fetching visitors:", error);
        return NextResponse.json(
            { error: "Failed to fetch visitors" },
            { status: 500 }
        );
    }
}
