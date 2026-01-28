"use client";

import { useState } from "react";
import { Reply, Calendar, Eye, EyeOff, Trash2 } from "lucide-react";
import { ReplyModal } from "./reply-modal";

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
}

interface MessagesListProps {
    messages: Message[];
    signature: string | null;
    toggleReadAction: (formData: FormData) => Promise<void>;
    deleteAction: (formData: FormData) => Promise<void>;
}

// Convert country code to flag emoji (e.g., "TR" -> 🇹🇷)
function countryCodeToFlag(countryCode: string | null | undefined): string {
    if (!countryCode || countryCode.length !== 2) return "";
    const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

export function MessagesList({
    messages,
    signature,
    toggleReadAction,
    deleteAction,
}: MessagesListProps) {
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    const openReplyModal = (msg: Message) => {
        setSelectedMessage(msg);
        setReplyModalOpen(true);
    };

    const handleSendReply = async (subject: string, body: string): Promise<boolean> => {
        if (!selectedMessage) return false;

        try {
            const response = await fetch("/api/admin/send-reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: selectedMessage.email,
                    subject,
                    body,
                }),
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error("Failed to send reply:", error);
            return false;
        }
    };

    return (
        <>
            <div className="space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`glass-card p-6 transition-all ${msg.isRead
                                ? "opacity-80"
                                : "border-l-4 border-l-accent-coral"
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <span className="font-medium text-lg">{msg.name}</span>
                                    <a href={`mailto:${msg.email}`} className="text-accent-coral hover:underline">
                                        {msg.email}
                                    </a>
                                    {!msg.isRead && (
                                        <span className="bg-accent-coral text-white text-xs px-2 py-0.5 rounded-full">
                                            New
                                        </span>
                                    )}
                                </div>

                                <p className="text-foreground mb-3">{msg.message}</p>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </span>
                                    {(msg.country || msg.city) && (
                                        <span className="flex items-center gap-1.5">
                                            {msg.countryCode && (
                                                <span className="text-lg">{countryCodeToFlag(msg.countryCode)}</span>
                                            )}
                                            <span>{[msg.country, msg.city].filter(Boolean).join(", ")}</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Reply Button */}
                                <button
                                    type="button"
                                    onClick={() => openReplyModal(msg)}
                                    className="p-2 rounded-lg hover:bg-accent-coral/10 transition-colors"
                                    title="Reply to message"
                                >
                                    <Reply size={18} className="text-accent-coral" />
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
                    recipientEmail={selectedMessage.email}
                    recipientName={selectedMessage.name}
                    originalMessage={selectedMessage.message}
                    signature={signature}
                    onSend={handleSendReply}
                />
            )}
        </>
    );
}
