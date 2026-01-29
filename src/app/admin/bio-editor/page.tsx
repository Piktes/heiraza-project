import Link from "next/link";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { logAction } from "@/lib/logger";
import { ThemeToggle } from "@/components/theme-toggle";
import { BioEditor } from "@/components/admin/bio-editor";
import { Music2, ArrowUpRight, Home, FileText } from "lucide-react";

async function getArtist() {
    return prisma.artist.findFirst({
        include: {
            bioImages: {
                orderBy: { sortOrder: "asc" },
            },
        },
    });
}

// Server action to save bio
async function saveBio(formData: FormData) {
    "use server";
    const bio = formData.get("bio") as string;

    const artist = await prisma.artist.findFirst();
    if (artist) {
        await prisma.artist.update({
            where: { id: artist.id },
            data: { bio },
        });

        // Log the bio update action
        logAction(
            "Sahadmin",
            "UPDATE_BIO",
            `Updated artist biography (${bio.length} characters)`
        );
    }

    revalidatePath("/admin/bio-editor");
}

// Server action to add image
async function addBioImage(formData: FormData) {
    "use server";
    const imageUrl = formData.get("imageUrl") as string;
    const caption = formData.get("caption") as string | null;

    const artist = await prisma.artist.findFirst();
    if (!artist) return;

    const maxOrder = await prisma.bioImage.findFirst({
        where: { artistId: artist.id },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
    });

    await prisma.bioImage.create({
        data: {
            artistId: artist.id,
            imageUrl,
            caption: caption || null,
            sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
        },
    });

    // Log the image addition
    logAction(
        "Sahadmin",
        "ADD_BIO_IMAGE",
        `Added bio image${caption ? `: "${caption}"` : ""}`
    );

    revalidatePath("/admin/bio-editor");
}

// Server action to delete image
async function deleteBioImage(formData: FormData) {
    "use server";
    const id = parseInt(formData.get("id") as string);
    await prisma.bioImage.delete({ where: { id } });

    // Log the image deletion
    logAction(
        "Sahadmin",
        "DELETE_BIO_IMAGE",
        `Deleted bio image ID: ${id}`
    );

    revalidatePath("/admin/bio-editor");
}

// Server action to reorder images
async function reorderBioImages(formData: FormData) {
    "use server";
    const order = JSON.parse(formData.get("order") as string) as number[];

    await Promise.all(
        order.map((id, index) =>
            prisma.bioImage.update({
                where: { id },
                data: { sortOrder: index },
            })
        )
    );

    revalidatePath("/admin/bio-editor");
}

export default async function BioEditorPage() {
    const artist = await getArtist();

    return (
        <div className="min-h-screen gradient-warm-bg grain">
            <header className="sticky top-0 z-50 px-4 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between">
                        <Link href="/admin" className="flex items-center gap-2">
                            <Music2 size={24} className="text-accent-coral" />
                            <span className="font-display text-xl tracking-widest uppercase">{artist?.name || "Heiraza"}</span>
                            <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground ml-2 px-2 py-1 bg-muted rounded-full">Admin</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <Link href="/" target="_blank" className="btn-ghost flex items-center gap-2 text-sm">View Site <ArrowUpRight size={14} /></Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 pb-10">
                {/* Back Link */}
                <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <Home size={16} />
                    <span>Back to Dashboard</span>
                </Link>

                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="font-display text-display-md tracking-wider uppercase flex items-center gap-3">
                        <FileText className="text-accent-coral" size={32} />
                        Bio Editor
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Edit your biography text and manage bio images. Drag images to reorder them.
                    </p>
                </div>

                {/* Bio Editor Component */}
                <BioEditor
                    initialBio={artist?.bio || ""}
                    initialImages={artist?.bioImages || []}
                    saveBioAction={saveBio}
                    addImageAction={addBioImage}
                    deleteImageAction={deleteBioImage}
                    reorderAction={reorderBioImages}
                />
            </div>
        </div>
    );
}
