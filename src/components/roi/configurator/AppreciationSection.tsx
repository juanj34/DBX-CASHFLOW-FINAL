import { useState, useMemo } from "react";
import { TrendingUp, Zap, Shield, Rocket, ChevronDown, Settings, Save, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { ConfiguratorSectionProps } from "./types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateAppreciationBonus } from "../valueDifferentiators";
import { InfoTooltip } from "../InfoTooltip";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppreciationPresets } from "@/hooks/useAppreciationPresets";

// Predefined appreciation profiles with tooltips
const APPRECIATION_PROFILES = {
  aggressive: {
    id: 'aggressive',
    name: 'High Growth',
    nameEs: 'Alto Crecimiento',
    icon: Rocket,
    color: 'orange',
    constructionAppreciation: 15,
    growthAppreciation: 12,
    matureAppreciation: 6,
    growthPeriodYears: 3,
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    nameEs: 'Equilibrado',
    icon: TrendingUp,
    color: 'lime',
    constructionAppreciation: 12,
    growthAppreciation: 8,
    matureAppreciation: 4,
    growthPeriodYears: 3,
  },
  conservative: {
    id: 'conservative',
    name: 'Conservative',
    nameEs: 'Conservador',
    icon: Shield,
    color: 'blue',
    constructionAppreciation: 8,
    growthAppreciation: 5,
    matureAppreciation: 3,
    growthPeriodYears: 3,
  },
} as const;

type ProfileKey = keyof typeof APPRECIATION_PROFILES;

