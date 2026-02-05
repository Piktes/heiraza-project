import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

// ========================================
// EMAIL CONFIGURATION
// ========================================

// Gmail transporter - for event notifications
const gmailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER || process.env.EMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD,
    },
});

// Custom SMTP transporter - for message replies
const smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "mail.test.heiraza.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // TLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

// Default transporter (Gmail for backwards compatibility)
const transporter = gmailTransporter;

// ========================================
// VARIABLE REPLACEMENT
// ========================================
interface EventVariables {
    event_title: string;
    event_date: string;
    event_time: string;
    event_venue: string;
    event_city: string;
    event_country: string;
    event_price: string;
    event_description: string;
    event_image_url: string;
    ticket_link: string;
}

function replaceVariables(template: string, variables: EventVariables): string {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        result = result.replace(new RegExp(placeholder, "g"), value || "");
    });

    return result;
}

function formatEventVariables(event: {
    title: string;
    date: Date;
    venue: string;
    city: string;
    country: string;
    price: string | null;
    description: string | null;
    imageUrl: string | null;
    ticketUrl: string | null;
}): EventVariables {
    const eventDate = new Date(event.date);

    return {
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
        event_price: event.price || "TBA",
        event_description: event.description || "",
        event_image_url: event.imageUrl || "",
        ticket_link: event.ticketUrl || "",
    };
}

// ========================================
// EMAIL TYPES
// ========================================
export type EmailType = "announcement" | "reminder" | "soldOut";

// ========================================
// SEND EVENT EMAIL
// ========================================
export async function sendEventEmail(
    type: EmailType,
    event: {
        id: number;
        title: string;
        date: Date;
        venue: string;
        city: string;
        country: string;
        price: string | null;
        description: string | null;
        imageUrl: string | null;
        ticketUrl: string | null;
    }
): Promise<{ success: boolean; recipientCount: number; error?: string }> {
    try {
        // Get site settings for templates
        const settings = await prisma.siteSettings.findFirst();
        if (!settings) {
            return { success: false, recipientCount: 0, error: "Site settings not found" };
        }

        // Get the appropriate template
        let template: string | null = null;
        let subject: string = "";

        switch (type) {
            case "announcement":
                template = settings.announcementTemplate;
                subject = `🎵 New Event: ${event.title}`;
                break;
            case "reminder":
                template = settings.reminderTemplate;
                subject = `⏰ Reminder: ${event.title} is in 1 week!`;
                break;
            case "soldOut":
                template = settings.soldOutTemplate;
                subject = `🔥 ${event.title} is Sold Out!`;
                break;
        }

        if (!template) {
            return { success: false, recipientCount: 0, error: `No ${type} template configured` };
        }

        // Get subscribers who opted in for event alerts
        const subscribers = await prisma.subscriber.findMany({
            where: {
                isActive: true,
                receiveEventAlerts: true,
            },
        });

        if (subscribers.length === 0) {
            return { success: true, recipientCount: 0 };
        }

        // Prepare email content
        const variables = formatEventVariables(event);
        const htmlContent = replaceVariables(template, variables);

        // Get base URL for unsubscribe links
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

        // Send individual emails with personalized unsubscribe links
        let sentCount = 0;

        for (const subscriber of subscribers) {
            try {
                // Generate unsubscribe token if not exists
                let token = subscriber.unsubscribeToken;
                if (!token) {
                    token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 32);
                    await prisma.subscriber.update({
                        where: { id: subscriber.id },
                        data: { unsubscribeToken: token },
                    });
                }

                // Create unsubscribe link
                const unsubscribeLink = `${baseUrl}/unsubscribe/${token}`;

                // Add unsubscribe footer to email
                const emailWithFooter = `
                    ${htmlContent}
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #888;">
                        <p>You're receiving this because you subscribed to event alerts.</p>
                        <p><a href="${unsubscribeLink}" style="color: #888;">Unsubscribe</a> from future emails</p>
                    </div>
                `;

                await transporter.sendMail({
                    from: `"Heiraza" <${process.env.GMAIL_USER || process.env.EMAIL_USER}>`,
                    to: subscriber.email,
                    subject,
                    html: emailWithFooter,
                });
                sentCount++;

                // Small delay to avoid rate limits
                if (sentCount % 10 === 0) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            } catch (emailError) {
                console.error(`Failed to send to ${subscriber.email}:`, emailError);
            }
        }

        return { success: true, recipientCount: sentCount };
    } catch (error) {
        console.error("sendEventEmail error:", error);
        return { success: false, recipientCount: 0, error: String(error) };
    }
}

// ========================================
// GET SUBSCRIBER COUNT FOR PREVIEW
// ========================================
export async function getEventAlertSubscriberCount(): Promise<number> {
    const count = await prisma.subscriber.count({
        where: {
            isActive: true,
            receiveEventAlerts: true,
        },
    });
    return count;
}

