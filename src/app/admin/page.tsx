import Link from "next/link";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit-logger";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { VideoManager } from "@/components/admin/video-manager";
import { TrackManager } from "@/components/admin/track-manager";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { SiteSettingsManager } from "@/components/admin/site-settings-manager";
import { DashboardSection, SectionOpener } from "@/components/admin/dashboard-section";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import {
  Calendar, Package, Users, Music2, ArrowUpRight, Home, MessageSquare,
  Eye, EyeOff, Trash2, Plus, Settings, Youtube, ImageIcon, Share2, Bell, ImagePlus, Mail,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Helper to get current username from session
async function getCurrentUsername() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.username || "Unknown";
}

// ========================================
// DATA FETCHING
// ========================================
async function getStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    tracksCount,
    videosCount,
    eventsCount,
    productsCount,
    galleryCount,
    socialCount,
    // Today's Stats
    messagesTotal,
    totalUnread,
    todayUnreadMessages,
    todayVisitors,
    todaySubscribers
  ] = await Promise.all([
    prisma.track.count({ where: { isActive: true } }),
    prisma.video.count({ where: { isActive: true } }),
    prisma.event.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.galleryImage.count({ where: { isActive: true } }),
    prisma.socialMedia.count({ where: { isVisible: true } }),

    // Today's & Message Stats
    prisma.message.count(), // Total messages
    prisma.message.count({ where: { isRead: false } }), // Total Unread
    prisma.message.count({
      where: {
        isRead: false,
        createdAt: { gte: startOfToday }
      }
    }),
    prisma.visitorLog.count({
      where: {
        visitedAt: { gte: startOfToday }
      }
    }),
    prisma.subscriber.count({
      where: {
        joinedAt: { gte: startOfToday }
      }
    })
  ]);

  return {
    tracksCount,
    videosCount,
    eventsCount,
    productsCount,
    galleryCount,
    socialCount,
    messagesCount: messagesTotal,
    totalUnread,
    todayUnreadMessages,
    todayVisitors,
    todaySubscribers
  };
}

// async function getArtist() { ... } // Removed
async function getAllVideos() { return await prisma.video.findMany({ orderBy: { sortOrder: "asc" } }); }
async function getAllTracks() { return await prisma.track.findMany({ orderBy: { sortOrder: "asc" } }); }
async function getAllGalleryImages() { return await prisma.galleryImage.findMany({ orderBy: { sortOrder: "asc" } }); }

async function getSiteSettings() {
  let settings = await prisma.siteSettings.findFirst();
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { isAudioPlayerVisible: true, isShopVisible: true, isSocialLinksVisible: true, isYoutubeVisible: true, youtubeAutoScroll: true, youtubeScrollInterval: 2000, heroSliderEnabled: true, heroSliderInterval: 5000, heroKenBurnsEffect: true },
    });
  }
  return settings;
}

// ========================================
// SERVER ACTIONS - Videos (with Audit Logging)
// ========================================
async function addVideo(formData: FormData) {
  "use server";
  const title = formData.get("title") as string;
  const youtubeUrl = formData.get("youtubeUrl") as string;
  if (!youtubeUrl) return;

  const lastVideo = await prisma.video.findFirst({ orderBy: { sortOrder: "desc" } });
  const video = await prisma.video.create({ data: { title: title || null, youtubeUrl, sortOrder: (lastVideo?.sortOrder || 0) + 1, isActive: true } });

  const username = await getCurrentUsername();
  await logAdminAction(username, "CREATE_VIDEO", `Added video: ${title || youtubeUrl}`);

  revalidatePath("/admin");
  revalidatePath("/");
}

async function toggleVideoActive(formData: FormData) {
  "use server";
  const id = parseInt(formData.get("id") as string);
  const currentStatus = formData.get("isActive") === "true";
  const video = await prisma.video.update({ where: { id }, data: { isActive: !currentStatus } });

  const username = await getCurrentUsername();
  await logAdminAction(username, "TOGGLE_VIDEO", `${!currentStatus ? "Enabled" : "Disabled"} video: ${video.title || video.youtubeUrl}`);

  revalidatePath("/admin");
  revalidatePath("/");
}

