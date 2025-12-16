import { Rocket, Shield, Home } from "lucide-react";
import { ROICalculations, ROIInputs } from "./useROICalculations";
import { Currency, formatCurrencyShort } from "./currencyUtils";

interface GrowthCurveProps {
  calculations: ROICalculations;
  inputs: ROIInputs;
  currency: Currency;
}

export const GrowthCurve = ({ calculations, inputs, currency }: GrowthCurveProps) => {
  const oiHoldingMonths = calculations.oiHoldingMonths;
  
  // Adjusted positions to keep everything inside the graph
  const oiPosition = { x: 12, y: 75 };
  const siPosition = { x: 50, y: 50 };
  const hoPosition = { x: 88, y: 25 };

  // Control points for bezier curves
  const oi2siControl1 = { x: oiPosition.x + 15, y: oiPosition.y };
  const oi2siControl2 = { x: siPosition.x - 15, y: siPosition.y };
  
  const si2hoControl1 = { x: siPosition.x + 15, y: siPosition.y };
  const si2hoControl2 = { x: hoPosition.x - 15, y: hoPosition.y };

  // Calculate years for labels
  const oiYear = inputs.bookingYear;
  const siYear = inputs.bookingYear + Math.ceil(inputs.oiHoldingMonths / 12);
  const hoYear = inputs.handoverYear;

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
          left: '28%', 
          top: '58%' 
        }}
      >
        <span className="italic">{oiHoldingMonths} MONTHS</span>
      </div>

      {/* OI Point Label */}
      <div 
        className="absolute flex flex-col items-center"
        style={{ left: '8%', top: '52%' }}
      >
        <span className="text-xl font-bold text-[#CCFF00]">OI</span>
        <Rocket className="w-4 h-4 text-[#CCFF00] rotate-45" />
      </div>
      
      {/* OI Info Card - Bottom left */}
      <div 
        className="absolute bg-[#0d1117]/95 border border-[#CCFF00]/50 rounded-lg p-3 min-w-[120px]"
        style={{ left: '2%', bottom: '8%' }}
      >
        <div className="text-[10px] font-bold text-[#CCFF00] mb-2 tracking-wider">OPPORTUNITY</div>
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Entry:</span>
            <span className="text-white font-semibold">{formatCurrencyShort(calculations.oi.entryPrice, currency)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Exit:</span>
            <span className="text-white font-semibold">{formatCurrencyShort(calculations.oi.exitPrice, currency)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Profit:</span>
            <span className="text-[#CCFF00] font-semibold">+{formatCurrencyShort(calculations.oi.projectedProfit, currency)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">ROE:</span>
            <span className="text-[#CCFF00] font-semibold">{calculations.oi.roe.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* SI Point Label */}
      <div 
        className="absolute flex flex-col items-center"
        style={{ left: '46%', top: '32%' }}
      >
        <span className="text-xl font-bold text-[#00EAFF]">SI</span>
        <Shield className="w-4 h-4 text-[#00EAFF]" />
        <span className="text-[10px] text-gray-400 mt-1">{siYear}</span>
      </div>

      {/* SI Info Card - Right of SI point */}
      <div 
        className="absolute bg-[#0d1117]/95 border border-[#00EAFF]/50 rounded-lg p-3 min-w-[120px]"
        style={{ left: '54%', top: '38%' }}
      >
        <div className="text-[10px] font-bold text-[#00EAFF] mb-2 tracking-wider">SECURITY</div>
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Entry:</span>
            <span className="text-white font-semibold">{formatCurrencyShort(calculations.si.entryPrice, currency)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Exit:</span>
            <span className="text-white font-semibold">{formatCurrencyShort(calculations.si.exitPrice, currency)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Profit:</span>
            <span className="text-[#00EAFF] font-semibold">+{formatCurrencyShort(calculations.si.projectedProfit, currency)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">ROE:</span>
            <span className="text-[#00EAFF] font-semibold">{calculations.si.roe.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* HO Point Label - Moved up to be visible */}
      <div 
        className="absolute flex flex-col items-center"
        style={{ right: '16%', top: '4%' }}
      >
        <span className="text-xl font-bold text-[#FF00FF]">HO</span>
        <Home className="w-4 h-4 text-[#FF00FF]" />
        <span className="text-[10px] text-gray-400 mt-1">{hoYear}</span>
      </div>

      {/* HO Info Card - Below HO point */}
      <div 
        className="absolute bg-[#0d1117]/95 border border-[#FF00FF]/50 rounded-lg p-3 min-w-[120px]"
        style={{ right: '2%', top: '18%' }}
      >
        <div className="text-[10px] font-bold text-[#FF00FF] mb-2 tracking-wider">HOME OWNER</div>
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between gap-3">
            <span className="text-gray-400">Entry:</span>
            <span className="text-white font-semibold">{formatCurrencyShort(calculations.ho.entryPrice, currency)}</span>
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
