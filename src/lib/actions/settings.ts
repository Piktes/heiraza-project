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
// GET SITE SETTINGS
// ========================================
export async function getSiteSettings() {
  let settings = await prisma.siteSettings.findFirst();

  // Create default settings if none exist
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {
        isAudioPlayerVisible: true,
        isShopVisible: true,
        isSocialLinksVisible: true,
        isYoutubeVisible: true,
        youtubeAutoScroll: true,
        youtubeScrollInterval: 2000,
        heroSliderEnabled: true,
        heroSliderInterval: 5000,
        heroKenBurnsEffect: true,
      },
    });
  }

  return settings;
}

// ========================================
// UPDATE SITE SETTINGS
// ========================================
export async function updateSiteSettings(formData: FormData) {
  const settings = await prisma.siteSettings.findFirst();
  if (!settings) return { success: false, error: "Settings not found" };

  const isAudioPlayerVisible = formData.get("isAudioPlayerVisible") === "true";
  const isShopVisible = formData.get("isShopVisible") === "true";
  const isSocialLinksVisible = formData.get("isSocialLinksVisible") === "true";
  const isYoutubeVisible = formData.get("isYoutubeVisible") === "true";
  const youtubeAutoScroll = formData.get("youtubeAutoScroll") === "true";
  const youtubeScrollInterval = parseInt(formData.get("youtubeScrollInterval") as string) || 2000;
  const heroSliderEnabled = formData.get("heroSliderEnabled") === "true";
  const heroSliderInterval = parseInt(formData.get("heroSliderInterval") as string) || 5000;
  const heroKenBurnsEffect = formData.get("heroKenBurnsEffect") === "true";

  await prisma.siteSettings.update({
    where: { id: settings.id },
    data: {
      isAudioPlayerVisible,
      isShopVisible,
      isSocialLinksVisible,
      isYoutubeVisible,
      youtubeAutoScroll,
      youtubeScrollInterval,
      heroSliderEnabled,
      heroSliderInterval,
      heroKenBurnsEffect,
    },
  });

  const username = await getCurrentUsername();
  await logAdminAction(username, "UPDATE_SETTINGS", "Updated site settings");

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");

  return { success: true };
}

// ========================================
// TOGGLE SINGLE SETTING
// ========================================
export async function toggleSetting(formData: FormData) {
  const settings = await prisma.siteSettings.findFirst();
  if (!settings) return { success: false, error: "Settings not found" };

  const settingName = formData.get("settingName") as string;
  const currentValue = formData.get("currentValue") === "true";

  // Only allow toggling boolean settings
  const allowedSettings = [
    "isAudioPlayerVisible",
    "isShopVisible",
    "isSocialLinksVisible",
    "isYoutubeVisible",
    "youtubeAutoScroll",
    "heroSliderEnabled",
    "heroKenBurnsEffect",
  ];

  if (!allowedSettings.includes(settingName)) {
    return { success: false, error: "Invalid setting" };
  }

  await prisma.siteSettings.update({
    where: { id: settings.id },
    data: { [settingName]: !currentValue },
  });

  const username = await getCurrentUsername();
  await logAdminAction(username, "UPDATE_SITE_SETTING", `Toggled ${settingName}: ${!currentValue}`);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");

  return { success: true };
}
