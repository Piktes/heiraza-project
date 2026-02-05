"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

// ========================================
// HELPER: Upload base64 image to press-kit folder
// ========================================
async function uploadPressKitImage(base64Data: string, subfolder: string = ""): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        if (!base64Data || !base64Data.startsWith("data:image")) {
            return { success: false, error: "Invalid image data" };
        }

        const folderPath = subfolder ? `press-kit/${subfolder}` : "press-kit";
        const uploadsDir = path.join(process.cwd(), "public", "uploads", folderPath);
        await mkdir(uploadsDir, { recursive: true });

        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Content, "base64");

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);

        // Detect image type from base64
        const mimeType = base64Data.split(";")[0].split("/")[1] || "jpeg";
        const ext = mimeType === "jpeg" ? "jpg" : mimeType;

        const filename = `${timestamp}-${randomStr}.${ext}`;
        const filepath = path.join(uploadsDir, filename);

        await writeFile(filepath, buffer);

        return { success: true, url: `/uploads/${folderPath}/${filename}` };
    } catch (error) {
        console.error("Error uploading press kit image:", error);
        return { success: false, error: "Failed to upload image" };
    }
}

// Helper to delete file from uploads
async function deleteUploadFile(url: string): Promise<void> {
    if (url && url.startsWith("/uploads/")) {
        try {
            const filepath = path.join(process.cwd(), "public", url);
            await unlink(filepath);
        } catch (e) {
            // File might not exist, continue anyway
        }
    }
}

// ========================================
// PRESS KIT BIO (Singleton)
// ========================================
export async function getPressKitBio() {
    let bio = await prisma.pressKitBio.findFirst();
    if (!bio) {
        // Auto-create if doesn't exist
        bio = await prisma.pressKitBio.create({
            data: {
                shortBio: "",
                longBio: "",
                showShortBio: true,
                showLongBio: true,
                locale: "en",
            },
        });
    }
    return bio;
}

export async function updatePressKitBio(formData: FormData) {
    const shortBio = formData.get("shortBio") as string;
    const longBio = formData.get("longBio") as string;
    const showShortBio = formData.get("showShortBio") === "true";
    const showLongBio = formData.get("showLongBio") === "true";

    let bio = await prisma.pressKitBio.findFirst();
    if (bio) {
        await prisma.pressKitBio.update({
            where: { id: bio.id },
            data: { shortBio, longBio, showShortBio, showLongBio },
        });
    } else {
        await prisma.pressKitBio.create({
            data: { shortBio, longBio, showShortBio, showLongBio },
        });
    }

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

// ========================================
// PRESS PHOTOS
// ========================================
export async function getAllPressPhotos() {
    return await prisma.pressPhoto.findMany({
        orderBy: { sortOrder: "asc" },
    });
}

export async function getVisiblePressPhotos() {
    return await prisma.pressPhoto.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
    });
}

export async function addPressPhoto(formData: FormData) {
    const imageData = formData.get("imageData") as string;
    const thumbnailData = formData.get("thumbnailData") as string;
    const altText = formData.get("altText") as string;
    const photographerCredit = formData.get("photographerCredit") as string;

    if (!altText) {
        return { success: false, error: "Alt text is required" };
    }

    // Upload original image
    const imageResult = await uploadPressKitImage(imageData, "photos");
    if (!imageResult.success || !imageResult.url) {
        return { success: false, error: imageResult.error || "Failed to upload image" };
    }

    // Upload thumbnail if provided
    let thumbnailUrl: string | null = null;
    if (thumbnailData) {
        const thumbResult = await uploadPressKitImage(thumbnailData, "photos/thumbs");
        if (thumbResult.success && thumbResult.url) {
            thumbnailUrl = thumbResult.url;
        }
    }

    // Get highest sortOrder
    const lastPhoto = await prisma.pressPhoto.findFirst({
        orderBy: { sortOrder: "desc" },
    });
    const newSortOrder = (lastPhoto?.sortOrder || 0) + 1;

    const photo = await prisma.pressPhoto.create({
        data: {
            imageUrl: imageResult.url,
            thumbnailUrl,
            altText,
            photographerCredit: photographerCredit || null,
            sortOrder: newSortOrder,
            isVisible: true,
            isFeatured: false,
        },
    });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true, photo };
}

