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

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const priceStr = formData.get("price") as string;
    const stockStr = formData.get("stock") as string;
    const category = (formData.get("category") as string) || "apparel";
    const buyUrl = formData.get("buyUrl") as string;
    const isActive = formData.get("isActive") === "on";
    let image = formData.get("image") as string | null;

    // Validate required fields
    if (!name || !priceStr || !buyUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const price = parseFloat(priceStr);
    const stock = parseInt(stockStr) || 0;

    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: "Invalid price" },
        { status: 400 }
      );
    }

    // Handle base64 image upload
    if (image && image.startsWith("data:image")) {
      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");
        await mkdir(uploadsDir, { recursive: true });

        // Extract base64 data
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Generate unique filename
        const filename = `product-${Date.now()}.jpg`;
        const filepath = path.join(uploadsDir, filename);

        // Write file
        await writeFile(filepath, buffer);

        // Update image to relative path
        image = `/uploads/products/${filename}`;
      } catch (err) {
        console.error("Error saving image:", err);
        // Use a placeholder if image upload fails
        image = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80";
      }
    } else if (!image) {
      // Default placeholder image
      image = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80";
    }

    // Create product in database
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        category,
        buyUrl,
        image,
        isActive,
      },
    });

    // Log action with session username
    const session = await getServerSession(authOptions);
    const username = (session?.user as any)?.username || "Unknown";
    await logAdminAction(username, "CREATE_PRODUCT", `Created product: ${name}`);

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
