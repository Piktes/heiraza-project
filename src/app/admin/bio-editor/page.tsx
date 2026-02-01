import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { logAction } from "@/lib/logger";
import { BioEditor } from "@/components/admin/bio-editor";
import { InfoBar } from "@/components/admin/info-bar";
import { FileText } from "lucide-react";

async function getBio() {
    return prisma.bio.findFirst({
        include: {
            images: {
                orderBy: { sortOrder: "asc" }
            }
        }
    });
}

// Server action to save bio
async function saveBio(formData: FormData) {
    "use server";
    const bioContent = formData.get("bio") as string;

    const bio = await prisma.bio.findFirst();
    if (bio) {
        await prisma.bio.update({
            where: { id: bio.id },
            data: { content: bioContent },
        });

        logAction(
            "Sahadmin",
            "UPDATE_BIO",
            `Updated artist biography`
        );
    } else {
        // Create if doesn't exist (bootstrapping)
        await prisma.bio.create({
            data: { content: bioContent, isActive: true }
        });
    }

    revalidatePath("/admin/bio-editor");
}

// Server action to ADD a new image
async function addBioImage(formData: FormData) {
    "use server";
    const imageUrl = formData.get("imageUrl") as string;

    // Ensure Bio record exists
    let bio = await prisma.bio.findFirst();
    if (!bio) {
        bio = await prisma.bio.create({ data: { isActive: true } });
    }

    await prisma.bioImage.create({
        data: {
            bioId: bio.id,
            imageUrl,
            caption: "",
            sortOrder: 99 // Default to end
        }
    });

    logAction("Sahadmin", "ADD_BIO_IMAGE", "Added new bio image");
    revalidatePath("/admin/bio-editor");
}

// Server action to DELETE an image
async function deleteBioImage(formData: FormData) {
    "use server";
    const id = parseInt(formData.get("id") as string);
    if (!id) return;

    await prisma.bioImage.delete({
        where: { id }
    });

    logAction("Sahadmin", "DELETE_BIO_IMAGE", `Deleted bio image ${id}`);
    revalidatePath("/admin/bio-editor");
}

// Server action to REORDER images
async function reorderBioImages(formData: FormData) {
    "use server";
    const orderJson = formData.get("order") as string;
    const order = JSON.parse(orderJson) as number[];

    const updatePromises = order.map((id, index) =>
        prisma.bioImage.update({
            where: { id },
            data: { sortOrder: index }
        })
    );

    await Promise.all(updatePromises);
    revalidatePath("/admin/bio-editor");
}

export default async function BioEditorPage() {
    const bio = await getBio();

    /* 
       MIGRATION NOTE: If specific logic is needed to migrate the old single `imageUrl` 
       to the new `BioImage` table, it can be done via a script or manually. 
       For now, we start fresh or rely on `images` array.
    */

    return (
        <div className="min-h-screen">
            <InfoBar counter="Bio Management" />

            <div className="max-w-4xl mx-auto px-4 pb-10">
                <div className="mb-6">
                    <h1 className="font-display text-display-md tracking-wider uppercase flex items-center gap-3">
                        <FileText className="text-accent-coral" size={32} />
                        Bio Editor
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Edit your biography text and manage gallery images.
                    </p>
                </div>

                <BioEditor
                    initialBio={bio?.content || ""}
                    initialImages={bio?.images || []}
                    saveBioAction={saveBio}
                    addImageAction={addBioImage}
                    deleteImageAction={deleteBioImage}
                    reorderAction={reorderBioImages}
                />
            </div>
        </div>
    );
}
