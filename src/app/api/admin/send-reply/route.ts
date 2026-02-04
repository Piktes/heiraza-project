"use server";

import { NextRequest, NextResponse } from "next/server";
import { sendMessageReply, getEmailSignature, isValidEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
    try {
        const { messageId, to, subject, body } = await request.json();

        if (!messageId || !to || !subject || !body) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check email validity first
        const emailValid = isValidEmail(to);

        // Send the reply (updates database internally)
        const result = await sendMessageReply(messageId, to, subject, body);

        if (result.success) {
            return NextResponse.json({
                success: true,
                emailValid,
                message: "Email was sent successfully"
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                    emailValid,
                    message: "Email could not be sent"
                },
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

// GET endpoint to check email validity and get signature for preview
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        const signature = await getEmailSignature();
        const emailValid = email ? isValidEmail(email) : true;

        return NextResponse.json({
            success: true,
            signature,
            emailValid,
        });
    } catch (error) {
        console.error("Get signature error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
