import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch artist data
export async function GET() {
  try {
    const artist = await prisma.artist.findFirst();
    
    if (!artist) {
      return NextResponse.json(
        { error: "Artist not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(artist);
  } catch (error) {
    console.error("Error fetching artist:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist" },
      { status: 500 }
    );
  }
}

// PUT - Update artist data
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    const {
      id,
      name,
      bio,
      heroImage,
      facebookUrl,
      instagramUrl,
      tiktokUrl,
      youtubeUrl,
      spotifyUrl,
      twitterUrl,
      youtubeEmbedUrl1,
      youtubeEmbedUrl2,
    } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    const updatedArtist = await prisma.artist.update({
      where: { id: parseInt(id) },
      data: {
        name: name || undefined,
        bio: bio || undefined,
        heroImage: heroImage || undefined,
        facebookUrl: facebookUrl || null,
        instagramUrl: instagramUrl || null,
        tiktokUrl: tiktokUrl || null,
        youtubeUrl: youtubeUrl || null,
        spotifyUrl: spotifyUrl || null,
        twitterUrl: twitterUrl || null,
        youtubeEmbedUrl1: youtubeEmbedUrl1 || null,
        youtubeEmbedUrl2: youtubeEmbedUrl2 || null,
      },
    });

    return NextResponse.json(updatedArtist);
  } catch (error) {
    console.error("Error updating artist:", error);
    return NextResponse.json(
      { error: "Failed to update artist" },
      { status: 500 }
    );
  }
}
