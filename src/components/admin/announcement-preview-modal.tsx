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

    // Fetch subscriber count
    useEffect(() => {
        if (isOpen) {
            fetchSubscriberCount();
        }
    }, [isOpen]);

    const fetchSubscriberCount = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/events/send-announcement");
            if (res.ok) {
                const data = await res.json();
                setSubscriberCount(data.subscriberCount);
            }
        } catch (err) {
            console.error("Failed to fetch subscriber count:", err);
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

    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-background rounded-2xl shadow-2xl border border-border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
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
                <div className="p-6 space-y-6">
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

                    {/* Event Preview */}
                    <div className="border border-border rounded-xl overflow-hidden">
                        <div className="bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
                            Email Preview
                        </div>
                        <div className="p-4 space-y-4">
                            {event.imageUrl && (
                                <img
                                    src={event.imageUrl}
                                    alt={event.title}
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                            )}
                            <div>
                                <h3 className="font-display text-lg">{event.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    📅 {formatDate(event.date)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    📍 {event.venue}, {event.city}, {event.country}
                                </p>
                                {event.price && (
                                    <p className="text-sm font-medium text-accent-coral mt-2">
                                        💰 {event.price}
                                    </p>
                                )}
                                {event.description && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {event.description}
                                    </p>
                                )}
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
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto btn-secondary"
                        disabled={isLoading || isSending}
                    >
                        İptal (Cancel)
                    </button>
                    <button
                        onClick={handleSaveOnly}
                        className="w-full sm:w-auto btn-ghost flex items-center justify-center gap-2"
                        disabled={isLoading || isSending}
                    >
                        {isLoading && !isSending ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        Yalnızca Kaydet (Save Only)
                    </button>
                    <button
                        onClick={handleConfirmAndSend}
                        className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2"
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
                                Onayla ve Gönder (Confirm & Send)
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