async function deleteVideo(formData: FormData) {
  "use server";
  const id = parseInt(formData.get("id") as string);
  const video = await prisma.video.findUnique({ where: { id } });
  await prisma.video.delete({ where: { id } });

  const username = await getCurrentUsername();
  await logAdminAction(username, "DELETE_VIDEO", `Deleted video: ${video?.title || video?.youtubeUrl}`, { level: "WARN" });

  revalidatePath("/admin");
  revalidatePath("/");
}

async function reorderVideos(orderedIds: number[]) {
  "use server";
  const updates = orderedIds.map((id, index) =>
    prisma.video.update({ where: { id }, data: { sortOrder: index } })
  );
  await prisma.$transaction(updates);

  const username = await getCurrentUsername();
  await logAdminAction(username, "REORDER_TRACK", `Reordered ${orderedIds.length} videos`);

  revalidatePath("/admin");
  revalidatePath("/");
}

// ========================================
// SERVER ACTIONS - Tracks (Int ID + Audit Logging)
// ========================================
async function addTrack(formData: FormData) {
  "use server";
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");

  const title = formData.get("title") as string;
  const artist = formData.get("artist") as string || "Heiraza";
  const externalLink = formData.get("externalLink") as string;
  const audioFile = formData.get("audioFile") as File | null;
  const coverImageData = formData.get("coverImage") as string;

  if (!title) return { success: false, error: "Title is required" };

  let fileUrl: string | null = null;
  let finalExternalLink: string | null = externalLink || null;
  let finalCoverImage: string | null = null;

  if (audioFile && audioFile.size > 0) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "audio");
    await mkdir(uploadsDir, { recursive: true });
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = audioFile.name.split(".").pop() || "mp3";
    const filename = `track-${timestamp}-${randomStr}.${ext}`;
    await writeFile(path.join(uploadsDir, filename), Buffer.from(await audioFile.arrayBuffer()));
    fileUrl = `/uploads/audio/${filename}`;
  }

  if (!fileUrl && !finalExternalLink) return { success: false, error: "Audio source required" };

  if (coverImageData && coverImageData.startsWith("data:image")) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "covers");
    await mkdir(uploadsDir, { recursive: true });
    const base64Content = coverImageData.replace(/^data:image\/\w+;base64,/, "");
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `cover-${timestamp}-${randomStr}.jpg`;
    await writeFile(path.join(uploadsDir, filename), Buffer.from(base64Content, "base64"));
    finalCoverImage = `/uploads/covers/${filename}`;
  }

  const lastTrack = await prisma.track.findFirst({ orderBy: { sortOrder: "desc" } });
  await prisma.track.create({
    data: { title, artist, fileUrl, externalLink: finalExternalLink, coverImage: finalCoverImage, sortOrder: (lastTrack?.sortOrder || 0) + 1, isActive: true },
  });

  const username = await getCurrentUsername();
  await logAdminAction(username, "CREATE_TRACK", `Added track: ${title} by ${artist}`);

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

async function toggleTrackActive(formData: FormData) {
  "use server";
  const id = parseInt(formData.get("id") as string);
  const currentStatus = formData.get("isActive") === "true";
  const track = await prisma.track.update({ where: { id }, data: { isActive: !currentStatus } });

  const username = await getCurrentUsername();
  await logAdminAction(username, "TOGGLE_TRACK", `${!currentStatus ? "Enabled" : "Disabled"} track: ${track.title}`);

  revalidatePath("/admin");
  revalidatePath("/");
}

async function deleteTrack(formData: FormData) {
  "use server";
  const id = parseInt(formData.get("id") as string);
  const track = await prisma.track.findUnique({ where: { id } });
  await prisma.track.delete({ where: { id } });

  const username = await getCurrentUsername();
  await logAdminAction(username, "DELETE_TRACK", `Deleted track: ${track?.title}`, { level: "WARN" });

  revalidatePath("/admin");
  revalidatePath("/");
}

