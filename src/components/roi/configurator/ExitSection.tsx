import { useState } from "react";
import { LogOut, Landmark, ChevronDown, ChevronUp } from "lucide-react";
import { ExitsSection } from "./ExitsSection";
import { MortgageSection } from "./MortgageSection";
import { ConfiguratorSectionProps } from "./types";
import { MortgageInputs } from "../useMortgageCalculations";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-semibold text-theme-text">Exit & Financing</h3>
        <p className="text-sm text-theme-text-muted">Exit scenarios and optional mortgage</p>
      </div>

      {/* Exit Scenarios - Collapsible */}
      <Collapsible open={exitsOpen} onOpenChange={setExitsOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between py-2 hover:bg-theme-bg-alt/30 rounded-lg transition-colors -mx-1 px-1">
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-theme-exit" />
            <div className="text-left">
              <span className="text-sm font-medium text-theme-text">Exit Scenarios</span>
              <span className="text-xs text-theme-text-muted ml-2">Flip points & ROE</span>
            </div>
          </div>
          {exitsOpen ? (
            <ChevronUp className="w-4 h-4 text-theme-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-theme-text-muted" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-2 pl-4 border-l-2 border-theme-exit/30">
            <ExitsSection inputs={inputs} setInputs={setInputs} currency={currency} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Divider */}
      <div className="border-t border-theme-border/30" />

      {/* Mortgage Calculator - Collapsible */}
      <Collapsible open={mortgageOpen} onOpenChange={setMortgageOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between py-2 hover:bg-theme-bg-alt/30 rounded-lg transition-colors -mx-1 px-1">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-theme-warning" />
            <div className="text-left">
              <span className="text-sm font-medium text-theme-text">Mortgage Calculator</span>
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded ml-2",
                mortgageInputs.enabled 
                  ? "bg-theme-accent/20 text-theme-accent" 
                  : "bg-theme-text-muted/20 text-theme-text-muted"
              )}>
                {mortgageInputs.enabled ? "enabled" : "optional"}
              </span>
            </div>
          </div>
          {mortgageOpen ? (
            <ChevronUp className="w-4 h-4 text-theme-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-theme-text-muted" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-2 pl-4 border-l-2 border-theme-warning/30">
            <MortgageSection 
              inputs={inputs} 
              setInputs={setInputs} 
              currency={currency} 
              mortgageInputs={mortgageInputs}
              setMortgageInputs={setMortgageInputs}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Tip */}
      <p className="text-xs text-theme-text-muted">
        💡 Exit scenarios let you compare flip opportunities at different construction stages.
      </p>
    </div>
  );
};
