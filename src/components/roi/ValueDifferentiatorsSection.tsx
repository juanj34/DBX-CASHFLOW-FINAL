import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, TrendingUp, Info, Plus, Trash2, Loader2 } from "lucide-react";
import {
  VALUE_DIFFERENTIATORS,
  APPRECIATION_BONUS_CAP,
  CATEGORY_LABELS,
  calculateAppreciationBonus,
  getDifferentiatorsByCategory,
  DifferentiatorCategory,
  ValueDifferentiator,
} from "./valueDifferentiators";
import { useCustomDifferentiators } from "@/hooks/useCustomDifferentiators";

interface ValueDifferentiatorsSectionProps {
  selectedDifferentiators: string[];
  onSelectionChange: (selected: string[]) => void;
  hideHeader?: boolean;
}

const CATEGORIES: DifferentiatorCategory[] = ['location', 'unit', 'developer', 'transport', 'financial', 'amenities', 'custom'];

export const ValueDifferentiatorsSection = ({
  selectedDifferentiators,
  onSelectionChange,
  hideHeader = false,
}: ValueDifferentiatorsSectionProps) => {
  const { language } = useLanguage();
  const { customDifferentiators, loading, saving, createDifferentiator, deleteDifferentiator } = useCustomDifferentiators();
  
  // New custom differentiator form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newImpacts, setNewImpacts] = useState(false);
  const [newBonus, setNewBonus] = useState(0.2);

  const toggleDifferentiator = (id: string) => {
    if (selectedDifferentiators.includes(id)) {
      onSelectionChange(selectedDifferentiators.filter(d => d !== id));
    } else {
      onSelectionChange([...selectedDifferentiators, id]);
    }
  };

  const handleAddCustom = async () => {
    if (!newName.trim()) return;
    
    const result = await createDifferentiator({
      name: newName.trim(),
      impactsAppreciation: newImpacts,
      appreciationBonus: newImpacts ? newBonus : 0,
    });
    
    if (result) {
      setNewName('');
      setNewImpacts(false);
      setNewBonus(0.2);
      setShowAddForm(false);
    }
  };

  const handleDeleteCustom = async (id: string) => {
    await deleteDifferentiator(id);
    // Remove from selection if selected
    if (selectedDifferentiators.includes(id)) {
      onSelectionChange(selectedDifferentiators.filter(d => d !== id));
    }
  };

  const totalBonus = calculateAppreciationBonus(selectedDifferentiators, customDifferentiators);
  const bonusProgress = (totalBonus / APPRECIATION_BONUS_CAP) * 100;

  const renderDifferentiatorItem = (diff: ValueDifferentiator, isCustom: boolean = false) => {
    const isSelected = selectedDifferentiators.includes(diff.id);
    const Icon = diff.icon;
    const tooltip = language === 'es' ? diff.tooltipEs : diff.tooltip;

    return (
      <div
        key={diff.id}
        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
          isSelected
            ? 'border-theme-accent/50 bg-theme-accent/10'
            : 'border-theme-border bg-theme-bg hover:border-theme-border-alt'
        }`}
      >
        <label className="flex items-center gap-2 flex-1 cursor-pointer">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleDifferentiator(diff.id)}
            className="border-theme-border data-[state=checked]:bg-theme-accent data-[state=checked]:border-theme-accent"
          />
          <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-theme-accent' : 'text-theme-text-muted'}`} />
          <span className={`text-xs flex-1 ${isSelected ? 'text-theme-text' : 'text-theme-text-muted'}`}>
            {language === 'es' ? diff.nameEs : diff.name}
          </span>
        </label>
        
        {/* Tooltip */}
        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-theme-text-muted hover:text-theme-text cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[250px] bg-theme-card border-theme-border text-theme-text text-xs">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Appreciation bonus badge */}
        {diff.impactsAppreciation && (
          <span className="text-[10px] text-theme-accent font-mono flex items-center gap-0.5 flex-shrink-0">
            <TrendingUp className="w-2.5 h-2.5" />
            +{diff.appreciationBonus}%
          </span>
        )}

        {/* Delete button for custom */}
        {isCustom && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCustom(diff.id);
            }}
            className="h-5 w-5 text-theme-text-muted hover:text-red-400 hover:bg-red-400/10 flex-shrink-0"
            disabled={saving}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with progress - conditionally hidden */}
      {!hideHeader && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-theme-accent" />
              <span className="text-sm font-medium text-theme-text">
                {language === 'es' ? 'Diferenciadores de Valor' : 'Value Differentiators'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-theme-text-muted">
                {language === 'es' ? 'Bonus' : 'Bonus'}:
              </span>
              <Badge variant="outline" className={`text-xs font-mono ${totalBonus > 0 ? 'bg-theme-accent/20 text-theme-accent border-theme-accent/30' : 'text-theme-text-muted'}`}>
                +{totalBonus.toFixed(1)}%
              </Badge>
              <span className="text-xs text-theme-text-muted">/ {APPRECIATION_BONUS_CAP}%</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <Progress value={bonusProgress} className="h-1.5 bg-theme-border" />
            <p className="text-[10px] text-theme-text-muted text-right">
              {language === 'es' 
                ? `Aplicado a todas las fases (en construcción, post entrega, madurez de zona)`
                : `Applied to all phases (under construction, post handover, zone maturity)`}
            </p>
          </div>
        </>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {CATEGORIES.map(category => {
          const builtInDifferentiators = getDifferentiatorsByCategory(category);
          const customInCategory = category === 'custom' ? customDifferentiators : [];
          const allDifferentiators = [...builtInDifferentiators, ...customInCategory];
          
          // Skip empty categories (except 'custom' which shows add button)
          if (allDifferentiators.length === 0 && category !== 'custom') return null;

          return (
            <div key={category} className="space-y-2">
              <h4 className="text-xs font-medium text-theme-text-muted uppercase tracking-wider">
                {language === 'es' ? CATEGORY_LABELS[category].es : CATEGORY_LABELS[category].en}
              </h4>
              
              {/* Built-in differentiators */}
              {builtInDifferentiators.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {builtInDifferentiators.map(diff => renderDifferentiatorItem(diff, false))}
                </div>
              )}

              {/* Custom differentiators */}
              {category === 'custom' && (
                <>
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-theme-text-muted" />
                    </div>
                  ) : (
                    <>
                      {customDifferentiators.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {customDifferentiators.map(diff => renderDifferentiatorItem(diff, true))}
                        </div>
                      )}

                      {/* Add Custom Form */}
                      {showAddForm ? (
                        <div className="p-3 bg-theme-card rounded-lg border border-theme-border space-y-3">
                          <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={language === 'es' ? 'Nombre del diferenciador' : 'Differentiator name'}
                            className="h-8 text-xs bg-theme-bg border-theme-border text-theme-text"
                          />
                          
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-theme-text-muted flex items-center gap-2">
                              <Switch
                                checked={newImpacts}
                                onCheckedChange={setNewImpacts}
                                className="data-[state=checked]:bg-theme-accent scale-75"
                              />
                              {language === 'es' ? 'Impacta apreciación' : 'Impacts appreciation'}
                            </label>
                            
                            {newImpacts && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-theme-text-muted">+</span>
                                <Input
                                  type="number"
                                  value={newBonus}
                                  onChange={(e) => setNewBonus(Math.min(0.5, Math.max(0.1, parseFloat(e.target.value) || 0.1)))}
                                  step="0.1"
                                  min="0.1"
                                  max="0.5"
                                  className="w-16 h-6 text-xs text-center bg-theme-bg border-theme-border text-theme-accent font-mono"
                                />
                                <span className="text-xs text-theme-text-muted">%</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAddForm(false)}
                              className="flex-1 h-7 text-xs text-theme-text-muted"
                            >
                              {language === 'es' ? 'Cancelar' : 'Cancel'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleAddCustom}
                              disabled={!newName.trim() || saving}
                              className="flex-1 h-7 text-xs bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
                            >
                              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : (language === 'es' ? 'Guardar' : 'Save')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddForm(true)}
                          className="w-full h-8 text-xs border-dashed border-theme-border text-theme-text-muted hover:bg-theme-card hover:text-theme-text"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          {language === 'es' ? 'Agregar diferenciador personalizado' : 'Add custom differentiator'}
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
