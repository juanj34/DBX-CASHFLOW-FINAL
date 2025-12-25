import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp } from "lucide-react";
import {
  VALUE_DIFFERENTIATORS,
  calculateAppreciationBonus,
  getSelectedDifferentiators,
} from "./valueDifferentiators";

interface ValueDifferentiatorsDisplayProps {
  selectedDifferentiators: string[];
  readOnly?: boolean;
  onEditClick?: () => void;
}

export const ValueDifferentiatorsDisplay = ({
  selectedDifferentiators,
  readOnly = false,
  onEditClick,
}: ValueDifferentiatorsDisplayProps) => {
  const { language } = useLanguage();

  // Don't render if no differentiators selected
  if (!selectedDifferentiators || selectedDifferentiators.length === 0) {
    return null;
  }

  const { valueDrivers, features } = getSelectedDifferentiators(selectedDifferentiators);
  const totalBonus = calculateAppreciationBonus(selectedDifferentiators);

  return (
    <div 
      className={`p-4 bg-theme-card rounded-xl border border-theme-border mb-4 sm:mb-6 ${!readOnly ? 'cursor-pointer hover:border-theme-accent/30 transition-colors' : ''}`}
      onClick={!readOnly ? onEditClick : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-theme-accent" />
          <span className="text-sm font-medium text-theme-text">
            {language === 'es' ? 'Diferenciadores de Valor' : 'Value Differentiators'}
          </span>
        </div>
        {totalBonus > 0 && (
          <Badge 
            variant="outline" 
            className="bg-theme-accent/20 text-theme-accent border-theme-accent/30 text-xs font-mono flex items-center gap-1"
          >
            <TrendingUp className="w-3 h-3" />
            +{totalBonus.toFixed(1)}% {language === 'es' ? 'apreciación' : 'appreciation'}
          </Badge>
        )}
      </div>

      {/* Value Drivers (impacting appreciation) */}
      {valueDrivers.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wider text-theme-text-muted mb-2">
            {language === 'es' ? 'Impulsores de Valor' : 'Value Drivers'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {valueDrivers.map(diff => {
              const Icon = diff.icon;
              return (
                <Badge
                  key={diff.id}
                  variant="outline"
                  className="bg-theme-accent/10 border-theme-accent/30 text-theme-accent text-xs py-1 px-2 flex items-center gap-1.5"
                >
                  <Icon className="w-3 h-3" />
                  <span>{language === 'es' ? diff.nameEs : diff.name}</span>
                  <span className="text-[10px] opacity-70">+{diff.appreciationBonus}%</span>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Features (display only) */}
      {features.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-theme-text-muted mb-2">
            {language === 'es' ? 'Características' : 'Features'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {features.map(diff => {
              const Icon = diff.icon;
              return (
                <Badge
                  key={diff.id}
                  variant="outline"
                  className="bg-theme-bg border-theme-border text-theme-text-muted text-xs py-1 px-2 flex items-center gap-1.5"
                >
                  <Icon className="w-3 h-3" />
                  <span>{language === 'es' ? diff.nameEs : diff.name}</span>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit hint for non-readOnly */}
      {!readOnly && (
        <p className="text-[10px] text-theme-text-muted mt-3 text-center">
          {language === 'es' ? 'Clic para editar' : 'Click to edit'}
        </p>
      )}
    </div>
  );
};
