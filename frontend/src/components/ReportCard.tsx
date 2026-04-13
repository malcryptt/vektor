"use client";

import { useState, useEffect } from 'react';
import SeverityBadge from './SeverityBadge';
import { AlertOctagon } from 'lucide-react';
import hljs from 'highlight.js/lib/core';
import rust from 'highlight.js/lib/languages/rust';
import 'highlight.js/styles/github-dark.css';
import { Code2 } from 'lucide-react';

hljs.registerLanguage('rust', rust);

interface Finding {
    vulnerability: string;
    severity: string;
    explanation: string;
    recommendation: string;
    corrected_code?: string | null;
    exploit_poc?: string | null;
    anchor_test?: string | null;
    confidence_score?: number;
    line_number?: number | null;
    source?: string;
}

interface ReportCardProps {
    finding: Finding;
    onJumpToLine?: (line: number | null | undefined) => void;
    onApplyFix?: (line: number | null | undefined, fix: string) => void;
}

export default function ReportCard({ finding, onJumpToLine, onApplyFix }: ReportCardProps) {
    const [isFixExpanded, setIsFixExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'fix' | 'poc' | 'test'>('fix');

    useEffect(() => {
        if (isFixExpanded) {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block as HTMLElement);
            });
        }
    }, [isFixExpanded, finding.corrected_code]);

    return (
        <div className="p-5 rounded-xl glass border border-white/5 hover:border-white/10 transition-all group overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2">
                    <SeverityBadge severity={finding.severity} />
                    {finding.confidence_score && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${finding.confidence_score > 80 ? 'bg-secondary/10 border-secondary/20 text-secondary' :
                                finding.confidence_score > 60 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                    'bg-red-500/10 border-red-500/20 text-red-500'
                            }`}>
                            {finding.confidence_score}% Confidence
                        </span>
                    )}
                </div>
                <button
                    onClick={() => onJumpToLine?.(finding.line_number)}
                    className="text-[10px] text-muted uppercase tracking-widest hover:text-primary transition-colors shrink-0"
                >
                    Line {finding.line_number}
                </button>
            </div>

            <h4 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">{finding.vulnerability}</h4>
            <p className="text-xs text-muted leading-relaxed mb-4">{finding.explanation}</p>

            <div className="space-y-3">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <p className="text-[9px] text-primary uppercase font-bold">Expert Remediation</p>
                        {finding.corrected_code && onApplyFix && (
                            <button
                                onClick={() => onApplyFix(finding.line_number, finding.corrected_code!)}
                                className="text-[9px] bg-primary text-white px-3 py-1 rounded-md font-bold hover:bg-primary/80 transition-all uppercase tracking-tighter w-full sm:w-auto shadow-lg"
                            >
                                Apply Fix
                            </button>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">{finding.recommendation}</p>
                </div>

                {(finding.corrected_code || finding.exploit_poc || finding.anchor_test) && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {finding.corrected_code && (
                                    <button
                                        onClick={() => { setActiveTab('fix'); setIsFixExpanded(true); }}
                                        className={`text-[9px] px-3 py-1 rounded-md uppercase tracking-widest font-bold transition-all border ${activeTab === 'fix' ? 'bg-primary text-white border-primary' : 'text-muted border-white/10 hover:border-white/20'}`}
                                    >
                                        Fix
                                    </button>
                                )}
                                {finding.exploit_poc && (
                                    <button
                                        onClick={() => { setActiveTab('poc'); setIsFixExpanded(true); }}
                                        className={`text-[9px] px-3 py-1 rounded-md uppercase tracking-widest font-bold transition-all border ${activeTab === 'poc' ? 'bg-red-500 text-white border-red-500' : 'text-muted border-white/10 hover:border-white/20'}`}
                                    >
                                        Exploit PoC
                                    </button>
                                )}
                                {finding.anchor_test && (
                                    <button
                                        onClick={() => { setActiveTab('test'); setIsFixExpanded(true); }}
                                        className={`text-[9px] px-3 py-1 rounded-md uppercase tracking-widest font-bold transition-all border ${activeTab === 'test' ? 'bg-secondary text-primary border-secondary' : 'text-muted border-white/10 hover:border-white/20'}`}
                                    >
                                        Anchor Test
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsFixExpanded(!isFixExpanded)}
                                    className="ml-auto text-[9px] px-3 py-1 text-muted hover:text-white uppercase tracking-widest"
                                >
                                    {isFixExpanded ? "Collapse" : "Expand"}
                                </button>
                            </div>

                            {isFixExpanded && (
                                <div className="text-[10px] rounded-lg overflow-hidden border border-white/5">
                                    <div className="bg-white/[0.03] px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
                                        <span className="text-[8px] uppercase font-bold tracking-widest text-muted">
                                            {activeTab === 'fix' ? 'rust / fixed' : activeTab === 'poc' ? 'typescript / exploit' : 'typescript / mocha'}
                                        </span>
                                    </div>
                                    <pre className="p-3 bg-black/40">
                                        <code className={activeTab === 'fix' ? 'language-rust' : 'language-typescript'}>
                                            {activeTab === 'fix' ? finding.corrected_code : activeTab === 'poc' ? finding.exploit_poc : finding.anchor_test}
                                        </code>
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
