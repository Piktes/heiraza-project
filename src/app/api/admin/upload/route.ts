import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

type UploadFolder = "hero" | "events" | "products" | "general";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { image, folder = "general" } = data as { image: string; folder: UploadFolder };

    // Validate base64 data
    if (!image || !image.startsWith("data:image")) {
      return NextResponse.json(
        { error: "Invalid image data" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = process.env.NODE_ENV === 'production'
      ? path.join('/home/vps2621146.dedi.server-hosting.expert/public_html/public/uploads', folder)
      : path.join(process.cwd(), "public", "uploads", folder);

    console.log(`[Upload API] Target Directory: ${uploadsDir}`);

    await mkdir(uploadsDir, { recursive: true });

    // Extract base64 content
    const base64Content = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Content, "base64");

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${folder}-${timestamp}-${randomStr}.jpg`;
    const filepath = path.join(uploadsDir, filename);
    console.log(`[Upload API] Saving file to: ${filepath}`);

    // Write file to disk
    await writeFile(filepath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${folder}/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
