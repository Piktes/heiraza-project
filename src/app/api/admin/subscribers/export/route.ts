import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const country = searchParams.get("country") || null;
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || null;
    const format = searchParams.get("format") || "json"; // json, pdf, xlsx

    try {
        // Build where clause
        const where: any = {};

        if (status === "active") {
            where.isActive = true;
        } else if (status === "unsubscribed") {
            where.isActive = false;
        }

        if (country) {
            where.country = country;
        }

        if (search) {
            where.OR = [
                { email: { contains: search } },
                { country: { contains: search } },
                { city: { contains: search } },
            ];
        }

        // Get ALL subscribers matching filters (no pagination for export)
        const subscribers = await prisma.subscriber.findMany({
            where,
            orderBy: { joinedAt: "desc" },
        });

        // Transform data for export
        const exportData = subscribers.map((s) => ({
            email: s.email,
            country: s.country || "Unknown",
            city: s.city || "",
            status: s.isActive ? "Active" : "Unsubscribed",
            eventAlerts: s.receiveEventAlerts ? "Yes" : "No",
            joinedAt: s.joinedAt.toISOString().split("T")[0],
            unsubscribedAt: s.unsubscribedAt ? s.unsubscribedAt.toISOString().split("T")[0] : "",
            unsubscribeReason: s.unsubscribeReason || "",
        }));

        // Return JSON for client-side generation
        return NextResponse.json({
            success: true,
            data: exportData,
            count: exportData.length,
            filters: { country, status, search },
            exportedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error exporting subscribers:", error);
        return NextResponse.json(
            { error: "Failed to export subscribers" },
            { status: 500 }
        );
    }
}
