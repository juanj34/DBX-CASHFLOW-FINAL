import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuoteData {
  id: string;
  created_at: string;
  status: string | null;
  sold_at?: string | null;
  inputs: {
    basePrice?: number;
    [key: string]: any;
  };
}

interface PipelineAnalyticsChartProps {
  quotes: QuoteData[];
  commissionRate: number;
}

interface MonthlyData {
  month: string;
  monthFull: string;
  dealVolume: number;
  soldVolume: number;
  dealCount: number;
  commission: number;
  earnedCommission: number;
}

export const PipelineAnalyticsChart = ({ quotes, commissionRate }: PipelineAnalyticsChartProps) => {
  const { t } = useLanguage();

  const monthlyData = useMemo(() => {
    const now = new Date();
    const data: MonthlyData[] = [];
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const monthFull = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      // Filter quotes for this month
      const monthQuotes = quotes.filter(q => {
        const created = new Date(q.created_at);
        return created.getMonth() === date.getMonth() && 
               created.getFullYear() === date.getFullYear();
      });
      
      // Filter sold quotes for this month
      const soldQuotes = quotes.filter(q => {
        if (!q.sold_at) return false;
        const soldDate = new Date(q.sold_at);
        return soldDate.getMonth() === date.getMonth() && 
               soldDate.getFullYear() === date.getFullYear();
      });
      
      const dealVolume = monthQuotes.reduce((sum, q) => sum + (q.inputs?.basePrice || 0), 0);
      const soldVolume = soldQuotes.reduce((sum, q) => sum + (q.inputs?.basePrice || 0), 0);
      
      data.push({
        month: monthName,
        monthFull,
        dealVolume,
        soldVolume,
        dealCount: monthQuotes.length,
        commission: dealVolume * (commissionRate / 100),
        earnedCommission: soldVolume * (commissionRate / 100),
      });
    }
    
    return data;
  }, [quotes, commissionRate]);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toFixed(0);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0].payload as MonthlyData;
    
    return (
      <div className="bg-theme-card border border-theme-border rounded-lg p-3 shadow-xl">
        <p className="text-theme-text font-medium mb-2">{data.monthFull}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-cyan-400">{t('dealVolume')}:</span>
            <span className="text-theme-text font-medium">AED {formatValue(data.dealVolume)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-green-400">{t('earnedCommission')}:</span>
            <span className="text-theme-text font-medium">AED {formatValue(data.earnedCommission)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-theme-text-muted">{t('deals')}:</span>
            <span className="text-theme-text">{data.dealCount}</span>
          </div>
        </div>
      </div>
    );
  };

  if (quotes.length === 0) return null;

  return (
    <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-theme-text">{t('pipelineAnalytics')}</h3>
          <p className="text-xs text-theme-text-muted">{t('lastSixMonths')}</p>
        </div>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--theme-accent))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--theme-accent))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="earnedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--theme-border))" opacity={0.5} />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--theme-text-muted))" 
              tick={{ fill: 'hsl(var(--theme-text-muted))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--theme-border))' }}
            />
            <YAxis 
              stroke="hsl(var(--theme-text-muted))"
              tick={{ fill: 'hsl(var(--theme-text-muted))', fontSize: 12 }}
              tickFormatter={(v) => formatValue(v)}
              axisLine={{ stroke: 'hsl(var(--theme-border))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="dealVolume"
              stroke="hsl(var(--theme-accent))"
              strokeWidth={2}
              fill="url(#volumeGradient)"
              name={t('dealVolume')}
            />
            <Area
              type="monotone"
              dataKey="soldVolume"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#earnedGradient)"
              name={t('earnedCommission')}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-theme-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-theme-accent" />
          <span>{t('dealVolume')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>{t('soldDeals')}</span>
        </div>
      </div>
    </div>
  );
};
