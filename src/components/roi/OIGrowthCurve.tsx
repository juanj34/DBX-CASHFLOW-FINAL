import { TrendingUp } from "lucide-react";
import { OICalculations, OIInputs } from "./useOICalculations";
import { Currency, formatCurrencyShort } from "./currencyUtils";
import { calculatePhasedExitPrice, calculateEquityAtExit } from "./ExitScenariosCards";
import { useState, useEffect, useMemo } from "react";

interface OIGrowthCurveProps {
  calculations: OICalculations;
  inputs: OIInputs;
  currency: Currency;
  exitScenarios: number[];
  rate: number;
  highlightedExit?: number | null;
  onExitHover?: (index: number | null) => void;
}

export const OIGrowthCurve = ({ 
  calculations, 
  inputs, 
  currency, 
  exitScenarios, 
  rate,
  highlightedExit,
  onExitHover 
}: OIGrowthCurveProps) => {
  const { basePrice, totalMonths, totalEntryCosts } = calculations;
  
  // Animation states
  const [isAnimated, setIsAnimated] = useState(false);
  const [showMarkers, setShowMarkers] = useState(false);
  
  // Trigger animations on mount
  useEffect(() => {
    const curveTimer = setTimeout(() => setIsAnimated(true), 100);
    const markerTimer = setTimeout(() => setShowMarkers(true), 600);
    return () => {
      clearTimeout(curveTimer);
      clearTimeout(markerTimer);
    };
  }, []);
  
  // Calculate handover price using the SAME function as exit scenario cards
  const handoverPrice = calculatePhasedExitPrice(totalMonths, inputs, totalMonths, basePrice);
  const maxValue = handoverPrice * 1.08;

  // Calculate appreciation percentages
  const constructionAppreciation = ((handoverPrice - basePrice) / basePrice) * 100;

  // Compact SVG dimensions
  const width = 700;
  const height = 160;
  const padding = { top: 25, right: 40, bottom: 30, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (months: number) => padding.left + (months / totalMonths) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - basePrice * 0.95) / (maxValue - basePrice * 0.95)) * chartHeight;
  
  // Calculate approximate path length for animation
  const pathLength = useMemo(() => chartWidth * 1.5, [chartWidth]);

  // Generate S-curve path - faster appreciation early, slows down later
  const generateCurvePath = () => {
    const points: { x: number; y: number }[] = [];
    const totalAppreciation = handoverPrice - basePrice;
    
    // S-curve function: fast at start, slows down
    // Using logarithmic-style curve
    const sCurve = (t: number) => {
      // t is 0 to 1, returns 0 to 1 with S-curve shape
      // More aggressive early growth: 1 - (1-t)^2.5
      return 1 - Math.pow(1 - t, 2.5);
    };
    
    // Start at base price
    points.push({ x: 0, y: basePrice });
    
    // Generate points for smooth curve
    for (let month = 2; month <= totalMonths; month += 2) {
      const progress = month / totalMonths;
      const curveProgress = sCurve(progress);
      const price = basePrice + (totalAppreciation * curveProgress);
      points.push({ x: month, y: price });
    }
    
    // Ensure last point is exactly at handover
    if (points[points.length - 1].x !== totalMonths) {
      points.push({ x: totalMonths, y: handoverPrice });
    }
    
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

  // X-axis time labels - fewer for compact view
  const timeLabels = [0, Math.round(totalMonths * 0.5), totalMonths];

  // Calculate exit scenario data
  const getExitScenarioData = (exitMonth: number) => {
    const totalAppreciation = handoverPrice - basePrice;
    const progress = exitMonth / totalMonths;
    const curveProgress = 1 - Math.pow(1 - progress, 2.5);
    const exitPrice = basePrice + (totalAppreciation * curveProgress);
    
    const equityDeployed = calculateEquityAtExit(exitMonth, inputs, totalMonths, basePrice);
    const profit = exitPrice - basePrice;
    const trueProfit = profit - calculations.totalEntryCosts;
    const totalCapital = equityDeployed + calculations.totalEntryCosts;
    
    const agentCommission = inputs.exitAgentCommissionEnabled ? exitPrice * 0.02 : 0;
    const nocFee = inputs.exitNocFee || 0;
    const exitCosts = agentCommission + nocFee;
    const netProfit = trueProfit - exitCosts;
    
    const trueROE = totalCapital > 0 ? (trueProfit / totalCapital) * 100 : 0;
    const netROE = totalCapital > 0 ? (netProfit / totalCapital) * 100 : 0;
    const displayROE = exitCosts > 0 ? netROE : trueROE;
    const appreciation = ((exitPrice - basePrice) / basePrice) * 100;
    
    return {
      exitMonths: exitMonth,
      exitPrice,
      equityDeployed,
      profit,
      trueROE: displayROE,
      totalCapitalDeployed: totalCapital,
      appreciation
    };
  };

  const exitMarkersData = exitScenarios.map((month, index) => ({
    scenario: getExitScenarioData(month),
    label: `Exit ${index + 1}`,
  }));

  // Handover calculation with S-curve
  const handoverScenario = {
    exitMonths: totalMonths,
    exitPrice: handoverPrice,
    equityDeployed: calculateEquityAtExit(totalMonths, inputs, totalMonths, basePrice),
    profit: handoverPrice - basePrice,
    trueROE: ((handoverPrice - basePrice - totalEntryCosts) / (calculateEquityAtExit(totalMonths, inputs, totalMonths, basePrice) + totalEntryCosts)) * 100
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 relative overflow-hidden h-full">
      <div className="relative h-full flex flex-col">
        {/* Compact header */}
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-[#CCFF00]" />
          <span className="text-xs font-medium text-slate-400">Price Growth</span>
          <span className="text-xs text-[#CCFF00] font-mono ml-auto">+{constructionAppreciation.toFixed(0)}%</span>
        </div>

        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="flex-1" preserveAspectRatio="xMidYMid meet">
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="curveGradientCompact" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CCFF00" />
              <stop offset="100%" stopColor="#22d3d1" />
            </linearGradient>
            
            <linearGradient id="areaGradientCompact" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#CCFF00" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Simple grid lines */}
          {timeLabels.map(months => (
            <line
              key={`grid-v-${months}`}
              x1={xScale(months)}
              y1={padding.top}
              x2={xScale(months)}
              y2={height - padding.bottom}
              stroke="hsl(var(--theme-border))"
              strokeWidth="1"
              strokeDasharray="2,4"
              opacity="0.3"
            />
          ))}

          {/* X-axis labels */}
          {timeLabels.map(months => (
            <text
              key={`label-${months}`}
              x={xScale(months)}
              y={height - 8}
              fill="hsl(var(--theme-text-muted))"
              fontSize="9"
              textAnchor="middle"
            >
              {months}mo
            </text>
          ))}

          {/* Base price dashed line */}
          <line
            x1={padding.left}
            y1={yScale(basePrice)}
            x2={width - padding.right}
            y2={yScale(basePrice)}
            stroke="#64748b"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.4"
          />

          {/* Area fill under curve */}
          <path
            d={`${generateCurvePath()} L ${xScale(totalMonths)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`}
            fill="url(#areaGradientCompact)"
            style={{
              opacity: isAnimated ? 1 : 0,
              transition: 'opacity 0.6s ease-out 0.3s'
            }}
          />

          {/* Growth curve */}
          <path
            d={generateCurvePath()}
            fill="none"
            stroke="url(#curveGradientCompact)"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: isAnimated ? 0 : pathLength,
              transition: 'stroke-dashoffset 1s ease-out'
            }}
          />

          {/* Start marker */}
          <g style={{
            opacity: showMarkers ? 1 : 0,
            transition: 'opacity 0.3s ease-out'
          }}>
            <circle
              cx={xScale(0)}
              cy={yScale(basePrice)}
              r="5"
              fill="#CCFF00"
            />
            <text
              x={xScale(0) + 8}
              y={yScale(basePrice) + 4}
              fill="#CCFF00"
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {formatCurrencyShort(basePrice, currency, rate)}
            </text>
          </g>

          {/* Exit markers */}
          {exitMarkersData.map(({ scenario, label }, index) => {
            const isHighlighted = highlightedExit === index;
            const markerDelay = 0.1 * index;
            
            return (
              <g 
                key={label}
                className="cursor-pointer"
                onMouseEnter={() => onExitHover?.(index)}
                onMouseLeave={() => onExitHover?.(null)}
                style={{ 
                  filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(204,255,0,0.6))' : undefined,
                  opacity: showMarkers ? 1 : 0,
                  transition: `opacity 0.3s ease-out ${markerDelay}s`
                }}
              >
                <circle
                  cx={xScale(scenario.exitMonths)}
                  cy={yScale(scenario.exitPrice)}
                  r={isHighlighted ? 8 : 6}
                  fill="#0f172a"
                  stroke="#CCFF00"
                  strokeWidth={isHighlighted ? 2.5 : 2}
                />
                <circle
                  cx={xScale(scenario.exitMonths)}
                  cy={yScale(scenario.exitPrice)}
                  r={isHighlighted ? 4 : 3}
                  fill="#CCFF00"
                />
                
                {/* Price label */}
                <text
                  x={xScale(scenario.exitMonths)}
                  y={yScale(scenario.exitPrice) - 12}
                  fill="#CCFF00"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {formatCurrencyShort(scenario.exitPrice, currency, rate)}
                </text>
              </g>
            );
          })}

          {/* Handover marker */}
          <g style={{
            opacity: showMarkers ? 1 : 0,
            transition: 'opacity 0.3s ease-out 0.3s'
          }}>
            <circle
              cx={xScale(handoverScenario.exitMonths)}
              cy={yScale(handoverScenario.exitPrice)}
              r="7"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle
              cx={xScale(handoverScenario.exitMonths)}
              cy={yScale(handoverScenario.exitPrice)}
              r="3"
              fill="#ffffff"
            />
            <text
              x={xScale(handoverScenario.exitMonths) - 8}
              y={yScale(handoverScenario.exitPrice) - 12}
              fill="#ffffff"
              fontSize="9"
              fontWeight="bold"
              textAnchor="end"
              fontFamily="monospace"
            >
              {formatCurrencyShort(handoverScenario.exitPrice, currency, rate)}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
