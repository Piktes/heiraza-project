import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const artist = await prisma.artist.findFirst({
            include: {
                socialMedias: true
            }
        });

        if (!artist) {
            return NextResponse.json({});
        }

        // Convert array to object for frontend convenience if needed, 
        // OR return the array directly. 
        // Let's return the simplified object structure expected by the frontend 
        // but now including isActive.
        // Frontend likely expects: { facebook: { url: "...", isActive: true }, ... }

        const response: Record<string, { url: string; isActive: boolean; id: number }> = {};

        artist.socialMedias.forEach(sm => {
            response[sm.platform] = {
                id: sm.id,
                url: sm.url,
                isActive: sm.isActive
            };
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
        // platforms object: { facebook: { url: "...", isActive: true }, ... }

        if (!id) {
            // Try to find artist if id not provided
            const artist = await prisma.artist.findFirst();
            if (!artist) {
                return NextResponse.json({ error: "Artist not found" }, { status: 404 });
            }
            // Proceed with found artist.id
        }

        const artist = await prisma.artist.findFirst({ where: id ? { id: Number(id) } : undefined });

        if (!artist) {
            return NextResponse.json({ error: "Artist ID invalid" }, { status: 400 });
        }

        const updates = [];

        for (const [platform, data] of Object.entries(platforms)) {
            // data should be { url, isActive }
            // Some keys might be extraneous, so we check valid platform keys or just save everything.
            // The prompt implies specific platforms (facebook, instagram, etc.) but we made it dynamic.

            // Type guard or check
            if (typeof data !== 'object' || data === null) continue;
            const { url, isActive } = data as { url: string; isActive: boolean };

            if (url !== undefined) {
                updates.push(
                    prisma.socialMedia.upsert({
                        where: {
                            artistId_platform: {
                                artistId: artist.id,
                                platform: platform
                            }
                        },
                        update: {
                            url: url,
                            isActive: isActive ?? true
                        },
                        create: {
                            artistId: artist.id,
                            platform: platform,
                            url: url,
                            isActive: isActive ?? true
                        }
                    })
                );
            }
        }

        await prisma.$transaction(updates);

        // Fetch updated data to return
        const updatedArtist = await prisma.artist.findFirst({
            where: { id: artist.id },
            include: { socialMedias: true }
        });

        const response: Record<string, any> = {};
        updatedArtist?.socialMedias.forEach(sm => {
            response[sm.platform] = {
                url: sm.url,
                isActive: sm.isActive
            };
        });

        return NextResponse.json({ ...response, id: updatedArtist?.id });

    } catch (error) {
        console.error("Error updating social media:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
