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
  <div className="border border-theme-border rounded-xl overflow-hidden bg-theme-card">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 hover:bg-theme-bg-alt/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", `bg-${accentColor}/20`)}>
          {icon}
        </div>
        <div className="text-left">
          <h4 className="text-sm font-semibold text-theme-text">{title}</h4>
          {subtitle && <p className="text-xs text-theme-text-muted">{subtitle}</p>}
        </div>
      </div>
      {isOpen ? (
        <ChevronUp className="w-4 h-4 text-theme-text-muted" />
      ) : (
        <ChevronDown className="w-4 h-4 text-theme-text-muted" />
      )}
    </button>
    <div className={cn(
      "overflow-hidden transition-all duration-300",
      isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
    )}>
      <div className="p-4 pt-2 border-t border-theme-border">
        {children}
      </div>
    </div>
  </div>
);

export const InvestmentSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const [propertyOpen, setPropertyOpen] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(true);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-theme-text mb-1">Investment Details</h3>
        <p className="text-sm text-theme-text-muted">Configure property price, dates, and payment structure</p>
      </div>

      <CollapsibleCard
        title="Property & Entry Costs"
        subtitle="Base price, booking/handover dates"
        icon={<Building2 className="w-4 h-4 text-theme-accent" />}
        isOpen={propertyOpen}
        onToggle={() => setPropertyOpen(!propertyOpen)}
      >
        <PropertySection inputs={inputs} setInputs={setInputs} currency={currency} />
      </CollapsibleCard>

      <CollapsibleCard
        title="Payment Plan"
        subtitle="Split, installments, post-handover"
        icon={<CreditCard className="w-4 h-4 text-blue-400" />}
        isOpen={paymentOpen}
        onToggle={() => setPaymentOpen(!paymentOpen)}
        accentColor="blue-400"
      >
        <PaymentSection inputs={inputs} setInputs={setInputs} currency={currency} />
      </CollapsibleCard>
    </div>
  );
};
