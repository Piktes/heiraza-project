"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";

export type UploadFolder = "hero" | "events" | "products" | "general";

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Server action to save an uploaded image
 * Receives base64 data and saves to /public/uploads/[folder]/
 */
export async function uploadImage(
  base64Data: string,
  folder: UploadFolder = "general"
): Promise<UploadResult> {
  try {
    // Validate base64 data
    if (!base64Data || !base64Data.startsWith("data:image")) {
      return { success: false, error: "Invalid image data" };
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadsDir, { recursive: true });

    // Extract base64 content (remove data:image/jpeg;base64, prefix)
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Content, "base64");

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${folder}-${timestamp}-${randomStr}.jpg`;
    const filepath = path.join(uploadsDir, filename);

    // Write file to disk
    await writeFile(filepath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${folder}/${filename}`;
    
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to upload image" 
    };
  }
}

/**
 * Server action to save hero image and update artist
 */
export async function uploadHeroImage(
  formData: FormData
): Promise<UploadResult> {
  const imageData = formData.get("image") as string;
  
  if (!imageData) {
    return { success: false, error: "No image data provided" };
  }

  return uploadImage(imageData, "hero");
}
