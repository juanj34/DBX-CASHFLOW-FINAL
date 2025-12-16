import { ROICalculations, ROIInputs } from "./useROICalculations";
import { TrendingUp, Clock } from "lucide-react";

interface MetricsPanelProps {
  calculations: ROICalculations;
  inputs: ROIInputs;
}

export const MetricsPanel = ({ calculations, inputs }: MetricsPanelProps) => {
  return (
    <div className="space-y-6">
      {/* Rental Yields Comparison */}
      <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#00EAFF]" />
          <h3 className="font-semibold text-white">Rental Yield Comparison</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">OI (Entry)</span>
            <div className="flex items-center gap-2">
              <div className="h-2 bg-[#CCFF00] rounded-full" style={{ width: `${calculations.oi.rentalYield * 10}px` }} />
              <span className="text-[#CCFF00] font-mono font-semibold">{calculations.oi.rentalYield.toFixed(2)}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">SI (Entry)</span>
            <div className="flex items-center gap-2">
              <div className="h-2 bg-[#00EAFF] rounded-full" style={{ width: `${calculations.si.rentalYield * 10}px` }} />
              <span className="text-[#00EAFF] font-mono font-semibold">{calculations.si.rentalYield.toFixed(2)}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">HO (Entry)</span>
            <div className="flex items-center gap-2">
              <div className="h-2 bg-[#FF00FF] rounded-full" style={{ width: `${calculations.ho.rentalYield * 10}px` }} />
              <span className="text-[#FF00FF] font-mono font-semibold">{calculations.ho.rentalYield.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Summary */}
      <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-[#FF00FF]" />
          <h3 className="font-semibold text-white">Investment Timeline</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-[#0d1117] rounded-xl">
            <span className="text-gray-400 text-sm">OI Holding Period</span>
            <span className="text-white font-mono font-semibold">{calculations.holdingPeriodMonths} months</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-[#0d1117] rounded-xl">
            <span className="text-gray-400 text-sm">SI Holding Period</span>
            <span className="text-white font-mono font-semibold">{inputs.siHoldingMonths} months</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-[#0d1117] rounded-xl">
            <span className="text-gray-400 text-sm">Appreciation Rate</span>
            <span className="text-[#CCFF00] font-mono font-semibold">{inputs.appreciationRate}% CAGR</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-[#0d1117] rounded-xl">
            <span className="text-gray-400 text-sm">Total Value Growth</span>
            <span className="text-[#CCFF00] font-mono font-semibold">
              +{(((calculations.ho.propertyValue - inputs.basePrice) / inputs.basePrice) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
