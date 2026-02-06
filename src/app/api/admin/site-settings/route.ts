import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET site settings for preview purposes
export async function GET() {
    try {
        const settings = await prisma.siteSettings.findFirst();

        if (!settings) {
            return NextResponse.json({
                announcementTemplate: null,
                reminderTemplate: null,
                soldOutTemplate: null,
                notificationLogoUrl: null,
            });
        }

        return NextResponse.json({
            announcementTemplate: settings.announcementTemplate,
            reminderTemplate: settings.reminderTemplate,
            soldOutTemplate: settings.soldOutTemplate,
            notificationLogoUrl: settings.notificationLogoUrl,
        });
    } catch (error) {
        console.error("Error fetching site settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch site settings" },
            { status: 500 }
        );
    }
}
