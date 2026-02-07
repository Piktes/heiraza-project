import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAction } from "@/lib/logger";

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const id = parseInt(formData.get("id") as string);

        if (!id || isNaN(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // Get subscriber email for logging before deletion
        const subscriber = await prisma.subscriber.findUnique({ where: { id } });

        if (!subscriber) {
            return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
        }

        await prisma.subscriber.delete({ where: { id } });

        // Log the deletion action
        logAction(
            (session.user as any)?.username || session.user?.name || "Admin",
            "DELETE_SUBSCRIBER",
            `Deleted subscriber: ${subscriber.email}`
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting subscriber:", error);
        return NextResponse.json(
            { error: "Failed to delete subscriber" },
            { status: 500 }
        );
    }
}
