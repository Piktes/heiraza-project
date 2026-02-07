"use server";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Missing message ID" },
                { status: 400 }
            );
        }

        const message = await prisma.message.findUnique({ where: { id } });
        await prisma.message.delete({
            where: { id },
        });

        // Log action with session username
        const session = await getServerSession(authOptions);
        const username = (session?.user as any)?.username || "Unknown";
        await logAdminAction(username, "DELETE_MESSAGE", `Deleted message from: ${message?.email}`, { level: "WARN" });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete message error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
