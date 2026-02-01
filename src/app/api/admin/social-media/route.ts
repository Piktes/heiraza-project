import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Force sync timestamp: 2026-02-01 16:15

export async function GET() {
    try {
        const artist = await prisma.artist.findFirst();

        if (!artist) {
            return NextResponse.json({});
        }

        const response: Record<string, { url: string; isActive: boolean }> = {};
        const platforms = ['facebook', 'instagram', 'tiktok', 'youtube', 'spotify', 'appleMusic', 'soundcloud', 'twitter'];

        platforms.forEach(platform => {
            // Construct column names dynamically
            // e.g. facebook -> facebookUrl, isFacebookActive
            const urlKey = `${platform}Url` as keyof typeof artist;

            // Capitalize first letter for the boolean key
            const capitalizedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
            const activeKey = `is${capitalizedPlatform}Active` as keyof typeof artist;

            const url = artist[urlKey] as string | null;
            const isActive = artist[activeKey] as boolean | null;

            if (url !== undefined) { // Check if column exists/was fetched (even if null)
                response[platform] = {
                    url: url || "",
                    isActive: isActive ?? true // Default to true if null
                };
            }
        });

        return NextResponse.json({ ...response, id: artist.id });

    } catch (error) {
        console.error("Error fetching social media:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

// PUT - Update social media links
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...platforms } = body;

        // Check if an artist exists at all
        let artist = await prisma.artist.findFirst();

        const updateData: any = {};

        Object.entries(platforms).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                const { url, isActive } = value as { url: string, isActive: boolean };

                const capitalizedPlatform = key.charAt(0).toUpperCase() + key.slice(1);

                // Update URL column
                updateData[`${key}Url`] = url;

                // Update Active column
                if (isActive !== undefined) {
                    updateData[`is${capitalizedPlatform}Active`] = isActive;
                }
            }
        });

        let updated;

        if (artist) {
            // Update existing
            updated = await prisma.artist.update({
                where: { id: artist.id },
                data: updateData,
            });
        } else {
            // Create new (Bootstrap) with default name+bio AND the social links
            updated = await prisma.artist.create({
                data: {
                    name: "Heiraza",
                    bio: "",
                    heroImage: "",
                    ...updateData
                }
            });
        }

        const response: Record<string, any> = {};
        const platformKeys = ['facebook', 'instagram', 'tiktok', 'youtube', 'spotify', 'appleMusic', 'soundcloud', 'twitter'];

        platformKeys.forEach(platform => {
            const capitalizedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
            const urlKey = `${platform}Url` as keyof typeof updated;
            const activeKey = `is${capitalizedPlatform}Active` as keyof typeof updated;

            const url = updated[urlKey] as string | null;
            const isActive = updated[activeKey] as boolean | null;

            response[platform] = {
                url: url || "",
                isActive: isActive ?? true
            };
        });

        return NextResponse.json({ ...response, id: updated.id });

    } catch (error) {
        console.error("Error updating social media:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
