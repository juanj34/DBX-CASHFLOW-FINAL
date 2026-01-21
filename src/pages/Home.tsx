import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Map, Rocket, TrendingUp, FileText, Settings, LogOut, 
  SlidersHorizontal, Menu, Scale, DollarSign, 
  Edit, Sun, Moon, Cloud, Filter, Search, ArrowUpDown, ArrowUp, ArrowDown, X, CheckCircle2, Calendar, MapPin,
  Plus, BarChart3, Archive, ChevronDown, Presentation, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/AppLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAdminRole } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { MarketPulseModal } from "@/components/dashboard/MarketPulseModal";
import { PipelineAnalyticsChart } from "@/components/dashboard/PipelineAnalyticsChart";
import { RecentComparisons } from "@/components/dashboard/RecentComparisons";
import { RecentPresentations } from "@/components/dashboard/RecentPresentations";
import { ShareIconButton } from "@/components/roi/ShareIconButton";
import { QuoteAnalyticsPopover } from "@/components/analytics/QuoteAnalyticsPopover";

type QuoteStatus = "draft" | "presented" | "negotiating" | "sold";
type SortField = 'date' | 'value' | 'developer' | 'status';
type SortDirection = 'asc' | 'desc';

interface QuoteWithDetails {
  id: string;
  client_name: string | null;
  client_email: string | null;
  project_name: string | null;
  developer: string | null;
  created_at: string;
  status: QuoteStatus | null;
  sold_at?: string | null;
  share_token?: string | null;
  inputs: {
    basePrice?: number;
    rentalYieldPercent?: number;
    _clientInfo?: {
      zoneName?: string;
      zoneColor?: string;
    };
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
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | '30days' | 'all'>('30days');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get commission rate from profile
  const commissionRate = profile?.commission_rate ?? 2;

  // Get market pulse data from profile
  const marketData = {
    yield: profile?.market_dubai_yield ?? 6.8,
    mortgage: profile?.market_mortgage_rate ?? 4.5,
    topArea: profile?.market_top_area ?? 'Rashid Yachts & Marina'
  };

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

  // Filter quotes based on search only (status is already filtered server-side for active)
  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const clientMatch = quote.client_name?.toLowerCase().includes(query);
        const projectMatch = quote.project_name?.toLowerCase().includes(query);
        const developerMatch = quote.developer?.toLowerCase().includes(query);
        if (!clientMatch && !projectMatch && !developerMatch) return false;
      }
      
      // Date filter
      const created = new Date(quote.created_at);
      const now = new Date();
      
