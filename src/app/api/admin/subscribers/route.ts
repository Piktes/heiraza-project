import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await getServerSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const country = searchParams.get("country") || null;
    const status = searchParams.get("status") || "all"; // all, active, unsubscribed
    const search = searchParams.get("search") || null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    try {
        // Build where clause
        const where: any = {};

        // Status filter
        if (status === "active") {
            where.isActive = true;
        } else if (status === "unsubscribed") {
            where.isActive = false;
        }

        // Country filter
        if (country) {
            where.country = country;
        }

        // Search filter
        if (search) {
            where.OR = [
                { email: { contains: search } },
                { country: { contains: search } },
                { city: { contains: search } },
            ];
        }

        // Get paginated subscribers
        const subscribers = await prisma.subscriber.findMany({
            where,
            orderBy: { joinedAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Get total count for pagination
        const totalCount = await prisma.subscriber.count({ where });

        // Get stats
        const [total, eventFans, unsubscribed] = await Promise.all([
            prisma.subscriber.count(),
            prisma.subscriber.count({ where: { receiveEventAlerts: true, isActive: true } }),
            prisma.subscriber.count({ where: { isActive: false } }),
        ]);

        // Get top 3 countries by subscriber count
        const topCountriesRaw = await prisma.subscriber.groupBy({
            by: ["country"],
            where: {
                country: { not: null },
                isActive: true,
            },
            _count: { country: true },
            orderBy: { _count: { country: "desc" } },
            take: 3,
        });

        const topCountries = topCountriesRaw.map((c) => ({
            country: c.country || "Unknown",
            count: c._count.country,
        }));

        // Get all available countries for filter dropdown
        const availableCountriesRaw = await prisma.subscriber.findMany({
            where: { country: { not: null } },
            select: { country: true },
            distinct: ["country"],
            orderBy: { country: "asc" },
        });

        const availableCountries = availableCountriesRaw
            .map((c) => c.country)
            .filter((c): c is string => c !== null);

        return NextResponse.json({
            subscribers: subscribers.map((s) => ({
                id: s.id,
                email: s.email,
                receiveEventAlerts: s.receiveEventAlerts,
                isActive: s.isActive,
                joinedAt: s.joinedAt,
                country: s.country,
                city: s.city,
                countryCode: s.countryCode,
                unsubscribeReason: s.unsubscribeReason,
                unsubscribedAt: s.unsubscribedAt,
            })),
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
            stats: {
                total,
                eventFans,
                unsubscribed,
            },
            topCountries,
            availableCountries,
            countryFilter: country,
            statusFilter: status,
        });
    } catch (error) {
        console.error("Error fetching subscribers:", error);
        return NextResponse.json(
            { error: "Failed to fetch subscribers" },
            { status: 500 }
        );
    }
}
