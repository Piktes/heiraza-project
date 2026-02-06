import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

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

// Custom SMTP transporter - for ALL emails (event notifications + replies)
const smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "mail.heiraza.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // TLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

// Use SMTP for all emails
const transporter = smtpTransporter;

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
    event_location: string; // Combined: venue, city, country
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
        event_location: `${event.venue}, ${event.city}, ${event.country}`,
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
        console.log(`[EMAIL] sendEventEmail called with type: ${type}, event: ${event.title}`);
        console.log(`[EMAIL] SMTP config - Host: ${process.env.SMTP_HOST || 'mail.heiraza.com'}, User: ${process.env.SMTP_USER || 'NOT SET'}`);
        console.log(`[EMAIL] SMTP Password: ${process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET'}`);

        // Get site settings for templates
        const settings = await prisma.siteSettings.findFirst();
        if (!settings) {
            console.log("[EMAIL] Error: Site settings not found");
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

        console.log(`[EMAIL] Template for ${type}: ${template ? 'FOUND (' + template.length + ' chars)' : 'NOT SET'}`);

        if (!template) {
            console.log(`[EMAIL] Error: No ${type} template configured`);
            return { success: false, recipientCount: 0, error: `No ${type} template configured` };
        }

        // Get subscribers who opted in for event alerts
        const subscribers = await prisma.subscriber.findMany({
            where: {
                isActive: true,
                receiveEventAlerts: true,
            },
        });

        console.log(`[EMAIL] Found ${subscribers.length} subscribers with event alerts enabled`);

        if (subscribers.length === 0) {
            console.log("[EMAIL] No subscribers with event alerts enabled");
            return { success: true, recipientCount: 0 };
        }

        // Prepare email content
        const variables = formatEventVariables(event);
        const htmlContent = replaceVariables(template, variables);

        // Get base URL for unsubscribe links and images
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://heiraza.com";
        // Prepare CID attachments array for embedded images
        let attachments: { filename: string; content: Buffer; cid: string; contentType: string }[] = [];

        // Build event image as CID attachment (like logo)
        let eventImageHtml = "";
        console.log(`[EMAIL] Event imageUrl: ${event.imageUrl || 'NOT SET'}`);
        if (event.imageUrl) {
            try {
                // Handle both relative and absolute paths
                let imagePath = event.imageUrl;

                // If it's a relative URL, build the file path
                if (!imagePath.startsWith("http") && !imagePath.startsWith("data:")) {
                    // Remove leading slash if present
                    const relativePath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;

                    // Build absolute path to file
                    const path = await import("path");
                    const fs = await import("fs/promises");

                    // Try to find the file in public folder
                    const publicPath = path.join(process.cwd(), "public", relativePath);

                    console.log(`[EMAIL] Trying to read event image from: ${publicPath}`);

                    try {
                        const imageBuffer = await fs.readFile(publicPath);
                        const ext = path.extname(publicPath).slice(1) || "jpg";
                        const mimeType = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : "image/jpeg";

                        // Add event image as CID attachment
                        attachments.push({
                            filename: `event-image.${ext}`,
                            content: imageBuffer,
                            cid: "event-image",
                            contentType: mimeType,
                        });

                        eventImageHtml = `<div style="margin-bottom: 20px;"><img src="cid:event-image" alt="${event.title}" style="max-width: 100%; width: 100%; height: auto; border-radius: 8px;" /></div>`;
                        console.log(`[EMAIL] Event image embedded as CID attachment`);
                    } catch (fileError) {
                        console.error(`[EMAIL] Failed to read event image file:`, fileError);
                        // Fallback to URL if file read fails
                        const imageUrl = `${baseUrl}${event.imageUrl}`;
                        eventImageHtml = `<div style="margin-bottom: 20px;"><img src="${imageUrl}" alt="${event.title}" style="max-width: 100%; width: 100%; height: auto; border-radius: 8px;" /></div>`;
                    }
                } else if (imagePath.startsWith("data:")) {
                    // Handle base64 image
                    const matches = imagePath.match(/^data:([^;]+);base64,(.+)$/);
                    if (matches) {
                        const contentType = matches[1];
                        const base64Data = matches[2];
                        const ext = contentType.split("/")[1] || "jpg";

                        attachments.push({
                            filename: `event-image.${ext}`,
                            content: Buffer.from(base64Data, "base64"),
                            cid: "event-image",
                            contentType,
                        });

                        eventImageHtml = `<div style="margin-bottom: 20px;"><img src="cid:event-image" alt="${event.title}" style="max-width: 100%; width: 100%; height: auto; border-radius: 8px;" /></div>`;
                        console.log(`[EMAIL] Event image (base64) embedded as CID attachment`);
                    }
                } else {
                    // External URL - use as-is
                    eventImageHtml = `<div style="margin-bottom: 20px;"><img src="${imagePath}" alt="${event.title}" style="max-width: 100%; width: 100%; height: auto; border-radius: 8px;" /></div>`;
                    console.log(`[EMAIL] Event image using external URL`);
                }
            } catch (error) {
                console.error(`[EMAIL] Error processing event image:`, error);
            }
        }

        // Build notification logo HTML (at bottom, before unsubscribe) - 3x BIGGER
        let notificationLogoHtml = "";

        if (settings.notificationLogoUrl) {
            console.log(`[EMAIL] Notification logo: SET`);
            if (settings.notificationLogoUrl.startsWith("data:")) {
                // Base64 logo - use CID attachment
                const matches = settings.notificationLogoUrl.match(/^data:([^;]+);base64,(.+)$/);
                if (matches) {
                    const contentType = matches[1];
                    const base64Data = matches[2];
                    const ext = contentType.split("/")[1] || "png";

                    attachments.push({
                        filename: `notification-logo.${ext}`,
                        content: Buffer.from(base64Data, "base64"),
                        cid: "notification-logo",
                        contentType,
                    });

                    notificationLogoHtml = `<div style="margin-top: 30px; text-align: center;"><img src="cid:notification-logo" alt="Heiraza" style="max-width: 600px; max-height: 240px; object-fit: contain;" /></div>`;
                }
            } else {
                // Regular URL
                notificationLogoHtml = `<div style="margin-top: 30px; text-align: center;"><img src="${settings.notificationLogoUrl}" alt="Heiraza" style="max-width: 600px; max-height: 240px; object-fit: contain;" /></div>`;
            }
        } else {
            console.log(`[EMAIL] Notification logo: NOT SET`);
        }

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

                // Build full email: Event Image + Content + Logo + Unsubscribe
                const fullEmailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        ${eventImageHtml}
                        ${htmlContent}
                        ${notificationLogoHtml}
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #888;">
                            <p>You're receiving this because you subscribed to event alerts.</p>
                            <p><a href="${unsubscribeLink}" style="color: #888;">Unsubscribe</a> from future emails</p>
                        </div>
                    </div>
                `;

                // Use custom SMTP transporter (same as message replies)
                const smtpFrom = process.env.SMTP_FROM || "heiraza@heiraza.com";
                const domain = smtpFrom.split("@")[1] || "heiraza.com";

                // Generate unique Message-ID to prevent email threading
                const uniqueMessageId = `<${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${subscriber.id}@${domain}>`;

                await smtpTransporter.sendMail({
                    from: `"Heiraza" <${smtpFrom}>`,
                    to: subscriber.email,
                    subject,
                    html: fullEmailHtml,
                    attachments: attachments.length > 0 ? attachments : undefined,
                    messageId: uniqueMessageId,
                    headers: {
                        "X-Entity-Ref-ID": uniqueMessageId, // Prevents Gmail threading
                    },
                });
                sentCount++;
                console.log(`[EMAIL] Sent to ${subscriber.email}`);

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

        // Use custom SMTP transporter (same as message replies)
        const smtpFrom = process.env.SMTP_FROM || "heiraza@heiraza.com";
        await smtpTransporter.sendMail({
            from: `"Heiraza" <${smtpFrom}>`,
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

// Common valid email domains
const VALID_EMAIL_DOMAINS = [
    // Major providers
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.fr", "yahoo.de",
    "hotmail.com", "hotmail.co.uk", "hotmail.fr", "hotmail.de", "hotmail.it",
    "outlook.com", "outlook.co.uk", "live.com", "live.co.uk", "msn.com",
    "icloud.com", "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me",
    "mail.com", "email.com", "zoho.com", "yandex.com", "yandex.ru",
    // Country-specific
    "gmx.de", "gmx.net", "web.de", "t-online.de", "freenet.de",
    "orange.fr", "laposte.net", "free.fr", "sfr.fr", "wanadoo.fr",
    "libero.it", "virgilio.it", "tin.it", "alice.it",
    "mail.ru", "inbox.ru", "list.ru", "bk.ru",
    "qq.com", "163.com", "126.com", "sina.com",
    // Turkish providers
    "ymail.com", "hotmail.com.tr", "outlook.com.tr",
    // Business-like
    "company.com", "work.com", "business.com",
];

// Common typo patterns to detect
const TYPO_PATTERNS = [
    { pattern: /g[öoó]tmail/i, correct: "gmail" },
    { pattern: /gmai[^l]/i, correct: "gmail" },
    { pattern: /gmial/i, correct: "gmail" },
    { pattern: /gmaill/i, correct: "gmail" },
    { pattern: /hotmai[^l]/i, correct: "hotmail" },
    { pattern: /hotmal/i, correct: "hotmail" },
    { pattern: /yahooo/i, correct: "yahoo" },
    { pattern: /yaho[^o]/i, correct: "yahoo" },
    { pattern: /outloo[^k]/i, correct: "outlook" },
    { pattern: /outlok/i, correct: "outlook" },
];

// Enhanced email validation
function isValidEmail(email: string): boolean {
    if (!email) return false;

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return false;

    // Check for common typos
    for (const typo of TYPO_PATTERNS) {
        if (typo.pattern.test(domain)) {
            return false; // Detected a typo
        }
    }

    // Check if domain is in our known valid list OR looks like a valid custom domain
    const isKnownDomain = VALID_EMAIL_DOMAINS.includes(domain);
    const hasValidTLD = /\.[a-z]{2,}$/i.test(domain);
    const hasValidFormat = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(domain);

    // Accept known domains OR properly formatted custom domains (for business emails)
    return isKnownDomain || (hasValidFormat && hasValidTLD);
}

// Async DNS MX lookup to verify domain can receive emails
async function verifyEmailDomain(email: string): Promise<{ valid: boolean; reason?: string }> {
    if (!email) return { valid: false, reason: "Empty email" };

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, reason: "Invalid format" };
    }

    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return { valid: false, reason: "No domain" };

    // Check for obvious typos first
    for (const typo of TYPO_PATTERNS) {
        if (typo.pattern.test(domain)) {
            return { valid: false, reason: `Typo detected - did you mean ${typo.correct}?` };
        }
    }

    // DNS MX lookup
    try {
        const mxRecords = await resolveMx(domain);
        if (mxRecords && mxRecords.length > 0) {
            return { valid: true };
        }
        return { valid: false, reason: "Domain cannot receive emails" };
    } catch (error: any) {
        if (error.code === "ENOTFOUND" || error.code === "ENODATA") {
            return { valid: false, reason: "Domain does not exist" };
        }
        // If DNS lookup fails for other reasons, assume valid to avoid false negatives
        return { valid: true };
    }
}

export async function sendMessageReply(
    messageId: number,
    to: string,
    subject: string,
    body: string
): Promise<{ success: boolean; error?: string; emailValid: boolean; validationReason?: string }> {
    // Check email validity using DNS MX lookup
    const validation = await verifyEmailDomain(to);
    const emailValid = validation.valid;

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
                    html += `<img src="cid:signature-logo" alt="Logo" style="max-width: 450px; max-height: 180px; object-fit: contain; margin-bottom: 15px; display: block;" />`;
                }
            } else if (sig.logoUrl) {
                // Regular URL - use directly
                html += `<img src="${sig.logoUrl}" alt="Logo" style="max-width: 450px; max-height: 180px; object-fit: contain; margin-bottom: 15px; display: block;" />`;
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

        return { success: true, emailValid, validationReason: validation.reason };
    } catch (error) {
        console.error("sendMessageReply error:", error);
        return { success: false, error: String(error), emailValid, validationReason: validation.reason };
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

