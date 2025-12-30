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
    md: { width: 300, height: 300, fontSize: 11 },
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
        <RadarChart data={chartData} margin={{ top: 30, right: 40, bottom: 30, left: 40 }}>
          {/* Custom styled polar grid with gradient effect */}
          <PolarGrid 
            stroke="#3a4255" 
            strokeOpacity={0.6}
            gridType="polygon"
          />
          {showLabels && (
            <PolarAngleAxis
              dataKey="displayCategory"
              tick={({ x, y, payload, index }) => {
                // Enhanced position adjustments for better label readability
                const offsetMap: Record<number, { dx: number; dy: number }> = {
                  0: { dx: 0, dy: -12 },   // Top - push up more
                  1: { dx: 18, dy: 4 },    // Right - push out more
                  2: { dx: 0, dy: 16 },    // Bottom - push down more
                  3: { dx: -18, dy: 4 },   // Left - push out more
                };
                const offset = offsetMap[index] || { dx: 0, dy: 0 };
                
                return (
                  <g transform={`translate(${x + offset.dx},${y + offset.dy})`}>
                    <text
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize={config.fontSize + 1}
                      fontWeight={600}
                    >
                      {payload.value}
                    </text>
                  </g>
                );
              }}
              tickLine={false}
            />
          )}
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fontSize: 9, fill: '#64748b' }}
            tickCount={6}
            axisLine={false}
          />
          {/* Background radar for depth effect */}
          <Radar
            name="Background"
            dataKey={() => 10}
            stroke="transparent"
            fill="#1e293b"
            fillOpacity={0.3}
          />
          {/* Main radar with glow effect */}
          <Radar
            name="Score"
            dataKey="value"
            stroke={tier.color}
            fill={tier.color}
            fillOpacity={0.25}
            strokeWidth={2.5}
            animationDuration={1000}
            animationEasing="ease-out"
            dot={{
              r: 4,
              fill: tier.color,
              stroke: '#1a1f2e',
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: tier.color,
              stroke: '#fff',
              strokeWidth: 2,
            }}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload || !payload.length) return null;
              const item = payload[0].payload;
              return (
                <div 
                  className="rounded-lg px-4 py-3 shadow-2xl border animate-scale-in"
                  style={{ 
                    backgroundColor: '#1a1f2e',
                    borderColor: tier.color + '40',
                  }}
                >
                  <p className="font-semibold text-white text-sm mb-1">
                    {item.displayCategory}
                  </p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                    <p className="text-lg font-bold" style={{ color: tier.color }}>
                      {item.value.toFixed(1)}
                      <span className="text-xs text-gray-500 ml-1">/10</span>
                    </p>
                  </div>
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
