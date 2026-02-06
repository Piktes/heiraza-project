import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { UserNotificationsManager } from "@/components/admin/user-notifications-manager";
import { InfoBar } from "@/components/admin/info-bar";
import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

async function getSiteSettings() {
    return await prisma.siteSettings.findFirst();
}

async function updateEmailTemplates(formData: FormData) {
    "use server";

    const reminderTemplate = formData.get("reminderTemplate") as string | null;
    const soldOutTemplate = formData.get("soldOutTemplate") as string | null;
    const announcementTemplate = formData.get("announcementTemplate") as string | null;
    const notificationLogoUrl = formData.get("notificationLogoUrl") as string | null;

    const settings = await prisma.siteSettings.findFirst();

    if (settings) {
        await prisma.siteSettings.update({
            where: { id: settings.id },
            data: {
                reminderTemplate: reminderTemplate || null,
                soldOutTemplate: soldOutTemplate || null,
                announcementTemplate: announcementTemplate || null,
                notificationLogoUrl: notificationLogoUrl || null,
            },
        });
    }

    revalidatePath("/admin/user-notifications");
}

export default async function UserNotificationsPage() {
    const settings = await getSiteSettings();

    return (
        <div className="min-h-screen">
            {/* InfoBar */}
            <InfoBar />

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 pb-10">
                <div className="mb-6">
                    <h1 className="font-display text-display-md tracking-wider uppercase flex items-center gap-3">
                        <Bell className="text-accent-coral" size={32} />
                        User Notifications
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Design email templates for automated event notifications. Use variables like{" "}
                        <code className="text-accent-coral bg-muted px-1 rounded">{"{{event_title}}"}</code> to insert dynamic content.
                    </p>
                </div>

                <UserNotificationsManager
                    reminderTemplate={settings?.reminderTemplate || null}
                    soldOutTemplate={settings?.soldOutTemplate || null}
                    announcementTemplate={settings?.announcementTemplate || null}
                    notificationLogoUrl={settings?.notificationLogoUrl || null}
                    onSave={updateEmailTemplates}
                />
            </main>
        </div>
    );
}
