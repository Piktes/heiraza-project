import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendReply } from "@/lib/email";

export async function POST(request: NextRequest) {
    try {
        const { to, subject, body } = await request.json();

        if (!to || !subject || !body) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get saved signature
        const sig = await prisma.emailSignature.findFirst({ orderBy: { updatedAt: "desc" } });
        let signature = null;

        if (sig) {
            let html = "";
            if (sig.logoUrl) {
                html += `<img src="${sig.logoUrl}" alt="Logo" style="max-width: 150px; max-height: 60px; object-fit: contain; margin-bottom: 10px;" />`;
            }
            html += sig.content;
            signature = html;
        }

        // Send the reply
        const result = await sendReply(to, subject, body, signature);

        if (result.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Send reply API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
