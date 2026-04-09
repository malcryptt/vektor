"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Code2, Play, Loader2, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function CodeSubmission() {
    const [code, setCode] = useState("");
    const [contractName, setContractName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleAudit = async () => {
        if (!code) return;
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, contract_name: contractName || "SolanaProgram" }),
            });
            const data = await response.json();
            router.push(`/audit/${data.id}`);
        } catch (error) {
            console.error("Audit failed", error);
            alert("Failed to connect to Vektor API. Make sure the backend is running.");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-20" id="audit-tool">
            <div className="glass rounded-2xl overflow-hidden border border-white/10 glow">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            placeholder="Contract Name (e.g. CandyMachine)"
                            className="bg-transparent text-sm border-none focus:ring-0 placeholder:text-muted w-64"
                            value={contractName}
                            onChange={(e) => setContractName(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleAudit}
                        disabled={isLoading || !code}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-6 py-2 rounded-full text-sm font-medium transition-all"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Analyze Contract
                    </button>
                </div>

                <div className="relative group">
                    <textarea
                        className="w-full h-[500px] bg-black/40 p-8 font-mono text-sm leading-relaxed resize-none border-none focus:ring-0 text-gray-300 placeholder:text-white/10"
                        placeholder="// Paste your Solana smart contract code here (Rust)..."
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    {!code && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                            <Code2 className="w-20 h-20" />
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-gray-400">
                    Vektor uses an AI model optimized for Solana. While highly accurate, we recommend manual review for mission-critical production deployments.
                </p>
            </div>
        </div>
    );
}
