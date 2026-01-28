import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            id,
            facebookUrl,
            instagramUrl,
            tiktokUrl,
            youtubeUrl,
            spotifyUrl,
            appleMusicUrl,
            soundcloudUrl,
            twitterUrl,
        } = body;

        if (!id) {
            return NextResponse.json({ error: "Artist ID required" }, { status: 400 });
        }

        const updated = await prisma.artist.update({
            where: { id },
            data: {
                facebookUrl: facebookUrl || null,
                instagramUrl: instagramUrl || null,
                tiktokUrl: tiktokUrl || null,
                youtubeUrl: youtubeUrl || null,
                spotifyUrl: spotifyUrl || null,
                appleMusicUrl: appleMusicUrl || null,
                soundcloudUrl: soundcloudUrl || null,
                twitterUrl: twitterUrl || null,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating social media:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
