import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAction } from "@/lib/logger";
// Force sync timestamp: 2026-02-01 16:15

// GET - Fetch all social media links
export async function GET() {
    try {
        const links = await prisma.socialMedia.findMany({
            orderBy: { sortOrder: 'asc' }
        });

        // Convert to object keyed by platform for easier frontend handling if needed, 
        // OR just return the array. 
        // Let's return the array to be more "table-like".
        // BUT, the frontend "Settings" page currently expects an object { facebook: { ... }, instagram: { ... } }
        // To make the transition smoother, I will return BOTH an array and a map, or just adapt the frontend.
        // User said "make a different table", suggesting a list.
        // I will return the array. The frontend refactor will adapt to this.

        return NextResponse.json({
            success: true,
            data: links
        });

    } catch (error) {
        console.error("Error fetching social media:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
    }
}

// PUT - Update or Create social media links
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { updates } = body; // Expecting an array of { platform, url, isVisible }

        if (!Array.isArray(updates)) {
            return NextResponse.json({ success: false, error: "Invalid data format" }, { status: 400 });
        }

        // We will loop through and upsert
        // We assume 'platform' is unique enough for this single-artist site
        // Actually, let's use a transaction

        const results = [];

        for (const item of updates) {
            const { platform, url, isVisible, sortOrder } = item;

            // Try to find by platform
            const existing = await prisma.socialMedia.findFirst({
                where: { platform }
            });

            if (existing) {
                const updated = await prisma.socialMedia.update({
                    where: { id: existing.id },
                    data: {
                        url,
                        isVisible: isVisible ?? existing.isVisible,
                        sortOrder: sortOrder ?? existing.sortOrder
                    }
                });
                results.push(updated);
            } else {
                const created = await prisma.socialMedia.create({
                    data: {
                        platform,
                        url,
                        isVisible: isVisible ?? true,
                        sortOrder: sortOrder ?? 0
                    }
                });
                results.push(created);
            }
        }

        // Log action
        logAction("Sahadmin", "UPDATE_SOCIAL", "Updated social media links");

        return NextResponse.json({
            success: true,
            message: "Social media links updated successfully",
            data: results
        });

    } catch (error) {
        console.error("Error updating social media:", error);
        return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
    }
}
