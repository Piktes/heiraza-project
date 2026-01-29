"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Calendar, MapPin, Ticket, Save, Loader2, Send, Mail } from "lucide-react";
import { ImageUploadWithCrop } from "@/components/image-upload-with-crop";
import { AnnouncementPreviewModal } from "@/components/admin/announcement-preview-modal";
import { InfoBar } from "@/components/admin/info-bar";

interface Event {
    id: number;
    title: string;
    description: string | null;
    date: string;
    venue: string;
    city: string;
    country: string;
    price: string | null;
    ticketUrl: string | null;
    imageUrl: string | null;
    isActive: boolean;
    isFree: boolean;
    isSoldOut: boolean;
    autoReminder: boolean;
    autoSoldOut: boolean;
}

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [event, setEvent] = useState<Event | null>(null);
    const [imageData, setImageData] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form state for conditional validation
    const [isFree, setIsFree] = useState(false);
    const [isSoldOut, setIsSoldOut] = useState(false);
    const [sendAnnouncement, setSendAnnouncement] = useState(false);

    // Modal state
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [pendingUpdateData, setPendingUpdateData] = useState<Record<string, unknown> | null>(null);

    // Fetch event data
    useEffect(() => {
        async function fetchEvent() {
            try {
                const res = await fetch(`/api/admin/events/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setEvent(data);
                    setIsFree(data.isFree || false);
                    setIsSoldOut(data.isSoldOut || false);
                } else {
                    setError("Event not found");
                }
            } catch (err) {
                setError("Failed to load event");
            } finally {
                setIsLoading(false);
            }
        }
        fetchEvent();
    }, [id]);

    const handleImageUpload = (file: File, croppedDataUrl: string) => {
        setImageData(croppedDataUrl);
    };

    // Ticket URL is required ONLY if not free AND not sold out
    const isTicketUrlRequired = !isFree && !isSoldOut;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const dateStr = formData.get("date") as string;
        const timeStr = formData.get("time") as string;

        const updateData: Record<string, unknown> = {
            title: formData.get("title"),
            description: formData.get("description") || null,
            date: new Date(`${dateStr}T${timeStr}`).toISOString(),
            venue: formData.get("venue"),
            city: formData.get("city"),
            country: formData.get("country") || "USA",
            price: formData.get("price") || null,
            ticketUrl: formData.get("ticketUrl") || null,
            isActive: formData.get("isActive") === "on",
            isFree: formData.get("isFree") === "on",
            isSoldOut: formData.get("isSoldOut") === "on",
            autoReminder: formData.get("autoReminder") === "on",
            autoSoldOut: formData.get("autoSoldOut") === "on",
        };

        // Handle new image upload
        if (imageData) {
            updateData.imageUrl = imageData;
        }

        // If announcement checkbox is checked, show modal
        if (sendAnnouncement) {
            setPendingUpdateData(updateData);
            setShowAnnouncementModal(true);
            return;
        }

        await saveEvent(updateData, false);
    };

    const saveEvent = async (updateData: Record<string, unknown>, sendEmail: boolean) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/events/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update event");
            }

            // If sendEmail is true, trigger announcement
            if (sendEmail) {
                await fetch("/api/events/send-announcement", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ eventId: parseInt(id) }),
                });
            }

            router.push("/admin/events");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setShowAnnouncementModal(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Modal handlers
    const handleModalClose = () => {
        setShowAnnouncementModal(false);
        setPendingUpdateData(null);
    };

    const handleSaveOnly = async () => {
        if (pendingUpdateData) {
            await saveEvent(pendingUpdateData, false);
        }
    };

    const handleConfirmAndSend = async () => {
        if (pendingUpdateData) {
            await saveEvent(pendingUpdateData, true);
        }
    };

    // Build event preview data for modal
    const getEventPreviewData = () => {
        if (!pendingUpdateData) return null;

        return {
            id: parseInt(id),
            title: pendingUpdateData.title as string || "Untitled Event",
            date: pendingUpdateData.date as string || new Date().toISOString(),
            venue: pendingUpdateData.venue as string || "",
            city: pendingUpdateData.city as string || "",
            country: pendingUpdateData.country as string || "USA",
            price: pendingUpdateData.price as string || null,
            description: pendingUpdateData.description as string || null,
            imageUrl: imageData || event?.imageUrl || null,
            ticketUrl: pendingUpdateData.ticketUrl as string || "",
        };
    };

    // Format date for input
    const formatDateForInput = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toISOString().split("T")[0];
    };

    // Format time for input
    const formatTimeForInput = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toTimeString().slice(0, 5);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen gradient-warm-bg flex items-center justify-center">
                <Loader2 className="animate-spin text-accent-coral" size={32} />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen gradient-warm-bg flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Event not found</p>
                    <Link href="/admin/events" className="btn-primary">Back to Events</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* InfoBar */}
            <InfoBar backHref="/admin/events" backLabel="Back to Events" />

            <main className="max-w-4xl mx-auto px-4 pb-10">
                <div className="mb-8">
                    <h1 className="font-display text-display-md tracking-wider uppercase">Edit Event</h1>
                    <p className="text-muted-foreground mt-2">Update event details</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="glass-card p-8 space-y-8">
                    {/* Event Image */}
                    <div>
                        {event.imageUrl && !imageData && (
                            <div className="mb-4">
                                <p className="text-sm text-muted-foreground mb-2">Current image:</p>
                                <img
                                    src={event.imageUrl}
                                    alt={event.title}
                                    className="w-full max-w-md h-48 object-cover rounded-xl"
                                />
                            </div>
                        )}
                        <ImageUploadWithCrop
                            aspect={16 / 9}
                            onUpload={handleImageUpload}
                            label="Update Event Image"
                            helpText="Leave empty to keep current image"
                        />
                    </div>

                    {/* Event Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium mb-2">
                            <Calendar size={16} className="inline mr-2" />
                            Event Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            defaultValue={event.title}
                            className="input-field"
                        />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium mb-2">
                                Date *
                            </label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                required
                                defaultValue={formatDateForInput(event.date)}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium mb-2">
                                Time *
                            </label>
                            <input
                                type="time"
                                id="time"
                                name="time"
                                required
                                defaultValue={formatTimeForInput(event.date)}
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* Venue & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="venue" className="block text-sm font-medium mb-2">
                                <MapPin size={16} className="inline mr-2" />
                                Venue *
                            </label>
                            <input
                                type="text"
                                id="venue"
                                name="venue"
                                required
                                defaultValue={event.venue}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium mb-2">
                                City *
                            </label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                required
                                defaultValue={event.city}
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* Country */}
                    <div>
                        <label htmlFor="country" className="block text-sm font-medium mb-2">
                            Country
                        </label>
                        <input
                            type="text"
                            id="country"
                            name="country"
                            defaultValue={event.country}
                            className="input-field"
                        />
                    </div>

                    {/* Ticket URL - Conditional Requirement */}
                    <div>
                        <label htmlFor="ticketUrl" className="block text-sm font-medium mb-2">
                            <Ticket size={16} className="inline mr-2" />
                            Ticket URL {isTicketUrlRequired && <span className="text-accent-coral">*</span>}
                        </label>
                        <input
                            type="url"
                            id="ticketUrl"
                            name="ticketUrl"
                            required={isTicketUrlRequired}
                            defaultValue={event.ticketUrl || ""}
                            className="input-field"
                        />
                        {!isTicketUrlRequired && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Optional for free or sold out events
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-2">
                            Description (for emails)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            defaultValue={event.description || ""}
                            className="input-field resize-none"
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium mb-2">
                            Price (optional)
                        </label>
                        <input
                            type="text"
                            id="price"
                            name="price"
                            defaultValue={event.price || ""}
                            className="input-field"
                        />
                    </div>

                    {/* Status Options */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                defaultChecked={event.isActive}
                                className="w-5 h-5 rounded border-border"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium">
                                Active (visible)
                            </label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isFree"
                                name="isFree"
                                checked={isFree}
                                onChange={(e) => setIsFree(e.target.checked)}
                                className="w-5 h-5 rounded border-border accent-green-500"
                            />
                            <label htmlFor="isFree" className="text-sm font-medium text-green-600">
                                🎉 Free Event
                            </label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isSoldOut"
                                name="isSoldOut"
                                checked={isSoldOut}
                                onChange={(e) => setIsSoldOut(e.target.checked)}
                                className="w-5 h-5 rounded border-border"
                            />
                            <label htmlFor="isSoldOut" className="text-sm font-medium">
                                Sold Out
                            </label>
                        </div>
                    </div>

                    {/* Automation Settings */}
                    <div className="border-t border-border pt-6">
                        <h3 className="font-medium mb-4 flex items-center gap-2">
                            <span className="text-accent-coral">⚡</span>
                            Email Automation
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="autoReminder"
                                    name="autoReminder"
                                    defaultChecked={event.autoReminder}
                                    className="w-5 h-5 rounded border-border accent-accent-coral"
                                />
                                <div>
                                    <label htmlFor="autoReminder" className="text-sm font-medium">
                                        Auto Reminder
                                    </label>
                                    <p className="text-xs text-muted-foreground">Send 7 days before event</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="autoSoldOut"
                                    name="autoSoldOut"
                                    defaultChecked={event.autoSoldOut}
                                    className="w-5 h-5 rounded border-border accent-accent-coral"
                                />
                                <div>
                                    <label htmlFor="autoSoldOut" className="text-sm font-medium">
                                        Auto Sold-Out Alert
                                    </label>
                                    <p className="text-xs text-muted-foreground">Notify when sold out</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Send Announcement Section */}
                    <div className="border-t border-border pt-6">
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-accent-coral/5 border border-accent-coral/20">
                            <input
                                type="checkbox"
                                id="sendAnnouncement"
                                checked={sendAnnouncement}
                                onChange={(e) => setSendAnnouncement(e.target.checked)}
                                className="w-5 h-5 mt-0.5 rounded border-border accent-accent-coral"
                            />
                            <div>
                                <label htmlFor="sendAnnouncement" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                                    <Mail size={16} className="text-accent-coral" />
                                    Send Announcement Email
                                </label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Notify subscribers who opted in for event alerts about this event update
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex items-center gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Saving...
                                </>
                            ) : sendAnnouncement ? (
                                <>
                                    <Send size={16} />
                                    Save & Preview Email
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save Changes
                                </>
                            )}
                        </button>
                        <Link href="/admin/events" className="btn-secondary">
                            Cancel
                        </Link>
                    </div>
                </form>
            </main>

            {/* Announcement Preview Modal */}
            {showAnnouncementModal && pendingUpdateData && (
                <AnnouncementPreviewModal
                    isOpen={showAnnouncementModal}
                    onClose={handleModalClose}
                    onSaveOnly={handleSaveOnly}
                    onConfirmAndSend={handleConfirmAndSend}
                    event={getEventPreviewData()!}
                />
            )}
        </div>
    );
}
