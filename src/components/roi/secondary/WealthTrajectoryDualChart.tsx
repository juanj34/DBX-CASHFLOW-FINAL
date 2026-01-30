import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { SecondaryYearlyProjection } from './types';
import { OIYearlyProjection } from '../useOICalculations';

interface WealthTrajectoryDualChartProps {
  offPlanProjections: OIYearlyProjection[];
  secondaryProjections: SecondaryYearlyProjection[];
  offPlanCapitalInvested: number;
  secondaryCapitalInvested: number;
  handoverYearIndex: number;
  showAirbnb?: boolean;
}

export const WealthTrajectoryDualChart = ({
  offPlanProjections,
  secondaryProjections,
  offPlanCapitalInvested,
  secondaryCapitalInvested,
  handoverYearIndex,
  showAirbnb = true,
}: WealthTrajectoryDualChartProps) => {
  const chartData = useMemo(() => {
    const data = [];
    
    // Calculate off-plan wealth (property value + cumulative rent - capital)
    let offPlanCumulativeRent = 0;
    
    for (let year = 1; year <= 10; year++) {
      const opProj = offPlanProjections[year - 1];
      const secProj = secondaryProjections[year - 1];
      
      if (!opProj || !secProj) continue;
      
      // Off-plan cumulative rent (only after handover)
      if (year > handoverYearIndex && opProj.netIncome) {
        offPlanCumulativeRent += opProj.netIncome;
      }
      
      // Off-plan wealth = property value + cumulative rent - capital invested
      const offPlanWealth = opProj.propertyValue + offPlanCumulativeRent - offPlanCapitalInvested;
      
      data.push({
        year,
        calendarYear: opProj.calendarYear,
        offPlanWealth,
        offPlanValue: opProj.propertyValue,
        secondaryWealthLT: secProj.totalWealthLT,
        secondaryWealthST: secProj.totalWealthST,
        secondaryValue: secProj.propertyValue,
        isConstruction: year <= handoverYearIndex,
      });
    }
    
    return data;
  }, [offPlanProjections, secondaryProjections, offPlanCapitalInvested, secondaryCapitalInvested, handoverYearIndex]);

  // Find crossover point
  const crossoverYear = useMemo(() => {
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1];
      const curr = chartData[i];
      if (prev.offPlanWealth <= prev.secondaryWealthLT && curr.offPlanWealth > curr.secondaryWealthLT) {
        return curr.year;
      }
    }
    return null;
  }, [chartData]);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-theme-card border border-theme-border rounded-lg p-3 shadow-xl">
        <p className="text-xs font-medium text-theme-text mb-2">Año {label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-theme-text-muted">{entry.name}:</span>
            <span className="font-medium text-theme-text">
              AED {formatValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-theme-card border-theme-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-theme-text flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-theme-accent" />
          Trayectoria de Riqueza (10 Años)
        </CardTitle>
        {crossoverYear && (
          <p className="text-sm text-theme-text-muted">
            Off-plan supera a secundaria en <span className="text-emerald-500 font-medium">Año {crossoverYear}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="offPlanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--theme-accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--theme-accent))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--theme-border))" opacity={0.5} />
              
              <XAxis 
                dataKey="year" 
                tick={{ fill: 'hsl(var(--theme-text-muted))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--theme-border))' }}
                tickLine={{ stroke: 'hsl(var(--theme-border))' }}
              />
              
              <YAxis 
                tickFormatter={(value) => `${formatValue(value)}`}
                tick={{ fill: 'hsl(var(--theme-text-muted))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--theme-border))' }}
                tickLine={{ stroke: 'hsl(var(--theme-border))' }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value: string) => (
                  <span className="text-theme-text text-xs">{value}</span>
                )}
              />
              
              {/* Construction period shading */}
              {handoverYearIndex > 0 && (
                <ReferenceLine 
                  x={handoverYearIndex} 
                  stroke="hsl(var(--theme-accent))" 
                  strokeDasharray="5 5" 
                  label={{ 
                    value: 'Handover', 
                    fill: 'hsl(var(--theme-accent))',
                    fontSize: 11,
                    position: 'top'
                  }} 
                />
              )}
              
              {/* Crossover point */}
              {crossoverYear && (
                <ReferenceLine 
                  x={crossoverYear} 
                  stroke="#10B981" 
                  strokeDasharray="5 5" 
                  label={{ 
                    value: '🔄 Cruce', 
                    fill: '#10B981',
                    fontSize: 11,
                    position: 'insideTopRight'
                  }} 
                />
              )}
              
              {/* Area fills */}
              <Area 
                type="monotone" 
                dataKey="offPlanWealth" 
                fill="url(#offPlanGradient)" 
                stroke="none"
              />
              
              {/* Lines */}
              <Line 
                type="monotone" 
                dataKey="offPlanWealth" 
                name="Off-Plan (Riqueza Total)"
                stroke="hsl(var(--theme-accent))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--theme-accent))', r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--theme-bg))', strokeWidth: 2 }}
              />
              
              <Line 
                type="monotone" 
                dataKey="secondaryWealthLT" 
                name="Secundaria LT"
                stroke="#06B6D4" 
                strokeWidth={2}
                dot={{ fill: '#06B6D4', r: 3 }}
                strokeDasharray="0"
              />
              
              {showAirbnb && (
                <Line 
                  type="monotone" 
                  dataKey="secondaryWealthST" 
                  name="Secundaria Airbnb"
                  stroke="#EC4899" 
                  strokeWidth={2}
                  dot={{ fill: '#EC4899', r: 3 }}
                  strokeDasharray="5 5"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend explanation */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-theme-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-theme-accent" />
            <span>Off-Plan: Mayor apreciación durante construcción</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-cyan-500" />
            <span>Secundaria: Cashflow desde día 1</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
