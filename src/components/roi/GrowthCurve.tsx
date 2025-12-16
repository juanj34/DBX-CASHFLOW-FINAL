import { Rocket, Shield, Home } from "lucide-react";
import { ROICalculations, ROIInputs } from "./useROICalculations";

interface GrowthCurveProps {
  calculations: ROICalculations;
  inputs: ROIInputs;
}

const formatAED = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  return `${(value / 1000).toFixed(0)}K`;
};

const formatROE = (value: number) => {
  return `${value.toFixed(0)}%`;
};

export const GrowthCurve = ({ calculations, inputs }: GrowthCurveProps) => {
  const holdingMonths = inputs.holdingPeriodMonths;
  
  // Calculate positions for the stepped curve (percentage based)
  const oiPosition = { x: 10, y: 85 };
  const siPosition = { x: 45, y: 50 };
  const hoPosition = { x: 80, y: 15 };

  return (
    <div className="relative w-full h-[450px] bg-[#0d1117] rounded-2xl border border-[#2a3142] overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2a3142" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* SVG for the curve lines */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {/* OI to SI line */}
        <line
          x1={`${oiPosition.x}%`}
          y1={`${oiPosition.y}%`}
          x2={`${siPosition.x}%`}
          y2={`${siPosition.y}%`}
          stroke="#CCFF00"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* SI to HO line */}
        <line
          x1={`${siPosition.x}%`}
          y1={`${siPosition.y}%`}
          x2={`${hoPosition.x}%`}
          y2={`${hoPosition.y}%`}
          stroke="#00EAFF"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Dashed extension lines */}
        <line
          x1={`${oiPosition.x}%`}
          y1={`${oiPosition.y}%`}
          x2="0%"
          y2={`${oiPosition.y + 5}%`}
          stroke="#CCFF00"
          strokeWidth="2"
          strokeDasharray="4,4"
          opacity="0.5"
        />
        <line
          x1={`${hoPosition.x}%`}
          y1={`${hoPosition.y}%`}
          x2="100%"
          y2={`${hoPosition.y - 5}%`}
          stroke="#FF00FF"
          strokeWidth="2"
          strokeDasharray="4,4"
          opacity="0.5"
        />
      </svg>

      {/* Holding period label */}
      <div 
        className="absolute text-xs text-[#CCFF00] font-medium"
        style={{ 
          left: `${(oiPosition.x + siPosition.x) / 2 - 5}%`, 
          top: `${(oiPosition.y + siPosition.y) / 2 + 5}%` 
        }}
      >
        <span className="italic">{holdingMonths} MONTHS</span>
      </div>

      {/* OI Point and Card */}
      <div 
        className="absolute flex items-end gap-2"
        style={{ left: `${oiPosition.x - 2}%`, top: `${oiPosition.y - 8}%` }}
      >
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-[#CCFF00]">OI</span>
          <Rocket className="w-5 h-5 text-[#CCFF00] rotate-45" />
        </div>
      </div>
      
      {/* OI Info Card */}
      <div 
        className="absolute bg-[#0d1117]/90 border border-[#CCFF00] rounded-lg p-3 min-w-[140px]"
        style={{ left: '2%', bottom: '5%' }}
      >
        <div className="text-xs font-bold text-[#CCFF00] mb-2 tracking-wider">OPPORTUNITY</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Value:</span>
            <span className="text-white font-semibold">{formatAED(inputs.basePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Deployed:</span>
            <span className="text-white font-semibold">{formatAED(calculations.oi.equityInvested)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Payment Plan:</span>
            <span className="text-white font-semibold">{inputs.equityPercent}/{100 - inputs.equityPercent}</span>
          </div>
        </div>
      </div>

      {/* SI Point */}
      <div 
        className="absolute flex flex-col items-center"
        style={{ left: `${siPosition.x - 2}%`, top: `${siPosition.y - 12}%` }}
      >
        <span className="text-2xl font-bold text-[#00EAFF]">SI</span>
        <Shield className="w-5 h-5 text-[#00EAFF]" />
      </div>

      {/* SI Info Card */}
      <div 
        className="absolute bg-[#0d1117]/90 border border-[#00EAFF] rounded-lg p-3 min-w-[140px]"
        style={{ left: `${siPosition.x + 3}%`, top: `${siPosition.y - 5}%` }}
      >
        <div className="text-xs font-bold text-[#00EAFF] mb-2 tracking-wider">SECURITY</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Value:</span>
            <span className="text-white font-semibold">{formatAED(calculations.si.propertyValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Profit:</span>
            <span className="text-white font-semibold">{formatAED(calculations.oi.projectedProfit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">ROE:</span>
            <span className="text-white font-semibold">{formatROE(calculations.oi.roe)}</span>
          </div>
        </div>
      </div>

      {/* HO Point */}
      <div 
        className="absolute flex flex-col items-center"
        style={{ left: `${hoPosition.x - 2}%`, top: `${hoPosition.y - 12}%` }}
      >
        <span className="text-2xl font-bold text-[#FF00FF]">HO</span>
        <Home className="w-5 h-5 text-[#FF00FF]" />
      </div>

      {/* HO Info Card */}
      <div 
        className="absolute bg-[#0d1117]/90 border border-[#FF00FF] rounded-lg p-3 min-w-[140px]"
        style={{ left: `${hoPosition.x + 3}%`, top: `${hoPosition.y - 5}%` }}
      >
        <div className="text-xs font-bold text-[#FF00FF] mb-2 tracking-wider">HOME OWNER</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Value:</span>
            <span className="text-white font-semibold">{formatAED(calculations.ho.propertyValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Profit:</span>
            <span className="text-white font-semibold">{formatAED(calculations.si.projectedProfit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">ROE:</span>
            <span className="text-white font-semibold">{formatROE(calculations.si.roe)}</span>
          </div>
        </div>
      </div>

      {/* Target ROE label */}
      <div className="absolute top-4 left-1/3 text-sm text-gray-400">
        Target ROE <span className="text-white font-semibold">20%</span>
      </div>
    </div>
  );
};