export const AppreciationSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const { t, language } = useLanguage();
  const [customOpen, setCustomOpen] = useState(false);
  const [showPSF, setShowPSF] = useState(false);
  const [presetName, setPresetName] = useState('');
  
  const { presets, savePreset, deletePreset, applyPreset, saving } = useAppreciationPresets();
  
  const appreciationBonus = calculateAppreciationBonus(inputs.valueDifferentiators || []);

  // Current appreciation values
  const constructionRate = (inputs.constructionAppreciation ?? 12) + appreciationBonus;
  const growthRate = (inputs.growthAppreciation ?? 8) + appreciationBonus;
  const matureRate = (inputs.matureAppreciation ?? 4) + appreciationBonus;
  const growthPeriodYears = inputs.growthPeriodYears ?? 5;

  // Calculate projected values - 7 years
  const projectedData = useMemo(() => {
    const basePrice = inputs.basePrice || 1000000;
    const sqft = inputs.unitSizeSqf || 1250;
    
    // Calculate years to handover
    const bookingDate = new Date(inputs.bookingYear || 2025, (inputs.bookingMonth || 1) - 1);
    const handoverQuarterMonth = ((inputs.handoverQuarter || 4) - 1) * 3;
    const handoverDate = new Date(inputs.handoverYear || 2028, handoverQuarterMonth);
    const yearsToHandover = Math.max(0, (handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
    
    const data = [];
    let currentValue = basePrice;
    
    for (let year = 0; year <= 7; year++) {
      let phase: 'construction' | 'growth' | 'mature';
      let rate: number;
      
      if (year < yearsToHandover) {
        phase = 'construction';
        rate = constructionRate;
      } else if (year < yearsToHandover + growthPeriodYears) {
        phase = 'growth';
        rate = growthRate;
      } else {
        phase = 'mature';
        rate = matureRate;
      }
      
      data.push({
        year,
        totalValue: currentValue,
        psfValue: currentValue / sqft,
        phase,
        isHandover: Math.abs(year - yearsToHandover) < 0.5,
      });
      
      currentValue = currentValue * (1 + rate / 100);
    }
    
    return { data, yearsToHandover };
  }, [inputs.basePrice, inputs.unitSizeSqf, inputs.bookingYear, inputs.bookingMonth, inputs.handoverYear, inputs.handoverQuarter, constructionRate, growthRate, matureRate, growthPeriodYears]);

  // Determine which profile is currently selected (or custom)
  const getSelectedProfile = (): ProfileKey | 'custom' => {
    const construction = inputs.constructionAppreciation ?? 12;
    const growth = inputs.growthAppreciation ?? 8;
    const mature = inputs.matureAppreciation ?? 4;
    const period = inputs.growthPeriodYears ?? 3;

    for (const [key, profile] of Object.entries(APPRECIATION_PROFILES)) {
      if (
        profile.constructionAppreciation === construction &&
        profile.growthAppreciation === growth &&
        profile.matureAppreciation === mature &&
        profile.growthPeriodYears === period
      ) {
        return key as ProfileKey;
      }
    }
    return 'custom';
  };

  const selectedProfile = getSelectedProfile();

  const handleSelectProfile = (profileKey: ProfileKey) => {
    const profile = APPRECIATION_PROFILES[profileKey];
    setInputs(prev => ({
      ...prev,
      constructionAppreciation: profile.constructionAppreciation,
      growthAppreciation: profile.growthAppreciation,
      matureAppreciation: profile.matureAppreciation,
      growthPeriodYears: profile.growthPeriodYears,
      useZoneDefaults: false,
    }));
    setCustomOpen(false);
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    if (!isSelected) {
      return {
        bg: 'bg-transparent',
        border: 'border-theme-border',
        text: 'text-theme-text-muted',
        icon: 'text-theme-text-muted',
      };
    }
    switch (color) {
      case 'orange':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/50',
          text: 'text-orange-400',
          icon: 'text-orange-400',
        };
      case 'lime':
        return {
          bg: 'bg-theme-accent/10',
          border: 'border-theme-accent/50',
          text: 'text-theme-accent',
          icon: 'text-theme-accent',
        };
      case 'blue':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/50',
          text: 'text-blue-400',
          icon: 'text-blue-400',
        };
      default:
        return {
          bg: 'bg-transparent',
          border: 'border-theme-border',
          text: 'text-theme-text-muted',
          icon: 'text-theme-text-muted',
        };
    }
  };

  const formatValue = (value: number) => {
    if (showPSF) {
      return `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}/sqft`;
    }
    if (value >= 1000000) {
      return `${currency} ${(value / 1000000).toFixed(2)}M`;
    }
    return `${currency} ${(value / 1000).toFixed(0)}K`;
  };

  const value3Y = projectedData.data[3]?.totalValue || 0;
  const value7Y = projectedData.data[7]?.totalValue || 0;
  const basePrice = inputs.basePrice || 1000000;
  const totalGrowth = ((value7Y / basePrice) - 1) * 100;
  const psf7Y = projectedData.data[7]?.psfValue || 0;
  
  // Get handover data point for the badge
  const handoverYear = Math.round(projectedData.yearsToHandover);
  const handoverDataPoint = projectedData.data[handoverYear];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-semibold text-theme-text">
          {language === 'es' ? 'Proyección de Crecimiento' : 'Growth Projection'}
        </h3>
        <p className="text-sm text-theme-text-muted">
          {language === 'es' ? 'Proyecta el crecimiento del valor' : 'Project property value growth'}
        </p>
      </div>

      {/* Appreciation Bonus Banner */}
      {appreciationBonus > 0 && (
        <div className="flex items-center justify-between py-1.5 px-2 bg-theme-accent/10 rounded-lg border border-theme-accent/30">
          <span className="text-xs text-theme-accent flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {language === 'es' ? 'Bonus Diferenciadores' : 'Differentiators Bonus'}
          </span>
          <span className="text-xs text-theme-accent font-mono font-bold">+{appreciationBonus.toFixed(1)}%</span>
        </div>
      )}

      {/* Profile Selector - Compact Toggle Group */}
      <div className="flex gap-1.5">
        {(Object.entries(APPRECIATION_PROFILES) as [ProfileKey, typeof APPRECIATION_PROFILES[ProfileKey]][]).map(([key, profile]) => {
          const isSelected = selectedProfile === key;
          const colors = getColorClasses(profile.color, isSelected);
          const Icon = profile.icon;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectProfile(key)}
              className={cn(
                "flex-1 py-2 px-2 rounded-lg border transition-all text-center",
                colors.bg,
                colors.border,
                isSelected ? "ring-1 ring-offset-1 ring-offset-theme-bg" : "hover:border-theme-text-muted",
                isSelected && profile.color === 'orange' && "ring-orange-500/50",
                isSelected && profile.color === 'lime' && "ring-theme-accent/50",
                isSelected && profile.color === 'blue' && "ring-blue-500/50"
              )}
            >
              <div className="flex flex-col items-center gap-1">
                <Icon className={cn("w-3.5 h-3.5", colors.icon)} />
                <span className={cn("font-medium text-[10px]", isSelected ? colors.text : "text-theme-text")}>
                  {language === 'es' ? profile.nameEs : profile.name}
                </span>
                <span className="text-[8px] font-mono text-theme-text-muted">
                  {profile.constructionAppreciation}→{profile.growthAppreciation}→{profile.matureAppreciation}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Profile Indicator */}
      {selectedProfile === 'custom' && (
        <div className="flex items-center justify-between py-1.5 px-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
          <div className="flex items-center gap-2">
            <Settings className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-purple-400 font-medium">
              {language === 'es' ? 'Personalizado' : 'Custom'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-purple-400">
            {inputs.constructionAppreciation ?? 12}→{inputs.growthAppreciation ?? 8}→{inputs.matureAppreciation ?? 4}%
          </span>
        </div>
      )}

      {/* Growth Projection Chart - Compact */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-theme-text">
            {language === 'es' ? 'Proyección 7 Años' : '7-Year Projection'}
          </span>
          <div className="flex items-center gap-0.5 p-0.5 bg-theme-bg-alt rounded">
            <button
              type="button"
              onClick={() => setShowPSF(false)}
              className={cn(
                "h-5 px-2 text-[10px] rounded",
                !showPSF ? "bg-theme-accent/20 text-theme-accent" : "text-theme-text-muted hover:text-theme-text"
              )}
            >
              Total
            </button>
            <button
              type="button"
              onClick={() => setShowPSF(true)}
              className={cn(
                "h-5 px-2 text-[10px] rounded",
                showPSF ? "bg-theme-accent/20 text-theme-accent" : "text-theme-text-muted hover:text-theme-text"
              )}
            >
              PSF
            </button>
          </div>
        </div>
        
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectedData.data} margin={{ top: 15, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="year" 
                tick={{ fill: 'hsl(var(--theme-text-muted))', fontSize: 9 }}
                axisLine={{ stroke: 'hsl(var(--theme-border))' }}
                tickLine={false}
                tickFormatter={(v) => `Y${v}`}
              />
              <YAxis hide domain={['dataMin', 'dataMax']} />
              {projectedData.yearsToHandover > 0 && projectedData.yearsToHandover < 7 && (
                <>
                  <ReferenceLine 
                    x={handoverYear} 
                    stroke="hsl(var(--theme-accent))"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    label={{
                      value: '🔑',
                      position: 'top',
                      fontSize: 10,
                    }}
                  />
                  {handoverDataPoint && (
                    <ReferenceDot
                      x={handoverYear}
                      y={showPSF ? handoverDataPoint.psfValue : handoverDataPoint.totalValue}
                      r={4}
                      fill="hsl(var(--theme-accent))"
                      stroke="hsl(var(--theme-bg))"
                      strokeWidth={2}
                    />
                  )}
                </>
              )}
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-theme-bg-alt border border-theme-border rounded p-1.5 text-[10px]">
                        <p className="text-theme-text-muted">Year {data.year}</p>
                        <p className="text-theme-accent font-mono font-bold">
                          {formatValue(showPSF ? data.psfValue : data.totalValue)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="natural" 
                dataKey={showPSF ? "psfValue" : "totalValue"} 
                stroke="#CCFF00" 
                strokeWidth={2}
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Phase Legend - Inline */}
        <div className="flex items-center justify-center gap-3 text-[9px]">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span className="text-theme-text-muted">{language === 'es' ? 'En Construcción' : 'Under Construction'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-theme-text-muted">{language === 'es' ? `Post Entrega (${growthPeriodYears}a)` : `Post Handover (${growthPeriodYears}y)`}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-theme-text-muted">{language === 'es' ? 'Madurez de Zona' : 'Zone Maturity'}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics - Compact Row */}
      <div className="flex items-center justify-between py-2 border-t border-b border-theme-border/30">
        <div className="text-center flex-1">
          <p className="text-[9px] text-theme-text-muted uppercase">3Y</p>
          <p className="text-xs font-bold text-theme-text">{currency} {(value3Y / 1000000).toFixed(2)}M</p>
        </div>
        <div className="h-6 w-px bg-theme-border/50" />
        <div className="text-center flex-1">
          <p className="text-[9px] text-theme-text-muted uppercase">7Y</p>
          <p className="text-xs font-bold text-theme-accent">{currency} {(value7Y / 1000000).toFixed(2)}M</p>
        </div>
        <div className="h-6 w-px bg-theme-border/50" />
        <div className="text-center flex-1">
          <p className="text-[9px] text-theme-text-muted uppercase">Growth</p>
          <p className="text-xs font-bold text-green-400">+{totalGrowth.toFixed(0)}%</p>
        </div>
        <div className="h-6 w-px bg-theme-border/50" />
        <div className="text-center flex-1">
          <p className="text-[9px] text-theme-text-muted uppercase">7Y PSF</p>
          <p className="text-xs font-bold text-theme-text">{currency} {psf7Y.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* Customize Collapsible */}
      <Collapsible open={customOpen} onOpenChange={setCustomOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between py-2 hover:bg-theme-bg-alt/30 rounded-lg transition-colors -mx-1 px-1">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-theme-text-muted" />
            <span className="text-sm text-theme-text">
              {language === 'es' ? 'Personalizar' : 'Customize'}
            </span>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-theme-text-muted transition-transform", customOpen && "rotate-180")} />
        </CollapsibleTrigger>
        
        <CollapsibleContent className="pt-2">
          <div className="space-y-3 pl-4 border-l-2 border-purple-500/30">
            {/* Under Construction */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <label className="text-xs text-theme-text-muted">{language === 'es' ? 'En Construcción' : 'Under Construction'}</label>
                <InfoTooltip translationKey="tooltipConstructionAppreciation" />
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[inputs.constructionAppreciation ?? 12]}
                  onValueChange={([value]) => setInputs(prev => ({ ...prev, constructionAppreciation: value }))}
                  min={5}
                  max={20}
                  step={1}
                  className="w-24 roi-slider-lime"
                />
                <span className="text-xs text-orange-400 font-mono w-8 text-right">{inputs.constructionAppreciation ?? 12}%</span>
              </div>
            </div>

            {/* Post Handover */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <label className="text-xs text-theme-text-muted">{language === 'es' ? `Post Entrega (${inputs.growthPeriodYears ?? 5}a)` : `Post Handover (${inputs.growthPeriodYears ?? 5}y)`}</label>
                <InfoTooltip translationKey="tooltipGrowthAppreciation" />
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[inputs.growthAppreciation ?? 8]}
                  onValueChange={([value]) => setInputs(prev => ({ ...prev, growthAppreciation: value }))}
                  min={3}
                  max={15}
                  step={1}
                  className="w-24 roi-slider-lime"
                />
                <span className="text-xs text-green-400 font-mono w-8 text-right">{inputs.growthAppreciation ?? 8}%</span>
              </div>
            </div>

            {/* Post Handover Duration */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <label className="text-xs text-theme-text-muted">{language === 'es' ? 'Duración Post Entrega' : 'Post Handover Duration'}</label>
                <InfoTooltip translationKey="tooltipGrowthYears" />
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[inputs.growthPeriodYears ?? 5]}
                  onValueChange={([value]) => setInputs(prev => ({ ...prev, growthPeriodYears: value }))}
                  min={2}
                  max={10}
                  step={1}
                  className="w-24 roi-slider-lime"
                />
                <span className="text-xs text-theme-text font-mono w-8 text-right">{inputs.growthPeriodYears ?? 5}y</span>
              </div>
            </div>

            {/* Zone Maturity */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <label className="text-xs text-theme-text-muted">{language === 'es' ? 'Madurez de Zona' : 'Zone Maturity'}</label>
                <InfoTooltip translationKey="tooltipMatureAppreciation" />
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[inputs.matureAppreciation ?? 4]}
                  onValueChange={([value]) => setInputs(prev => ({ ...prev, matureAppreciation: value }))}
                  min={1}
                  max={8}
                  step={1}
                  className="w-24 roi-slider-lime"
                />
                <span className="text-xs text-blue-400 font-mono w-8 text-right">{inputs.matureAppreciation ?? 4}%</span>
              </div>
            </div>

            {/* Saved Presets */}
            {presets.length > 0 && (
              <div className="pt-2 border-t border-theme-border/30">
                <label className="text-xs text-theme-text-muted mb-1.5 block">Saved Presets</label>
                <div className="space-y-1">
                  {presets.map(preset => (
                    <div key={preset.id} className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const values = applyPreset(preset);
                          setInputs(prev => ({
                            ...prev,
                            constructionAppreciation: values.constructionAppreciation,
                            growthAppreciation: values.growthAppreciation,
                            matureAppreciation: values.matureAppreciation,
                            growthPeriodYears: values.growthPeriodYears,
                          }));
                        }}
                        className="flex-1 justify-start text-xs text-theme-text hover:text-theme-text h-6"
                      >
                        {preset.name}
                        <span className="ml-auto text-[9px] text-theme-text-muted font-mono">
                          {preset.construction_appreciation}→{preset.growth_appreciation}→{preset.mature_appreciation}%
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreset(preset.id)}
                        className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save New Preset */}
            <div className="pt-2 border-t border-theme-border/30">
              <label className="text-xs text-theme-text-muted mb-1.5 block">Save as Preset</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Preset name..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="flex-1 h-7 text-xs bg-theme-bg border-theme-border"
                />
                <Button
                  size="sm"
                  onClick={async () => {
                    if (presetName.trim()) {
                      const success = await savePreset(presetName, {
                        constructionAppreciation: inputs.constructionAppreciation ?? 12,
                        growthAppreciation: inputs.growthAppreciation ?? 8,
                        matureAppreciation: inputs.matureAppreciation ?? 4,
                        growthPeriodYears: inputs.growthPeriodYears ?? 5,
                      });
                      if (success) setPresetName('');
                    }
                  }}
                  disabled={!presetName.trim() || saving}
                  className="h-7 px-2 bg-theme-accent text-black hover:bg-theme-accent/90 text-xs"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
