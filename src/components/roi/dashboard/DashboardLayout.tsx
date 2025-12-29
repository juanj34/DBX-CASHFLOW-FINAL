import { ReactNode, useEffect, useCallback } from "react";
import { DashboardSidebar, SectionId } from "./DashboardSidebar";
import { OIInputs } from "@/components/roi/useOICalculations";
import { MortgageInputs } from "@/components/roi/useMortgageCalculations";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  inputs: OIInputs;
  mortgageInputs: MortgageInputs;
}

export const DashboardLayout = ({
  children,
  activeSection,
  onSectionChange,
  inputs,
  mortgageInputs,
}: DashboardLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get visible sections for keyboard navigation
  const getVisibleSections = useCallback((): SectionId[] => {
    const sections: SectionId[] = ['property', 'payments'];
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

  return (
    <div className="flex min-h-[calc(100vh-60px)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          inputs={inputs}
          mortgageInputs={mortgageInputs}
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
          <SheetContent side="left" className="w-[240px] bg-[#0d1117] border-theme-border p-0">
            <DashboardSidebar
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              inputs={inputs}
              mortgageInputs={mortgageInputs}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};
