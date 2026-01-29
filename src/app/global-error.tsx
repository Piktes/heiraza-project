"use client";

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
                    <div className="text-center px-6 max-w-lg">
                        <h1 className="text-6xl font-bold mb-4">500</h1>
                        <h2 className="text-2xl font-semibold mb-4">Server Error</h2>
                        <p className="text-neutral-400 mb-8">
                            Something went wrong on our end. Our team has been notified.
                        </p>
                        <button
                            onClick={reset}
                            className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
