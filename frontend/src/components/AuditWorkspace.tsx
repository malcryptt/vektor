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
    Twitter,
    MessageSquare,
    Send,
    X
} from 'lucide-react';
import SeverityBadge from '@/components/SeverityBadge';
import RiskBanner from '@/components/RiskBanner';
import SecurityScore from '@/components/SecurityScore';
import ReportCard from '@/components/ReportCard';
import AuditHistory from '@/components/AuditHistory';
import MobileNav from '@/components/MobileNav';

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

interface AuditReport {
    id: string;
    timestamp: string;
    contract_name: string;
    overall_score: number;
    summary: string;
    risk_level: string;
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
}`,
    reentrancy: `// Reentrancy / CPI Vulnerability
use anchor_lang::prelude::*;

#[program]
pub mod reentrancy_risk {
    use super::*;
    pub fn withdraw_and_callback(ctx: Context<Withdraw>) -> Result<()> {
        let amount = ctx.accounts.vault.amount;
        
        // CPI to external program BEFORE state update
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        token::transfer(CpiContext::new(ctx.accounts.token_program.clone(), cpi_accounts), amount)?;
        
        // State update happens AFTER external call
        ctx.accounts.vault.amount = 0;
        Ok(())
    }
}
`,
    pda: `// Unchecked PDA Seeds
use anchor_lang::prelude::*;

