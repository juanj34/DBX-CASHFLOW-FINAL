import React from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout-new/PageShell';
import { ArrowRight, BarChart3, FileText, Sparkles, Shield, Zap } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <PageShell>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-theme-border/30 bg-theme-bg/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A04A] to-[#B3893A] flex items-center justify-center shadow-lg shadow-[#B3893A]/20">
              <span className="text-sm font-bold text-white">D</span>
            </div>
            <span className="font-display text-lg text-theme-text tracking-tight">Dubai Invest</span>
          </Link>
          <Link
            to="/login"
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-theme-accent text-white hover:bg-theme-accent/90 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-[#B3893A]/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse-slow delay-1000" />

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-theme-accent/20 bg-theme-accent/5 mb-8 animate-reveal-up">
            <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
            <span className="text-xs font-medium text-theme-accent">AI-Powered Investment Analysis</span>
          </div>

          {/* Title */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-theme-text leading-[1.1] mb-6 animate-reveal-up delay-100">
            Dubai Real Estate,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A04A] via-[#B3893A] to-[#916B2D]">
              Quantified
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-theme-text-muted max-w-2xl mx-auto mb-10 leading-relaxed animate-reveal-up delay-200">
            Generate professional cashflow projections for off-plan properties.
            AI-powered payment plan extraction, exit strategy modeling, and ROI analysis — all in one document.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-4 animate-reveal-up delay-300">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#C9A04A] to-[#B3893A] text-white hover:from-[#D4AA55] hover:to-[#C9A04A] transition-all shadow-lg shadow-[#B3893A]/25 hover:shadow-[#B3893A]/40"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 mt-16 animate-reveal-up delay-400">
            {[
              { value: '2-Phase', label: 'Appreciation Model' },
              { value: 'AI', label: 'Plan Extraction' },
              { value: '10 Year', label: 'Projections' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-2xl sm:text-3xl text-theme-text">{stat.value}</div>
                <div className="text-xs text-theme-text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl text-theme-text mb-4">
              Everything a Broker Needs
            </h2>
            <p className="text-theme-text-muted max-w-xl mx-auto">
              From payment plan analysis to exit strategy modeling — one platform for professional investment documents.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'AI Extraction',
                description: 'Upload payment plans as images, PDFs, or describe them by voice. AI extracts every milestone automatically.',
              },
              {
                icon: BarChart3,
                title: 'Exit Modeling',
                description: 'Pick exit months and appreciation rates. See property value, profit, and ROE at each point — all with monthly compounding.',
              },
              {
                icon: FileText,
                title: 'Cashflow Document',
                description: 'Professional 7-section cashflow statement ready to share with clients. Export as PDF or share via link.',
              },
              {
                icon: Zap,
                title: 'Instant Calculations',
                description: 'Change any input and watch projections update in real-time. 10-year rental income, breakeven analysis, and more.',
              },
              {
                icon: Shield,
                title: 'Mortgage Simulator',
                description: 'Add financing scenarios to see monthly payments, rent coverage, and gap analysis — all integrated into the document.',
              },
              {
                icon: BarChart3,
                title: 'Multi-Currency',
                description: 'Present strategies in AED, USD, EUR, GBP, or COP with live exchange rates. Switch currencies instantly.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-xl border border-theme-border/50 bg-theme-card/50 hover:bg-theme-card hover:border-theme-accent/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-theme-accent/10 flex items-center justify-center mb-4 group-hover:bg-theme-accent/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-theme-accent" />
                </div>
                <h3 className="font-display text-lg text-theme-text mb-2">{feature.title}</h3>
                <p className="text-sm text-theme-text-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-2xl border border-theme-accent/20 bg-gradient-to-b from-theme-accent/5 to-transparent relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#B3893A]/5 via-transparent to-[#B3893A]/5" />
            <div className="relative">
              <h2 className="font-display text-3xl sm:text-4xl text-theme-text mb-4">
                Ready to Quantify Returns?
              </h2>
              <p className="text-theme-text-muted mb-8 max-w-lg mx-auto">
                Create your first investment strategy in minutes. No credit card required.
              </p>
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#C9A04A] to-[#B3893A] text-white hover:from-[#D4AA55] hover:to-[#C9A04A] transition-all shadow-lg shadow-[#B3893A]/25"
              >
                Start Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-theme-border/30 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-theme-text-muted">
          <span>&copy; 2026 Dubai Invest Pro</span>
          <div className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>
    </PageShell>
  );
};

export default Landing;
