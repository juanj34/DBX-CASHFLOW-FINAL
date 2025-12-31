import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

interface PropertyScoreGaugeProps {
  developerScore: number; // 0-10
  zoneMaturity: number; // 0-100
  appreciationBonus: number; // e.g., 1.2 for +1.2%
  className?: string;
}

const getZonePotentialScore = (maturity: number): number => {
  // Lower maturity = higher growth potential
  if (maturity <= 25) return 95; // Emerging - highest potential
  if (maturity <= 50) return 80; // Developing
  if (maturity <= 75) return 65; // Growing
  if (maturity <= 90) return 45; // Mature
  return 30; // Established - stable but lower growth
};

const getValueScore = (bonus: number): number => {
  // Cap at 3% appreciation bonus = 100 score
  return Math.min(100, (bonus / 3) * 100);
};

export const PropertyScoreGauge: React.FC<PropertyScoreGaugeProps> = ({
  developerScore,
  zoneMaturity,
  appreciationBonus,
  className,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Calculate component scores
  const developerNormalized = (developerScore / 10) * 100;
  const zonePotential = getZonePotentialScore(zoneMaturity);
  const valueScore = getValueScore(appreciationBonus);

  // Weighted final score
  const finalScore = Math.round(
    developerNormalized * 0.35 + zonePotential * 0.35 + valueScore * 0.30
  );

  // Animate on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(finalScore), 100);
    return () => clearTimeout(timer);
  }, [finalScore]);

  // Score tier
  const getTier = (score: number) => {
    if (score >= 85) return { label: 'EXCEPTIONAL', color: 'text-amber-400', bg: 'bg-amber-500/20' };
    if (score >= 70) return { label: 'STRONG', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (score >= 55) return { label: 'SOLID', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (score >= 40) return { label: 'MODERATE', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { label: 'CONSERVATIVE', color: 'text-gray-400', bg: 'bg-gray-500/20' };
  };

  const tier = getTier(animatedScore);
  const percentage = animatedScore / 100;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage * circumference);

  return (
    <div className={cn("bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50", className)}>
      <div className="flex items-center gap-3">
        {/* Gauge */}
        <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
          <svg className="transform -rotate-90" width={52} height={52} viewBox="0 0 80 80">
            <defs>
              <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              className="text-slate-700/50"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="url(#score-gradient)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold text-white leading-none">{animatedScore}</span>
          </div>
        </div>

        {/* Score Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-theme-accent" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Investment Score</span>
          </div>
          <div className={cn("inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold", tier.bg, tier.color)}>
            {tier.label}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyScoreGauge;
