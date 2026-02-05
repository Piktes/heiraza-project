"use server";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeCountry } from "@/lib/country-utils";

// Helper to strip HTML tags and convert to plain text
function stripHtml(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, "\n")  // Convert <br> to newlines
        .replace(/<\/p>/gi, "\n")        // Convert </p> to newlines
        .replace(/<[^>]+>/g, "")         // Remove all HTML tags
        .replace(/&nbsp;/g, " ")         // Replace &nbsp; with space
        .replace(/&amp;/g, "&")          // Replace &amp; with &
        .replace(/&lt;/g, "<")           // Replace &lt; with <
        .replace(/&gt;/g, ">")           // Replace &gt; with >
        .replace(/\n\s*\n/g, "\n")       // Remove multiple newlines
        .trim();
}

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
        const exportData = messages.map(m => {
            // Strip HTML from replyText for clean export
            const plainReply = m.replyText ? stripHtml(m.replyText) : "";

            return {
                name: m.name,
                email: m.email,
                message: m.message.length > 100 ? m.message.substring(0, 100) + "..." : m.message,
                country: normalizeCountry(m.country || "Unknown") || "Unknown",
                city: m.city || "Unknown",
                replied: m.replied ? "Yes" : "No",
                replyText: plainReply ? (plainReply.length > 50 ? plainReply.substring(0, 50) + "..." : plainReply) : "-",
                receivedAt: new Date(m.createdAt).toLocaleDateString(),
                repliedAt: m.repliedAt ? new Date(m.repliedAt).toLocaleDateString() : "-",
            };
        });

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
