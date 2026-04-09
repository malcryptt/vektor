"use client";

export default function Footer() {
    return (
        <footer className="border-t border-white/5 bg-black/50 py-12">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col gap-2">
                        <div className="font-bold text-xl tracking-tight">VEKTOR</div>
                        <p className="text-muted text-sm max-w-xs">
                            AI-powered security auditor for the Solana ecosystem. Building the future of secure decentralized applications.
                        </p>
                    </div>

                    <div className="text-sm text-muted">
                        © 2026 Vektor. Hackathon Submission — Solana Frontier 2026.
                    </div>
                </div>
            </div>
        </footer>
    );
}
