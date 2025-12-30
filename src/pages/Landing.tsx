import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Map, TrendingUp, FileText, ArrowRight, Sparkles, BarChart3, Globe, Zap, Menu } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Landing = () => {
  useDocumentTitle("AI Real Estate Investment Tools");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#050810] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,234,255,0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(0,234,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#CCFF00]/5 rounded-full blur-[150px] animate-pulse-slow delay-500" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 sm:py-6">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-400 via-purple-500 to-[#CCFF00] p-[2px]">
              <div className="w-full h-full rounded-lg bg-[#050810] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="none">
                  <path 
                    d="M12 2L2 7L12 12L22 7L12 2Z" 
                    stroke="url(#logo-gradient)" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M2 17L12 22L22 17" 
                    stroke="url(#logo-gradient)" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M2 12L12 17L22 12" 
                    stroke="url(#logo-gradient)" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="logo-gradient" x1="2" y1="2" x2="22" y2="22">
                      <stop stopColor="#00EAFF" />
                      <stop offset="0.5" stopColor="#A855F7" />
                      <stop offset="1" stopColor="#CCFF00" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-[#CCFF00] rounded-lg blur opacity-30 animate-pulse-slow" />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-[#CCFF00]">Dubai</span>
            <span className="text-white">Invest</span>
            <span className="text-[#CCFF00]">Pro</span>
          </span>
        </div>

        {/* Desktop Nav Actions */}
        <div className="hidden sm:flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            {language === 'en' ? '🇪🇸 ES' : '🇺🇸 EN'}
          </Button>
          <Link to="/login">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
              {t('landingSignIn')}
            </Button>
          </Link>
          <Link to="/login">
            <Button className="bg-gradient-to-r from-cyan-500 via-purple-500 to-[#CCFF00] text-black font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300">
              {t('landingGetStarted')} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="sm:hidden">
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/5">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] bg-[#0a0f1a] border-gray-800">
            <SheetHeader>
              <SheetTitle className="text-white text-left">{t('landingMenu')}</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-6">
              <Button
                variant="ghost"
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5"
              >
                {language === 'en' ? '🇪🇸 Español' : '🇺🇸 English'}
              </Button>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5">
                  {t('landingSignIn')}
                </Button>
              </Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-[#CCFF00] text-black font-semibold">
                  {t('landingGetStarted')} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-12 pt-12 sm:pt-16 lg:pt-24 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 text-xs sm:text-sm">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{t('landingPoweredByAI')}</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-white">{t('landingHeroTitle1')}</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-[#CCFF00] animate-gradient">
                  {t('landingHeroTitle2')}
                </span>
                <br />
                <span className="text-white">{t('landingHeroTitle3')}</span>
              </h1>
              
              <p className="text-base sm:text-lg text-gray-400 max-w-xl leading-relaxed">
                {t('landingHeroDescription')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link to="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 group">
                    {t('landingAccessPlatform')}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button size="lg" variant="outlineDark" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                  {t('landingViewDemo')}
                </Button>
              </div>
              
              {/* Stats */}
              <div className="flex gap-6 sm:gap-8 pt-6 sm:pt-8 border-t border-gray-800">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                    500+
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">{t('landingProjectsMapped')}</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-[#CCFF00]">
                    50+
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">{t('landingInvestmentZones')}</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#CCFF00]">
                    AI
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">{t('landingSmartAnalysis')}</div>
                </div>
              </div>
            </div>

            {/* Right Content - Floating Dashboard Preview */}
            <div className="relative hidden lg:block">
              {/* Main Dashboard Card */}
              <div className="relative z-20 bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-gray-500 ml-2">Dubai Investment Dashboard</span>
                </div>
                <div className="space-y-4">
                  <div className="h-32 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-12 h-12 text-cyan-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">{t('landingProjectedRoi')}</div>
                      <div className="text-lg font-bold text-[#CCFF00]">+127%</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">{t('landingAnnualYield')}</div>
                      <div className="text-lg font-bold text-cyan-400">8.5%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Map Card */}
              <div className="absolute -left-12 top-20 z-10 bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-xl border border-gray-700/50 p-4 shadow-xl transform -rotate-6 animate-float">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400">{t('landingInteractiveMap')}</span>
                </div>
                <div className="w-32 h-24 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Map className="w-8 h-8 text-purple-400" />
                </div>
              </div>

              {/* Floating Stats Card */}
              <div className="absolute -right-8 bottom-10 z-30 bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-xl border border-[#CCFF00]/30 p-4 shadow-xl transform rotate-3 animate-float delay-500">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#CCFF00]" />
                  <span className="text-xs text-gray-400">AI Analysis</span>
                </div>
                <div className="mt-2 text-2xl font-bold text-[#CCFF00]">98%</div>
                <div className="text-xs text-gray-500">{t('landingAccuracy')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-12 py-16 sm:py-24 bg-gradient-to-b from-transparent via-gray-900/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              <span className="text-white">{t('landingProfessionalTools').split(' ')[0]} </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                {t('landingProfessionalTools').split(' ').slice(1).join(' ')}
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
              {t('landingProfessionalToolsDesc')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 - Map */}
            <div className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 sm:p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <Map className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{t('landingInteractiveMap')}</h3>
                <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                  {t('landingInteractiveMapDesc')}
                </p>
                <div className="mt-4 sm:mt-6 flex items-center text-cyan-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                  {t('landingExploreMap')} <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </div>

            {/* Feature 2 - ROI Calculator */}
            <div className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 sm:p-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{t('landingRoiCalculator')}</h3>
                <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                  {t('landingRoiCalculatorDesc')}
                </p>
                <div className="mt-4 sm:mt-6 flex items-center text-purple-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                  {t('landingCalculateRoi')} <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </div>

            {/* Feature 3 - Cash Statement */}
            <div className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 sm:p-8 hover:border-[#CCFF00]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#CCFF00]/10 sm:col-span-2 md:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#CCFF00]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[#CCFF00]/20 to-[#CCFF00]/5 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-[#CCFF00]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{t('landingCashflowGenerator')}</h3>
                <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                  {t('landingCashflowGeneratorDesc')}
                </p>
                <div className="mt-4 sm:mt-6 flex items-center text-[#CCFF00] text-sm font-medium group-hover:translate-x-2 transition-transform">
                  {t('landingCreateQuote')} <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-12 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-[#CCFF00]/20 rounded-3xl blur-3xl" />
            
            <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-700/50 p-8 sm:p-12 md:p-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                <span className="text-white">{t('landingCtaTitle').split(' ').slice(0, 3).join(' ')} </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-[#CCFF00]">
                  {t('landingCtaTitle').split(' ').slice(3, 4).join(' ')}
                </span>
                <span className="text-white"> {t('landingCtaTitle').split(' ').slice(4).join(' ')}</span>
              </h2>
              <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto">
                {t('landingCtaDescription')}
              </p>
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 via-purple-500 to-[#CCFF00] text-black font-bold text-base sm:text-lg px-8 sm:px-12 py-6 sm:py-7 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 group">
                  {t('landingCtaButton')}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 lg:px-12 py-6 sm:py-8 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-gray-500 text-xs sm:text-sm text-center sm:text-left">
            <span>© 2024 Dubai Invest Pro.</span>
            <span>{t('landingRightsReserved')}</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-gray-500 text-xs sm:text-sm">
            <Link to="/privacy" className="hover:text-white transition-colors">{t('landingPrivacy')}</Link>
            <Link to="/terms" className="hover:text-white transition-colors">{t('landingTerms')}</Link>
            <Link to="/contact" className="hover:text-white transition-colors">{t('landingContact')}</Link>
            <Link to="/help" className="hover:text-white transition-colors">{t('landingHelp')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
