import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Music2, AlertTriangle, CheckCircle } from "lucide-react";
import { UnsubscribeForm } from "@/components/unsubscribe-form";

export const metadata: Metadata = {
    title: "Unsubscribe | Heiraza",
    description: "Unsubscribe from our mailing list",
};

async function getSubscriber(token: string) {
    return prisma.subscriber.findFirst({
        where: {
            unsubscribeToken: token,
            isActive: true,
        },
    });
}

// Server action for unsubscribe
async function processUnsubscribe(formData: FormData) {
    "use server";
    const token = formData.get("token") as string;
    const reason = formData.get("reason") as string;

    const subscriber = await prisma.subscriber.findFirst({
        where: { unsubscribeToken: token, isActive: true },
    });

    if (!subscriber) {
        return { success: false, error: "Invalid or expired unsubscribe link" };
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
                        This unsubscribe link is invalid or has already been used.
                    </p>
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
                    <p className="text-muted-foreground">
                        You have already unsubscribed from our mailing list.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-warm-bg grain flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-lg w-full">
                {/* Header */}
                <div className="text-center mb-6">
                    <Music2 className="mx-auto mb-3 text-accent-coral" size={40} />
                    <h1 className="font-display text-2xl mb-2">Unsubscribe</h1>
                    <p className="text-muted-foreground">
                        We&#39;re sorry to see you go, <span className="font-medium text-foreground">{subscriber.email}</span>
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
