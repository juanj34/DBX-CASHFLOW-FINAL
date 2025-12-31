import React from 'react';
import { Sparkles, TrendingUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { VALUE_DIFFERENTIATORS, ValueDifferentiator, calculateAppreciationBonus } from '../valueDifferentiators';

interface ShowcaseValueCardProps {
  selectedDifferentiators: string[];
  customDifferentiators?: ValueDifferentiator[];
  className?: string;
}

export const ShowcaseValueCard: React.FC<ShowcaseValueCardProps> = ({
  selectedDifferentiators,
  customDifferentiators = [],
  className,
}) => {
  const { language } = useLanguage();
  const allDifferentiators = [...VALUE_DIFFERENTIATORS, ...customDifferentiators];
  
  const selected = allDifferentiators.filter(d => selectedDifferentiators.includes(d.id));
  const valueDrivers = selected.filter(d => d.impactsAppreciation);
  const features = selected.filter(d => !d.impactsAppreciation);
  const totalBonus = calculateAppreciationBonus(selectedDifferentiators, customDifferentiators);

  if (selected.length === 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl p-4",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80",
        "border border-slate-700/50",
        "backdrop-blur-sm",
        className
      )}
    >
      {/* Accent glow */}
      <div className="absolute top-1/2 left-0 w-32 h-32 bg-amber-500/10 blur-2xl rounded-full -translate-x-1/2" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Why This Property</p>
            <p className="text-base font-semibold text-white">Value Differentiators</p>
          </div>
        </div>

        {/* Value Drivers (appreciation impacting) */}
        {valueDrivers.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-emerald-400 font-medium mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Value Drivers
            </p>
            <div className="flex flex-wrap gap-1.5">
              {valueDrivers.map(d => {
                const Icon = d.icon;
                return (
                  <span 
                    key={d.id}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{language === 'es' ? d.nameEs : d.name}</span>
                    {d.appreciationBonus > 0 && (
                      <span className="text-emerald-400">+{d.appreciationBonus}%</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Features (non-appreciation) */}
        {features.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1">
              <Star className="w-3 h-3" />
              Premium Features
            </p>
            <div className="flex flex-wrap gap-1.5">
              {features.map(d => {
                const Icon = d.icon;
                return (
                  <span 
                    key={d.id}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      "bg-slate-600/30 text-slate-300 border border-slate-500/30"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{language === 'es' ? d.nameEs : d.name}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Total appreciation bonus callout */}
        {totalBonus > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-slate-300">Appreciation Bonus</span>
              </div>
              <span className="text-xl font-bold text-emerald-400">+{totalBonus.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Added to base zone appreciation annually</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowcaseValueCard;
