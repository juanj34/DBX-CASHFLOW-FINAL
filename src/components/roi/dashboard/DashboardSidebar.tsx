import { Building2, CreditCard, Home, TrendingUp, Landmark, FileText, ChevronLeft, ChevronRight, Settings2, Rows3, FolderOpen, History, LayoutDashboard, SlidersHorizontal, Sparkles, Globe, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { OIInputs } from "@/components/roi/useOICalculations";
import { MortgageInputs } from "@/components/roi/useMortgageCalculations";
import { Button } from "@/components/ui/button";
import { Profile } from "@/hooks/useProfile";
import { AdvisorInfo } from "@/components/roi/AdvisorInfo";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Currency } from "@/components/roi/currencyUtils";

export type SectionId = 'overview' | 'property' | 'payments' | 'hold' | 'exit' | 'mortgage' | 'summary';

interface DashboardSidebarProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
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
  onSwitchView?: () => void;
  onShare?: () => void;
  viewCount?: number;
  firstViewedAt?: string | null;
  quoteId?: string;
  // Language and currency
  language?: string;
  setLanguage?: (lang: string) => void;
  currency?: Currency;
  setCurrency?: (currency: Currency) => void;
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

export const DashboardSidebar = ({
  activeSection,
  onSectionChange,
  inputs,
  mortgageInputs,
  collapsed,
  onCollapsedChange,
  profile,
  isAdmin,
  onConfigure,
  onLoadQuote,
  onViewHistory,
  onSwitchView,
  onShare,
  viewCount,
  firstViewedAt,
  quoteId,
  language,
  setLanguage,
  currency,
  setCurrency,
}: DashboardSidebarProps) => {
  const { t } = useLanguage();

  // Presentation section - simple single word label
  const presentationSection = {
    id: 'overview' as SectionId,
    label: 'Present',
    icon: Sparkles,
  };

  // Analysis sections
  const analysisSections = [
    { id: 'property' as SectionId, label: t('tabProperty'), icon: Building2, show: true },
    { id: 'payments' as SectionId, label: t('tabPayments'), icon: CreditCard, show: true },
    { id: 'hold' as SectionId, label: t('tabHold'), icon: Home, show: inputs.enabledSections?.longTermHold !== false },
    { id: 'exit' as SectionId, label: t('tabExit'), icon: TrendingUp, show: inputs.enabledSections?.exitStrategy !== false },
    { id: 'mortgage' as SectionId, label: t('tabMortgage'), icon: Landmark, show: mortgageInputs.enabled },
    { id: 'summary' as SectionId, label: t('tabSummary'), icon: FileText, show: true },
  ].filter(section => section.show);

  const NavButton = ({ icon: Icon, label, onClick, isActive, to }: { 
    icon: typeof Home; 
    label: string; 
    onClick?: () => void; 
    isActive?: boolean;
    to?: string;
  }) => {
    const content = (
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center rounded-lg text-sm font-medium transition-all",
          collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2",
          isActive
            ? "bg-theme-accent/15 text-theme-accent"
            : "text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50"
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
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
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    ) : content;
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
        "p-3 border-b border-theme-border flex items-center",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <AppLogo collapsed={collapsed} />
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
        <div className="p-2 flex justify-center">
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

      {/* Main Navigation */}
      <nav className={cn(
        "flex-1 overflow-y-auto",
        collapsed ? "p-2" : "p-3"
      )}>
        {/* PRESENT Section */}
        {!collapsed && (
          <div className="mb-2">
            <span className="text-[10px] uppercase tracking-wider text-theme-text-muted/70 font-medium px-1">
              Present
            </span>
          </div>
        )}
        
        {/* Presentation Button - Same style as other nav items */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSectionChange('overview')}
                className={cn(
                  "w-full flex items-center justify-center p-2.5 rounded-lg transition-all",
                  activeSection === 'overview'
                    ? "bg-theme-accent/15 text-theme-accent"
                    : "text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50"
                )}
              >
                <Sparkles className={cn(
                  "flex-shrink-0",
                  activeSection === 'overview' ? "w-5 h-5" : "w-4 h-4"
                )} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{presentationSection.label}</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={() => onSectionChange('overview')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              activeSection === 'overview'
                ? "bg-theme-accent/15 text-theme-accent"
                : "text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50"
            )}
          >
            <Sparkles className={cn(
              "flex-shrink-0",
              activeSection === 'overview' ? "w-5 h-5" : "w-4 h-4"
            )} />
            <span className="truncate">{presentationSection.label}</span>
          </button>
        )}

        {/* Visual Separator */}
        <div className={cn("my-3", collapsed ? "px-1" : "px-0")}>
          <div className="h-px bg-gradient-to-r from-transparent via-theme-border to-transparent" />
        </div>

        {/* ANALYZE Section */}
        {!collapsed && (
          <div className="mb-2">
            <span className="text-[10px] uppercase tracking-wider text-theme-text-muted/70 font-medium px-1">
              Analyze
            </span>
          </div>
        )}

        {/* Analysis Navigation Items */}
        <div className="space-y-1">
          {analysisSections.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            
            const content = (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={cn(
                  "w-full flex items-center rounded-lg text-sm font-medium transition-all",
                  collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-theme-accent/15 text-theme-accent"
                    : "text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50"
                )}
              >
                <Icon className={cn(
                  "flex-shrink-0",
                  isActive ? "w-5 h-5" : "w-4 h-4"
                )} />
                {!collapsed && <span className="truncate">{label}</span>}
              </button>
            );
            
            return collapsed ? (
              <Tooltip key={id}>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ) : content;
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-theme-border">
        {/* Advisor Info */}
        {profile && (
          <div className={cn(
            "border-b border-theme-border",
            collapsed ? "p-2 flex justify-center" : "p-3"
          )}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2a3142] ring-2 ring-[#CCFF00]/30 cursor-default">
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
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              <AdvisorInfo profile={profile} size="sm" showSubtitle />
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className={cn("space-y-1", collapsed ? "p-2" : "p-3")}>
          {/* Configure Button - Primary Action */}
          {onConfigure && (
            collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onConfigure}
                    size="icon"
                    className="w-full h-9 bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
                  >
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Configure</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                onClick={onConfigure}
                className="w-full bg-theme-accent text-theme-bg hover:bg-theme-accent/90 justify-start gap-2"
                size="sm"
              >
                <Settings2 className="w-4 h-4" />
                Configure
              </Button>
            )
          )}

          {/* Load Quote */}
          {onLoadQuote && (
            <NavButton icon={FolderOpen} label={t('loadQuote') || 'Load Quote'} onClick={onLoadQuote} />
          )}

          {/* Version History */}
          {onViewHistory && quoteId && (
            <NavButton icon={History} label={t('versionHistory') || 'History'} onClick={onViewHistory} />
          )}

          {/* Switch View */}
          {onSwitchView && (
            <NavButton icon={Rows3} label="Vertical View" onClick={onSwitchView} />
          )}

          {/* Share */}
          {onShare && quoteId && (
            collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onShare}
                    className="w-full flex items-center justify-center p-2.5 rounded-lg transition-all text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50"
                  >
                    <Share2 className="w-4 h-4" />
                    {viewCount != null && viewCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-[10px] text-white rounded-full flex items-center justify-center">
                        {viewCount}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Share {viewCount ? `(${viewCount} views)` : ''}
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={onShare}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50 transition-all"
              >
                <Share2 className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">Share</span>
                {viewCount != null && viewCount > 0 && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                    {viewCount}
                  </span>
                )}
              </button>
            )
          )}
        </div>

        <Separator className="bg-theme-border" />

        {/* Language & Currency Settings */}
        {(setLanguage || setCurrency) && (
          <div className={cn("space-y-2", collapsed ? "p-2" : "p-3")}>
            {/* Language Toggle */}
            {setLanguage && (
              collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                      className="w-full flex items-center justify-center p-2.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50 transition-all"
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{language === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}</TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50 transition-all"
                >
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span>{language === 'en' ? '🇬🇧 EN' : '🇪🇸 ES'}</span>
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
                      className="w-full flex items-center justify-center p-2.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50 transition-all text-xs font-medium"
                    >
                      {currency}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Currency: {currency}</TooltipContent>
                </Tooltip>
              ) : (
                <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                  <SelectTrigger className="w-full h-9 bg-transparent border-theme-border text-sm">
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

        <Separator className="bg-theme-border" />

        {/* Navigation Links */}
        <div className={cn("space-y-1", collapsed ? "p-2" : "p-3")}>
          <NavButton icon={LayoutDashboard} label="Home" to="/home" />
          {isAdmin && (
            <NavButton icon={SlidersHorizontal} label="Admin" to="/dashboard" />
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        {!collapsed && (
          <div className="p-3 pt-0">
            <p className="text-[10px] text-theme-text-muted text-center">
              Press <span className="text-theme-accent">P</span> to present · <span className="text-theme-text-muted">1-{analysisSections.length}</span> to analyze
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
