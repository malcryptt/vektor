"use client";

import { Code2, Search, History } from 'lucide-react';

interface MobileNavProps {
    activeTab: 'editor' | 'report' | 'diff';
    setActiveTab: (tab: 'editor' | 'report' | 'diff') => void;
    hasReport: boolean;
}

export default function MobileNav({ activeTab, setActiveTab, hasReport }: MobileNavProps) {
    return (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-[340px]">
            <div className="flex items-center p-1 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl">
                <button
                    onClick={() => setActiveTab('editor')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === 'editor' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}
                >
                    <Code2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Editor</span>
                </button>
                <button
                    onClick={() => setActiveTab('report')}
                    disabled={!hasReport}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === 'report' ? 'bg-primary text-white' : 'text-muted hover:text-white disabled:opacity-30'}`}
                >
                    <Search className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Report</span>
                </button>
                <button
                    onClick={() => setActiveTab('diff')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === 'diff' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}
                >
                    <History className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Diff</span>
                </button>
            </div>
        </div>
    );
}
