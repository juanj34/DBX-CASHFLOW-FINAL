import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Currency } from "@/components/roi/currencyUtils";
import { PortfolioProjectionPoint } from "@/hooks/usePortfolioProjections";

interface PortfolioGrowthChartProps {
  projections: PortfolioProjectionPoint[];
  currency: Currency;
  rate: number;
  targetWealth: number;
}

const formatCurrency = (value: number, currency: Currency, rate: number) => {
  const converted = value * rate;
  if (converted >= 1000000) {
    return `${(converted / 1000000).toFixed(1)}M`;
  }
  if (converted >= 1000) {
    return `${(converted / 1000).toFixed(0)}K`;
  }
  return converted.toFixed(0);
};

const formatTooltipValue = (value: number, currency: Currency, rate: number) => {
  const converted = value * rate;
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(converted);
};

export const PortfolioGrowthChart = ({
  projections,
  currency,
  rate,
  targetWealth,
}: PortfolioGrowthChartProps) => {
  const chartData = useMemo(() => {
    return projections.map(p => ({
      ...p,
      displayValue: p.portfolioValue * rate,
      displayRent: p.cumulativeRent * rate,
      displayTotal: p.totalWealth * rate,
    }));
  }, [projections, rate]);

  const currentYear = new Date().getFullYear();
  const todayPoint = chartData.find(p => p.year === currentYear);

  if (chartData.length === 0) {
    return null;
  }

  // Calculate domain for Y axis
  const maxValue = Math.max(...chartData.map(d => d.totalWealth)) * rate;
  const yDomain = [0, Math.ceil(maxValue * 1.1 / 1000000) * 1000000];

  return (
    <Card className="bg-theme-card border-theme-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-theme-accent" />
          <h3 className="font-semibold text-theme-text">Portfolio Growth Timeline</h3>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--theme-accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--theme-accent))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cumulativeRent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <XAxis 
                dataKey="year" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--theme-text-muted))', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              
              <YAxis 
                domain={yDomain}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--theme-text-muted))', fontSize: 11 }}
                tickFormatter={(value) => formatCurrency(value / rate, currency, rate)}
                width={60}
              />
              
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--theme-card))',
                  border: '1px solid hsl(var(--theme-border))',
                  borderRadius: '8px',
                  padding: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--theme-text))', fontWeight: 600, marginBottom: 4 }}
                formatter={(value: number, name: string) => {
                  const label = name === 'displayValue' ? 'Portfolio Value' 
                    : name === 'displayRent' ? 'Cumulative Rent' 
                    : 'Total Wealth';
                  return [formatTooltipValue(value / rate, currency, rate), label];
                }}
                labelFormatter={(label) => `Year ${label}`}
              />

              {/* Target line (2x investment) */}
              <ReferenceLine 
                y={targetWealth * rate} 
                stroke="hsl(var(--theme-accent))"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />

              {/* Today marker */}
              {todayPoint && (
                <ReferenceLine 
                  x={currentYear} 
                  stroke="hsl(var(--theme-text-muted))"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
              )}

              <Area
                type="monotone"
                dataKey="displayRent"
                stackId="1"
                stroke="#3b82f6"
                fill="url(#cumulativeRent)"
                strokeWidth={1.5}
              />
              
              <Area
                type="monotone"
                dataKey="displayValue"
                stackId="1"
                stroke="hsl(var(--theme-accent))"
                fill="url(#portfolioValue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-theme-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-theme-accent/60" />
            <span>Portfolio Value</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-blue-500/60" />
            <span>Cumulative Rent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0 border-t-2 border-dashed border-theme-accent/50" />
            <span>2× Target</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
