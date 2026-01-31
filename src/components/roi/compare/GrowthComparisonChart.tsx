import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { formatCurrency, Currency } from '@/components/roi/currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getQuoteDisplayName } from './utils';

interface GrowthComparisonChartProps {
  quotesWithCalcs: QuoteWithCalculations[];
  currency?: Currency;
  exchangeRate?: number;
}

// Theme-aware colors for quotes
const getQuoteColors = (isLightTheme: boolean) => 
  isLightTheme 
    ? ['#B8860B', '#1e40af', '#7c3aed', '#c2410c', '#0f766e', '#be185d']
    : ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500', '#FF6B6B', '#4ECDC4'];

export const GrowthComparisonChart = ({ 
  quotesWithCalcs,
  currency = 'AED',
  exchangeRate = 1,
}: GrowthComparisonChartProps) => {
  const { theme } = useTheme();
  const isLightTheme = theme === 'consultant';
  const colors = getQuoteColors(isLightTheme);
  const { t } = useLanguage();

  // Build chart data combining all quotes - start from Year 0 (purchase price)
  const maxYears = 10;
  const chartData = Array.from({ length: maxYears + 1 }, (_, i) => {
    const dataPoint: any = { year: i };
    
    quotesWithCalcs.forEach((item, idx) => {
      // Year 0 = base price (purchase day value)
      if (i === 0) {
        dataPoint[`quote${idx}`] = item.quote.inputs.basePrice;
        dataPoint[`quote${idx}Name`] = getQuoteDisplayName(item.quote.title, item.quote.projectName, null, `Quote ${idx + 1}`);
      } else {
        const projection = item.calculations.yearlyProjections.find(p => p.year === i);
        if (projection) {
          dataPoint[`quote${idx}`] = projection.propertyValue;
          dataPoint[`quote${idx}Name`] = getQuoteDisplayName(item.quote.title, item.quote.projectName, null, `Quote ${idx + 1}`);
        }
      }
    });

    return dataPoint;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-theme-card border border-theme-border rounded-lg p-3 shadow-xl">
        <p className="text-theme-text-muted text-sm mb-2">Year {label}</p>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-theme-text-muted">{entry.payload[`quote${idx}Name`]}:</span>
            <span className="text-theme-text font-medium">
              {formatCurrency(entry.value, currency, exchangeRate)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Theme-aware axis colors
  const axisColor = isLightTheme ? '#9ca3af' : '#4a5568';
  const tickColor = isLightTheme ? '#6b7280' : '#9ca3af';

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl p-5">
      <h3 className="text-lg font-semibold text-theme-text mb-4">{t('propertyValueGrowth') || 'Property Value Growth'}</h3>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
            <XAxis 
              dataKey="year" 
              stroke={axisColor}
              tick={{ fill: tickColor, fontSize: 12 }}
              tickFormatter={(v) => `Y${v}`}
            />
            <YAxis 
              stroke={axisColor}
              tick={{ fill: tickColor, fontSize: 12 }}
              tickFormatter={(v) => formatCurrency(v, currency, exchangeRate)}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={(value) => {
                const idx = parseInt(value.replace('quote', ''));
                const quote = quotesWithCalcs[idx]?.quote;
                return <span className="text-theme-text-muted text-sm">{getQuoteDisplayName(quote?.title, quote?.projectName, null, `Quote ${idx + 1}`)}</span>;
              }}
            />
            
            {quotesWithCalcs.map((item, idx) => (
              <Line
                key={item.quote.id}
                type="monotone"
                dataKey={`quote${idx}`}
                name={`quote${idx}`}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with final values */}
      <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${quotesWithCalcs.length}, 1fr)` }}>
        {quotesWithCalcs.map((item, idx) => {
          const finalProjection = item.calculations.yearlyProjections[item.calculations.yearlyProjections.length - 1];
          const growth = finalProjection 
            ? ((finalProjection.propertyValue - item.quote.inputs.basePrice) / item.quote.inputs.basePrice) * 100 
            : 0;

          return (
            <div key={item.quote.id} className="text-center">
              <p className="text-xs text-theme-text-muted">{t('valueAtYear10') || 'Value at Year 10'}</p>
              <p 
                className="text-sm font-semibold"
                style={{ color: colors[idx % colors.length] }}
              >
                {finalProjection ? formatCurrency(finalProjection.propertyValue, currency, exchangeRate) : 'N/A'}
              </p>
              <p className="text-xs text-theme-positive">+{growth.toFixed(0)}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
