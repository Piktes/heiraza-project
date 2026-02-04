"use client";

import { useState } from "react";
import { Reply, Calendar, Eye, EyeOff, Trash2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { ReplyModal } from "./reply-modal";
import { getCountryFlag } from "@/lib/country-utils";

interface Message {
    id: number;
    name: string;
    email: string;
    message: string;
    country: string | null;
    city: string | null;
    countryCode: string | null;
    createdAt: Date;
    isRead: boolean;
    replied: boolean;
    replyText: string | null;
    repliedAt: Date | null;
}

interface MessagesListProps {
    messages: Message[];
    toggleReadAction: (formData: FormData) => Promise<void>;
    deleteAction: (formData: FormData) => Promise<void>;
    onRefresh: () => void;
}

export function MessagesList({
    messages,
    toggleReadAction,
    deleteAction,
    onRefresh,
}: MessagesListProps) {
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());

    const openReplyModal = (msg: Message) => {
        setSelectedMessage(msg);
        setReplyModalOpen(true);
    };

    const toggleReplyExpand = (id: number) => {
        const newExpanded = new Set(expandedReplies);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedReplies(newExpanded);
    };

    const handleSendSuccess = () => {
        onRefresh();
    };

    return (
        <>
            <div className="space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`glass-card p-4 sm:p-6 transition-all ${msg.isRead
                            ? "opacity-80"
                            : "border-l-4 border-l-accent-coral"
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                    <span className="font-medium text-base sm:text-lg truncate">{msg.name}</span>
                                    <a href={`mailto:${msg.email}`} className="text-accent-coral hover:underline text-sm truncate">
                                        {msg.email}
                                    </a>
                                    {!msg.isRead && (
                                        <span className="bg-accent-coral text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                                            New
                                        </span>
                                    )}
                                    {msg.replied && (
                                        <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                                            <Check size={12} />
                                            Replied
                                        </span>
                                    )}
                                </div>

                                <p className="text-foreground mb-3 text-sm sm:text-base">{msg.message}</p>

                                {/* Reply Preview (if replied) */}
                                {msg.replied && msg.replyText && (
                                    <div className="mt-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                                        <button
                                            onClick={() => toggleReplyExpand(msg.id)}
                                            className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline w-full"
                                        >
                                            <Check size={14} />
                                            <span>Your reply</span>
                                            <span className="text-xs text-muted-foreground ml-1">
                                                ({new Date(msg.repliedAt!).toLocaleDateString()})
                                            </span>
                                            <span className="ml-auto">
                                                {expandedReplies.has(msg.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </span>
                                        </button>
                                        {expandedReplies.has(msg.id) && (
                                            <div
                                                className="mt-2 pt-2 border-t border-green-500/20 text-sm prose prose-sm dark:prose-invert max-w-none"
                                                dangerouslySetInnerHTML={{ __html: msg.replyText }}
                                            />
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-3">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </span>
                                    {(msg.country || msg.city) && (
                                        <span className="flex items-center gap-1.5">
                                            <span className="text-lg">{getCountryFlag(msg.country)}</span>
                                            <span>{[msg.country, msg.city].filter(Boolean).join(", ")}</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                {/* Reply Button */}
                                <button
                                    type="button"
                                    onClick={() => openReplyModal(msg)}
                                    className={`p-2 rounded-lg transition-colors ${msg.replied
                                            ? "hover:bg-green-500/10 text-green-500"
                                            : "hover:bg-accent-coral/10 text-accent-coral"
                                        }`}
                                    title={msg.replied ? "Reply again" : "Reply to message"}
                                >
                                    <Reply size={18} />
                                </button>

                                {/* Toggle Read */}
                                <form action={toggleReadAction}>
                                    <input type="hidden" name="id" value={msg.id} />
                                    <input type="hidden" name="isRead" value={msg.isRead.toString()} />
                                    <button
                                        type="submit"
                                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                                        title={msg.isRead ? "Mark as unread" : "Mark as read"}
                                    >
                                        {msg.isRead ? (
                                            <EyeOff size={18} className="text-muted-foreground" />
                                        ) : (
                                            <Eye size={18} className="text-accent-coral" />
                                        )}
                                    </button>
                                </form>

                                {/* Delete */}
                                <form action={deleteAction}>
                                    <input type="hidden" name="id" value={msg.id} />
                                    <button
                                        type="submit"
                                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                        title="Delete message"
                                    >
                                        <Trash2 size={18} className="text-red-500" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reply Modal */}
            {selectedMessage && (
                <ReplyModal
                    isOpen={replyModalOpen}
                    onClose={() => setReplyModalOpen(false)}
                    messageId={selectedMessage.id}
                    recipientEmail={selectedMessage.email}
                    recipientName={selectedMessage.name}
                    originalMessage={selectedMessage.message}
                    onSendSuccess={handleSendSuccess}
                />
            )}
        </>
    );
}
