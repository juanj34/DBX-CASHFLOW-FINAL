import { ConfiguratorSectionProps } from "./types";
import { ValueDifferentiatorsSection } from "../ValueDifferentiatorsSection";
import { calculateAppreciationBonus, APPRECIATION_BONUS_CAP } from "../valueDifferentiators";
import { useCustomDifferentiators } from "@/hooks/useCustomDifferentiators";

export const ValueSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const { customDifferentiators } = useCustomDifferentiators();
  const selectedIds = inputs.valueDifferentiators || [];
  const appreciationBonus = calculateAppreciationBonus(selectedIds, customDifferentiators);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Value Differentiators</h3>
        <p className="text-sm text-theme-text-muted">Identify unique property features that can boost appreciation</p>
      </div>

      {/* Appreciation Bonus Summary */}
      {appreciationBonus > 0 && (
        <div className="p-4 bg-gradient-to-r from-theme-accent/20 to-transparent rounded-xl border border-theme-accent/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-theme-accent">Total Appreciation Bonus</div>
              <div className="text-xs text-theme-text-muted mt-0.5">
                Applied to all appreciation phases
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-theme-accent">
                +{appreciationBonus.toFixed(1)}%
              </div>
              <div className="text-xs text-theme-text-muted">
                max {APPRECIATION_BONUS_CAP}%
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-theme-bg-alt rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-theme-accent to-theme-accent/70 transition-all duration-300"
              style={{ width: `${Math.min(100, (appreciationBonus / APPRECIATION_BONUS_CAP) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Differentiators Grid */}
      <div className="p-4 bg-theme-card rounded-xl border border-theme-border">
        <p className="text-sm text-theme-text-muted mb-4">Select factors that add value and impact appreciation rates</p>
        <ValueDifferentiatorsSection
          selectedDifferentiators={selectedIds}
          onSelectionChange={(ids) => setInputs(prev => ({ ...prev, valueDifferentiators: ids }))}
          hideHeader
        />
      </div>

      {/* Info about impact */}
      <div className="text-xs text-theme-text-muted px-1">
        <p>✨ <span className="text-theme-accent">Value Drivers</span> add to your appreciation rate. Features are tracked but don't impact calculations.</p>
      </div>
    </div>
  );
};
