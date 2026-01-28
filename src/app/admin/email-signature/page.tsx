import Link from "next/link";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ThemeToggle } from "@/components/theme-toggle";
import { Music2, ArrowUpRight, Home, Mail, Save, AlertCircle } from "lucide-react";
import { SignatureEditor } from "@/components/admin/signature-editor";

async function getSignature() {
    return prisma.emailSignature.findFirst({
        orderBy: { updatedAt: "desc" },
    });
}

async function getArtist() {
    return prisma.artist.findFirst();
}

// Server action to save signature
async function saveSignature(formData: FormData) {
    "use server";
    const content = formData.get("content") as string;
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
}

export default async function EmailSignaturePage() {
    const [signature, artist] = await Promise.all([
        getSignature(),
        getArtist(),
    ]);

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
