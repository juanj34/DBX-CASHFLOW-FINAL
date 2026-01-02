import { TrendingUp, Building } from "lucide-react";
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
  const minValue = basePrice * 0.95;

  // Calculate appreciation percentages
  const constructionAppreciation = ((handoverPrice - basePrice) / basePrice) * 100;

  // SVG dimensions - more compact
  const width = 600;
  const height = 180;
  const padding = { top: 25, right: 30, bottom: 45, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (months: number) => padding.left + (months / totalMonths) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
  
  // Calculate approximate path length for animation
  const pathLength = useMemo(() => chartWidth * 1.5, [chartWidth]);

  // Y-axis values for labels and grid lines
  const yAxisValues = useMemo(() => {
    const range = maxValue - minValue;
    const step = range / 3;
    return [
      minValue,
      minValue + step,
      minValue + step * 2,
      maxValue
    ];
  }, [minValue, maxValue]);

  // X-axis time labels - every 6 months
  const timeLabels = useMemo(() => {
    const labels: number[] = [];
    for (let m = 0; m <= totalMonths; m += 6) {
      labels.push(m);
    }
    if (labels[labels.length - 1] !== totalMonths) {
      labels.push(totalMonths);
    }
    return labels;
  }, [totalMonths]);

  // Generate smooth curve path - power curve (faster early, slower later)
  const generateCurvePath = () => {
    const points: { x: number; y: number }[] = [];
    const totalAppreciation = handoverPrice - basePrice;
    
    // Power curve: faster appreciation early, slows down later
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const month = progress * totalMonths;
      // Power curve with exponent < 1 for faster early growth
      const curveProgress = Math.pow(progress, 0.7);
      const price = basePrice + (totalAppreciation * curveProgress);
      points.push({ x: month, y: price });
    }
    
    // Create smooth line path
    let path = `M ${xScale(points[0].x)} ${yScale(points[0].y)}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${xScale(points[i].x)} ${yScale(points[i].y)}`;
    }
    
    return path;
  };

  // Calculate exit scenario data using power curve
  const getExitScenarioData = (exitMonth: number) => {
    const totalAppreciation = handoverPrice - basePrice;
    const progress = exitMonth / totalMonths;
    const curveProgress = Math.pow(progress, 0.7);
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
    
    return {
      exitMonths: exitMonth,
      exitPrice,
      equityDeployed,
      profit,
      trueROE: displayROE,
      totalCapitalDeployed: totalCapital,
    };
  };

  const exitMarkersData = exitScenarios.map((month, index) => ({
    scenario: getExitScenarioData(month),
    label: `Exit ${index + 1}`,
  }));

  // Handover calculation
  const handoverScenario = {
    exitMonths: totalMonths,
    exitPrice: handoverPrice,
    equityDeployed: calculateEquityAtExit(totalMonths, inputs, totalMonths, basePrice),
    profit: handoverPrice - basePrice,
    trueROE: ((handoverPrice - basePrice - totalEntryCosts) / (calculateEquityAtExit(totalMonths, inputs, totalMonths, basePrice) + totalEntryCosts)) * 100
  };

  // Construction progress percentage
  const constructionProgress = Math.min(100, (exitScenarios[exitScenarios.length - 1] / totalMonths) * 100);

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 relative overflow-hidden h-full">
      <div className="relative h-full flex flex-col">
        {/* Header - More prominent */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#CCFF00]" />
            <span className="text-sm font-semibold text-white">Price Appreciation</span>
          </div>
          <span className="text-sm text-[#CCFF00] font-bold font-mono">+{constructionAppreciation.toFixed(0)}%</span>
        </div>

        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="flex-1" preserveAspectRatio="xMidYMid meet">
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="curveGradientMain" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CCFF00" />
              <stop offset="100%" stopColor="#22d3d1" />
            </linearGradient>
            
            <linearGradient id="areaGradientMain" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#CCFF00" stopOpacity="0" />
            </linearGradient>
            
            <linearGradient id="constructionProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#22d3d1" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {yAxisValues.map((value, i) => (
            <line
              key={`grid-h-${i}`}
              x1={padding.left}
              y1={yScale(value)}
              x2={width - padding.right}
              y2={yScale(value)}
              stroke="hsl(var(--theme-border))"
              strokeWidth="1"
              strokeDasharray="3,4"
              opacity="0.2"
            />
          ))}

          {/* Y-axis labels */}
          {yAxisValues.map((value, i) => (
            <text
              key={`y-${i}`}
              x={padding.left - 8}
              y={yScale(value)}
              fill="#94a3b8"
              fontSize="9"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {formatCurrencyShort(value, currency, rate)}
            </text>
          ))}

          {/* Vertical grid lines */}
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
              opacity="0.15"
            />
          ))}

          {/* X-axis labels */}
          {timeLabels.map(months => (
            <text
              key={`label-${months}`}
              x={xScale(months)}
              y={height - padding.bottom + 14}
              fill="#94a3b8"
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
            strokeDasharray="4,4"
            opacity="0.5"
          />
          <text
            x={padding.left + 5}
            y={yScale(basePrice) - 6}
            fill="#64748b"
            fontSize="8"
          >
            Base Price
          </text>

          {/* Area fill under curve */}
          <path
            d={`${generateCurvePath()} L ${xScale(totalMonths)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`}
            fill="url(#areaGradientMain)"
            style={{
              opacity: isAnimated ? 1 : 0,
              transition: 'opacity 0.6s ease-out 0.3s'
            }}
          />

          {/* Growth curve */}
          <path
            d={generateCurvePath()}
            fill="none"
            stroke="url(#curveGradientMain)"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: isAnimated ? 0 : pathLength,
              transition: 'stroke-dashoffset 1s ease-out'
            }}
          />

          {/* Construction progress bar at bottom */}
          <rect
            x={padding.left}
            y={height - 18}
            width={chartWidth}
            height={5}
            fill="#1e293b"
            rx="2.5"
          />
          <rect
            x={padding.left}
            y={height - 18}
            width={chartWidth * (constructionProgress / 100)}
            height={5}
            fill="url(#constructionProgressGradient)"
            rx="2.5"
            style={{
              transition: 'width 0.6s ease-out'
            }}
          />
          <text
            x={padding.left + chartWidth / 2}
            y={height - 26}
            fill="#64748b"
            fontSize="8"
            textAnchor="middle"
          >
            <tspan>🏗️ Construction Progress</tspan>
          </text>

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
              x={xScale(0) + 10}
              y={yScale(basePrice) + 4}
              fill="#CCFF00"
              fontSize="10"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {formatCurrencyShort(basePrice, currency, rate)}
            </text>
          </g>

          {/* Exit markers with labels */}
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
                  filter: isHighlighted ? 'drop-shadow(0 0 10px rgba(204,255,0,0.7))' : undefined,
                  opacity: showMarkers ? 1 : 0,
                  transition: `opacity 0.3s ease-out ${markerDelay}s`
                }}
              >
                {/* Exit label above */}
                <text
                  x={xScale(scenario.exitMonths)}
                  y={yScale(scenario.exitPrice) - 26}
                  fill="#CCFF00"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Exit {index + 1}
                </text>
                
                {/* Price label */}
                <text
                  x={xScale(scenario.exitMonths)}
                  y={yScale(scenario.exitPrice) - 14}
                  fill="#CCFF00"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {formatCurrencyShort(scenario.exitPrice, currency, rate)}
                </text>
                
                {/* Marker circles */}
                <circle
                  cx={xScale(scenario.exitMonths)}
                  cy={yScale(scenario.exitPrice)}
                  r={isHighlighted ? 9 : 7}
                  fill="#0f172a"
                  stroke="#CCFF00"
                  strokeWidth={isHighlighted ? 3 : 2}
                />
                <circle
                  cx={xScale(scenario.exitMonths)}
                  cy={yScale(scenario.exitPrice)}
                  r={isHighlighted ? 4 : 3}
                  fill="#CCFF00"
                />
              </g>
            );
          })}

          {/* Handover marker */}
          <g style={{
            opacity: showMarkers ? 1 : 0,
            transition: 'opacity 0.3s ease-out 0.3s'
          }}>
            {/* Handover label */}
            <text
              x={xScale(handoverScenario.exitMonths)}
              y={yScale(handoverScenario.exitPrice) - 26}
              fill="#ffffff"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
            >
              Handover
            </text>
            
            {/* Handover price */}
            <text
              x={xScale(handoverScenario.exitMonths)}
              y={yScale(handoverScenario.exitPrice) - 14}
              fill="#ffffff"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {formatCurrencyShort(handoverScenario.exitPrice, currency, rate)}
            </text>
            
            {/* Marker circles */}
            <circle
              cx={xScale(handoverScenario.exitMonths)}
              cy={yScale(handoverScenario.exitPrice)}
              r="8"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle
              cx={xScale(handoverScenario.exitMonths)}
              cy={yScale(handoverScenario.exitPrice)}
              r="4"
              fill="#ffffff"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
