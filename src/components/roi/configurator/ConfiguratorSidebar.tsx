import { Building2, CreditCard, Sparkles, Home, TrendingUp, Check, AlertCircle, LogOut, Users, Image } from "lucide-react";
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
  const totalPayment = preHandoverTotal + (100 - inputs.preHandoverPercent);
  const isPaymentValid = Math.abs(totalPayment - 100) < 0.01;
  
  const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
  const handoverQuarterMonth = (inputs.handoverQuarter - 1) * 3 + 1;
  const handoverDate = new Date(inputs.handoverYear, handoverQuarterMonth - 1);
  const isDateValid = handoverDate > bookingDate;

  const appreciationBonus = calculateAppreciationBonus(inputs.valueDifferentiators || []);

  // Only show complete if section has ACTUAL DATA (not just visited)
  const hasAppreciationData = inputs.constructionAppreciation > 0 || inputs.growthAppreciation > 0 || inputs.matureAppreciation > 0;
  const hasExitData = inputs._exitScenarios && inputs._exitScenarios.length > 0;
  const hasRentData = inputs.rentalYieldPercent > 0;
  const hasValueData = inputs.valueDifferentiators && inputs.valueDifferentiators.length > 0;
  
  const sections: SectionStatus[] = [
    {
      id: 'client',
      label: 'Client',
      icon: Users,
      // Must be visited AND have zone selected
      isComplete: visitedSections.has('client') && Boolean(inputs.zoneId),
    },
    {
      id: 'property',
      label: 'Property',
      icon: Building2,
      isComplete: visitedSections.has('property') && inputs.basePrice > 0 && isDateValid,
      hasWarning: visitedSections.has('property') && inputs.basePrice > 0 && !isDateValid,
    },
    {
      id: 'images',
      label: 'Media',
      icon: Image,
      // Media is optional - mark complete when visited
      isComplete: visitedSections.has('images'),
    },
    {
      id: 'payment',
      label: 'Payment',
      icon: CreditCard,
      isComplete: visitedSections.has('payment') && inputs.downpaymentPercent > 0 && inputs.preHandoverPercent > 0 && isPaymentValid,
      hasWarning: visitedSections.has('payment') && inputs.preHandoverPercent > 0 && !isPaymentValid,
    },
    {
      id: 'value',
      label: 'Value',
      icon: Sparkles,
      // Value is optional - show complete if visited
      isComplete: visitedSections.has('value'),
    },
    {
      id: 'appreciation',
      label: 'Growth',
      icon: TrendingUp,
      isComplete: visitedSections.has('appreciation') && hasAppreciationData,
    },
    {
      id: 'exits',
      label: 'Exits',
      icon: LogOut,
      isComplete: visitedSections.has('exits') && hasExitData,
    },
    {
      id: 'rent',
      label: 'Rent',
      icon: Home,
      isComplete: visitedSections.has('rent') && hasRentData,
    },
    {
      id: 'mortgage',
      label: 'Mortgage',
      icon: Building2,
      // Mortgage is truly optional - mark complete when visited
      isComplete: visitedSections.has('mortgage'),
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
              onClick={() => {
                // Allow navigation to previous sections or current section
                const currentIndex = sections.findIndex(s => s.id === activeSection);
                const targetIndex = index;
                // Allow going back or staying, warn if skipping forward without completing
                if (targetIndex <= currentIndex || section.isComplete || visitedSections.has(section.id)) {
                  onSectionChange(section.id);
                } else {
                  // Still allow but will be blocked by Next button validation
                  onSectionChange(section.id);
                }
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                isActive 
                  ? "bg-theme-accent/20 text-theme-accent border border-theme-accent/30" 
                  : "text-theme-text-muted hover:bg-theme-card hover:text-white"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                section.isComplete && !section.hasWarning
                  ? "bg-green-500/20 text-green-400"
                  : section.hasWarning
                    ? "bg-amber-500/20 text-amber-400"
                    : isActive
                      ? "bg-theme-accent/30 text-theme-accent"
                      : "bg-theme-card-alt text-theme-text-muted"
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
        <div className="text-[10px] text-theme-text-muted space-y-1">
          <div className="flex justify-between">
            <span>Navigate</span>
            <span className="font-mono">1-9</span>
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
