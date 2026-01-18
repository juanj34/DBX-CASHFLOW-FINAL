import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OIInputs } from '../useOICalculations';
import { Currency, formatCurrencyShort } from '../currencyUtils';
import { calculateExitScenario } from '../constructionProgress';

interface ExitChartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputs: OIInputs;
  exitScenarios: number[];
  totalMonths: number;
  basePrice: number;
  totalEntryCosts: number;
  currency: Currency;
  rate: number;
}

export const ExitChartModal = ({
  open,
  onOpenChange,
  inputs,
  exitScenarios,
  totalMonths,
  basePrice,
  totalEntryCosts,
  currency,
  rate,
}: ExitChartModalProps) => {
  const [isAnimated, setIsAnimated] = useState(false);
  const [showMarkers, setShowMarkers] = useState(false);

  // Reset animation on open
  useEffect(() => {
    if (open) {
      setIsAnimated(false);
      setShowMarkers(false);
      const curveTimer = setTimeout(() => setIsAnimated(true), 100);
      const markerTimer = setTimeout(() => setShowMarkers(true), 600);
      return () => {
        clearTimeout(curveTimer);
        clearTimeout(markerTimer);
      };
    }
  }, [open]);

  // Calculate all scenarios including handover
  const scenarios = useMemo(() => {
    const allScenarios = exitScenarios.map(months => ({
      months,
      ...calculateExitScenario(months, basePrice, totalMonths, inputs, totalEntryCosts),
      isHandover: months >= totalMonths,
    }));
    
    // Add handover if not already included
    if (!allScenarios.some(s => s.months >= totalMonths)) {
      allScenarios.push({
        months: totalMonths,
        ...calculateExitScenario(totalMonths, basePrice, totalMonths, inputs, totalEntryCosts),
        isHandover: true,
      });
    }
    
    return allScenarios.sort((a, b) => a.months - b.months);
  }, [exitScenarios, basePrice, totalMonths, inputs, totalEntryCosts]);

  const maxExitPrice = Math.max(...scenarios.map(s => s.exitPrice));
  const minValue = basePrice * 0.95;
  const maxValue = maxExitPrice * 1.1;

  // SVG dimensions
  const width = 650;
  const height = 280;
  const padding = { top: 40, right: 40, bottom: 50, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (months: number) => padding.left + (months / totalMonths) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

  // Path length for animation
  const pathLength = useMemo(() => chartWidth * 1.5, [chartWidth]);

  // Generate appreciation curve path
  const generateCurvePath = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const handoverPrice = scenarios.find(s => s.isHandover)?.exitPrice || maxExitPrice;
    const totalAppreciation = handoverPrice - basePrice;
    
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const month = progress * totalMonths;
      const curveProgress = Math.pow(progress, 0.7);
      const price = basePrice + (totalAppreciation * curveProgress);
      points.push({ x: month, y: price });
    }
    
    let path = `M ${xScale(points[0].x)} ${yScale(points[0].y)}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${xScale(points[i].x)} ${yScale(points[i].y)}`;
    }
    
    return path;
  }, [scenarios, basePrice, totalMonths, xScale, yScale, maxExitPrice]);

  // Y-axis values
  const yAxisValues = useMemo(() => {
    const range = maxValue - minValue;
    const step = range / 4;
    return Array.from({ length: 5 }, (_, i) => minValue + step * i);
  }, [minValue, maxValue]);

  // X-axis labels
  const timeLabels = useMemo(() => {
    const labels: number[] = [];
    for (let m = 0; m <= totalMonths; m += Math.ceil(totalMonths / 6)) {
      labels.push(m);
    }
    if (labels[labels.length - 1] !== totalMonths) {
      labels.push(totalMonths);
    }
    return labels;
  }, [totalMonths]);

  const bestROE = Math.max(...scenarios.map(s => s.annualizedROE));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-theme-card border-theme-border">
        <DialogHeader>
          <DialogTitle className="text-theme-text">Exit Scenarios Analysis</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="exitCurveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#CCFF00" />
                <stop offset="100%" stopColor="#22d3d1" />
              </linearGradient>
              
              <linearGradient id="exitAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#CCFF00" stopOpacity="0" />
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
                opacity="0.3"
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
                opacity="0.2"
              />
            ))}

            {/* X-axis labels */}
            {timeLabels.map(months => (
              <text
                key={`label-${months}`}
                x={xScale(months)}
                y={height - padding.bottom + 16}
                fill="hsl(var(--theme-text-muted))"
                fontSize="10"
                textAnchor="middle"
              >
                {months === totalMonths ? 'Handover' : `${months}mo`}
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
              strokeDasharray="6,4"
              opacity="0.6"
            />
            <text
              x={padding.left + 5}
              y={yScale(basePrice) - 8}
              fill="#64748b"
              fontSize="10"
            >
              Base Price: {formatCurrencyShort(basePrice, currency, rate)}
            </text>

            {/* Area fill under curve */}
            <path
              d={`${generateCurvePath} L ${xScale(totalMonths)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`}
              fill="url(#exitAreaGradient)"
              style={{
                opacity: isAnimated ? 1 : 0,
                transition: 'opacity 0.6s ease-out 0.3s'
              }}
            />

            {/* Appreciation curve */}
            <path
              d={generateCurvePath}
              fill="none"
              stroke="url(#exitCurveGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                strokeDasharray: pathLength,
                strokeDashoffset: isAnimated ? 0 : pathLength,
                transition: 'stroke-dashoffset 1s ease-out'
              }}
            />

            {/* Exit markers */}
            {scenarios.map((scenario, index) => {
              const isBest = scenario.annualizedROE === bestROE;
              const markerDelay = 0.1 * index;
              
              return (
                <g 
                  key={scenario.months}
                  style={{ 
                    opacity: showMarkers ? 1 : 0,
                    transition: `opacity 0.3s ease-out ${markerDelay}s`
                  }}
                >
                  {/* Vertical line to marker */}
                  <line
                    x1={xScale(scenario.months)}
                    y1={yScale(scenario.exitPrice)}
                    x2={xScale(scenario.months)}
                    y2={height - padding.bottom}
                    stroke={scenario.isHandover ? '#ffffff' : '#CCFF00'}
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.4"
                  />
                  
                  {/* Exit label */}
                  <text
                    x={xScale(scenario.months)}
                    y={yScale(scenario.exitPrice) - 36}
                    fill={scenario.isHandover ? '#ffffff' : '#CCFF00'}
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {scenario.isHandover ? 'Handover' : `Exit ${index + 1}`}
                  </text>
                  
                  {/* Price label */}
                  <text
                    x={xScale(scenario.months)}
                    y={yScale(scenario.exitPrice) - 24}
                    fill={scenario.isHandover ? '#ffffff' : '#CCFF00'}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {formatCurrencyShort(scenario.exitPrice, currency, rate)}
                  </text>

                  {/* ROE label */}
                  <text
                    x={xScale(scenario.months)}
                    y={yScale(scenario.exitPrice) - 10}
                    fill={isBest ? '#fbbf24' : '#22d3d1'}
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {scenario.trueROE.toFixed(0)}% ROE {isBest && '★'}
                  </text>
                  
                  {/* Marker circles */}
                  <circle
                    cx={xScale(scenario.months)}
                    cy={yScale(scenario.exitPrice)}
                    r={scenario.isHandover ? 9 : 7}
                    fill="hsl(var(--theme-card))"
                    stroke={scenario.isHandover ? '#ffffff' : '#CCFF00'}
                    strokeWidth={isBest ? 3 : 2}
                  />
                  <circle
                    cx={xScale(scenario.months)}
                    cy={yScale(scenario.exitPrice)}
                    r={scenario.isHandover ? 4 : 3}
                    fill={scenario.isHandover ? '#ffffff' : '#CCFF00'}
                  />
                </g>
              );
            })}
          </svg>

          {/* Legend - compact grid below chart */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {scenarios.map((scenario, index) => {
              const isBest = scenario.annualizedROE === bestROE;
              return (
                <div 
                  key={scenario.months}
                  className={`p-2.5 rounded-lg text-center border ${
                    isBest 
                      ? 'bg-yellow-500/10 border-yellow-500/30' 
                      : scenario.isHandover 
                        ? 'bg-white/5 border-white/20'
                        : 'bg-theme-bg/50 border-theme-border'
                  }`}
                >
                  <div className={`text-xs font-medium mb-0.5 ${
                    scenario.isHandover ? 'text-white' : 'text-theme-accent'
                  }`}>
                    {scenario.isHandover ? 'Handover' : `Exit ${index + 1}`}
                    {isBest && <span className="ml-1 text-yellow-400">★</span>}
                  </div>
                  <div className="text-sm font-bold font-mono text-theme-text">
                    {formatCurrencyShort(scenario.exitPrice, currency, rate)}
                  </div>
                  <div className={`text-xs font-bold ${
                    scenario.trueROE >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {scenario.trueROE.toFixed(0)}% ROE
                  </div>
                  <div className="text-[10px] text-theme-text-muted">
                    {scenario.months} months
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
