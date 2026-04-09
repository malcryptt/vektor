"use client";

import { useEffect, useState } from 'react';

interface SecurityScoreProps {
    score: number;
}

export default function SecurityScore({ score }: SecurityScoreProps) {
    const [offset, setOffset] = useState(283); // 2 * pi * 45 = ~282.7

    useEffect(() => {
        // Start animation after a tiny delay so the transition triggers
        const timer = setTimeout(() => {
            setOffset(283 - (283 * Math.max(0, Math.min(100, score))) / 100);
        }, 100);
        return () => clearTimeout(timer);
    }, [score]);

    const getColor = (s: number) => {
        if (s <= 30) return 'stroke-red-500';
        if (s <= 60) return 'stroke-orange-500';
        if (s <= 80) return 'stroke-yellow-500';
        return 'stroke-[#00cc66]'; // green
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 border-b border-white/5 relative bg-white/[0.01]">
            <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform">
                    <circle
                        cx="64" cy="64" r="45"
                        className="stroke-white/5 fill-none"
                        strokeWidth="8"
                    />
                    <circle
                        cx="64" cy="64" r="45"
                        className={`fill-none transition-all duration-1000 ease-out ${getColor(score)}`}
                        strokeWidth="8"
                        strokeDasharray={283}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center mt-1">
                    <span className="text-4xl font-black text-white">{score}</span>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-muted mt-1">Security Score</span>
                </div>
            </div>
        </div>
    );
}
