import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { getRadarData, getTierInfo, calculateTrustScore, Developer } from './developerTrustScore';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeveloperRadarChartProps {
  developer: Partial<Developer>;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export const DeveloperRadarChart: React.FC<DeveloperRadarChartProps> = ({
  developer,
  size = 'md',
  showLabels = true,
  className = '',
}) => {
  const { language } = useLanguage();
  const data = getRadarData(developer);
  const score = calculateTrustScore(developer);
  const tier = getTierInfo(score);

  const sizeConfig = {
    sm: { width: 180, height: 180, fontSize: 10 },
    md: { width: 280, height: 280, fontSize: 12 },
    lg: { width: 350, height: 350, fontSize: 14 },
  };

  const config = sizeConfig[size];

  // Transform data for the chart based on language
  const chartData = data.map(item => ({
    ...item,
    displayCategory: language === 'es' ? item.categoryEs : item.category,
  }));

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <ResponsiveContainer width={config.width} height={config.height}>
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.3}
          />
          {showLabels && (
            <PolarAngleAxis
              dataKey="displayCategory"
              tick={{ 
                fill: 'hsl(var(--muted-foreground))', 
                fontSize: config.fontSize,
                fontWeight: 500,
              }}
              tickLine={false}
            />
          )}
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickCount={6}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke={tier.color}
            fill={tier.color}
            fillOpacity={0.4}
            strokeWidth={2}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload || !payload.length) return null;
              const item = payload[0].payload;
              return (
                <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                  <p className="font-medium text-foreground">{item.displayCategory}</p>
                  <p className="text-sm" style={{ color: tier.color }}>
                    {item.value.toFixed(1)} / 10
                  </p>
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DeveloperRadarChart;