// ========================================
// SEND TEST EMAIL
// ========================================
export async function sendTestEmail(
    to: string,
    type: EmailType,
    event: {
        title: string;
        date: Date;
        venue: string;
        city: string;
        country: string;
        price: string | null;
        description: string | null;
        imageUrl: string | null;
        ticketUrl: string | null;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const settings = await prisma.siteSettings.findFirst();
        if (!settings) {
            return { success: false, error: "Site settings not found" };
        }

        let template: string | null = null;
        let subject: string = "[TEST] ";

        switch (type) {
            case "announcement":
                template = settings.announcementTemplate;
                subject += `New Event: ${event.title}`;
                break;
            case "reminder":
                template = settings.reminderTemplate;
                subject += `Reminder: ${event.title}`;
                break;
            case "soldOut":
                template = settings.soldOutTemplate;
                subject += `Sold Out: ${event.title}`;
                break;
        }

        if (!template) {
            return { success: false, error: `No ${type} template configured` };
        }

        const variables = formatEventVariables(event);
        const htmlContent = replaceVariables(template, variables);

        await transporter.sendMail({
            from: `"Heiraza" <${process.env.GMAIL_USER || process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent,
        });

        return { success: true };
    } catch (error) {
        console.error("sendTestEmail error:", error);
        return { success: false, error: String(error) };
    }
}

// ========================================
// SEND REPLY TO MESSAGE (with custom SMTP)
// ========================================
const DEFAULT_SIGNATURE = `
<div style="font-family: Arial, sans-serif; color: #666;">
    <p style="margin: 0;"><strong>Best regards,</strong></p>
    <p style="margin: 5px 0 0 0;">Heiraza Team</p>
    <p style="margin: 5px 0 0 0;"><a href="https://www.heiraza.com" style="color: #E8795E;">www.heiraza.com</a></p>
</div>
`;

// Simple email validation regex
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export async function sendMessageReply(
    messageId: number,
    to: string,
    subject: string,
    body: string
): Promise<{ success: boolean; error?: string; emailValid: boolean }> {
    // Check email validity
    const emailValid = isValidEmail(to);

    try {
        // Get signature from database or use default
        const sig = await prisma.emailSignature.findFirst({ orderBy: { updatedAt: "desc" } });
        let signature = DEFAULT_SIGNATURE;
        let attachments: { filename: string; content: Buffer; cid: string; contentType: string }[] = [];

        if (sig) {
            let html = "";
            if (sig.logoUrl && sig.logoUrl.startsWith("data:")) {
                // Extract base64 data and content type from data URL
                const matches = sig.logoUrl.match(/^data:([^;]+);base64,(.+)$/);
                if (matches) {
                    const contentType = matches[1];
                    const base64Data = matches[2];
                    const ext = contentType.split("/")[1] || "png";

                    // Create CID attachment for the logo
                    attachments.push({
                        filename: `logo.${ext}`,
                        content: Buffer.from(base64Data, "base64"),
                        cid: "signature-logo",
                        contentType,
                    });

                    // Use CID reference in HTML
                    html += `<img src="cid:signature-logo" alt="Logo" style="max-width: 150px; max-height: 60px; object-fit: contain; margin-bottom: 10px; display: block;" />`;
                }
            } else if (sig.logoUrl) {
                // Regular URL - use directly
                html += `<img src="${sig.logoUrl}" alt="Logo" style="max-width: 150px; max-height: 60px; object-fit: contain; margin-bottom: 10px; display: block;" />`;
            }
            html += sig.content;
            signature = html;
        }

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                ${body}
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
                ${signature}
            </div>
        `;

        // Use custom SMTP transporter for message replies
        const smtpFrom = process.env.SMTP_FROM || "heiraza@test.heiraza.com";
        await smtpTransporter.sendMail({
            from: `"Heiraza" <${smtpFrom}>`,
            to,
            subject,
            html: htmlContent,
            attachments: attachments.length > 0 ? attachments : undefined,
        });

        // Update message in database to mark as replied
        await prisma.message.update({
            where: { id: messageId },
            data: {
                replied: true,
                replyText: body,
                repliedAt: new Date(),
                isRead: true, // Also mark as read
            },
        });

        return { success: true, emailValid };
    } catch (error) {
        console.error("sendMessageReply error:", error);
        return { success: false, error: String(error), emailValid };
    }
}

// Legacy function for backwards compatibility
export async function sendReply(
    to: string,
    subject: string,
    body: string,
    signature: string | null
): Promise<{ success: boolean; error?: string }> {
    try {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                ${body}
                ${signature ? `<hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />${signature}` : ""}
            </div>
        `;

        await transporter.sendMail({
            from: `"Heiraza" <${process.env.GMAIL_USER || process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent,
        });

        return { success: true };
    } catch (error) {
        console.error("sendReply error:", error);
        return { success: false, error: String(error) };
    }
}

// Helper to get signature for preview
export async function getEmailSignature(): Promise<string> {
    const sig = await prisma.emailSignature.findFirst({ orderBy: { updatedAt: "desc" } });

    if (!sig) return DEFAULT_SIGNATURE;

    let html = "";
    if (sig.logoUrl) {
        html += `<img src="${sig.logoUrl}" alt="Logo" style="max-width: 150px; max-height: 60px; object-fit: contain; margin-bottom: 10px;" />`;
    }
    html += sig.content;
    return html;
}

// Validate email export
export { isValidEmail };

