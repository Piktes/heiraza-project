import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

        const event = await prisma.event.update({
            where: { id },
            data: body,
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
