import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { HeroImageManager } from "@/components/admin/hero-image-manager";
import { InfoBar } from "@/components/admin/info-bar";

export const dynamic = "force-dynamic";

// ========================================
// DATA FETCHING
// ========================================
async function getHeroImages() {
    const artist = await prisma.artist.findFirst();
    if (!artist) return [];

    return await prisma.heroImage.findMany({
        where: { artistId: artist.id },
        orderBy: { sortOrder: "asc" },
    });
}

async function getSiteSettings() {
    let settings = await prisma.siteSettings.findFirst();
    if (!settings) {
        settings = await prisma.siteSettings.create({
            data: { heroSliderInterval: 5000 },
        });
    }
    return settings;
}

async function getArtist() {
    return await prisma.artist.findFirst();
}

// ========================================
// SERVER ACTIONS
// ========================================
async function addHeroImages(formData: FormData) {
    "use server";
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");

    const artist = await prisma.artist.findFirst();
    if (!artist) return { success: false, error: "No artist found" };

    const imageDataList = formData.getAll("imageData") as string[];

    if (!imageDataList || imageDataList.length === 0) {
        return { success: false, error: "No images provided" };
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "hero");
    await mkdir(uploadsDir, { recursive: true });

    // Get current max sort order
    const lastImage = await prisma.heroImage.findFirst({
        where: { artistId: artist.id },
        orderBy: { sortOrder: "desc" },
    });
    let sortOrder = (lastImage?.sortOrder || 0) + 1;

    for (const imageData of imageDataList) {
        if (!imageData.startsWith("data:image")) continue;

        const base64Content = imageData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Content, "base64");
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const filename = `hero-${timestamp}-${randomStr}.jpg`;
        await writeFile(path.join(uploadsDir, filename), buffer);

        await prisma.heroImage.create({
            data: {
                artistId: artist.id,
                imageUrl: `/uploads/hero/${filename}`,
                sortOrder: sortOrder++,
                isActive: true,
            },
        });
    }

    revalidatePath("/admin/hero");
    revalidatePath("/");
    return { success: true };
}

async function toggleHeroImage(formData: FormData) {
    "use server";
    const id = parseInt(formData.get("id") as string);
    const currentStatus = formData.get("isActive") === "true";

    await prisma.heroImage.update({
        where: { id },
        data: { isActive: !currentStatus },
    });

    revalidatePath("/admin/hero");
    revalidatePath("/");
}

async function deleteHeroImage(formData: FormData) {
    "use server";
    const { unlink } = await import("fs/promises");
    const path = await import("path");

    const id = parseInt(formData.get("id") as string);
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
}

async function moveHeroImage(formData: FormData) {
    "use server";
    const id = parseInt(formData.get("id") as string);
    const direction = formData.get("direction") as "up" | "down";

    const artist = await prisma.artist.findFirst();
    if (!artist) return;

    const images = await prisma.heroImage.findMany({
        where: { artistId: artist.id },
        orderBy: { sortOrder: "asc" },
    });

    const currentIndex = images.findIndex(img => img.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    // Swap sort orders
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

    revalidatePath("/admin/hero");
    revalidatePath("/");
}

async function updateSliderSpeed(formData: FormData) {
    "use server";
    const interval = parseInt(formData.get("interval") as string);

    if (isNaN(interval) || interval < 1000 || interval > 20000) {
        return { success: false, error: "Invalid interval" };
    }

    const settings = await prisma.siteSettings.findFirst();
    if (settings) {
        await prisma.siteSettings.update({
            where: { id: settings.id },
            data: { heroSliderInterval: interval },
        });
    }

    revalidatePath("/admin/hero");
    revalidatePath("/");
    return { success: true };
}

// ========================================
// PAGE COMPONENT
// ========================================
export default async function HeroEditorPage() {
    const [heroImages, settings, artist] = await Promise.all([
        getHeroImages(),
        getSiteSettings(),
        getArtist(),
    ]);

    const activeCount = heroImages.filter(img => img.isActive).length;

    return (
        <div className="min-h-screen">
            {/* InfoBar */}
            <InfoBar counter={`${activeCount}/${heroImages.length} active`} />

            <main className="max-w-5xl mx-auto px-4 pb-10">
                <div className="mb-8">
                    <h1 className="font-display text-display-md tracking-wider uppercase">Hero Editor</h1>
                    <p className="text-muted-foreground mt-2">Manage hero slider images. Drag to reorder or use arrows.</p>
                </div>

                <HeroImageManager
                    images={heroImages}
                    sliderInterval={settings.heroSliderInterval}
                    onAddImages={addHeroImages}
                    onToggle={toggleHeroImage}
                    onDelete={deleteHeroImage}
                    onMove={moveHeroImage}
                    onUpdateSpeed={updateSliderSpeed}
                />
            </main>
        </div>
    );
}