async function moveTrack(formData: FormData) {
  "use server";
  const id = parseInt(formData.get("id") as string);
  const direction = formData.get("direction") as "up" | "down";

  const tracks = await prisma.track.findMany({ orderBy: { sortOrder: "asc" } });
  const currentIndex = tracks.findIndex(t => t.id === id);
  if (currentIndex === -1) return;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= tracks.length) return;

  const current = tracks[currentIndex];
  const target = tracks[targetIndex];

  await prisma.$transaction([
    prisma.track.update({ where: { id: current.id }, data: { sortOrder: target.sortOrder } }),
    prisma.track.update({ where: { id: target.id }, data: { sortOrder: current.sortOrder } }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/");
}

async function reorderTracks(orderedIds: number[]) {
  "use server";
  const updates = orderedIds.map((id, index) =>
    prisma.track.update({ where: { id }, data: { sortOrder: index } })
  );
  await prisma.$transaction(updates);

  const username = await getCurrentUsername();
  await logAdminAction(username, "REORDER_TRACK", `Reordered ${orderedIds.length} tracks`);

  revalidatePath("/admin");
  revalidatePath("/");
}

async function updateTrack(formData: FormData) {
  "use server";
  const { writeFile, mkdir, unlink } = await import("fs/promises");
  const path = await import("path");

  const id = parseInt(formData.get("id") as string);
  const title = formData.get("title") as string;
  const artist = formData.get("artist") as string;
  const externalLink = formData.get("externalLink") as string;
  const audioFile = formData.get("audioFile") as File | null;
  const coverImageData = formData.get("coverImage") as string;

  if (!id || !title) return { success: false, error: "ID and Title are required" };

  const currentTrack = await prisma.track.findUnique({ where: { id } });
  if (!currentTrack) return { success: false, error: "Track not found" };

  let fileUrl = currentTrack.fileUrl;
  let finalCoverImage = currentTrack.coverImage;

  // Handle Audio File Replacement
  if (audioFile && audioFile.size > 0) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "audio");
    await mkdir(uploadsDir, { recursive: true });

    // Delete old file if it exists and is local
    if (fileUrl && fileUrl.startsWith("/uploads/")) {
      try { await unlink(path.join(uploadsDir, path.basename(fileUrl))); } catch { /* ignore */ }
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = audioFile.name.split(".").pop() || "mp3";
    const filename = `track-${timestamp}-${randomStr}.${ext}`;
    await writeFile(path.join(uploadsDir, filename), Buffer.from(await audioFile.arrayBuffer()));
    fileUrl = `/uploads/audio/${filename}`;
  } else if (externalLink && !audioFile) {
    // If switching to external link and no new file, current file is kept unless explicitly cleared?
    // For now, if external link is provided and user didn't upload a new file, we PRIORITIZE the external link
    // ONLY IF the user intended to switch. But typically update just updates fields.
    // To keep it simple: We update fields. If user provides new file, it replaces.
    // If user clears file... we don't have a clear mechanism yet. 
    // We will assume fileUrl remains unless replaced.
  }

  // Handle Cover Image Replacement
  if (coverImageData && coverImageData.startsWith("data:image")) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "covers");
    await mkdir(uploadsDir, { recursive: true });

    // Delete old cover
    if (finalCoverImage && finalCoverImage.startsWith("/uploads/")) {
      try { await unlink(path.join(uploadsDir, path.basename(finalCoverImage))); } catch { /* ignore */ }
    }

    const base64Content = coverImageData.replace(/^data:image\/\w+;base64,/, "");
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `cover-${timestamp}-${randomStr}.jpg`;
    await writeFile(path.join(uploadsDir, filename), Buffer.from(base64Content, "base64"));
    finalCoverImage = `/uploads/covers/${filename}`;
  }

  // If user provided an external link, we save it. Logic in player handles priority.
  // Ideally, if user provides a file, valid player logic prefers file.

  await prisma.track.update({
    where: { id },
    data: {
      title,
      artist: artist || null,
      fileUrl,
      externalLink: externalLink || null,
      coverImage: finalCoverImage,
    },
  });

  const username = await getCurrentUsername();
  await logAdminAction(username, "UPDATE_TRACK", `Updated track: ${title}`);

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

// ========================================
// SERVER ACTIONS - Gallery (with Audit Logging)
// ========================================
async function addGalleryImage(formData: FormData) {
  "use server";
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");

  const title = formData.get("title") as string;
  const caption = formData.get("caption") as string;
  const category = formData.get("category") as string;
  const imageData = formData.get("imageData") as string;

  if (!imageData || !imageData.startsWith("data:image")) return { success: false, error: "No image provided" };

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "gallery");
  await mkdir(uploadsDir, { recursive: true });

  const base64Content = imageData.replace(/^data:image\/\w+;base64,/, "");
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const filename = `gallery-${timestamp}-${randomStr}.jpg`;
  await writeFile(path.join(uploadsDir, filename), Buffer.from(base64Content, "base64"));

  const lastImage = await prisma.galleryImage.findFirst({ orderBy: { sortOrder: "desc" } });
  await prisma.galleryImage.create({
    data: { imageUrl: `/uploads/gallery/${filename}`, title: title || null, caption: caption || null, category: category || null, sortOrder: (lastImage?.sortOrder || 0) + 1, isActive: true },
  });

  const username = await getCurrentUsername();
  await logAdminAction(username, "CREATE_GALLERY_IMAGE", `Added gallery image: ${title || filename}`);

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

