import { TrendingUp } from "lucide-react";
import { OICalculations, OIInputs } from "./useOICalculations";
import { Currency, formatCurrencyShort } from "./currencyUtils";
import { calculatePhasedExitPrice, calculateEquityAtExit } from "./ExitScenariosCards";
import { useState, useEffect, useMemo } from "react";
import { monthToConstruction } from "./constructionProgress";

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

  // SVG dimensions - more compact with more bottom space
  const width = 600;
  const height = 200;
  const padding = { top: 30, right: 30, bottom: 55, left: 55 };
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

  // X-axis time labels - every 6 months, avoiding overlap
  const timeLabels = useMemo(() => {
    const labels: number[] = [];
    for (let m = 0; m <= totalMonths; m += 6) {
      labels.push(m);
    }
    // Only add final month if it's at least 3 months from last label
    if (labels.length > 0 && totalMonths - labels[labels.length - 1] >= 3) {
      labels.push(totalMonths);
    } else if (labels[labels.length - 1] !== totalMonths) {
      // Replace last label with totalMonths if close
      labels[labels.length - 1] = totalMonths;
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

  // Construction progress markers for the timeline
  const constructionMarkers = useMemo(() => {
    // Show construction % at key timeline points
    const markers: { month: number; percent: number }[] = [];
    for (let m = 0; m <= totalMonths; m += 6) {
      markers.push({ month: m, percent: monthToConstruction(m, totalMonths) });
    }
    // Add final if not already there
    if (markers.length > 0 && markers[markers.length - 1].month !== totalMonths) {
      markers.push({ month: totalMonths, percent: 100 });
    }
    return markers;
  }, [totalMonths]);

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 relative overflow-hidden h-full">
      <div className="relative h-full flex flex-col">
        {/* Header - Title only */}
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-[#CCFF00]" />
          <span className="text-sm font-semibold text-white">Price Appreciation</span>
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
            
            <linearGradient id="constructionBarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#22d3d1" stopOpacity="0.5" />
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

          {/* X-axis labels (months) */}
          {timeLabels.map(months => (
            <text
              key={`label-${months}`}
              x={xScale(months)}
              y={height - padding.bottom + 12}
              fill="#94a3b8"
              fontSize="9"
              textAnchor="middle"
            >
              {months}mo
            </text>
          ))}

          {/* Construction progress bar - full width, filled */}
          <rect
            x={padding.left}
            y={height - 28}
            width={chartWidth}
            height={6}
            fill="url(#constructionBarGradient)"
            rx="3"
          />

          {/* Construction % labels below bar */}
          {constructionMarkers.map((marker, i) => (
            <text
              key={`const-${i}`}
              x={xScale(marker.month)}
              y={height - 36}
              fill="#64748b"
              fontSize="7"
              textAnchor="middle"
            >
              {Math.round(marker.percent)}%
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

          {/* Exit markers with labels and ROE */}
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
                  y={yScale(scenario.exitPrice) - 30}
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
                  y={yScale(scenario.exitPrice) - 18}
                  fill="#CCFF00"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {formatCurrencyShort(scenario.exitPrice, currency, rate)}
                </text>

                {/* ROE label */}
                <text
                  x={xScale(scenario.exitMonths)}
                  y={yScale(scenario.exitPrice) - 6}
                  fill="#22d3d1"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {scenario.trueROE.toFixed(0)}% ROE
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
              y={yScale(handoverScenario.exitPrice) - 30}
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
              y={yScale(handoverScenario.exitPrice) - 18}
              fill="#ffffff"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {formatCurrencyShort(handoverScenario.exitPrice, currency, rate)}
            </text>

            {/* Handover ROE */}
            <text
              x={xScale(handoverScenario.exitMonths)}
              y={yScale(handoverScenario.exitPrice) - 6}
              fill="#22d3d1"
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {handoverScenario.trueROE.toFixed(0)}% ROE
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
