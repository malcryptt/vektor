"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
    Download,
    ChevronLeft,
    ShieldAlert,
    ShieldCheck,
    AlertTriangle,
    FileCode,
    ExternalLink
} from 'lucide-react';

interface Finding {
    title: string;
    description: string;
    severity: string;
    remediation: string;
    line_start: number;
    line_end: number;
    code_snippet?: string;
}

interface AuditReport {
    id: string;
    timestamp: string;
    contract_name: string;
    overall_score: number;
    summary: string;
    findings: Finding[];
    raw_code: string;
}

export default function AuditResultPage() {
    const { id } = useParams();
    const [report, setReport] = useState<AuditReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${apiUrl}/audit/${id}`);
                if (!response.ok) throw new Error("Report not found");
                const data = await response.json();
                setReport(data);
            } catch (error) {
                console.error("Failed to fetch report", error);
                router.push('/');
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchReport();
    }, [id, router]);

    const handleDownloadPDF = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        window.open(`${apiUrl}/audit/${id}/pdf`, '_blank');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
        );
    }

    if (!report) return null;

    return (
        <main className="min-h-screen bg-[#050505]">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 pt-32 pb-20">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-muted hover:text-white mb-8 transition-colors group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Audit Tool
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-8">
                        <header className="glass p-8 rounded-2xl border border-white/5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">{report.contract_name}</h1>
                                    <p className="text-muted text-sm">Audited on {new Date(report.timestamp).toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="flex items-center justify-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-semibold hover:bg-white/90 transition-all"
                                >
                                    <Download className="w-4 h-4" />
                                    Export PDF
                                </button>
                            </div>

                            <div className="mt-8 p-6 rounded-xl bg-white/[0.02] border border-white/5">
                                <h3 className="text-lg font-semibold mb-3">Executive Summary</h3>
                                <p className="text-gray-400 leading-relaxed text-sm">{report.summary}</p>
                            </div>
                        </header>

                        <section className="glass rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                                <FileCode className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">Source Code & Analysis</span>
                            </div>
                            <div className="relative bg-black/40 p-6 overflow-x-auto">
                                <pre className="font-mono text-xs leading-6 text-gray-500">
                                    {report.raw_code.split('\n').map((line, i) => {
                                        const lineNum = i + 1;
                                        const finding = report.findings.find(f => f.line_start === lineNum);
                                        return (
                                            <div
                                                key={i}
                                                className={`flex gap-4 px-2 -mx-2 ${finding ? 'bg-red-500/10 border-l-2 border-red-500 text-red-100' : ''}`}
                                            >
                                                <span className="w-8 text-right select-none opacity-30">{lineNum}</span>
                                                <span>{line}</span>
                                            </div>
                                        );
                                    })}
                                </pre>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass p-8 rounded-2xl border border-white/5 text-center">
                            <div className="relative inline-flex items-center justify-center mb-6">
                                <svg className="w-32 h-32">
                                    <circle
                                        cx="64" cy="64" r="60"
                                        className="stroke-white/5 fill-none"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="64" cy="64" r="60"
                                        className={`fill-none ${report.overall_score > 80 ? 'stroke-secondary' : (report.overall_score > 50 ? 'stroke-orange-500' : 'stroke-red-500')}`}
                                        strokeWidth="8"
                                        strokeDasharray={377}
                                        strokeDashoffset={377 - (377 * report.overall_score) / 100}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dashoffset 1.5s ease' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold">{report.overall_score}</span>
                                    <span className="text-[10px] text-muted uppercase tracking-widest">Score</span>
                                </div>
                            </div>
                            <h3 className="font-semibold">Security Health</h3>
                            <p className="text-sm text-muted mt-1">Based on {report.findings.length} findings</p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold px-2">Top Findings</h3>
                            {report.findings.length === 0 ? (
                                <div className="p-6 rounded-xl glass border border-white/5 text-center">
                                    <ShieldCheck className="w-8 h-8 text-secondary mx-auto mb-3" />
                                    <p className="text-sm text-muted">No vulnerabilities detected.</p>
                                </div>
                            ) : (
                                report.findings.map((finding, i) => (
                                    <div key={i} className="p-6 rounded-2xl glass border border-white/5 hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-2 mb-3">
                                            <SeverityBadge severity={finding.severity} />
                                            <span className="text-[10px] text-muted uppercase tracking-widest">Line {finding.line_start}</span>
                                        </div>
                                        <h4 className="font-bold mb-2">{finding.title}</h4>
                                        <p className="text-xs text-gray-400 mb-4 leading-relaxed">{finding.description}</p>
                                        <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                                            <p className="text-[10px] text-primary uppercase font-bold mb-1">Recommendation</p>
                                            <p className="text-[11px] text-gray-300">{finding.remediation}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}

function SeverityBadge({ severity }: { severity: string }) {
    const colors = {
        Critical: "bg-red-500/10 text-red-500 border-red-500/20",
        High: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        Low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors[severity as keyof typeof colors] || colors.Low}`}>
            {severity.toUpperCase()}
        </span>
    );
}
