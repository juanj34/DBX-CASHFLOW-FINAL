import React from 'react';
import { ExitScenarioResult, isHandoverExit } from '@/components/roi/constructionProgress';

interface ExitBarChartProps {
  exitResults: ExitScenarioResult[];
  exitMonths: number[];
  totalMonths: number;
  getDisplay: (sc: ExitScenarioResult) => { profit: number; annualizedROE: number };
}

const n2sShort = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
};

export const ExitBarChart: React.FC<ExitBarChartProps> = ({
  exitResults,
  exitMonths,
  totalMonths,
  getDisplay,
}) => {
  if (exitResults.length === 0) return null;

  const profits = exitResults.map((sc) => getDisplay(sc).profit);
  const maxProfit = Math.max(...profits.map(Math.abs), 1);

  const width = 600;
  const height = 180;
  const padTop = 30;
  const padBottom = 30;
  const padLeft = 40;
  const padRight = 20;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const barWidth = Math.min(40, (chartWidth / exitResults.length) * 0.6);
  const barGap = (chartWidth - barWidth * exitResults.length) / (exitResults.length + 1);

  // Zero line position
  const allPositive = profits.every((p) => p >= 0);
  const allNegative = profits.every((p) => p <= 0);
  const zeroY = allPositive ? padTop + chartHeight : allNegative ? padTop : padTop + chartHeight * 0.6;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: '180px' }}>
      {/* Background */}
      <rect x={padLeft} y={padTop} width={chartWidth} height={chartHeight} fill="hsl(220 16% 14%)" rx="4" />

      {/* Zero line */}
      <line
        x1={padLeft}
        y1={zeroY}
        x2={width - padRight}
        y2={zeroY}
        stroke="hsl(220 12% 28%)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x={padLeft - 4} y={zeroY + 3} textAnchor="end" fill="hsl(215 12% 55%)" fontSize="8">
        0
      </text>

      {/* Bars */}
      {exitResults.map((sc, i) => {
        const d = getDisplay(sc);
        const x = padLeft + barGap + i * (barWidth + barGap);
        const barHeight = (Math.abs(d.profit) / maxProfit) * (chartHeight * 0.55);
        const isPositive = d.profit >= 0;
        const isHO = isHandoverExit(exitMonths[i], totalMonths);
        const barY = isPositive ? zeroY - barHeight : zeroY;

        const barColor = isPositive ? 'hsl(152 60% 48%)' : 'hsl(0 72% 58%)';
        const hoverColor = isHO ? 'hsl(38 92% 55%)' : barColor;

        return (
          <g key={i}>
            {/* Handover highlight */}
            {isHO && (
              <rect
                x={x - 3}
                y={padTop}
                width={barWidth + 6}
                height={chartHeight}
                fill="hsl(38 92% 55%)"
                opacity="0.06"
                rx="3"
              />
            )}

            {/* Bar */}
            <rect
              x={x}
              y={barY}
              width={barWidth}
              height={Math.max(2, barHeight)}
              fill={hoverColor}
              rx="2"
              opacity="0.85"
            />

            {/* ROE label above bar */}
            <text
              x={x + barWidth / 2}
              y={isPositive ? barY - 6 : barY + barHeight + 12}
              textAnchor="middle"
              fill="hsl(38 92% 55%)"
              fontSize="8"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
            >
              {d.annualizedROE.toFixed(1)}%
            </text>

            {/* Profit label */}
            <text
              x={x + barWidth / 2}
              y={isPositive ? barY - 16 : barY + barHeight + 22}
              textAnchor="middle"
              fill={isPositive ? 'hsl(152 60% 48%)' : 'hsl(0 72% 58%)'}
              fontSize="7"
              fontFamily="JetBrains Mono, monospace"
            >
              {isPositive ? '+' : ''}{n2sShort(d.profit)}
            </text>

            {/* Month label on x-axis */}
            <text
              x={x + barWidth / 2}
              y={padTop + chartHeight + 14}
              textAnchor="middle"
              fill={isHO ? 'hsl(38 92% 55%)' : 'hsl(215 12% 55%)'}
              fontSize="8"
              fontFamily="JetBrains Mono, monospace"
              fontWeight={isHO ? '600' : '400'}
            >
              {exitMonths[i]}m
            </text>
          </g>
        );
      })}

      {/* Title */}
      <text x={padLeft} y={14} fill="hsl(210 20% 92%)" fontSize="10" fontFamily="Instrument Serif, Georgia, serif">
        Exit Profit &amp; ROE by Month
      </text>
    </svg>
  );
};
