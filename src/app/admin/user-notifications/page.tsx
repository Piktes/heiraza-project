import Link from "next/link";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNotificationsManager } from "@/components/admin/user-notifications-manager";
import { Home, ArrowLeft, Bell } from "lucide-react";

export const dynamic = "force-dynamic";

async function getSiteSettings() {
    return await prisma.siteSettings.findFirst();
}

async function updateEmailTemplates(formData: FormData) {
    "use server";

    const reminderTemplate = formData.get("reminderTemplate") as string | null;
    const soldOutTemplate = formData.get("soldOutTemplate") as string | null;
    const announcementTemplate = formData.get("announcementTemplate") as string | null;

    const settings = await prisma.siteSettings.findFirst();

    if (settings) {
        await prisma.siteSettings.update({
            where: { id: settings.id },
            data: {
                reminderTemplate: reminderTemplate || null,
                soldOutTemplate: soldOutTemplate || null,
                announcementTemplate: announcementTemplate || null,
            },
        });
    }

    revalidatePath("/admin/user-notifications");
}

export default async function UserNotificationsPage() {
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
                            <Bell className="text-accent-coral" size={24} />
                            <h1 className="font-display text-2xl tracking-wide">User Notifications</h1>
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
                <div className="mb-8">
                    <p className="text-muted-foreground">
                        Design email templates for automated event notifications. Use variables like{" "}
                        <code className="text-accent-coral bg-muted px-1 rounded">{"{{event_title}}"}</code> to insert dynamic content.
                    </p>
                </div>

                <UserNotificationsManager
                    reminderTemplate={settings?.reminderTemplate || null}
                    soldOutTemplate={settings?.soldOutTemplate || null}
                    announcementTemplate={settings?.announcementTemplate || null}
                    onSave={updateEmailTemplates}
                />
            </main>
        </div>
    );
}
