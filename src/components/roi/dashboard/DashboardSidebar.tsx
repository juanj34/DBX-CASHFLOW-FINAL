import { useState } from "react";
import { ChevronLeft, ChevronRight, Settings2, LayoutDashboard, FolderOpen, History, SlidersHorizontal, Globe, Share2, Save, Loader2, GitCompare, ExternalLink, Sparkles, LayoutGrid, BarChart3, Presentation, Wand2, FileSpreadsheet, AlertTriangle, FilePlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { OIInputs } from "@/components/roi/useOICalculations";
import { MortgageInputs } from "@/components/roi/useMortgageCalculations";
import { Button } from "@/components/ui/button";
import { Profile } from "@/hooks/useProfile";
import { AdvisorInfo } from "@/components/roi/AdvisorInfo";
import { Link, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Currency } from "@/components/roi/currencyUtils";
import { QuoteSelector } from "@/components/roi/compare/QuoteSelector";

interface DashboardSidebarProps {
  inputs: OIInputs;
  mortgageInputs: MortgageInputs;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  // New props for bottom section
  profile?: Profile | null;
  isAdmin?: boolean;
  onConfigure?: () => void;
  onLoadQuote?: () => void;
  onViewHistory?: () => void;
  onShare?: () => void;
  onPresent?: () => void; // Switch to cashflow view
  onSnapshot?: () => void; // Open snapshot view
  onNewQuote?: () => void; // Start a fresh new quote
  activeView?: 'cashflow' | 'snapshot'; // Which view is currently active
  viewCount?: number;
  firstViewedAt?: string | null;
  quoteId?: string;
  // Language and currency
  language?: string;
  setLanguage?: (lang: string) => void;
  currency?: Currency;
  setCurrency?: (currency: Currency) => void;
  // Save status
  hasUnsavedChanges?: boolean;
  saving?: boolean;
  onSave?: () => void;
}

// App Logo Component
const AppLogo = ({ collapsed }: { collapsed: boolean }) => (
  <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-2")}>
    <div className="relative flex-shrink-0">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-purple-500 to-[#CCFF00] p-[2px]">
        <div className="w-full h-full rounded-lg bg-theme-card flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <path 
              d="M12 2L2 7L12 12L22 7L12 2Z" 
              stroke="url(#sidebar-logo-gradient)" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M2 17L12 22L22 17" 
              stroke="url(#sidebar-logo-gradient)" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M2 12L12 17L22 12" 
              stroke="url(#sidebar-logo-gradient)" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="sidebar-logo-gradient" x1="2" y1="2" x2="22" y2="22">
                <stop stopColor="#00EAFF" />
                <stop offset="0.5" stopColor="#A855F7" />
                <stop offset="1" stopColor="#CCFF00" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
    {!collapsed && (
      <span className="text-sm font-bold tracking-tight">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-[#CCFF00]">Dubai</span>
        <span className="text-theme-text">Invest</span>
        <span className="text-[#CCFF00]">Pro</span>
      </span>
    )}
  </div>
);

// Section Header Component
const SectionHeader = ({ label, collapsed }: { label: string; collapsed: boolean }) => {
  if (collapsed) return null;
  return (
    <div className="px-3 pt-4 pb-2">
      <span className="text-[10px] uppercase tracking-wider text-theme-text-muted/60 font-semibold">
        {label}
      </span>
    </div>
  );
};

// Action Button Component - Uniform styling for all action buttons
const ActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  collapsed,
  variant = 'default',
  badge,
  to,
}: { 
  icon: typeof Settings2;
  label: string;
  onClick?: () => void;
  collapsed: boolean;
  variant?: 'default' | 'primary' | 'active';
  badge?: number | string;
  to?: string;
}) => {
  const baseStyles = cn(
    "w-full flex items-center rounded-lg text-sm font-medium transition-all relative",
    collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5"
  );
  
  const variantStyles = variant === 'primary'
    ? "bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
    : variant === 'active'
    ? "bg-theme-accent/20 text-theme-accent border border-theme-accent/30"
    : "text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50";

  const content = (
    <button onClick={onClick} className={cn(baseStyles, variantStyles)}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!collapsed && badge != null && (
        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
          {badge}
        </span>
      )}
      {collapsed && badge != null && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-cyan-500 text-[10px] text-white rounded-full flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </button>
  );

  if (to) {
    return (
      <Link to={to}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ) : content}
      </Link>
    );
  }

  return collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">
        {label}{badge != null ? ` (${badge})` : ''}
      </TooltipContent>
    </Tooltip>
  ) : content;
};

