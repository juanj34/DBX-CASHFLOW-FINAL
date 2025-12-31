import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TrustScoreRingProps {
  score: number; // 0-10
  size?: number;
  className?: string;
}

export const TrustScoreRing: React.FC<TrustScoreRingProps> = ({
  score,
  size = 56,
  className,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const percentage = (animatedScore / 10) * 100;
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Animate score on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  // Get gradient colors based on score
  const getGradientId = () => {
    if (score >= 9) return 'legendary';
    if (score >= 7.5) return 'leader';
    if (score >= 6) return 'competitive';
    if (score >= 4) return 'standard';
    return 'watchlist';
  };

  const gradientColors = {
    legendary: ['#fbbf24', '#f59e0b', '#d97706'],
    leader: ['#34d399', '#10b981', '#059669'],
    competitive: ['#60a5fa', '#3b82f6', '#2563eb'],
    standard: ['#a78bfa', '#8b5cf6', '#7c3aed'],
    watchlist: ['#f87171', '#ef4444', '#dc2626'],
  };

  const gradientId = getGradientId();
  const colors = gradientColors[gradientId];

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg 
        className="transform -rotate-90" 
        width={size} 
        height={size} 
        viewBox="0 0 56 56"
      >
        <defs>
          <linearGradient id={`ring-gradient-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="50%" stopColor={colors[1]} />
            <stop offset="100%" stopColor={colors[2]} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Background circle */}
        <circle
          cx="28"
          cy="28"
          r="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-slate-700/50"
        />
        {/* Progress circle */}
        <circle
          cx="28"
          cy="28"
          r="22"
          fill="none"
          stroke={`url(#ring-gradient-${gradientId})`}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter="url(#glow)"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Score in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white">
          {animatedScore.toFixed(1)}
        </span>
      </div>
    </div>
  );
};

export default TrustScoreRing;
