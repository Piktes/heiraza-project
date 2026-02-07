import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-logger";

// GET - Fetch bio data
export async function GET() {
    try {
        const bio = await prisma.bio.findFirst();

        if (!bio) {
            // Bootstrap: Return default empty structure
            return NextResponse.json({
                success: true,
                data: {
                    content: "",
                    imageUrl: "",
                    isActive: true
                }
            });
        }

        return NextResponse.json({ success: true, data: bio });
    } catch (error) {
        console.error("Error fetching bio:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch bio" },
            { status: 500 }
        );
    }
}

// PUT - Update bio data
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { content, imageUrl, isActive } = body;

        // Check if bio exists
        let bio = await prisma.bio.findFirst();

        let updatedBio;

        if (bio) {
            // Update existing
            updatedBio = await prisma.bio.update({
                where: { id: bio.id },
                data: {
                    content: content !== undefined ? content : undefined,
                    imageUrl: imageUrl !== undefined ? imageUrl : undefined,
                    isActive: isActive !== undefined ? isActive : undefined,
                },
            });
        } else {
            // Create new (Bootstrap)
            updatedBio = await prisma.bio.create({
                data: {
                    content: content || "",
                    imageUrl: imageUrl || "",
                    isActive: isActive ?? true,
                },
            });
        }

        // Log the action with session username
        const session = await getServerSession(authOptions);
        const username = (session?.user as any)?.username || "Unknown";
        await logAdminAction(username, "UPDATE_BIO", "Updated bio settings");

        return NextResponse.json({
            success: true,
            message: "Bio updated successfully",
            data: updatedBio
        });
    } catch (error) {
        console.error("Error updating bio:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update bio" },
            { status: 500 }
        );
    }
}
