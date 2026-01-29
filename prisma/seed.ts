import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("🌱 HEIRAZA DATABASE SEEDING v4.0");
  console.log("═══════════════════════════════════════\n");

  // Clear existing data (in correct order for foreign keys)
  console.log("🗑️  Clearing existing data...");
  await prisma.systemLog.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.track.deleteMany();
  await prisma.video.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.specialEvent.deleteMany();
  await prisma.bioImage.deleteMany();
  await prisma.heroImage.deleteMany();
  await prisma.message.deleteMany();
  await prisma.subscriber.deleteMany();
  await prisma.product.deleteMany();
  await prisma.event.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.emailSignature.deleteMany();
  console.log("   ✓ All tables cleared\n");

  // ========================================
  // ADMIN USER (with bcrypt hashed password)
  // ========================================
  console.log("👤 Creating Admin User...");
  const passwordHash = await bcrypt.hash("Sahs2207$", 12);
  const adminUser = await prisma.adminUser.create({
    data: {
      username: "Sahadmin",
      passwordHash: passwordHash,
      email: "admin@heiraza.com",
      role: "admin",
      isActive: true,
    },
  });
  console.log(`   ✓ Admin created: ${adminUser.username}`);
  console.log(`   ✓ Password: Sahs2207$ (hashed with bcrypt)\n`);

  // Log the seed action
  await prisma.systemLog.create({
    data: {
      level: "INFO",
      action: "SYSTEM_SEED",
      username: "System",
      details: "Database seeded with initial data",
    },
  });

  // ========================================
  // SITE SETTINGS
  // ========================================
  console.log("⚙️  Creating Site Settings...");
  await prisma.siteSettings.create({
    data: {
      isAudioPlayerVisible: true,
      isShopVisible: true,
      isSocialLinksVisible: true,
      isYoutubeVisible: true,
      youtubeAutoScroll: true,
      youtubeScrollInterval: 2000,
      heroSliderEnabled: true,
      heroSliderInterval: 5000,
      heroKenBurnsEffect: true,
    },
  });
  console.log("   ✓ Site settings created\n");

  // ========================================
  // ARTIST PROFILE
  // ========================================
  console.log("🎤 Creating Artist profile...");
  const artist = await prisma.artist.create({
    data: {
      name: "Heiraza",
      bio: `Heiraza is a sonic architect whose music transcends conventional boundaries. With roots in electronic production and a soul steeped in classical training, her sound creates bridges between worlds—past and future, digital and organic, intimate and expansive.

Her debut album "Whispers in the Static" earned critical acclaim for its innovative blend of ambient textures, soulful vocals, and intricate production. Each track is a carefully crafted journey, designed to transport listeners to liminal spaces where emotion and frequency become one.

From the underground clubs of Brooklyn to festival stages across three continents, Heiraza has cultivated a devoted following who recognize the rare authenticity in her artistry. Her live performances are immersive experiences—equal parts concert, ceremony, and collective meditation.

"Music is the language of the in-between," she says. "The space where we stop thinking and start feeling. That's where I want to take people."`,
      heroImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1920&q=85",
      facebookUrl: "https://www.facebook.com/heiraza",
      instagramUrl: "https://www.instagram.com/heiraza",
      tiktokUrl: "https://www.tiktok.com/@heiraza",
      youtubeUrl: "https://www.youtube.com/channel/UCG-U_LASrZwa5nOHcAHQGDQ",
      spotifyUrl: "https://open.spotify.com/artist/heiraza",
      appleMusicUrl: "https://music.apple.com/artist/heiraza",
      soundcloudUrl: "https://soundcloud.com/heiraza",
      twitterUrl: "https://twitter.com/heiraza",
    },
  });
  console.log(`   ✓ Artist created: ${artist.name}\n`);

  // ========================================
  // AUDIO TRACKS
  // ========================================
  console.log("🎵 Creating Audio Tracks...");
  const tracks = [
    { 
      title: "Whispers in the Static", 
      artist: "Heiraza", 
      externalLink: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", 
      coverImage: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300&q=80", 
      sortOrder: 0,
      isActive: true 
    },
    { 
      title: "Midnight Echoes", 
      artist: "Heiraza", 
      externalLink: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", 
      coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80", 
      sortOrder: 1,
      isActive: true 
    },
    { 
      title: "Neon Dreams", 
      artist: "Heiraza ft. Luna", 
      externalLink: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", 
      coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80", 
      sortOrder: 2,
      isActive: true 
    },
  ];
  for (const track of tracks) {
    await prisma.track.create({ data: track });
  }
  console.log(`   ✓ ${tracks.length} tracks created\n`);

  // ========================================
  // YOUTUBE VIDEOS
  // ========================================
  console.log("📺 Creating YouTube Videos...");
  const videos = [
    { title: "Whispers in the Static - Official Video", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", sortOrder: 0, isActive: true },
    { title: "Live at Brooklyn Steel", youtubeUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0", sortOrder: 1, isActive: true },
    { title: "Echoes Tour Documentary", youtubeUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk", sortOrder: 2, isActive: true },
    { title: "Studio Session - Behind the Scenes", youtubeUrl: "https://www.youtube.com/watch?v=RgKAFK5djSk", sortOrder: 3, isActive: true },
    { title: "Midnight Echoes - Lyric Video", youtubeUrl: "https://www.youtube.com/watch?v=JGwWNGJdvx8", sortOrder: 4, isActive: true },
  ];
  for (const video of videos) {
    await prisma.video.create({ data: video });
  }
  console.log(`   ✓ ${videos.length} videos created\n`);

  // ========================================
  // HERO IMAGES
  // ========================================
  console.log("🖼️  Creating Hero Images...");
  const heroImages = [
    { imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1920&q=85", altText: "Heiraza performing live", sortOrder: 0 },
    { imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&q=85", altText: "Concert lights", sortOrder: 1 },
  ];
  for (const img of heroImages) {
    await prisma.heroImage.create({ data: { ...img, artistId: artist.id } });
  }
  console.log(`   ✓ ${heroImages.length} hero images created\n`);

  // ========================================
  // BIO IMAGES
  // ========================================
  console.log("📸 Creating Bio Images...");
  const bioImages = [
    { imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=85", caption: "In the studio", sortOrder: 0 },
    { imageUrl: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&q=85", caption: "Behind the scenes", sortOrder: 1 },
  ];
  for (const img of bioImages) {
    await prisma.bioImage.create({ data: { ...img, artistId: artist.id } });
  }
  console.log(`   ✓ ${bioImages.length} bio images created\n`);

  // ========================================
  // GALLERY IMAGES
  // ========================================
  console.log("🖼️  Creating Gallery Images...");
  const galleryImages = [
    { imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c138?w=800&q=80", title: "NYC Show", category: "concerts", sortOrder: 0 },
    { imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80", title: "Festival Stage", category: "concerts", sortOrder: 1 },
    { imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80", title: "Crowd Energy", category: "concerts", sortOrder: 2 },
    { imageUrl: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&q=80", title: "Studio Session", category: "studio", sortOrder: 3 },
  ];
  for (const img of galleryImages) {
    await prisma.galleryImage.create({ data: img });
  }
  console.log(`   ✓ ${galleryImages.length} gallery images created\n`);

  // ========================================
  // EVENTS
  // ========================================
  console.log("📅 Creating Events...");
  const events = [
    { title: "Echoes Tour - Opening Night", date: new Date("2026-09-18T20:00:00"), venue: "The Bowery Ballroom", city: "New York", country: "USA", ticketUrl: "https://ticketmaster.com/heiraza-nyc" },
    { title: "Echoes Tour - West Coast", date: new Date("2026-10-14T21:00:00"), venue: "The Fonda Theatre", city: "Los Angeles", country: "USA", ticketUrl: "https://ticketmaster.com/heiraza-la" },
    { title: "New Year's Eve Special", date: new Date("2026-12-31T22:00:00"), venue: "Terminal 5", city: "New York", country: "USA", ticketUrl: "https://ticketmaster.com/heiraza-nye" },
  ];
  for (const e of events) await prisma.event.create({ data: e });
  console.log(`   ✓ ${events.length} events created\n`);

  // ========================================
  // PRODUCTS
  // ========================================
  console.log("🛍️  Creating Products...");
  const products = [
    { name: "Whispers in the Static - Limited Vinyl", price: 45.0, image: "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=800&q=80", buyUrl: "https://shop.heiraza.com/vinyl", stock: 250, category: "music" },
    { name: "Echoes Tour Tee - Vintage Black", price: 48.0, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80", buyUrl: "https://shop.heiraza.com/tee-black", stock: 500, category: "apparel" },
    { name: "Heavyweight Hoodie - Forest", price: 95.0, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80", buyUrl: "https://shop.heiraza.com/hoodie", stock: 200, category: "apparel" },
  ];
  for (const p of products) await prisma.product.create({ data: p });
  console.log(`   ✓ ${products.length} products created\n`);

  // ========================================
  // SPECIAL EVENT POPUP
  // ========================================
  console.log("🎉 Creating Special Event...");
  await prisma.specialEvent.create({
    data: {
      title: "New Album Announcement! 🎵",
      message: "We're thrilled to announce that 'Echoes in the Void' drops on October 15th! Pre-save now to be the first to listen.",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
      linkUrl: "https://spotify.com/presave/heiraza",
      linkText: "Pre-Save Now",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      showOnce: false,
      isActive: true,
    },
  });
  console.log("   ✓ Special event created\n");

  // ========================================
  // SAMPLE DATA
  // ========================================
  console.log("📧 Creating sample data...");
  await prisma.subscriber.createMany({ data: [{ email: "fan1@example.com" }, { email: "fan2@example.com" }] });
  await prisma.message.create({ data: { name: "Sarah", email: "sarah@email.com", message: "Love your music!", isRead: false } });
  console.log("   ✓ Sample subscribers and messages created\n");

  console.log("═══════════════════════════════════════");
  console.log("🎉 SEEDING COMPLETE!");
  console.log("═══════════════════════════════════════");
  console.log("\n📋 Admin Credentials:");
  console.log("   Username: Sahadmin");
  console.log("   Password: Sahs2207$");
  console.log("\n🚀 Run: npx prisma db push && npm run db:seed && npm run dev\n");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
