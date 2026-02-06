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
    Eye,
    X,
} from "lucide-react";
import { EmailTemplateEditor } from "@/components/admin/email-template-editor";

interface UserNotificationsManagerProps {
    reminderTemplate: string | null;
    soldOutTemplate: string | null;
    announcementTemplate: string | null;
    notificationLogoUrl: string | null;
    onSave: (formData: FormData) => Promise<void>;
}

// Default templates with variables - BIGGER FONTS with email-safe fonts
const DEFAULT_REMINDER = `<h2 style="font-family: Georgia, Times, serif; font-size: 28px; margin-bottom: 16px;">🎵 Event Reminder: {{event_title}}</h2>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;">Don't forget! You have an upcoming event in just <strong>1 week</strong>:</p>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;"><strong>📅 Date:</strong> {{event_date}} at {{event_time}}</p>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;"><strong>📍 Location:</strong> {{event_location}}</p>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;"><strong>💰 Price:</strong> {{event_price}}</p>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;">{{event_description}}</p>
<p style="font-family: Georgia, Times, serif; font-size: 18px;"><a href="{{ticket_link}}" style="color: #E8795E; font-weight: bold;">Get Your Tickets Now →</a></p>`;

const DEFAULT_SOLDOUT = `<h2 style="font-family: Georgia, Times, serif; font-size: 28px; margin-bottom: 16px;">⚠️ SOLD OUT: {{event_title}}</h2>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;">We're sorry, but the following event is now <strong>sold out</strong>:</p>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;"><strong>📅 Date:</strong> {{event_date}} at {{event_time}}</p>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;"><strong>📍 Location:</strong> {{event_location}}</p>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;">Don't miss out on future events! Keep an eye on our website for new announcements.</p>`;

const DEFAULT_ANNOUNCEMENT = `<h2 style="font-family: Georgia, Times, serif; font-size: 28px; margin-bottom: 16px;">🎉 New Event Announcement: {{event_title}}</h2>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;">We're excited to announce a brand new event!</p>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;"><strong>📅 Date:</strong> {{event_date}} at {{event_time}}</p>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;"><strong>📍 Location:</strong> {{event_location}}</p>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;"><strong>💰 Price:</strong> {{event_price}}</p>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;">{{event_description}}</p>
<p style="font-family: Georgia, Times, serif; font-size: 18px;"><a href="{{ticket_link}}" style="color: #E8795E; font-weight: bold;">Get Your Tickets Now →</a></p>
<p style="font-family: Georgia, Times, serif; font-size: 18px; line-height: 1.6;">See you there! 🎶</p>`;


// Sample event data for preview
const SAMPLE_EVENT = {
    event_title: "Summer Music Festival 2026",
    event_date: "Saturday, July 15, 2026",
    event_time: "08:00 PM",
    event_location: "Madison Square Garden, New York, USA",
    event_venue: "Madison Square Garden",
    event_city: "New York",
    event_country: "USA",
    event_price: "$75 - $150",
    event_description: "Join us for an unforgettable night of live music featuring amazing performances!",
    event_image_url: "/uploads/events/sample-event.jpg",
    ticket_link: "https://example.com/tickets",
};

function replacePreviewVariables(template: string): string {
    let result = template;
    Object.entries(SAMPLE_EVENT).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    });
    return result;
}

