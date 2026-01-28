"use client";

import { Calendar, Trash2, MapPin, MessageSquare } from "lucide-react";

interface Subscriber {
    id: number;
    email: string;
    country: string | null;
    city: string | null;
    countryCode: string | null;
    flag: string;
    isActive: boolean;
    receiveEventAlerts: boolean;
    unsubscribeReason: string | null;
    unsubscribedAt: Date | null;
    joinedAt: Date;
}

interface SubscribersListProps {
    subscribers: Subscriber[];
    deleteAction: (formData: FormData) => Promise<void>;
}

export function SubscribersList({
    subscribers,
    deleteAction,
}: SubscribersListProps) {
    return (
        <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Location</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Unsubscribe Reason</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
                            <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subscribers.map((sub) => (
                            <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                {/* Email */}
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{sub.email}</span>
                                        {sub.receiveEventAlerts && (
                                            <span className="text-xs text-green-600 dark:text-green-400">
                                                🎵 Event Alerts
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Location */}
                                <td className="p-4">
                                    {(sub.country || sub.city) ? (
                                        <span className="flex items-center gap-1.5">
                                            {sub.flag && <span className="text-lg">{sub.flag}</span>}
                                            <span className="text-sm">
                                                {[sub.country, sub.city].filter(Boolean).join(", ")}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">—</span>
                                    )}
                                </td>

                                {/* Status */}
                                <td className="p-4">
                                    {sub.isActive ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                            Unsubscribed
                                        </span>
                                    )}
                                </td>

                                {/* Unsubscribe Reason */}
                                <td className="p-4 max-w-[200px]">
                                    {sub.unsubscribeReason ? (
                                        <div className="flex items-start gap-1.5">
                                            <MessageSquare size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                                            <span className="text-sm text-muted-foreground truncate" title={sub.unsubscribeReason}>
                                                {sub.unsubscribeReason}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">—</span>
                                    )}
                                </td>

                                {/* Joined Date */}
                                <td className="p-4">
                                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Calendar size={14} />
                                        {new Date(sub.joinedAt).toLocaleDateString()}
                                    </span>
                                </td>

                                {/* Actions */}
                                <td className="p-4 text-right">
                                    <form action={deleteAction} className="inline">
                                        <input type="hidden" name="id" value={sub.id} />
                                        <button
                                            type="submit"
                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                            title="Delete subscriber"
                                        >
                                            <Trash2 size={16} className="text-red-500" />
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border text-sm text-muted-foreground">
                Showing {subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""}
            </div>
        </div>
    );
}