async function addMultipleGalleryImages(formData: FormData) {
  "use server";
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");

  const imageDataList = formData.getAll("imageData") as string[];
  const category = formData.get("category") as string;

  if (!imageDataList || imageDataList.length === 0) return { success: false, error: "No images provided" };

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "gallery");
  await mkdir(uploadsDir, { recursive: true });

  let lastImage = await prisma.galleryImage.findFirst({ orderBy: { sortOrder: "desc" } });
  let sortOrder = (lastImage?.sortOrder || 0) + 1;
  let uploadedCount = 0;

  for (const imageData of imageDataList) {
    if (!imageData.startsWith("data:image")) continue;
    const base64Content = imageData.replace(/^data:image\/\w+;base64,/, "");
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `gallery-${timestamp}-${randomStr}.jpg`;
    await writeFile(path.join(uploadsDir, filename), Buffer.from(base64Content, "base64"));
    await prisma.galleryImage.create({ data: { imageUrl: `/uploads/gallery/${filename}`, category: category || null, sortOrder: sortOrder++, isActive: true } });
    uploadedCount++;
  }

  const username = await getCurrentUsername();
  await logAdminAction(username, "CREATE_GALLERY_IMAGES", `Batch uploaded ${uploadedCount} gallery images${category ? ` in category: ${category}` : ""}`);

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true, uploadedCount };
}

async function toggleGalleryImageActive(formData: FormData) {
  "use server";
  const id = parseInt(formData.get("id") as string);
  const currentStatus = formData.get("isActive") === "true";
  await prisma.galleryImage.update({ where: { id }, data: { isActive: !currentStatus } });

  const username = await getCurrentUsername();
  await logAdminAction(username, "TOGGLE_GALLERY_IMAGE", `${!currentStatus ? "Enabled" : "Disabled"} gallery image #${id}`);

  revalidatePath("/admin");
  revalidatePath("/");
}

async function deleteGalleryImage(formData: FormData) {
  "use server";
  const { unlink } = await import("fs/promises");
  const path = await import("path");
  const id = parseInt(formData.get("id") as string);
  const image = await prisma.galleryImage.findUnique({ where: { id } });
  if (image) {
    if (image.imageUrl.startsWith("/uploads/")) { try { await unlink(path.join(process.cwd(), "public", image.imageUrl)); } catch { /* ignore */ } }
    await prisma.galleryImage.delete({ where: { id } });

    const username = await getCurrentUsername();
    await logAdminAction(username, "DELETE_GALLERY_IMAGE", `Deleted gallery image: ${image.title || image.imageUrl}`, { level: "WARN" });
  }
  revalidatePath("/admin");
  revalidatePath("/");
}

async function moveGalleryImage(formData: FormData) {
  "use server";
  const id = parseInt(formData.get("id") as string);
  const direction = formData.get("direction") as "up" | "down";
  const images = await prisma.galleryImage.findMany({ orderBy: { sortOrder: "asc" } });
  const currentIndex = images.findIndex(img => img.id === id);
  if (currentIndex === -1) return;
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= images.length) return;
  const current = images[currentIndex];
  const target = images[targetIndex];
  await prisma.$transaction([
    prisma.galleryImage.update({ where: { id: current.id }, data: { sortOrder: target.sortOrder } }),
    prisma.galleryImage.update({ where: { id: target.id }, data: { sortOrder: current.sortOrder } }),
  ]);
  revalidatePath("/admin");
  revalidatePath("/");
}

