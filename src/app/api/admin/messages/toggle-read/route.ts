"use server";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const { id, isRead } = await request.json();

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Missing message ID" },
                { status: 400 }
            );
        }

        await prisma.message.update({
            where: { id },
            data: { isRead },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Toggle read error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