      if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (created < weekAgo) return false;
      } else if (dateFilter === 'month') {
        if (created.getMonth() !== now.getMonth() || created.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (created < thirtyDaysAgo) return false;
      }
      
      return true;
    });
  }, [quotes, dateFilter, searchQuery]);

  // Sort quotes
  const sortedQuotes = useMemo(() => {
    return [...filteredQuotes].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'value':
          comparison = (a.inputs?.basePrice || 0) - (b.inputs?.basePrice || 0);
          break;
        case 'developer':
          comparison = (a.developer || '').localeCompare(b.developer || '');
          break;
        case 'status':
          comparison = (a.status || 'draft').localeCompare(b.status || 'draft');
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredQuotes, sortField, sortDirection]);

  // Calculate pipeline stats from quotes - split by sold
  const pipelineStats = useMemo(() => {
    const thisMonth = quotes.filter(q => {
      const created = new Date(q.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    });
    
    const soldQuotes = quotes.filter(q => q.status === 'sold');
    const nonSoldQuotes = quotes.filter(q => q.status !== 'sold');
    
    const pipelineVolume = quotes.reduce((sum, q) => sum + (q.inputs?.basePrice || 0), 0);
    const potentialVolume = nonSoldQuotes.reduce((sum, q) => sum + (q.inputs?.basePrice || 0), 0);
    const earnedVolume = soldQuotes.reduce((sum, q) => sum + (q.inputs?.basePrice || 0), 0);
    
    return {
      activeProposals: thisMonth.length,
      pipelineVolume,
      potentialCommission: potentialVolume * (commissionRate / 100),
      earnedCommission: earnedVolume * (commissionRate / 100)
    };
  }, [quotes, commissionRate]);

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

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3" /> 
      : <ArrowDown className="w-3 h-3" />;
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
      id: "presentations",
      title: "Client Presentations",
      description: "Bundle quotes and comparisons into shareable presentations",
      icon: Presentation,
      route: "/presentations",
      gradient: "from-pink-500/30 via-pink-500/10 to-transparent",
      iconColor: "text-pink-400",
      action: "Create",
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

    // Only load active quotes (presented, negotiating) - not drafts or sold
    const { data, error } = await supabase
      .from("cashflow_quotes")
      .select("id, client_name, client_email, project_name, developer, created_at, status, sold_at, share_token, inputs")
      .eq("broker_id", session.user.id)
      .in("status", ["presented", "negotiating"])
      .or('is_archived.is.null,is_archived.eq.false')
      .order("updated_at", { ascending: false })
      .limit(20);

    if (data) {
      setQuotes(data as QuoteWithDetails[]);
    }
  };

  const updateQuoteStatus = async (quoteId: string, status: QuoteStatus) => {
    const now = new Date().toISOString();
    const quote = quotes.find(q => q.id === quoteId);
    
    // Build update object with relevant timestamp
    const updateData: any = {
      status,
      status_changed_at: now,
    };

    // Set specific timestamps based on status
    if (status === 'sold') updateData.sold_at = now;
    if (status === 'presented') updateData.presented_at = now;
    if (status === 'negotiating') updateData.negotiation_started_at = now;

    const { error } = await supabase
      .from("cashflow_quotes")
      .update(updateData)
      .eq("id", quoteId);

    if (error) {
      toast.error(t("errorUpdatingStatus"));
      return;
    }

    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status, sold_at: status === 'sold' ? now : q.sold_at } : q));
    
    if (status === 'sold') {
      toast.success("🎉 " + t("dealClosed"));
      
      // Send email notification
      if (profile?.email && quote) {
        try {
          await supabase.functions.invoke('send-status-notification', {
            body: {
              brokerEmail: profile.email,
              brokerName: profile.full_name,
              clientName: quote.client_name,
              projectName: quote.project_name,
              dealValue: quote.inputs?.basePrice || 0,
              commission: (quote.inputs?.basePrice || 0) * (commissionRate / 100),
              newStatus: status,
              clientEmail: quote.client_email
            }
          });
        } catch (err) {
          console.error("Failed to send notification:", err);
        }
      }
    } else {
      toast.success(t("statusUpdated"));
    }
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

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Primary Actions */}
      <Link to="/cashflow-generator" onClick={() => setMobileMenuOpen(false)}>
        <Button 
          className={mobile 
            ? "w-full justify-start gap-2 bg-theme-accent text-theme-bg hover:bg-theme-accent/90" 
            : "gap-2 bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
          }
        >
          <Plus className="w-4 h-4" />
          {t('quotesNewQuote')}
        </Button>
      </Link>

      {/* Main Navigation Links - Order: Generator, All Quotes, Compare, Presentations, Analytics, Map */}
      <Link to="/cashflow-generator" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start sm:w-auto text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt gap-2">
          <Sparkles className="w-4 h-4" />
          Generator
        </Button>
      </Link>

      <Link to="/my-quotes" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start sm:w-auto text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt gap-2">
          <FileText className="w-4 h-4" />
          All Quotes
        </Button>
      </Link>
      
      <Link to="/compare" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start sm:w-auto text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt gap-2">
          <Scale className="w-4 h-4" />
          Compare
        </Button>
      </Link>

      <Link to="/presentations" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start sm:w-auto text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt gap-2">
          <Presentation className="w-4 h-4" />
          Presentations
        </Button>
      </Link>
      
      <Link to="/quotes-analytics" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start sm:w-auto text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt gap-2">
          <BarChart3 className="w-4 h-4" />
          Analytics
        </Button>
      </Link>

      <Link to="/map" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start sm:w-auto text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt gap-2">
          <Map className="w-4 h-4" />
          Map
        </Button>
      </Link>

      {/* Mobile-only additional items */}
      {mobile && (
        <>
          <div className="border-t border-theme-border my-2" />
          <Link to="/archived-quotes" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt gap-2">
              <Archive className="w-4 h-4" />
              {t('archivedQuotes')}
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                {t('homeConfiguration')}
              </Button>
            </Link>
          )}
          <Link to="/account-settings" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt gap-2">
              <Settings className="w-4 h-4" />
              {t('homeAccountSettings')}
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            onClick={() => {
              handleSignOut();
              setMobileMenuOpen(false);
            }}
            className="w-full justify-start text-theme-text-muted hover:text-destructive hover:bg-theme-card-alt gap-2"
          >
            <LogOut className="w-4 h-4" />
            {t('signOut')}
          </Button>
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Header */}
      <header className="border-b border-theme-border bg-theme-bg/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <AppLogo size="md" linkTo="/home" showGlow={false} />
            
            {/* Desktop Navigation - Center */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavItems />
            </nav>
            
            {/* Desktop Right Side - Profile Menu */}
            <div className="hidden lg:flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-theme-accent to-purple-500 flex items-center justify-center text-theme-bg text-sm font-semibold">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-theme-card border-theme-border">
                  <div className="px-3 py-2 border-b border-theme-border">
                    <p className="text-sm font-medium text-theme-text">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-theme-text-muted">{profile?.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="cursor-pointer text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt">
                    <Link to="/archived-quotes" className="flex items-center gap-2">
                      <Archive className="w-4 h-4" />
                      {t('archivedQuotes')}
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="cursor-pointer text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt">
                      <Link to="/dashboard" className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4" />
                        {t('homeConfiguration')}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt">
                    <Link to="/account-settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      {t('homeAccountSettings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-theme-border" />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Mobile/Tablet - Compact Nav */}
            <div className="flex lg:hidden items-center gap-2">
              <Link to="/cashflow-generator">
                <Button size="sm" className="gap-1.5 bg-theme-accent text-theme-bg hover:bg-theme-accent/90">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('quotesNewQuote')}</span>
                </Button>
              </Link>
              
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] bg-theme-card border-theme-border">
                  <SheetHeader className="pb-4 border-b border-theme-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-theme-accent to-purple-500 flex items-center justify-center text-theme-bg font-semibold">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="text-left">
                        <SheetTitle className="text-theme-text">{profile?.full_name || 'User'}</SheetTitle>
                        <p className="text-xs text-theme-text-muted">{profile?.email}</p>
                      </div>
                    </div>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 mt-4">
                    <NavItems mobile />
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
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
              {t("dubaiYield")}: {marketData.yield}% • {t("mortgageRates")}: {marketData.mortgage}% • {t("topArea")}: {marketData.topArea}
            </span>
            <span className="sm:hidden">
              {t("dubaiYield")}: {marketData.yield}% • {t("topArea")}: {marketData.topArea.split(' ')[0]}
            </span>
            <span className="text-xs opacity-60">({t("yourData")})</span>
            <MarketPulseModal />
          </div>
        </div>

        {/* Pipeline Stats - 4 cards now */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 sm:mb-8">
          {/* Active Proposals */}
          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-theme-accent/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-theme-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-theme-accent" />
                <span className="text-xs text-theme-text-muted uppercase tracking-wide">{t("activeProposals")}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-theme-text">{pipelineStats.activeProposals}</p>
              <p className="text-xs text-theme-text-muted mt-1">{t("thisMonth")}</p>
            </div>
          </div>

          {/* Pipeline Volume */}
          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                <span className="text-xs text-theme-text-muted uppercase tracking-wide">{t("pipelineVolume")}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-theme-text">{formatCurrency(pipelineStats.pipelineVolume)}</p>
              <p className="text-xs text-theme-text-muted mt-1">{t("totalDeals")}</p>
            </div>
          </div>

          {/* Potential Commission */}
          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                <span className="text-xs text-theme-text-muted uppercase tracking-wide">{t("potentialCommission")}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-cyan-400">{formatCurrency(pipelineStats.potentialCommission)}</p>
              <p className="text-xs text-theme-text-muted mt-1">{t("pending")}</p>
            </div>
          </div>

          {/* Earned Commission */}
          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-green-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                <span className="text-xs text-theme-text-muted uppercase tracking-wide">{t("earnedCommission")}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-400">{formatCurrency(pipelineStats.earnedCommission)}</p>
              <p className="text-xs text-theme-text-muted mt-1">{t("closedDeals")}</p>
            </div>
          </div>
        </div>

        {/* Pipeline Analytics Chart */}
        <PipelineAnalyticsChart quotes={quotes} commissionRate={commissionRate} />

        {/* Action Cards - Unique design per tool */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
          {solutions.map((solution) => {
            const Icon = solution.icon;
            const isMain = solution.id === 'cashflow';
            
            return (
              <Link 
                key={solution.id} 
                to={solution.route}
                className="group"
              >
                <div className={`relative h-full rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                  isMain 
                    ? 'bg-gradient-to-br from-theme-accent via-theme-accent/90 to-theme-accent/70 border-2 border-theme-accent shadow-lg shadow-theme-accent/20' 
                    : 'bg-theme-card/80 backdrop-blur-xl border border-theme-border hover:border-theme-border-alt hover:shadow-xl hover:shadow-black/20'
                }`}>
                  {/* Decorative background element */}
                  {!isMain && (
                    <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${solution.gradient} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
                  )}
                  
                  {/* Corner accent for non-main cards */}
                  {!isMain && (
                    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${solution.gradient} opacity-30`} 
                      style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} 
                    />
                  )}
                  
                  <div className="relative">
                    {/* Icon with unique styling */}
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 ${
                      isMain 
                        ? 'bg-white/20 backdrop-blur-sm' 
                        : 'bg-theme-bg/50 border border-theme-border group-hover:border-theme-border-alt'
                    }`}>
                      <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${isMain ? 'text-theme-bg' : solution.iconColor}`} />
                    </div>
                    
                    {/* Title */}
                    <h3 className={`text-base sm:text-lg font-bold mb-2 ${isMain ? 'text-theme-bg' : 'text-theme-text'}`}>
                      {solution.title}
                    </h3>
                    
                    {/* Description */}
                    <p className={`text-sm mb-4 ${isMain ? 'text-theme-bg/80' : 'text-theme-text-muted'}`}>
                      {solution.description}
                    </p>
                    
                    {/* Action indicator */}
                    <div className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider ${
                      isMain ? 'text-theme-bg/90' : 'text-theme-text-muted group-hover:text-theme-accent'
                    } transition-colors`}>
                      {solution.action}
                      <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Active Opportunities Table */}
        <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl overflow-hidden mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 p-5 border-b border-theme-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-semibold text-theme-text">{t("activeOpportunities")}</h3>
              <Link to="/my-quotes">
                <Button variant="link" className="text-theme-accent hover:text-theme-accent/80 p-0 text-sm">
                  {t('homeViewAll')} →
                </Button>
              </Link>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-9 bg-theme-bg-alt border-theme-border text-theme-text placeholder:text-theme-text-muted"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-theme-text-muted hover:text-theme-text"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              
              {/* Date Filter only - status is pre-filtered for active */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-theme-text-muted hidden sm:block" />
                <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as 'week' | 'month' | '30days' | 'all')}>
                  <SelectTrigger className="w-[130px] h-9 text-xs bg-theme-bg-alt border-theme-border text-theme-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-theme-card border-theme-border">
                    <SelectItem value="week" className="text-theme-text hover:bg-theme-card-alt">{t("thisWeek")}</SelectItem>
                    <SelectItem value="month" className="text-theme-text hover:bg-theme-card-alt">{t("thisMonth")}</SelectItem>
                    <SelectItem value="30days" className="text-theme-text hover:bg-theme-card-alt">{t("last30Days")}</SelectItem>
                    <SelectItem value="all" className="text-theme-text hover:bg-theme-card-alt">{t("allTime")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {sortedQuotes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-theme-border hover:bg-transparent">
                    <TableHead className="text-theme-text-muted font-medium">{t("clientProject")}</TableHead>
                    <TableHead 
                      className="text-theme-text-muted font-medium cursor-pointer hover:text-theme-text"
                      onClick={() => handleSort('value')}
                    >
                      <div className="flex items-center gap-1">
                        {t("dealValue")}
                        {getSortIcon('value')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-theme-text-muted font-medium hidden md:table-cell cursor-pointer hover:text-theme-text"
                      onClick={() => handleSort('developer')}
                    >
                      <div className="flex items-center gap-1">
                        {t("developer")}
                        {getSortIcon('developer')}
                      </div>
                    </TableHead>
                    <TableHead className="text-theme-text-muted font-medium hidden lg:table-cell">{t("zone")}</TableHead>
                    <TableHead 
                      className="text-theme-text-muted font-medium cursor-pointer hover:text-theme-text"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        {t("status")}
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead className="text-theme-text-muted font-medium text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedQuotes.map((quote) => {
                    const currentStatus = quote.status || "draft";
                    
                    return (
                      <TableRow key={quote.id} className="border-theme-border hover:bg-theme-card-alt/50">
                        <TableCell>
                          <div 
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => navigate(`/cashflow/${quote.id}`)}
                          >
                            <p className="font-medium text-theme-text hover:text-theme-accent transition-colors">
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
                        <TableCell className="hidden md:table-cell">
                          <span className="text-theme-text text-sm">
                            {quote.developer || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span 
                            className="text-sm px-2 py-0.5 rounded"
                            style={{ 
                              backgroundColor: quote.inputs?._clientInfo?.zoneColor ? `${quote.inputs._clientInfo.zoneColor}20` : undefined,
                              color: quote.inputs?._clientInfo?.zoneColor || 'inherit'
                            }}
                          >
                            {quote.inputs?._clientInfo?.zoneName || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs border ${statusConfig[currentStatus].className}`}>
                            {statusConfig[currentStatus].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <QuoteAnalyticsPopover quoteId={quote.id} />
                            
                            <ShareIconButton
                              quoteId={quote.id}
                              shareToken={quote.share_token}
                              projectName={quote.project_name}
                              clientEmail={quote.client_email}
                            />
                            
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
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
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="text-xs">Edit</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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

        {/* Recent Comparisons & Presentations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentComparisons limit={3} />
          <RecentPresentations limit={5} />
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