export async function updatePressPhoto(formData: FormData) {
    const id = parseInt(formData.get("id") as string);
    const altText = formData.get("altText") as string;
    const photographerCredit = formData.get("photographerCredit") as string;
    const isVisible = formData.get("isVisible") === "true";

    if (!id) {
        return { success: false, error: "Invalid ID" };
    }

    await prisma.pressPhoto.update({
        where: { id },
        data: {
            altText,
            photographerCredit: photographerCredit || null,
            isVisible,
        },
    });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

export async function deletePressPhoto(formData: FormData) {
    const id = parseInt(formData.get("id") as string);

    const photo = await prisma.pressPhoto.findUnique({ where: { id } });

    if (photo) {
        // Delete files
        await deleteUploadFile(photo.imageUrl);
        if (photo.thumbnailUrl) {
            await deleteUploadFile(photo.thumbnailUrl);
        }

        await prisma.pressPhoto.delete({ where: { id } });
    }

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

export async function togglePressPhotoVisibility(formData: FormData) {
    const id = parseInt(formData.get("id") as string);
    const currentStatus = formData.get("isVisible") === "true";

    await prisma.pressPhoto.update({
        where: { id },
        data: { isVisible: !currentStatus },
    });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

export async function setFeaturedPhoto(formData: FormData) {
    const id = parseInt(formData.get("id") as string);

    // Unset all featured
    await prisma.pressPhoto.updateMany({
        data: { isFeatured: false },
    });

    // Set this one as featured
    await prisma.pressPhoto.update({
        where: { id },
        data: { isFeatured: true },
    });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

export async function reorderPressPhotos(formData: FormData) {
    const orderData = formData.get("order") as string;
    const order = JSON.parse(orderData) as { id: number; sortOrder: number }[];

    for (const item of order) {
        await prisma.pressPhoto.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
        });
    }

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

// ========================================
// MUSIC HIGHLIGHTS
// ========================================
export async function getAllMusicHighlights() {
    return await prisma.musicHighlight.findMany({
        orderBy: { sortOrder: "asc" },
    });
}

export async function getVisibleMusicHighlights(maxTracks?: number) {
    const settings = await getPressKitSettings();
    const take = maxTracks || settings.maxMusicTracks || 5;

    return await prisma.musicHighlight.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
        take,
    });
}

export async function addMusicHighlight(formData: FormData) {
    const title = formData.get("title") as string;
    const platform = formData.get("platform") as string;
    const embedUrl = formData.get("embedUrl") as string;

    if (!title || !platform || !embedUrl) {
        return { success: false, error: "Title, platform, and embed URL are required" };
    }

    const lastItem = await prisma.musicHighlight.findFirst({
        orderBy: { sortOrder: "desc" },
    });
    const newSortOrder = (lastItem?.sortOrder || 0) + 1;

    const highlight = await prisma.musicHighlight.create({
        data: {
            title,
            platform,
            embedUrl,
            sortOrder: newSortOrder,
            isVisible: true,
        },
    });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true, highlight };
}

export async function updateMusicHighlight(formData: FormData) {
    const id = parseInt(formData.get("id") as string);
    const title = formData.get("title") as string;
    const platform = formData.get("platform") as string;
    const embedUrl = formData.get("embedUrl") as string;
    const isVisible = formData.get("isVisible") === "true";

    if (!id) {
        return { success: false, error: "Invalid ID" };
    }

    await prisma.musicHighlight.update({
        where: { id },
        data: { title, platform, embedUrl, isVisible },
    });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

export async function deleteMusicHighlight(formData: FormData) {
    const id = parseInt(formData.get("id") as string);

    await prisma.musicHighlight.delete({ where: { id } });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

export async function reorderMusicHighlights(formData: FormData) {
    const orderData = formData.get("order") as string;
    const order = JSON.parse(orderData) as { id: number; sortOrder: number }[];

    for (const item of order) {
        await prisma.musicHighlight.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
        });
    }

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

// ========================================
// PRESS KIT VIDEOS
// ========================================
export async function getAllPressKitVideos() {
    return await prisma.pressKitVideo.findMany({
        orderBy: { sortOrder: "asc" },
    });
}

export async function getVisiblePressKitVideos() {
    return await prisma.pressKitVideo.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
    });
}

