import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceDot } from "recharts";
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
  const holdingYears = inputs.holdingPeriodMonths / 12;
  
  // Generate smooth curve data points
  const generateCurveData = () => {
    const points = [];
    const totalYears = holdingYears + 4; // OI holding + SI holding (2 years) + buffer
    
    for (let i = 0; i <= 20; i++) {
      const year = (i / 20) * totalYears;
      let value = inputs.basePrice * Math.pow(1 + inputs.appreciationRate / 100, year);
      points.push({
        year: year.toFixed(1),
        value,
        displayYear: `Year ${year.toFixed(1)}`,
      });
    }
    return points;
  };

  const curveData = generateCurveData();

  const oiPoint = { year: 0, value: inputs.basePrice };
  const siPoint = { year: holdingYears, value: calculations.oi.propertyValue };
  const hoPoint = { year: holdingYears + 2, value: calculations.si.propertyValue };

  return (
    <div className="relative w-full h-[400px] bg-[#0d1117] rounded-2xl p-6 border border-[#2a3142]">
      <h3 className="text-lg font-semibold text-white mb-4">Investment Growth Timeline</h3>
      
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={curveData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#CCFF00" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="year" 
            stroke="#4a5568"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#2a3142' }}
          />
          <YAxis 
            stroke="#4a5568"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={formatAED}
            axisLine={{ stroke: '#2a3142' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#CCFF00"
            strokeWidth={3}
            fill="url(#growthGradient)"
          />
          <ReferenceDot x="0.0" y={oiPoint.value} r={8} fill="#CCFF00" stroke="#0d1117" strokeWidth={3} />
          <ReferenceDot x={holdingYears.toFixed(1)} y={siPoint.value} r={8} fill="#00EAFF" stroke="#0d1117" strokeWidth={3} />
          <ReferenceDot x={(holdingYears + 2).toFixed(1)} y={hoPoint.value} r={8} fill="#FF00FF" stroke="#0d1117" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Floating Labels */}
      <div className="absolute top-24 left-16 flex flex-col items-center">
        <div className="bg-[#CCFF00]/20 border border-[#CCFF00] rounded-lg p-2 backdrop-blur-sm">
          <Rocket className="w-5 h-5 text-[#CCFF00]" />
        </div>
        <span className="text-xs text-[#CCFF00] mt-1 font-semibold">OI Entry</span>
        <span className="text-xs text-gray-400">{formatAED(inputs.basePrice)}</span>
      </div>

      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="bg-[#00EAFF]/20 border border-[#00EAFF] rounded-lg p-2 backdrop-blur-sm">
          <Shield className="w-5 h-5 text-[#00EAFF]" />
        </div>
        <span className="text-xs text-[#00EAFF] mt-1 font-semibold">SI Entry</span>
        <span className="text-xs text-gray-400">{formatAED(calculations.oi.propertyValue)}</span>
      </div>

      <div className="absolute top-12 right-20 flex flex-col items-center">
        <div className="bg-[#FF00FF]/20 border border-[#FF00FF] rounded-lg p-2 backdrop-blur-sm">
          <Home className="w-5 h-5 text-[#FF00FF]" />
        </div>
        <span className="text-xs text-[#FF00FF] mt-1 font-semibold">HO Entry</span>
        <span className="text-xs text-gray-400">{formatAED(calculations.si.propertyValue)}</span>
      </div>
    </div>
  );
};
