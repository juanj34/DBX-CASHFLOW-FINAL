import { useMemo } from 'react';
import { OICalculations, OIInputs } from '../useOICalculations';
import { Currency, formatCurrencyShort } from '../currencyUtils';
import { monthToConstruction, calculateExitPrice, calculateExitScenario } from '../constructionProgress';

interface ExportGrowthCurveProps {
  calculations: OICalculations;
  inputs: OIInputs;
  currency: Currency;
  exitScenarios: number[];
  rate: number;
}

export const ExportGrowthCurve = ({ 
  calculations, 
  inputs, 
  currency, 
  exitScenarios, 
  rate,
}: ExportGrowthCurveProps) => {
  const { basePrice, totalMonths, totalEntryCosts } = calculations;
  
  // Calculate handover price
  const handoverPrice = calculateExitPrice(totalMonths, basePrice, totalMonths, inputs);
  const maxValue = handoverPrice * 1.08;
  const minValue = basePrice * 0.95;

  // SVG dimensions
  const width = 600;
  const height = 180;
  const padding = { top: 30, right: 30, bottom: 50, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (months: number) => padding.left + (months / totalMonths) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

  // Y-axis values
  const yAxisValues = useMemo(() => {
    const range = maxValue - minValue;
    const step = range / 3;
    return [minValue, minValue + step, minValue + step * 2, maxValue];
  }, [minValue, maxValue]);

  // X-axis time labels
  const timeLabels = useMemo(() => {
    const labels: number[] = [];
    for (let m = 0; m <= totalMonths; m += 6) {
      labels.push(m);
    }
    if (labels.length > 0 && totalMonths - labels[labels.length - 1] >= 3) {
      labels.push(totalMonths);
    } else if (labels[labels.length - 1] !== totalMonths) {
      labels[labels.length - 1] = totalMonths;
    }
    return labels;
  }, [totalMonths]);

  // Generate curve path
  const curvePath = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const month = progress * totalMonths;
      const price = calculateExitPrice(month, basePrice, totalMonths, inputs);
      points.push({ x: month, y: price });
    }
    
    let path = `M ${xScale(points[0].x)} ${yScale(points[0].y)}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${xScale(points[i].x)} ${yScale(points[i].y)}`;
    }
    
    return path;
  }, [basePrice, totalMonths, inputs, xScale, yScale]);

  // Exit markers data
  const exitMarkersData = useMemo(() => {
    return exitScenarios.map((month, index) => {
      const scenario = calculateExitScenario(month, basePrice, totalMonths, inputs, totalEntryCosts);
      return { scenario, exitMonth: month, label: `Exit ${index + 1}` };
    });
  }, [exitScenarios, basePrice, totalMonths, inputs, totalEntryCosts]);

  // Handover calculation
  const handoverScenario = useMemo(() => {
    return calculateExitScenario(totalMonths, basePrice, totalMonths, inputs, totalEntryCosts);
  }, [totalMonths, basePrice, inputs, totalEntryCosts]);

  // Construction progress markers
  const constructionMarkers = useMemo(() => {
    const markers: { month: number; percent: number }[] = [];
    for (let m = 0; m <= totalMonths; m += 6) {
      markers.push({ month: m, percent: monthToConstruction(m, totalMonths) });
    }
    if (markers.length > 0 && markers[markers.length - 1].month !== totalMonths) {
      markers.push({ month: totalMonths, percent: 100 });
    }
    return markers;
  }, [totalMonths]);

  return (
    <div 
      style={{
        backgroundColor: 'hsl(var(--theme-card))',
        border: '1px solid hsl(var(--theme-border))',
        borderRadius: '12px',
        padding: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--theme-text))' }}>
          📈 Price Appreciation
        </span>
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="exportCurveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#CCFF00" />
            <stop offset="100%" stopColor="#22d3d1" />
          </linearGradient>
          
          <linearGradient id="exportAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.12" />
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
            y={height - padding.bottom + 12}
            fill="hsl(var(--theme-text-muted))"
            fontSize="9"
            textAnchor="middle"
          >
            {months}mo
          </text>
        ))}

        {/* Construction progress bar */}
        <rect
          x={padding.left}
          y={height - 24}
          width={chartWidth}
          height={6}
          fill="url(#exportCurveGradient)"
          opacity="0.5"
          rx="3"
        />

        {/* Construction % labels */}
        {constructionMarkers.map((marker, i) => (
          <text
            key={`const-${i}`}
            x={xScale(marker.month)}
            y={height - 32}
            fill="hsl(var(--theme-text-muted))"
            fontSize="7"
            textAnchor="middle"
          >
            {Math.round(marker.percent)}%
          </text>
        ))}

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
        <text
          x={padding.left + 5}
          y={yScale(basePrice) - 6}
          fill="hsl(var(--theme-text-muted))"
          fontSize="8"
        >
          Base Price
        </text>

        {/* Area fill under curve */}
        <path
          d={`${curvePath} L ${xScale(totalMonths)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`}
          fill="url(#exportAreaGradient)"
        />

        {/* Growth curve */}
        <path
          d={curvePath}
          fill="none"
          stroke="url(#exportCurveGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Start marker */}
        <circle cx={xScale(0)} cy={yScale(basePrice)} r="5" fill="#CCFF00" />
        <text x={xScale(0) + 10} y={yScale(basePrice) + 4} fill="#CCFF00" fontSize="10" fontWeight="bold" fontFamily="monospace">
          {formatCurrencyShort(basePrice, currency, rate)}
        </text>

        {/* Exit markers */}
        {exitMarkersData.map(({ scenario, exitMonth }, index) => (
          <g key={`exit-${index}`}>
            <text x={xScale(exitMonth)} y={yScale(scenario.exitPrice) - 28} fill="#CCFF00" fontSize="9" fontWeight="bold" textAnchor="middle">
              Exit {index + 1}
            </text>
            <text x={xScale(exitMonth)} y={yScale(scenario.exitPrice) - 16} fill="#CCFF00" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {formatCurrencyShort(scenario.exitPrice, currency, rate)}
            </text>
            <text x={xScale(exitMonth)} y={yScale(scenario.exitPrice) - 4} fill="#22d3d1" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {scenario.annualizedROE.toFixed(0)}%/yr
            </text>
            <circle cx={xScale(exitMonth)} cy={yScale(scenario.exitPrice)} r="7" fill="hsl(var(--theme-bg))" stroke="#CCFF00" strokeWidth="2" />
            <circle cx={xScale(exitMonth)} cy={yScale(scenario.exitPrice)} r="3" fill="#CCFF00" />
          </g>
        ))}

        {/* Handover marker */}
        <g>
          <text x={xScale(totalMonths)} y={yScale(handoverScenario.exitPrice) - 28} fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">
            Handover
          </text>
          <text x={xScale(totalMonths)} y={yScale(handoverScenario.exitPrice) - 16} fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            {formatCurrencyShort(handoverScenario.exitPrice, currency, rate)}
          </text>
          <text x={xScale(totalMonths)} y={yScale(handoverScenario.exitPrice) - 4} fill="#22d3d1" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            {handoverScenario.annualizedROE.toFixed(0)}%/yr
          </text>
          <circle cx={xScale(totalMonths)} cy={yScale(handoverScenario.exitPrice)} r="8" fill="hsl(var(--theme-bg))" stroke="white" strokeWidth="2" />
          <circle cx={xScale(totalMonths)} cy={yScale(handoverScenario.exitPrice)} r="4" fill="white" />
        </g>
      </svg>
    </div>
  );
};
