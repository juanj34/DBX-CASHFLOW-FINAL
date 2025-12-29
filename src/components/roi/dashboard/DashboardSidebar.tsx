import { Building2, CreditCard, Home, TrendingUp, Landmark, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { OIInputs } from "@/components/roi/useOICalculations";
import { MortgageInputs } from "@/components/roi/useMortgageCalculations";

export type SectionId = 'property' | 'payments' | 'hold' | 'exit' | 'mortgage' | 'summary';

interface DashboardSidebarProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  inputs: OIInputs;
  mortgageInputs: MortgageInputs;
}

export const DashboardSidebar = ({
  activeSection,
  onSectionChange,
  inputs,
  mortgageInputs,
}: DashboardSidebarProps) => {
  const { t } = useLanguage();

  const sections = [
    { id: 'property' as SectionId, label: t('tabProperty'), icon: Building2, show: true },
    { id: 'payments' as SectionId, label: t('tabPayments'), icon: CreditCard, show: true },
    { id: 'hold' as SectionId, label: t('tabHold'), icon: Home, show: inputs.enabledSections?.longTermHold !== false },
    { id: 'exit' as SectionId, label: t('tabExit'), icon: TrendingUp, show: inputs.enabledSections?.exitStrategy !== false },
    { id: 'mortgage' as SectionId, label: t('tabMortgage'), icon: Landmark, show: mortgageInputs.enabled },
    { id: 'summary' as SectionId, label: t('tabSummary'), icon: FileText, show: true },
  ].filter(section => section.show);

  return (
    <aside className="w-[200px] bg-[#0d1117] border-r border-theme-border flex-shrink-0 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-theme-border">
        <h2 className="text-sm font-semibold text-theme-text">Dashboard</h2>
        <p className="text-xs text-theme-text-muted mt-0.5">Navigation</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {sections.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          
          return (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-theme-accent/20 text-theme-accent border-l-2 border-theme-accent"
                  : "text-theme-text-muted hover:text-theme-text hover:bg-theme-card/50"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Keyboard Shortcuts Hint */}
      <div className="p-3 border-t border-theme-border">
        <p className="text-[10px] text-theme-text-muted text-center">
          Press 1-{sections.length} to navigate
        </p>
      </div>
    </aside>
  );
};
