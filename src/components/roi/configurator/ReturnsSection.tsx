import { useState } from "react";
import { TrendingUp, Home, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { AppreciationSection } from "./AppreciationSection";
import { RentSection } from "./RentSection";
import { ExitsSection } from "./ExitsSection";
import { ConfiguratorSectionProps } from "./types";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  iconColor?: string;
}

const CollapsibleCard = ({ title, subtitle, icon, isOpen, onToggle, children, iconColor = "text-theme-accent" }: CollapsibleCardProps) => (
  <div className="border border-theme-border rounded-xl overflow-hidden bg-theme-card">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 hover:bg-theme-bg-alt/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-theme-accent/10", iconColor.includes("green") && "bg-green-500/10", iconColor.includes("orange") && "bg-orange-500/10")}>
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

export const ReturnsSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const [appreciationOpen, setAppreciationOpen] = useState(true);
  const [rentOpen, setRentOpen] = useState(true);
  const [exitsOpen, setExitsOpen] = useState(true);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-theme-text mb-1">Investment Returns</h3>
        <p className="text-sm text-theme-text-muted">Configure growth rates, rental income, and exit scenarios</p>
      </div>

      <CollapsibleCard
        title="Appreciation Profile"
        subtitle="Construction, growth, and mature phases"
        icon={<TrendingUp className="w-4 h-4 text-theme-accent" />}
        isOpen={appreciationOpen}
        onToggle={() => setAppreciationOpen(!appreciationOpen)}
      >
        <AppreciationSection inputs={inputs} setInputs={setInputs} currency={currency} />
      </CollapsibleCard>

      <CollapsibleCard
        title="Rental Strategy"
        subtitle="Long-term yield and Airbnb comparison"
        icon={<Home className="w-4 h-4 text-green-400" />}
        isOpen={rentOpen}
        onToggle={() => setRentOpen(!rentOpen)}
        iconColor="text-green-400"
      >
        <RentSection inputs={inputs} setInputs={setInputs} currency={currency} />
      </CollapsibleCard>

      <CollapsibleCard
        title="Exit Scenarios"
        subtitle="Flip points and ROE analysis"
        icon={<LogOut className="w-4 h-4 text-orange-400" />}
        isOpen={exitsOpen}
        onToggle={() => setExitsOpen(!exitsOpen)}
        iconColor="text-orange-400"
      >
        <ExitsSection inputs={inputs} setInputs={setInputs} currency={currency} />
      </CollapsibleCard>
    </div>
  );
};