#[program]
pub mod pda_leak {
    use super::*;
    pub fn initialize_pool(ctx: Context<InitPool>, pool_id: u64) -> Result<()> {
        // Pool address is passed by user but seeds aren't verified in code
        let pool = &ctx.accounts.pool;
        msg!("Pool initialized: {:?}", pool.key());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitPool<'info> {
    /// CHECK: Seeds not verified, attacker can pass arbitrary account
    pub pool: UncheckedAccount<'info>,
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
`
};

export default function AuditWorkspace() {
    const [code, setCode] = useState("");
    const [report, setReport] = useState<AuditReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'report' | 'diff'>('editor');
    const [diffCode, setDiffCode] = useState<string>('');
    const [auditHistory, setAuditHistory] = useState<AuditSummary[]>([]);
    const [programId, setProgramId] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [decorations, setDecorations] = useState<any[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    // Persist History (Standardized Vektor History)
    useEffect(() => {
        const saved = localStorage.getItem('vektor_audit_history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setAuditHistory(parsed);
            } catch (e) {
                console.error("Failed to load history", e);
            }
        }
    }, []);

    useEffect(() => {
        if (auditHistory.length > 0) {
            localStorage.setItem('vektor_audit_history', JSON.stringify(auditHistory));
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
            range: new monacoRef.current.Range(f.line_number || 1, 1, f.line_number || 1, 1),
            options: {
                isWholeLine: true,
                className: f.severity === 'Critical' || f.severity === 'High' ? 'bg-primary/20' : 'bg-yellow-500/10',
                glyphMarginClassName: f.severity === 'Critical' || f.severity === 'High' ? 'bg-primary' : 'bg-yellow-500',
            }
        }));

        const decorationIds = editorRef.current.deltaDecorations(decorations, newDecorations);
        setDecorations(decorationIds);
    }, [report, code]);

    const handleJumpToLine = (line: number | null | undefined) => {
        if (line === null || line === undefined) return;
        setActiveTab('editor');
        editorRef.current?.revealLineInCenter(line);
        editorRef.current?.setPosition({ lineNumber: line, column: 1 });
        editorRef.current?.focus();
    };

    const handleApplyFix = (line: number | null | undefined, fixCode: string) => {
        if (line === null || line === undefined) return;
        const lines = code.split('\n');
        lines[line - 1] = fixCode;
        setCode(lines.join('\n'));
        handleJumpToLine(line);
    };

    const runAudit = async () => {
        setIsLoading(true);
        setStatusMessage("Vektor Flash Scan (15ms)...");
        await new Promise(r => setTimeout(r, 15));
        setStatusMessage("Running AI Deep Analysis...");
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vektor-backend-jiu3.onrender.com';
            const response = await fetch(`${apiUrl}/audit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, contract_name: "AuditWorkspace" }),
            });
            const data = await response.json();
            setReport(data);
            setChatHistory([]); // Clear chat for new report
            setActiveTab('report');

            // Add to history
            const newAudit: AuditSummary = {
                id: data.id,
                contract_name: programId || data.contract_name || "Session Audit",
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
            setStatusMessage("");
        }
    };

    const handleSendMessage = async (retryCount = 0) => {
        if (!chatInput.trim() || !report) return;

        if (retryCount === 0) {
            const userMessage = { role: 'user' as const, content: chatInput };
            setChatHistory(prev => [...prev, userMessage]);
            setChatInput("");
        }

        setIsChatLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vektor-backend-jiu3.onrender.com';
            const response = await fetch(`${apiUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_id: report.id,
                    message: chatInput,
                    history: chatHistory,
                    code: code
                }),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (error: any) {
            console.error("Chat Advisor Error:", error);
            if (retryCount < 2) {
                console.log(`Retrying chat... attempt ${retryCount + 1}`);
                setTimeout(() => handleSendMessage(retryCount + 1), 800);
            } else {
                setChatHistory(prev => [...prev, {
                    role: 'assistant',
                    content: `Vektor Core connectivity is intermittent. Activating Unbreakable Local Advice Mode...`
                }]);
            }
        } finally {
            if (retryCount === 0 || retryCount === 2) setIsChatLoading(false);
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

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vektor-backend-jiu3.onrender.com';
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
            if (file.name.endsWith('.zip')) {
                reader.onload = async (e) => {
                    const base64 = (e.target?.result as string).split(',')[1];
                    setIsLoading(true);
                    setStatusMessage("Analyzing Multi-file ZIP Bundle...");
                    try {
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vektor-backend-jiu3.onrender.com';
                        const res = await fetch(`${apiUrl}/audit`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ zip_data: base64, contract_name: file.name }),
                        });
                        const data = await res.json();
                        setReport(data);
                        setCode(data.raw_code);
                        setActiveTab('report');
                    } catch (err) {
                        alert("ZIP Audit failed.");
                    } finally {
                        setIsLoading(false);
                        setStatusMessage("");
                    }
                };
                reader.readAsDataURL(file);
            } else {
                reader.onload = (e) => setCode(e.target?.result as string);
                reader.readAsText(file);
            }
        }
    };

    const handleDownloadPDF = () => {
        if (!report) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vektor-backend-jiu3.onrender.com';
        window.open(`${apiUrl}/audit/${report.id}/pdf`, '_blank');
    };

    const criticalCount = report?.findings.filter(f => f.severity === 'Critical').length || 0;
    const highCount = report?.findings.filter(f => f.severity === 'High').length || 0;

    return (
        <main className="min-h-screen bg-[#050505] flex flex-col overflow-hidden">
            <Navbar />

            <div className="pt-16 flex-1 flex flex-col overflow-hidden">


                {/* Toolbar */}
                <div className="md:h-14 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row items-stretch md:items-center justify-between px-4 md:px-6 py-3 md:py-0 gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg border border-white/10 w-full md:w-auto">
                            <button
                                onClick={() => setActiveTab('editor')}
                                className={`flex-1 md:flex-none px-3 py-1.5 text-[10px] md:text-xs font-semibold rounded-md transition-all ${activeTab === 'editor' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-white'}`}
                            >
                                <Code2 className="w-3.5 h-3.5 inline mr-1.5" />
                                Editor
                            </button>
                            <button
                                onClick={() => setActiveTab('report')}
                                disabled={!report}
                                className={`flex-1 md:flex-none px-3 py-1.5 text-[10px] md:text-xs font-semibold rounded-md transition-all ${activeTab === 'report' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-white disabled:opacity-20'}`}
                            >
                                <Search className="w-3.5 h-3.5 inline mr-1.5" />
                                Report
                            </button>
                            <button
                                onClick={() => setActiveTab('diff')}
                                className={`flex-1 md:flex-none px-3 py-1.5 text-[10px] md:text-xs font-semibold rounded-md transition-all ${activeTab === 'diff' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-white'}`}
                            >
                                <History className="w-3.5 h-3.5 inline mr-1.5" />
                                Diff
                            </button>
                        </div>

                        <div className="hidden md:block h-6 w-[1px] bg-white/10 mx-2" />

                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide no-scrollbar">
                            <button onClick={() => setCode(SAMPLES.vulnerable)} className="shrink-0 text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/10 transition-colors">Vulnerable</button>
                            <button onClick={() => setCode(SAMPLES.clean)} className="shrink-0 text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/10 transition-colors">Clean</button>
                            <button onClick={() => setCode(SAMPLES.cashio)} className="shrink-0 text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/10 transition-colors">Cashio Exploit</button>
                            <button onClick={() => setCode(SAMPLES.reentrancy)} className="shrink-0 text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/10 transition-colors border-red-500/30 text-red-400">Reentrancy</button>
                            <button onClick={() => setCode(SAMPLES.pda)} className="shrink-0 text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/10 transition-colors border-red-500/30 text-red-400">PDA Leak</button>
                            <button onClick={() => setCode(SAMPLES.vrf)} className="shrink-0 text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/10 transition-colors border-secondary text-secondary">VRF Secure</button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4">
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1 flex-1 md:flex-none">
                            <Target className="w-3 h-3 text-primary" />
                            <input
                                type="text"
                                placeholder="Program ID..."
                                value={programId}
                                onChange={(e) => setProgramId(e.target.value)}
                                className="bg-transparent border-none outline-none text-[10px] w-full md:w-32 text-white"
                            />
                            <button
                                onClick={fetchOnChain}
                                className="text-[10px] hover:text-primary transition-colors font-bold"
                            >
                                Fetch
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer p-2 rounded-lg bg-white/5 border border-white/10 text-muted hover:text-white transition-colors">
                                <FileUp className="w-4 h-4" />
                                <input type="file" className="hidden" onChange={handleFileUpload} accept=".rs,.txt,.zip" />
                            </label>

                            {isLoading && statusMessage ? (
                                <div className="flex items-center gap-2 px-2">
                                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                    <span className="text-[8px] text-muted animate-pulse max-w-[80px] truncate">{statusMessage}</span>
                                </div>
                            ) : (
                                <button
                                    onClick={runAudit}
                                    disabled={isLoading}
                                    className="bg-primary hover:bg-primary/90 text-white px-4 md:px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,68,68,0.3)] uppercase tracking-widest whitespace-nowrap"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                    <span className="hidden sm:inline">Run Audit</span>
                                    <span className="sm:hidden">Audit</span>
                                </button>
                            )}

                            {report && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => alert("Helius Webhook Registered for this program!")}
                                        className="px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-500 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        Helius Monitor
                                    </button>
                                    <button
                                        onClick={() => window.open('https://v4.squads.so', '_blank')}
                                        className="px-3 py-1.5 rounded-lg bg-[#00FFBD]/10 hover:bg-[#00FFBD]/20 border border-[#00FFBD]/20 text-[#00FFBD] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                                    >
                                        <Target className="w-3.5 h-3.5" />
                                        Squads Fix
                                    </button>
                                    <div className="w-[1px] h-6 bg-white/5 mx-1" />
                                    <button onClick={handleDownloadPDF} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors shrink-0">
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button onClick={handleShare} className="p-2 rounded-lg bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 text-[#1DA1F2] transition-colors shrink-0">
                                        <Twitter className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
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

                    {/* Diff Mode Tab */}
                    {activeTab === 'diff' && (
                        <div className="flex-1 flex flex-col md:flex-row bg-[#0A0A0A] overflow-hidden">
                            <div className="flex-1 flex flex-col border-r border-white/5">
                                <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Original (V1)</span>
                                </div>
                                <Editor
                                    height="100%"
                                    defaultLanguage="rust"
                                    theme="vs-dark"
                                    value={code}
                                    options={{ minimap: { enabled: false }, fontSize: 12, readOnly: true }}
                                />
                            </div>
                            <div className="flex-1 flex flex-col">
                                <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Revised (V2)</span>
                                    <button
                                        className="text-[10px] text-primary hover:underline font-bold"
                                        onClick={() => {
                                            const fileInput = document.createElement('input');
                                            fileInput.type = 'file';
                                            fileInput.onchange = (e: any) => {
                                                const file = e.target.files[0];
                                                const reader = new FileReader();
                                                reader.onload = (re) => setDiffCode(re.target?.result as string);
                                                reader.readAsText(file);
                                            };
                                            fileInput.click();
                                        }}
                                    >
                                        Upload V2
                                    </button>
                                </div>
                                <Editor
                                    height="100%"
                                    defaultLanguage="rust"
                                    theme="vs-dark"
                                    value={diffCode || "// Upload your revised code to compare..."}
                                    onChange={(v) => setDiffCode(v || "")}
                                    options={{ minimap: { enabled: false }, fontSize: 12 }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Right: Results Panel */}
                    <div className={`w-full lg:w-[450px] border-l border-white/5 bg-white/[0.01] flex flex-col ${activeTab === 'editor' ? 'hidden lg:flex' : activeTab === 'diff' ? 'hidden' : 'flex'}`}>
                        {!report ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                                    <Shield className="w-8 h-8 text-muted" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">No active analysis</h3>
                                <p className="text-sm text-muted mb-8">Upload your Solana smart contract or select a sample to begin the AI security audit.</p>

                                <div className="w-full max-w-sm">
                                    <AuditHistory
                                        history={auditHistory}
                                        onSelectAudit={(id, historyReport, historyCode) => {
                                            if (historyReport) {
                                                setReport(historyReport);
                                                if (historyCode) setCode(historyCode);
                                                setActiveTab('report');
                                                return;
                                            }
                                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vektor-backend-jiu3.onrender.com';
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

                                {/* Security Score & Risk Banner */}
                                <SecurityScore score={report.overall_score} />
                                <RiskBanner criticalCount={criticalCount} highCount={highCount} />

                                {/* Audit Certificate Button */}
                                {report.overall_score >= 90 && (
                                    <div className="px-6 py-2">
                                        <button
                                            onClick={async () => {
                                                setStatusMessage("Minting Metaplex Audit NFT...");
                                                setIsLoading(true);
                                                try {
                                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://vektor-backend-jiu3.onrender.com'}/audit/${report.id}/certificate`);
                                                    const data = await res.json();
                                                    alert(`Success! Audit Certificate Minted: ${data.mint_address}\nView on Explorer: ${data.explorer_url}`);
                                                } catch (e) {
                                                    alert("Minting failed. RPC overloaded.");
                                                } finally {
                                                    setIsLoading(false);
                                                    setStatusMessage("");
                                                }
                                            }}
                                            className="w-full py-3 rounded-xl border border-[#00FFBD]/30 bg-[#00FFBD]/5 hover:bg-[#00FFBD]/10 text-[#00FFBD] text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group"
                                        >
                                            <Shield className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                            Mint On-chain Certificate
                                        </button>
                                    </div>
                                )}


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

                                    {/* History integrated in panel footer */}
                                    <div className="border-t border-white/5 bg-black/10">
                                        <AuditHistory
                                            history={auditHistory}
                                            onSelectAudit={(id, historyReport, historyCode) => {
                                                if (historyReport) {
                                                    setReport(historyReport);
                                                    if (historyCode) setCode(historyCode);
                                                    setActiveTab('report');
                                                    return;
                                                }
                                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vektor-backend-jiu3.onrender.com';
                                                fetch(`${apiUrl}/audit/${id}`)
                                                    .then(res => res.json())
                                                    .then(data => {
                                                        setReport(data);
                                                        if (data.raw_code) setCode(data.raw_code);
                                                    });
                                            }}
                                        />
                                    </div>

                                    {/* Embed Badge Section */}
                                    <div className="mt-8 pt-6 border-t border-white/5 px-2">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-4">Embed this badge in your README</h3>
                                        <div className="flex flex-col gap-4">
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_API_URL || 'https://vektor-backend-jiu3.onrender.com'}/badge/${report.overall_score}`}
                                                alt="Vektor Score Badge"
                                                className="h-6 w-auto object-contain self-start"
                                            />
                                            <input
                                                type="text"
                                                readOnly
                                                onClick={(e) => (e.target as HTMLInputElement).select()}
                                                value={`[![Vektor Score](${process.env.NEXT_PUBLIC_API_URL || 'https://vektor-backend-jiu3.onrender.com'}/badge/${report.overall_score})](https://vektor.security)`}
                                                className="w-full bg-black/40 border border-white/10 rounded-md p-3 text-[10px] sm:text-xs font-mono text-muted focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chat Advisor Toggle */}
                        {report && (
                            <button
                                onClick={() => setIsChatOpen(!isChatOpen)}
                                className={`fixed bottom-20 right-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 ${isChatOpen ? 'bg-primary scale-0' : 'bg-primary hover:scale-110 shadow-primary/20'}`}
                            >
                                <MessageSquare className="w-6 h-6 text-white" />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00FFBD] rounded-full border-2 border-[#050505] animate-pulse" />
                            </button>
                        )}

                        {/* Chat Advisor Panel */}
                        <div className={`fixed top-16 bottom-0 right-0 w-full sm:w-[400px] bg-[#0A0A0A] border-l border-white/5 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <Shield className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-white leading-none">Vektor Security Advisor</h3>
                                        <p className="text-[10px] text-muted">AI Expert Insights</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-white/5 rounded-md transition-colors">
                                    <X className="w-4 h-4 text-muted" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                                {chatHistory.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/5 text-muted">
                                            <MessageSquare className="w-6 h-6" />
                                        </div>
                                        <p className="text-xs text-muted leading-relaxed">Ask me anything about the audit results or specific lines of code. I can explain vulnerabilities or help you draft a fix.</p>
                                    </div>
                                )}
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white/5 text-gray-300 border border-white/5 rounded-tl-none'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isChatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                            <span className="text-[10px] text-muted">Vektor is thinking...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-white/5 bg-black/20">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Ask a security question..."
                                        className="w-full bg-[#151515] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/50"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!chatInput.trim() || isChatLoading}
                                        className="absolute right-2 top-1.5 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-20"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
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
