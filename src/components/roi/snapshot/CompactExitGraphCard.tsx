import { useMemo } from 'react';
import { TrendingUp, Key, Hammer, Rocket, Shield, ArrowRight } from 'lucide-react';
import { OIInputs, OICalculations } from '../useOICalculations';
import { Currency, formatCurrency, formatDualCurrency, formatCurrencyShort } from '../currencyUtils';
import { monthToConstruction, calculateExitPrice, calculateExitScenario } from '../constructionProgress';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompactExitGraphCardProps {
  inputs: OIInputs;
  calculations: OICalculations;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
}

const getDateFromMonths = (months: number, bookingMonth: number, bookingYear: number): string => {
  const totalMonthsFromJan = bookingMonth + months;
  const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
  const month = ((totalMonthsFromJan - 1) % 12) + 1;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1]}'${(bookingYear + yearOffset).toString().slice(-2)}`;
};

// Smart label positioning to avoid overlaps
const calculateLabelPosition = (
  exitMonth: number, 
  allExits: number[], 
  handoverMonth: number,
  index: number
): { xOffset: number; textAnchor: 'start' | 'middle' | 'end'; yOffset: number } => {
  const distanceFromHandover = Math.abs(exitMonth - handoverMonth);
  const isBeforeHandover = exitMonth < handoverMonth;
  
  // Check proximity to handover (within 3 months)
  if (distanceFromHandover <= 3 && distanceFromHandover > 0) {
    return {
      xOffset: isBeforeHandover ? -30 : 30,
      textAnchor: isBeforeHandover ? 'end' : 'start',
      yOffset: 0
    };
  }
  
  // Check proximity to other exits
  const nearbyExits = allExits.filter((m, i) => 
    i !== index && Math.abs(m - exitMonth) <= 4
  );
  
  if (nearbyExits.length > 0) {
    // Stagger vertically
    const sortedExits = [...allExits].sort((a, b) => a - b);
    const position = sortedExits.indexOf(exitMonth);
    return {
      xOffset: 0,
      textAnchor: 'middle',
      yOffset: (position % 2) * 18
    };
  }
  
  return { xOffset: 0, textAnchor: 'middle', yOffset: 0 };
};

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
  
  // Dual currency helper
  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };
  
  // Chart dimensions - larger and more imposing
  const width = 400;
  const height = 200;
  const padding = { top: 25, right: 15, bottom: 20, left: 35 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate chart max month
  const maxExitMonth = exitScenarios.length > 0 ? Math.max(...exitScenarios, totalMonths) : totalMonths;
  const chartMaxMonth = Math.max(totalMonths + 6, maxExitMonth + 3);
  
  // Scale functions
  const xScale = (months: number) => padding.left + (months / chartMaxMonth) * chartWidth;
  const maxChartPrice = basePrice > 0 ? calculateExitPrice(chartMaxMonth, basePrice, totalMonths, inputs) : 0;
  const maxValue = maxChartPrice * 1.08;
  const minValue = basePrice * 0.92;
  const yScale = (value: number) => {
    if (maxValue === minValue) return padding.top + chartHeight / 2;
    return padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
  };
  
  // Generate smooth curve path
  const curvePath = useMemo(() => {
    if (basePrice <= 0) return '';
    const points: { x: number; y: number }[] = [];
    const steps = 30;
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
  }, [basePrice, totalMonths, chartMaxMonth, inputs, xScale, yScale]);
  
  // Calculate handover price
  const handoverPrice = basePrice > 0 ? calculateExitPrice(totalMonths, basePrice, totalMonths, inputs) : 0;
  
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
      const monthsAfterHandover = isPostHandover ? exitMonths - totalMonths : 0;
      const dateStr = getDateFromMonths(exitMonths, inputs.bookingMonth, inputs.bookingYear);
      const constructionPct = Math.min(100, monthToConstruction(exitMonths, totalMonths));
      
      const labelPos = calculateLabelPosition(exitMonths, exitScenarios, totalMonths, index);
      
      return {
        exitMonths,
        exitPrice: scenarioResult.exitPrice,
        totalCapitalDeployed: scenarioResult.totalCapital,
        trueProfit: scenarioResult.trueProfit,
        trueROE: scenarioResult.trueROE,
        annualizedROE: scenarioResult.annualizedROE,
        isPostHandover,
        isHandover,
        monthsAfterHandover,
        dateStr,
        constructionPct,
        exitNumber: index + 1,
        initialValue: basePrice,
        labelPos,
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
      
      {/* Inline Graph */}
      <div className="px-2 pt-1">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="chartBgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
            </linearGradient>
            <linearGradient id="exitCurveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CCFF00" />
              <stop offset={`${(totalMonths / chartMaxMonth) * 100}%`} stopColor="#CCFF00" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <linearGradient id="exitAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#CCFF00" stopOpacity="0" />
            </linearGradient>
            <filter id="glowExit" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Dark gradient background for chart area */}
          <rect
            x={padding.left}
            y={padding.top}
            width={chartWidth}
            height={chartHeight}
            rx="8"
            fill="url(#chartBgGradient)"
          />
          
          {/* Base price reference line */}
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
          <text
            x={padding.left + 3}
            y={yScale(basePrice) - 4}
            fill="#64748b"
            fontSize="7"
          >
            Base
          </text>
          
          {/* Handover vertical line */}
          <line
            x1={xScale(totalMonths)}
            y1={padding.top - 5}
            x2={xScale(totalMonths)}
            y2={height - padding.bottom}
            stroke="#fff"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.3"
          />
          
          {/* Area fill */}
          <path
            d={`${curvePath} L ${xScale(chartMaxMonth)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`}
            fill="url(#exitAreaGradient)"
          />
          
          {/* Curve - thicker stroke */}
          <path
            d={curvePath}
            fill="none"
            stroke="url(#exitCurveGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Handover marker (🔑) */}
          <g>
            <circle
              cx={xScale(totalMonths)}
              cy={yScale(handoverPrice)}
              r="6"
              fill="#fff"
              stroke="#fff"
              strokeWidth="1.5"
              filter="url(#glowExit)"
            />
            <circle
              cx={xScale(totalMonths)}
              cy={yScale(handoverPrice)}
              r="3"
              fill="#000"
            />
            <text
              x={xScale(totalMonths)}
              y={yScale(handoverPrice) - 12}
              fill="#fff"
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
            >
              🔑
            </text>
          </g>
          
          {/* Exit markers */}
          {scenarios.map((scenario, index) => {
            if (scenario.isHandover) return null;
            
            const markerColor = scenario.isPostHandover ? '#22c55e' : '#CCFF00';
            const { xOffset, textAnchor, yOffset } = scenario.labelPos;
            
            return (
              <g key={scenario.exitMonths}>
                {/* Marker circles */}
                <circle
                  cx={xScale(scenario.exitMonths)}
                  cy={yScale(scenario.exitPrice)}
                  r="7"
                  fill={markerColor}
                  opacity="0.2"
                />
                <circle
                  cx={xScale(scenario.exitMonths)}
                  cy={yScale(scenario.exitPrice)}
                  r="4"
                  fill={markerColor}
                  filter="url(#glowExit)"
                />
                
                {/* Label with background pill */}
                <rect
                  x={xScale(scenario.exitMonths) + xOffset - 18}
                  y={yScale(scenario.exitPrice) - 26 - yOffset}
                  width="36"
                  height="14"
                  rx="3"
                  fill="rgba(0,0,0,0.6)"
                />
                <text
                  x={xScale(scenario.exitMonths) + xOffset}
                  y={yScale(scenario.exitPrice) - 16 - yOffset}
                  fill={markerColor}
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  #{scenario.exitNumber} {scenario.exitMonths}m
                </text>
              </g>
            );
          })}
          
          {/* X-axis labels */}
          <text x={padding.left} y={height - 8} fill="#64748b" fontSize="7" textAnchor="start">0m</text>
          <text x={xScale(totalMonths)} y={height - 8} fill="#fff" fontSize="7" textAnchor="middle" fontWeight="bold">HO</text>
          {chartMaxMonth > totalMonths + 6 && (
            <text x={width - padding.right} y={height - 8} fill="#64748b" fontSize="7" textAnchor="end">{chartMaxMonth}m</text>
          )}
        </svg>
      </div>
      
      {/* Horizontal Exit Cards */}
      <div className="p-2 pt-1">
        <div className={cn(
          "grid gap-1.5",
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
                  "bg-gradient-to-br from-black/50 to-black/30 backdrop-blur-md",
                  "border border-white/10 rounded-xl shadow-lg p-2 text-center",
                  "border-l-2",
                  isHandover 
                    ? "border-l-white"
                    : scenario.isPostHandover 
                      ? "border-l-green-500" 
                      : "border-l-theme-accent"
                )}
              >
                {/* Exit Number + Months */}
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  {isHandover ? (
                    <Key className="w-3 h-3 text-white" />
                  ) : (
                    <span className="text-[9px] font-bold text-theme-accent">
                      #{scenario.exitNumber}
                    </span>
                  )}
                  <span className="text-[10px] text-theme-text-muted">
                    {scenario.exitMonths}m
                  </span>
                </div>
                
                {/* Hero ROE - Big & Bold */}
                <span className={cn(
                  "text-xl font-black font-mono block",
                  scenario.trueROE >= 20 ? "text-green-400" : 
                  scenario.trueROE >= 10 ? "text-theme-accent" : 
                  scenario.trueROE >= 0 ? "text-amber-400" : "text-red-400"
                )}>
                  {scenario.trueROE?.toFixed(0) ?? 0}%
                </span>
                <span className="text-[7px] text-theme-text-muted uppercase tracking-wide">ROE</span>
                
                {/* Profit */}
                <div className="mt-1 pt-1 border-t border-white/10">
                  <span className={cn(
                    "text-[10px] font-bold",
                    scenario.trueProfit >= 0 ? "text-green-400/80" : "text-red-400/80"
                  )}>
                    {scenario.trueProfit >= 0 ? '+' : ''}{formatCurrencyShort(scenario.trueProfit, 'AED' as Currency)}
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
