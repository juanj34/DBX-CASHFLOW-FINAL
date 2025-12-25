import { Building2, CreditCard, Sparkles, Home, TrendingUp, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfiguratorSection, SectionStatus } from "./types";
import { OIInputs } from "../useOICalculations";
import { calculateAppreciationBonus } from "../valueDifferentiators";

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
  const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;
  const isPaymentValid = Math.abs(preHandoverTotal - inputs.preHandoverPercent) < 0.01;
  
  const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
  const handoverQuarterMonth = (inputs.handoverQuarter - 1) * 3 + 1;
  const handoverDate = new Date(inputs.handoverYear, handoverQuarterMonth - 1);
  const isDateValid = handoverDate > bookingDate;

  const appreciationBonus = calculateAppreciationBonus(inputs.valueDifferentiators || []);

  // Only show complete if section was visited AND data is valid
  const sections: SectionStatus[] = [
    {
      id: 'property',
      label: 'Property',
      icon: Building2,
      isComplete: visitedSections.has('property') && inputs.basePrice > 0 && isDateValid,
      hasWarning: visitedSections.has('property') && !isDateValid,
    },
    {
      id: 'payment',
      label: 'Payment',
      icon: CreditCard,
      isComplete: visitedSections.has('payment') && isPaymentValid,
      hasWarning: visitedSections.has('payment') && !isPaymentValid,
    },
    {
      id: 'value',
      label: 'Value',
      icon: Sparkles,
      isComplete: visitedSections.has('value'),
    },
    {
      id: 'income',
      label: 'Income',
      icon: Home,
      isComplete: visitedSections.has('income'),
    },
    {
      id: 'appreciation',
      label: 'Appreciation',
      icon: TrendingUp,
      isComplete: visitedSections.has('appreciation'),
    },
  ];

  return (
    <div className="w-48 shrink-0 h-full border-r border-[#2a3142] bg-[#0d1117] p-4 flex flex-col">
      <div className="space-y-1">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const isVisited = visitedSections.has(section.id);
          
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                isActive 
                  ? "bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/30" 
                  : "text-gray-400 hover:bg-[#1a1f2e] hover:text-white"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                section.isComplete && !section.hasWarning
                  ? "bg-green-500/20 text-green-400"
                  : section.hasWarning
                    ? "bg-amber-500/20 text-amber-400"
                    : isActive
                      ? "bg-[#CCFF00]/30 text-[#CCFF00]"
                      : "bg-[#2a3142] text-gray-500"
              )}>
                {section.isComplete && !section.hasWarning ? (
                  <Check className="w-3.5 h-3.5" />
                ) : section.hasWarning ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{section.label}</span>
                {section.id === 'value' && appreciationBonus > 0 && isVisited && (
                  <span className="text-[10px] text-[#CCFF00]">+{appreciationBonus.toFixed(1)}% bonus</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Keyboard hint */}
      <div className="mt-auto pt-4 border-t border-[#2a3142]">
        <div className="text-[10px] text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Navigate</span>
            <span className="font-mono">1-5</span>
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
