import { useState } from 'react';
import { TrendingUp, Shield, Target, Gauge, Sliders, Check, Info, Plus, Trash2, Edit2, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAppreciationPresets, AppreciationPreset } from '@/hooks/useAppreciationPresets';

// Growth Profile Presets
const GROWTH_PRESETS = {
  conservative: {
    name: 'Conservative',
    nameEs: 'Conservador',
    icon: Shield,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Lower risk, steady returns',
    descriptionEs: 'Menor riesgo, retornos estables',
    construction: 8,
    growth: 5,
    mature: 3,
    growthYears: 3,
  },
  balanced: {
    name: 'Balanced',
    nameEs: 'Balanceado',
    icon: Target,
    color: 'text-theme-accent',
    bgColor: 'bg-theme-accent/10',
    borderColor: 'border-theme-accent/30',
    description: 'Moderate risk/reward balance',
    descriptionEs: 'Balance moderado riesgo/retorno',
    construction: 12,
    growth: 8,
    mature: 4,
    growthYears: 5,
  },
  aggressive: {
    name: 'Aggressive',
    nameEs: 'Agresivo',
    icon: Gauge,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: 'Higher risk, maximum upside',
    descriptionEs: 'Mayor riesgo, máximo potencial',
    construction: 15,
    growth: 10,
    mature: 5,
    growthYears: 7,
  },
} as const;

type BuiltInPresetKey = keyof typeof GROWTH_PRESETS;

interface GrowthPresetsSectionProps {
  language: 'en' | 'es';
  constructionAppreciation: number;
  growthAppreciation: number;
  matureAppreciation: number;
  growthPeriodYears: number;
  setConstructionAppreciation: (v: number) => void;
  setGrowthAppreciation: (v: number) => void;
  setMatureAppreciation: (v: number) => void;
  setGrowthPeriodYears: (v: number) => void;
}

