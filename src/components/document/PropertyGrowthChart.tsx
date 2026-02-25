import React from 'react';
import { OIYearlyProjection } from '@/components/roi/useOICalculations';
import { ExitScenarioResult } from '@/components/roi/constructionProgress';

interface PropertyGrowthChartProps {
  yearlyProjections: OIYearlyProjection[];
  basePrice: number;
  exitResults: ExitScenarioResult[];
  scenarioMonths: number[];
  totalMonths: number;
}

const n2sShort = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n.toFixed(0)}`;
};

export const PropertyGrowthChart: React.FC<PropertyGrowthChartProps> = ({
  yearlyProjections,
  basePrice,
  exitResults,
  scenarioMonths,
  totalMonths,
}) => {
  // Cap chart at handover + 2 years (not 10 years)
  const handoverYear = Math.ceil(totalMonths / 12);
  const maxYear = Math.min(handoverYear + 2, 10, yearlyProjections.length);

  // Build data points
  const points: { year: number; value: number }[] = [{ year: 0, value: basePrice }];
  for (let i = 0; i < maxYear; i++) {
    points.push({ year: i + 1, value: yearlyProjections[i]?.propertyValue || basePrice });
  }

  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const minVal = Math.min(...values) * 0.95;
  const maxVal = Math.max(...values) * 1.05;
  const valRange = maxVal - minVal || 1;

  // Chart dimensions — larger for readability
  const width = 900;
  const height = 300;
  const padTop = 40;
  const padBottom = 40;
  const padLeft = 80;
  const padRight = 40;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Scale helpers
  const xScale = (year: number) => padLeft + (year / maxYear) * chartW;
  const yScale = (val: number) => padTop + chartH - ((val - minVal) / valRange) * chartH;

  // Build SVG path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.year).toFixed(1)} ${yScale(p.value).toFixed(1)}`)
    .join(' ');

  // Area path
  const areaPath = `${linePath} L ${xScale(points[points.length - 1].year).toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${padLeft} ${(padTop + chartH).toFixed(1)} Z`;

  // Handover year fraction
  const handoverYearFrac = totalMonths / 12;

  // Y-axis grid lines
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount }, (_, i) => {
    const val = minVal + (valRange * (i + 1)) / (gridCount + 1);
    return { val, y: yScale(val) };
  });

  // Exit markers on the curve (only those within chart range)
  const exitMarkers = exitResults.map((sc, i) => {
    const months = scenarioMonths[i];
    const yearFrac = months / 12;
    if (yearFrac > maxYear) return null;
    return {
      x: xScale(yearFrac),
      y: yScale(sc.exitPrice),
      label: `AED ${n2sShort(sc.exitPrice)}`,
      months,
    };
  }).filter(Boolean) as { x: number; y: number; label: string; months: number }[];

  return (
    <div className="mt-4 mb-2">
      <p className="text-xs font-semibold text-gray-700 mb-3">Property Value Over Time</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: '300px' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(152 60% 45%)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(152 60% 45%)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect x={padLeft} y={padTop} width={chartW} height={chartH} fill="hsl(220 14% 97%)" rx="6" />

        {/* Grid lines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={padLeft} y1={g.y} x2={padLeft + chartW} y2={g.y}
              stroke="hsl(220 13% 90%)" strokeWidth="0.5" strokeDasharray="4 4"
            />
            <text
              x={padLeft - 8} y={g.y + 4} textAnchor="end"
              fill="hsl(215 16% 47%)" fontSize="10" fontFamily="JetBrains Mono, monospace"
            >
              {n2sShort(g.val)}
            </text>
          </g>
        ))}

        {/* Handover vertical line */}
        {handoverYearFrac <= maxYear && (
          <g>
            <line
              x1={xScale(handoverYearFrac)} y1={padTop}
              x2={xScale(handoverYearFrac)} y2={padTop + chartH}
              stroke="hsl(36 56% 45%)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5"
            />
            <text
              x={xScale(handoverYearFrac)} y={padTop - 10} textAnchor="middle"
              fill="hsl(34 55% 38%)" fontSize="10" fontFamily="DM Sans, sans-serif" fontWeight="600"
            >
              Handover
            </text>
          </g>
        )}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="hsl(152 60% 42%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i} cx={xScale(p.year)} cy={yScale(p.value)}
            r={i === 0 ? 4 : 3} fill="hsl(152 60% 42%)" stroke="white" strokeWidth="2"
          />
        ))}

        {/* Exit markers */}
        {exitMarkers.map((m, i) => (
          <g key={i}>
            <circle cx={m.x} cy={m.y} r="5" fill="hsl(36 56% 45%)" stroke="white" strokeWidth="2.5" />
            <text
              x={m.x} y={m.y - 14} textAnchor="middle"
              fill="hsl(220 15% 15%)" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="600"
            >
              {m.label}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {points.map((p) => (
          <text
            key={p.year} x={xScale(p.year)} y={padTop + chartH + 22} textAnchor="middle"
            fill="hsl(215 16% 47%)" fontSize="11" fontFamily="DM Sans, sans-serif"
          >
            {p.year === 0 ? 'Now' : `Yr ${p.year}`}
          </text>
        ))}

        {/* Start price label */}
        <text
          x={padLeft - 8} y={yScale(basePrice) + 4} textAnchor="end"
          fill="hsl(220 15% 15%)" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="600"
        >
          {n2sShort(basePrice)}
        </text>
      </svg>
    </div>
  );
};
