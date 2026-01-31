import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { SocialLinksRow } from "@/components/social-icons";
import { HeroAudioPlayer } from "@/components/hero-audio-player";
import { HeroSlider } from "@/components/hero-slider";
import { YouTubeCarousel } from "@/components/youtube-carousel";
import { BioSection } from "@/components/bio-section";
import { SpecialEventPopup } from "@/components/special-event-popup";
import { GalleryStack } from "@/components/gallery-stack";
import { ContactForm } from "@/components/contact-form";
import { NewsletterForm } from "@/components/newsletter-form";
import { JsonLd } from "@/components/json-ld";
import { MobileNav } from "@/components/mobile-nav";
import { VisitorTracker } from "@/components/visitor-tracker";
import {
  ArrowRight, Mail, MapPin, Calendar, Sparkles, MessageCircle,
  Music2, ImageIcon,
} from "lucide-react";

export const revalidate = 60;

async function getSiteSettings() {
  return await prisma.siteSettings.findFirst();
}

async function getArtist() {
  return await prisma.artist.findFirst({
    include: {
      heroImages: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      bioImages: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

async function getActiveTracks() {
  return await prisma.track.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

async function getActiveVideos() {
  return await prisma.video.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

async function getUpcomingEvents() {
  return await prisma.event.findMany({
    where: { isActive: true, date: { gte: new Date() } },
    orderBy: { date: "asc" },
    take: 6,
  });
}

async function getProducts() {
  return await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
}

async function getGalleryImages() {
  return await prisma.galleryImage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

async function getActiveSpecialEvent() {
  const now = new Date();
  return await prisma.specialEvent.findFirst({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
  });
}

export default async function Home() {
  const [settings, artist, tracks, videos, events, products, galleryImages, specialEvent] = await Promise.all([
    getSiteSettings(), getArtist(), getActiveTracks(), getActiveVideos(),
    getUpcomingEvents(), getProducts(), getGalleryImages(), getActiveSpecialEvent(),
  ]);

  // ========================================
  // DYNAMIC SECTION COLORING
  // Top Blend: First 2 sections MATCH (Hero + next = warm bg)
  // Bottom Blend: Last section = NO BG (matches Footer)
  // Middle: Alternate for contrast
  // ========================================
  const visibleSections = [
    { id: 'hero', visible: true },
    { id: 'concerts', visible: true },
    { id: 'videos', visible: (settings?.isYoutubeVisible ?? true) && videos.length > 0 },
    { id: 'shop', visible: (settings?.isShopVisible ?? true) && products.length > 0 },
    { id: 'gallery', visible: galleryImages.length > 0 },
    { id: 'about', visible: true },
    { id: 'contact', visible: true },
    { id: 'newsletter', visible: true },
  ].filter(s => s.visible);

  // Seamless Top & Bottom color logic ("Sandwich" pattern)
  const getSectionBg = (sectionId: string) => {
    const idx = visibleSections.findIndex(s => s.id === sectionId);
    const len = visibleSections.length;

    // TOP BLEND: Hero (idx 0) + First section (idx 1) = SAME (warm bg)
    if (idx <= 1) return 'gradient-warm-bg';

    // BOTTOM BLEND: Last section matches Footer (no bg)
    if (idx === len - 1) return '';

    // CHAIN: Middle sections alternate (starting from idx 2 = dark)
    // idx 2 = dark (no bg), idx 3 = warm, idx 4 = dark, etc.
    return (idx % 2 === 0) ? '' : 'gradient-warm-bg';
  };

  return (
    <main className="relative grain">
      <JsonLd artist={artist} />
      <SpecialEventPopup event={specialEvent} />
      <VisitorTracker />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-3 py-2 md:px-4 md:py-4">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-full px-4 py-2 md:px-6 md:py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-0">
              <MobileNav artistName={artist?.name || "Heiraza"} showVideos={videos.length > 0} showShop={products.length > 0} />
              <Link href="/" className="font-display text-xl md:text-2xl tracking-widest uppercase hover:opacity-70 transition-opacity">
                {artist?.name || "Heiraza"}
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#concerts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Concerts</Link>
              {settings?.isYoutubeVisible && videos.length > 0 && <Link href="#videos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Videos</Link>}
              {settings?.isShopVisible && products.length > 0 && <Link href="#shop" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Shop</Link>}
              <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-warm-bg">
        <HeroSlider
          images={artist?.heroImages || []}
          fallbackImage={artist?.heroImage}
          interval={settings?.heroSliderInterval || 5000}
          kenBurnsEffect={settings?.heroKenBurnsEffect ?? true}
        />
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-accent-coral/20 rounded-full blur-3xl animate-float z-10" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent-peach/20 rounded-full blur-3xl animate-float z-10" style={{ animationDelay: "3s" }} />

        <div className="relative z-30 text-center px-6 max-w-5xl mx-auto">
          <p className="opacity-0 animate-fade-in text-sm md:text-base font-medium tracking-[0.3em] uppercase text-white/80 mb-6">
            Welcome to the world of
          </p>
          <h1 className="opacity-0 animate-fade-in animate-delay-100 font-display text-display-xl tracking-widest uppercase">
            {artist?.name || "Heiraza"}
          </h1>
          <p className="opacity-0 animate-fade-in animate-delay-200 mt-8 text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed font-serif italic">
            Experience the sound that moves souls
          </p>
          <div className="opacity-0 animate-fade-in animate-delay-300 mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#concerts" className="btn-primary">View Concerts</a>
            {artist?.spotifyUrl && (
              <a href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2">
                <Music2 size={18} /> Listen Now
              </a>
            )}
          </div>
          {settings?.isSocialLinksVisible && (
            <div className="opacity-0 animate-fade-in animate-delay-400 mt-10 flex items-center justify-center">
              <SocialLinksRow artist={artist} size={18} />
            </div>
          )}
          <HeroAudioPlayer tracks={tracks} isVisible={settings?.isAudioPlayerVisible ?? true} />
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in animate-delay-600 z-30">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-muted-foreground/50 to-transparent" />
          </div>
        </div>
      </section>

      {/* Concerts */}
      <section id="concerts" className={`section-padding px-6 ${getSectionBg('concerts')}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.2em] uppercase text-accent-coral mb-4">
              <Calendar size={16} /> Live Shows
            </span>
            <h2 className="font-display text-display-lg tracking-wider uppercase">Upcoming Concerts</h2>
          </div>
          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event.id} className="glass-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover-lift opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}>
                  <div className="flex items-center gap-6">
                    <div className="text-center min-w-[80px]">
                      <div className="font-display text-4xl md:text-5xl leading-none tracking-wide">{new Date(event.date).getDate()}</div>
                      <div className="text-sm text-muted-foreground uppercase tracking-wider mt-1">{new Date(event.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</div>
                    </div>
                    <div className="hidden md:block w-px h-16 bg-border" />
                    <div>
                      <h3 className="font-display text-xl md:text-2xl tracking-wide">{event.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-muted-foreground">
                        <span className="flex items-center gap-1.5"><MapPin size={14} />{event.venue}</span>
                        <span>{event.city}, {event.country}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Priority 1: Sold Out */}
                    {event.isSoldOut ? (
                      <span className="px-6 py-3 rounded-full text-sm font-medium bg-muted text-muted-foreground">SOLD OUT</span>
                    ) : /* Priority 2: Free Event */ event.isFree ? (
                      <span className="px-6 py-3 text-lg font-bold bg-gradient-to-r from-accent-coral via-accent-peach to-accent-coral bg-clip-text text-transparent animate-pulse">
                        Free :)
                      </span>
                    ) : /* Priority 3: Standard Ticket Button */ (
                      <a href={event.ticketUrl || "#"} target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center gap-2">Get Tickets <ArrowRight size={16} /></a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 glass-card rounded-3xl">
              <Calendar className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-xl text-muted-foreground font-serif">No upcoming concerts</p>
              <p className="text-muted-foreground mt-2">Check back soon for new dates!</p>
            </div>
          )}
        </div>
      </section>

      {/* Videos */}
      <YouTubeCarousel videos={videos} autoScrollInterval={settings?.youtubeScrollInterval || 2000} isVisible={settings?.isYoutubeVisible ?? true} className={getSectionBg('videos')} />

      {/* Shop */}
      {settings?.isShopVisible && products.length > 0 && (
        <section id="shop" className={`section-padding px-6 ${getSectionBg('shop')}`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.2em] uppercase text-accent-coral mb-4">
                <Sparkles size={16} /> Official Merch
              </span>
              <h2 className="font-display text-display-lg tracking-wider uppercase">Shop</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, index) => (
                <a key={product.id} href={product.buyUrl} target="_blank" rel="noopener noreferrer" className="group opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}>
                  <div className="glass-card overflow-hidden hover-lift">
                    <div className="aspect-square relative img-zoom">
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 btn-primary text-sm">View Product</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">{product.category}</span>
                      <h3 className="font-display text-lg mt-1 tracking-wide group-hover:text-accent-coral transition-colors">{product.name}</h3>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-medium">{formatPrice(product.price.toString())}</span>
                        {product.stock < 50 && <span className="text-xs text-accent-coral">Low Stock</span>}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Photo Gallery - GalleryStack has its own section wrapper */}
      {galleryImages.length > 0 && <GalleryStack images={galleryImages} className={getSectionBg('gallery')} />}

      {/* About */}
      <BioSection artist={artist} bioImages={artist?.bioImages || []} className={getSectionBg('about')} />

      {/* Contact */}
      <section id="contact" className={`section-padding px-6 ${getSectionBg('contact')}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <span className="text-sm font-medium tracking-[0.2em] uppercase text-accent-coral mb-4 block">Get In Touch</span>
              <h2 className="font-display text-display-lg tracking-wider uppercase mb-6">Send a Message</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">Have a question, booking inquiry, or just want to say hello? Fill out the form and we&apos;ll get back to you.</p>
              <div className="space-y-4">
                <div className="glass-card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent-coral/10 flex items-center justify-center"><Mail className="text-accent-coral" size={20} /></div>
                  <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">contact@heiraza.com</p></div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent-coral/10 flex items-center justify-center"><MessageCircle className="text-accent-coral" size={20} /></div>
                  <div><p className="text-sm text-muted-foreground">Booking</p><p className="font-medium">booking@heiraza.com</p></div>
                </div>
              </div>
              {settings?.isSocialLinksVisible && (<div className="mt-8"><p className="text-sm text-muted-foreground mb-4">Follow on social media</p><SocialLinksRow artist={artist} size={18} /></div>)}
            </div>
            <ContactForm
              successImage={settings?.contactSuccessImage}
              successTitle={settings?.contactSuccessTitle}
              successMessage={settings?.contactSuccessMessage}
            />
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className={`section-padding px-6 ${getSectionBg('newsletter')}`}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-10 md:p-16 rounded-[2.5rem]">
            <Mail className="mx-auto text-accent-coral mb-6" size={48} />
            <h2 className="font-display text-display-md tracking-wider uppercase">Stay Connected</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">Be the first to know about new music, exclusive drops, and tour announcements.</p>
            <NewsletterForm
              successImage={settings?.subscribeSuccessImage}
              successTitle={settings?.subscribeSuccessTitle}
              successMessage={settings?.subscribeSuccessMessage}
            />
            <p className="mt-6 text-sm text-muted-foreground">No spam, ever. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <Link href="/" className="font-display text-3xl tracking-widest uppercase">{artist?.name || "Heiraza"}</Link>
              <p className="mt-4 text-muted-foreground max-w-sm">Experience the sound that moves souls. Music, events, and exclusive merch.</p>
              {settings?.isSocialLinksVisible && (<div className="mt-6"><SocialLinksRow artist={artist} size={18} /></div>)}
            </div>
            <div>
              <h4 className="font-display text-sm tracking-wider uppercase mb-4">Quick Links</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link href="#concerts" className="hover:text-foreground transition-colors">Concerts</Link></li>
                {settings?.isYoutubeVisible && videos.length > 0 && <li><Link href="#videos" className="hover:text-foreground transition-colors">Videos</Link></li>}
                {settings?.isShopVisible && <li><Link href="#shop" className="hover:text-foreground transition-colors">Shop</Link></li>}
                <li><Link href="#about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {artist?.name || "Heiraza"}. All rights reserved.</p>
            <p className="text-sm text-muted-foreground">Made with ♥ for the music</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
