"use client";

export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <div className="flex items-center gap-3 group">
            <svg
                viewBox="0 0 100 100"
                className={className}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Outer Shard */}
                <path
                    d="M10 20L50 85L90 20L50 35L10 20Z"
                    fill="#ff4444"
                    className="opacity-20 group-hover:opacity-30 transition-opacity"
                />
                {/* Core V */}
                <path
                    d="M25 30L50 70L75 30"
                    stroke="#ff4444"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-white transition-colors duration-500"
                />
                {/* Inner Accent */}
                <path
                    d="M50 35V55"
                    stroke="#ff4444"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="animate-pulse"
                />
            </svg>
            <span className="font-black text-2xl tracking-[0.2em] uppercase italic group-hover:text-primary transition-colors">
                VEKTOR
            </span>
        </div>
    );
}