// Preview Modal Component
function PreviewModal({
    isOpen,
    onClose,
    title,
    content,
    logoUrl,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    logoUrl: string;
}) {
    if (!isOpen) return null;

    const previewHtml = replacePreviewVariables(content);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                        <Eye className="text-accent-coral" size={20} />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title} Preview</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <X size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Email Preview - Always white background like real emails */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-800">
                    <div className="max-w-lg mx-auto rounded-lg shadow-lg overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
                        {/* Sample Event Image */}
                        <div className="w-full h-48 bg-gradient-to-br from-accent-coral to-purple-600 flex items-center justify-center">
                            <span className="text-white text-lg font-medium">📸 Event Image</span>
                        </div>

                        {/* Email Content - Force dark text on white background like real email */}
                        <div
                            className="p-6 email-preview-content"
                            style={{
                                fontFamily: "Arial, sans-serif",
                                backgroundColor: '#ffffff',
                                color: '#1a1a1a',
                            }}
                            dangerouslySetInnerHTML={{ __html: `<style>.email-preview-content p { margin-bottom: 1em; min-height: 1.5em; color: #1a1a1a !important; } .email-preview-content p:empty { min-height: 1em; } .email-preview-content h1, .email-preview-content h2, .email-preview-content h3, .email-preview-content h4, .email-preview-content h5, .email-preview-content h6 { color: #1a1a1a !important; } .email-preview-content strong { color: #1a1a1a !important; } .email-preview-content a { color: #E8795E !important; }</style>${previewHtml}` }}
                        />

                        {/* Logo */}
                        {logoUrl && (
                            <div className="px-6 pb-4 text-center" style={{ backgroundColor: '#ffffff' }}>
                                <img
                                    src={logoUrl}
                                    alt="Logo"
                                    className="max-w-[300px] max-h-[120px] object-contain mx-auto"
                                />
                            </div>
                        )}

                        {/* Footer */}
                        <div className="px-6 py-4 border-t text-center text-xs" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#6b7280' }}>
                            <p>You're receiving this because you subscribed to event alerts.</p>
                            <p><a href="#" style={{ color: '#6b7280', textDecoration: 'underline' }}>Unsubscribe</a> from future emails</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
    const [showToast, setShowToast] = useState(false);

    // Preview modal states
    const [previewType, setPreviewType] = useState<"reminder" | "soldout" | "announcement" | null>(null);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
            setShowToast(true);
            setTimeout(() => {
                setSaved(false);
                setShowToast(false);
            }, 3000);
        });
    };

    const getPreviewContent = () => {
        switch (previewType) {
            case "reminder": return reminderTemplate;
            case "soldout": return soldOutTemplate;
            case "announcement": return announcementTemplate;
            default: return "";
        }
    };

    const getPreviewTitle = () => {
        switch (previewType) {
            case "reminder": return "Reminder Email";
            case "soldout": return "Sold Out Alert";
            case "announcement": return "Announcement Email";
            default: return "";
        }
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
                    This logo will appear at the bottom of all notification emails.
                </p>

                {logoUrl ? (
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-muted rounded-xl">
                            <img
                                src={logoUrl}
                                alt="Email Logo"
                                className="max-w-[300px] max-h-[120px] object-contain"
                            />
                        </div>
                        <button
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
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Upload size={16} />
                            Upload Logo
                        </button>
                        <p className="text-xs text-muted-foreground mt-2">
                            Recommended: PNG or SVG with transparent background (min 600x240px)
                        </p>
                    </div>
                )}
            </section>

            {/* Reminder Template */}
            <section className="glass-card p-8">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Clock className="text-accent-coral" size={24} />
                        <h2 className="font-display text-xl tracking-wide">
                            Reminder Template
                        </h2>
                    </div>
                    <button
                        onClick={() => setPreviewType("reminder")}
                        className="btn-ghost flex items-center gap-2 text-sm"
                    >
                        <Eye size={16} />
                        Preview
                    </button>
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
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-orange-500" size={24} />
                        <h2 className="font-display text-xl tracking-wide">
                            Sold Out Template
                        </h2>
                    </div>
                    <button
                        onClick={() => setPreviewType("soldout")}
                        className="btn-ghost flex items-center gap-2 text-sm"
                    >
                        <Eye size={16} />
                        Preview
                    </button>
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
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Megaphone className="text-green-500" size={24} />
                        <h2 className="font-display text-xl tracking-wide">
                            Announcement Template
                        </h2>
                    </div>
                    <button
                        onClick={() => setPreviewType("announcement")}
                        className="btn-ghost flex items-center gap-2 text-sm"
                    >
                        <Eye size={16} />
                        Preview
                    </button>
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

            {/* Success Toast */}
            {showToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/90 dark:bg-emerald-600/90 backdrop-blur-md text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                        <CheckCircle size={22} className="text-white" />
                        <span className="font-medium">All templates saved successfully!</span>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            <PreviewModal
                isOpen={previewType !== null}
                onClose={() => setPreviewType(null)}
                title={getPreviewTitle()}
                content={getPreviewContent()}
                logoUrl={logoUrl}
            />
        </div>
    );
}
