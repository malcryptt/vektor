import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CodeSubmission from '@/components/CodeSubmission';
import { Shield, Target, History, FileText, Smartphone } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/10 blur-[120px] -z-10 rounded-full opacity-50" />

        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Solana Frontier Hackathon 2026
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
            Audit your Solana code with <span className="gradient-text">Vektor AI</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted mb-10 animate-slide-up delay-100">
            Identify vulnerabilities in seconds using our AI engine trained to think like an attacker.
            The most advanced security partner for Solana developers.
          </p>

          <div className="flex items-center justify-center gap-4 animate-slide-up delay-200">
            <a href="#audit-tool" className="bg-white text-black hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              Get Started
            </a>
            <a href="https://github.com" className="bg-white/5 hover:bg-white/10 px-8 py-3 rounded-full font-semibold border border-white/10 transition-all">
              View Source
            </a>
          </div>
        </div>
      </section>

      <CodeSubmission />

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Securing the Solana Ecosystem</h2>
            <p className="text-muted max-w-xl mx-auto">Built from the ground up to handle Solana's unique programming model and security pitfalls.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-primary" />}
              title="Attacker Thinking"
              description="Our model doesn't just scan; it simulates exploitation flows to find logical vulnerabilities."
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
              title="PDF Exports"
              description="Generate professional security reports ready for institutional stakeholders."
            />
            <FeatureCard
              icon={<Smartphone className="w-6 h-6 text-primary" />}
              title="Mobile First"
              description="Monitor and initiate audits from any device with our fully responsive interface."
            />
            <FeatureCard
              icon={<Code2 className="w-6 h-6 text-primary" />}
              title="Rust Optimized"
              description="Deep understanding of Anchor/Rust patterns, account validation, and CPI safety."
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl glass border border-white/5 hover:border-primary/20 transition-all hover:bg-primary/[0.02] group">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted leading-relaxed">{description}</p>
    </div>
  );
}
