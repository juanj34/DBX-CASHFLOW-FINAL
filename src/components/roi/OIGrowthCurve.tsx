import { TrendingUp } from "lucide-react";
import { OICalculations, OIInputs } from "./useOICalculations";
import { Currency, formatCurrencyShort } from "./currencyUtils";
import { useState, useEffect, useMemo } from "react";
import { monthToConstruction, calculateExitPrice, calculateExitScenario } from "./constructionProgress";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

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

  // SVG dimensions - responsive width, taller for readability
  const width = 700;
  const height = 300;
  const padding = { top: 35, right: 35, bottom: 60, left: 60 };
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

  // Calculate exit scenarios - FILTER OUT exits that would overlap with Handover marker
  // Also check for proximity (within 2 months of handover) to avoid visual overlap
  const exitMarkersData = useMemo(() => {
    let exitNumber = 0;
    return exitScenarios
      .map((month) => {
        // Skip exits exactly at handover month - those are shown as "Handover Value"
        if (month === totalMonths) return null;
        
        // Check if this exit is too close to handover (within 2 months) - flag for offset
        const isNearHandover = Math.abs(month - totalMonths) <= 2;
        
        exitNumber++;
        const scenario = calculateExitScenario(month, basePrice, totalMonths, inputs, totalEntryCosts);
        return {
          scenario,
          exitMonth: month,
          label: `${t('exitLabel')} ${exitNumber}`,
          exitNumber,
          isNearHandover,
          isBeforeHandover: month < totalMonths,
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
      labels.push({ x: totalMonths / 2, label: t('underConstructionPhaseLabel'), color: 'hsl(var(--theme-accent))' });
      
      const growthEnd = Math.min(growthPhaseEndMonth, chartMaxMonth);
      if (growthEnd > totalMonths) {
        labels.push({ x: (totalMonths + growthEnd) / 2, label: t('postHandoverPhaseLabel'), color: 'hsl(var(--theme-positive))' });
      }
      
      if (chartMaxMonth > growthPhaseEndMonth) {
        labels.push({ x: (growthPhaseEndMonth + chartMaxMonth) / 2, label: t('maturityPhaseLabel'), color: 'hsl(var(--theme-text-highlight))' });
      }
    }
    
    return labels;
  }, [chartMaxMonth, totalMonths, growthPhaseEndMonth]);

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl p-4 relative overflow-hidden h-full">
      <div className="relative h-full flex flex-col">
        {/* Header - Title only */}
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-theme-accent" />
          <span className="text-sm font-semibold text-theme-text">{t('priceAppreciationLabel')}</span>
        </div>

        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="flex-1" preserveAspectRatio="xMidYMid meet">
          {/* Gradient definitions - with phased coloring */}
          <defs>
            {/* Phased gradient for the curve - Construction → Growth → Mature */}
            <linearGradient id="curveGradientPhased" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset={`${(totalMonths / chartMaxMonth) * 100}%`} stopColor="hsl(var(--theme-accent))" />
              <stop offset={`${(Math.min(growthPhaseEndMonth, chartMaxMonth) / chartMaxMonth) * 100}%`} stopColor="hsl(var(--theme-positive))" />
              <stop offset="100%" stopColor="hsl(var(--theme-text-highlight))" />
            </linearGradient>
            
            <linearGradient id="areaGradientMain" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--theme-accent))" stopOpacity="0.12" />
              <stop offset="100%" stopColor="hsl(var(--theme-accent))" stopOpacity="0" />
            </linearGradient>
            
            <linearGradient id="constructionBarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--theme-accent))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--theme-accent))" stopOpacity="0.5" />
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
              fill="hsl(var(--theme-text-muted))"
              fontSize="10"
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
              fill="hsl(var(--theme-text-muted))"
              fontSize="9"
              textAnchor="middle"
            >
              {months}mo
            </text>
          ))}

          {/* Construction progress bar - only up to handover */}
          <rect
            x={padding.left}
            y={height - 32}
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
              y={height - 40}
              fill="hsl(var(--theme-text-muted))"
              fontSize="8"
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
              y={height - 16}
              fill={phase.color}
              fontSize="9"
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
              stroke="hsl(var(--theme-accent))"
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
              stroke="hsl(var(--theme-text-highlight))"
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
            stroke="hsl(var(--theme-text-muted))"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.5"
          />
          <text
            x={padding.left + 5}
            y={yScale(basePrice) - 6}
            fill="hsl(var(--theme-text-muted))"
            fontSize="8"
          >
            {t('basePriceLabel')}
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
            stroke={chartMaxMonth > totalMonths ? "url(#curveGradientPhased)" : "hsl(var(--theme-accent))"}
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
              fill="hsl(var(--theme-accent))"
            />
            <text
              x={xScale(0) + 10}
              y={yScale(basePrice) + 4}
              fill="hsl(var(--theme-accent))"
              fontSize="10"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {formatCurrencyShort(basePrice, currency, rate)}
            </text>
          </g>

          {/* Exit markers with labels and ROE */}
          {exitMarkersData.map(({ scenario, exitMonth, label, isNearHandover, isBeforeHandover }, index) => {
            const isHighlighted = highlightedExit === index;
            const markerDelay = 0.1 * index;
            const isPostHandover = exitMonth > totalMonths;
            const markerColor = isPostHandover ? 'hsl(var(--theme-positive))' : 'hsl(var(--theme-accent))';
            
            // Offset text position if near handover to avoid overlap
            const textXOffset = isNearHandover ? (isBeforeHandover ? -25 : 25) : 0;
            const textAnchor = isNearHandover ? (isBeforeHandover ? 'end' : 'start') : 'middle';
            
            return (
              <g 
                key={label}
                className="cursor-pointer"
                onMouseEnter={() => onExitHover?.(index)}
                onMouseLeave={() => onExitHover?.(null)}
                style={{ 
                  filter: isHighlighted ? 'drop-shadow(0 0 10px hsl(var(--theme-accent) / 0.6))' : undefined,
                  opacity: showMarkers ? 1 : 0,
                  transition: `opacity 0.3s ease-out ${markerDelay}s`
                }}
              >
                {/* Exit label above */}
                <text
                  x={xScale(exitMonth) + textXOffset}
                  y={yScale(scenario.exitPrice) - 30}
                  fill={markerColor}
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor={textAnchor}
                >
                  {t('exitLabel')} {index + 1}
                </text>
                
                {/* Post-handover indicator */}
                {isPostHandover && (
                  <text
                    x={xScale(exitMonth) + textXOffset}
                    y={yScale(scenario.exitPrice) - 42}
                    fill="hsl(var(--theme-positive))"
                    fontSize="7"
                    textAnchor={textAnchor}
                    opacity="0.7"
                  >
                    +{exitMonth - totalMonths}mo
                  </text>
                )}
                
                {/* Price label */}
                <text
                  x={xScale(exitMonth) + textXOffset}
                  y={yScale(scenario.exitPrice) - 18}
                  fill={markerColor}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor={textAnchor}
                  fontFamily="monospace"
                >
                  {formatCurrencyShort(scenario.exitPrice, currency, rate)}
                </text>

                {/* ROE label - now showing true ROE (appreciation / total capital) */}
                <text
                  x={xScale(exitMonth) + textXOffset}
                  y={yScale(scenario.exitPrice) - 6}
                  fill="hsl(var(--theme-accent))"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor={textAnchor}
                  fontFamily="monospace"
                >
                  {scenario.trueROE.toFixed(0)}% {t('roeAbbr')}
                </text>
                
                {/* Marker circles */}
                <circle
                  cx={xScale(exitMonth)}
                  cy={yScale(scenario.exitPrice)}
                  r={isHighlighted ? 9 : 7}
                  fill="hsl(var(--theme-bg))"
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
              fill="hsl(var(--theme-text))"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
            >
              🔑 {t('handoverValueLabel')}
            </text>
            
            {/* Handover price - just the property value at completion */}
            <text
              x={xScale(totalMonths)}
              y={yScale(handoverPrice) - 10}
              fill="hsl(var(--theme-text))"
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
              fill="hsl(var(--theme-bg))"
              stroke="hsl(var(--theme-text))"
              strokeWidth="2"
            />
            <circle
              cx={xScale(totalMonths)}
              cy={yScale(handoverPrice)}
              r="4"
              fill="hsl(var(--theme-text))"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
