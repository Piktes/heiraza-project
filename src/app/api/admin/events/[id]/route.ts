import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

interface Params {
    params: { id: string };
}

// GET - Fetch single event
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const id = parseInt(params.id);
        const event = await prisma.event.findUnique({
            where: { id },
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
        const id = parseInt(params.id);
        const body = await request.json();
        let { imageUrl, ...rest } = body;

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
                // In this case, we might want to fail the request or just log it
            }
        }

        const event = await prisma.event.update({
            where: { id },
            data: { ...rest, imageUrl },
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error("Failed to update event:", error);
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}

// DELETE - Delete event
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const id = parseInt(params.id);

        // Get the event to check for image
        const event = await prisma.event.findUnique({ where: { id } });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Delete the image file if it exists
        if (event.imageUrl?.startsWith("/uploads/")) {
            const { unlink } = await import("fs/promises");
            const path = await import("path");
            try {
                await unlink(path.join(process.cwd(), "public", event.imageUrl));
            } catch (e) {
                // Ignore file deletion errors
            }
        }

        await prisma.event.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete event:", error);
        return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }
}
