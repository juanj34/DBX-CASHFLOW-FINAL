import { Rocket } from "lucide-react";
import { OICalculations, OIInputs } from "./useOICalculations";
import { Currency, formatCurrencyShort } from "./currencyUtils";

interface OIGrowthCurveProps {
  calculations: OICalculations;
  inputs: OIInputs;
  currency: Currency;
}

export const OIGrowthCurve = ({ calculations, inputs, currency }: OIGrowthCurveProps) => {
  const { scenarios, basePrice } = calculations;
  
  // Get the 100% exit scenario for max values
  const maxScenario = scenarios[scenarios.length - 1];
  const maxValue = maxScenario.exitPrice * 1.1; // Add 10% padding

  // SVG dimensions
  const width = 700;
  const height = 300;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (percent: number) => padding.left + (percent / 100) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - basePrice * 0.9) / (maxValue - basePrice * 0.9)) * chartHeight;

  // Generate curve path
  const generateCurvePath = () => {
    const points: { x: number; y: number }[] = [
      { x: 0, y: basePrice }, // Starting point
      ...scenarios.map(s => ({ x: s.exitPercent, y: s.exitPrice }))
    ];
    
    // Create smooth bezier curve
    let path = `M ${xScale(points[0].x)} ${yScale(points[0].y)}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = xScale(prev.x + (curr.x - prev.x) * 0.5);
      const cpy1 = yScale(prev.y);
      const cpx2 = xScale(prev.x + (curr.x - prev.x) * 0.5);
      const cpy2 = yScale(curr.y);
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${xScale(curr.x)} ${yScale(curr.y)}`;
    }
    
    return path;
  };

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-6 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{ 
          backgroundImage: 'linear-gradient(to right, #CCFF00 1px, transparent 1px), linear-gradient(to bottom, #CCFF00 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#CCFF00]/20 rounded-xl">
            <Rocket className="w-5 h-5 text-[#CCFF00]" />
          </div>
          <div>
            <h3 className="font-semibold text-white">OI Price Appreciation</h3>
            <p className="text-xs text-gray-400">Exit value at different construction stages</p>
          </div>
        </div>

        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="mt-4">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percent => (
            <line
              key={`grid-v-${percent}`}
              x1={xScale(percent)}
              y1={padding.top}
              x2={xScale(percent)}
              y2={height - padding.bottom}
              stroke="#2a3142"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}

          {/* X-axis labels */}
          {[0, 25, 50, 75, 100].map(percent => (
            <text
              key={`label-${percent}`}
              x={xScale(percent)}
              y={height - padding.bottom + 20}
              fill="#6b7280"
              fontSize="12"
              textAnchor="middle"
            >
              {percent}%
            </text>
          ))}

          {/* X-axis title */}
          <text
            x={width / 2}
            y={height - 10}
            fill="#9ca3af"
            fontSize="12"
            textAnchor="middle"
          >
            Construction Progress
          </text>

          {/* Base price line */}
          <line
            x1={padding.left}
            y1={yScale(basePrice)}
            x2={width - padding.right}
            y2={yScale(basePrice)}
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          <text
            x={padding.left - 10}
            y={yScale(basePrice)}
            fill="#6b7280"
            fontSize="10"
            textAnchor="end"
            dominantBaseline="middle"
          >
            Base: {formatCurrencyShort(basePrice, currency)}
          </text>

          {/* Growth curve */}
          <path
            d={generateCurvePath()}
            fill="none"
            stroke="#CCFF00"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Glow effect */}
          <path
            d={generateCurvePath()}
            fill="none"
            stroke="#CCFF00"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.2"
          />

          {/* Exit point markers */}
          {scenarios.map((scenario, index) => (
            <g key={scenario.exitPercent}>
              {/* Point circle */}
              <circle
                cx={xScale(scenario.exitPercent)}
                cy={yScale(scenario.exitPrice)}
                r="8"
                fill="#0f172a"
                stroke="#CCFF00"
                strokeWidth="2"
              />
              <circle
                cx={xScale(scenario.exitPercent)}
                cy={yScale(scenario.exitPrice)}
                r="4"
                fill="#CCFF00"
              />

              {/* Value label - alternate above/below */}
              <text
                x={xScale(scenario.exitPercent)}
                y={yScale(scenario.exitPrice) + (index % 2 === 0 ? -18 : 25)}
                fill="#CCFF00"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {formatCurrencyShort(scenario.exitPrice, currency)}
              </text>

              {/* ROE label */}
              <text
                x={xScale(scenario.exitPercent)}
                y={yScale(scenario.exitPrice) + (index % 2 === 0 ? -5 : 38)}
                fill="#9ca3af"
                fontSize="9"
                textAnchor="middle"
              >
                ROE: {scenario.roe.toFixed(0)}%
              </text>
            </g>
          ))}

          {/* Starting point */}
          <circle
            cx={xScale(0)}
            cy={yScale(basePrice)}
            r="6"
            fill="#CCFF00"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  );
};
