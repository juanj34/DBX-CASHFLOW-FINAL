import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Currency, formatCurrency } from '../currencyUtils';

interface WealthProjectionChartProps {
  basePrice: number;
  constructionMonths: number;
  constructionAppreciation: number;
  growthAppreciation: number;
  matureAppreciation: number;
  growthPeriodYears: number;
  bookingYear: number;
  currency: Currency;
  rate: number;
}

export const WealthProjectionChart = ({
  basePrice,
  constructionMonths,
  constructionAppreciation,
  growthAppreciation,
  matureAppreciation,
  growthPeriodYears,
  bookingYear,
  currency,
  rate,
}: WealthProjectionChartProps) => {
  const chartData = useMemo(() => {
    const data: { year: number; value: number; phase: string }[] = [];
    const constructionYears = Math.ceil(constructionMonths / 12);
    let currentValue = basePrice;

    for (let year = 0; year <= 7; year++) {
      let phase: string;
      let appreciation: number;

      if (year < constructionYears) {
        phase = 'Construction';
        appreciation = constructionAppreciation / 100;
      } else if (year < constructionYears + growthPeriodYears) {
        phase = 'Growth';
        appreciation = growthAppreciation / 100;
      } else {
        phase = 'Mature';
        appreciation = matureAppreciation / 100;
      }

      data.push({
        year: bookingYear + year,
        value: Math.round(currentValue),
        phase,
      });

      currentValue = currentValue * (1 + appreciation);
    }

    return data;
  }, [basePrice, constructionMonths, constructionAppreciation, growthAppreciation, matureAppreciation, growthPeriodYears, bookingYear]);

  const minValue = Math.min(...chartData.map(d => d.value)) * 0.9;
  const maxValue = Math.max(...chartData.map(d => d.value)) * 1.05;
  const valueGrowth = chartData.length > 0 ? ((chartData[chartData.length - 1].value - chartData[0].value) / chartData[0].value * 100) : 0;

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-xs text-theme-text-muted uppercase tracking-wide font-semibold">
            Wealth Projection
          </span>
        </div>
        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
          +{valueGrowth.toFixed(0)}% in 7 years
        </span>
      </div>

      <div className="flex-1 min-h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="year" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--theme-text-muted))', fontSize: 10 }}
            />
            <YAxis 
              domain={[minValue, maxValue]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--theme-text-muted))', fontSize: 10 }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--theme-card))',
                border: '1px solid hsl(var(--theme-border))',
                borderRadius: '8px',
                color: 'hsl(var(--theme-text))',
              }}
              formatter={(value: number) => [formatCurrency(value, currency, rate), 'Value']}
              labelFormatter={(year) => `Year ${year}`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#wealthGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Phase indicators */}
      <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-theme-border/50">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-[10px] text-theme-text-muted">Construction {constructionAppreciation}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[10px] text-theme-text-muted">Growth {growthAppreciation}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-[10px] text-theme-text-muted">Mature {matureAppreciation}%</span>
        </div>
      </div>
    </div>
  );
};
