"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-logger";

// Helper to get current username from session
async function getCurrentUsername(): Promise<string> {
    const session = await getServerSession(authOptions);
    return (session?.user as any)?.username || "Unknown";
}

// ========================================
// GET ACTIVE GALLERY IMAGES (Frontend)
// ========================================
export async function getActiveGalleryImages() {
    return await prisma.galleryImage.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
    });
}

// ========================================
// GET ALL GALLERY IMAGES (Admin)
// ========================================
export async function getAllGalleryImages() {
    return await prisma.galleryImage.findMany({
        orderBy: { sortOrder: "asc" },
    });
}

// ========================================
// ADD GALLERY IMAGE
// ========================================
export async function addGalleryImage(formData: FormData) {
    const title = formData.get("title") as string;
    const caption = formData.get("caption") as string;
    const category = formData.get("category") as string;
    const imageData = formData.get("imageData") as string;
    const imageFile = formData.get("imageFile") as File | null;

    let imageUrl = "";

    // Handle base64 image upload
    if (imageData && imageData.startsWith("data:image")) {
        const result = await uploadBase64Image(imageData);
        if (result.success && result.url) {
            imageUrl = result.url;
        } else {
            return { success: false, error: result.error || "Failed to upload image" };
        }
    }
    // Handle file upload
    else if (imageFile && imageFile.size > 0) {
        const result = await uploadImageFile(imageFile);
        if (result.success && result.url) {
            imageUrl = result.url;
        } else {
            return { success: false, error: result.error || "Failed to upload image" };
        }
    }

    if (!imageUrl) {
        return { success: false, error: "No image provided" };
    }

    // Get highest sortOrder
    const lastImage = await prisma.galleryImage.findFirst({
        orderBy: { sortOrder: "desc" },
    });
    const newSortOrder = (lastImage?.sortOrder || 0) + 1;

    const image = await prisma.galleryImage.create({
        data: {
            imageUrl,
            title: title || null,
            caption: caption || null,
            category: category || null,
            sortOrder: newSortOrder,
            isActive: true,
        },
    });

    const username = await getCurrentUsername();
    await logAdminAction(username, "CREATE_GALLERY_IMAGE", `Added gallery image: ${title || "Untitled"}`);

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true, image };
}

// ========================================
// ADD MULTIPLE GALLERY IMAGES
// ========================================
export async function addMultipleGalleryImages(formData: FormData) {
    const imageDataList = formData.getAll("imageData") as string[];
    const category = formData.get("category") as string;

    if (!imageDataList || imageDataList.length === 0) {
        return { success: false, error: "No images provided" };
    }

    let lastImage = await prisma.galleryImage.findFirst({
        orderBy: { sortOrder: "desc" },
    });
    let sortOrder = (lastImage?.sortOrder || 0) + 1;

    const uploadedImages = [];
    const errors = [];

    for (const imageData of imageDataList) {
        if (!imageData.startsWith("data:image")) continue;

        const result = await uploadBase64Image(imageData);
        if (result.success && result.url) {
            const image = await prisma.galleryImage.create({
                data: {
                    imageUrl: result.url,
                    category: category || null,
                    sortOrder: sortOrder++,
                    isActive: true,
                },
            });
            uploadedImages.push(image);
        } else {
            errors.push(result.error);
        }
    }

    revalidatePath("/admin");
    revalidatePath("/");

    if (uploadedImages.length === 0) {
        return { success: false, error: "Failed to upload any images" };
    }

    const username = await getCurrentUsername();
    await logAdminAction(username, "CREATE_GALLERY_IMAGE", `Added ${uploadedImages.length} gallery images`);

    return {
        success: true,
        uploadedCount: uploadedImages.length,
        errorCount: errors.length,
    };
}

// ========================================
// UPDATE GALLERY IMAGE
// ========================================
export async function updateGalleryImage(formData: FormData) {
    const id = parseInt(formData.get("id") as string);
    const title = formData.get("title") as string;
    const caption = formData.get("caption") as string;
    const category = formData.get("category") as string;
    const isActive = formData.get("isActive") === "true";

    if (!id) {
        return { success: false, error: "Invalid ID" };
    }

    await prisma.galleryImage.update({
        where: { id },
        data: {
            title: title || null,
            caption: caption || null,
            category: category || null,
            isActive,
        },
    });

    const username = await getCurrentUsername();
    await logAdminAction(username, "UPDATE_GALLERY_IMAGE", `Updated gallery image: ${title || "ID " + id}`);

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
}

// ========================================
// TOGGLE GALLERY IMAGE ACTIVE
// ========================================
export async function toggleGalleryImageActive(formData: FormData) {
    const id = parseInt(formData.get("id") as string);
    const currentStatus = formData.get("isActive") === "true";

    const image = await prisma.galleryImage.update({
        where: { id },
        data: { isActive: !currentStatus },
    });

    const username = await getCurrentUsername();
    await logAdminAction(username, "TOGGLE_GALLERY_IMAGE", `${!currentStatus ? "Enabled" : "Disabled"} gallery image: ${image.title || "ID " + id}`);

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
}

// ========================================
// DELETE GALLERY IMAGE
// ========================================
export async function deleteGalleryImage(formData: FormData) {
    const id = parseInt(formData.get("id") as string);

    const image = await prisma.galleryImage.findUnique({ where: { id } });

    if (image) {
        // Try to delete the file
        if (image.imageUrl.startsWith("/uploads/")) {
            try {
                const filepath = path.join(process.cwd(), "public", image.imageUrl);
                await unlink(filepath);
            } catch (e) {
                // File might not exist, continue anyway
            }
        }

        await prisma.galleryImage.delete({ where: { id } });

        const username = await getCurrentUsername();
        await logAdminAction(username, "DELETE_GALLERY_IMAGE", `Deleted gallery image: ${image.title || "ID " + id}`, { level: "WARN" });
    }

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
}

// ========================================
// HELPER: Upload base64 image
// ========================================
async function uploadBase64Image(base64Data: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        if (!base64Data || !base64Data.startsWith("data:image")) {
            return { success: false, error: "Invalid image data" };
        }

        const uploadsDir = path.join(process.cwd(), "public", "uploads", "gallery");
        await mkdir(uploadsDir, { recursive: true });

        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Content, "base64");

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);

        // Detect image type from base64
        const mimeType = base64Data.split(";")[0].split("/")[1] || "jpeg";
        const ext = mimeType === "jpeg" ? "jpg" : mimeType;

        const filename = `gallery-${timestamp}-${randomStr}.${ext}`;
        const filepath = path.join(uploadsDir, filename);

        await writeFile(filepath, buffer);

        return { success: true, url: `/uploads/gallery/${filename}` };
    } catch (error) {
        console.error("Error uploading image:", error);
        return { success: false, error: "Failed to upload image" };
    }
}

// ========================================
// HELPER: Upload image file
// ========================================
async function uploadImageFile(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        if (!file.type.startsWith("image/")) {
            return { success: false, error: "Invalid file type, please upload an image" };
        }

        const uploadsDir = path.join(process.cwd(), "public", "uploads", "gallery");
        await mkdir(uploadsDir, { recursive: true });

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `gallery-${timestamp}-${randomStr}.${ext}`;
        const filepath = path.join(uploadsDir, filename);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        return { success: true, url: `/uploads/gallery/${filename}` };
    } catch (error) {
        console.error("Error uploading file:", error);
        return { success: false, error: "Failed to upload file" };
    }
}