export async function addPressKitVideo(formData: FormData) {
    const title = formData.get("title") as string;
    const videoUrl = formData.get("videoUrl") as string;
    const thumbnailData = formData.get("thumbnailData") as string;

    if (!title || !videoUrl) {
        return { success: false, error: "Title and video URL are required" };
    }

    // Upload thumbnail if provided
    let thumbnailUrl: string | null = null;
    if (thumbnailData && thumbnailData.startsWith("data:image")) {
        const thumbResult = await uploadPressKitImage(thumbnailData, "videos/thumbs");
        if (thumbResult.success && thumbResult.url) {
            thumbnailUrl = thumbResult.url;
        }
    }

    const lastItem = await prisma.pressKitVideo.findFirst({
        orderBy: { sortOrder: "desc" },
    });
    const newSortOrder = (lastItem?.sortOrder || 0) + 1;

    const video = await prisma.pressKitVideo.create({
        data: {
            title,
            videoUrl,
            thumbnailUrl,
            sortOrder: newSortOrder,
            isVisible: true,
        },
    });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true, video };
}

export async function updatePressKitVideo(formData: FormData) {
    const id = parseInt(formData.get("id") as string);
    const title = formData.get("title") as string;
    const videoUrl = formData.get("videoUrl") as string;
    const isVisible = formData.get("isVisible") === "true";

    if (!id) {
        return { success: false, error: "Invalid ID" };
    }

    await prisma.pressKitVideo.update({
        where: { id },
        data: { title, videoUrl, isVisible },
    });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

export async function deletePressKitVideo(formData: FormData) {
    const id = parseInt(formData.get("id") as string);

    const video = await prisma.pressKitVideo.findUnique({ where: { id } });

    if (video) {
        // Delete thumbnail if exists
        if (video.thumbnailUrl) {
            await deleteUploadFile(video.thumbnailUrl);
        }
        await prisma.pressKitVideo.delete({ where: { id } });
    }

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

export async function reorderPressKitVideos(formData: FormData) {
    const orderData = formData.get("order") as string;
    const order = JSON.parse(orderData) as { id: number; sortOrder: number }[];

    for (const item of order) {
        await prisma.pressKitVideo.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
        });
    }

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

// ========================================
// PRESS QUOTE CATEGORIES
// ========================================
export async function getAllQuoteCategories() {
    return await prisma.pressQuoteCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: { quotes: true },
    });
}

export async function getVisibleQuoteCategories() {
    return await prisma.pressQuoteCategory.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
        include: {
            quotes: {
                where: { isVisible: true },
                orderBy: { sortOrder: "asc" },
            },
        },
    });
}

export async function addQuoteCategory(formData: FormData) {
    const name = formData.get("name") as string;

    if (!name) {
        return { success: false, error: "Category name is required" };
    }

    const lastItem = await prisma.pressQuoteCategory.findFirst({
        orderBy: { sortOrder: "desc" },
    });
    const newSortOrder = (lastItem?.sortOrder || 0) + 1;

    const category = await prisma.pressQuoteCategory.create({
        data: {
            name,
            sortOrder: newSortOrder,
            isVisible: true,
        },
    });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true, category };
}

