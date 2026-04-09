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
    title: string;
    description: string;
    severity: string;
    remediation: string;
    exploit_scenario?: string;
    line_start: number;
    line_end: number;
    code_snippet?: string;
    corrected_code?: string | null;
    source?: string;
}

interface ReportCardProps {
    finding: Finding;
    onJumpToLine?: (line: number) => void;
    onApplyFix?: (line: number, fix: string) => void;
}

export default function ReportCard({ finding, onJumpToLine, onApplyFix }: ReportCardProps) {
    const [isFixExpanded, setIsFixExpanded] = useState(false);

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
                    {finding.source === "signature" && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] uppercase tracking-widest font-black">
                            <AlertOctagon className="w-3 h-3" />
                            Known Exploit Pattern
                        </div>
                    )}
                </div>
                <button
                    onClick={() => onJumpToLine?.(finding.line_start)}
                    className="text-[10px] text-muted uppercase tracking-widest hover:text-primary transition-colors shrink-0"
                >
                    Line {finding.line_start}
                </button>
            </div>

            <h4 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">{finding.title}</h4>
            {finding.source === "signature" && (
                <p className="text-[10px] text-red-500/80 italic mb-2 font-bold tracking-tight">This pattern matches a real-world exploit.</p>
            )}
            <p className="text-xs text-muted leading-relaxed mb-4">{finding.description}</p>

            <div className="space-y-3">
                {finding.code_snippet && (
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] text-gray-400 overflow-x-auto">
                        <span className="text-primary/50 mr-2">{finding.line_start}|</span>
                        {finding.code_snippet}
                    </div>
                )}

                {finding.exploit_scenario && (
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                        <p className="text-[9px] text-primary uppercase font-bold mb-1">Attacker Logic (Simulation)</p>
                        <p className="text-[11px] text-gray-400 italic leading-relaxed">{finding.exploit_scenario}</p>
                    </div>
                )}

                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <p className="text-[9px] text-primary uppercase font-bold">Expert Remediation</p>
                        {finding.corrected_code && onApplyFix && (
                            <button
                                onClick={() => onApplyFix(finding.line_start, finding.corrected_code!)}
                                className="text-[9px] bg-primary text-white px-3 py-1 rounded-md font-bold hover:bg-primary/80 transition-all uppercase tracking-tighter w-full sm:w-auto shadow-lg"
                            >
                                Apply Fix
                            </button>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">{finding.remediation}</p>
                </div>

                {finding.corrected_code && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
                                <Code2 className="w-3.5 h-3.5" />
                                Suggested Fix
                            </span>
                            <button
                                onClick={() => setIsFixExpanded(!isFixExpanded)}
                                className="text-[9px] px-3 py-1 rounded-md border transition-all text-[#00cc66] border-[#00cc66] hover:bg-[#00cc66]/10 uppercase tracking-widest font-bold"
                            >
                                {isFixExpanded ? "Hide Fix" : "Show Fix"}
                            </button>
                        </div>
                        {isFixExpanded && (
                            <div className="mt-2 text-[10px] rounded-lg overflow-hidden border border-white/5">
                                <pre className="m-0! p-3!">
                                    <code className="language-rust">
                                        {finding.corrected_code}
                                    </code>
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
