import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAction } from "@/lib/logger";

// GET - Fetch artist data
export async function GET() {
  try {
    const artist = await prisma.artist.findFirst();

    if (!artist) {
      // Return empty structure instead of 404 to allow frontend to load
      return NextResponse.json({});
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
    } = data;

    // Check if an artist exists at all
    let artist = await prisma.artist.findFirst();

    let updatedArtist;

    if (artist) {
      // Update existing
      updatedArtist = await prisma.artist.update({
        where: { id: artist.id }, // Use found ID, ignore param ID to be safe
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
        },
      });
    } else {
      // Create new (Bootstrap)
      updatedArtist = await prisma.artist.create({
        data: {
          name: name || "Heiraza",
          bio: bio || "",
          heroImage: heroImage || "",
          facebookUrl: facebookUrl || null,
          instagramUrl: instagramUrl || null,
          tiktokUrl: tiktokUrl || null,
          youtubeUrl: youtubeUrl || null,
          spotifyUrl: spotifyUrl || null,
          twitterUrl: twitterUrl || null,
        },
      });
    }

    // Log the settings update action
    const changedFields = Object.entries(data)
      .filter(([key, value]) => key !== "id" && value !== undefined && value !== null && value !== "")
      .map(([key]) => key)
      .join(", ");

    logAction(
      "Sahadmin",
      "UPDATE_SETTINGS",
      `Updated artist settings: ${changedFields || "No changes"}`
    );

    return NextResponse.json(updatedArtist);
  } catch (error) {
    console.error("Error updating artist:", error);
    return NextResponse.json(
      { error: "Failed to update artist" },
      { status: 500 }
    );
  }
}

