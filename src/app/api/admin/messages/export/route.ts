"use server";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeCountryName } from "@/lib/country-utils";

// GET - Export messages data for PDF/Excel
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filter = searchParams.get("filter") || "all";
        const country = searchParams.get("country") || "";
        const search = searchParams.get("search") || "";

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { message: { contains: search } },
            ];
        }

        if (country) {
            where.country = country;
        }

        if (filter === "unanswered") {
            where.replied = false;
        }

        // Fetch all messages for export
        let messages = await prisma.message.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        // For "fromSubscribers" filter
        if (filter === "fromSubscribers") {
            const subscribers = await prisma.subscriber.findMany({
                where: { isActive: true },
                select: { email: true },
            });
            const subscriberEmails = new Set(subscribers.map(s => s.email.toLowerCase()));
            messages = messages.filter(m => subscriberEmails.has(m.email.toLowerCase()));
        }

        // Format data for export
        const exportData = messages.map(m => ({
            name: m.name,
            email: m.email,
            message: m.message.length > 100 ? m.message.substring(0, 100) + "..." : m.message,
            country: normalizeCountryName(m.country || "Unknown"),
            city: m.city || "Unknown",
            replied: m.replied ? "Yes" : "No",
            replyText: m.replyText ? (m.replyText.length > 50 ? m.replyText.substring(0, 50) + "..." : m.replyText) : "-",
            receivedAt: new Date(m.createdAt).toLocaleDateString(),
            repliedAt: m.repliedAt ? new Date(m.repliedAt).toLocaleDateString() : "-",
        }));

        return NextResponse.json({
            success: true,
            count: exportData.length,
            data: exportData,
            filters: { filter, country, search },
        });
    } catch (error) {
        console.error("Messages export error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
