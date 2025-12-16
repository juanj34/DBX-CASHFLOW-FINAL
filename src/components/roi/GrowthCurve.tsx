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

export const GrowthCurve = ({ calculations, inputs }: GrowthCurveProps) => {
  const holdingMonths = inputs.holdingPeriodMonths;
  
  // Calculate positions for the stepped curve (percentage based)
  const oiPosition = { x: 15, y: 80 };
  const siPosition = { x: 50, y: 45 };
  const hoPosition = { x: 85, y: 15 };

  // Control points for bezier curves (creates natural growth curve)
  const oi2siControl1 = { x: oiPosition.x + 15, y: oiPosition.y };
  const oi2siControl2 = { x: siPosition.x - 15, y: siPosition.y };
  
  const si2hoControl1 = { x: siPosition.x + 15, y: siPosition.y };
  const si2hoControl2 = { x: hoPosition.x - 15, y: hoPosition.y };

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
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Dashed extension line at start */}
        <line
          x1={oiPosition.x}
          y1={oiPosition.y}
          x2="0"
          y2={oiPosition.y + 5}
          stroke="#CCFF00"
          strokeWidth="0.5"
          strokeDasharray="2,2"
          opacity="0.5"
        />
        
        {/* OI to SI bezier curve */}
        <path
          d={`M ${oiPosition.x} ${oiPosition.y} C ${oi2siControl1.x} ${oi2siControl1.y}, ${oi2siControl2.x} ${oi2siControl2.y}, ${siPosition.x} ${siPosition.y}`}
          fill="none"
          stroke="#CCFF00"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        
        {/* SI to HO bezier curve */}
        <path
          d={`M ${siPosition.x} ${siPosition.y} C ${si2hoControl1.x} ${si2hoControl1.y}, ${si2hoControl2.x} ${si2hoControl2.y}, ${hoPosition.x} ${hoPosition.y}`}
          fill="none"
          stroke="#00EAFF"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        
        {/* Dashed extension line at end */}
        <line
          x1={hoPosition.x}
          y1={hoPosition.y}
          x2="100"
          y2={hoPosition.y - 3}
          stroke="#FF00FF"
          strokeWidth="0.5"
          strokeDasharray="2,2"
          opacity="0.5"
        />

        {/* Point markers */}
        <circle cx={oiPosition.x} cy={oiPosition.y} r="1.5" fill="#CCFF00" />
        <circle cx={siPosition.x} cy={siPosition.y} r="1.5" fill="#00EAFF" />
        <circle cx={hoPosition.x} cy={hoPosition.y} r="1.5" fill="#FF00FF" />
      </svg>

      {/* Holding period label */}
      <div 
        className="absolute text-xs text-[#CCFF00] font-medium"
        style={{ 
          left: '30%', 
          top: '55%' 
        }}
      >
        <span className="italic">{holdingMonths} MONTHS</span>
      </div>

      {/* OI Point Label */}
      <div 
        className="absolute flex flex-col items-center"
        style={{ left: `${oiPosition.x - 3}%`, top: `${oiPosition.y - 18}%` }}
      >
        <span className="text-xl font-bold text-[#CCFF00]">OI</span>
        <Rocket className="w-4 h-4 text-[#CCFF00] rotate-45" />
      </div>
      
      {/* OI Info Card - Bottom left */}
      <div 
        className="absolute bg-[#0d1117]/95 border border-[#CCFF00]/50 rounded-lg p-3 min-w-[130px]"
        style={{ left: '2%', bottom: '4%' }}
      >
        <div className="text-[10px] font-bold text-[#CCFF00] mb-2 tracking-wider">OPPORTUNITY</div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Entry:</span>
            <span className="text-white font-semibold">{formatAED(inputs.basePrice)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Equity:</span>
            <span className="text-white font-semibold">{formatAED(calculations.oi.equityInvested)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Threshold:</span>
            <span className="text-white font-semibold">{inputs.resaleThresholdPercent}%</span>
          </div>
        </div>
      </div>

      {/* SI Point Label */}
      <div 
        className="absolute flex flex-col items-center"
        style={{ left: `${siPosition.x - 3}%`, top: `${siPosition.y - 18}%` }}
      >
        <span className="text-xl font-bold text-[#00EAFF]">SI</span>
        <Shield className="w-4 h-4 text-[#00EAFF]" />
      </div>

      {/* SI Info Card - Center right of point */}
      <div 
        className="absolute bg-[#0d1117]/95 border border-[#00EAFF]/50 rounded-lg p-3 min-w-[130px]"
        style={{ left: '55%', top: '32%' }}
      >
        <div className="text-[10px] font-bold text-[#00EAFF] mb-2 tracking-wider">SECURITY</div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Value:</span>
            <span className="text-white font-semibold">{formatAED(calculations.oi.propertyValue)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">OI Profit:</span>
            <span className="text-[#CCFF00] font-semibold">+{formatAED(calculations.oi.projectedProfit)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">OI ROE:</span>
            <span className="text-[#CCFF00] font-semibold">{calculations.oi.roe.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* HO Point Label */}
      <div 
        className="absolute flex flex-col items-center"
        style={{ left: `${hoPosition.x - 3}%`, top: `${hoPosition.y - 18}%` }}
      >
        <span className="text-xl font-bold text-[#FF00FF]">HO</span>
        <Home className="w-4 h-4 text-[#FF00FF]" />
      </div>

      {/* HO Info Card - Top right */}
      <div 
        className="absolute bg-[#0d1117]/95 border border-[#FF00FF]/50 rounded-lg p-3 min-w-[130px]"
        style={{ right: '2%', top: '4%' }}
      >
        <div className="text-[10px] font-bold text-[#FF00FF] mb-2 tracking-wider">HOME OWNER</div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Value:</span>
            <span className="text-white font-semibold">{formatAED(calculations.ho.propertyValue)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Yield:</span>
            <span className="text-white font-semibold">{calculations.ho.rentalYield.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Payback:</span>
            <span className="text-white font-semibold">{calculations.ho.yearsToPay.toFixed(1)} yrs</span>
          </div>
        </div>
      </div>
    </div>
  );
};
