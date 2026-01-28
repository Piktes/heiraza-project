import type { Metadata } from "next";
import { Cinzel, Playfair_Display, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
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
  title: "HEIRAZA | Official Website",
  description: "Official website of Heiraza - Experience the sound that moves souls. Music, Events, and Exclusive Merch.",
  keywords: ["Heiraza", "Music", "Artist", "Concerts", "Merch", "Tour", "Events"],
  authors: [{ name: "Heiraza" }],
  openGraph: {
    title: "HEIRAZA | Official Website",
    description: "Experience the sound that moves souls. Music, Events, and Exclusive Merch.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "HEIRAZA | Official Website",
    description: "Experience the sound that moves souls.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cinzel.variable} ${playfair.variable} ${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
