import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Shield, Target, Gauge, Sliders, Info, Plus, Trash2, Edit2, ChevronDown, Save, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAppreciationPresets, AppreciationPreset } from '@/hooks/useAppreciationPresets';

// Built-in Growth Profile Presets - these can be overridden by user
const DEFAULT_BUILTIN_PRESETS = {
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

type BuiltInPresetKey = keyof typeof DEFAULT_BUILTIN_PRESETS;

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
  const [editingBuiltIn, setEditingBuiltIn] = useState<BuiltInPresetKey | null>(null);
  
  // Track if sliders have been manually modified since last preset selection
  const [hasManualChanges, setHasManualChanges] = useState(false);
  const [showSwitchWarning, setShowSwitchWarning] = useState(false);
  const [pendingPresetSwitch, setPendingPresetSwitch] = useState<{ type: 'builtin', key: BuiltInPresetKey } | { type: 'saved', preset: AppreciationPreset } | null>(null);
  
  // Track the last applied preset values to detect manual changes
  const lastAppliedValuesRef = useRef<{ c: number; g: number; m: number; y: number } | null>(null);

  // Get effective values for built-in presets (check for user overrides)
  const getBuiltInPresetValues = (key: BuiltInPresetKey) => {
    const override = presets.find(p => p.builtin_key === key);
    if (override) {
      return {
        construction: override.construction_appreciation,
        growth: override.growth_appreciation,
        mature: override.mature_appreciation,
        growthYears: override.growth_period_years,
      };
    }
    return DEFAULT_BUILTIN_PRESETS[key];
  };

  // Check if a built-in preset has been modified
  const isBuiltInModified = (key: BuiltInPresetKey) => {
    return presets.some(p => p.builtin_key === key);
  };

  // Detect manual slider changes
  useEffect(() => {
    if (lastAppliedValuesRef.current) {
      const { c, g, m, y } = lastAppliedValuesRef.current;
      if (
        constructionAppreciation !== c ||
        growthAppreciation !== g ||
        matureAppreciation !== m ||
        growthPeriodYears !== y
      ) {
        setHasManualChanges(true);
      }
    }
  }, [constructionAppreciation, growthAppreciation, matureAppreciation, growthPeriodYears]);

  const applyPresetValues = (values: { construction: number; growth: number; mature: number; growthYears: number }, presetId: string) => {
    setConstructionAppreciation(values.construction);
    setGrowthAppreciation(values.growth);
    setMatureAppreciation(values.mature);
    setGrowthPeriodYears(values.growthYears);
    setSelectedPreset(presetId);
    setHasManualChanges(false);
    lastAppliedValuesRef.current = { c: values.construction, g: values.growth, m: values.mature, y: values.growthYears };
  };

  const handleBuiltInPresetSelect = (key: BuiltInPresetKey) => {
    if (hasManualChanges) {
      setPendingPresetSwitch({ type: 'builtin', key });
      setShowSwitchWarning(true);
      return;
    }
    const values = getBuiltInPresetValues(key);
    applyPresetValues(values, key);
  };

  const handleSavedPresetSelect = (preset: AppreciationPreset) => {
    if (hasManualChanges) {
      setPendingPresetSwitch({ type: 'saved', preset });
      setShowSwitchWarning(true);
      return;
    }
    applyPresetValues({
      construction: preset.construction_appreciation,
      growth: preset.growth_appreciation,
      mature: preset.mature_appreciation,
      growthYears: preset.growth_period_years,
    }, preset.id);
  };

  const confirmPresetSwitch = () => {
    if (!pendingPresetSwitch) return;
    
    if (pendingPresetSwitch.type === 'builtin') {
      const values = getBuiltInPresetValues(pendingPresetSwitch.key);
      applyPresetValues(values, pendingPresetSwitch.key);
    } else {
      const { preset } = pendingPresetSwitch;
      applyPresetValues({
        construction: preset.construction_appreciation,
        growth: preset.growth_appreciation,
        mature: preset.mature_appreciation,
        growthYears: preset.growth_period_years,
      }, preset.id);
    }
    
    setShowSwitchWarning(false);
    setPendingPresetSwitch(null);
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim() && !editingBuiltIn) return;
    
    const values = {
      constructionAppreciation,
      growthAppreciation,
      matureAppreciation,
      growthPeriodYears,
    };

    if (editingBuiltIn) {
      // Save as built-in override
      const existingOverride = presets.find(p => p.builtin_key === editingBuiltIn);
      if (existingOverride) {
        await updatePreset(existingOverride.id, existingOverride.name, values);
      } else {
        // Create new override with special naming
        const builtIn = DEFAULT_BUILTIN_PRESETS[editingBuiltIn];
        const name = language === 'es' ? builtIn.nameEs : builtIn.name;
        const result = await savePreset(name, values);
        // Update the preset to mark it as a built-in override
        if (result) {
          // We need to update via direct supabase call since savePreset doesn't support builtin_key
          const { supabase } = await import('@/integrations/supabase/client');
          const latestPreset = presets.find(p => p.name === name);
          if (latestPreset) {
            await supabase
              .from('appreciation_presets')
              .update({ builtin_key: editingBuiltIn, is_builtin_override: true })
              .eq('id', latestPreset.id);
          }
        }
      }
    } else if (editingPreset) {
      await updatePreset(editingPreset.id, newPresetName, values);
    } else {
      await savePreset(newPresetName, values);
    }
    
    setShowSaveDialog(false);
    setNewPresetName('');
    setEditingPreset(null);
    setEditingBuiltIn(null);
  };

  const handleEditBuiltIn = (key: BuiltInPresetKey) => {
    // Load the current values for this preset
    const values = getBuiltInPresetValues(key);
    setConstructionAppreciation(values.construction);
    setGrowthAppreciation(values.growth);
    setMatureAppreciation(values.mature);
    setGrowthPeriodYears(values.growthYears);
    setSelectedPreset(key);
    setEditingBuiltIn(key);
    setShowSaveDialog(true);
  };

  const handleResetBuiltIn = async (key: BuiltInPresetKey) => {
    const override = presets.find(p => p.builtin_key === key);
    if (override) {
      await deletePreset(override.id);
    }
  };

  const handleEditPreset = (preset: AppreciationPreset) => {
    setEditingPreset(preset);
    setNewPresetName(preset.name);
    setShowSaveDialog(true);
  };

  const getSelectedLabel = () => {
    if (!selectedPreset) return language === 'es' ? 'Seleccionar perfil' : 'Select profile';
    
    // Check built-in presets
    if (selectedPreset in DEFAULT_BUILTIN_PRESETS) {
      const preset = DEFAULT_BUILTIN_PRESETS[selectedPreset as BuiltInPresetKey];
      return language === 'es' ? preset.nameEs : preset.name;
    }
    
    // Check saved presets
    const saved = presets.find(p => p.id === selectedPreset);
    if (saved) return saved.name;
    
    return language === 'es' ? 'Personalizado' : 'Custom';
  };

  // Get custom presets (excluding built-in overrides)
  const customPresets = presets.filter(p => !p.builtin_key);

  return (
    <>
      {/* Warning dialog for switching presets with unsaved changes */}
      <AlertDialog open={showSwitchWarning} onOpenChange={setShowSwitchWarning}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              {language === 'es' ? 'Cambios no aplicados' : 'Unapplied Changes'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              {language === 'es' 
                ? 'Has modificado los valores de apreciación. ¿Quieres cambiar de perfil y perder estos cambios?'
                : 'You have modified the appreciation values. Do you want to switch profiles and lose these changes?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-theme-bg-alt border-theme-border text-theme-text hover:bg-theme-bg">
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPresetSwitch} className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90">
              {language === 'es' ? 'Cambiar perfil' : 'Switch Profile'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="bg-theme-card border-theme-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-theme-accent" />
              <CardTitle className="text-lg font-semibold text-theme-text">
                {language === 'es' ? 'Perfiles de Proyección' : 'Growth Projection Profiles'}
              </CardTitle>
            </div>
            {hasManualChanges && (
              <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {language === 'es' ? 'Modificado' : 'Modified'}
              </span>
            )}
          </div>
          <CardDescription className="text-theme-text-muted">
            {language === 'es' 
              ? 'Selecciona, edita o crea perfiles de apreciación.'
              : 'Select, edit or create appreciation profiles.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Built-in Preset Cards */}
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(DEFAULT_BUILTIN_PRESETS) as [BuiltInPresetKey, typeof DEFAULT_BUILTIN_PRESETS[BuiltInPresetKey]][]).map(([key, preset]) => {
            const Icon = preset.icon;
            const isSelected = selectedPreset === key;
            const isModified = isBuiltInModified(key);
            const values = getBuiltInPresetValues(key);
            
            return (
              <div key={key} className="relative group">
                <button
                  onClick={() => handleBuiltInPresetSelect(key)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected 
                      ? `${preset.borderColor} ${preset.bgColor}` 
                      : 'border-theme-border bg-theme-bg-alt hover:border-theme-border-alt'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${isSelected ? preset.color : 'text-theme-text-muted'}`} />
                    {isModified && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                        {language === 'es' ? 'Editado' : 'Edited'}
                      </span>
                    )}
                  </div>
                  <div className={`text-sm font-medium ${isSelected ? 'text-theme-text' : 'text-theme-text-muted'}`}>
                    {language === 'es' ? preset.nameEs : preset.name}
                  </div>
                  <div className="mt-2 pt-2 border-t border-theme-border/50">
                    <div className="text-[10px] font-mono text-theme-text-muted">
                      {values.construction}% → {values.growth}% → {values.mature}%
                    </div>
                  </div>
                </button>
                
                {/* Edit button on hover */}
                <button
                  onClick={() => handleEditBuiltIn(key)}
                  className="absolute top-2 right-2 p-1.5 bg-theme-bg rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-theme-border hover:bg-theme-bg-alt"
                >
                  <Edit2 className="w-3 h-3 text-theme-text-muted" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Custom Presets Dropdown */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 justify-between bg-theme-bg-alt border-theme-border text-theme-text">
                <span className="flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  {customPresets.length > 0 
                    ? (language === 'es' ? `${customPresets.length} perfiles guardados` : `${customPresets.length} saved profiles`)
                    : (language === 'es' ? 'Perfiles personalizados' : 'Custom profiles')}
                </span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-theme-card border-theme-border">
              {customPresets.length === 0 ? (
                <div className="px-3 py-2 text-sm text-theme-text-muted">
                  {language === 'es' ? 'No hay perfiles personalizados' : 'No custom profiles yet'}
                </div>
              ) : (
                customPresets.map((preset) => (
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
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => { setEditingPreset(null); setEditingBuiltIn(null); setNewPresetName(''); setShowSaveDialog(true); }}
            className="border-theme-accent/30 text-theme-accent hover:bg-theme-accent/10"
          >
            <Plus className="w-4 h-4 mr-1" />
            {language === 'es' ? 'Nuevo' : 'New'}
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
                {editingBuiltIn 
                  ? (language === 'es' 
                      ? `Editar ${DEFAULT_BUILTIN_PRESETS[editingBuiltIn].nameEs}` 
                      : `Edit ${DEFAULT_BUILTIN_PRESETS[editingBuiltIn].name}`)
                  : editingPreset 
                    ? (language === 'es' ? 'Editar Perfil' : 'Edit Profile')
                    : (language === 'es' ? 'Guardar Perfil' : 'Save Profile')}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {!editingBuiltIn && (
                <div className="mb-4">
                  <label className="block text-sm text-theme-text-muted mb-2">
                    {language === 'es' ? 'Nombre del perfil' : 'Profile name'}
                  </label>
                  <Input
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder={language === 'es' ? 'Mi perfil personalizado' : 'My custom profile'}
                    className="bg-theme-bg-alt border-theme-border text-theme-text"
                  />
                </div>
              )}
              
              {editingBuiltIn && (
                <p className="text-sm text-theme-text-muted mb-4">
                  {language === 'es' 
                    ? 'Los cambios se guardarán como tu versión personalizada de este perfil.'
                    : 'Changes will be saved as your custom version of this profile.'}
                </p>
              )}
              
              <div className="p-3 bg-theme-bg-alt rounded-lg">
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
              
              {editingBuiltIn && isBuiltInModified(editingBuiltIn) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { handleResetBuiltIn(editingBuiltIn); setShowSaveDialog(false); }}
                  className="mt-4 w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  {language === 'es' ? 'Restaurar valores originales' : 'Reset to default values'}
                </Button>
              )}
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
                disabled={(!newPresetName.trim() && !editingBuiltIn) || saving}
                className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
              >
                <Save className="w-4 h-4 mr-1" />
                {saving 
                  ? (language === 'es' ? 'Guardando...' : 'Saving...') 
                  : (language === 'es' ? 'Guardar' : 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
    </>
  );
};
