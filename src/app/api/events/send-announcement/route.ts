import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEventEmail, getEventAlertSubscriberCount } from "@/lib/email";

// POST - Send announcement email for an event
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId } = body;

        if (!eventId) {
            return NextResponse.json({ error: "Event ID required" }, { status: 400 });
        }

        // Get the event
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Send announcement email
        const result = await sendEventEmail("announcement", event);

        if (!result.success) {
            return NextResponse.json({
                error: result.error || "Failed to send emails"
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            recipientCount: result.recipientCount,
            message: `Announcement sent to ${result.recipientCount} subscribers`,
        });
    } catch (error) {
        console.error("Send announcement error:", error);
        return NextResponse.json({ error: "Failed to send announcement" }, { status: 500 });
    }
}

// GET - Get subscriber count for preview
export async function GET() {
    try {
        const count = await getEventAlertSubscriberCount();
        return NextResponse.json({ subscriberCount: count });
    } catch (error) {
        console.error("Get subscriber count error:", error);
        return NextResponse.json({ error: "Failed to get count" }, { status: 500 });
    }
}
