import { Building2, CreditCard, Home, TrendingUp, Landmark, FileText, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { OIInputs } from "@/components/roi/useOICalculations";
import { MortgageInputs } from "@/components/roi/useMortgageCalculations";
import { Button } from "@/components/ui/button";

export type SectionId = 'overview' | 'property' | 'payments' | 'hold' | 'exit' | 'mortgage' | 'summary';

interface DashboardSidebarProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  inputs: OIInputs;
  mortgageInputs: MortgageInputs;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export const DashboardSidebar = ({
  activeSection,
  onSectionChange,
  inputs,
  mortgageInputs,
  collapsed,
  onCollapsedChange,
}: DashboardSidebarProps) => {
  const { t } = useLanguage();

  const sections = [
    { id: 'overview' as SectionId, label: t('investmentOverview') || 'Overview', icon: LayoutGrid, show: true },
    { id: 'property' as SectionId, label: t('tabProperty'), icon: Building2, show: true },
    { id: 'payments' as SectionId, label: t('tabPayments'), icon: CreditCard, show: true },
    { id: 'hold' as SectionId, label: t('tabHold'), icon: Home, show: inputs.enabledSections?.longTermHold !== false },
    { id: 'exit' as SectionId, label: t('tabExit'), icon: TrendingUp, show: inputs.enabledSections?.exitStrategy !== false },
    { id: 'mortgage' as SectionId, label: t('tabMortgage'), icon: Landmark, show: mortgageInputs.enabled },
    { id: 'summary' as SectionId, label: t('tabSummary'), icon: FileText, show: true },
  ].filter(section => section.show);

  return (
    <aside 
      className={cn(
        "bg-theme-card border-r border-theme-border flex flex-col h-full transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-52"
      )}
    >
      {/* Header */}
      <div className={cn(
        "p-4 border-b border-theme-border flex items-center",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div>
            <h2 className="text-sm font-semibold text-theme-text">Dashboard</h2>
            <p className="text-xs text-theme-text-muted mt-0.5">Navigation</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapsedChange(!collapsed)}
          className="h-8 w-8 text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-1",
        collapsed ? "p-2" : "p-3"
      )}>
        {sections.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          
          return (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={cn(
                "w-full flex items-center rounded-lg text-sm font-medium transition-all",
                collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-theme-accent/15 text-theme-accent"
                  : "text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn(
                "flex-shrink-0",
                isActive ? "w-5 h-5" : "w-4 h-4"
              )} />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Keyboard Shortcuts Hint */}
      {!collapsed && (
        <div className="p-3 border-t border-theme-border">
          <p className="text-[10px] text-theme-text-muted text-center">
            Press 1-{sections.length} to navigate
          </p>
        </div>
      )}
    </aside>
  );
};
