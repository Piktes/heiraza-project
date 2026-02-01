
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("═══════════════════════════════════════");
    console.log("🗑️  HEIRAZA DATABASE TRUNCATION");
    console.log("═══════════════════════════════════════\n");

    console.log("⚠️  WARNING: This will delete ALL data except AdminUser tables.");

    // 1. Clear all content tables
    console.log("Deleting System Logs...");
    await prisma.systemLog.deleteMany();

    console.log("Deleting Tracks...");
    await prisma.track.deleteMany();

    console.log("Deleting Videos...");
    await prisma.video.deleteMany();

    console.log("Deleting Gallery Images...");
    await prisma.galleryImage.deleteMany();

    console.log("Deleting Special Events...");
    await prisma.specialEvent.deleteMany();

    console.log("Deleting Info Messages...");
    await prisma.message.deleteMany();

    console.log("Deleting Subscribers...");
    await prisma.subscriber.deleteMany();

    console.log("Deleting Products...");
    await prisma.product.deleteMany();

    console.log("Deleting Events...");
    await prisma.event.deleteMany();

    console.log("Deleting Email Signatures...");
    await prisma.emailSignature.deleteMany();

    console.log("Deleting Social Media...");
    await prisma.socialMedia.deleteMany();

    console.log("Deleting Bio...");
    await prisma.bio.deleteMany();

    console.log("Deleting Hero Images...");
    await prisma.heroImage.deleteMany();

    console.log("Deleting Visitor Logs...");
    await prisma.visitorLog.deleteMany();

    console.log("Deleting Site Settings...");
    await prisma.siteSettings.deleteMany();

    console.log("\n✅ Database truncated. Admin Users PRESERVED.");
}

main()
    .catch((e) => {
        console.error("❌ Truncation failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
