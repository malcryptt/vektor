"use client";

import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface RiskBannerProps {
    criticalCount: number;
    highCount: number;
}

export default function RiskBanner({ criticalCount, highCount }: RiskBannerProps) {
    if (criticalCount === 0 && highCount === 0) return null;

    return (
        <div className="bg-primary/10 border-y border-primary/20 py-3 px-6 animate-pulse">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 md:gap-3">
                    <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
                    <p className="text-[10px] md:text-sm font-bold text-primary leading-tight uppercase tracking-tight">
                        High Risk: {criticalCount} Critical and {highCount} High found.
                        Remediation required.
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/60">
                    <AlertTriangle className="w-3 h-3" />
                    Think Like An Attacker
                </div>
            </div>
        </div>
    );
}
