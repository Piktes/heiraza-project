import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

// Helper to ensure authenticated
async function requireAuth() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return null;
}

// GET - Fetch all hero images
export async function GET() {
    const authError = await requireAuth();
    if (authError) return authError;

    try {
        const images = await prisma.heroImage.findMany({
            orderBy: { sortOrder: "asc" },
        });

        const settings = await prisma.siteSettings.findFirst();

        return NextResponse.json({
            images,
            sliderInterval: settings?.heroSliderInterval || 5000,
        });
    } catch (error) {
        console.error("Error fetching hero images:", error);
        return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
    }
}

// POST - Add new hero images
export async function POST(request: NextRequest) {
    const authError = await requireAuth();
    if (authError) return authError;

    try {
        const { images: imageDataList } = await request.json();

        if (!imageDataList || imageDataList.length === 0) {
            return NextResponse.json({ error: "No images provided" }, { status: 400 });
        }

        const uploadsDir = path.join(process.cwd(), "public", "uploads", "hero");
        await mkdir(uploadsDir, { recursive: true });

        // Get current max sort order
        const lastImage = await prisma.heroImage.findFirst({
            orderBy: { sortOrder: "desc" },
        });
        let sortOrder = (lastImage?.sortOrder || 0) + 1;

        const createdImages = [];

        for (const imageData of imageDataList) {
            if (!imageData.startsWith("data:image")) continue;

            const base64Content = imageData.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Content, "base64");
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 8);
            const filename = `hero-${timestamp}-${randomStr}.jpg`;
            await writeFile(path.join(uploadsDir, filename), buffer);

            const newImage = await prisma.heroImage.create({
                data: {
                    imageUrl: `/uploads/hero/${filename}`,
                    sortOrder: sortOrder++,
                    isActive: true,
                },
            });
            createdImages.push(newImage);
        }

        revalidatePath("/admin/hero");
        revalidatePath("/");

        return NextResponse.json({ success: true, images: createdImages });
    } catch (error) {
        console.error("Error adding hero images:", error);
        return NextResponse.json({ error: "Failed to add images" }, { status: 500 });
    }
}

// PATCH - Update hero image (toggle, move, update speed)
export async function PATCH(request: NextRequest) {
    const authError = await requireAuth();
    if (authError) return authError;

    try {
        const data = await request.json();
        const { action } = data;

        if (action === "toggle") {
            const { id, isActive } = data;
            await prisma.heroImage.update({
                where: { id },
                data: { isActive: !isActive },
            });
        } else if (action === "move") {
            const { id, direction } = data;
            const images = await prisma.heroImage.findMany({
                orderBy: { sortOrder: "asc" },
            });

            const currentIndex = images.findIndex(img => img.id === id);
            if (currentIndex === -1) {
                return NextResponse.json({ error: "Image not found" }, { status: 404 });
            }

            const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= images.length) {
                return NextResponse.json({ error: "Cannot move further" }, { status: 400 });
            }

            const currentImage = images[currentIndex];
            const targetImage = images[targetIndex];

            await prisma.$transaction([
                prisma.heroImage.update({
                    where: { id: currentImage.id },
                    data: { sortOrder: targetImage.sortOrder },
                }),
                prisma.heroImage.update({
                    where: { id: targetImage.id },
                    data: { sortOrder: currentImage.sortOrder },
                }),
            ]);
        } else if (action === "updateSpeed") {
            const { interval } = data;
            if (isNaN(interval) || interval < 1000 || interval > 20000) {
                return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
            }

            const settings = await prisma.siteSettings.findFirst();
            if (settings) {
                await prisma.siteSettings.update({
                    where: { id: settings.id },
                    data: { heroSliderInterval: interval },
                });
            }
        }

        revalidatePath("/admin/hero");
        revalidatePath("/");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating hero:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

// DELETE - Delete hero image
export async function DELETE(request: NextRequest) {
    const authError = await requireAuth();
    if (authError) return authError;

    try {
        const { id } = await request.json();
        const image = await prisma.heroImage.findUnique({ where: { id } });

        if (image) {
            if (image.imageUrl.startsWith("/uploads/")) {
                try {
                    await unlink(path.join(process.cwd(), "public", image.imageUrl));
                } catch (e) { /* ignore */ }
            }
            await prisma.heroImage.delete({ where: { id } });
        }

        revalidatePath("/admin/hero");
        revalidatePath("/");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting hero image:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
