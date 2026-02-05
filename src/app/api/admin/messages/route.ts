"use server";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeCountry, getCountryFlag } from "@/lib/country-utils";

// GET - Fetch messages with stats, filtering, and pagination
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "30");
        const search = searchParams.get("search") || "";
        const filter = searchParams.get("filter") || "all"; // all, unanswered, fromSubscribers
        const country = searchParams.get("country") || "";
        const sortBy = searchParams.get("sort") || "newest";

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { message: { contains: search } },
                { country: { contains: search } },
                { city: { contains: search } },
            ];
        }

        if (country) {
            where.country = country;
        }

        if (filter === "unanswered") {
            where.replied = false;
        }

        // For "fromSubscribers" filter, we need to check if email exists in subscribers
        let subscriberEmails: string[] = [];
        if (filter === "fromSubscribers") {
            const subscribers = await prisma.subscriber.findMany({
                where: { isActive: true },
                select: { email: true },
            });
            subscriberEmails = subscribers.map(s => s.email.toLowerCase());
        }

        // Build order by
        let orderBy: any = { createdAt: "desc" };
        if (sortBy === "oldest") orderBy = { createdAt: "asc" };
        if (sortBy === "name") orderBy = { name: "asc" };
        if (sortBy === "country") orderBy = { country: "asc" };

        // Fetch messages
        let messages = await prisma.message.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
        });

        // If filtering by subscribers, filter in JS
        if (filter === "fromSubscribers") {
            messages = messages.filter(m => subscriberEmails.includes(m.email.toLowerCase()));
        }

        // Get total count
        let total = await prisma.message.count({ where });
        if (filter === "fromSubscribers") {
            // Get all messages for this filter and count
            const allMessages = await prisma.message.findMany({
                where,
                select: { email: true },
            });
            total = allMessages.filter(m => subscriberEmails.includes(m.email.toLowerCase())).length;
        }

        // Get stats
        const [totalMessages, unansweredCount, allSubscriberEmails] = await Promise.all([
            prisma.message.count(),
            prisma.message.count({ where: { replied: false } }),
            prisma.subscriber.findMany({ where: { isActive: true }, select: { email: true } }),
        ]);

        // Count messages from subscribers
        const allMessages = await prisma.message.findMany({ select: { email: true } });
        const subscriberEmailSet = new Set(allSubscriberEmails.map(s => s.email.toLowerCase()));
        const fromSubscribersCount = allMessages.filter(m => subscriberEmailSet.has(m.email.toLowerCase())).length;

        // Get top 3 countries - aggregate by normalized name
        const countryStats = await prisma.message.groupBy({
            by: ["country"],
            _count: { country: true },
            where: { country: { not: null } },
        });

        // Combine counts for same normalized country names
        const countryMap = new Map<string, number>();
        countryStats.forEach(c => {
            if (c.country) {
                const normalized = normalizeCountry(c.country) || c.country;
                countryMap.set(normalized, (countryMap.get(normalized) || 0) + c._count.country);
            }
        });

        const topCountries = Array.from(countryMap.entries())
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        // Get available countries for filter
        const countriesRaw = await prisma.message.findMany({
            select: { country: true },
            distinct: ["country"],
            where: { country: { not: null } },
        });
        const availableCountries = Array.from(new Set(countriesRaw.map(c => normalizeCountry(c.country!) || c.country!))).sort();

        // Add isSubscriber flag to each message
        const messagesWithSubscriberFlag = messages.map(m => ({
            ...m,
            isSubscriber: subscriberEmailSet.has(m.email.toLowerCase()),
        }));

        return NextResponse.json({
            success: true,
            messages: messagesWithSubscriberFlag,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            stats: {
                total: totalMessages,
                unanswered: unansweredCount,
                fromSubscribers: fromSubscribersCount,
            },
            topCountries,
            availableCountries,
            filter,
        });
    } catch (error) {
        console.error("Messages API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
