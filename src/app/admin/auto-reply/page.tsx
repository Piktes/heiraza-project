import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { AutoReplyManager } from "@/components/admin/auto-reply-manager";
import { InfoBar } from "@/components/admin/info-bar";
import { MessageSquare } from "lucide-react";

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
        <div className="min-h-screen">
            {/* InfoBar */}
            <InfoBar />

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 pb-10">
                <div className="mb-6">
                    <h1 className="font-display text-display-md tracking-wider uppercase flex items-center gap-3">
                        <MessageSquare className="text-accent-coral" size={32} />
                        Auto Reply Settings
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Configure the success popups that appear after users submit the contact form or subscribe to the newsletter.
                    </p>
                </div>

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
