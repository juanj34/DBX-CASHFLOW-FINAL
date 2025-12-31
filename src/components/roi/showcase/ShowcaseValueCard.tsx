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
        "relative rounded-lg p-3 border flex flex-col min-h-0",
        "bg-gradient-to-br from-slate-800/90 via-slate-800/70 to-amber-950/30",
        "border-amber-500/40",
        className
      )}
    >
      {/* Uniqueness Badge - Top Banner */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", uniqueness.color)} />

      {/* Header (fixed) */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
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
                "text-xs font-bold bg-gradient-to-r bg-clip-text text-transparent",
                uniqueness.color
              )}
            >
              {uniqueness.label}
            </p>
          </div>
        </div>

        {totalBonus > 0 && (
          <div className="px-2.5 py-1.5 bg-emerald-500/20 rounded-lg border border-emerald-500/40">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-base font-bold text-emerald-400">+{totalBonus.toFixed(1)}%</span>
            </div>
            <p className="text-[8px] text-emerald-300/70 text-center">appreciation</p>
          </div>
        )}
      </div>

      {/* Scrollable content to avoid clipping */}
      <div className="flex-1 min-h-0 overflow-auto pr-1">
        {valueDrivers.length > 0 && (
          <div className="mb-2">
            <p className="text-[9px] text-emerald-400 font-semibold mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Value Drivers
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {valueDrivers.map((d) => {
                const Icon = d.icon;
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-1.5 px-2 py-1.5 bg-emerald-500/10 rounded-md border border-emerald-500/30"
                  >
                    <Icon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-[10px] text-white font-medium truncate flex-1">
                      {language === 'es' ? d.nameEs : d.name}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold flex-shrink-0">
                      +{d.appreciationBonus}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {features.length > 0 && (
          <div className="pt-2 border-t border-slate-700/50">
            <div className="flex flex-wrap gap-1">
              {features.map((d) => {
                const Icon = d.icon;
                return (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-700/40 text-slate-300 rounded text-[9px]"
                  >
                    <Icon className="w-2.5 h-2.5" />
                    {language === 'es' ? d.nameEs : d.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowcaseValueCard;
