import type { Metadata } from "next";
import { Cinzel, Playfair_Display, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { VersionCheck } from "@/components/version-check";
import "./globals.css";

// Sharp/Runic font for brand name and headings
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Elegant serif for secondary headings
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

// Clean sans-serif for body
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

import { headers } from "next/headers";

const baseMetadata: Metadata = {
  title: "HEIRAZA | Official Website",
  description: "Welcome to the official website of HEIRAZA.",
  keywords: ["Heiraza", "Music Artist", "Sonic Architect", "Concerts", "Live Shows", "Merch", "Tour Dates", "Events", "Electronic Music"],
  authors: [{ name: "Heiraza" }],
  creator: "Heiraza",
  publisher: "Heiraza",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export async function generateMetadata(): Promise<Metadata> {
  // HARDCODED fallback - LiteSpeed sends duplicate headers causing URL parse errors
  const FALLBACK_URL = "https://heiraza.com";

  let metadataBase: URL;

  try {
    const headersList = headers();
    // Safe header parsing for reverse proxies (handles "host1, host1" duplicates)
    const rawHost = headersList.get("host") || "";
    const rawProto = headersList.get("x-forwarded-proto") || "";

    const host = rawHost.split(',')[0].trim() || "heiraza.com";
    const proto = rawProto.split(',')[0].trim() || "https";
    const baseUrl = `${proto}://${host}`;

    metadataBase = new URL(baseUrl);
  } catch (e) {
    // If anything fails, use hardcoded fallback
    console.error("[Metadata] URL construction failed, using fallback:", e);
    metadataBase = new URL(FALLBACK_URL);
  }

  return {
    ...baseMetadata,
    metadataBase,
    openGraph: {
      title: "HEIRAZA | Official Website",
      description: "Welcome to the official website of HEIRAZA.",
      url: "/",
      siteName: "Heiraza",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Heiraza - Official Website",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "HEIRAZA | Official Website",
      description: "Welcome to the official website of HEIRAZA.",
      images: ["/og-image.jpg"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cinzel.variable} ${playfair.variable} ${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange={false}
          >
            {children}
            <VersionCheck />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
