"use server";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
    try {
        await prisma.message.updateMany({
            where: { isRead: false },
            data: { isRead: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Mark all read error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
