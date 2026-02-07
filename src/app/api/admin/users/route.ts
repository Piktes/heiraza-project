import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { logAdminAction, getRequestMeta } from "@/lib/audit-logger";

// GET - List all admin users
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.adminUser.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - Create new admin user
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username, password, email } = await request.json();
    const currentUser = (session.user as any)?.username || "Unknown";
    const { ipAddress, userAgent } = getRequestMeta(request);

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.adminUser.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await prisma.adminUser.create({
      data: {
        username,
        passwordHash,
        email: email || null,
        role: "admin",
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Log action
    await logAdminAction(
      currentUser,
      "CREATE_USER",
      `Created new admin user: ${username}`,
      { ipAddress, userAgent }
    );

    return NextResponse.json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// PATCH - Update user (toggle active status)
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, isActive } = await request.json();
    const currentUser = (session.user as any)?.username || "Unknown";
    const currentUserId = parseInt((session.user as any)?.id);
    const { ipAddress, userAgent } = getRequestMeta(request);

    // Prevent self-disable
    if (id === currentUserId && isActive === false) {
      return NextResponse.json(
        { error: "You cannot disable your own account" },
        { status: 400 }
      );
    }

    // Get the user to update
    const userToUpdate = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!userToUpdate) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user
    await prisma.adminUser.update({
      where: { id },
      data: { isActive },
    });

    // Log action
    await logAdminAction(
      currentUser,
      "UPDATE_USER",
      `${isActive ? "Enabled" : "Disabled"} user: ${userToUpdate.username}`,
      { ipAddress, userAgent }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - Delete admin user
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const id = parseInt(searchParams.get("id") || "0");
  const currentUser = (session.user as any)?.username || "Unknown";
  const currentUserId = parseInt((session.user as any)?.id);
  const { ipAddress, userAgent } = getRequestMeta(request);

  if (!id) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    // Prevent self-delete
    if (id === currentUserId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if this is the last active admin
    const activeAdminCount = await prisma.adminUser.count({
      where: { isActive: true },
    });

    const userToDelete = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (activeAdminCount <= 1 && userToDelete.isActive) {
      return NextResponse.json(
        { error: "Cannot delete the last active admin account" },
        { status: 400 }
      );
    }

    // Delete user
    await prisma.adminUser.delete({
      where: { id },
    });

    // Log action
    await logAdminAction(
      currentUser,
      "DELETE_USER",
      `Deleted admin user: ${userToDelete.username}`,
      { ipAddress, userAgent, level: "WARN" }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