// ========================================
// SERVER ACTIONS - Site Settings (with Audit Logging)
// ========================================
async function toggleSetting(formData: FormData) {
  "use server";
  console.log("toggleSetting called"); // Debug log

  const settings = await prisma.siteSettings.findFirst();
  if (!settings) {
    console.log("toggleSetting: No settings found");
    return { success: false };
  }

  const settingName = formData.get("settingName") as string;
  const currentValueRaw = formData.get("currentValue");
  const currentValue = currentValueRaw === "true";

  console.log(`toggleSetting: Toggling ${settingName}, current: ${currentValueRaw} (${currentValue}), new: ${!currentValue}`); // Debug log

  const allowedSettings = ["isAudioPlayerVisible", "isShopVisible", "isSocialLinksVisible", "isYoutubeVisible", "youtubeAutoScroll", "heroSliderEnabled", "heroKenBurnsEffect"];
  if (!allowedSettings.includes(settingName)) {
    console.log(`toggleSetting: Invalid setting name ${settingName}`);
    return { success: false };
  }

  await prisma.siteSettings.update({ where: { id: settings.id }, data: { [settingName]: !currentValue } });

  const username = await getCurrentUsername();
  await logAdminAction(username, "UPDATE_SITE_SETTING", `Changed ${settingName} from ${currentValue} to ${!currentValue}`);

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

// ========================================
// PAGE COMPONENT
// ========================================
export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login");
  }

  const artistName = "Heiraza"; // Hardcoded for single-artist site
  const [stats, videos, tracks, galleryImages, siteSettings] = await Promise.all([
    getStats(), getAllVideos(), getAllTracks(), getAllGalleryImages(), getSiteSettings(),
  ]);

  const username = (session.user as any)?.username || session.user?.name || "Admin";

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="flex max-w-7xl mx-auto px-3 sm:px-4 pb-10 pt-6">
        <aside className="w-64 shrink-0 pr-6 hidden lg:block sticky top-24 h-fit">
          <SidebarNav unreadCount={stats.totalUnread} />
        </aside>

        <main className="flex-1 space-y-8 pt-6">
          <div className="mb-8">
            <h1 className="font-display text-display-sm tracking-wider uppercase">
              Welcome back, {username}
            </h1>
            <p className="text-muted-foreground mt-2">Here's what's happening today.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* TODAY'S OVERVIEW (Featured Card) */}
            <div className="col-span-2 lg:col-span-5 glass-card p-6 flex flex-col sm:flex-row items-center justify-around gap-6 text-center sm:text-left">
              <Link href="/admin/messages" className="flex flex-col items-center sm:items-start gap-1 p-4 -m-4 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer w-full sm:w-auto">
                <span className="text-muted-foreground text-xs uppercase tracking-widest group-hover:text-white transition-colors">Today's Unread</span>
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <div className="p-3 rounded-full bg-accent-coral/10 text-accent-coral group-hover:scale-110 transition-transform">
                    <Mail size={24} />
                  </div>
                  <span className="font-display text-4xl">{stats.todayUnreadMessages}</span>
                </div>
              </Link>

              <div className="hidden sm:block w-px h-12 bg-white/10" />

              <Link href="/admin/visitors" className="flex flex-col items-center sm:items-start gap-1 p-4 -m-4 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer w-full sm:w-auto">
                <span className="text-muted-foreground text-xs uppercase tracking-widest group-hover:text-white transition-colors">Today's Visitors</span>
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <div className="p-3 rounded-full bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                    <Users size={24} />
                  </div>
                  <span className="font-display text-4xl">{stats.todayVisitors}</span>
                </div>
              </Link>

              <div className="hidden sm:block w-px h-12 bg-white/10" />

              <Link href="/admin/subscribers" className="flex flex-col items-center sm:items-start gap-1 p-4 -m-4 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer w-full sm:w-auto">
                <span className="text-muted-foreground text-xs uppercase tracking-widest group-hover:text-white transition-colors">Today's Subscribers</span>
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                    <Bell size={24} />
                  </div>
                  <span className="font-display text-4xl">{stats.todaySubscribers}</span>
                </div>
              </Link>
            </div>

            {/* Active Content Counts */}
            <Link href="#tracks" className="glass-card p-4 sm:p-5 hover-lift transition-all group overflow-hidden min-w-0 w-full">
              <div className="flex justify-between items-start mb-2">
                <Music2 className="text-accent-coral group-hover:scale-110 transition-transform" size={20} />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest">Active</span>
              </div>
              <div className="font-display text-2xl sm:text-3xl">{stats.tracksCount}</div>
              <p className="text-muted-foreground text-sm mt-1">Tracks</p>
            </Link>

            <Link href="#videos" className="glass-card p-4 sm:p-5 hover-lift transition-all group overflow-hidden min-w-0 w-full">
              <div className="flex justify-between items-start mb-2">
                <Youtube className="text-red-500 group-hover:scale-110 transition-transform" size={20} />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest">Active</span>
              </div>
              <div className="font-display text-2xl sm:text-3xl">{stats.videosCount}</div>
              <p className="text-muted-foreground text-sm mt-1">Videos</p>
            </Link>

            <Link href="/admin/events" className="glass-card p-4 sm:p-5 hover-lift transition-all group overflow-hidden min-w-0 w-full">
              <div className="flex justify-between items-start mb-2">
                <Calendar className="text-accent-coral group-hover:scale-110 transition-transform" size={20} />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest">Active</span>
              </div>
              <div className="font-display text-2xl sm:text-3xl">{stats.eventsCount}</div>
              <p className="text-muted-foreground text-sm mt-1">Events</p>
            </Link>

            {siteSettings?.isShopVisible && (
              <Link href="/admin/products/new" className="glass-card p-4 sm:p-5 hover-lift transition-all group overflow-hidden min-w-0 w-full">
                <div className="flex justify-between items-start mb-2">
                  <Package className="text-accent-coral group-hover:scale-110 transition-transform" size={20} />
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest">Active</span>
                </div>
                <div className="font-display text-2xl sm:text-3xl">{stats.productsCount}</div>
                <p className="text-muted-foreground text-sm mt-1">Products</p>
              </Link>
            )}

            <Link href="#gallery" className="glass-card p-4 sm:p-5 hover-lift transition-all group overflow-hidden min-w-0 w-full">
              <div className="flex justify-between items-start mb-2">
                <ImageIcon className="text-accent-coral group-hover:scale-110 transition-transform" size={20} />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest">Active</span>
              </div>
              <div className="font-display text-2xl sm:text-3xl">{stats.galleryCount}</div>
              <p className="text-muted-foreground text-sm mt-1">Gallery</p>
            </Link>

            <Link href="/admin/social-media" className="glass-card p-4 sm:p-5 hover-lift transition-all group overflow-hidden min-w-0 w-full">
              <div className="flex justify-between items-start mb-2">
                <Share2 className="text-accent-coral group-hover:scale-110 transition-transform" size={20} />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest">Visible</span>
              </div>
              <div className="font-display text-2xl sm:text-3xl">{stats.socialCount}</div>
              <p className="text-muted-foreground text-sm mt-1">Socials</p>
            </Link>
          </div>

          <DashboardSection
            id="tracks"
            icon={<Music2 size={24} />}
            title="Audio Player Tracks"
            subtitle={`${tracks.filter(t => t.isActive).length} active / ${tracks.length} total`}
          >
            <TrackManager
              tracks={tracks}
              onAdd={addTrack}
              onToggle={toggleTrackActive}
              onDelete={deleteTrack}
              onMove={moveTrack}
              onReorder={reorderTracks}
              onEdit={updateTrack}
            />
          </DashboardSection>

          <DashboardSection
            id="videos"
            icon={<Youtube size={24} className="text-red-500" />}
            title="YouTube Videos"
            subtitle={`${videos.filter(v => v.isActive).length} active / ${videos.length} total`}
          >
            <VideoManager videos={videos} onAdd={addVideo} onToggle={toggleVideoActive} onDelete={deleteVideo} onReorder={reorderVideos} />
          </DashboardSection>

          <DashboardSection
            id="gallery"
            icon={<ImageIcon size={24} />}
            title="Photo Gallery"
            subtitle={`${galleryImages.filter(i => i.isActive).length} active / ${galleryImages.length} total`}
          >
            <GalleryManager images={galleryImages} onAdd={addGalleryImage} onAddMultiple={addMultipleGalleryImages} onToggle={toggleGalleryImageActive} onDelete={deleteGalleryImage} onMove={moveGalleryImage} />
          </DashboardSection>

          <DashboardSection
            id="settings"
            icon={<Settings size={24} />}
            title="Site Settings"
            subtitle="Control visibility of sections across your website"
          >
            <SiteSettingsManager settings={siteSettings} onToggle={toggleSetting} />
          </DashboardSection>

          <SectionOpener />
        </main>
      </div>
    </div>
  );
}
