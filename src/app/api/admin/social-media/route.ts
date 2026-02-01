import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Force sync timestamp: 2026-02-01 16:04

export async function GET() {
    try {
        const artist = await prisma.artist.findFirst();

        if (!artist) {
            return NextResponse.json({});
        }

        // Return flat object or map to frontend expectation
        // Frontend likely expects { facebook: { url: "...", isActive: true }, ... }
        // We will mock isActive as true since we reverted the schema.

        const response: Record<string, { url: string; isActive: boolean }> = {};
        const platforms = ['facebook', 'instagram', 'tiktok', 'youtube', 'spotify', 'appleMusic', 'soundcloud', 'twitter'];

        platforms.forEach(platform => {
            const url = artist[`${platform}Url` as keyof typeof artist] as string | null;
            if (url) {
                response[platform] = {
                    url: url,
                    isActive: true // Default to true as schema doesn't support it yet
                };
            }
        });

        return NextResponse.json({ ...response, id: artist.id });

    } catch (error) {
        console.error("Error fetching social media:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...platforms } = body;
        // platforms object: { facebook: { url: "...", isActive: false }, ... }

        if (!id) {
            return NextResponse.json({ error: "Artist ID required" }, { status: 400 });
        }

        const updateData: any = {};

        // Map frontend "platform" keys to backend "platformUrl" columns
        Object.entries(platforms).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                const { url } = value as { url: string };
                // Only update URL, ignore isActive for now
                updateData[`${key}Url`] = url;
            }
        });

        const updated = await prisma.artist.update({
            where: { id: Number(id) },
            data: updateData,
        });

        // Format response back to frontend expectation
        const response: Record<string, any> = {};
        const platformKeys = ['facebook', 'instagram', 'tiktok', 'youtube', 'spotify', 'appleMusic', 'soundcloud', 'twitter'];

        platformKeys.forEach(platform => {
            const url = updated[`${platform}Url` as keyof typeof updated] as string | null;
            if (url) {
                response[platform] = {
                    url: url,
                    isActive: true
                };
            }
        });

        return NextResponse.json({ ...response, id: updated.id });

    } catch (error) {
        console.error("Error updating social media:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
