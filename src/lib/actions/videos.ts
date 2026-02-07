"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-logger";

// Helper to get current username from session
async function getCurrentUsername(): Promise<string> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.username || "Unknown";
}

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

  const username = await getCurrentUsername();
  await logAdminAction(username, "CREATE_VIDEO", `Added video: ${title || youtubeUrl}`);

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

  const username = await getCurrentUsername();
  await logAdminAction(username, "UPDATE_VIDEO", `Updated video: ${title || youtubeUrl}`);

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

  const video = await prisma.video.update({
    where: { id },
    data: { isActive: !currentStatus },
  });

  const username = await getCurrentUsername();
  await logAdminAction(username, "TOGGLE_VIDEO", `${!currentStatus ? "Enabled" : "Disabled"} video: ${video.title || video.youtubeUrl}`);

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}

// ========================================
// DELETE VIDEO
// ========================================
export async function deleteVideo(formData: FormData) {
  const id = parseInt(formData.get("id") as string);

  const video = await prisma.video.findUnique({ where: { id } });
  await prisma.video.delete({
    where: { id },
  });

  const username = await getCurrentUsername();
  await logAdminAction(username, "DELETE_VIDEO", `Deleted video: ${video?.title || video?.youtubeUrl}`, { level: "WARN" });

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

  const username = await getCurrentUsername();
  await logAdminAction(username, "REORDER_TRACK", `Reordered ${videoIds.length} videos`);

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}
