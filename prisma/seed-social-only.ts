import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedSocialMediaOnly() {
    console.log("🔗 Sadece sosyal medya kayıtları ekleniyor...");

    // Önce mevcut sosyal medya kayıtlarını sil
    await prisma.socialMedia.deleteMany();

    // 8 platform ekle (URL'ler boş, admin panelden doldurulacak)
    const platforms = [
        { platform: 'facebook', url: '', isVisible: true, sortOrder: 0 },
        { platform: 'instagram', url: '', isVisible: true, sortOrder: 1 },
        { platform: 'tiktok', url: '', isVisible: true, sortOrder: 2 },
        { platform: 'youtube', url: '', isVisible: true, sortOrder: 3 },
        { platform: 'spotify', url: '', isVisible: true, sortOrder: 4 },
        { platform: 'appleMusic', url: '', isVisible: true, sortOrder: 5 },
        { platform: 'soundcloud', url: '', isVisible: true, sortOrder: 6 },
        { platform: 'x', url: '', isVisible: true, sortOrder: 7 },
    ];

    for (const p of platforms) {
        await prisma.socialMedia.create({ data: p });
    }

    console.log("✅ 8 sosyal medya kaydı eklendi!");
    console.log("💡 Admin panelden gerçek linkleri girebilirsin.");
}

seedSocialMediaOnly()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
