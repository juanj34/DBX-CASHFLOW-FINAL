import { useState } from "react";
import { Building2, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { PropertySection } from "./PropertySection";
import { PaymentSection } from "./PaymentSection";
import { ConfiguratorSectionProps } from "./types";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accentColor?: string;
}

const CollapsibleCard = ({ title, subtitle, icon, isOpen, onToggle, children, accentColor = "theme-accent" }: CollapsibleCardProps) => (
  <div className="border border-theme-border rounded-lg overflow-hidden bg-theme-card">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 hover:bg-theme-bg-alt/50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-md", `bg-${accentColor}/20`)}>
          {icon}
        </div>
        <div className="text-left">
          <h4 className="text-sm font-medium text-theme-text">{title}</h4>
          {subtitle && <p className="text-[11px] text-theme-text-muted leading-tight">{subtitle}</p>}
        </div>
      </div>
      {isOpen ? (
        <ChevronUp className="w-3.5 h-3.5 text-theme-text-muted" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 text-theme-text-muted" />
      )}
    </button>
    <div className={cn(
      "overflow-hidden transition-all duration-300",
      isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
    )}>
      <div className="px-3 pb-3 pt-1 border-t border-theme-border">
        {children}
      </div>
    </div>
  </div>
);

export const InvestmentSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const [propertyOpen, setPropertyOpen] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(true);

  return (
    <div className="space-y-2">
      <CollapsibleCard
        title="Property & Entry Costs"
        subtitle="Base price, booking/handover dates"
        icon={<Building2 className="w-3.5 h-3.5 text-theme-accent" />}
        isOpen={propertyOpen}
        onToggle={() => setPropertyOpen(!propertyOpen)}
      >
        <PropertySection inputs={inputs} setInputs={setInputs} currency={currency} />
      </CollapsibleCard>

      <CollapsibleCard
        title="Payment Plan"
        subtitle="Split, installments, post-handover"
        icon={<CreditCard className="w-3.5 h-3.5 text-blue-400" />}
        isOpen={paymentOpen}
        onToggle={() => setPaymentOpen(!paymentOpen)}
        accentColor="blue-400"
      >
        <PaymentSection inputs={inputs} setInputs={setInputs} currency={currency} />
      </CollapsibleCard>
    </div>
  );
};
