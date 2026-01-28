import Link from "next/link";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ThemeToggle } from "@/components/theme-toggle";
import { AutoReplyManager } from "@/components/admin/auto-reply-manager";
import { Home, ArrowLeft, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

async function getSiteSettings() {
    return await prisma.siteSettings.findFirst();
}

async function updateAutoReplySettings(formData: FormData) {
    "use server";

    // Contact form settings
    const contactImage = formData.get("contactImage") as string | null;
    const contactTitle = formData.get("contactTitle") as string | null;
    const contactMessage = formData.get("contactMessage") as string | null;

    // Newsletter settings
    const subscribeImage = formData.get("subscribeImage") as string | null;
    const subscribeTitle = formData.get("subscribeTitle") as string | null;
    const subscribeMessage = formData.get("subscribeMessage") as string | null;

    // Get existing settings
    const settings = await prisma.siteSettings.findFirst();

    if (settings) {
        await prisma.siteSettings.update({
            where: { id: settings.id },
            data: {
                contactSuccessImage: contactImage || null,
                contactSuccessTitle: contactTitle || null,
                contactSuccessMessage: contactMessage || null,
                subscribeSuccessImage: subscribeImage || null,
                subscribeSuccessTitle: subscribeTitle || null,
                subscribeSuccessMessage: subscribeMessage || null,
            },
        });
    }

    revalidatePath("/admin/auto-reply");
    revalidatePath("/");
}

export default async function AutoReplyPage() {
    const settings = await getSiteSettings();

    return (
        <div className="min-h-screen bg-background grain">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-3">
                            <MessageSquare className="text-accent-coral" size={24} />
                            <h1 className="font-display text-2xl tracking-wide">Auto Reply Settings</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link href="/" className="btn-ghost text-sm flex items-center gap-2">
                            <Home size={16} /> View Site
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-10">
                <p className="text-muted-foreground mb-8">
                    Configure the success popups that appear after users submit the contact form or subscribe to the newsletter.
                </p>

                <AutoReplyManager
                    contactImage={settings?.contactSuccessImage || null}
                    contactTitle={settings?.contactSuccessTitle || null}
                    contactMessage={settings?.contactSuccessMessage || null}
                    subscribeImage={settings?.subscribeSuccessImage || null}
                    subscribeTitle={settings?.subscribeSuccessTitle || null}
                    subscribeMessage={settings?.subscribeSuccessMessage || null}
                    onSave={updateAutoReplySettings}
                />
            </main>
        </div>
    );
}
