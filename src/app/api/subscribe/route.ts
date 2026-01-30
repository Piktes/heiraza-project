import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Simple in-memory rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now - entry.lastReset >= RATE_LIMIT_WINDOW) {
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  entry.count++;
  return false;
}

// Get client IP for additional rate limiting
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // ========================================
    // HONEYPOT CHECK - Anti-spam protection
    // ========================================
    const honeypot = formData.get("_honey") as string;
    const honeypot2 = formData.get("website") as string;

    // If honeypot fields have any value, it's a bot - reject silently
    if (honeypot || honeypot2) {
      return NextResponse.json({ success: true });
    }

    const email = formData.get("email") as string;
    const receiveEventAlerts = formData.get("receiveEventAlerts") === "true";

    // Validate email
    if (!email || !email.includes("@") || email.length > 255) {
      return NextResponse.json(
        { error: "invalid_email", message: "Please enter a valid email" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const clientIP = getClientIP(request);

    // ========================================
    // RATE LIMITING - Per email AND per IP
    // ========================================
    if (isRateLimited(normalizedEmail) || isRateLimited(`ip:${clientIP}`)) {
      return NextResponse.json(
        { error: "too_many_requests", message: "Too many requests. Please wait." },
        { status: 429 }
      );
    }

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      // Update event alerts preference if they're already subscribed
      await prisma.subscriber.update({
        where: { email: normalizedEmail },
        data: { receiveEventAlerts },
      });
      return NextResponse.json(
        { error: "already_subscribed", message: "You're already subscribed!" },
        { status: 400 }
      );
    }

    // Create new subscriber with event alerts preference
    await prisma.subscriber.create({
      data: {
        email: normalizedEmail,
        receiveEventAlerts,
        ipAddress: clientIP !== "unknown" ? clientIP : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
