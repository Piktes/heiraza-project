// Country name normalization mapping
// Maps various country name variations to a single canonical name
export const countryAliases: Record<string, string> = {
    // Turkey variations
    "Turkey": "Türkiye",
    "Turkiye": "Türkiye",

    // UK variations
    "UK": "United Kingdom",
    "Great Britain": "United Kingdom",
    "Britain": "United Kingdom",
    "England": "United Kingdom",

    // USA variations
    "USA": "United States",
    "US": "United States",
    "America": "United States",

    // Other common variations
    "Korea": "South Korea",
    "Republic of Korea": "South Korea",
    "UAE": "United Arab Emirates",
    "Holland": "Netherlands",
    "The Netherlands": "Netherlands",
};

// Country to flag emoji mapping (using normalized names)
export const countryFlags: Record<string, string> = {
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    "Canada": "🇨🇦",
    "Germany": "🇩🇪",
    "France": "🇫🇷",
    "Italy": "🇮🇹",
    "Spain": "🇪🇸",
    "Netherlands": "🇳🇱",
    "Australia": "🇦🇺",
    "Japan": "🇯🇵",
    "China": "🇨🇳",
    "India": "🇮🇳",
    "Brazil": "🇧🇷",
    "Mexico": "🇲🇽",
    "Türkiye": "🇹🇷",
    "Russia": "🇷🇺",
    "South Korea": "🇰🇷",
    "Poland": "🇵🇱",
    "Sweden": "🇸🇪",
    "Norway": "🇳🇴",
    "Denmark": "🇩🇰",
    "Finland": "🇫🇮",
    "Ireland": "🇮🇪",
    "Portugal": "🇵🇹",
    "Switzerland": "🇨🇭",
    "Austria": "🇦🇹",
    "Belgium": "🇧🇪",
    "Argentina": "🇦🇷",
    "South Africa": "🇿🇦",
    "Egypt": "🇪🇬",
    "Nigeria": "🇳🇬",
    "Kenya": "🇰🇪",
    "Indonesia": "🇮🇩",
    "Thailand": "🇹🇭",
    "Vietnam": "🇻🇳",
    "Philippines": "🇵🇭",
    "Malaysia": "🇲🇾",
    "Singapore": "🇸🇬",
    "New Zealand": "🇳🇿",
    "Israel": "🇮🇱",
    "United Arab Emirates": "🇦🇪",
    "Saudi Arabia": "🇸🇦",
    "Bulgaria": "🇧🇬",
    "Romania": "🇷🇴",
    "Greece": "🇬🇷",
    "Czech Republic": "🇨🇿",
    "Hungary": "🇭🇺",
    "Ukraine": "🇺🇦",
};

/**
 * Normalize a country name to its canonical form
 */
export function normalizeCountry(country: string | null): string | null {
    if (!country) return null;
    return countryAliases[country] || country;
}

/**
 * Get the flag emoji for a country (handles both normalized and non-normalized names)
 */
export function getCountryFlag(country: string | null): string {
    if (!country) return "🌍";
    const normalized = normalizeCountry(country);
    return countryFlags[normalized || country] || countryFlags[country] || "🌍";
}
