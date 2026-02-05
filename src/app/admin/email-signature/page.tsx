import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { SignatureEditor } from "@/components/admin/signature-editor";
import { InfoBar } from "@/components/admin/info-bar";
import { Mail, AlertCircle } from "lucide-react";

async function getSignature() {
    return prisma.emailSignature.findFirst({
        orderBy: { updatedAt: "desc" },
    });
}

// Server action to save signature
async function saveSignature(formData: FormData) {
    "use server";

    try {
        const content = formData.get("content") as string || "";
        const logoUrl = formData.get("logoUrl") as string | null;

        const existing = await prisma.emailSignature.findFirst();

        if (existing) {
            await prisma.emailSignature.update({
                where: { id: existing.id },
                data: { content, logoUrl: logoUrl || null },
            });
        } else {
            await prisma.emailSignature.create({
                data: { content, logoUrl: logoUrl || null },
            });
        }

        revalidatePath("/admin/email-signature");
    } catch (error) {
        console.error("Error saving signature:", error);
        throw new Error("Failed to save signature");
    }
}

export default async function EmailSignaturePage() {
    const signature = await getSignature();

    return (
        <div className="min-h-screen">
            {/* InfoBar */}
            <InfoBar />

            <div className="max-w-4xl mx-auto px-4 pb-10">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="font-display text-display-md tracking-wider uppercase flex items-center gap-3">
                        <Mail className="text-accent-coral" size={32} />
                        Email Signature
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Create your custom email signature for replies. This will be automatically added to the bottom of your reply emails.
                    </p>
                </div>

                {/* Info Box */}
                <div className="glass-card p-4 mb-6 flex items-start gap-3 border-l-4 border-l-accent-coral">
                    <AlertCircle className="text-accent-coral shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="font-medium">Signature Tips</p>
                        <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                            <li>• Keep it professional and concise</li>
                            <li>• Include your name, role, and contact info</li>
                            <li>• Uploaded logos will display with <code className="bg-muted px-1 rounded">contain</code> fit (no cropping)</li>
                        </ul>
                    </div>
                </div>

                {/* Signature Editor */}
                <SignatureEditor
                    initialContent={signature?.content || ""}
                    initialLogoUrl={signature?.logoUrl || ""}
                    saveAction={saveSignature}
                />
            </div>
        </div>
    );
}