export const DashboardSidebar = ({
  inputs,
  mortgageInputs,
  collapsed,
  onCollapsedChange,
  profile,
  isAdmin,
  onConfigure,
  onLoadQuote,
  onViewHistory,
  onShare,
  onPresent,
  onSnapshot,
  onNewQuote,
  activeView,
  viewCount,
  quoteId,
  language,
  setLanguage,
  currency,
  setCurrency,
  hasUnsavedChanges,
  saving,
  onSave,
}: DashboardSidebarProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>(quoteId ? [quoteId] : []);

  const handleCompareSelect = (ids: string[]) => {
    setSelectedQuoteIds(ids);
  };

  const handleCompareConfirm = () => {
    if (selectedQuoteIds.length >= 2) {
      setCompareModalOpen(false);
      navigate(`/compare?ids=${selectedQuoteIds.join(',')}`);
    }
  };

  return (
    <aside 
      className={cn(
        "bg-theme-card border-r border-theme-border flex flex-col h-full transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo + Collapse Toggle */}
      <div className={cn(
        "h-14 border-b border-theme-border flex items-center px-3",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <Link to="/home">
          <AppLogo collapsed={collapsed} />
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange(!collapsed)}
            className="h-7 w-7 text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="py-2 flex justify-center border-b border-theme-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange(false)}
            className="h-7 w-7 text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Advisor Info - Clickable to go to profile */}
      {profile && (
        <Link to="/account-settings" className="block">
          <div className={cn(
            "border-b border-theme-border hover:bg-theme-bg/50 transition-colors cursor-pointer",
            collapsed ? "p-2 flex justify-center" : "p-3"
          )}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2a3142] ring-2 ring-[#CCFF00]/30">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name || 'Advisor'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-theme-text-muted text-xs font-medium">
                        {profile.full_name?.charAt(0) || 'A'}
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div>
                    <p className="font-medium">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">{t('wealthAdvisor')}</p>
                    <p className="text-xs text-theme-accent mt-1">Click to edit profile</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              <AdvisorInfo profile={profile} size="sm" showSubtitle />
            )}
          </div>
        </Link>
      )}

      {/* Unsaved Warning Banner */}
      {hasUnsavedChanges && !quoteId && (
        <div className={cn(
          "border-b border-amber-500/20 bg-amber-500/10",
          collapsed ? "py-2 flex justify-center" : "px-3 py-2"
        )}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">Not saved yet</p>
                <p className="text-xs text-muted-foreground">Configure to auto-save</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2 text-amber-400 text-xs">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>Configure to save automatically</span>
            </div>
          )}
        </div>
      )}

      {/* Auto-save is always enabled - no save button needed */}

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* QUOTE Section */}
        <SectionHeader label="Quote" collapsed={collapsed} />
        <div className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
          {onNewQuote && (
            <ActionButton 
              icon={FilePlus} 
              label="New Quote" 
              onClick={onNewQuote} 
              collapsed={collapsed}
            />
          )}
          {onConfigure && (
            <ActionButton 
              icon={Settings2} 
              label="Configure" 
              onClick={onConfigure} 
              collapsed={collapsed}
              variant="primary"
            />
          )}
          {onLoadQuote && (
            <ActionButton 
              icon={FolderOpen} 
              label={t('loadQuote') || 'Load Quote'} 
              onClick={onLoadQuote} 
              collapsed={collapsed}
            />
          )}
          {onViewHistory && quoteId && (
            <ActionButton 
              icon={History} 
              label={t('versionHistory') || 'History'} 
              onClick={onViewHistory} 
              collapsed={collapsed}
            />
          )}
          {/* Create Comparison */}
          <ActionButton 
            icon={GitCompare} 
            label="Create Comparison" 
            onClick={() => setCompareModalOpen(true)} 
            collapsed={collapsed}
          />
        </div>

        {/* VIEW Section - View modes and share */}
        {(activeView || onShare) && (
          <>
            <SectionHeader label="View" collapsed={collapsed} />
            <div className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
              {/* Cashflow - current vertical view */}
              <ActionButton 
                icon={LayoutDashboard} 
                label="Cashflow" 
                onClick={onPresent} 
                collapsed={collapsed}
                variant={activeView === 'cashflow' ? 'active' : 'default'}
              />
              {/* Snapshot - compact spreadsheet-style view */}
              <ActionButton 
                icon={FileSpreadsheet} 
                label="Snapshot" 
                onClick={onSnapshot} 
                collapsed={collapsed}
                variant={activeView === 'snapshot' ? 'active' : 'default'}
              />
              {onShare && (
                quoteId ? (
                  <ActionButton 
                    icon={Share2} 
                    label="Share Link" 
                    onClick={onShare} 
                    collapsed={collapsed}
                    badge={viewCount && viewCount > 0 ? viewCount : undefined}
                  />
                ) : (
                  collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-theme-text-muted/40 cursor-not-allowed">
                          <Share2 className="w-4 h-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">Save quote to unlock sharing</TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-theme-text-muted/40 cursor-not-allowed">
                      <Share2 className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left truncate">Share Link</span>
                      <span className="text-[10px] bg-theme-bg/50 px-1.5 py-0.5 rounded">Save first</span>
                    </div>
                  )
                )
              )}
            </div>
          </>
        )}

        {/* NAVIGATE Section - Order matches PageHeader: Home, Generator, Quotes, Compare, Presentations, Analytics */}
        <SectionHeader label="Navigate" collapsed={collapsed} />
        <div className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
          <ActionButton 
            icon={LayoutDashboard} 
            label="Home" 
            to="/home" 
            collapsed={collapsed}
          />
          <ActionButton 
            icon={Wand2} 
            label="Generator" 
            to="/cashflow-generator" 
            collapsed={collapsed}
          />
          <ActionButton 
            icon={LayoutGrid} 
            label="All Quotes" 
            to="/my-quotes" 
            collapsed={collapsed}
          />
          <ActionButton 
            icon={GitCompare} 
            label="Compare" 
            to="/compare" 
            collapsed={collapsed}
          />
          <ActionButton 
            icon={Presentation} 
            label="Presentations" 
            to="/presentations" 
            collapsed={collapsed}
          />
          <ActionButton 
            icon={BarChart3} 
            label="Analytics" 
            to="/quotes-analytics" 
            collapsed={collapsed}
          />
        </div>

        {/* MANAGEMENT Section - Clients */}
        <SectionHeader label="Management" collapsed={collapsed} />
        <div className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
          <ActionButton 
            icon={Users} 
            label="Clients" 
            to="/clients" 
            collapsed={collapsed}
          />
        </div>
      </div>

      {/* Bottom Section - Settings & Navigation */}
      <div className="border-t border-theme-border">
        {/* Language & Currency Settings */}
        {(setLanguage || setCurrency) && (
          <div className={cn("space-y-1 border-b border-theme-border", collapsed ? "p-2" : "p-3")}>
            {/* Language Toggle */}
            {setLanguage && (
              collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                      className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50 transition-all"
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{language === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}</TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50 transition-all"
                >
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span>{language === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}</span>
                </button>
              )
            )}

            {/* Currency Selector */}
            {setCurrency && currency && (
              collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setCurrency(currency === 'AED' ? 'USD' : currency === 'USD' ? 'EUR' : 'AED')}
                      className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50 transition-all text-xs font-medium"
                    >
                      {currency}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Currency: {currency}</TooltipContent>
                </Tooltip>
              ) : (
                <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                  <SelectTrigger className="w-full h-10 bg-theme-bg/50 border-theme-border text-theme-text text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AED">🇦🇪 AED</SelectItem>
                    <SelectItem value="USD">🇺🇸 USD</SelectItem>
                    <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                    <SelectItem value="GBP">🇬🇧 GBP</SelectItem>
                  </SelectContent>
                </Select>
              )
            )}
          </div>
        )}

        {/* Admin Link - Home is now in Navigate section */}
        {isAdmin && (
          <div className={cn("space-y-1", collapsed ? "p-2" : "p-3")}>
            <ActionButton 
              icon={SlidersHorizontal} 
              label="Admin" 
              to="/dashboard" 
              collapsed={collapsed}
            />
          </div>
        )}

        {/* Keyboard Shortcuts Hint */}
        {!collapsed && (
          <div className="px-3 pb-3">
            <p className="text-[10px] text-theme-text-muted/60 text-center">
              Press <span className="text-theme-accent font-medium">C</span> to configure
            </p>
          </div>
        )}
      </div>

      {/* Compare Quotes Modal */}
      <QuoteSelector
        open={compareModalOpen}
        onClose={() => {
          if (selectedQuoteIds.length >= 2) {
            handleCompareConfirm();
          } else {
            setCompareModalOpen(false);
          }
        }}
        selectedIds={selectedQuoteIds}
        onSelect={handleCompareSelect}
        maxQuotes={4}
      />
    </aside>
  );
};
