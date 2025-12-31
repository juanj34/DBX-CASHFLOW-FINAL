import React from 'react';
import { Sparkles, TrendingUp, Gem, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { VALUE_DIFFERENTIATORS, ValueDifferentiator, calculateAppreciationBonus } from '../valueDifferentiators';

interface ShowcaseValueCardProps {
  selectedDifferentiators: string[];
  customDifferentiators?: ValueDifferentiator[];
  className?: string;
}

const getUniquenessLevel = (count: number, bonus: number) => {
  if (bonus >= 2 || count >= 5) return { label: 'EXCEPTIONAL', color: 'from-amber-500 to-yellow-400', textColor: 'text-slate-900', icon: Crown };
  if (bonus >= 1 || count >= 3) return { label: 'PREMIUM', color: 'from-emerald-500 to-cyan-400', textColor: 'text-slate-900', icon: Gem };
  return { label: 'UNIQUE', color: 'from-blue-500 to-indigo-400', textColor: 'text-white', icon: Sparkles };
};

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
  const uniqueness = getUniquenessLevel(selected.length, totalBonus);
  const UniquenessIcon = uniqueness.icon;

  if (selected.length === 0) return null;

  return (
    <div
      className={cn(
        "relative rounded-lg p-3 border bg-gradient-to-br from-slate-800/80 to-slate-800/40 border-slate-700/50 backdrop-blur-sm",
        className
      )}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
              uniqueness.color
            )}
          >
            <UniquenessIcon className={cn("w-4 h-4", uniqueness.textColor)} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Property Uniqueness</p>
            <p
              className={cn(
                "text-sm font-bold bg-gradient-to-r bg-clip-text text-transparent",
                uniqueness.color
              )}
            >
              {uniqueness.label}
            </p>
          </div>
        </div>

        {totalBonus > 0 && (
          <div className="px-3 py-2 bg-emerald-500/15 rounded-lg border border-emerald-500/30">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-lg font-bold text-emerald-400">+{totalBonus.toFixed(1)}%</span>
            </div>
            <p className="text-[9px] text-emerald-400/80 text-center mt-0.5">appreciation</p>
          </div>
        )}
      </div>

      {/* Value Drivers */}
      {valueDrivers.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-400 font-medium mb-2 uppercase tracking-wide flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> Value Drivers
          </p>
          <div className="grid grid-cols-2 gap-2">
            {valueDrivers.map((d) => {
              const Icon = d.icon;
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-2 px-2.5 py-2 bg-slate-700/30 rounded-md border border-slate-600/40"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-xs text-white font-medium truncate">
                      {language === 'es' ? d.nameEs : d.name}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold flex-shrink-0">
                    +{d.appreciationBonus}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Features */}
      {features.length > 0 && (
        <div className={cn(valueDrivers.length > 0 && "mt-3 pt-3 border-t border-slate-700/50")}>
          <div className="flex flex-wrap gap-1.5">
            {features.map((d) => {
              const Icon = d.icon;
              return (
                <span
                  key={d.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/40 text-slate-300 rounded text-[10px]"
                >
                  <Icon className="w-3 h-3" />
                  {language === 'es' ? d.nameEs : d.name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowcaseValueCard;
