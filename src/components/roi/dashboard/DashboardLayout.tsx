import { ReactNode, useEffect, useCallback, useState } from "react";
import { DashboardSidebar, SectionId } from "./DashboardSidebar";
import { OIInputs } from "@/components/roi/useOICalculations";
import { MortgageInputs } from "@/components/roi/useMortgageCalculations";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Profile } from "@/hooks/useProfile";

interface DashboardLayoutProps {
  children: ReactNode;
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  inputs: OIInputs;
  mortgageInputs: MortgageInputs;
  // New props for sidebar bottom section
  profile?: Profile | null;
  isAdmin?: boolean;
  onConfigure?: () => void;
  onLoadQuote?: () => void;
  onViewHistory?: () => void;
  onSwitchView?: () => void;
  quoteId?: string;
}

export const DashboardLayout = ({
  children,
  activeSection,
  onSectionChange,
  inputs,
  mortgageInputs,
  profile,
  isAdmin,
  onConfigure,
  onLoadQuote,
  onViewHistory,
  onSwitchView,
  quoteId,
}: DashboardLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
          onSectionChange(sections[key - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSectionChange, getVisibleSections]);

  const handleSectionChange = (section: SectionId) => {
    onSectionChange(section);
    setMobileMenuOpen(false);
  };

  const sidebarProps = {
    activeSection,
    inputs,
    mortgageInputs,
    collapsed,
    onCollapsedChange: setCollapsed,
    profile,
    isAdmin,
    onConfigure,
    onLoadQuote,
    onViewHistory,
    onSwitchView,
    quoteId,
  };

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full">
        <DashboardSidebar
          {...sidebarProps}
          onSectionChange={onSectionChange}
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
              onSectionChange={handleSectionChange}
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