export async function updateQuoteCategory(formData: FormData) {
    const id = parseInt(formData.get("id") as string);
    const name = formData.get("name") as string;
    const isVisible = formData.get("isVisible") === "true";

    if (!id) {
        return { success: false, error: "Invalid ID" };
    }

    await prisma.pressQuoteCategory.update({
        where: { id },
        data: { name, isVisible },
    });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

export async function deleteQuoteCategory(formData: FormData) {
    const id = parseInt(formData.get("id") as string);

    // Check if category has quotes
    const quotesCount = await prisma.pressQuote.count({
        where: { categoryId: id },
    });

    if (quotesCount > 0) {
        return {
            success: false,
            error: `Cannot delete category with ${quotesCount} quotes. Please delete or reassign quotes first.`,
        };
    }

    await prisma.pressQuoteCategory.delete({ where: { id } });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

// ========================================
// PRESS QUOTES
// ========================================
export async function getAllQuotes() {
    return await prisma.pressQuote.findMany({
        orderBy: { sortOrder: "asc" },
        include: { category: true },
    });
}

export async function addQuote(formData: FormData) {
    const quoteText = formData.get("quoteText") as string;
    const sourceName = formData.get("sourceName") as string;
    const sourceUrl = formData.get("sourceUrl") as string;
    const categoryId = parseInt(formData.get("categoryId") as string);

    if (!quoteText || !sourceName || !categoryId) {
        return { success: false, error: "Quote text, source name, and category are required" };
    }

    const lastItem = await prisma.pressQuote.findFirst({
        where: { categoryId },
        orderBy: { sortOrder: "desc" },
    });
    const newSortOrder = (lastItem?.sortOrder || 0) + 1;

    const quote = await prisma.pressQuote.create({
        data: {
            quoteText,
            sourceName,
            sourceUrl: sourceUrl || null,
            categoryId,
            sortOrder: newSortOrder,
            isVisible: true,
        },
    });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true, quote };
}

export async function updateQuote(formData: FormData) {
    const id = parseInt(formData.get("id") as string);
    const quoteText = formData.get("quoteText") as string;
    const sourceName = formData.get("sourceName") as string;
    const sourceUrl = formData.get("sourceUrl") as string;
    const categoryId = parseInt(formData.get("categoryId") as string);
    const isVisible = formData.get("isVisible") === "true";

    if (!id) {
        return { success: false, error: "Invalid ID" };
    }

    await prisma.pressQuote.update({
        where: { id },
        data: {
            quoteText,
            sourceName,
            sourceUrl: sourceUrl || null,
            categoryId,
            isVisible,
        },
    });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

export async function deleteQuote(formData: FormData) {
    const id = parseInt(formData.get("id") as string);

    await prisma.pressQuote.delete({ where: { id } });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

export async function toggleQuoteVisibility(formData: FormData) {
    const id = parseInt(formData.get("id") as string);
    const currentStatus = formData.get("isVisible") === "true";

    await prisma.pressQuote.update({
        where: { id },
        data: { isVisible: !currentStatus },
    });

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

// ========================================
// PRESS KIT CONTACT (Singleton)
// ========================================
export async function getPressKitContact() {
    let contact = await prisma.pressKitContact.findFirst();
    if (!contact) {
        contact = await prisma.pressKitContact.create({
            data: {
                bookingEmail: "",
                pressEmail: "",
                baseLocation: "",
                showBookingEmail: true,
                showPressEmail: true,
                showBaseLocation: true,
            },
        });
    }
    return contact;
}

export async function updatePressKitContact(formData: FormData) {
    const bookingEmail = formData.get("bookingEmail") as string;
    const pressEmail = formData.get("pressEmail") as string;
    const baseLocation = formData.get("baseLocation") as string;
    const showBookingEmail = formData.get("showBookingEmail") === "true";
    const showPressEmail = formData.get("showPressEmail") === "true";
    const showBaseLocation = formData.get("showBaseLocation") === "true";

    let contact = await prisma.pressKitContact.findFirst();
    if (contact) {
        await prisma.pressKitContact.update({
            where: { id: contact.id },
            data: { bookingEmail, pressEmail, baseLocation, showBookingEmail, showPressEmail, showBaseLocation },
        });
    } else {
        await prisma.pressKitContact.create({
            data: { bookingEmail, pressEmail, baseLocation, showBookingEmail, showPressEmail, showBaseLocation },
        });
    }

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}

// ========================================
// PRESS KIT SETTINGS (Singleton)
// ========================================
export async function getPressKitSettings() {
    let settings = await prisma.pressKitSettings.findFirst();
    if (!settings) {
        settings = await prisma.pressKitSettings.create({
            data: {
                allowPhotoDownload: true,
                maxMusicTracks: 5,
            },
        });
    }
    return settings;
}

export async function updatePressKitSettings(formData: FormData) {
    const allowPhotoDownload = formData.get("allowPhotoDownload") === "true";
    const maxMusicTracks = parseInt(formData.get("maxMusicTracks") as string) || 5;

    let settings = await prisma.pressKitSettings.findFirst();
    if (settings) {
        await prisma.pressKitSettings.update({
            where: { id: settings.id },
            data: { allowPhotoDownload, maxMusicTracks },
        });
    } else {
        await prisma.pressKitSettings.create({
            data: { allowPhotoDownload, maxMusicTracks },
        });
    }

    revalidatePath("/admin/press-kit");
    revalidatePath("/press-kit");

    return { success: true };
}
