import prisma from "@/lib/prisma";

interface JsonLdProps {
    artist?: {
        name: string;
        bio: string;
        heroImage?: string | null;
        facebookUrl?: string | null;
        instagramUrl?: string | null;
        youtubeUrl?: string | null;
        spotifyUrl?: string | null;
        twitterUrl?: string | null;
    } | null;
}

export async function JsonLd({ artist }: JsonLdProps) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://heiraza.com";

    // MusicGroup Schema
    const musicGroupSchema = {
        "@context": "https://schema.org",
        "@type": "MusicGroup",
        name: artist?.name || "Heiraza",
        description: artist?.bio || "Experience the sound that moves souls.",
        url: baseUrl,
        image: artist?.heroImage || `${baseUrl}/og-image.jpg`,
        genre: ["Electronic", "Ambient", "Experimental"],
        sameAs: [
            artist?.facebookUrl,
            artist?.instagramUrl,
            artist?.youtubeUrl,
            artist?.spotifyUrl,
            artist?.twitterUrl,
        ].filter(Boolean),
    };

    // Person Schema
    const personSchema = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: artist?.name || "Heiraza",
        description: artist?.bio || "Sonic Architect and Music Producer",
        url: baseUrl,
        image: artist?.heroImage || `${baseUrl}/og-image.jpg`,
        jobTitle: "Sonic Architect",
        sameAs: [
            artist?.facebookUrl,
            artist?.instagramUrl,
            artist?.youtubeUrl,
            artist?.spotifyUrl,
            artist?.twitterUrl,
        ].filter(Boolean),
    };

    // Website Schema
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Heiraza - Official Website",
        url: baseUrl,
        description: "Official website of Heiraza - Music, Events, and Exclusive Merch",
        publisher: {
            "@type": "Person",
            name: artist?.name || "Heiraza",
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(musicGroupSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
        </>
    );
}
