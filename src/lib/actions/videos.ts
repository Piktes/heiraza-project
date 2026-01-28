"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ========================================
// GET ACTIVE VIDEOS (Filtered by isActive)
// ========================================
export async function getActiveVideos() {
  const videos = await prisma.video.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return videos;
}

// ========================================
// GET ALL VIDEOS (For Admin)
// ========================================
export async function getAllVideos() {
  const videos = await prisma.video.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return videos;
}

// ========================================
// ADD VIDEO
// ========================================
export async function addVideo(formData: FormData) {
  const title = formData.get("title") as string;
  const youtubeUrl = formData.get("youtubeUrl") as string;
  
  if (!youtubeUrl) {
    return { success: false, error: "YouTube URL is required" };
  }

  // Get the highest sortOrder
  const lastVideo = await prisma.video.findFirst({
    orderBy: { sortOrder: "desc" },
  });
  const newSortOrder = (lastVideo?.sortOrder || 0) + 1;

  const video = await prisma.video.create({
    data: {
      title: title || null,
      youtubeUrl,
      sortOrder: newSortOrder,
      isActive: true,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  
  return { success: true, video };
}

// ========================================
// UPDATE VIDEO
// ========================================
export async function updateVideo(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const title = formData.get("title") as string;
  const youtubeUrl = formData.get("youtubeUrl") as string;
  const isActive = formData.get("isActive") === "true";

  if (!id || !youtubeUrl) {
    return { success: false, error: "Invalid data" };
  }

  const video = await prisma.video.update({
    where: { id },
    data: {
      title: title || null,
      youtubeUrl,
      isActive,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  
  return { success: true, video };
}

// ========================================
// TOGGLE VIDEO ACTIVE STATUS
// ========================================
export async function toggleVideoActive(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const currentStatus = formData.get("isActive") === "true";

  await prisma.video.update({
    where: { id },
    data: { isActive: !currentStatus },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  
  return { success: true };
}

// ========================================
// DELETE VIDEO
// ========================================
export async function deleteVideo(formData: FormData) {
  const id = parseInt(formData.get("id") as string);

  await prisma.video.delete({
    where: { id },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  
  return { success: true };
}

// ========================================
// REORDER VIDEOS
// ========================================
export async function reorderVideos(videoIds: number[]) {
  // Update each video with new sortOrder
  await Promise.all(
    videoIds.map((id, index) =>
      prisma.video.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  revalidatePath("/admin");
  revalidatePath("/");
  
  return { success: true };
}
