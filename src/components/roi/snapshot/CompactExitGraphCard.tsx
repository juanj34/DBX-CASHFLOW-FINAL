import { useMemo } from 'react';
import { TrendingUp, Key } from 'lucide-react';
import { OIInputs, OICalculations } from '../useOICalculations';
import { Currency, formatCurrencyShort } from '../currencyUtils';
import { calculateExitPrice, calculateExitScenario } from '../constructionProgress';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompactExitGraphCardProps {
  inputs: OIInputs;
  calculations: OICalculations;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
}

export const CompactExitGraphCard = ({
  inputs,
  calculations,
  exitScenarios,
  currency,
  rate,
}: CompactExitGraphCardProps) => {
  const { t } = useLanguage();
  
  const basePrice = inputs.basePrice || calculations.basePrice || 0;
  const totalMonths = calculations.totalMonths;
  
  // Chart dimensions - proper size for labels
  const width = 420;
  const height = 200;
  const padding = { top: 35, right: 30, bottom: 45, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate chart max month
  const maxExitMonth = exitScenarios.length > 0 ? Math.max(...exitScenarios, totalMonths) : totalMonths;
  const chartMaxMonth = Math.max(totalMonths + 6, maxExitMonth + 3);
  
  // Scale functions
  const xScale = (months: number) => padding.left + (months / chartMaxMonth) * chartWidth;
  const maxChartPrice = basePrice > 0 ? calculateExitPrice(chartMaxMonth, basePrice, totalMonths, inputs) : 0;
  const maxValue = maxChartPrice * 1.1;
  const minValue = basePrice * 0.95;
  const yScale = (value: number) => {
    if (maxValue === minValue) return padding.top + chartHeight / 2;
    return padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
  };
  
  // Y-axis values (5 ticks)
  const yAxisValues = useMemo(() => {
    const range = maxValue - minValue;
    const step = range / 4;
    return Array.from({ length: 5 }, (_, i) => minValue + step * i);
  }, [minValue, maxValue]);
  
  // X-axis labels
  const xAxisLabels = useMemo(() => {
    const labels: number[] = [0];
    const step = Math.max(2, Math.ceil(chartMaxMonth / 6));
    for (let m = step; m < chartMaxMonth; m += step) {
      labels.push(m);
    }
    // Ensure handover month is included
    if (!labels.includes(totalMonths)) {
      labels.push(totalMonths);
    }
    return labels.sort((a, b) => a - b);
  }, [chartMaxMonth, totalMonths]);
  
  // Generate smooth curve path
  const curvePath = useMemo(() => {
    if (basePrice <= 0) return '';
    const points: { x: number; y: number }[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const month = progress * chartMaxMonth;
      const price = calculateExitPrice(month, basePrice, totalMonths, inputs);
      points.push({ x: month, y: price });
    }
    
    let path = `M ${xScale(points[0].x)} ${yScale(points[0].y)}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${xScale(points[i].x)} ${yScale(points[i].y)}`;
    }
    
    return path;
  }, [basePrice, totalMonths, chartMaxMonth, inputs]);
  
  // Calculate scenarios
  const scenarios = useMemo(() => {
    if (basePrice <= 0) return [];
    return exitScenarios.map((exitMonths, index) => {
      const scenarioResult = calculateExitScenario(
        exitMonths,
        basePrice,
        totalMonths,
        inputs,
        calculations.totalEntryCosts
      );
      
      const isPostHandover = exitMonths > totalMonths;
      const isHandover = Math.abs(exitMonths - totalMonths) <= 1;
      
      return {
        exitMonths,
        exitPrice: scenarioResult.exitPrice,
        totalCapitalDeployed: scenarioResult.totalCapital,
        trueProfit: scenarioResult.trueProfit,
        trueROE: scenarioResult.trueROE,
        annualizedROE: scenarioResult.annualizedROE,
        isPostHandover,
        isHandover,
        exitNumber: index + 1,
      };
    });
  }, [exitScenarios, basePrice, totalMonths, inputs, calculations.totalEntryCosts]);
  
  // Early returns AFTER all hooks
  if (basePrice <= 0 || exitScenarios.length === 0) {
    return null;
  }
  
  // Check if we have at least one valid scenario
  const hasValidScenarios = scenarios.some(s => s.totalCapitalDeployed > 0 && s.exitPrice > 0);
  if (!hasValidScenarios) {
    return null;
  }

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center gap-2 flex-shrink-0">
        <TrendingUp className="w-4 h-4 text-green-400" />
        <span className="text-xs font-semibold text-theme-text uppercase tracking-wide">{t('exitScenariosHeader')}</span>
      </div>
      
      {/* Graph */}
      <div className="px-2 py-3">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="exitCurveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--theme-accent))" />
              <stop offset={`${(totalMonths / chartMaxMonth) * 100}%`} stopColor="hsl(var(--theme-accent))" />
              <stop offset="100%" stopColor="hsl(142.1 76.2% 36.3%)" />
            </linearGradient>
            <linearGradient id="exitAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--theme-accent))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--theme-accent))" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Y-axis grid lines and labels */}
          {yAxisValues.map((value, i) => (
            <g key={`y-${i}`}>
              <line
                x1={padding.left}
                y1={yScale(value)}
                x2={width - padding.right}
                y2={yScale(value)}
                stroke="hsl(var(--theme-border))"
                strokeDasharray="3,3"
                opacity="0.3"
              />
              <text
                x={padding.left - 8}
                y={yScale(value)}
                fill="hsl(var(--theme-text-muted))"
                fontSize="9"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {formatCurrencyShort(value, 'AED')}
              </text>
            </g>
          ))}
          
          {/* Base price horizontal dashed line */}
          <line
            x1={padding.left}
            y1={yScale(basePrice)}
            x2={width - padding.right}
            y2={yScale(basePrice)}
            stroke="hsl(var(--theme-text-muted))"
            strokeWidth="1.5"
            strokeDasharray="6,4"
            opacity="0.6"
          />
          <rect
            x={padding.left + 5}
            y={yScale(basePrice) - 14}
            width="58"
            height="14"
            rx="3"
            fill="hsl(var(--theme-bg))"
            opacity="0.9"
          />
          <text
            x={padding.left + 8}
            y={yScale(basePrice) - 4}
            fill="hsl(var(--theme-text-muted))"
            fontSize="9"
            fontWeight="500"
          >
            Base: {formatCurrencyShort(basePrice, 'AED')}
          </text>
          
          {/* Handover vertical line */}
          <line
            x1={xScale(totalMonths)}
            y1={padding.top}
            x2={xScale(totalMonths)}
            y2={height - padding.bottom}
            stroke="hsl(var(--theme-text-muted))"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.5"
          />
          
          {/* Area fill */}
          <path
            d={`${curvePath} L ${xScale(chartMaxMonth)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`}
            fill="url(#exitAreaGradient)"
          />
          
          {/* Curve */}
          <path
            d={curvePath}
            fill="none"
            stroke="url(#exitCurveGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          
          {/* X-axis labels */}
          {xAxisLabels.map(months => {
            const isHandover = months === totalMonths;
            return (
              <text
                key={months}
                x={xScale(months)}
                y={height - padding.bottom + 18}
                fill={isHandover ? "hsl(var(--theme-text))" : "hsl(var(--theme-text-muted))"}
                fontSize="9"
                fontWeight={isHandover ? "bold" : "normal"}
                textAnchor="middle"
              >
                {isHandover ? `🔑 ${months}m` : `${months}m`}
              </text>
            );
          })}
          
          {/* Exit markers on curve */}
          {scenarios.map((scenario) => {
            const x = xScale(scenario.exitMonths);
            const y = yScale(scenario.exitPrice);
            const isHandover = scenario.isHandover;
            const markerColor = isHandover 
              ? '#ffffff' 
              : scenario.isPostHandover 
                ? 'hsl(142.1 76.2% 36.3%)' 
                : 'hsl(var(--theme-accent))';
            
            return (
              <g key={scenario.exitMonths}>
                {/* Vertical dashed line from marker to X-axis */}
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke={markerColor}
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity="0.4"
                />
                
                {/* Outer glow circle */}
                <circle cx={x} cy={y} r="8" fill={markerColor} opacity="0.15" />
                
                {/* Marker ring */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r="6" 
                  fill="hsl(var(--theme-card))" 
                  stroke={markerColor} 
                  strokeWidth="2" 
                />
                
                {/* Inner dot */}
                <circle cx={x} cy={y} r="2.5" fill={markerColor} />
                
                {/* Value label above marker */}
                <rect
                  x={x - 24}
                  y={y - 26}
                  width="48"
                  height="16"
                  rx="4"
                  fill="hsl(var(--theme-bg))"
                  stroke={markerColor}
                  strokeWidth="1"
                  opacity="0.95"
                />
                <text
                  x={x}
                  y={y - 15}
                  fill="hsl(var(--theme-text))"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {formatCurrencyShort(scenario.exitPrice, 'AED')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Exit Cards */}
      <div className="p-2 pt-0">
        <div className={cn(
          "grid gap-2",
          scenarios.length === 2 ? "grid-cols-2" : 
          scenarios.length <= 4 ? "grid-cols-4" : 
          "grid-cols-5"
        )}>
          {scenarios.map((scenario) => {
            const isHandover = scenario.isHandover;
            
            return (
              <div 
                key={scenario.exitMonths}
                className={cn(
                  "bg-theme-bg/80 border rounded-xl p-2.5 text-center transition-all",
                  "hover:scale-[1.02] hover:shadow-md",
                  isHandover 
                    ? "border-white/50 bg-white/5" 
                    : scenario.isPostHandover 
                      ? "border-green-500/30 hover:border-green-500/50" 
                      : "border-theme-border hover:border-theme-accent/50"
                )}
              >
                {/* Exit Number + Months */}
                <div className="flex items-center justify-center gap-1 mb-1">
                  {isHandover ? (
                    <Key className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <span className={cn(
                      "text-[10px] font-bold",
                      scenario.isPostHandover ? "text-green-400" : "text-theme-accent"
                    )}>
                      #{scenario.exitNumber}
                    </span>
                  )}
                  <span className="text-[11px] text-theme-text-muted font-medium">
                    {scenario.exitMonths}m
                  </span>
                </div>
                
                {/* Hero ROE - Big & Bold */}
                <span className={cn(
                  "text-2xl font-black font-mono block leading-tight",
                  scenario.trueROE >= 20 ? "text-green-400" : 
                  scenario.trueROE >= 10 ? "text-theme-accent" : 
                  scenario.trueROE >= 0 ? "text-amber-400" : "text-red-400"
                )}>
                  {scenario.trueROE?.toFixed(0) ?? 0}%
                </span>
                <span className="text-[8px] text-theme-text-muted uppercase tracking-wider font-medium">ROE</span>
                
                {/* Profit */}
                <div className="mt-1.5 pt-1.5 border-t border-theme-border/50">
                  <span className={cn(
                    "text-[11px] font-bold",
                    scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {scenario.trueProfit >= 0 ? '+' : ''}{formatCurrencyShort(scenario.trueProfit, 'AED')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
