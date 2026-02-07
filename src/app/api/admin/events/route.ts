import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const venue = formData.get("venue") as string;
    const city = formData.get("city") as string;
    const country = (formData.get("country") as string) || "USA";
    const ticketUrl = formData.get("ticketUrl") as string | null;
    const isActive = formData.get("isActive") === "on";
    const isFree = formData.get("isFree") === "on";
    const isSoldOut = formData.get("isSoldOut") === "on";
    let imageUrl = formData.get("imageUrl") as string | null;

    // Validate required fields
    // Ticket URL is required ONLY if NOT free AND NOT sold out
    const ticketUrlRequired = !isFree && !isSoldOut;

    if (!title || !date || !time || !venue || !city) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (ticketUrlRequired && !ticketUrl) {
      return NextResponse.json(
        { error: "Ticket URL is required for paid events" },
        { status: 400 }
      );
    }

    // Handle base64 image upload
    if (imageUrl && imageUrl.startsWith("data:image")) {
      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "events");
        await mkdir(uploadsDir, { recursive: true });

        // Extract base64 data
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Generate unique filename
        const filename = `event-${Date.now()}.jpg`;
        const filepath = path.join(uploadsDir, filename);

        // Write file
        await writeFile(filepath, buffer);

        // Update imageUrl to relative path
        imageUrl = `/uploads/events/${filename}`;
      } catch (err) {
        console.error("Error saving image:", err);
        imageUrl = null;
      }
    }

    // Combine date and time
    const eventDate = new Date(`${date}T${time}:00`);

    // Get automation fields
    const description = formData.get("description") as string | null;
    const price = formData.get("price") as string | null;
    const autoReminder = formData.get("autoReminder") !== "off";
    const autoSoldOut = formData.get("autoSoldOut") !== "off";

    // Create event in database
    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        date: eventDate,
        venue,
        city,
        country,
        price: price || null,
        ticketUrl: ticketUrl || null,
        imageUrl,
        isActive,
        isFree,
        isSoldOut,
        autoReminder,
        autoSoldOut,
      },
    });

    // Log action with session username
    const session = await getServerSession(authOptions);
    const username = (session?.user as any)?.username || "Unknown";
    await logAdminAction(username, "CREATE_EVENT", `Created event: ${title}`);

    // Return event with id for announcement sending
    return NextResponse.json({ success: true, id: event.id, event });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: "asc" },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
