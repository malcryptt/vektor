"use client";

import { History, Shield, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface AuditSummary {
    id: string;
    contract_name: string;
    score: number;
    timestamp: string;
}

interface AuditHistoryProps {
    history: AuditSummary[];
    onSelectAudit: (id: string) => void;
}

export default function AuditHistory({ history, onSelectAudit }: AuditHistoryProps) {
    if (history.length === 0) return null;

    return (
        <div className="mt-8 pt-8 border-t border-white/5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                <History className="w-3 h-3" />
                Recent Audits
            </h3>
            <div className="space-y-2">
                {history.map((audit) => (
                    <button
                        key={audit.id}
                        onClick={() => onSelectAudit(audit.id)}
                        className="w-full p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all text-left group"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold truncate pr-2">{audit.contract_name}</span>
                            <span className={`text-[10px] font-bold ${audit.score > 80 ? 'text-secondary' : 'text-primary'}`}>
                                {audit.score}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] text-muted">
                                {new Date(audit.timestamp).toLocaleDateString()}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
