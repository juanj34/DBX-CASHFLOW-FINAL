import { useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Area } from 'recharts';
import { SecondaryYearlyProjection } from '../types';
import { OIYearlyProjection } from '@/components/roi/useOICalculations';

interface ExportWealthChartProps {
  offPlanProjections: OIYearlyProjection[];
  secondaryProjections: SecondaryYearlyProjection[];
  handoverYearIndex: number;
  showAirbnb?: boolean;
  language: 'en' | 'es';
}

/**
 * ExportWealthChart - Static chart for comparison PDF/PNG exports
 * Fixed dimensions, no ResponsiveContainer, no interactivity
 */
export const ExportWealthChart = ({
  offPlanProjections,
  secondaryProjections,
  handoverYearIndex,
  showAirbnb = false,
  language,
}: ExportWealthChartProps) => {
  const t = language === 'es' ? {
    title: 'Trayectoria de Riqueza (10 Años)',
    handover: 'Handover',
    crossover: '🔄 Cruce',
    offPlan: 'Off-Plan',
    secondaryLT: 'Secundaria LT',
    secondaryAirbnb: 'Secundaria Airbnb',
  } : {
    title: 'Wealth Trajectory (10 Years)',
    handover: 'Handover',
    crossover: '🔄 Crossover',
    offPlan: 'Off-Plan',
    secondaryLT: 'Secondary LT',
    secondaryAirbnb: 'Secondary Airbnb',
  };

  const chartData = useMemo(() => {
    const data = [];
    
    // Year 0 (starting point)
    const opYear0 = offPlanProjections[0];
    const secYear0 = secondaryProjections[0];
    if (opYear0 && secYear0) {
      data.push({
        year: 0,
        offPlanWealth: opYear0.propertyValue,
        secondaryWealthLT: secYear0.propertyValue,
        secondaryWealthST: secYear0.propertyValue,
      });
    }
    
    // Years 1-10
    let offPlanCumulativeRent = 0;
    let secondaryCumulativeRentLT = 0;
    let secondaryCumulativeRentST = 0;
    
    for (let year = 1; year <= 10; year++) {
      const opProj = offPlanProjections[year - 1];
      const secProj = secondaryProjections[year - 1];
      
      if (!opProj || !secProj) continue;
      
      if (year > handoverYearIndex && opProj.netIncome) {
        offPlanCumulativeRent += opProj.netIncome;
      }
      
      secondaryCumulativeRentLT += secProj.netRentLT || 0;
      secondaryCumulativeRentST += secProj.netRentST || 0;
      
      data.push({
        year,
        offPlanWealth: opProj.propertyValue + offPlanCumulativeRent,
        secondaryWealthLT: secProj.propertyValue + secondaryCumulativeRentLT,
        secondaryWealthST: secProj.propertyValue + secondaryCumulativeRentST,
      });
    }
    
    return data;
  }, [offPlanProjections, secondaryProjections, handoverYearIndex]);

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

  return (
    <div 
      style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: 'hsl(var(--theme-card))',
        border: '1px solid hsl(var(--theme-border))',
        marginBottom: '16px',
      }}
    >
      <div 
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'hsl(var(--theme-text))',
          marginBottom: '12px',
        }}
      >
        {t.title}
      </div>

      <ComposedChart 
        width={700} 
        height={280} 
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <defs>
          <linearGradient id="exportOffPlanGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        
        <XAxis 
          dataKey="year" 
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={{ stroke: '#374151' }}
        />
        
        <YAxis 
          tickFormatter={(value) => `${formatValue(value)}`}
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={{ stroke: '#374151' }}
        />
        
        {/* Handover reference line */}
        {handoverYearIndex > 0 && (
          <ReferenceLine 
            x={handoverYearIndex} 
            stroke="#10B981" 
            strokeDasharray="5 5"
          />
        )}
        
        {/* Crossover reference line */}
        {crossoverYear && (
          <ReferenceLine 
            x={crossoverYear} 
            stroke="#10B981" 
            strokeDasharray="5 5"
          />
        )}
        
        <Area 
          type="monotone" 
          dataKey="offPlanWealth" 
          fill="url(#exportOffPlanGradient)" 
          stroke="none"
        />
        
        <Line 
          type="monotone" 
          dataKey="offPlanWealth" 
          name={t.offPlan}
          stroke="#10B981" 
          strokeWidth={3}
          dot={{ fill: '#10B981', r: 4 }}
        />
        
        <Line 
          type="monotone" 
          dataKey="secondaryWealthLT" 
          name={t.secondaryLT}
          stroke="#06B6D4" 
          strokeWidth={2}
          dot={{ fill: '#06B6D4', r: 3 }}
        />
        
        {showAirbnb && (
          <Line 
            type="monotone" 
            dataKey="secondaryWealthST" 
            name={t.secondaryAirbnb}
            stroke="#EC4899" 
            strokeWidth={2}
            dot={{ fill: '#EC4899', r: 3 }}
            strokeDasharray="5 5"
          />
        )}
      </ComposedChart>

      {/* Legend */}
      <div 
        style={{
          display: 'flex',
          gap: '24px',
          marginTop: '12px',
          fontSize: '11px',
          color: 'hsl(var(--theme-text-muted))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '3px', backgroundColor: '#10B981' }} />
          <span>{t.offPlan}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '3px', backgroundColor: '#06B6D4' }} />
          <span>{t.secondaryLT}</span>
        </div>
        {showAirbnb && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '3px', backgroundColor: '#EC4899', borderStyle: 'dashed' }} />
            <span>{t.secondaryAirbnb}</span>
          </div>
        )}
      </div>
    </div>
  );
};
