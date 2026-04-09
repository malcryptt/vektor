"use client";

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import HeroTerminal from '@/components/HeroTerminal';
import {
  Shield,
  Target,
  History,
  FileText,
  Smartphone,
  Code2,
  Cpu,
  Zap,
  ArrowRight,
  Search,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 selection:text-white">
      <Navbar />

      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[150px] rounded-full animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5">
        {/* Cyber Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-primary mb-8 uppercase tracking-widest shadow-[0_0_15px_rgba(255,68,68,0.1)]"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Solana Frontier Hackathon 2026
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9]"
            >
              SECURE THE <br />
              <span className="gradient-text">SOLANA EDGE</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl text-lg text-muted mb-12 leading-relaxed"
            >
              Vektor is the next-gen AI security layer for Solana developers.
              Find logical exploits, verify account sanity, and generate
              audit reports in milliseconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-6"
            >
              <Link href="/audit" className="group w-full sm:w-auto bg-primary text-white hover:bg-primary/90 px-10 py-5 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(255,68,68,0.4)] hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
                Launch Auditor
                <Zap className="w-4 h-4 fill-current group-hover:scale-125 transition-transform" />
              </Link>
              <a href="https://github.com/malcryptt/vektor" target="_blank" rel="noreferrer" className="w-full sm:w-auto bg-white/5 hover:bg-white/10 px-10 py-5 rounded-xl font-bold text-sm border border-white/10 transition-all flex items-center justify-center gap-3 group">
                Github Source
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-16 flex items-center gap-10 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
            >
              <div className="flex flex-col">
                <span className="text-xl font-black">1.2k+</span>
                <span className="text-[10px] uppercase tracking-widest font-bold">Programs Scanned</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-xl font-black">15ms</span>
                <span className="text-[10px] uppercase tracking-widest font-bold">Audit Speed</span>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 w-full flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <HeroTerminal />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Logic Scanning Section */}
      <section id="features" className="py-32 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 italic uppercase">Elite Vulnerability Detection</h2>
              <p className="text-muted text-lg">Integrated with triple-layered security engines to ensure zero-day protection.</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl hidden md:block">
              <div className="flex items-center gap-4 px-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                <span className="text-xs font-bold uppercase tracking-widest">Anchor Ready</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-primary" />}
              title="Attacker Logic"
              description="Our AI doesn't just scan; it simulates exploitation flows to find logical vulnerabilities."
            />
            <FeatureCard
              icon={<Target className="w-6 h-6 text-primary" />}
              title="Line References"
              description="See exactly where the issues are with line-by-line highlights and code snippets."
            />
            <FeatureCard
              icon={<History className="w-6 h-6 text-primary" />}
              title="Audit History"
              description="Track your security progress across multiple deployments and contract versions."
            />
            <FeatureCard
              icon={<FileText className="w-6 h-6 text-primary" />}
              title="PDF Reports"
              description="Generate professional security reports ready for institutional stakeholders."
            />
            <FeatureCard
              icon={<Search className="w-6 h-6 text-primary" />}
              title="On-Chain Fetch"
              description="Automatically pull program source code directly from Solana RPC via Program ID."
            />
            <FeatureCard
              icon={<Code2 className="w-6 h-6 text-primary" />}
              title="Rust Optimized"
              description="Deep understanding of Anchor/Rust patterns, account validation, and CPI safety."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="max-w-5xl mx-auto p-12 lg:p-20 rounded-[3rem] bg-white/5 border border-white/10 relative overflow-hidden text-center group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">READY TO AUDIT?</h2>
            <p className="text-muted text-lg mb-10 max-w-xl mx-auto italic">Join the next generation of secure Solana builders.</p>
            <Link href="/audit" className="inline-flex items-center gap-3 bg-white text-black hover:bg-white/90 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95">
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all hover:bg-primary/[0.02] group"
    >
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary/10 transition-all">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4 tracking-tight uppercase italic">{title}</h3>
      <p className="text-muted leading-relaxed text-sm">{description}</p>
    </motion.div>
  );
}
