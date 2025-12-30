import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Map, Rocket, TrendingUp, FileText, Settings, LogOut, 
  SlidersHorizontal, Menu, Scale, DollarSign, MessageCircle, 
  Download, Edit, Sun, Moon, Cloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAdminRole } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type QuoteStatus = "draft" | "presented" | "negotiating" | "sold";

interface QuoteWithDetails {
  id: string;
  client_name: string | null;
  project_name: string | null;
  created_at: string;
  status: QuoteStatus | null;
  inputs: {
    basePrice?: number;
    rentalYieldPercent?: number;
    [key: string]: any;
  };
}

const Home = () => {
  useDocumentTitle("Dashboard");
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const { isAdmin } = useAdminRole();
  const { t } = useLanguage();
  const [quotes, setQuotes] = useState<QuoteWithDetails[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("goodMorning");
    if (hour < 18) return t("goodAfternoon");
    return t("goodEvening");
  };

  // Get weather icon based on time
  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) return <Sun className="w-5 h-5 text-yellow-400" />;
    return <Moon className="w-5 h-5 text-blue-300" />;
  };

  // Calculate pipeline stats
  const pipelineStats = useMemo(() => {
    const thisMonth = quotes.filter(q => {
      const created = new Date(q.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    });
    
    const pipelineVolume = quotes.reduce((sum, q) => sum + (q.inputs?.basePrice || 0), 0);
    const potentialCommission = pipelineVolume * 0.02;
    
    return {
      activeProposals: thisMonth.length,
      pipelineVolume,
      potentialCommission
    };
  }, [quotes]);

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `AED ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `AED ${(amount / 1000).toFixed(0)}k`;
    }
    return `AED ${amount.toFixed(0)}`;
  };

  // Get key metric from quote inputs
  const getKeyMetric = (inputs: QuoteWithDetails["inputs"]) => {
    if (!inputs) return null;
    
    // Calculate ROE if we have the data
    const basePrice = inputs.basePrice || 0;
    const rentalYield = inputs.rentalYieldPercent || 0;
    
    if (rentalYield > 0) {
      return { label: `${rentalYield.toFixed(1)}% Yield`, type: "yield" };
    }
    
    // If we have appreciation data, show that
    if (inputs.totalAppreciation) {
      return { label: `${inputs.totalAppreciation.toFixed(0)}% ROE`, type: "roe" };
    }
    
    return null;
  };

  // Action cards configuration
  const solutions = [
    {
      id: "cashflow",
      title: t("createStrategy"),
      description: t("createStrategyDesc"),
      icon: Rocket,
      route: "/cashflow-generator",
      gradient: "from-theme-accent/30 via-theme-accent/10 to-transparent",
      iconColor: "text-theme-accent",
      action: t("startNew"),
    },
    {
      id: "compare",
      title: t("compareOpportunities"),
      description: t("compareOpportunitiesDesc"),
      icon: Scale,
      route: "/compare",
      gradient: "from-orange-500/30 via-orange-500/10 to-transparent",
      iconColor: "text-orange-400",
      action: t("analyze"),
    },
    {
      id: "map",
      title: t("marketIntelligence"),
      description: t("marketIntelligenceDesc"),
      icon: Map,
      route: "/map",
      gradient: "from-purple-500/30 via-purple-500/10 to-transparent",
      iconColor: "text-purple-400",
      action: t("explore"),
    },
  ];

  const statusConfig: Record<QuoteStatus, { label: string; className: string }> = {
    draft: { label: t("statusDraft"), className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
    presented: { label: t("statusPresented"), className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    negotiating: { label: t("statusNegotiating"), className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    sold: { label: t("statusSold"), className: "bg-green-500/20 text-green-400 border-green-500/30" },
  };

  useEffect(() => {
    checkAuth();
    loadQuotes();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
    }
  };

  const loadQuotes = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("cashflow_quotes")
      .select("id, client_name, project_name, created_at, status, inputs")
      .eq("broker_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (data) {
      setQuotes(data as QuoteWithDetails[]);
    }
  };

  const updateQuoteStatus = async (quoteId: string, status: QuoteStatus) => {
    const { error } = await supabase
      .from("cashflow_quotes")
      .update({ status })
      .eq("id", quoteId);

    if (error) {
      toast.error(t("errorUpdatingStatus"));
      return;
    }

    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status } : q));
    toast.success(t("statusUpdated"));
  };

  const handleWhatsAppShare = (quote: QuoteWithDetails) => {
    const message = `${t("checkOutProperty")}: ${quote.project_name || t("property")}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
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
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Welcome Section with Market Pulse */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-theme-text">
              {getGreeting()}{profile?.full_name ? `, ${profile.full_name}` : ''}.
            </h2>
            {getTimeIcon()}
          </div>
          <div className="flex items-center gap-2 text-sm text-theme-text-muted">
            <Cloud className="w-4 h-4" />
            <span className="font-medium text-theme-accent">{t("marketPulse")}:</span>
            <span className="hidden sm:inline">
              {t("dubaiYield")}: 6.8% • {t("mortgageRates")}: 4.5% • {t("topArea")}: Rashid Yachts & Marina
            </span>
            <span className="sm:hidden">
              {t("dubaiYield")}: 6.8% • {t("topArea")}: Rashid Yachts
            </span>
          </div>
        </div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
          {/* Active Proposals */}
          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-5 relative overflow-hidden group hover:border-theme-accent/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-theme-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-theme-accent" />
                <span className="text-sm text-theme-text-muted uppercase tracking-wide">{t("activeProposals")}</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-theme-text">{pipelineStats.activeProposals}</p>
              <p className="text-xs text-theme-text-muted mt-1">{t("thisMonth")}</p>
            </div>
          </div>

          {/* Pipeline Volume */}
          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-5 relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <span className="text-sm text-theme-text-muted uppercase tracking-wide">{t("pipelineVolume")}</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-theme-text">{formatCurrency(pipelineStats.pipelineVolume)}</p>
              <p className="text-xs text-theme-text-muted mt-1">{t("totalDeals")}</p>
            </div>
          </div>

          {/* Potential Commission */}
          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-5 relative overflow-hidden group hover:border-green-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-sm text-theme-text-muted uppercase tracking-wide">{t("potentialCommission")}</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-green-400">{formatCurrency(pipelineStats.potentialCommission)}</p>
              <p className="text-xs text-theme-text-muted mt-1">2% {t("ofVolume")}</p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {solutions.map((solution) => {
            const Icon = solution.icon;
            return (
              <Link 
                key={solution.id} 
                to={solution.route}
                className="group"
              >
                <div className={`bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-5 sm:p-6 h-full transition-all duration-300 hover:border-theme-border-alt hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${solution.gradient} opacity-50`} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-theme-bg/50 transition-transform duration-300 group-hover:scale-110"
                      >
                        <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${solution.iconColor}`} />
                      </div>
                      <span className="text-xs font-medium text-theme-text-muted uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                        {solution.action} →
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-theme-text mb-2">{solution.title}</h3>
                    <p className="text-sm text-theme-text-muted">{solution.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Active Opportunities Table */}
        <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-theme-border">
            <h3 className="font-semibold text-theme-text">{t("activeOpportunities")}</h3>
            <Link to="/my-quotes">
              <Button variant="link" className="text-theme-accent hover:text-theme-accent/80 p-0">
                {t('homeViewAll')} →
              </Button>
            </Link>
          </div>
          
          {quotes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-theme-border hover:bg-transparent">
                    <TableHead className="text-theme-text-muted font-medium">{t("clientProject")}</TableHead>
                    <TableHead className="text-theme-text-muted font-medium">{t("dealValue")}</TableHead>
                    <TableHead className="text-theme-text-muted font-medium hidden sm:table-cell">{t("keyStat")}</TableHead>
                    <TableHead className="text-theme-text-muted font-medium">{t("status")}</TableHead>
                    <TableHead className="text-theme-text-muted font-medium text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => {
                    const keyMetric = getKeyMetric(quote.inputs);
                    const currentStatus = quote.status || "draft";
                    
                    return (
                      <TableRow key={quote.id} className="border-theme-border hover:bg-theme-card-alt/50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-theme-text">
                              {quote.client_name || t('homeUnnamedClient')}
                            </p>
                            <p className="text-xs text-theme-text-muted">
                              {quote.project_name || t('homeNoProject')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-theme-text font-medium">
                          {quote.inputs?.basePrice ? formatCurrency(quote.inputs.basePrice) : "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {keyMetric ? (
                            <Badge variant="outline" className={`${keyMetric.type === "roe" ? "border-green-500/50 text-green-400" : "border-blue-500/50 text-blue-400"}`}>
                              {keyMetric.label}
                            </Badge>
                          ) : (
                            <span className="text-theme-text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={currentStatus}
                            onValueChange={(value) => updateQuoteStatus(quote.id, value as QuoteStatus)}
                          >
                            <SelectTrigger className={`w-[130px] h-8 text-xs border ${statusConfig[currentStatus].className} bg-transparent`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-theme-card border-theme-border">
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key} className="text-theme-text hover:bg-theme-card-alt">
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-theme-text-muted hover:text-green-400 hover:bg-green-500/10"
                              onClick={(e) => {
                                e.preventDefault();
                                handleWhatsAppShare(quote);
                              }}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-theme-text-muted hover:text-theme-accent hover:bg-theme-accent/10"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/cashflow/${quote.id}`);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center text-theme-text-muted">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("noOpportunities")}</p>
              <Link to="/cashflow-generator">
                <Button className="mt-4 bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90">
                  {t("createFirst")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
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
