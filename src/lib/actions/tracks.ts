"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ========================================
// GET ACTIVE TRACKS (Frontend)
// ========================================
export async function getActiveTracks() {
  return await prisma.track.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

// ========================================
// GET ALL TRACKS (Admin)
// ========================================
export async function getAllTracks() {
  return await prisma.track.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

// ========================================
// ADD TRACK
// ========================================
export async function addTrack(formData: FormData) {
  const title = formData.get("title") as string;
  const artist = formData.get("artist") as string || "Heiraza";
  const fileUrl = formData.get("fileUrl") as string;
  const audioFile = formData.get("audioFile") as File | null;
  const coverImageData = formData.get("coverImage") as string;

  if (!title) {
    return { success: false, error: "Title is required" };
  }

  let finalFileUrl = fileUrl;
  let finalCoverImage: string | null = null;

  // Handle audio file upload
  if (audioFile && audioFile.size > 0) {
    const uploadResult = await uploadAudioFile(audioFile);
    if (uploadResult.success) {
      finalFileUrl = uploadResult.url!;
    } else {
      return { success: false, error: uploadResult.error };
    }
  }

  if (!finalFileUrl) {
    return { success: false, error: "Audio source is required (upload or URL)" };
  }

  // Handle cover image upload
  if (coverImageData && coverImageData.startsWith("data:image")) {
    const coverResult = await uploadBase64Image(coverImageData, "covers");
    if (coverResult.success) {
      finalCoverImage = coverResult.url!;
    }
  }

  // Get the highest sortOrder
  const lastTrack = await prisma.track.findFirst({
    orderBy: { sortOrder: "desc" },
  });
  const newSortOrder = (lastTrack?.sortOrder || 0) + 1;

  const track = await prisma.track.create({
    data: {
      title,
      artist,
      fileUrl: finalFileUrl,
      coverImage: finalCoverImage,
      sortOrder: newSortOrder,
      isActive: true,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true, track };
}

// ========================================
// UPDATE TRACK
// ========================================
export async function updateTrack(formData: FormData) {
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const artist = formData.get("artist") as string;
  const fileUrl = formData.get("fileUrl") as string;
  const coverImageData = formData.get("coverImage") as string;
  const isActive = formData.get("isActive") === "true";

  if (!id || !title) {
    return { success: false, error: "Invalid data" };
  }

  let updateData: any = {
    title,
    artist: artist || "Heiraza",
    isActive,
  };

  // Update audio source if provided
  if (fileUrl) {
    updateData.fileUrl = fileUrl;
  }

  // Handle new cover image
  if (coverImageData && coverImageData.startsWith("data:image")) {
    const coverResult = await uploadBase64Image(coverImageData, "covers");
    if (coverResult.success) {
      updateData.coverImage = coverResult.url;
    }
  }

  const track = await prisma.track.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true, track };
}

// ========================================
// TOGGLE TRACK ACTIVE STATUS
// ========================================
export async function toggleTrackActive(formData: FormData) {
  const id = formData.get("id") as string;
  const currentStatus = formData.get("isActive") === "true";

  await prisma.track.update({
    where: { id },
    data: { isActive: !currentStatus },
  });

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}

// ========================================
// DELETE TRACK
// ========================================
export async function deleteTrack(formData: FormData) {
  const id = formData.get("id") as string;

  await prisma.track.delete({
    where: { id },
  });

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}

// ========================================
// UPLOAD AUDIO FILE (MP3)
// ========================================
async function uploadAudioFile(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate file type
    if (!file.type.includes("audio")) {
      return { success: false, error: "Invalid file type. Please upload an audio file." };
    }

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "audio");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split(".").pop() || "mp3";
    const filename = `track-${timestamp}-${randomStr}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    return { success: true, url: `/uploads/audio/${filename}` };
  } catch (error) {
    console.error("Error uploading audio:", error);
    return { success: false, error: "Failed to upload audio file" };
  }
}

// ========================================
// UPLOAD BASE64 IMAGE
// ========================================
async function uploadBase64Image(
  base64Data: string,
  folder: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!base64Data || !base64Data.startsWith("data:image")) {
      return { success: false, error: "Invalid image data" };
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadsDir, { recursive: true });

    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Content, "base64");

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${folder}-${timestamp}-${randomStr}.jpg`;
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    return { success: true, url: `/uploads/${folder}/${filename}` };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { success: false, error: "Failed to upload image" };
  }
}
