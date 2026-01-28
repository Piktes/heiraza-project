"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Calendar, MapPin, Plus, Trash2, Edit2, Eye, EyeOff,
    Loader2, ExternalLink, TicketIcon, AlertCircle
} from "lucide-react";

interface Event {
    id: number;
    title: string;
    description: string | null;
    date: Date;
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

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Fetch events
    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch("/api/admin/events");
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data);
                }
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchEvents();
    }, []);

    // Toggle active status
    const toggleActive = async (id: number, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/events/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            if (res.ok) {
                setEvents(events.map(e =>
                    e.id === id ? { ...e, isActive: !currentStatus } : e
                ));
                setMessage({ type: "success", text: currentStatus ? "Event hidden" : "Event visible" });
                setTimeout(() => setMessage(null), 2000);
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to update event" });
        }
    };

    // Toggle sold out status
    const toggleSoldOut = async (id: number, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/events/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isSoldOut: !currentStatus }),
            });
            if (res.ok) {
                setEvents(events.map(e =>
                    e.id === id ? { ...e, isSoldOut: !currentStatus } : e
                ));
                setMessage({ type: "success", text: !currentStatus ? "Marked as Sold Out" : "Available again" });
                setTimeout(() => setMessage(null), 2000);
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to update event" });
        }
    };

    // Delete event
    const deleteEvent = async (id: number) => {
        if (!confirm("Are you sure you want to delete this event?")) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/admin/events/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setEvents(events.filter(e => e.id !== id));
                setMessage({ type: "success", text: "Event deleted" });
                setTimeout(() => setMessage(null), 2000);
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to delete event" });
        } finally {
            setDeletingId(null);
        }
    };

    // Format date
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Check if event is past
    const isPastEvent = (date: Date) => new Date(date) < new Date();

    if (isLoading) {
        return (
            <div className="min-h-screen gradient-warm-bg flex items-center justify-center">
                <Loader2 className="animate-spin text-accent-coral" size={32} />
            </div>
        );
    }

    const upcomingEvents = events.filter(e => !isPastEvent(e.date));
    const pastEvents = events.filter(e => isPastEvent(e.date));

    return (
        <div className="min-h-screen gradient-warm-bg grain">
            {/* Header */}
            <header className="sticky top-0 z-50 px-4 py-4">
                <div className="max-w-5xl mx-auto">
                    <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between">
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={18} />
                            <span>Back to Dashboard</span>
                        </Link>
                        <Link
                            href="/admin/events/new"
                            className="btn-primary flex items-center gap-2 text-sm"
                        >
                            <Plus size={16} />
                            Add Event
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 pb-10 pt-6">
                <div className="mb-8">
                    <h1 className="font-display text-display-md tracking-wider uppercase">Events</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage concerts, tours, and shows. {upcomingEvents.length} upcoming, {pastEvents.length} past.
                    </p>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl ${message.type === "success"
                        ? "bg-green-500/10 border border-green-500/20 text-green-600"
                        : "bg-red-500/10 border border-red-500/20 text-red-600"
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Upcoming Events */}
                <section className="mb-10">
                    <h2 className="font-display text-xl tracking-wide mb-4 flex items-center gap-2">
                        <Calendar className="text-accent-coral" size={20} />
                        Upcoming Events ({upcomingEvents.length})
                    </h2>

                    {upcomingEvents.length === 0 ? (
                        <div className="glass-card p-8 text-center">
                            <Calendar className="mx-auto mb-4 text-muted-foreground" size={48} />
                            <p className="text-muted-foreground">No upcoming events</p>
                            <Link href="/admin/events/new" className="btn-primary inline-flex items-center gap-2 mt-4">
                                <Plus size={16} />
                                Add Your First Event
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    formatDate={formatDate}
                                    onToggleActive={() => toggleActive(event.id, event.isActive)}
                                    onToggleSoldOut={() => toggleSoldOut(event.id, event.isSoldOut)}
                                    onDelete={() => deleteEvent(event.id)}
                                    isDeleting={deletingId === event.id}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Past Events */}
                {pastEvents.length > 0 && (
                    <section>
                        <h2 className="font-display text-xl tracking-wide mb-4 flex items-center gap-2 text-muted-foreground">
                            <Calendar size={20} />
                            Past Events ({pastEvents.length})
                        </h2>

                        <div className="space-y-4 opacity-60">
                            {pastEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    formatDate={formatDate}
                                    onToggleActive={() => toggleActive(event.id, event.isActive)}
                                    onToggleSoldOut={() => toggleSoldOut(event.id, event.isSoldOut)}
                                    onDelete={() => deleteEvent(event.id)}
                                    isDeleting={deletingId === event.id}
                                    isPast
                                />
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

// ========================================
// EVENT CARD COMPONENT
// ========================================
interface EventCardProps {
    event: Event;
    formatDate: (date: Date) => string;
    onToggleActive: () => void;
    onToggleSoldOut: () => void;
    onDelete: () => void;
    isDeleting: boolean;
    isPast?: boolean;
}

function EventCard({
    event,
    formatDate,
    onToggleActive,
    onToggleSoldOut,
    onDelete,
    isDeleting,
    isPast = false
}: EventCardProps) {
    return (
        <div className={`glass-card p-6 flex flex-col md:flex-row gap-6 ${!event.isActive ? "opacity-50" : ""}`}>
            {/* Event Image */}
            {event.imageUrl && (
                <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                    <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Event Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-display text-lg tracking-wide">{event.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar size={14} />
                            {formatDate(event.date)}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <MapPin size={14} />
                            {event.venue}, {event.city}, {event.country}
                        </p>
                        {event.price && (
                            <p className="text-sm font-medium text-accent-coral mt-2">
                                {event.price}
                            </p>
                        )}
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-col gap-2">
                        {event.isFree && (
                            <span className="bg-green-500/10 text-green-600 text-xs font-medium px-3 py-1 rounded-full">
                                🎉 Free
                            </span>
                        )}
                        {event.isSoldOut && (
                            <span className="bg-red-500/10 text-red-500 text-xs font-medium px-3 py-1 rounded-full">
                                Sold Out
                            </span>
                        )}
                        {!event.isActive && (
                            <span className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
                                Hidden
                            </span>
                        )}
                        {isPast && (
                            <span className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
                                Past
                            </span>
                        )}
                    </div>
                </div>

                {/* Automation Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {event.autoReminder && (
                        <span className="bg-blue-500/10 text-blue-500 text-xs px-2 py-0.5 rounded">
                            Auto Reminder
                        </span>
                    )}
                    {event.autoSoldOut && (
                        <span className="bg-purple-500/10 text-purple-500 text-xs px-2 py-0.5 rounded">
                            Auto Sold-Out Alert
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={18} className="text-muted-foreground" />
                    </Link>

                    <button
                        onClick={onToggleActive}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title={event.isActive ? "Hide event" : "Show event"}
                    >
                        {event.isActive ? (
                            <Eye size={18} className="text-accent-coral" />
                        ) : (
                            <EyeOff size={18} className="text-muted-foreground" />
                        )}
                    </button>

                    <button
                        onClick={onToggleSoldOut}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title={event.isSoldOut ? "Mark as available" : "Mark as sold out"}
                    >
                        <TicketIcon size={18} className={event.isSoldOut ? "text-red-500" : "text-muted-foreground"} />
                    </button>

                    {event.ticketUrl && (
                        <a
                            href={event.ticketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="View ticket link"
                        >
                            <ExternalLink size={18} className="text-muted-foreground" />
                        </a>
                    )}

                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors ml-auto"
                        title="Delete event"
                    >
                        {isDeleting ? (
                            <Loader2 size={18} className="animate-spin text-red-500" />
                        ) : (
                            <Trash2 size={18} className="text-red-500" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
