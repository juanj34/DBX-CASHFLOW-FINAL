import { Rocket, Home, TrendingUp } from "lucide-react";
import { OICalculations, OIInputs } from "./useOICalculations";
import { Currency, formatCurrencyShort } from "./currencyUtils";
import { calculatePhasedExitPrice, calculateEquityAtExit } from "./ExitScenariosCards";
import { cn } from "@/lib/utils";
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
    const markerTimer = setTimeout(() => setShowMarkers(true), 800);
    return () => {
      clearTimeout(curveTimer);
      clearTimeout(markerTimer);
    };
  }, []);
  
  // Calculate handover price using the SAME function as exit scenario cards
  const handoverPrice = calculatePhasedExitPrice(totalMonths, inputs, totalMonths, basePrice);
  const maxValue = handoverPrice * 1.15; // Add 15% padding for labels

  // Calculate appreciation percentages
  const constructionAppreciation = ((handoverPrice - basePrice) / basePrice) * 100;

  // SVG dimensions
  const width = 700;
  const height = 320;
  const padding = { top: 50, right: 40, bottom: 60, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions - now based on months
  const xScale = (months: number) => padding.left + (months / totalMonths) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - basePrice * 0.85) / (maxValue - basePrice * 0.85)) * chartHeight;
  
  // Calculate approximate path length for animation
  const pathLength = useMemo(() => chartWidth * 1.5, [chartWidth]);

  // Generate curve path using calculatePhasedExitPrice for consistency with exit scenario cards
  const generateCurvePath = () => {
    const points: { x: number; y: number }[] = [];
    
    // Start at base price
    points.push({ x: 0, y: basePrice });
    
    // Generate points every 3 months for smooth curve using SAME calculation as exit cards
    for (let month = 3; month <= totalMonths; month += 3) {
      const price = calculatePhasedExitPrice(month, inputs, totalMonths, basePrice);
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

  // X-axis time labels
  const timeLabels = [0, Math.round(totalMonths * 0.25), Math.round(totalMonths * 0.5), Math.round(totalMonths * 0.75), totalMonths];

  // Calculate exit scenario data using the SAME function as exit scenario cards
  const getExitScenarioData = (exitMonth: number) => {
    // Always calculate on-the-fly using same logic as ExitScenariosCards
    const exitPrice = calculatePhasedExitPrice(exitMonth, inputs, totalMonths, basePrice);
    const equityDeployed = calculateEquityAtExit(exitMonth, inputs, totalMonths, basePrice);
    const profit = exitPrice - basePrice;
    const trueProfit = profit - calculations.totalEntryCosts;
    const totalCapital = equityDeployed + calculations.totalEntryCosts;
    
    // Calculate exit costs (agent commission + NOC fee)
    const agentCommission = inputs.exitAgentCommissionEnabled ? exitPrice * 0.02 : 0;
    const nocFee = inputs.exitNocFee || 0;
    const exitCosts = agentCommission + nocFee;
    
    // Net profit after exit costs
    const netProfit = trueProfit - exitCosts;
    
    // Use net ROE when exit costs exist, otherwise use true ROE
    const trueROE = totalCapital > 0 ? (trueProfit / totalCapital) * 100 : 0;
    const netROE = totalCapital > 0 ? (netProfit / totalCapital) * 100 : 0;
    const displayROE = exitCosts > 0 ? netROE : trueROE;

    // Calculate appreciation at this point
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

  // Calculate y-offsets to prevent overlapping labels
  const calculateOffsets = () => {
    const markers = exitScenarios.map((month, index) => ({
      index,
      x: xScale(month),
      yOffset: 0
    }));

    // Sort by x position
    markers.sort((a, b) => a.x - b.x);

    // Check for overlaps and offset
    const MIN_X_DISTANCE = 80;
    for (let i = 1; i < markers.length; i++) {
      const prev = markers[i - 1];
      const curr = markers[i];
      const distance = curr.x - prev.x;
      
      if (distance < MIN_X_DISTANCE) {
        // Alternate offset direction
        curr.yOffset = (i % 2 === 0) ? -35 : 35;
      }
    }

    return markers.sort((a, b) => a.index - b.index).map(m => m.yOffset);
  };

  const yOffsets = calculateOffsets();

  const exitMarkersData = exitScenarios.map((month, index) => ({
    scenario: getExitScenarioData(month),
    label: `Exit ${index + 1}`,
    isHandover: false,
    yOffset: yOffsets[index] || 0
  }));

  // Add handover marker - use calculatePhasedExitPrice for consistency
  const handoverScenario = {
    exitMonths: totalMonths,
    exitPrice: handoverPrice,
    equityDeployed: calculateEquityAtExit(totalMonths, inputs, totalMonths, basePrice),
    profit: handoverPrice - basePrice,
    trueROE: ((handoverPrice - basePrice - totalEntryCosts) / (calculateEquityAtExit(totalMonths, inputs, totalMonths, basePrice) + totalEntryCosts)) * 100
  };

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl p-6 relative overflow-hidden h-full">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{ 
          backgroundImage: 'linear-gradient(to right, hsl(var(--theme-accent)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--theme-accent)) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-theme-accent/20 rounded-xl">
            <TrendingUp className="w-5 h-5 text-theme-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-theme-text">Price Appreciation Over Time</h3>
            <p className="text-xs text-theme-text-muted">From booking to handover · +{constructionAppreciation.toFixed(1)}% total appreciation</p>
          </div>
        </div>

        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="flex-1" preserveAspectRatio="xMidYMid meet">
          {/* Gradient definitions */}
          <defs>
            {/* Construction phase background gradient */}
            <linearGradient id="constructionPhaseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#CCFF00" stopOpacity="0.1" />
            </linearGradient>
            
            {/* Enhanced curve gradient */}
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#CCFF00" />
              <stop offset="100%" stopColor="#22d3d1" />
            </linearGradient>
            
            {/* Area fill gradient */}
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#CCFF00" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Construction Phase Background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={chartWidth}
            height={chartHeight}
            fill="url(#constructionPhaseGradient)"
            rx="4"
          />

          {/* Phase label at top */}
          <text
            x={(padding.left + width - padding.right) / 2}
            y={padding.top - 15}
            fill="hsl(var(--theme-text-muted))"
            fontSize="11"
            textAnchor="middle"
            fontWeight="500"
          >
            Construction Phase
          </text>

          {/* Grid lines */}
          {timeLabels.map(months => (
            <line
              key={`grid-v-${months}`}
              x1={xScale(months)}
              y1={padding.top}
              x2={xScale(months)}
              y2={height - padding.bottom}
              stroke="hsl(var(--theme-border))"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.5"
            />
          ))}

          {/* X-axis labels */}
          {timeLabels.map(months => (
            <text
              key={`label-${months}`}
              x={xScale(months)}
              y={height - padding.bottom + 20}
              fill="hsl(var(--theme-text-muted))"
              fontSize="11"
              textAnchor="middle"
            >
              {months}mo
            </text>
          ))}

          {/* X-axis title */}
          <text
            x={width / 2}
            y={height - 10}
            fill="hsl(var(--theme-text-muted))"
            fontSize="11"
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
            stroke="hsl(var(--theme-text-muted))"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.5"
          />

          {/* Area fill under curve - animated */}
          <path
            d={`${generateCurvePath()} L ${xScale(totalMonths)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`}
            fill="url(#areaGradient)"
            style={{
              opacity: isAnimated ? 1 : 0,
              transition: 'opacity 0.8s ease-out 0.5s'
            }}
          />

          {/* Growth curve with gradient - animated drawing */}
          <path
            d={generateCurvePath()}
            fill="none"
            stroke="url(#curveGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: isAnimated ? 0 : pathLength,
              transition: 'stroke-dashoffset 1.2s ease-out'
            }}
          />

          {/* Glow effect - animated */}
          <path
            d={generateCurvePath()}
            fill="none"
            stroke="url(#curveGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity={isAnimated ? 0.2 : 0}
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: isAnimated ? 0 : pathLength,
              transition: 'stroke-dashoffset 1.2s ease-out, opacity 0.5s ease-out 0.8s'
            }}
          />

          {/* Start marker with price label */}
          <g style={{
            opacity: showMarkers ? 1 : 0,
            transition: 'opacity 0.4s ease-out'
          }}>
            <circle
              cx={xScale(0)}
              cy={yScale(basePrice)}
              r="8"
              fill="#3b82f6"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <circle
              cx={xScale(0)}
              cy={yScale(basePrice)}
              r="4"
              fill="#ffffff"
            />
            {/* Start label */}
            <g transform={`translate(${xScale(0)}, ${yScale(basePrice) - 20})`}>
              <rect
                x="-35"
                y="-10"
                width="70"
                height="20"
                rx="10"
                fill="#3b82f6"
              />
              <text
                x="0"
                y="4"
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                Start
              </text>
            </g>
            <text
              x={xScale(0)}
              y={yScale(basePrice) + 22}
              fill="#3b82f6"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {formatCurrencyShort(basePrice, currency, rate)}
            </text>
          </g>

          {/* Exit markers - Interactive with staggered entrance */}
          {exitMarkersData.map(({ scenario, label, yOffset }, index) => {
            const isHighlighted = highlightedExit === index;
            const markerRadius = isHighlighted ? 12 : 8;
            const innerRadius = isHighlighted ? 6 : 4;
            const markerDelay = 0.1 * index;
            
            return (
            <g 
              key={label}
              className="cursor-pointer"
              onMouseEnter={() => onExitHover?.(index)}
              onMouseLeave={() => onExitHover?.(null)}
              style={{ 
                filter: isHighlighted ? 'drop-shadow(0 0 12px rgba(204,255,0,0.6))' : undefined,
                opacity: showMarkers ? 1 : 0,
                transform: showMarkers ? 'translateY(0)' : 'translateY(10px)',
                transition: `opacity 0.4s ease-out ${markerDelay}s, transform 0.4s ease-out ${markerDelay}s`
              }}
            >
              {/* Connection line if offset */}
              {yOffset !== 0 && (
                <line
                  x1={xScale(scenario.exitMonths)}
                  y1={yScale(scenario.exitPrice)}
                  x2={xScale(scenario.exitMonths)}
                  y2={yScale(scenario.exitPrice) - 22 + yOffset}
                  stroke="#CCFF00"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.5"
                />
              )}
              
              {/* Hit area for easier touch/hover (invisible but larger) */}
              <circle
                cx={xScale(scenario.exitMonths)}
                cy={yScale(scenario.exitPrice)}
                r="20"
                fill="transparent"
              />
              
              {/* Point circle - larger when highlighted */}
              <circle
                cx={xScale(scenario.exitMonths)}
                cy={yScale(scenario.exitPrice)}
                r={markerRadius}
                fill="#0f172a"
                stroke="#CCFF00"
                strokeWidth={isHighlighted ? 3 : 2}
                className="transition-all duration-200"
              />
              <circle
                cx={xScale(scenario.exitMonths)}
                cy={yScale(scenario.exitPrice)}
                r={innerRadius}
                fill="#CCFF00"
                className="transition-all duration-200"
              />

              {/* Exit label badge */}
              <g transform={`translate(${xScale(scenario.exitMonths)}, ${yScale(scenario.exitPrice) - 22 + yOffset})`}>
                <rect
                  x="-28"
                  y="-10"
                  width="56"
                  height="20"
                  rx="10"
                  fill={isHighlighted ? "#CCFF00" : "#CCFF00"}
                  opacity={isHighlighted ? 1 : 0.9}
                  className="transition-all duration-200"
                />
                <text
                  x="0"
                  y="4"
                  fill="#0f172a"
                  fontSize={isHighlighted ? "11" : "10"}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {label}
                </text>
              </g>

              {/* Value label */}
              <text
                x={xScale(scenario.exitMonths)}
                y={yScale(scenario.exitPrice) + (yOffset >= 0 ? 28 : 45) + Math.abs(yOffset)}
                fill="#CCFF00"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {formatCurrencyShort(scenario.exitPrice, currency, rate)}
              </text>

              {/* Appreciation % */}
              <text
                x={xScale(scenario.exitMonths)}
                y={yScale(scenario.exitPrice) + (yOffset >= 0 ? 41 : 58) + Math.abs(yOffset)}
                fill="#9ca3af"
                fontSize="9"
                textAnchor="middle"
              >
                +{scenario.appreciation.toFixed(0)}% · {scenario.trueROE.toFixed(0)}% ROE
              </text>
            </g>
            );
          })}

          {/* Handover marker - animated */}
          <g style={{
            opacity: showMarkers ? 1 : 0,
            transform: showMarkers ? 'translateY(0)' : 'translateY(10px)',
            transition: `opacity 0.4s ease-out 0.4s, transform 0.4s ease-out 0.4s`
          }}>
            {/* Handover vertical line */}
            <line
              x1={xScale(handoverScenario.exitMonths)}
              y1={padding.top}
              x2={xScale(handoverScenario.exitMonths)}
              y2={yScale(handoverScenario.exitPrice)}
              stroke="#ffffff"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.3"
            />
            
            {/* Point circle - special styling */}
            <circle
              cx={xScale(handoverScenario.exitMonths)}
              cy={yScale(handoverScenario.exitPrice)}
              r="10"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle
              cx={xScale(handoverScenario.exitMonths)}
              cy={yScale(handoverScenario.exitPrice)}
              r="5"
              fill="#ffffff"
            />

            {/* Handover label badge */}
            <g transform={`translate(${xScale(handoverScenario.exitMonths)}, ${yScale(handoverScenario.exitPrice) - 25})`}>
              <rect
                x="-42"
                y="-12"
                width="84"
                height="24"
                rx="12"
                fill="#ffffff"
              />
              <text
                x="0"
                y="4"
                fill="#0f172a"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                🏠 Handover
              </text>
            </g>

            {/* Value label */}
            <text
              x={xScale(handoverScenario.exitMonths)}
              y={yScale(handoverScenario.exitPrice) + 28}
              fill="#ffffff"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {formatCurrencyShort(handoverScenario.exitPrice, currency, rate)}
            </text>

            {/* Appreciation at handover */}
            <text
              x={xScale(handoverScenario.exitMonths)}
              y={yScale(handoverScenario.exitPrice) + 41}
              fill="#9ca3af"
              fontSize="9"
              textAnchor="middle"
            >
              +{constructionAppreciation.toFixed(0)}%
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