export const GrowthPresetsSection = ({
  language,
  constructionAppreciation,
  growthAppreciation,
  matureAppreciation,
  growthPeriodYears,
  setConstructionAppreciation,
  setGrowthAppreciation,
  setMatureAppreciation,
  setGrowthPeriodYears,
}: GrowthPresetsSectionProps) => {
  const { presets, savePreset, updatePreset, deletePreset, saving } = useAppreciationPresets();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [editingPreset, setEditingPreset] = useState<AppreciationPreset | null>(null);

  // Detect which preset matches current values
  const detectPreset = (): string | null => {
    // Check built-in presets
    for (const [key, preset] of Object.entries(GROWTH_PRESETS)) {
      if (
        preset.construction === constructionAppreciation &&
        preset.growth === growthAppreciation &&
        preset.mature === matureAppreciation &&
        preset.growthYears === growthPeriodYears
      ) {
        return key;
      }
    }
    // Check saved presets
    for (const preset of presets) {
      if (
        preset.construction_appreciation === constructionAppreciation &&
        preset.growth_appreciation === growthAppreciation &&
        preset.mature_appreciation === matureAppreciation &&
        preset.growth_period_years === growthPeriodYears
      ) {
        return preset.id;
      }
    }
    return null;
  };

  const currentMatch = detectPreset();
  const isModified = selectedPreset !== null && currentMatch !== selectedPreset;

  const handleBuiltInPresetSelect = (key: BuiltInPresetKey) => {
    const preset = GROWTH_PRESETS[key];
    setConstructionAppreciation(preset.construction);
    setGrowthAppreciation(preset.growth);
    setMatureAppreciation(preset.mature);
    setGrowthPeriodYears(preset.growthYears);
    setSelectedPreset(key);
  };

  const handleSavedPresetSelect = (preset: AppreciationPreset) => {
    setConstructionAppreciation(preset.construction_appreciation);
    setGrowthAppreciation(preset.growth_appreciation);
    setMatureAppreciation(preset.mature_appreciation);
    setGrowthPeriodYears(preset.growth_period_years);
    setSelectedPreset(preset.id);
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return;
    
    const values = {
      constructionAppreciation,
      growthAppreciation,
      matureAppreciation,
      growthPeriodYears,
    };

    if (editingPreset) {
      await updatePreset(editingPreset.id, newPresetName, values);
    } else {
      await savePreset(newPresetName, values);
    }
    
    setShowSaveDialog(false);
    setNewPresetName('');
    setEditingPreset(null);
  };

  const handleEditPreset = (preset: AppreciationPreset) => {
    setEditingPreset(preset);
    setNewPresetName(preset.name);
    setShowSaveDialog(true);
  };

  const getSelectedLabel = () => {
    if (!selectedPreset) return language === 'es' ? 'Seleccionar perfil' : 'Select profile';
    
    // Check built-in presets
    if (selectedPreset in GROWTH_PRESETS) {
      const preset = GROWTH_PRESETS[selectedPreset as BuiltInPresetKey];
      return language === 'es' ? preset.nameEs : preset.name;
    }
    
    // Check saved presets
    const saved = presets.find(p => p.id === selectedPreset);
    if (saved) return saved.name;
    
    return language === 'es' ? 'Personalizado' : 'Custom';
  };

  return (
    <Card className="bg-theme-card border-theme-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-theme-accent" />
          <CardTitle className="text-lg font-semibold text-theme-text">
            {language === 'es' ? 'Perfiles de Proyección' : 'Growth Projection Profiles'}
          </CardTitle>
        </div>
        <CardDescription className="text-theme-text-muted">
          {language === 'es' 
            ? 'Selecciona un perfil predefinido o crea uno personalizado.'
            : 'Select a preset profile or create a custom one.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Dropdown */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 justify-between bg-theme-bg-alt border-theme-border text-theme-text">
                <span className="flex items-center gap-2">
                  {selectedPreset && selectedPreset in GROWTH_PRESETS ? (
                    <>
                      {(() => {
                        const Icon = GROWTH_PRESETS[selectedPreset as BuiltInPresetKey].icon;
                        return <Icon className="w-4 h-4" />;
                      })()}
                    </>
                  ) : (
                    <Sliders className="w-4 h-4" />
                  )}
                  {getSelectedLabel()}
                  {isModified && (
                    <span className="text-xs text-orange-400 ml-1">(modified)</span>
                  )}
                </span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-theme-card border-theme-border">
              {/* Built-in presets */}
              {(Object.entries(GROWTH_PRESETS) as [BuiltInPresetKey, typeof GROWTH_PRESETS[BuiltInPresetKey]][]).map(([key, preset]) => {
                const Icon = preset.icon;
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleBuiltInPresetSelect(key)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${preset.color}`} />
                      <span className="text-theme-text">
                        {language === 'es' ? preset.nameEs : preset.name}
                      </span>
                    </span>
                    <span className="text-xs text-theme-text-muted font-mono">
                      {preset.construction}%/{preset.growth}%/{preset.mature}%
                    </span>
                  </DropdownMenuItem>
                );
              })}
              
              {/* Saved presets */}
              {presets.length > 0 && (
                <>
                  <DropdownMenuSeparator className="bg-theme-border" />
                  <div className="px-2 py-1.5 text-xs text-theme-text-muted font-medium">
                    {language === 'es' ? 'Mis Perfiles' : 'My Profiles'}
                  </div>
                  {presets.map((preset) => (
                    <DropdownMenuItem
                      key={preset.id}
                      onClick={() => handleSavedPresetSelect(preset)}
                      className="flex items-center justify-between cursor-pointer group"
                    >
                      <span className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-purple-400" />
                        <span className="text-theme-text">{preset.name}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-theme-text-muted font-mono group-hover:hidden">
                          {preset.construction_appreciation}%/{preset.growth_appreciation}%/{preset.mature_appreciation}%
                        </span>
                        <div className="hidden group-hover:flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditPreset(preset); }}
                            className="p-1 hover:bg-theme-bg-alt rounded"
                          >
                            <Edit2 className="w-3 h-3 text-theme-text-muted" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}
                            className="p-1 hover:bg-red-500/10 rounded"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => { setEditingPreset(null); setNewPresetName(''); setShowSaveDialog(true); }}
            className="border-theme-accent/30 text-theme-accent hover:bg-theme-accent/10"
          >
            <Plus className="w-4 h-4 mr-1" />
            {language === 'es' ? 'Guardar' : 'Save'}
          </Button>
        </div>

        {/* Custom Sliders */}
        <div className="space-y-5 p-4 rounded-xl border bg-theme-bg-alt border-theme-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Construction Phase */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <label className="text-sm text-theme-text">
                    {language === 'es' ? 'Construcción' : 'Construction'}
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3.5 h-3.5 text-theme-text-muted" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px] bg-theme-card border-theme-border">
                        <p className="text-xs text-theme-text">
                          {language === 'es' 
                            ? 'Tasa de apreciación anual durante la construcción. Típicamente 8-15%.'
                            : 'Annual appreciation rate during construction. Typically 8-15%.'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-sm text-orange-400 font-mono font-medium">{constructionAppreciation}%</span>
              </div>
              <Slider
                value={[constructionAppreciation]}
                onValueChange={([value]) => setConstructionAppreciation(value)}
                min={5}
                max={20}
                step={1}
                className="roi-slider-lime"
              />
            </div>

            {/* Growth Phase */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <label className="text-sm text-theme-text">
                    {language === 'es' ? 'Crecimiento' : 'Growth'}
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3.5 h-3.5 text-theme-text-muted" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px] bg-theme-card border-theme-border">
                        <p className="text-xs text-theme-text">
                          {language === 'es' 
                            ? 'Tasa post-entrega mientras el área se desarrolla. Típicamente 5-12%.'
                            : 'Post-handover rate while the area develops. Typically 5-12%.'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-sm text-green-400 font-mono font-medium">{growthAppreciation}%</span>
              </div>
              <Slider
                value={[growthAppreciation]}
                onValueChange={([value]) => setGrowthAppreciation(value)}
                min={3}
                max={15}
                step={1}
                className="roi-slider-lime"
              />
            </div>

            {/* Growth Duration */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-theme-accent" />
                  <label className="text-sm text-theme-text">
                    {language === 'es' ? 'Duración Crecimiento' : 'Growth Duration'}
                  </label>
                </div>
                <span className="text-sm text-theme-accent font-mono font-medium">
                  {growthPeriodYears} {language === 'es' ? 'años' : 'years'}
                </span>
              </div>
              <Slider
                value={[growthPeriodYears]}
                onValueChange={([value]) => setGrowthPeriodYears(value)}
                min={2}
                max={10}
                step={1}
                className="roi-slider-lime"
              />
            </div>

            {/* Mature Phase */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <label className="text-sm text-theme-text">
                    {language === 'es' ? 'Madurez' : 'Mature'}
                  </label>
                </div>
                <span className="text-sm text-blue-400 font-mono font-medium">{matureAppreciation}%</span>
              </div>
              <Slider
                value={[matureAppreciation]}
                onValueChange={([value]) => setMatureAppreciation(value)}
                min={1}
                max={8}
                step={1}
                className="roi-slider-lime"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="pt-3 border-t border-theme-border">
            <div className="flex items-center justify-center gap-3 text-sm font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-orange-400">{constructionAppreciation}%</span>
              </div>
              <span className="text-theme-text-muted">→</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400">{growthAppreciation}%</span>
                <span className="text-theme-text-muted text-xs">({growthPeriodYears}y)</span>
              </div>
              <span className="text-theme-text-muted">→</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-blue-400">{matureAppreciation}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Preset Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="bg-theme-card border-theme-border">
            <DialogHeader>
              <DialogTitle className="text-theme-text">
                {editingPreset 
                  ? (language === 'es' ? 'Editar Perfil' : 'Edit Profile')
                  : (language === 'es' ? 'Guardar Perfil' : 'Save Profile')}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="block text-sm text-theme-text-muted mb-2">
                {language === 'es' ? 'Nombre del perfil' : 'Profile name'}
              </label>
              <Input
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder={language === 'es' ? 'Mi perfil personalizado' : 'My custom profile'}
                className="bg-theme-bg-alt border-theme-border text-theme-text"
              />
              <div className="mt-4 p-3 bg-theme-bg-alt rounded-lg">
                <div className="text-xs text-theme-text-muted mb-2">
                  {language === 'es' ? 'Valores a guardar:' : 'Values to save:'}
                </div>
                <div className="flex items-center gap-2 text-sm font-mono">
                  <span className="text-orange-400">{constructionAppreciation}%</span>
                  <span className="text-theme-text-muted">→</span>
                  <span className="text-green-400">{growthAppreciation}%</span>
                  <span className="text-theme-text-muted">({growthPeriodYears}y) →</span>
                  <span className="text-blue-400">{matureAppreciation}%</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                className="border-theme-border text-theme-text"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button
                onClick={handleSavePreset}
                disabled={!newPresetName.trim() || saving}
                className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
              >
                {saving 
                  ? (language === 'es' ? 'Guardando...' : 'Saving...') 
                  : (language === 'es' ? 'Guardar' : 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
