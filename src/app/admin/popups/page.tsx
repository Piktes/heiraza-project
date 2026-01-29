import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { PopupManager } from "@/components/admin/popup-manager";
import { InfoBar } from "@/components/admin/info-bar";

export const dynamic = "force-dynamic";

// ========================================
// DATA FETCHING
// ========================================
async function getPopups() {
    return await prisma.specialEvent.findMany({
        orderBy: { createdAt: "desc" },
    });
}

// ========================================
// SERVER ACTIONS
// ========================================
async function addPopup(formData: FormData) {
    "use server";
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");

    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const linkUrl = formData.get("linkUrl") as string;
    const linkText = formData.get("linkText") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const imageData = formData.get("imageData") as string;

    if (!title || !message || !startDate || !endDate) {
        return { success: false, error: "Required fields missing" };
    }

    let imageUrl = null;

    if (imageData && imageData.startsWith("data:image")) {
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "popups");
        await mkdir(uploadsDir, { recursive: true });

        const base64Content = imageData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Content, "base64");
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const filename = `popup-${timestamp}-${randomStr}.jpg`;
        await writeFile(path.join(uploadsDir, filename), buffer);
        imageUrl = `/uploads/popups/${filename}`;
    }

    await prisma.specialEvent.create({
        data: {
            title,
            message,
            imageUrl,
            linkUrl: linkUrl || null,
            linkText: linkText || null,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isActive: true,
        },
    });

    revalidatePath("/admin/popups");
    revalidatePath("/");
    return { success: true };
}

async function togglePopup(formData: FormData) {
    "use server";
    const id = parseInt(formData.get("id") as string);
    const currentStatus = formData.get("isActive") === "true";

    await prisma.specialEvent.update({
        where: { id },
        data: { isActive: !currentStatus },
    });

    revalidatePath("/admin/popups");
    revalidatePath("/");
}

async function deletePopup(formData: FormData) {
    "use server";
    const { unlink } = await import("fs/promises");
    const path = await import("path");

    const id = parseInt(formData.get("id") as string);
    const popup = await prisma.specialEvent.findUnique({ where: { id } });

    if (popup) {
        if (popup.imageUrl?.startsWith("/uploads/")) {
            try {
                await unlink(path.join(process.cwd(), "public", popup.imageUrl));
            } catch (e) { /* ignore */ }
        }
        await prisma.specialEvent.delete({ where: { id } });
    }

    revalidatePath("/admin/popups");
    revalidatePath("/");
}

async function updatePopup(formData: FormData) {
    "use server";
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");

    const id = parseInt(formData.get("id") as string);
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const linkUrl = formData.get("linkUrl") as string;
    const linkText = formData.get("linkText") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const imageData = formData.get("imageData") as string;
    const keepExistingImage = formData.get("keepExistingImage") === "true";

    if (!title || !message || !startDate) {
        return { success: false, error: "Required fields missing" };
    }

    const existing = await prisma.specialEvent.findUnique({ where: { id } });
    if (!existing) {
        return { success: false, error: "Popup not found" };
    }

    let imageUrl = keepExistingImage ? existing.imageUrl : null;

    if (imageData && imageData.startsWith("data:image")) {
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "popups");
        await mkdir(uploadsDir, { recursive: true });

        const base64Content = imageData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Content, "base64");
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const filename = `popup-${timestamp}-${randomStr}.jpg`;
        await writeFile(path.join(uploadsDir, filename), buffer);
        imageUrl = `/uploads/popups/${filename}`;
    }

    await prisma.specialEvent.update({
        where: { id },
        data: {
            title,
            message,
            imageUrl,
            linkUrl: linkUrl || null,
            linkText: linkText || null,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : new Date("2099-12-31"),
        },
    });

    revalidatePath("/admin/popups");
    revalidatePath("/");
    return { success: true };
}

// ========================================
// PAGE COMPONENT
// ========================================
export default async function PopupsPage() {
    const popups = await getPopups();
    const activeCount = popups.filter(p => p.isActive).length;

    return (
        <div className="min-h-screen">
            {/* InfoBar */}
            <InfoBar counter={`${activeCount}/${popups.length} active`} />

            <main className="max-w-5xl mx-auto px-4 pb-10">
                <div className="mb-8">
                    <h1 className="font-display text-display-md tracking-wider uppercase">Popup Manager</h1>
                    <p className="text-muted-foreground mt-2">Create and schedule promotional popups for your website.</p>
                </div>

                <PopupManager
                    popups={popups}
                    onAdd={addPopup}
                    onUpdate={updatePopup}
                    onToggle={togglePopup}
                    onDelete={deletePopup}
                />
            </main>
        </div>
    );
}
