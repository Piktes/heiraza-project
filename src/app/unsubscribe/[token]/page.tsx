import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Music2, AlertTriangle, CheckCircle, HeartCrack } from "lucide-react";
import { UnsubscribeForm } from "@/components/unsubscribe-form";

export const metadata: Metadata = {
    title: "Unsubscribe | Heiraza",
    description: "Unsubscribe from our mailing list",
};

async function getSubscriber(token: string) {
    return prisma.subscriber.findFirst({
        where: {
            unsubscribeToken: token,
        },
    });
}

// Server action for unsubscribe
async function processUnsubscribe(formData: FormData) {
    "use server";
    const token = formData.get("token") as string;
    const reason = formData.get("reason") as string;

    const subscriber = await prisma.subscriber.findFirst({
        where: { unsubscribeToken: token },
    });

    if (!subscriber) {
        return { success: false, error: "Invalid or expired unsubscribe link" };
    }

    if (!subscriber.isActive) {
        return { success: false, error: "You have already unsubscribed" };
    }

    await prisma.subscriber.update({
        where: { id: subscriber.id },
        data: {
            isActive: false,
            unsubscribeReason: reason || null,
            unsubscribedAt: new Date(),
        },
    });

    revalidatePath(`/unsubscribe/${token}`);
    return { success: true };
}

export default async function UnsubscribePage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const subscriber = await getSubscriber(token);

    // If no valid subscriber found with this token
    if (!subscriber) {
        return (
            <div className="min-h-screen gradient-warm-bg grain flex items-center justify-center p-4">
                <div className="glass-card p-8 max-w-md w-full text-center">
                    <AlertTriangle className="mx-auto mb-4 text-yellow-500" size={48} />
                    <h1 className="font-display text-2xl mb-2">Invalid Link</h1>
                    <p className="text-muted-foreground">
                        This unsubscribe link is invalid or has expired.
                    </p>
                    <a
                        href="/"
                        className="inline-block mt-6 text-accent-coral hover:underline font-medium"
                    >
                        Go to HEIRAZA homepage
                    </a>
                </div>
            </div>
        );
    }

    // Check if already unsubscribed
    if (!subscriber.isActive) {
        return (
            <div className="min-h-screen gradient-warm-bg grain flex items-center justify-center p-4">
                <div className="glass-card p-8 max-w-md w-full text-center">
                    <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
                    <h1 className="font-display text-2xl mb-2">Already Unsubscribed</h1>
                    <p className="text-muted-foreground mb-2">
                        You have already unsubscribed from our mailing list.
                    </p>
                    {subscriber.unsubscribedAt && (
                        <p className="text-xs text-muted-foreground">
                            Unsubscribed on {new Date(subscriber.unsubscribedAt).toLocaleDateString()}
                        </p>
                    )}
                    <div className="mt-6 p-4 rounded-xl bg-accent-coral/5 border border-accent-coral/10">
                        <p className="text-sm text-muted-foreground">
                            Changed your mind? Subscribe again at{" "}
                            <a href="/" className="text-accent-coral hover:underline font-medium">
                                heiraza.com
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-warm-bg grain flex items-center justify-center p-4">
            <div className="glass-card p-6 sm:p-8 max-w-lg w-full">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="relative inline-block mb-4">
                        <div className="absolute inset-0 bg-accent-coral/20 blur-2xl rounded-full" />
                        <Music2 className="relative mx-auto text-accent-coral" size={48} />
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl mb-2">
                        We&apos;ll Miss You
                    </h1>
                    <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">{subscriber.email}</span>
                    </p>
                </div>

                {/* Unsubscribe Form */}
                <UnsubscribeForm
                    token={token}
                    processUnsubscribeAction={processUnsubscribe}
                />
            </div>
        </div>
    );
}
