"use client";

import { useState, useTransition, useRef } from "react";
import {
    Save,
    Loader2,
    CheckCircle,
    Clock,
    AlertTriangle,
    Megaphone,
    Image as ImageIcon,
    Upload,
    Trash2,
} from "lucide-react";
import { EmailTemplateEditor } from "@/components/admin/email-template-editor";

interface UserNotificationsManagerProps {
    reminderTemplate: string | null;
    soldOutTemplate: string | null;
    announcementTemplate: string | null;
    notificationLogoUrl: string | null;
    onSave: (formData: FormData) => Promise<void>;
}

// Default templates with variables
const DEFAULT_REMINDER = `<h2>🎵 Event Reminder: {{event_title}}</h2>
<p>Don't forget! You have an upcoming event in just <strong>1 week</strong>:</p>
<p><strong>📅 Date:</strong> {{event_date}} at {{event_time}}</p>
<p><strong>📍 Location:</strong> {{event_location}}</p>
<p><strong>💰 Price:</strong> {{event_price}}</p>
<p>{{event_description}}</p>
<p><a href="{{ticket_link}}">Get Your Tickets Now →</a></p>`;

const DEFAULT_SOLDOUT = `<h2>⚠️ SOLD OUT: {{event_title}}</h2>
<p>We're sorry, but the following event is now <strong>sold out</strong>:</p>
<p><strong>📅 Date:</strong> {{event_date}} at {{event_time}}</p>
<p><strong>📍 Location:</strong> {{event_location}}</p>
<p>Don't miss out on future events! Keep an eye on our website for new announcements.</p>`;

const DEFAULT_ANNOUNCEMENT = `<h2>🎉 New Event Announcement: {{event_title}}</h2>
<p>We're excited to announce a brand new event!</p>
<p><strong>📅 Date:</strong> {{event_date}} at {{event_time}}</p>
<p><strong>📍 Location:</strong> {{event_location}}</p>
<p><strong>💰 Price:</strong> {{event_price}}</p>
<p>{{event_description}}</p>
<p><a href="{{ticket_link}}">Get Your Tickets Now →</a></p>
<p>See you there! 🎶</p>`;

export function UserNotificationsManager({
    reminderTemplate: initialReminder,
    soldOutTemplate: initialSoldOut,
    announcementTemplate: initialAnnouncement,
    notificationLogoUrl: initialLogoUrl,
    onSave,
}: UserNotificationsManagerProps) {
    const [isPending, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [reminderTemplate, setReminderTemplate] = useState(
        initialReminder || DEFAULT_REMINDER
    );
    const [soldOutTemplate, setSoldOutTemplate] = useState(
        initialSoldOut || DEFAULT_SOLDOUT
    );
    const [announcementTemplate, setAnnouncementTemplate] = useState(
        initialAnnouncement || DEFAULT_ANNOUNCEMENT
    );
    const [logoUrl, setLogoUrl] = useState(initialLogoUrl || "");

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Convert to base64
        const reader = new FileReader();
        reader.onload = () => {
            setLogoUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.set("reminderTemplate", reminderTemplate);
            formData.set("soldOutTemplate", soldOutTemplate);
            formData.set("announcementTemplate", announcementTemplate);
            formData.set("notificationLogoUrl", logoUrl);
            await onSave(formData);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        });
    };

    return (
        <div className="space-y-10">
            {/* Logo Upload Section */}
            <section className="glass-card p-8">
                <div className="flex items-center gap-3 mb-2">
                    <ImageIcon className="text-accent-coral" size={24} />
                    <h2 className="font-display text-xl tracking-wide">
                        Email Logo
                    </h2>
                </div>
                <p className="text-muted-foreground text-sm mb-6">
                    Upload a logo to be displayed at the top of <strong>all notification emails</strong>.
                </p>

                {logoUrl ? (
                    <div className="flex items-start gap-4">
                        <div className="w-48 h-24 rounded-lg border border-border overflow-hidden bg-white flex items-center justify-center">
                            <img
                                src={logoUrl}
                                alt="Email logo"
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setLogoUrl("")}
                            className="btn-ghost text-red-500 flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Remove
                        </button>
                    </div>
                ) : (
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Upload size={16} />
                            Upload Logo
                        </button>
                        <p className="text-xs text-muted-foreground mt-2">
                            Recommended: PNG or SVG with transparent background
                        </p>
                    </div>
                )}
            </section>

            {/* Reminder Template */}
            <section className="glass-card p-8">
                <div className="flex items-center gap-3 mb-2">
                    <Clock className="text-accent-coral" size={24} />
                    <h2 className="font-display text-xl tracking-wide">
                        Reminder Template
                    </h2>
                </div>
                <p className="text-muted-foreground text-sm mb-6">
                    Sent automatically <strong>1 week before</strong> an event to subscribers who opted in for event alerts.
                </p>
                <EmailTemplateEditor
                    value={reminderTemplate}
                    onChange={setReminderTemplate}
                    placeholder="Design your reminder email..."
                />
            </section>

            {/* Sold Out Template */}
            <section className="glass-card p-8">
                <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="text-orange-500" size={24} />
                    <h2 className="font-display text-xl tracking-wide">
                        Sold Out Template
                    </h2>
                </div>
                <p className="text-muted-foreground text-sm mb-6">
                    Sent immediately when an event is marked as <strong>sold out</strong>.
                </p>
                <EmailTemplateEditor
                    value={soldOutTemplate}
                    onChange={setSoldOutTemplate}
                    placeholder="Design your sold out alert email..."
                />
            </section>

            {/* Announcement Template */}
            <section className="glass-card p-8">
                <div className="flex items-center gap-3 mb-2">
                    <Megaphone className="text-green-500" size={24} />
                    <h2 className="font-display text-xl tracking-wide">
                        Announcement Template
                    </h2>
                </div>
                <p className="text-muted-foreground text-sm mb-6">
                    Sent when you create a <strong>new event</strong> and choose to announce it.
                </p>
                <EmailTemplateEditor
                    value={announcementTemplate}
                    onChange={setAnnouncementTemplate}
                    placeholder="Design your announcement email..."
                />
            </section>

            {/* Variable Reference */}
            <section className="glass-card p-6">
                <h3 className="font-medium mb-3">Available Variables</h3>
                <div className="flex flex-wrap gap-2">
                    {[
                        "{{event_title}}",
                        "{{event_date}}",
                        "{{event_time}}",
                        "{{event_location}}",
                        "{{event_price}}",
                        "{{event_description}}",
                        "{{event_image_url}}",
                        "{{ticket_link}}",
                    ].map((v) => (
                        <code
                            key={v}
                            className="px-2 py-1 text-sm bg-muted rounded text-accent-coral"
                        >
                            {v}
                        </code>
                    ))}
                </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-center pt-4">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="btn-primary flex items-center gap-2 px-10"
                >
                    {isPending ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Saving...
                        </>
                    ) : saved ? (
                        <>
                            <CheckCircle size={18} />
                            Saved!
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Save All Templates
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

