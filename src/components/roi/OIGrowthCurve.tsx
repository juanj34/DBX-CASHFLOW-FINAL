import { Rocket, Target } from "lucide-react";
import { OICalculations, OIInputs } from "./useOICalculations";
import { Currency, formatCurrencyShort } from "./currencyUtils";

interface OIGrowthCurveProps {
  calculations: OICalculations;
  inputs: OIInputs;
  currency: Currency;
}

export const OIGrowthCurve = ({ calculations, inputs, currency }: OIGrowthCurveProps) => {
  const { scenarios, basePrice, totalMonths } = calculations;
  
  // Get the handover scenario for max values
  const maxScenario = scenarios[scenarios.length - 1];
  const maxValue = maxScenario.exitPrice * 1.1; // Add 10% padding

  // Find the best ROE scenario
  const bestROEScenario = scenarios.reduce((best, current) => 
    current.trueROE > best.trueROE ? current : best, scenarios[0]);

  // SVG dimensions
  const width = 700;
  const height = 300;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions - now based on months
  const xScale = (months: number) => padding.left + (months / totalMonths) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - basePrice * 0.9) / (maxValue - basePrice * 0.9)) * chartHeight;

  // Generate curve path
  const generateCurvePath = () => {
    const points: { x: number; y: number }[] = [
      { x: 0, y: basePrice }, // Starting point
      ...scenarios.map(s => ({ x: s.exitMonths, y: s.exitPrice }))
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

  // X-axis time labels
  const timeLabels = [0, Math.round(totalMonths * 0.25), Math.round(totalMonths * 0.5), Math.round(totalMonths * 0.75), totalMonths];

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
            <h3 className="font-semibold text-white">Price Appreciation Over Time</h3>
            <p className="text-xs text-gray-400">Exit value at different time points</p>
          </div>
        </div>

        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="mt-4">
          {/* Grid lines */}
          {timeLabels.map(months => (
            <line
              key={`grid-v-${months}`}
              x1={xScale(months)}
              y1={padding.top}
              x2={xScale(months)}
              y2={height - padding.bottom}
              stroke="#2a3142"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}

          {/* X-axis labels */}
          {timeLabels.map(months => (
            <text
              key={`label-${months}`}
              x={xScale(months)}
              y={height - padding.bottom + 20}
              fill="#6b7280"
              fontSize="12"
              textAnchor="middle"
            >
              {months}mo
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
            Months from Booking
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
          {scenarios.map((scenario, index) => {
            const isBestROE = scenario.exitMonths === bestROEScenario.exitMonths;
            
            return (
              <g key={scenario.exitMonths}>
                {/* Best ROE special marker */}
                {isBestROE && (
                  <>
                    {/* Outer glow ring */}
                    <circle
                      cx={xScale(scenario.exitMonths)}
                      cy={yScale(scenario.exitPrice)}
                      r="16"
                      fill="none"
                      stroke="#FFD700"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                    {/* Pulsing animation ring */}
                    <circle
                      cx={xScale(scenario.exitMonths)}
                      cy={yScale(scenario.exitPrice)}
                      r="20"
                      fill="none"
                      stroke="#FFD700"
                      strokeWidth="1"
                      opacity="0.3"
                    >
                      <animate attributeName="r" values="16;24;16" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
                
                {/* Point circle */}
                <circle
                  cx={xScale(scenario.exitMonths)}
                  cy={yScale(scenario.exitPrice)}
                  r={isBestROE ? 10 : 8}
                  fill="#0f172a"
                  stroke={isBestROE ? "#FFD700" : "#CCFF00"}
                  strokeWidth={isBestROE ? 3 : 2}
                />
                <circle
                  cx={xScale(scenario.exitMonths)}
                  cy={yScale(scenario.exitPrice)}
                  r={isBestROE ? 5 : 4}
                  fill={isBestROE ? "#FFD700" : "#CCFF00"}
                />

                {/* Best ROE badge */}
                {isBestROE && (
                  <g transform={`translate(${xScale(scenario.exitMonths) + 15}, ${yScale(scenario.exitPrice) - 25})`}>
                    <rect
                      x="-45"
                      y="-12"
                      width="90"
                      height="24"
                      rx="12"
                      fill="#FFD700"
                    />
                    <text
                      x="0"
                      y="4"
                      fill="#0f172a"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      🎯 BEST ROE
                    </text>
                  </g>
                )}

                {/* Value label - alternate above/below */}
                <text
                  x={xScale(scenario.exitMonths)}
                  y={yScale(scenario.exitPrice) + (isBestROE ? 45 : (index % 2 === 0 ? -18 : 25))}
                  fill={isBestROE ? "#FFD700" : "#CCFF00"}
                  fontSize={isBestROE ? 12 : 11}
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {formatCurrencyShort(scenario.exitPrice, currency)}
                </text>

                {/* ROE label */}
                <text
                  x={xScale(scenario.exitMonths)}
                  y={yScale(scenario.exitPrice) + (isBestROE ? 58 : (index % 2 === 0 ? -5 : 38))}
                  fill={isBestROE ? "#FFD700" : "#9ca3af"}
                  fontSize={isBestROE ? 11 : 9}
                  fontWeight={isBestROE ? "bold" : "normal"}
                  textAnchor="middle"
                >
                  ROE: {scenario.trueROE.toFixed(0)}%
                </text>
              </g>
            );
          })}

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
