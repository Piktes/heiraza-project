import type { Metadata } from "next";
import { Cinzel, Playfair_Display, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
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

export const metadata: Metadata = {
  metadataBase: new URL((process.env.NEXT_PUBLIC_SITE_URL || "https://heiraza.com").split(',')[0].trim()),
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
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

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
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
