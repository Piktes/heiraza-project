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
  // await prisma.adminUser.deleteMany(); // PRESERVE ADMIN USER
  await prisma.track.deleteMany();
  await prisma.video.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.specialEvent.deleteMany();
  await prisma.message.deleteMany();
  await prisma.subscriber.deleteMany();
  await prisma.product.deleteMany();
  await prisma.event.deleteMany();
  await prisma.emailSignature.deleteMany();
  await prisma.socialMedia.deleteMany();
  await prisma.bio.deleteMany();
  await prisma.heroImage.deleteMany();
  // Clear specific tables
  // Adjust based on your schema. Careful in prod!

  // Clean up order matters for foreign keys if they existed, but we have few relations now.
  // const deleteSocial = prisma.socialMedia.deleteMany();
  // const deleteBio = prisma.bio.deleteMany();
  // ...

  console.log('Seeding database...');

  // 1. Ensure Bio exists
  const bio = await prisma.bio.upsert({
    where: { id: 1 },
    update: {},
    create: {
      content: "Heiraza is an emerging artist redefining the boundaries of modern sound...",
      imageUrl: "/uploads/bio/default-bio.jpg",
      isActive: true
    }
  });

  // 2. Ensure Social Media Links exist
  const platforms = [
    { platform: 'facebook', url: 'https://facebook.com', isVisible: true },
    { platform: 'instagram', url: 'https://instagram.com', isVisible: true },
    { platform: 'youtube', url: 'https://youtube.com', isVisible: true },
    { platform: 'spotify', url: 'https://spotify.com', isVisible: true },
  ];

  for (const p of platforms) {
    await prisma.socialMedia.create({
      data: p
    });
  }

  // 3. Ensure Site Settings exist
  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      isAudioPlayerVisible: true,
      isShopVisible: true,
      isYoutubeVisible: true,
      heroSliderInterval: 5000
    }
  });

  console.log('Seeding finished.');


  // ========================================
  // ADMIN USER (with bcrypt hashed password)
  // ========================================
  console.log("👤 Creating Admin User...");
  const passwordHash = await bcrypt.hash("Sahs2207$", 12);
  const adminUser = await prisma.adminUser.upsert({
    where: { username: "Sahadmin" },
    update: {
      passwordHash: passwordHash,
      // email: "admin@heiraza.com", // Optional update
      // isActive: true
    },
    create: {
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
    { imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1920&q=85", altText: "Heiraza performing live", sortOrder: 0, isActive: true },
    { imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&q=85", altText: "Concert lights", sortOrder: 1, isActive: true },
  ];
  for (const img of heroImages) {
    // artistId removed
    await prisma.heroImage.create({ data: img });
  }
  console.log(`   ✓ ${heroImages.length} hero images created\n`);

  // Bio Images Block Removed (Merged into Bio table)


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
  // SAMPLE VISITORS (150 entries with countries)
  // ========================================
  console.log("👥 Creating sample visitors...");
  const countries = [
    { country: "United States", cities: ["New York", "Los Angeles", "Chicago", "Miami", "Seattle", "Austin", "Denver", "Boston"] },
    { country: "United Kingdom", cities: ["London", "Manchester", "Birmingham", "Liverpool", "Glasgow", "Edinburgh"] },
    { country: "Canada", cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"] },
    { country: "Germany", cities: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"] },
    { country: "France", cities: ["Paris", "Lyon", "Marseille", "Nice", "Toulouse"] },
    { country: "Australia", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"] },
    { country: "Japan", cities: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya"] },
    { country: "Brazil", cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"] },
    { country: "Netherlands", cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"] },
    { country: "Spain", cities: ["Madrid", "Barcelona", "Valencia", "Sevilla"] },
  ];

  const crypto = await import("crypto");
  const hashIP = (ip: string) => crypto.createHash("sha256").update(ip).digest("hex");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

  const visitorData = [];
  for (let i = 0; i < 150; i++) {
    const countryData = countries[Math.floor(Math.random() * countries.length)];
    const city = countryData.cities[Math.floor(Math.random() * countryData.cities.length)];
    const fakeIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    visitorData.push({
      visitorHash: hashIP(fakeIP + i),
      country: countryData.country,
      city: city,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      visitedAt: randomDate(thirtyDaysAgo, now),
      isSubscriber: Math.random() < 0.15,
      hasMessaged: Math.random() < 0.05,
    });
  }
  await prisma.visitorLog.deleteMany({});
  await prisma.visitorLog.createMany({ data: visitorData });
  console.log(`   ✓ ${visitorData.length} visitors created\n`);

  // ========================================
  // SAMPLE SUBSCRIBERS (15 entries)
  // ========================================
  console.log("📧 Creating sample subscribers...");
  const subscriberEmails = [
    "alex.music@gmail.com", "sarah.jones@yahoo.com", "mike.beats@outlook.com",
    "emma.wilson@hotmail.com", "david.sounds@gmail.com", "lisa.melodies@icloud.com",
    "tom.rhythms@gmail.com", "nina.vibes@outlook.com", "chris.tunes@yahoo.com",
    "amy.harmony@gmail.com", "jake.bass@proton.me", "maya.synth@gmail.com",
    "ryan.keys@outlook.com", "zoe.strings@yahoo.com", "leo.drums@gmail.com",
  ];

  let subscriberCount = 0;
  for (let i = 0; i < subscriberEmails.length; i++) {
    const countryData = countries[Math.floor(Math.random() * countries.length)];
    try {
      await prisma.subscriber.create({
        data: {
          email: subscriberEmails[i],
          receiveEventAlerts: Math.random() > 0.3,
          ipAddress: `10.0.${Math.floor(Math.random() * 255)}.${i}`,
          country: countryData.country,
          city: countryData.cities[Math.floor(Math.random() * countryData.cities.length)],
          isActive: true,
          joinedAt: randomDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now),
        },
      });
      subscriberCount++;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`   ✓ ${subscriberCount} subscribers created\n`);

  // ========================================
  // SAMPLE MESSAGES (8 entries)
  // ========================================
  console.log("💬 Creating sample messages...");
  const messageContents = [
    { name: "Alex Martinez", email: "alex.m@gmail.com", message: "Absolutely love your new track! The production quality is incredible. Any chance of a vinyl release?" },
    { name: "Sarah Johnson", email: "sarah.j@yahoo.com", message: "Just discovered your music through Spotify. Blown away! When are you touring Europe?" },
    { name: "Mike Chen", email: "mike.c@outlook.com", message: "Your live performance last month was unforgettable. Thank you for the amazing show!" },
    { name: "Emma Davis", email: "emma.d@icloud.com", message: "Would love to collaborate on a track. I'm a producer based in LA. Let me know if you're interested!" },
    { name: "David Smith", email: "david.s@gmail.com", message: "The new album is on repeat! 'Echoes' is my favorite track. Pure magic." },
    { name: "Lisa Park", email: "lisa.p@gmail.com", message: "Do you have any merch available? Would love to support with a t-shirt purchase!" },
    { name: "Tom Wilson", email: "tom.w@proton.me", message: "Your music got me through tough times. Thank you for creating such beautiful art." },
    { name: "Nina Rodriguez", email: "nina.r@outlook.com", message: "The visuals in your latest music video are stunning. Who directed it?" },
  ];

  const messageData = messageContents.map((msg, i) => ({
    name: msg.name,
    email: msg.email,
    message: msg.message,
    ipAddress: `172.16.${Math.floor(Math.random() * 255)}.${i}`,
    createdAt: randomDate(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), now),
    isRead: Math.random() > 0.5,
  }));
  await prisma.message.createMany({ data: messageData });
  console.log(`   ✓ ${messageData.length} messages created\n`);

  console.log("═══════════════════════════════════════");
  console.log("🎉 SEEDING COMPLETE!");
  console.log("═══════════════════════════════════════");
  console.log("\n📋 Admin Credentials:");
  console.log("   Username: Sahadmin");
  console.log("   Password: Sahs2207$");
  console.log("\n📊 Sample Data Summary:");
  console.log(`   👥 Visitors:    150`);
  console.log(`   📧 Subscribers: 15`);
  console.log(`   💬 Messages:    8`);
  console.log("\n🚀 Run: npm run db:seed && npm run dev\n");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
