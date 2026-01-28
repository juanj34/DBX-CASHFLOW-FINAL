import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { formatCurrency, Currency } from '@/components/roi/currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';

interface GrowthComparisonChartProps {
  quotesWithCalcs: QuoteWithCalculations[];
  currency?: Currency;
  exchangeRate?: number;
}

export const GrowthComparisonChart = ({ 
  quotesWithCalcs,
  currency = 'AED',
  exchangeRate = 1,
}: GrowthComparisonChartProps) => {
  const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500', '#FF6B6B', '#4ECDC4'];
  const { t } = useLanguage();

  // Build chart data combining all quotes
  const maxYears = 10;
  const chartData = Array.from({ length: maxYears + 1 }, (_, i) => {
    const dataPoint: any = { year: i };
    
    quotesWithCalcs.forEach((item, idx) => {
      const projection = item.calculations.yearlyProjections.find(p => p.year === i);
      if (projection) {
        dataPoint[`quote${idx}`] = projection.propertyValue;
        dataPoint[`quote${idx}Name`] = item.quote.title || item.quote.projectName || `Quote ${idx + 1}`;
      }
    });

    return dataPoint;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-sm mb-2">Year {label}</p>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-300">{entry.payload[`quote${idx}Name`]}:</span>
            <span className="text-white font-medium">
              {formatCurrency(entry.value, currency, exchangeRate)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-xl p-5">
      <h3 className="text-lg font-semibold text-white mb-4">{t('propertyValueGrowth') || 'Property Value Growth'}</h3>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
            <XAxis 
              dataKey="year" 
              stroke="#4a5568"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(v) => `Y${v}`}
            />
            <YAxis 
              stroke="#4a5568"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(v) => formatCurrency(v, currency, exchangeRate)}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={(value, entry: any) => {
                const idx = parseInt(value.replace('quote', ''));
                const quote = quotesWithCalcs[idx]?.quote;
                return <span className="text-gray-300 text-sm">{quote?.title || quote?.projectName || `Quote ${idx + 1}`}</span>;
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
              <p className="text-xs text-gray-500">{t('valueAtYear10') || 'Value at Year 10'}</p>
              <p 
                className="text-sm font-semibold"
                style={{ color: colors[idx % colors.length] }}
              >
                {finalProjection ? formatCurrency(finalProjection.propertyValue, currency, exchangeRate) : 'N/A'}
              </p>
              <p className="text-xs text-emerald-400">+{growth.toFixed(0)}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
