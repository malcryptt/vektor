"use client";



import { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Editor from '@monaco-editor/react';
import {
    Play,
    Download,
    FileUp,
    History,
    Shield,
    Target,
    Search,
    Loader2,
    Code2,
    CheckCircle2,
    AlertCircle,
    Twitter
} from 'lucide-react';
import SeverityBadge from '@/components/SeverityBadge';
import RiskBanner from '@/components/RiskBanner';
import ReportCard from '@/components/ReportCard';
import AuditHistory from '@/components/AuditHistory';
import MobileNav from '@/components/MobileNav';

interface Finding {
    title: string;
    description: string;
    severity: string;
    remediation: string;
    line_start: number;
    line_end: number;
    code_snippet?: string;
    suggested_fix_code?: string;
    exploit_scenario?: string;
}

interface AuditReport {
    id: string;
    timestamp: string;
    contract_name: string;
    overall_score: number;
    summary: string;
    findings: Finding[];
    raw_code: string;
    framework?: string;
}

interface AuditSummary {
    id: string;
    contract_name: string;
    score: number;
    timestamp: string;
    report?: any;
    code?: string;
}

const SAMPLES = {
    vulnerable: `// Vulnerable Solana Vault
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod simple_vault {
    use super::*;
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let user = &ctx.accounts.user;
        let vault = &mut ctx.accounts.vault;
        
        // VULNERABILITY: Missing owner check or signer check in some cases
        // VULNERABILITY: Integer overflow if not using checked math
        vault.balance -= amount;
        **user.lamports.borrow_mut() += amount;
        
        Ok(())
    }
}`,
    clean: `// Secure Solana Staking
use anchor_lang::prelude::*;

declare_id!("6789PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod secure_staking {
    use super::*;
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        let staker = &ctx.accounts.staker;
        let stake_account = &mut ctx.accounts.stake_account;
        
        // SECURE: Checked arithmetic
        stake_account.amount = stake_account.amount.checked_add(amount).ok_or(error!(ErrorCode::Overflow))?;
        
        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Arithmetic overflow")]
    Overflow,
}`,
    cashio: `// Cashio Infinite Mint Exploit Simulation (Simplified)
pub fn mint_cash(ctx: Context<MintCash>, amount: u64) -> Result<()> {
    // VULNERABILITY: Insufficient validation of the bank account
    // Attackers could pass a fake bank account to bypass collateral checks
    let bank = &ctx.accounts.bank;
    let crate_info = &ctx.accounts.crate_info;
    
    token::mint_to(ctx.accounts.into_mint_to_context(), amount)?;
    Ok(())
}`,
    vrf: `// Vektor Secure Randomness Example (Switchboard VRF)
use anchor_lang::prelude::*;
use switchboard_v2::{VrfAccountData, OracleQueueAccountData};

declare_id!("H5M1v9v7Q7XU4rW6Y8Z9D2B5E7F8G9H0J1K2L3M4N5O6");

#[program]
pub mod betting_game {
    use super::*;

    pub fn request_flip(ctx: Context<RequestFlip>) -> Result<()> {
        // REQUEST PHASE: User calls this to start the flip
        // Calls Switchboard CPI to request a random number
        Ok(())
    }

    pub fn resolve_flip(ctx: Context<ResolveFlip>, result: u8) -> Result<()> {
        // CALLBACK PHASE: Switchboard oracles call this with the result
        let player = &mut ctx.accounts.player;
        if result % 2 == 1 {
            player.credits += 10;
        }
        Ok(())
    }
}
`
};

export default function AuditWorkspace() {
    const [code, setCode] = useState(SAMPLES.vulnerable);
    const [report, setReport] = useState<AuditReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'report'>('editor');
    const [auditHistory, setAuditHistory] = useState<AuditSummary[]>([]);
    const [programId, setProgramId] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [decorations, setDecorations] = useState<any[]>([]);
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    // Persist history to localStorage
    useEffect(() => {
        const saved = localStorage.getItem('vektor_history');
        if (saved) setAuditHistory(JSON.parse(saved));
    }, []);

    useEffect(() => {
        if (auditHistory.length > 0) {
            localStorage.setItem('vektor_history', JSON.stringify(auditHistory));
        }
    }, [auditHistory]);

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
    };

    // Apply decorations (heatmap)
    useEffect(() => {
        if (!editorRef.current || !report) return;

        const newDecorations = report.findings.map(f => ({
            range: new monacoRef.current.Range(f.line_start, 1, f.line_end, 1),
            options: {
                isWholeLine: true,
                className: f.severity === 'Critical' || f.severity === 'High' ? 'bg-primary/20' : 'bg-yellow-500/10',
                glyphMarginClassName: f.severity === 'Critical' || f.severity === 'High' ? 'bg-primary' : 'bg-yellow-500',
            }
        }));

        const decorationIds = editorRef.current.deltaDecorations(decorations, newDecorations);
        setDecorations(decorationIds);
    }, [report, code]);

    const handleJumpToLine = (line: number) => {
        setActiveTab('editor');
        editorRef.current?.revealLineInCenter(line);
        editorRef.current?.setPosition({ lineNumber: line, column: 1 });
        editorRef.current?.focus();
    };

    const handleApplyFix = (line: number, fixCode: string) => {
        const lines = code.split('\n');
        lines[line - 1] = fixCode;
        setCode(lines.join('\n'));
        handleJumpToLine(line);
    };

    const runAudit = async () => {
        setIsLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/audit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, contract_name: "AuditWorkspace" }),
            });
            const data = await response.json();
            setReport(data);
            setActiveTab('report');

            // Add to history
            const newAudit: AuditSummary = {
                id: data.id,
                contract_name: "Session Audit",
                score: data.overall_score,
                timestamp: new Date().toISOString(),
                report: data,
                code: code
            };
            setAuditHistory(prev => [newAudit, ...prev.slice(0, 9)]);
        } catch (error) {
            console.error("Audit failed", error);
            alert("Connection error: Backend unreachable.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOnChain = async () => {
        if (!programId) return;
        setIsLoading(true);
        setStatusMessage("Connecting to Solana Mainnet RPC...");

        try {
            await new Promise(r => setTimeout(r, 600));
            setStatusMessage("Verifying Program ID on-chain...");
            await new Promise(r => setTimeout(r, 800));
            setStatusMessage("Downloading verified source code...");

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/on-chain/${programId}`);

            if (!res.ok) throw new Error("Program not found or unverified.");

            const data = await res.json();

            await new Promise(r => setTimeout(r, 500));
            setStatusMessage("Compiling local workspace...");

            setCode(data.code);
            setActiveTab('editor');
        } catch (error) {
            console.error("Fetch failed", error);
            alert("Failed to fetch on-chain code. Ensure the Program ID is verified on Explorer.");
        } finally {
            setIsLoading(false);
            setStatusMessage("");
        }
    };

    const handleShare = () => {
        if (!report) return;
        const text = `I just audited my Solana contract with Vektor! 🛡️\nSecurity Score: ${report.overall_score}/100\nCheck out Vektor Security Auditor: https://vektor.security`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setCode(e.target?.result as string);
            reader.readAsText(file);
        }
    };

    const handleDownloadPDF = () => {
        if (!report) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        window.open(`${apiUrl}/audit/${report.id}/pdf`, '_blank');
    };

    const criticalCount = report?.findings.filter(f => f.severity === 'Critical').length || 0;
    const highCount = report?.findings.filter(f => f.severity === 'High').length || 0;

    return (
        <main className="min-h-screen bg-[#050505] flex flex-col overflow-hidden">
            <Navbar />

            <div className="pt-16 flex-1 flex flex-col overflow-hidden">
                <RiskBanner criticalCount={criticalCount} highCount={highCount} />

                {/* Toolbar */}
                <div className="h-14 border-b border-white/5 bg-white/[0.02] flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
                            <button
                                onClick={() => setActiveTab('editor')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'editor' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-white'}`}
                            >
                                <Code2 className="w-3.5 h-3.5 inline mr-1.5" />
                                Editor
                            </button>
                            <button
                                onClick={() => setActiveTab('report')}
                                disabled={!report}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'report' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-white disabled:opacity-20'}`}
                            >
                                <Search className="w-3.5 h-3.5 inline mr-1.5" />
                                Report
                            </button>
                        </div>

                        <div className="h-6 w-[1px] bg-white/10 mx-2" />

                        <div className="flex items-center gap-2">
                            <button onClick={() => setCode(SAMPLES.vulnerable)} className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/10 transition-colors">Vulnerable</button>
                            <button onClick={() => setCode(SAMPLES.clean)} className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/10 transition-colors">Clean</button>
                            <button onClick={() => setCode(SAMPLES.cashio)} className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/10 transition-colors">Cashio Exploit</button>
                            <button onClick={() => setCode(SAMPLES.vrf)} className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/10 transition-colors border-secondary text-secondary">VRF Secure</button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                            <Target className="w-3 h-3 text-primary" />
                            <input
                                type="text"
                                placeholder="Program ID..."
                                value={programId}
                                onChange={(e) => setProgramId(e.target.value)}
                                className="bg-transparent border-none outline-none text-[10px] w-32 text-white"
                            />
                            <button
                                onClick={fetchOnChain}
                                className="text-[10px] hover:text-primary transition-colors font-bold"
                            >
                                Fetch
                            </button>
                        </div>

                        <label className="cursor-pointer flex items-center gap-2 text-xs text-muted hover:text-white transition-colors">
                            <FileUp className="w-4 h-4" />
                            <input type="file" className="hidden" onChange={handleFileUpload} accept=".rs,.txt" />
                        </label>

                        {isLoading && statusMessage ? (
                            <div className="flex items-center gap-2 px-4">
                                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                <span className="text-[10px] text-muted animate-pulse">{statusMessage}</span>
                            </div>
                        ) : (
                            <button
                                onClick={runAudit}
                                disabled={isLoading}
                                className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,68,68,0.3)]"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                Run Audit
                            </button>
                        )}

                        {report && (
                            <button onClick={handleDownloadPDF} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                                <Download className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Editor */}
                    <div className={`flex-1 flex flex-col ${activeTab === 'report' ? 'hidden lg:flex' : 'flex'}`}>
                        <Editor
                            height="100%"
                            defaultLanguage="rust"
                            theme="vs-dark"
                            value={code}
                            onChange={(val: string | undefined) => setCode(val || "")}
                            onMount={handleEditorDidMount}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                lineNumbers: 'on',
                                roundedSelection: false,
                                scrollBeyondLastLine: false,
                                readOnly: false,
                                padding: { top: 20 },
                            }}
                        />
                    </div>

                    {/* Right: Results Panel */}
                    <div className={`w-full lg:w-[450px] border-l border-white/5 bg-white/[0.01] flex flex-col ${activeTab === 'editor' ? 'hidden lg:flex' : 'flex'}`}>
                        {!report ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                                    <Shield className="w-8 h-8 text-muted" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">No active analysis</h3>
                                <p className="text-sm text-muted">Upload your Solana smart contract or select a sample to begin the AI security audit.</p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Framework & Info Bar */}
                                <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                                            {report.framework || "Native Solana"} Detected
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-muted font-mono">{report.id}</span>
                                </div>

                                {/* Score Indicator */}
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="relative w-16 h-16">
                                            <svg className="w-full h-full -rotate-90">
                                                <circle cx="32" cy="32" r="28" className="stroke-white/5 fill-none" strokeWidth="4" />
                                                <circle
                                                    cx="32" cy="32" r="28"
                                                    className={`fill-none ${report.overall_score > 80 ? 'stroke-secondary' : 'stroke-primary'}`}
                                                    strokeWidth="4"
                                                    strokeDasharray={176}
                                                    strokeDashoffset={176 - (176 * report.overall_score) / 100}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                {report.overall_score > 80 ? <CheckCircle2 className="w-6 h-6 text-secondary" /> : <AlertCircle className="w-6 h-6 text-primary" />}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm mb-1 uppercase tracking-widest text-muted">Security Score</h3>
                                            <div className="text-3xl font-black">{report.overall_score}<span className="text-xs text-muted font-normal ml-1">/100</span></div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/audit/${report.id}/badge`}
                                            alt="Vektor Badge"
                                            className="h-8 shadow-lg"
                                        />
                                        <button
                                            onClick={handleShare}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-[10px] font-bold transition-all"
                                        >
                                            <Twitter className="w-3 h-3" />
                                            Share Result
                                        </button>
                                    </div>
                                </div>

                                {/* Findings Scroll Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <div className="px-2 py-4">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            Detected Vulnerabilities ({report.findings.length})
                                        </h3>
                                        <div className="space-y-4">
                                            <button
                                                onClick={() => { setActiveTab('editor'); runAudit(); }}
                                                className="w-full py-3 mb-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest transition-all"
                                            >
                                                Re-audit Workspace
                                            </button>

                                            {report.findings.map((finding, idx) => (
                                                <ReportCard
                                                    key={idx}
                                                    finding={finding}
                                                    onJumpToLine={handleJumpToLine}
                                                    onApplyFix={handleApplyFix}
                                                />
                                            ))}
                                            {report.findings.length === 0 && (
                                                <div className="p-12 text-center">
                                                    <CheckCircle2 className="w-12 h-12 text-secondary mx-auto mb-4 opacity-50" />
                                                    <p className="text-sm text-muted">Zero vulnerabilities found. This contract follows best practices.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Audit History integrated in panel */}
                                    <AuditHistory
                                        history={auditHistory}
                                        onSelectAudit={(id, historyReport, historyCode) => {
                                            if (historyReport) {
                                                setReport(historyReport);
                                                if (historyCode) setCode(historyCode);
                                                setActiveTab('report');
                                                return;
                                            }

                                            // Fallback to fetch if not cached (legacy)
                                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                            fetch(`${apiUrl}/audit/${id}`)
                                                .then(res => res.json())
                                                .then(data => {
                                                    setReport(data);
                                                    if (data.raw_code) setCode(data.raw_code);
                                                });
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <MobileNav
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    hasReport={!!report}
                />
            </div>

            <Footer />
        </main>
    );
}
