import prisma from "@/lib/prisma";
import { HeroImageManager } from "@/components/admin/hero-image-manager";
import { InfoBar } from "@/components/admin/info-bar";

export const dynamic = "force-dynamic";

// ========================================
// DATA FETCHING
// ========================================
async function getHeroImages() {
    return await prisma.heroImage.findMany({
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

// ========================================
// PAGE COMPONENT
// ========================================
export default async function HeroEditorPage() {
    const [heroImages, settings] = await Promise.all([
        getHeroImages(),
        getSiteSettings(),
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
                />
            </main>
        </div>
    );
}

