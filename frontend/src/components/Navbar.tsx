"use client";

import Link from 'next/link';
import { Shield, Github, Twitter } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">VEKTOR</span>
                </Link>

                <div className="flex items-center gap-6">
                    <Link href="/#features" className="text-sm text-muted hover:text-white transition-colors">Features</Link>
                    <div className="h-4 w-[1px] bg-white/10 mx-2" />
                    <div className="flex items-center gap-4">
                        <a href="https://github.com/malcryptt/vektor" target="_blank" rel="noreferrer" className="text-muted hover:text-white transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                        <Link href="/audit" className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all">
                            Launch App
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
