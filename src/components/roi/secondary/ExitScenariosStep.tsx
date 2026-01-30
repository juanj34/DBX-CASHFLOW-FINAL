import { useState } from 'react';
import { Plus, X, Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ExitScenariosStepProps {
  exitMonths: number[];
  onChange: (months: number[]) => void;
  handoverMonths: number;
  language?: 'en' | 'es';
}

export const ExitScenariosStep = ({
  exitMonths,
  onChange,
  handoverMonths,
  language = 'es',
}: ExitScenariosStepProps) => {
  const [customYears, setCustomYears] = useState('');

  const t = language === 'es' ? {
    title: 'Puntos de Salida',
    description: 'Selecciona momentos para comparar qué pasaría si vendes ambas propiedades al mismo tiempo.',
    quickAdd: 'Agregar Rápido',
    year: 'Año',
    customAdd: 'Agregar Personalizado',
    years: 'años',
    add: 'Agregar',
    selectedExits: 'Puntos de Salida Seleccionados',
    disabledNote: '* Salidas antes del handover (mes {months}) están deshabilitadas',
    tip: '💡 Consejo:',
    tipText: 'Comparar en múltiples puntos muestra cómo la apreciación off-plan crea una ventaja que crece con el tiempo.',
  } : {
    title: 'Exit Points',
    description: 'Select moments to compare what would happen if you sell both properties at the same time.',
    quickAdd: 'Quick Add',
    year: 'Year',
    customAdd: 'Custom Add',
    years: 'years',
    add: 'Add',
    selectedExits: 'Selected Exit Points',
    disabledNote: '* Exits before handover (month {months}) are disabled',
    tip: '💡 Tip:',
    tipText: 'Comparing at multiple points shows how off-plan appreciation creates an advantage that grows over time.',
  };

  const QUICK_EXITS = [
    { label: `${t.year} 3`, months: 36 },
    { label: `${t.year} 4`, months: 48 },
    { label: `${t.year} 5`, months: 60 },
    { label: `${t.year} 7`, months: 84 },
    { label: `${t.year} 10`, months: 120 },
  ];

  const addExit = (months: number) => {
    if (!exitMonths.includes(months) && months > 0) {
      onChange([...exitMonths, months].sort((a, b) => a - b));
    }
  };

  const removeExit = (months: number) => {
    onChange(exitMonths.filter(m => m !== months));
  };

  const handleCustomAdd = () => {
    const years = parseFloat(customYears);
    if (years > 0 && years <= 20) {
      addExit(Math.round(years * 12));
      setCustomYears('');
    }
  };

  const formatExitLabel = (months: number) => {
    const years = months / 12;
    if (Number.isInteger(years)) {
      return `${t.year} ${years}`;
    }
    return `${months}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-theme-text mb-2">
          {t.title}
        </h3>
        <p className="text-sm text-theme-text-muted">
          {t.description}
        </p>
      </div>

      {/* Quick Add Buttons */}
      <div className="space-y-3">
        <Label className="text-theme-text-muted text-xs uppercase tracking-wide">
          {t.quickAdd}
        </Label>
        <div className="flex flex-wrap gap-2">
          {QUICK_EXITS.map((exit) => {
            const isAdded = exitMonths.includes(exit.months);
            const isBeforeHandover = exit.months <= handoverMonths;
            
            return (
              <Button
                key={exit.months}
                variant={isAdded ? 'default' : 'outline'}
                size="sm"
                disabled={isBeforeHandover}
                onClick={() => isAdded ? removeExit(exit.months) : addExit(exit.months)}
                className={`gap-1.5 ${
                  isAdded 
                    ? 'bg-theme-accent text-theme-accent-foreground' 
                    : 'border-theme-border text-theme-text'
                } ${isBeforeHandover ? 'opacity-50' : ''}`}
              >
                <Zap className="w-3 h-3" />
                {exit.label}
                {isAdded && <X className="w-3 h-3 ml-1" />}
              </Button>
            );
          })}
        </div>
        {handoverMonths > 36 && (
          <p className="text-xs text-amber-500">
            {t.disabledNote.replace('{months}', handoverMonths.toString())}
          </p>
        )}
      </div>

      {/* Custom Input */}
      <div className="space-y-3">
        <Label className="text-theme-text-muted text-xs uppercase tracking-wide">
          {t.customAdd}
        </Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-[150px]">
            <Input
              type="number"
              min="1"
              max="20"
              step="0.5"
              value={customYears}
              onChange={(e) => setCustomYears(e.target.value)}
              placeholder="3.5"
              className="bg-theme-card border-theme-border text-theme-text pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-theme-text-muted">
              {t.years}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCustomAdd}
            disabled={!customYears || parseFloat(customYears) <= 0}
            className="border-theme-border text-theme-text"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t.add}
          </Button>
        </div>
      </div>

      {/* Selected Exits */}
      {exitMonths.length > 0 && (
        <Card className="p-4 bg-theme-card border-theme-border">
          <Label className="text-theme-text-muted text-xs uppercase tracking-wide mb-3 block">
            {t.selectedExits} ({exitMonths.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {exitMonths.map((months) => (
              <Badge
                key={months}
                variant="outline"
                className="bg-theme-accent/10 text-theme-accent border-theme-accent/30 gap-1.5 py-1.5 px-3"
              >
                <Calendar className="w-3 h-3" />
                {formatExitLabel(months)}
                <button
                  onClick={() => removeExit(months)}
                  className="ml-1 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Explanation */}
      <div className="p-3 rounded-lg bg-theme-bg/50 text-xs text-theme-text-muted">
        <p>
          <strong className="text-theme-text">{t.tip}</strong> {t.tipText}
        </p>
      </div>
    </div>
  );
};
