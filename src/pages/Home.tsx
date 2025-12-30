import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Map, Rocket, TrendingUp, FileText, Settings, LogOut, SlidersHorizontal, Menu, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAdminRole } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Home = () => {
  useDocumentTitle("Dashboard");
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const { isAdmin } = useAdminRole();
  const { t } = useLanguage();
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Note: "investor-type" tool temporarily removed from dashboard access
  // The ROICalculator component is kept but not linked from here
  const solutions = [
    {
      id: "cashflow",
      title: t('homeCashflowGenerator'),
      description: t('homeCashflowGeneratorDesc'),
      icon: Rocket,
      route: "/cashflow-generator",
      color: "#00EAFF",
    },
    {
      id: "compare",
      title: "Compare Quotes",
      description: "Side-by-side comparison of multiple investment opportunities",
      icon: Scale,
      route: "/compare",
      color: "#FFA500",
    },
    {
      id: "map",
      title: t('homeInvestmentMap'),
      description: t('homeInvestmentMapDesc'),
      icon: Map,
      route: "/map",
      color: "#FF00FF",
    },
  ];

  useEffect(() => {
    checkAuth();
    loadRecentQuotes();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
    }
  };

  const loadRecentQuotes = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("cashflow_quotes")
      .select("id, client_name, project_name, created_at")
      .eq("broker_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (data) setRecentQuotes(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent" />
      </div>
    );
  }

  const NavItems = () => (
    <>
      <Link to="/my-quotes" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start sm:w-auto text-theme-text-muted hover:text-theme-text hover:bg-theme-card gap-2">
          <FileText className="w-4 h-4" />
          {t('homeMyGenerators')}
        </Button>
      </Link>
      {isAdmin && (
        <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
          <Button variant="ghost" className="w-full justify-start sm:w-auto text-theme-text-muted hover:text-theme-text hover:bg-theme-card gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            {t('homeConfiguration')}
          </Button>
        </Link>
      )}
      <Link to="/account-settings" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start sm:w-auto sm:px-3 text-theme-text-muted hover:text-theme-text hover:bg-theme-card gap-2">
          <Settings className="w-5 h-5" />
          <span className="sm:hidden">{t('homeAccountSettings')}</span>
        </Button>
      </Link>
      <Button 
        variant="ghost" 
        onClick={() => {
          handleSignOut();
          setMobileMenuOpen(false);
        }}
        className="w-full justify-start sm:w-auto sm:px-3 text-theme-text-muted hover:text-destructive hover:bg-theme-card gap-2"
      >
        <LogOut className="w-5 h-5" />
        <span className="sm:hidden">{t('signOut')}</span>
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Header */}
      <header className="border-b border-theme-border bg-theme-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 bg-theme-accent/20 rounded-xl">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-theme-accent" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-theme-text">{t('loginTitle')}</h1>
              <p className="text-xs sm:text-sm text-theme-text-muted">{t('loginSubtitle')}</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-2">
            <NavItems />
          </nav>
          
          {/* Mobile Hamburger Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="icon" className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-theme-card border-theme-border">
              <SheetHeader>
                <SheetTitle className="text-theme-text text-left">{t('landingMenu')}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                <NavItems />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-theme-text mb-2">
            {t('homeWelcome')}{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h2>
          <p className="text-theme-text-muted">{t('homeSubtitle')}</p>
        </div>

        {/* Solution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {solutions.map((solution) => {
            const Icon = solution.icon;
            return (
              <Link 
                key={solution.id} 
                to={solution.route}
                className="group"
              >
                <div className="bg-theme-card border border-theme-border rounded-2xl p-5 sm:p-6 h-full transition-all duration-300 hover:border-theme-border-alt hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1">
                  <div 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${solution.color}20` }}
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: solution.color }} />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-theme-text mb-2">{solution.title}</h3>
                  <p className="text-sm text-theme-text-muted">{solution.description}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Cashflow Statements */}
        {recentQuotes.length > 0 && (
          <div className="bg-theme-card border border-theme-border rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-theme-text">{t('homeRecentGenerators')}</h3>
              <Link to="/my-quotes">
                <Button variant="link" className="text-theme-accent hover:text-theme-accent/80 p-0">
                  {t('homeViewAll')}
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {recentQuotes.map((quote) => (
                <Link 
                  key={quote.id} 
                  to={`/cashflow/${quote.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-theme-card-alt transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-theme-text truncate">
                      {quote.client_name || t('homeUnnamedClient')}
                    </p>
                    <p className="text-xs text-theme-text-muted truncate">
                      {quote.project_name || t('homeNoProject')} • {new Date(quote.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-theme-text-muted ml-2">→</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer - matching Landing page */}
      <footer className="relative z-10 px-4 sm:px-6 py-6 sm:py-8 border-t border-theme-border">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-theme-text-muted text-xs sm:text-sm text-center sm:text-left">
            <span>© 2024 Dubai Invest Pro.</span>
            <span>{t('landingRightsReserved')}</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-theme-text-muted text-xs sm:text-sm">
            <Link to="/privacy" className="hover:text-theme-text transition-colors">{t('landingPrivacy')}</Link>
            <Link to="/terms" className="hover:text-theme-text transition-colors">{t('landingTerms')}</Link>
            <Link to="/contact" className="hover:text-theme-text transition-colors">{t('landingContact')}</Link>
            <Link to="/help" className="hover:text-theme-text transition-colors">{t('landingHelp')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
