/**
 * Image URL Helper
 * Converts relative upload paths to absolute URLs for Next.js Image Optimizer
 * This ensures the optimizer fetches from nginx instead of internal server
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://test.heiraza.com';

/**
 * Converts a relative image URL to an absolute URL
 * @param url - The image URL (can be relative like "/uploads/..." or absolute)
 * @returns Absolute URL for the image
 */
export function getImageUrl(url: string | null | undefined): string {
    if (!url) return '';

    // Already absolute URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Data URL (base64) - return as is
    if (url.startsWith('data:')) {
        return url;
    }

    // Relative URL - prepend site URL for production
    if (url.startsWith('/')) {
        // In development, use relative paths
        if (process.env.NODE_ENV === 'development') {
            return url;
        }
        // In production, use absolute URL so optimizer fetches from nginx
        return `${SITE_URL}${url}`;
    }

    return url;
}

/**
 * Check if an image URL is from uploads folder
 */
export function isUploadedImage(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.includes('/uploads/');
}
