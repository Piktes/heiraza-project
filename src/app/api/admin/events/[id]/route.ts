import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { sendEventEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-logger";

interface Params {
    params: Promise<{ id: string }>;
}

// GET - Fetch single event
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const eventId = parseInt(id);
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error("Failed to fetch event:", error);
        return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
    }
}

// PATCH - Update event
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const eventId = parseInt(id);
        const body = await request.json();
        let { imageUrl, ...rest } = body;

        // Get the current event state to detect sold out changes
        const currentEvent = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!currentEvent) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Handle base64 image upload
        if (imageUrl && imageUrl.startsWith("data:image")) {
            try {
                // Create uploads directory if it doesn't exist
                const uploadsDir = path.join(process.cwd(), "public", "uploads", "events");
                await mkdir(uploadsDir, { recursive: true });

                // Extract base64 data
                const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, "base64");

                // Generate unique filename
                const filename = `event-${Date.now()}.jpg`;
                const filepath = path.join(uploadsDir, filename);

                // Write file
                await writeFile(filepath, buffer);

                // Update imageUrl to relative path
                imageUrl = `/uploads/events/${filename}`;
            } catch (err) {
                console.error("Error saving image:", err);
                // Keep original imageUrl if saving fails, or handle error appropriately
            }
        }

        const event = await prisma.event.update({
            where: { id: eventId },
            data: { ...rest, imageUrl },
        });

        // Log action with session username
        const session = await getServerSession(authOptions);
        const username = (session?.user as any)?.username || "Unknown";
        await logAdminAction(username, "UPDATE_EVENT", `Updated event: ${event.title}`);

        // Check if event was just marked as sold out AND autoSoldOut is enabled
        const wasSoldOut = currentEvent.isSoldOut;
        const nowSoldOut = event.isSoldOut;
        const autoSoldOutEnabled = event.autoSoldOut;

        if (!wasSoldOut && nowSoldOut && autoSoldOutEnabled) {
            console.log(`[EVENT] Event "${event.title}" marked as sold out - triggering email notification`);

            // Send sold out email notification
            try {
                const result = await sendEventEmail("soldOut", event);
                console.log(`[EVENT] Sold out email result:`, result);
            } catch (emailError) {
                console.error(`[EVENT] Failed to send sold out email:`, emailError);
                // Don't fail the update if email fails
            }
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error("Failed to update event:", error);
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}

// DELETE - Delete event
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const eventId = parseInt(id);

        // Get the event to check for image
        const event = await prisma.event.findUnique({ where: { id: eventId } });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Delete the image file if it exists
        if (event.imageUrl?.startsWith("/uploads/")) {
            const { unlink } = await import("fs/promises");
            const pathModule = await import("path");
            try {
                await unlink(pathModule.join(process.cwd(), "public", event.imageUrl));
            } catch (e) {
                // Ignore file deletion errors
            }
        }

        await prisma.event.delete({ where: { id: eventId } });

        // Log action with session username
        const session = await getServerSession(authOptions);
        const username = (session?.user as any)?.username || "Unknown";
        await logAdminAction(username, "DELETE_EVENT", `Deleted event: ${event.title}`, { level: "WARN" });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete event:", error);
        return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }
}
