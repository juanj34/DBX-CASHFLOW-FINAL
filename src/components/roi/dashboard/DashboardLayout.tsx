import { ReactNode, useCallback, useState, forwardRef } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { OIInputs } from "@/components/roi/useOICalculations";
import { MortgageInputs } from "@/components/roi/useMortgageCalculations";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Profile } from "@/hooks/useProfile";
import { Currency } from "@/components/roi/currencyUtils";

interface DashboardLayoutProps {
  children: ReactNode;
  mainContentRef?: React.RefObject<HTMLDivElement>;
  inputs: OIInputs;
  mortgageInputs: MortgageInputs;
  // New props for sidebar bottom section
  profile?: Profile | null;
  isAdmin?: boolean;
  onConfigure?: () => void;
  onLoadQuote?: () => void;
  onViewHistory?: () => void;
  onShare?: () => void;
  onPresent?: () => void; // Switch to builder/config view
  onSnapshot?: () => void; // Switch to cashflow view (client-ready)
  onNewQuote?: () => void; // Start a fresh new quote
  activeView?: 'cashflow' | 'snapshot'; // 'cashflow' = builder, 'snapshot' = client view
  viewCount?: number;
  quoteId?: string;
  shareToken?: string; // Share token for export
  // Language and currency
  language?: string;
  setLanguage?: (lang: string) => void;
  currency?: Currency;
  setCurrency?: (currency: Currency) => void;
  // Save status
  hasUnsavedChanges?: boolean;
  saving?: boolean;
  onSave?: () => void;
  // Export modal trigger
  onOpenExportModal?: () => void;
}

export const DashboardLayout = ({
  children,
  inputs,
  mortgageInputs,
  mainContentRef,
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
  shareToken,
  language,
  setLanguage,
  currency,
  setCurrency,
  hasUnsavedChanges,
  saving,
  onSave,
  onOpenExportModal,
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

  const sidebarProps = {
    inputs,
    mortgageInputs,
    collapsed,
    onCollapsedChange: handleCollapsedChange,
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
    shareToken,
    language,
    setLanguage,
    currency,
    setCurrency,
    hasUnsavedChanges,
    saving,
    onSave,
    onOpenExportModal,
  };

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full dashboard-sidebar">
        <DashboardSidebar {...sidebarProps} />
      </div>

      {/* Mobile Menu */}
      <div className="lg:hidden fixed bottom-4 left-4 z-50" data-export-hide="true">
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
              collapsed={false}
              onCollapsedChange={() => {}}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main 
        ref={mainContentRef} 
        className="flex-1 overflow-auto bg-theme-bg flex flex-col dashboard-main-content"
      >
        <div className="p-6 flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
};