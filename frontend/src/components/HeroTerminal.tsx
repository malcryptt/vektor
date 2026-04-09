"use client";

import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

const AUDIT_LINES = [
    { text: "> Initiating Vektor Deep Scan...", color: "text-gray-400" },
    { text: "> Analysis protocol: Solana v1.18.0", color: "text-gray-400" },
    { text: "> Checking account validation logic...", color: "text-blue-400" },
    { text: "> SCANNING: pub fn withdraw(ctx: Context<Withdraw>) { ... }", color: "text-gray-500" },
    { text: "!! CRITICAL: Missing signer check on 'user' account", color: "text-primary" },
    { text: "> Patching suggested: if !user.is_signer { ... }", color: "text-secondary" },
    { text: "> Running formal verification...", color: "text-gray-400" },
    { text: ">> Status: 1 Critical, 0 High found.", color: "text-primary font-bold" },
    { text: "> Report generated: /tmp/audit_0xf4...pdf", color: "text-gray-400 font-mono" },
];

export default function HeroTerminal() {
    const [visibleLines, setVisibleLines] = useState<number>(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setVisibleLines(prev => (prev < AUDIT_LINES.length - 1 ? prev + 1 : 0));
        }, 15);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto lg:ml-auto group relative">
            {/* Glow Background */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-500/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

            <div className="relative bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="h-10 bg-white/5 border-b border-white/5 flex items-center justify-between px-4">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted">Vektor Security Terminal</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 font-mono text-xs leading-relaxed min-h-[300px] flex flex-col justify-end">
                    <div className="space-y-2">
                        {AUDIT_LINES.slice(0, visibleLines + 1).map((line, i) => (
                            <div key={i} className={`flex gap-3 items-start animate-fade-in`}>
                                <ChevronRight className="w-3 h-3 mt-0.5 opacity-20" />
                                <span className={line.color}>{line.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="h-8 bg-primary/10 flex items-center px-4 overflow-hidden">
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-[scan_2s_infinite]" style={{ width: '40%' }}></div>
                    </div>
                </div>
            </div>

            {/* Floating Badges */}
            <div className="absolute -top-6 -right-6 lg:-right-12 p-4 bg-black border border-primary/20 rounded-2xl shadow-2xl animate-bounce-slow hidden sm:block">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <div className="text-[10px] text-muted uppercase font-bold">Risk Detected</div>
                        <div className="text-sm font-black text-white">Critical Bug</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add these to globals.css if not present
// @keyframes scan {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(300%); }
// }
