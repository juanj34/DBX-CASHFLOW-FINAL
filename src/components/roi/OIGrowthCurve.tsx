import { TrendingUp } from "lucide-react";
import { OICalculations, OIInputs } from "./useOICalculations";
import { Currency, formatCurrencyShort } from "./currencyUtils";
import { useState, useEffect, useMemo } from "react";
import { monthToConstruction, calculateExitPrice, calculateExitScenario } from "./constructionProgress";

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
  
  // Calculate chart max month - extend to show post-handover if exits exist beyond handover
  const maxExitMonth = exitScenarios.length > 0 ? Math.max(...exitScenarios, totalMonths) : totalMonths;
  const chartMaxMonth = Math.max(totalMonths + 12, maxExitMonth + 6); // At least 1 year post-HO or latest exit + buffer
  
  // Growth period for phase calculations
  const growthPeriodYears = inputs.growthPeriodYears || 5;
  const growthPhaseEndMonth = totalMonths + (growthPeriodYears * 12);
  
  // Calculate max price for y-axis scaling (now considering post-handover appreciation)
  const maxChartPrice = calculateExitPrice(chartMaxMonth, basePrice, totalMonths, inputs);
  const maxValue = maxChartPrice * 1.08;
  const minValue = basePrice * 0.95;

  // SVG dimensions - more compact with more bottom space
  const width = 600;
  const height = 200;
  const padding = { top: 30, right: 30, bottom: 55, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions - now using chartMaxMonth instead of totalMonths
  const xScale = (months: number) => padding.left + (months / chartMaxMonth) * chartWidth;
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

  // X-axis time labels - adapted for extended timeline
  const timeLabels = useMemo(() => {
    const labels: number[] = [];
    const interval = chartMaxMonth <= 36 ? 6 : 12; // Use 6-month intervals for short timelines, 12 for longer
    
    for (let m = 0; m <= chartMaxMonth; m += interval) {
      labels.push(m);
    }
    // Only add final month if it's at least 3 months from last label
    if (labels.length > 0 && chartMaxMonth - labels[labels.length - 1] >= 3) {
      labels.push(chartMaxMonth);
    } else if (labels[labels.length - 1] !== chartMaxMonth) {
      // Replace last label with chartMaxMonth if close
      labels[labels.length - 1] = chartMaxMonth;
    }
    return labels;
  }, [chartMaxMonth]);

  // Generate smooth curve path - NOW EXTENDED beyond handover
  const curvePath = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const month = progress * chartMaxMonth; // Use chartMaxMonth, not totalMonths
      // Use the canonical exit price calculation (handles all phases)
      const price = calculateExitPrice(month, basePrice, totalMonths, inputs);
      points.push({ x: month, y: price });
    }
    
    // Create smooth line path
    let path = `M ${xScale(points[0].x)} ${yScale(points[0].y)}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${xScale(points[i].x)} ${yScale(points[i].y)}`;
    }
    
    return path;
  }, [basePrice, totalMonths, chartMaxMonth, inputs, xScale, yScale]);

  // Calculate exit scenarios - FILTER OUT exits at handover month (they would overlap with Handover Value)
  const exitMarkersData = useMemo(() => {
    let exitNumber = 0;
    return exitScenarios
      .map((month) => {
        // Skip exits exactly at handover month - those are shown as "Handover Value"
        if (month === totalMonths) return null;
        
        exitNumber++;
        const scenario = calculateExitScenario(month, basePrice, totalMonths, inputs, totalEntryCosts);
        return {
          scenario,
          exitMonth: month,
          label: `Exit ${exitNumber}`,
          exitNumber,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [exitScenarios, basePrice, totalMonths, inputs, totalEntryCosts]);

  // Handover - just the property VALUE at completion (not an exit scenario)
  const handoverPrice = useMemo(() => {
    return calculateExitPrice(totalMonths, basePrice, totalMonths, inputs);
  }, [totalMonths, basePrice, inputs]);

  // Construction progress markers for the timeline - only up to handover
  const constructionMarkers = useMemo(() => {
    // Show construction % at key timeline points (only during construction phase)
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

  // Phase labels for the x-axis
  const phaseLabels = useMemo(() => {
    const labels: { x: number; label: string; color: string }[] = [];
    
    // Only show phase labels if we're showing post-handover
    if (chartMaxMonth > totalMonths) {
      labels.push({ x: totalMonths / 2, label: 'Construction', color: '#f97316' });
      
      const growthEnd = Math.min(growthPhaseEndMonth, chartMaxMonth);
      if (growthEnd > totalMonths) {
        labels.push({ x: (totalMonths + growthEnd) / 2, label: 'Growth', color: '#22c55e' });
      }
      
      if (chartMaxMonth > growthPhaseEndMonth) {
        labels.push({ x: (growthPhaseEndMonth + chartMaxMonth) / 2, label: 'Mature', color: '#3b82f6' });
      }
    }
    
    return labels;
  }, [chartMaxMonth, totalMonths, growthPhaseEndMonth]);

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 relative overflow-hidden h-full">
      <div className="relative h-full flex flex-col">
        {/* Header - Title only */}
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-[#CCFF00]" />
          <span className="text-sm font-semibold text-white">Price Appreciation</span>
        </div>

        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="flex-1" preserveAspectRatio="xMidYMid meet">
          {/* Gradient definitions - with phased coloring */}
          <defs>
            {/* Phased gradient for the curve - Construction → Growth → Mature */}
            <linearGradient id="curveGradientPhased" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset={`${(totalMonths / chartMaxMonth) * 100}%`} stopColor="#CCFF00" />
              <stop offset={`${(Math.min(growthPhaseEndMonth, chartMaxMonth) / chartMaxMonth) * 100}%`} stopColor="#22c55e" />
              <stop offset="100%" stopColor="#3b82f6" />
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

          {/* Construction progress bar - only up to handover */}
          <rect
            x={padding.left}
            y={height - 28}
            width={(totalMonths / chartMaxMonth) * chartWidth}
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

          {/* Phase labels (Construction, Growth, Mature) */}
          {phaseLabels.map((phase, i) => (
            <text
              key={`phase-${i}`}
              x={xScale(phase.x)}
              y={height - 14}
              fill={phase.color}
              fontSize="8"
              textAnchor="middle"
              fontWeight="bold"
              opacity="0.7"
            >
              {phase.label}
            </text>
          ))}

          {/* Handover vertical marker line */}
          {chartMaxMonth > totalMonths && (
            <line
              x1={xScale(totalMonths)}
              y1={padding.top}
              x2={xScale(totalMonths)}
              y2={height - padding.bottom}
              stroke="#CCFF00"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.4"
            />
          )}

          {/* Growth → Mature transition line */}
          {chartMaxMonth > growthPhaseEndMonth && (
            <line
              x1={xScale(growthPhaseEndMonth)}
              y1={padding.top}
              x2={xScale(growthPhaseEndMonth)}
              y2={height - padding.bottom}
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.3"
            />
          )}

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
            d={`${curvePath} L ${xScale(chartMaxMonth)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`}
            fill="url(#areaGradientMain)"
            style={{
              opacity: isAnimated ? 1 : 0,
              transition: 'opacity 0.6s ease-out 0.3s'
            }}
          />

          {/* Growth curve - now with phased gradient */}
          <path
            d={curvePath}
            fill="none"
            stroke={chartMaxMonth > totalMonths ? "url(#curveGradientPhased)" : "#CCFF00"}
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
          {exitMarkersData.map(({ scenario, exitMonth, label }, index) => {
            const isHighlighted = highlightedExit === index;
            const markerDelay = 0.1 * index;
            const isPostHandover = exitMonth > totalMonths;
            const markerColor = isPostHandover ? '#22c55e' : '#CCFF00';
            
            return (
              <g 
                key={label}
                className="cursor-pointer"
                onMouseEnter={() => onExitHover?.(index)}
                onMouseLeave={() => onExitHover?.(null)}
                style={{ 
                  filter: isHighlighted ? `drop-shadow(0 0 10px ${markerColor}aa)` : undefined,
                  opacity: showMarkers ? 1 : 0,
                  transition: `opacity 0.3s ease-out ${markerDelay}s`
                }}
              >
                {/* Exit label above */}
                <text
                  x={xScale(exitMonth)}
                  y={yScale(scenario.exitPrice) - 30}
                  fill={markerColor}
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Exit {index + 1}
                </text>
                
                {/* Post-handover indicator */}
                {isPostHandover && (
                  <text
                    x={xScale(exitMonth)}
                    y={yScale(scenario.exitPrice) - 42}
                    fill="#22c55e"
                    fontSize="7"
                    textAnchor="middle"
                    opacity="0.7"
                  >
                    +{exitMonth - totalMonths}mo
                  </text>
                )}
                
                {/* Price label */}
                <text
                  x={xScale(exitMonth)}
                  y={yScale(scenario.exitPrice) - 18}
                  fill={markerColor}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {formatCurrencyShort(scenario.exitPrice, currency, rate)}
                </text>

                {/* ROE label - now using annualizedROE */}
                <text
                  x={xScale(exitMonth)}
                  y={yScale(scenario.exitPrice) - 6}
                  fill="#22d3d1"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {scenario.annualizedROE.toFixed(0)}%/yr
                </text>
                
                {/* Marker circles */}
                <circle
                  cx={xScale(exitMonth)}
                  cy={yScale(scenario.exitPrice)}
                  r={isHighlighted ? 9 : 7}
                  fill="#0f172a"
                  stroke={markerColor}
                  strokeWidth={isHighlighted ? 3 : 2}
                />
                <circle
                  cx={xScale(exitMonth)}
                  cy={yScale(scenario.exitPrice)}
                  r={isHighlighted ? 4 : 3}
                  fill={markerColor}
                />
              </g>
            );
          })}

          {/* Handover Value marker - milestone, NOT an exit scenario */}
          <g style={{
            opacity: showMarkers ? 1 : 0,
            transition: 'opacity 0.3s ease-out 0.3s'
          }}>
            {/* Handover label - now shows it's just the property value */}
            <text
              x={xScale(totalMonths)}
              y={yScale(handoverPrice) - 24}
              fill="#ffffff"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
            >
              🔑 Handover Value
            </text>
            
            {/* Handover price - just the property value at completion */}
            <text
              x={xScale(totalMonths)}
              y={yScale(handoverPrice) - 10}
              fill="#ffffff"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {formatCurrencyShort(handoverPrice, currency, rate)}
            </text>

            {/* NO ROE shown - handover is a milestone, not an exit */}
            
            {/* Marker circles */}
            <circle
              cx={xScale(totalMonths)}
              cy={yScale(handoverPrice)}
              r="8"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle
              cx={xScale(totalMonths)}
              cy={yScale(handoverPrice)}
              r="4"
              fill="#ffffff"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
