"use client";

import { useState, useEffect } from "react";
import { X, Send, Save, Loader2, Users, AlertCircle } from "lucide-react";

interface Event {
    id?: number;
    title: string;
    date: string;
    venue: string;
    city: string;
    country: string;
    price: string | null;
    description: string | null;
    imageUrl: string | null;
    ticketUrl: string;
}

interface AnnouncementPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveOnly: () => Promise<void>;
    onConfirmAndSend: () => Promise<void>;
    event: Event;
}

// Default announcement template (fallback)
const DEFAULT_ANNOUNCEMENT = `<h2 style="font-size: 28px; margin-bottom: 16px;">🎉 New Event Announcement: {{event_title}}</h2>
<p style="font-size: 18px; line-height: 1.6;">We're excited to announce a brand new event!</p>
<p style="font-size: 18px; line-height: 1.6;"><strong>📅 Date:</strong> {{event_date}} at {{event_time}}</p>
<p style="font-size: 18px; line-height: 1.6;"><strong>📍 Location:</strong> {{event_location}}</p>
<p style="font-size: 18px; line-height: 1.6;"><strong>💰 Price:</strong> {{event_price}}</p>
<p style="font-size: 18px; line-height: 1.6;">{{event_description}}</p>
<p style="font-size: 18px;"><a href="{{ticket_link}}" style="color: #E8795E; font-weight: bold;">Get Your Tickets Now →</a></p>
<p style="font-size: 18px; line-height: 1.6;">See you there! 🎶</p>`;

// Replace template variables with actual event data
function replaceVariables(template: string, event: Event): string {
    const eventDate = new Date(event.date);

    const variables: Record<string, string> = {
        event_title: event.title,
        event_date: eventDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        }),
        event_time: eventDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        }),
        event_venue: event.venue,
        event_city: event.city,
        event_country: event.country,
        event_location: `${event.venue}, ${event.city}, ${event.country}`,
        event_price: event.price || "TBA",
        event_description: event.description || "",
        event_image_url: event.imageUrl || "",
        ticket_link: event.ticketUrl || "#",
    };

    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    });
    return result;
}

export function AnnouncementPreviewModal({
    isOpen,
    onClose,
    onSaveOnly,
    onConfirmAndSend,
    event,
}: AnnouncementPreviewModalProps) {
    const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [template, setTemplate] = useState<string>(DEFAULT_ANNOUNCEMENT);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    // Fetch subscriber count and template
    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch subscriber count
            const countRes = await fetch("/api/events/send-announcement");
            if (countRes.ok) {
                const data = await countRes.json();
                setSubscriberCount(data.subscriberCount);
            }

            // Fetch template from site settings
            const settingsRes = await fetch("/api/admin/site-settings");
            if (settingsRes.ok) {
                const settings = await settingsRes.json();
                if (settings.announcementTemplate) {
                    setTemplate(settings.announcementTemplate);
                }
                if (settings.notificationLogoUrl) {
                    setLogoUrl(settings.notificationLogoUrl);
                }
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setSubscriberCount(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveOnly = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await onSaveOnly();
        } catch (err) {
            setError("Failed to save event");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmAndSend = async () => {
        setIsSending(true);
        setError(null);
        try {
            await onConfirmAndSend();
        } catch (err) {
            setError("Failed to send announcement");
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    // Generate preview HTML with replaced variables
    const previewHtml = replaceVariables(template, event);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-background rounded-2xl shadow-2xl border border-border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Send className="text-accent-coral" size={24} />
                        <h2 className="font-display text-xl tracking-wide">Send Announcement</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {/* Recipient Count */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-coral/10 border border-accent-coral/20">
                        <Users className="text-accent-coral" size={24} />
                        <div>
                            <p className="font-medium">
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        Loading...
                                    </span>
                                ) : (
                                    `This will be sent to ${subscriberCount || 0} subscribers`
                                )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Users who opted in for event alerts
                            </p>
                        </div>
                    </div>

                    {/* Event Preview - Now uses template */}
                    <div className="border border-border rounded-xl overflow-hidden">
                        <div className="bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
                            Email Preview
                        </div>
                        <div className="bg-white dark:bg-gray-900">
                            {/* Event Image */}
                            {event.imageUrl && (
                                <img
                                    src={event.imageUrl}
                                    alt={event.title}
                                    className="w-full h-48 object-cover"
                                />
                            )}

                            {/* Template Content with replaced variables */}
                            <div
                                className="p-6 text-gray-900 dark:text-gray-100 email-preview-content"
                                style={{ fontFamily: "Arial, sans-serif" }}
                                dangerouslySetInnerHTML={{ __html: `<style>.email-preview-content p { margin-bottom: 1em; min-height: 1.5em; } .email-preview-content p:empty { min-height: 1em; }</style>${previewHtml}` }}
                            />

                            {/* Notification Logo */}
                            {logoUrl && (
                                <div className="px-6 pb-4 text-center">
                                    <img
                                        src={logoUrl}
                                        alt="Logo"
                                        className="max-w-[300px] max-h-[120px] object-contain mx-auto"
                                    />
                                </div>
                            )}

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
                                <p>You're receiving this because you subscribed to event alerts.</p>
                                <p><span className="underline">Unsubscribe</span> from future emails</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {subscriberCount === 0 && !isLoading && (
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                            <AlertCircle size={18} />
                            <span>No subscribers have opted in for event alerts yet.</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 sm:flex sm:flex-row items-center justify-end gap-3 p-4 border-t border-border bg-muted/30">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto btn-ghost h-10 text-sm px-4 text-muted-foreground"
                        disabled={isLoading || isSending}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveOnly}
                        className="w-full sm:w-auto btn-ghost h-10 text-sm px-4 flex items-center justify-center gap-2"
                        disabled={isLoading || isSending}
                    >
                        {isLoading && !isSending ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        Save Only
                    </button>
                    <button
                        onClick={handleConfirmAndSend}
                        className="col-span-2 sm:col-span-1 w-full sm:w-auto btn-primary h-10 text-sm px-4 flex items-center justify-center gap-2"
                        disabled={isLoading || isSending || subscriberCount === 0}
                    >
                        {isSending ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Confirm & Send
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
