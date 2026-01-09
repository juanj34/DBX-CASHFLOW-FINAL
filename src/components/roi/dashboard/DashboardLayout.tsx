import { ReactNode, useEffect, useCallback, useState } from "react";
import { DashboardSidebar, SectionId } from "./DashboardSidebar";
import { OIInputs } from "@/components/roi/useOICalculations";
import { MortgageInputs } from "@/components/roi/useMortgageCalculations";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Profile } from "@/hooks/useProfile";
import { Currency } from "@/components/roi/currencyUtils";

export type ViewMode = 'tabs' | 'vertical';

interface DashboardLayoutProps {
  children: ReactNode;
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  inputs: OIInputs;
  mortgageInputs: MortgageInputs;
  // View mode: tabs (one section at a time) or vertical (scroll all sections)
  viewMode?: ViewMode;
  // New props for sidebar bottom section
  profile?: Profile | null;
  isAdmin?: boolean;
  onConfigure?: () => void;
  onLoadQuote?: () => void;
  onViewHistory?: () => void;
  onPresentMode?: () => void; // Toggle presentation mode (internal)
  onShare?: () => void;
  onPresent?: () => void; // Open client view in new tab
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
  lastSaved?: Date | null;
  onSave?: () => void;
}

export const DashboardLayout = ({
  children,
  activeSection,
  onSectionChange,
  inputs,
  mortgageInputs,
  viewMode = 'tabs',
  profile,
  isAdmin,
  onConfigure,
  onLoadQuote,
  onViewHistory,
  onPresentMode,
  onShare,
  onPresent,
  viewCount,
  firstViewedAt,
  quoteId,
  language,
  setLanguage,
  currency,
  setCurrency,
  hasUnsavedChanges,
  saving,
  lastSaved,
  onSave,
}: DashboardLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Persist collapsed state in localStorage
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('cashflow_sidebar_collapsed');
    return saved === 'true';
  });

  // Save collapsed state to localStorage when it changes
  const handleCollapsedChange = useCallback((value: boolean) => {
    setCollapsed(value);
    localStorage.setItem('cashflow_sidebar_collapsed', String(value));
  }, []);

  // In vertical mode, clicking a section scrolls to it instead of switching tabs
  const handleSectionClick = useCallback((section: SectionId) => {
    if (viewMode === 'vertical') {
      const sectionMap: Record<SectionId, string> = {
        'overview': 'overview-section',
        'property': 'property-section',
        'payments': 'payments-section',
        'hold': 'hold-section',
        'exit': 'exit-section',
        'mortgage': 'mortgage-section',
        'summary': 'summary-section',
      };
      const element = document.getElementById(sectionMap[section]);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    onSectionChange(section);
    setMobileMenuOpen(false);
  }, [viewMode, onSectionChange]);

  // Get visible sections for keyboard navigation
  const getVisibleSections = useCallback((): SectionId[] => {
    const sections: SectionId[] = ['overview', 'property', 'payments'];
    if (inputs.enabledSections?.longTermHold !== false) sections.push('hold');
    if (inputs.enabledSections?.exitStrategy !== false) sections.push('exit');
    if (mortgageInputs.enabled) sections.push('mortgage');
    sections.push('summary');
    return sections;
  }, [inputs.enabledSections, mortgageInputs.enabled]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = parseInt(e.key);
      if (key >= 1 && key <= 9) {
        const sections = getVisibleSections();
        if (key <= sections.length) {
          handleSectionClick(sections[key - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSectionClick, getVisibleSections]);

  const sidebarProps = {
    activeSection,
    inputs,
    mortgageInputs,
    collapsed,
    onCollapsedChange: handleCollapsedChange,
    profile,
    isAdmin,
    onConfigure,
    onLoadQuote,
    onViewHistory,
    onPresentMode,
    onShare,
    onPresent,
    viewCount,
    firstViewedAt,
    quoteId,
    language,
    setLanguage,
    currency,
    setCurrency,
    hasUnsavedChanges,
    saving,
    lastSaved,
    onSave,
    viewMode,
  };

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full">
        <DashboardSidebar
          {...sidebarProps}
          onSectionChange={handleSectionClick}
        />
      </div>

      {/* Mobile Menu */}
      <div className="lg:hidden fixed bottom-4 left-4 z-50">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full bg-theme-accent text-theme-bg shadow-lg hover:bg-theme-accent/90"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] bg-theme-card border-theme-border p-0">
            <DashboardSidebar
              {...sidebarProps}
              onSectionChange={handleSectionClick}
              collapsed={false}
              onCollapsedChange={() => {}}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-theme-bg flex flex-col">
        <div className="p-6 flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
};
