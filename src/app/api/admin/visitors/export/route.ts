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
    const period = searchParams.get("period") || "week";
    const country = searchParams.get("country") || null;
    const engagementFilter = searchParams.get("engagement") || "all";

    try {
        // Calculate date range
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

        // Build filter clauses
        const countryFilter = country ? ` AND country = '${country.replace(/'/g, "''")}'` : "";
        let engagementClause = "";
        if (engagementFilter === "subscribers") {
            engagementClause = " AND isSubscriber = 1";
        } else if (engagementFilter === "messaged") {
            engagementClause = " AND hasMessaged = 1";
        }

        // Get ALL visitors (no pagination for export)
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
        `, startDate);

        // Format for export
        const exportData = visitors.map(v => ({
            visitorId: v.visitorHash?.substring(0, 12) + "...",
            country: normalizeCountry(v.country) || v.country || "Unknown",
            city: v.city || "",
            lastVisit: v.lastVisit.toISOString().split("T")[0],
            visits: Number(v.visitCount),
            isSubscriber: Boolean(v.isSubscriber) ? "Yes" : "No",
            hasMessaged: Boolean(v.hasMessaged) ? "Yes" : "No",
        }));

        const periodLabel = period === "today" ? "Today" :
            period === "week" ? "Last 7 Days" :
                period === "month" ? "Last Month" : "Last Year";

        return NextResponse.json({
            success: true,
            data: exportData,
            count: exportData.length,
            filters: { period: periodLabel, country, engagement: engagementFilter },
            exportedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error exporting visitors:", error);
        return NextResponse.json(
            { error: "Failed to export visitors" },
            { status: 500 }
        );
    }
}
