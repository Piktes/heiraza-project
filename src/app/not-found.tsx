import Link from "next/link";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background grain">
            {/* Background decorations */}
            <div className="absolute top-1/4 left-10 w-64 h-64 bg-accent-coral/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent-peach/10 rounded-full blur-3xl" />

            <div className="relative z-10 text-center px-6 max-w-lg">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-coral/10 flex items-center justify-center">
                    <AlertTriangle size={40} className="text-accent-coral" />
                </div>

                {/* Error Code */}
                <h1 className="font-display text-8xl tracking-widest text-accent-coral mb-4">
                    404
                </h1>

                {/* Title */}
                <h2 className="font-display text-2xl tracking-wide uppercase mb-4">
                    Page Not Found
                </h2>

                {/* Message */}
                <p className="text-muted-foreground mb-8 leading-relaxed">
                    The page you're looking for doesn't exist or has been moved.
                    Let's get you back on track.
                </p>

                {/* Action Button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-accent-coral hover:bg-accent-coral/90 text-white font-medium transition-colors"
                >
                    <Home size={20} />
                    Return to Home
                </Link>
            </div>
        </div>
    );
}
