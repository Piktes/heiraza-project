"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

interface UnsubscribeFormProps {
    token: string;
    processUnsubscribeAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

const UNSUBSCRIBE_REASONS = [
    "I no longer want to receive these emails",
    "The emails are too frequent",
    "The content isn't relevant to me",
    "I signed up by mistake",
    "Other",
];

export function UnsubscribeForm({
    token,
    processUnsubscribeAction,
}: UnsubscribeFormProps) {
    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.set("token", token);
        formData.set("reason", selectedReason === "Other" ? customReason : selectedReason);

        try {
            const result = await processUnsubscribeAction(formData);
            if (result.success) {
                setIsSuccess(true);
            } else {
                setError(result.error || "Failed to unsubscribe");
            }
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center py-8">
                <CheckCircle className="mx-auto mb-4 text-green-500" size={60} />
                <h2 className="font-display text-xl mb-2">Unsubscribed Successfully</h2>
                <p className="text-muted-foreground">
                    You have been removed from our mailing list. We hope to see you again someday!
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Feedback Question */}
            <div>
                <label className="block font-medium mb-3">
                    Why are you leaving? <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="space-y-2">
                    {UNSUBSCRIBE_REASONS.map((reason) => (
                        <label
                            key={reason}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${selectedReason === reason
                                    ? "border-accent-coral bg-accent-coral/10"
                                    : "border-border hover:border-accent-coral/50"
                                }`}
                        >
                            <input
                                type="radio"
                                name="reason"
                                value={reason}
                                checked={selectedReason === reason}
                                onChange={() => setSelectedReason(reason)}
                                className="w-4 h-4 accent-accent-coral"
                            />
                            <span>{reason}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Custom Reason Input */}
            {selectedReason === "Other" && (
                <div>
                    <label className="block font-medium mb-2">Please tell us more:</label>
                    <textarea
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Your feedback helps us improve..."
                        className="input-field w-full min-h-[100px]"
                    />
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Processing...
                    </>
                ) : (
                    "Confirm Unsubscribe"
                )}
            </button>

            <p className="text-center text-xs text-muted-foreground">
                Changed your mind? Simply close this page to stay subscribed.
            </p>
        </form>
    );
}
