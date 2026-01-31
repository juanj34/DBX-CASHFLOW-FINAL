import { Building2, Sparkles, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfiguratorSection, SectionStatus } from "./types";
import { OIInputs } from "../useOICalculations";

interface ConfiguratorSidebarProps {
  activeSection: ConfiguratorSection;
  onSectionChange: (section: ConfiguratorSection) => void;
  inputs: OIInputs;
  visitedSections: Set<ConfiguratorSection>;
}

export const ConfiguratorSidebar = ({ 
  activeSection, 
  onSectionChange,
  inputs,
  visitedSections
}: ConfiguratorSidebarProps) => {
  // Calculate section completion status
  const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  const hasPostHandoverPlan = inputs.hasPostHandoverPlan ?? false;
  
  let totalPayment: number;
  if (hasPostHandoverPlan) {
    totalPayment = inputs.downpaymentPercent + additionalPaymentsTotal;
  } else {
    const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;
    totalPayment = preHandoverTotal + (100 - inputs.preHandoverPercent);
  }
  const isPaymentValid = Math.abs(totalPayment - 100) < 0.5;
  
  const hasAppreciationData = inputs.constructionAppreciation > 0 || inputs.growthAppreciation > 0 || inputs.matureAppreciation > 0;
  
  // 4 consolidated sections
  const sections: SectionStatus[] = [
    {
      id: 'project',
      label: 'Project',
      icon: Users,
      isComplete: visitedSections.has('project') && Boolean(inputs.zoneId),
    },
    {
      id: 'investment',
      label: 'Investment',
      icon: Building2,
      isComplete: visitedSections.has('investment') && inputs.basePrice > 0 && isPaymentValid,
      hasWarning: visitedSections.has('investment') && inputs.basePrice > 0 && !isPaymentValid,
    },
    {
      id: 'returns',
      label: 'Returns',
      icon: TrendingUp,
      isComplete: visitedSections.has('returns') && hasAppreciationData,
    },
    {
      id: 'extras',
      label: 'More',
      icon: Sparkles,
      // Extras is optional - complete when visited
      isComplete: visitedSections.has('extras'),
    },
  ];

  return (
    <div className="w-48 shrink-0 h-full border-r border-theme-border bg-theme-bg p-4 flex flex-col">
      <div className="space-y-1">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const isPast = index < sections.findIndex(s => s.id === activeSection);
          
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                isActive 
                  ? "bg-theme-accent/20 text-theme-accent border border-theme-accent/30" 
                  : "text-theme-text-muted hover:bg-theme-card hover:text-theme-text"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                isActive
                  ? "bg-theme-accent text-theme-bg scale-110 ring-2 ring-theme-accent/30"
                  : isPast
                    ? "bg-theme-accent/20 text-theme-accent"
                    : "bg-theme-card-alt text-theme-text-muted"
              )}>
                {index + 1}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{section.label}</span>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Keyboard hint */}
      <div className="mt-auto pt-4 border-t border-theme-border">
        <div className="text-[10px] text-theme-text-muted space-y-1">
          <div className="flex justify-between">
            <span>Navigate</span>
            <span className="font-mono">1-4</span>
          </div>
          <div className="flex justify-between">
            <span>Next/Prev</span>
            <span className="font-mono">←/→</span>
          </div>
        </div>
      </div>
    </div>
  );
};
