import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEventEmail } from "@/lib/email";

// GET - Cron job endpoint for sending event reminders
// Should be called daily by a cron service (e.g., Vercel Cron, GitHub Actions)
export async function GET(request: NextRequest) {
    try {
        // Verify cron secret (optional but recommended for production)
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Calculate date range for 7 days from now
        const now = new Date();
        const sevenDaysFromNow = new Date(now);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        // Find events that are exactly 7 days away (within a 24-hour window)
        const startOfDay = new Date(sevenDaysFromNow);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(sevenDaysFromNow);
        endOfDay.setHours(23, 59, 59, 999);

        const eventsNeedingReminder = await prisma.event.findMany({
            where: {
                isActive: true,
                isSoldOut: false,
                autoReminder: true,
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });

        const results = [];

        for (const event of eventsNeedingReminder) {
            const result = await sendEventEmail("reminder", event);
            results.push({
                eventId: event.id,
                eventTitle: event.title,
                success: result.success,
                recipientCount: result.recipientCount,
                error: result.error,
            });
        }

        return NextResponse.json({
            success: true,
            eventsProcessed: eventsNeedingReminder.length,
            results,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error("Cron event-reminders error:", error);
        return NextResponse.json({
            error: "Failed to process reminders",
            details: String(error),
        }, { status: 500 });
    }
}
