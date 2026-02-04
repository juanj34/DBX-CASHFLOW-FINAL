import { useState, useEffect } from "react";
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
  // Auto-expand mortgage if enabled
  const [mortgageOpen, setMortgageOpen] = useState(mortgageInputs.enabled);

  // Keep mortgage section open when enabled
  useEffect(() => {
    if (mortgageInputs.enabled && !mortgageOpen) {
      setMortgageOpen(true);
    }
  }, [mortgageInputs.enabled]);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-semibold text-theme-text">Exit & Financing</h3>
        <p className="text-sm text-theme-text-muted">Exit scenarios and mortgage calculator</p>
      </div>

      {/* Exit Scenarios - Collapsible */}
      <div className="p-3 bg-theme-bg/50 rounded-lg">
        <Collapsible open={exitsOpen} onOpenChange={setExitsOpen}>
          <CollapsibleTrigger className="w-full flex items-center justify-between py-1 hover:opacity-80 transition-opacity">
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
            <div className="pt-3 border-t border-theme-border/20 mt-2">
              <ExitsSection inputs={inputs} setInputs={setInputs} currency={currency} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Mortgage Calculator - Collapsible with accent when enabled */}
      <div className={cn(
        "p-3 rounded-lg transition-all",
        mortgageInputs.enabled 
          ? "bg-amber-500/10 border border-amber-500/30" 
          : "bg-theme-bg/50"
      )}>
        <Collapsible open={mortgageOpen} onOpenChange={setMortgageOpen}>
          <CollapsibleTrigger className="w-full flex items-center justify-between py-1 hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2">
              <Landmark className={cn(
                "w-4 h-4",
                mortgageInputs.enabled ? "text-amber-400" : "text-theme-warning"
              )} />
              <div className="text-left">
                <span className="text-sm font-medium text-theme-text">Mortgage Calculator</span>
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded ml-2",
                  mortgageInputs.enabled 
                    ? "bg-amber-500/30 text-amber-300" 
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
            <div className="pt-3 border-t border-theme-border/20 mt-2">
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
      </div>

      {/* Tip */}
      <p className="text-xs text-theme-text-muted">
        💡 Exit scenarios let you compare flip opportunities at different construction stages.
      </p>
    </div>
  );
};
