"use client";

import SeverityBadge from './SeverityBadge';

interface Finding {
    title: string;
    description: string;
    severity: string;
    remediation: string;
    exploit_scenario?: string;
    line_start: number;
    line_end: number;
    code_snippet?: string;
    suggested_fix_code?: string;
}

interface ReportCardProps {
    finding: Finding;
    onJumpToLine?: (line: number) => void;
    onApplyFix?: (line: number, fix: string) => void;
}

export default function ReportCard({ finding, onJumpToLine, onApplyFix }: ReportCardProps) {
    return (
        <div className="p-5 rounded-xl glass border border-white/5 hover:border-white/10 transition-all group overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <SeverityBadge severity={finding.severity} />
                <button
                    onClick={() => onJumpToLine?.(finding.line_start)}
                    className="text-[10px] text-muted uppercase tracking-widest hover:text-primary transition-colors"
                >
                    Line {finding.line_start}
                </button>
            </div>

            <h4 className="text-sm font-bold mb-2 group-hover:text-primary transition-colors">{finding.title}</h4>
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
                        {finding.suggested_fix_code && onApplyFix && (
                            <button
                                onClick={() => onApplyFix(finding.line_start, finding.suggested_fix_code!)}
                                className="text-[9px] bg-primary text-white px-3 py-1 rounded-md font-bold hover:bg-primary/80 transition-all uppercase tracking-tighter w-full sm:w-auto shadow-lg"
                            >
                                Apply Fix
                            </button>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">{finding.remediation}</p>
                </div>
            </div>
        </div>
    );
}
