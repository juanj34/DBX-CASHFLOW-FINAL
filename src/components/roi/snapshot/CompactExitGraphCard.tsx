import { useMemo } from 'react';
import { TrendingUp, Key, ArrowRight } from 'lucide-react';
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
  
  // Chart dimensions - clean and minimal
  const width = 400;
  const height = 120;
  const padding = { top: 25, right: 20, bottom: 30, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate chart max month
  const maxExitMonth = exitScenarios.length > 0 ? Math.max(...exitScenarios, totalMonths) : totalMonths;
  const chartMaxMonth = Math.max(totalMonths + 6, maxExitMonth + 3);
  
  // Scale functions
  const xScale = (months: number) => padding.left + (months / chartMaxMonth) * chartWidth;
  const maxChartPrice = basePrice > 0 ? calculateExitPrice(chartMaxMonth, basePrice, totalMonths, inputs) : 0;
  const maxValue = maxChartPrice * 1.08;
  const minValue = basePrice * 0.95;
  const yScale = (value: number) => {
    if (maxValue === minValue) return padding.top + chartHeight / 2;
    return padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
  };
  
  // Handover price
  const handoverPrice = basePrice > 0 ? calculateExitPrice(totalMonths, basePrice, totalMonths, inputs) : 0;
  
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
      const netGain = scenarioResult.exitPrice - basePrice;
      const gainPercent = basePrice > 0 ? (netGain / basePrice) * 100 : 0;
      
      // Label for the exit
      let exitLabel = '';
      if (isHandover) {
        exitLabel = 'Handover';
      } else if (isPostHandover) {
        const yearsAfter = Math.round((exitMonths - totalMonths) / 12);
        exitLabel = yearsAfter > 0 ? `+${yearsAfter}Y Post` : `+${exitMonths - totalMonths}m`;
      } else {
        exitLabel = `${exitMonths}m`;
      }
      
      return {
        exitMonths,
        exitPrice: scenarioResult.exitPrice,
        netGain,
        gainPercent,
        isPostHandover,
        isHandover,
        exitNumber: index + 1,
        exitLabel,
      };
    });
  }, [exitScenarios, basePrice, totalMonths, inputs, calculations.totalEntryCosts]);
  
  // Early returns AFTER all hooks
  if (basePrice <= 0 || exitScenarios.length === 0) {
    return null;
  }
  
  const hasValidScenarios = scenarios.some(s => s.exitPrice > 0);
  if (!hasValidScenarios) {
    return null;
  }

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden">
      {/* Header - Simple */}
      <div className="px-4 py-3 border-b border-theme-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-theme-accent" />
          <span className="text-sm font-semibold text-theme-text">Asset Value Growth</span>
        </div>
        <p className="text-xs text-theme-text-muted mt-0.5">From purchase to exit</p>
      </div>
      
      {/* Clean Graph - Only shows value evolution */}
      <div className="px-3 py-4">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="valueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--theme-accent))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="areaFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--theme-accent))" stopOpacity="0.15" />
              <stop offset="100%" stopColor="hsl(var(--theme-accent))" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Subtle baseline */}
          <line
            x1={padding.left}
            y1={yScale(basePrice)}
            x2={width - padding.right}
            y2={yScale(basePrice)}
            stroke="hsl(var(--theme-text-muted))"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.3"
          />
          
          {/* Area fill */}
          <path
            d={`${curvePath} L ${xScale(chartMaxMonth)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`}
            fill="url(#areaFill)"
          />
          
          {/* Main curve - clean single line */}
          <path
            d={curvePath}
            fill="none"
            stroke="url(#valueGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          
          {/* Base price marker (start) */}
          <g>
            <circle cx={xScale(0)} cy={yScale(basePrice)} r="4" fill="hsl(var(--theme-text-muted))" />
            <text
              x={xScale(0)}
              y={yScale(basePrice) - 10}
              fill="hsl(var(--theme-text-muted))"
              fontSize="9"
              fontWeight="600"
              textAnchor="middle"
            >
              Base
            </text>
          </g>
          
          {/* Handover marker */}
          <g>
            <circle cx={xScale(totalMonths)} cy={yScale(handoverPrice)} r="5" fill="hsl(var(--theme-accent))" />
            <text
              x={xScale(totalMonths)}
              y={height - 8}
              fill="hsl(var(--theme-text))"
              fontSize="9"
              fontWeight="600"
              textAnchor="middle"
            >
              🔑 Handover
            </text>
          </g>
          
          {/* Exit markers - small dots only */}
          {scenarios.map((scenario) => {
            if (scenario.isHandover) return null; // Already shown
            const x = xScale(scenario.exitMonths);
            const y = yScale(scenario.exitPrice);
            
            return (
              <g key={scenario.exitMonths}>
                <circle cx={x} cy={y} r="4" fill="hsl(142.1 76.2% 36.3%)" />
                <text
                  x={x}
                  y={height - 8}
                  fill="hsl(var(--theme-text-muted))"
                  fontSize="8"
                  textAnchor="middle"
                >
                  #{scenario.exitNumber}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* EXIT CARDS - The star of the show */}
      <div className="p-3 pt-0 space-y-2">
        {scenarios.map((scenario) => (
          <div 
            key={scenario.exitMonths}
            className={cn(
              "bg-theme-bg border rounded-lg p-3",
              scenario.isHandover 
                ? "border-theme-accent/50" 
                : "border-theme-border"
            )}
          >
            {/* Exit Title */}
            <div className="flex items-center gap-2 mb-2">
              {scenario.isHandover ? (
                <Key className="w-4 h-4 text-theme-accent" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center">
                  {scenario.exitNumber}
                </span>
              )}
              <span className="text-sm font-semibold text-theme-text">
                EXIT {scenario.exitNumber} — {scenario.exitLabel}
              </span>
              <span className="text-xs text-theme-text-muted ml-auto">
                {scenario.exitMonths}m
              </span>
            </div>
            
            {/* Price comparison row */}
            <div className="flex items-center gap-3 text-sm mb-2">
              <div className="flex-1">
                <span className="text-theme-text-muted text-xs block">Base price</span>
                <span className="text-theme-text font-medium">{formatCurrencyShort(basePrice, 'AED')}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-theme-text-muted" />
              <div className="flex-1">
                <span className="text-theme-text-muted text-xs block">Exit value</span>
                <span className="text-theme-text font-medium">{formatCurrencyShort(scenario.exitPrice, 'AED')}</span>
              </div>
            </div>
            
            {/* Separator */}
            <div className="border-t border-theme-border my-2" />
            
            {/* NET GAIN - Big and prominent */}
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-theme-text-muted uppercase tracking-wide">Net Gain</span>
              <div className="text-right">
                <span className={cn(
                  "text-xl font-bold",
                  scenario.netGain >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {scenario.netGain >= 0 ? '+' : ''}{formatCurrencyShort(scenario.netGain, 'AED')}
                </span>
                <span className={cn(
                  "text-sm font-semibold ml-2",
                  scenario.netGain >= 0 ? "text-green-400/70" : "text-red-400/70"
                )}>
                  ({scenario.netGain >= 0 ? '+' : ''}{scenario.gainPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
