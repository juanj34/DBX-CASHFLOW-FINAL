import { useLanguage } from "@/contexts/LanguageContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp } from "lucide-react";
import {
  VALUE_DIFFERENTIATORS,
  APPRECIATION_BONUS_CAP,
  CATEGORY_LABELS,
  calculateAppreciationBonus,
  getDifferentiatorsByCategory,
  DifferentiatorCategory,
} from "./valueDifferentiators";

interface ValueDifferentiatorsSectionProps {
  selectedDifferentiators: string[];
  onSelectionChange: (selected: string[]) => void;
}

const CATEGORIES: DifferentiatorCategory[] = ['location', 'unit', 'developer', 'transport', 'financial', 'amenities'];

export const ValueDifferentiatorsSection = ({
  selectedDifferentiators,
  onSelectionChange,
}: ValueDifferentiatorsSectionProps) => {
  const { language } = useLanguage();

  const toggleDifferentiator = (id: string) => {
    if (selectedDifferentiators.includes(id)) {
      onSelectionChange(selectedDifferentiators.filter(d => d !== id));
    } else {
      onSelectionChange([...selectedDifferentiators, id]);
    }
  };

  const totalBonus = calculateAppreciationBonus(selectedDifferentiators);
  const bonusProgress = (totalBonus / APPRECIATION_BONUS_CAP) * 100;

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-theme-accent" />
          <span className="text-sm font-medium text-white">
            {language === 'es' ? 'Diferenciadores de Valor' : 'Value Differentiators'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {language === 'es' ? 'Bonus' : 'Bonus'}:
          </span>
          <Badge variant="outline" className={`text-xs font-mono ${totalBonus > 0 ? 'bg-theme-accent/20 text-theme-accent border-theme-accent/30' : 'text-gray-400'}`}>
            +{totalBonus.toFixed(1)}%
          </Badge>
          <span className="text-xs text-gray-500">/ {APPRECIATION_BONUS_CAP}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={bonusProgress} className="h-1.5 bg-[#2a3142]" />
        <p className="text-[10px] text-gray-500 text-right">
          {language === 'es' 
            ? `Aplicado a todas las fases de apreciación (construcción, crecimiento, madurez)`
            : `Applied to all appreciation phases (construction, growth, mature)`}
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {CATEGORIES.map(category => {
          const differentiators = getDifferentiatorsByCategory(category);
          if (differentiators.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {language === 'es' ? CATEGORY_LABELS[category].es : CATEGORY_LABELS[category].en}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {differentiators.map(diff => {
                  const isSelected = selectedDifferentiators.includes(diff.id);
                  const Icon = diff.icon;

                  return (
                    <label
                      key={diff.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-theme-accent/50 bg-theme-accent/10'
                          : 'border-[#2a3142] bg-[#0d1117] hover:border-[#3a4152]'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleDifferentiator(diff.id)}
                        className="border-[#3a4152] data-[state=checked]:bg-theme-accent data-[state=checked]:border-theme-accent"
                      />
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-theme-accent' : 'text-gray-500'}`} />
                      <span className={`text-xs flex-1 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        {language === 'es' ? diff.nameEs : diff.name}
                      </span>
                      {diff.impactsAppreciation && (
                        <span className="text-[10px] text-theme-accent font-mono flex items-center gap-0.5">
                          <TrendingUp className="w-2.5 h-2.5" />
                          +{diff.appreciationBonus}%
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
