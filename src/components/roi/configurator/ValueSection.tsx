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
        <p className="text-sm text-gray-500">Select factors that add value and impact appreciation rates</p>
      </div>

      {/* Appreciation Bonus Summary */}
      {appreciationBonus > 0 && (
        <div className="p-4 bg-gradient-to-r from-[#CCFF00]/20 to-transparent rounded-xl border border-[#CCFF00]/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#CCFF00]">Total Appreciation Bonus</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Applied to all appreciation phases
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-[#CCFF00]">
                +{appreciationBonus.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                max {APPRECIATION_BONUS_CAP}%
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-[#0d1117] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#CCFF00] to-[#88cc00] transition-all duration-300"
              style={{ width: `${Math.min(100, (appreciationBonus / APPRECIATION_BONUS_CAP) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Differentiators Grid */}
      <div className="p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
        <ValueDifferentiatorsSection
          selectedDifferentiators={selectedIds}
          onSelectionChange={(ids) => setInputs(prev => ({ ...prev, valueDifferentiators: ids }))}
        />
      </div>

      {/* Info about impact */}
      <div className="text-xs text-gray-500 px-1">
        <p>✨ <span className="text-[#CCFF00]">Value Drivers</span> add to your appreciation rate. Features are tracked but don't impact calculations.</p>
      </div>
    </div>
  );
};
