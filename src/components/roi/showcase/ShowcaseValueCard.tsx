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
  const valueDrivers = selected.filter(d => d.impactsAppreciation && d.appreciationBonus > 0);
  const features = selected.filter(d => !d.impactsAppreciation || d.appreciationBonus === 0);
  const totalBonus = calculateAppreciationBonus(selectedDifferentiators, customDifferentiators);

  if (selected.length === 0) return null;

  return (
    <div className={cn(
      "bg-gradient-to-br from-slate-800/80 to-amber-900/20 rounded-lg p-2.5 border border-amber-500/30 backdrop-blur-sm",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Value Differentiators</p>
          <p className="text-[11px] text-slate-300">{selected.length} factor{selected.length !== 1 ? 's' : ''}</p>
        </div>
        {totalBonus > 0 && (
          <div className="px-2 py-1 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">+{totalBonus.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Value Drivers */}
      {valueDrivers.length > 0 && (
        <div className="mb-1.5">
          <p className="text-[9px] text-emerald-400 font-medium mb-1 flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5" /> Drivers
          </p>
          <div className="flex flex-wrap gap-1">
            {valueDrivers.slice(0, 4).map(d => {
              const Icon = d.icon;
              return (
                <span key={d.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 rounded text-[9px] border border-emerald-500/30">
                  <Icon className="w-2.5 h-2.5" />
                  <span>{language === 'es' ? d.nameEs : d.name}</span>
                  <span className="text-emerald-400 font-medium">+{d.appreciationBonus}%</span>
                </span>
              );
            })}
            {valueDrivers.length > 4 && (
              <span className="text-[9px] text-slate-400">+{valueDrivers.length - 4} more</span>
            )}
          </div>
        </div>
      )}

      {/* Features */}
      {features.length > 0 && (
        <div>
          <p className="text-[9px] text-slate-400 font-medium mb-1 flex items-center gap-1">
            <Star className="w-2.5 h-2.5" /> Features
          </p>
          <div className="flex flex-wrap gap-1">
            {features.slice(0, 3).map(d => {
              const Icon = d.icon;
              return (
                <span key={d.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-600/30 text-slate-300 rounded text-[9px]">
                  <Icon className="w-2.5 h-2.5" />
                  <span>{language === 'es' ? d.nameEs : d.name}</span>
                </span>
              );
            })}
            {features.length > 3 && (
              <span className="text-[9px] text-slate-400">+{features.length - 3} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowcaseValueCard;
