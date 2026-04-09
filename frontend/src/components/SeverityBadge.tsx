"use client";

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SeverityBadgeProps {
    severity: string;
    className?: string;
}

export default function SeverityBadge({ severity, className }: SeverityBadgeProps) {
    const colors = {
        Critical: "bg-primary/20 text-primary border-primary/30",
        High: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        Low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    };

    const variant = severity as keyof typeof colors || "Low";

    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider",
            colors[variant],
            className
        )}>
            {severity}
        </span>
    );
}
