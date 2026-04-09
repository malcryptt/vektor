"use client";

export default function Footer() {
    return (
        <footer className="border-t border-white/5 bg-black/50 py-12">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-8">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="font-black text-2xl tracking-tighter uppercase italic">VEKTOR</div>
                        <p className="text-muted text-xs md:text-sm max-w-xs leading-relaxed">
                            AI-powered security auditor for the Solana ecosystem. Building the future of secure decentralized applications.
                        </p>
                    </div>

                    <div className="text-[10px] md:text-sm text-muted font-bold uppercase tracking-widest opacity-50">
                        © 2026 Vektor. Solana Frontier 2026.
                    </div>
                </div>
            </div>
        </footer>
    );
}
