import { useState } from "react";
import { LogOut, Landmark, ChevronDown, ChevronUp } from "lucide-react";
import { ExitsSection } from "./ExitsSection";
import { MortgageSection } from "./MortgageSection";
import { ConfiguratorSectionProps } from "./types";
import { MortgageInputs } from "../useMortgageCalculations";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  iconColor?: string;
  badge?: string;
}

const CollapsibleCard = ({ title, subtitle, icon, isOpen, onToggle, children, iconColor = "text-theme-accent", badge }: CollapsibleCardProps) => (
  <div className="border border-theme-border rounded-xl overflow-hidden bg-theme-card">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 hover:bg-theme-bg-alt/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg bg-theme-exit/10",
          iconColor.includes("amber") && "bg-theme-warning/10"
        )}>
          {icon}
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-theme-text">{title}</h4>
            {badge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-theme-text-muted/20 text-theme-text-muted">
                {badge}
              </span>
            )}
          </div>
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

interface ExitSectionProps extends ConfiguratorSectionProps {
  mortgageInputs: MortgageInputs;
  setMortgageInputs: React.Dispatch<React.SetStateAction<MortgageInputs>>;
}

export const ExitSection = ({ 
  inputs, 
  setInputs, 
  currency,
  mortgageInputs,
  setMortgageInputs,
}: ExitSectionProps) => {
  const [exitsOpen, setExitsOpen] = useState(true);
  const [mortgageOpen, setMortgageOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-theme-text mb-1">Exit & Financing</h3>
        <p className="text-sm text-theme-text-muted">Configure exit scenarios and optional mortgage financing</p>
      </div>

      <CollapsibleCard
        title="Exit Scenarios"
        subtitle="Flip points and ROE analysis"
        icon={<LogOut className="w-4 h-4 text-theme-exit" />}
        isOpen={exitsOpen}
        onToggle={() => setExitsOpen(!exitsOpen)}
      >
        <ExitsSection inputs={inputs} setInputs={setInputs} currency={currency} />
      </CollapsibleCard>

      <CollapsibleCard
        title="Mortgage Calculator"
        subtitle="Post-handover financing options"
        icon={<Landmark className="w-4 h-4 text-theme-warning" />}
        isOpen={mortgageOpen}
        onToggle={() => setMortgageOpen(!mortgageOpen)}
        iconColor="text-amber-400"
        badge={mortgageInputs.enabled ? "enabled" : "optional"}
      >
        <MortgageSection 
          inputs={inputs} 
          setInputs={setInputs} 
          currency={currency} 
          mortgageInputs={mortgageInputs}
          setMortgageInputs={setMortgageInputs}
        />
      </CollapsibleCard>

      {/* Tip */}
      <div className="text-xs text-theme-text-muted px-1">
        <p>💡 Exit scenarios let you compare flip opportunities at different construction stages.</p>
      </div>
    </div>
  );
};
