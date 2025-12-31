import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { OIYearlyProjection } from './useOICalculations';
import { Currency, formatCurrency } from './currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CumulativeIncomeChartProps {
  projections: OIYearlyProjection[];
  currency: Currency;
  rate: number;
  totalCapitalInvested: number;
  showAirbnbComparison: boolean;
}

export const CumulativeIncomeChart = ({ 
  projections, 
  currency, 
  rate, 
  totalCapitalInvested,
  showAirbnbComparison 
}: CumulativeIncomeChartProps) => {
  const { t } = useLanguage();

  const chartData = useMemo(() => {
    return projections.map(p => ({
      year: `Y${p.year}`,
      calendarYear: p.calendarYear,
      longTerm: p.cumulativeNetIncome,
      airbnb: showAirbnbComparison ? p.airbnbCumulativeNetIncome : null,
      isConstruction: p.isConstruction,
    }));
  }, [projections, showAirbnbComparison]);

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toFixed(0);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-2">{label} ({data.calendarYear})</p>
          {data.isConstruction ? (
            <p className="text-gray-400 text-sm">{t('underConstruction')}</p>
          ) : (
            <>
              <p className="text-cyan-400 text-sm">
                {t('longTerm')}: {formatCurrency(data.longTerm, currency, rate)}
              </p>
              {showAirbnbComparison && data.airbnb !== null && (
                <p className="text-orange-400 text-sm">
                  {t('shortTerm')}: {formatCurrency(data.airbnb, currency, rate)}
                </p>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-4 sm:p-6">
      <h3 className="text-white font-semibold mb-4">{t('cumulativeNetIncome')}</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLongTerm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAirbnb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3142" />
            <XAxis 
              dataKey="year" 
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={{ stroke: '#2a3142' }}
            />
            <YAxis 
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={{ stroke: '#2a3142' }}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={totalCapitalInvested} 
              stroke="#CCFF00" 
              strokeDasharray="5 5"
              label={{ 
                value: t('breakEven'), 
                fill: '#CCFF00', 
                fontSize: 10,
                position: 'right'
              }}
            />
            <Area
              type="monotone"
              dataKey="longTerm"
              stroke="#22d3ee"
              strokeWidth={2}
              fill="url(#colorLongTerm)"
              name={t('longTerm')}
              isAnimationActive={true}
              animationDuration={500}
            />
            {showAirbnbComparison && (
              <Area
                type="monotone"
                dataKey="airbnb"
                stroke="#fb923c"
                strokeWidth={2}
                fill="url(#colorAirbnb)"
                name={t('shortTerm')}
                isAnimationActive={true}
                animationDuration={500}
              />
            )}
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
