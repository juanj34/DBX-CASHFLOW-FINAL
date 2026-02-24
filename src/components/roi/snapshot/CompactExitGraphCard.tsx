import { useMemo, useState } from 'react';
import { TrendingUp, Key, ChevronDown } from 'lucide-react';
import { OIInputs, OICalculations } from '../useOICalculations';
import { Currency, formatCurrencyShort } from '../currencyUtils';
import { calculateExitPrice, calculateExitScenario } from '../constructionProgress';
import { cn } from '@/lib/utils';

interface CompactExitGraphCardProps {
  inputs: OIInputs;
  calculations: OICalculations;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
  embedded?: boolean;
}

export const CompactExitGraphCard = ({
  inputs,
  calculations,
  exitScenarios,
  currency,
  rate,
  embedded = false,
}: CompactExitGraphCardProps) => {
  const [hoverData, setHoverData] = useState<{ x: number; y: number; month: number; price: number } | null>(null);
  const [hoveredExitIndex, setHoveredExitIndex] = useState<number | null>(null);
  const [expandedExit, setExpandedExit] = useState<number | null>(null);

  const basePrice = inputs.basePrice || calculations.basePrice || 0;
  const totalMonths = calculations.totalMonths;

  // Chart dimensions - larger for better visibility
  const width = 440;
  const height = 200;
  const padding = { top: 30, right: 25, bottom: 35, left: 60 };
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

  // Handover price
  const handoverPrice = basePrice > 0 ? calculateExitPrice(totalMonths, basePrice, totalMonths, inputs) : 0;

  // Y-axis ticks (5 values)
  const yAxisTicks = useMemo(() => {
    if (basePrice <= 0) return [];
    const range = maxValue - minValue;
    const step = range / 4;
    return Array.from({ length: 5 }, (_, i) => minValue + step * i).reverse();
  }, [minValue, maxValue, basePrice]);

  // X-axis labels
  const xAxisLabels = useMemo(() => {
    const labels: { month: number; label: string; isHandover: boolean }[] = [];
    labels.push({ month: 0, label: '0', isHandover: false });

    // Add some intermediate points
    const step = Math.max(Math.floor(chartMaxMonth / 5), 3);
    for (let m = step; m < chartMaxMonth; m += step) {
      if (Math.abs(m - totalMonths) > 2) {
        labels.push({ month: m, label: `${m}m`, isHandover: false });
      }
    }

    // Always add handover
    labels.push({ month: totalMonths, label: `🔑 ${totalMonths}m`, isHandover: true });

    return labels.sort((a, b) => a.month - b.month);
  }, [chartMaxMonth, totalMonths]);

  // Generate smooth curve path and points for hover
  const { curvePath, curvePoints } = useMemo(() => {
    if (basePrice <= 0) return { curvePath: '', curvePoints: [] };
    const points: { x: number; y: number; month: number; price: number }[] = [];
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const month = progress * chartMaxMonth;
      const price = calculateExitPrice(month, basePrice, totalMonths, inputs);
      points.push({
        x: xScale(month),
        y: yScale(price),
        month,
        price
      });
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return { curvePath: path, curvePoints: points };
  }, [basePrice, totalMonths, chartMaxMonth, inputs]);

  // Calculate scenarios with ROE + full detail for expandable cards
  const scenarios = useMemo(() => {
    if (basePrice <= 0) return [];
    return exitScenarios.map((exitMonths) => {
      const scenarioResult = calculateExitScenario(
        exitMonths,
        basePrice,
        totalMonths,
        inputs,
        calculations.totalEntryCosts
      );

      const isHandover = Math.abs(exitMonths - totalMonths) <= 1;
      const netGain = scenarioResult.exitPrice - basePrice;
      const gainPercent = basePrice > 0 ? (netGain / basePrice) * 100 : 0;

      return {
        exitMonths,
        exitPrice: scenarioResult.exitPrice,
        netGain,
        gainPercent,
        annualizedROE: scenarioResult.annualizedROE,
        equityDeployed: scenarioResult.equityDeployed,
        totalCapital: scenarioResult.totalCapital,
        entryCosts: scenarioResult.entryCosts,
        exitCosts: scenarioResult.exitCosts,
        trueProfit: scenarioResult.trueProfit,
        netProfit: scenarioResult.netProfit,
        isHandover,
      };
    });
  }, [exitScenarios, basePrice, totalMonths, inputs, calculations.totalEntryCosts]);

  // Handle mouse move on graph
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();

    // Convert mouse position into SVG viewBox coordinates
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * height;

    // 1) Curve hover (month + price)
    if (mouseX >= padding.left && mouseX <= width - padding.right) {
      // Find closest curve point by X
      let closest = curvePoints[0];
      let minDist = Math.abs(curvePoints[0]?.x - mouseX);

      for (const point of curvePoints) {
        const dist = Math.abs(point.x - mouseX);
        if (dist < minDist) {
          minDist = dist;
          closest = point;
        }
      }

      if (closest) setHoverData(closest);
    }

    // 2) Exit marker hover (bigger, proximity-based)
    const HIT_RADIUS = 22;

    let nearestIndex: number | null = null;
    let nearestDist = Infinity;

    scenarios.forEach((scenario, index) => {
      if (scenario.isHandover) return;
      const x = xScale(scenario.exitMonths);
      const y = yScale(scenario.exitPrice);
      const dx = x - mouseX;
      const dy = y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= HIT_RADIUS && dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = index;
      }
    });

    setHoveredExitIndex(nearestIndex);
  };

  const handleMouseLeave = () => {
    setHoverData(null);
    setHoveredExitIndex(null);
  };

  // Early returns AFTER all hooks
  if (basePrice <= 0 || exitScenarios.length === 0) {
    return null;
  }

  const hasValidScenarios = scenarios.some(s => s.exitPrice > 0);
  if (!hasValidScenarios) {
    return null;
  }

  const graphAndCards = (
    <>
      {/* Large Graph with Axes */}
      <div className="px-3 py-4">
        <svg
          width="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair"
        >
          <defs>
            <linearGradient id="valueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--theme-accent))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(var(--theme-accent))" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="areaFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--theme-accent))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--theme-accent))" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Y-Axis Grid Lines & Labels */}
          {yAxisTicks.map((value, i) => (
            <g key={`y-${i}`}>
              <line
                x1={padding.left}
                y1={yScale(value)}
                x2={width - padding.right}
                y2={yScale(value)}
                stroke="hsl(var(--theme-border))"
                strokeWidth="1"
                opacity="0.3"
              />
              <text
                x={padding.left - 8}
                y={yScale(value)}
                fill="hsl(var(--theme-text-muted))"
                fontSize="10"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {formatCurrencyShort(value, 'AED')}
              </text>
            </g>
          ))}

          {/* X-Axis Labels */}
          {xAxisLabels.map(({ month, label, isHandover }) => (
            <text
              key={month}
              x={xScale(month)}
              y={height - 10}
              fill={isHandover ? "hsl(var(--theme-text))" : "hsl(var(--theme-text-muted))"}
              fontSize={isHandover ? "10" : "9"}
              fontWeight={isHandover ? "600" : "normal"}
              textAnchor="middle"
            >
              {label}
            </text>
          ))}

          {/* Base Price Dashed Line */}
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

          {/* Area fill */}
          <path
            d={`${curvePath} L ${xScale(chartMaxMonth)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`}
            fill="url(#areaFill)"
          />

          {/* Main curve */}
          <path
            d={curvePath}
            fill="none"
            stroke="url(#valueGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Base marker */}
          <g>
            <circle cx={xScale(0)} cy={yScale(basePrice)} r="5" fill="hsl(var(--theme-text-muted))" />
            <text
              x={xScale(0)}
              y={height - padding.bottom + 12}
              fill="hsl(var(--theme-text-muted))"
              fontSize="8"
              textAnchor="middle"
            >
              Base
            </text>
          </g>

          {/* Handover marker */}
          <g>
            <line
              x1={xScale(totalMonths)}
              y1={yScale(handoverPrice)}
              x2={xScale(totalMonths)}
              y2={height - padding.bottom}
              stroke="hsl(var(--theme-accent))"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.5"
            />
            <circle cx={xScale(totalMonths)} cy={yScale(handoverPrice)} r="6" fill="hsl(var(--theme-accent))" />
            <circle cx={xScale(totalMonths)} cy={yScale(handoverPrice)} r="3" fill="hsl(var(--theme-card))" />
            <text
              x={xScale(totalMonths)}
              y={yScale(handoverPrice) - 12}
              fill="hsl(var(--theme-text))"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              {formatCurrencyShort(handoverPrice, 'AED')}
            </text>
          </g>

          {/* Exit markers with values */}
          {scenarios.map((scenario, index) => {
            if (scenario.isHandover) return null;
            const x = xScale(scenario.exitMonths);
            const y = yScale(scenario.exitPrice);
            const isHovered = hoveredExitIndex === index;

            return (
              <g
                key={scenario.exitMonths}
                style={{ cursor: 'pointer' }}
              >
                {/* Larger hit area */}
                <circle cx={x} cy={y} r="22" fill="transparent" pointerEvents="all" />

                {/* Vertical guide */}
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="hsl(var(--theme-accent))"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity="0.4"
                />
                {/* Marker */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 8 : 6}
                  fill="hsl(var(--theme-accent))"
                  className="transition-all duration-150"
                />
                <circle cx={x} cy={y} r={isHovered ? 4 : 3} fill="hsl(var(--theme-card))" />

                {/* Value label - hide when hovered to show tooltip */}
                {!isHovered && (
                  <text
                    x={x}
                    y={y - 12}
                    fill="hsl(var(--theme-accent))"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {formatCurrencyShort(scenario.exitPrice, 'AED')}
                  </text>
                )}

                {/* Exit number */}
                <text
                  x={x}
                  y={height - padding.bottom + 12}
                  fill="hsl(var(--theme-text-muted))"
                  fontSize="8"
                  textAnchor="middle"
                >
                  Exit {index + 1}
                </text>

                {/* Hover tooltip - detailed info */}
                {isHovered && (
                  <g pointerEvents="none">
                    <rect
                      x={x - 60}
                      y={y - 85}
                      width="120"
                      height="70"
                      rx="6"
                      fill="hsl(var(--theme-card))"
                      stroke="hsl(var(--theme-border))"
                      strokeWidth="1"
                    />
                    {/* Title */}
                    <text
                      x={x}
                      y={y - 68}
                      fill="hsl(var(--theme-text))"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Exit {index + 1} • {scenario.exitMonths}m
                    </text>
                    {/* Equity In */}
                    <text x={x - 52} y={y - 52} fill="hsl(var(--theme-text-muted))" fontSize="9">
                      Equity In:
                    </text>
                    <text x={x + 52} y={y - 52} fill="hsl(var(--theme-text))" fontSize="9" fontWeight="600" textAnchor="end">
                      {formatCurrencyShort(scenario.totalCapital, 'AED')}
                    </text>
                    {/* Net Gain */}
                    <text x={x - 52} y={y - 38} fill="hsl(var(--theme-text-muted))" fontSize="9">
                      Net Gain:
                    </text>
                    <text x={x + 52} y={y - 38} fill="hsl(var(--theme-accent))" fontSize="9" fontWeight="600" textAnchor="end">
                      +{formatCurrencyShort(scenario.netGain, 'AED')}
                    </text>
                    {/* ROE */}
                    <text x={x - 52} y={y - 24} fill="hsl(var(--theme-text-muted))" fontSize="9">
                      ROE:
                    </text>
                    <text x={x + 52} y={y - 24} fill="hsl(var(--theme-accent))" fontSize="9" fontWeight="600" textAnchor="end">
                      {scenario.annualizedROE.toFixed(1)}%/yr
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Hover tooltip - only show when NOT hovering an exit marker */}
          {hoverData && hoveredExitIndex === null && (
            <g>
              {/* Vertical line */}
              <line
                x1={hoverData.x}
                y1={padding.top}
                x2={hoverData.x}
                y2={height - padding.bottom}
                stroke="hsl(var(--theme-text))"
                strokeWidth="1"
                opacity="0.3"
              />
              {/* Dot on curve */}
              <circle
                cx={hoverData.x}
                cy={hoverData.y}
                r="5"
                fill="hsl(var(--theme-accent))"
                stroke="hsl(var(--theme-card))"
                strokeWidth="2"
              />
              {/* Tooltip box */}
              <rect
                x={hoverData.x - 45}
                y={hoverData.y - 40}
                width="90"
                height="30"
                rx="4"
                fill="hsl(var(--theme-card))"
                stroke="hsl(var(--theme-border))"
                strokeWidth="1"
              />
              <text
                x={hoverData.x}
                y={hoverData.y - 28}
                fill="hsl(var(--theme-text-muted))"
                fontSize="9"
                textAnchor="middle"
              >
                Month {Math.round(hoverData.month)}
              </text>
              <text
                x={hoverData.x}
                y={hoverData.y - 16}
                fill="hsl(var(--theme-text))"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                {formatCurrencyShort(hoverData.price, 'AED')}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Compact Exit Cards - Clickable with expandable detail */}
      <div className="px-3 pb-3 space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {scenarios.map((scenario, index) => {
            const isExpanded = expandedExit === index;
            return (
              <button
                key={scenario.exitMonths}
                onClick={() => setExpandedExit(prev => prev === index ? null : index)}
                className={cn(
                  "bg-theme-bg border rounded-lg p-2 text-center transition-all cursor-pointer",
                  scenario.isHandover
                    ? "border-theme-accent/50"
                    : isExpanded
                      ? "border-theme-accent ring-1 ring-theme-accent/30"
                      : "border-theme-border hover:border-theme-accent/30"
                )}
              >
                {/* Title */}
                <div className="flex items-center justify-center gap-1 mb-1">
                  {scenario.isHandover ? (
                    <Key className="w-3 h-3 text-theme-accent" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-theme-accent/20 text-theme-accent text-[10px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                  )}
                  <span className="text-xs font-medium text-theme-text-muted">
                    {scenario.isHandover ? 'Handover' : `Exit ${index + 1}`}
                  </span>
                  <ChevronDown className={cn(
                    "w-3 h-3 text-theme-text-muted transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )} />
                </div>

                {/* Net Gain - Hero */}
                <div className={cn(
                  "text-base font-bold",
                  scenario.netGain >= 0 ? "text-theme-positive" : "text-theme-negative"
                )}>
                  {scenario.netGain >= 0 ? '+' : ''}{formatCurrencyShort(scenario.netGain, 'AED')}
                </div>

                {/* Time & ROE */}
                <div className="flex items-center justify-center gap-2 mt-1 text-[10px] text-theme-text-muted">
                  <span>{scenario.exitMonths}m</span>
                  <span>•</span>
                  <span className={cn(
                    "font-semibold",
                    scenario.annualizedROE >= 0 ? "text-theme-positive" : "text-theme-negative"
                  )}>
                    {scenario.annualizedROE.toFixed(1)}% ROE
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded detail for selected exit */}
        {expandedExit !== null && scenarios[expandedExit] && (() => {
          const s = scenarios[expandedExit];
          return (
            <div className="bg-theme-bg border border-theme-accent/30 rounded-lg p-3 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-theme-text">
                  {s.isHandover ? 'Handover' : `Exit ${expandedExit + 1}`} — {s.exitMonths} months
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-theme-text-muted">Exit Price</span>
                <span className="font-mono text-theme-text font-medium">{formatCurrencyShort(s.exitPrice, 'AED')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-theme-text-muted">Purchase Price</span>
                <span className="font-mono text-theme-text-muted">{formatCurrencyShort(basePrice, 'AED')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-theme-text-muted">Appreciation</span>
                <span className={cn("font-mono font-medium", s.netGain >= 0 ? "text-theme-positive" : "text-theme-negative")}>
                  {s.netGain >= 0 ? '+' : ''}{formatCurrencyShort(s.netGain, 'AED')} ({s.gainPercent.toFixed(1)}%)
                </span>
              </div>

              <div className="border-t border-theme-border/30 my-1.5" />

              <div className="flex justify-between text-xs">
                <span className="text-theme-text-muted">Equity Deployed</span>
                <span className="font-mono text-theme-text">{formatCurrencyShort(s.equityDeployed, 'AED')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-theme-text-muted">Entry Costs (DLD + Oqood)</span>
                <span className="font-mono text-theme-negative">-{formatCurrencyShort(s.entryCosts, 'AED')}</span>
              </div>
              {s.exitCosts > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-theme-text-muted">Exit Costs (Agent + NOC)</span>
                  <span className="font-mono text-theme-negative">-{formatCurrencyShort(s.exitCosts, 'AED')}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-theme-text-muted">Total Capital In</span>
                <span className="font-mono text-theme-text font-medium">{formatCurrencyShort(s.totalCapital, 'AED')}</span>
              </div>

              <div className="border-t border-theme-border/30 my-1.5" />

              <div className="flex justify-between text-xs">
                <span className="text-theme-text-muted">Net Profit</span>
                <span className={cn("font-mono font-bold", s.netProfit >= 0 ? "text-theme-positive" : "text-theme-negative")}>
                  {s.netProfit >= 0 ? '+' : ''}{formatCurrencyShort(s.netProfit, 'AED')}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-theme-text font-medium">Annualized ROE</span>
                <span className={cn("font-mono font-bold text-sm", s.annualizedROE >= 0 ? "text-theme-positive" : "text-theme-negative")}>
                  {s.annualizedROE.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );

  if (embedded) {
    return <div>{graphAndCards}</div>;
  }

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-theme-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-theme-accent" />
          <span className="text-sm font-semibold text-theme-text">Asset Value Growth</span>
        </div>
        <p className="text-xs text-theme-text-muted mt-0.5">From purchase to exit</p>
      </div>
      {graphAndCards}
    </div>
  );
};
