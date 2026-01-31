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
    description: 'Emerging areas with high potential',
    descriptionEs: 'Zonas emergentes con alto potencial',
    icon: Rocket,
    color: 'orange',
    constructionAppreciation: 15,
    growthAppreciation: 12,
    matureAppreciation: 6,
    growthPeriodYears: 3,
    riskLevel: 'Higher risk, higher reward',
    riskLevelEs: 'Mayor riesgo, mayor retorno',
    tooltipEn: 'Best for emerging areas like Dubai South, new masterplans. Construction: 15%/year, Growth: 12%/year for 3 years, Mature: 6%/year. Higher volatility but potential for 2-3x returns.',
    tooltipEs: 'Ideal para zonas emergentes como Dubai South. Construcción: 15%/año, Crecimiento: 12%/año por 3 años, Madurez: 6%/año. Mayor volatilidad pero potencial de 2-3x retornos.',
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    nameEs: 'Equilibrado',
    description: 'Developing areas with steady growth',
    descriptionEs: 'Zonas en desarrollo con crecimiento estable',
    icon: TrendingUp,
    color: 'lime',
    constructionAppreciation: 12,
    growthAppreciation: 8,
    matureAppreciation: 4,
    growthPeriodYears: 3,
    riskLevel: 'Moderate risk, solid returns',
    riskLevelEs: 'Riesgo moderado, retornos sólidos',
    tooltipEn: 'Best for developing areas like Creek Harbour, Dubai Hills. Construction: 12%/year, Growth: 8%/year for 3 years, Mature: 4%/year. Good balance of growth and stability.',
    tooltipEs: 'Ideal para zonas en desarrollo como Creek Harbour, Dubai Hills. Construcción: 12%/año, Crecimiento: 8%/año por 3 años, Madurez: 4%/año. Buen equilibrio.',
  },
  conservative: {
    id: 'conservative',
    name: 'Conservative',
    nameEs: 'Conservador',
    description: 'Established areas with stable values',
    descriptionEs: 'Zonas establecidas con valores estables',
    icon: Shield,
    color: 'blue',
    constructionAppreciation: 8,
    growthAppreciation: 5,
    matureAppreciation: 3,
    growthPeriodYears: 3,
    riskLevel: 'Lower risk, stable growth',
    riskLevelEs: 'Menor riesgo, crecimiento estable',
    tooltipEn: 'Best for mature areas like Downtown, Marina, Palm. Construction: 8%/year, Growth: 5%/year for 3 years, Mature: 3%/year. Capital preservation focus.',
    tooltipEs: 'Ideal para zonas maduras como Downtown, Marina, Palm. Construcción: 8%/año, Crecimiento: 5%/año por 3 años, Madurez: 3%/año. Enfoque en preservar capital.',
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
    // Default to 3 for balanced profile matching
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
        bg: 'bg-theme-card',
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
          bg: 'bg-theme-card',
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
      <div>
        <h3 className="text-lg font-semibold text-theme-text mb-1">
          {language === 'es' ? 'Proyección de Crecimiento' : 'Growth Projection'}
        </h3>
        <p className="text-sm text-theme-text-muted">
          {language === 'es' 
            ? 'Proyecta cómo crecerá el valor de la propiedad en el tiempo'
            : 'Project how the property value will grow over time'}
        </p>
      </div>

      {/* Appreciation Bonus Banner */}
      {appreciationBonus > 0 && (
        <div className="p-2 bg-theme-accent/10 rounded-lg border border-theme-accent/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-theme-accent flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {language === 'es' ? 'Bonus por Diferenciadores' : 'Value Differentiators Bonus'}
            </span>
            <span className="text-xs text-theme-accent font-mono font-bold">+{appreciationBonus.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Profile Cards - Single Row */}
      <div className="flex gap-2">
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
                "flex-1 p-2.5 rounded-xl border transition-all text-center",
                colors.bg,
                colors.border,
                isSelected ? "ring-1 ring-offset-1 ring-offset-theme-bg" : "hover:border-theme-text-muted",
                isSelected && profile.color === 'orange' && "ring-orange-500/50",
                isSelected && profile.color === 'lime' && "ring-theme-accent/50",
                isSelected && profile.color === 'blue' && "ring-blue-500/50"
              )}
            >
              <div className="flex flex-col items-center gap-1.5">
                <Icon className={cn("w-4 h-4", colors.icon)} />
                <h4 className={cn("font-medium text-xs", isSelected ? colors.text : "text-theme-text")}>
                  {language === 'es' ? profile.nameEs : profile.name}
                </h4>
                <div className="flex items-center gap-0.5 text-[8px] font-mono">
                  <span className="text-orange-400">{profile.constructionAppreciation}%</span>
                  <span className="text-theme-text-muted">→</span>
                  <span className="text-green-400">{profile.growthAppreciation}% ({profile.growthPeriodYears}y)</span>
                  <span className="text-theme-text-muted">→</span>
                  <span className="text-blue-400">{profile.matureAppreciation}%</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Profile Indicator */}
      {selectedProfile === 'custom' && (
        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium">
                {language === 'es' ? 'Perfil Personalizado' : 'Custom Profile'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-orange-400">{inputs.constructionAppreciation ?? 12}%</span>
              <span className="text-theme-text-muted">→</span>
              <span className="text-green-400">{inputs.growthAppreciation ?? 8}%</span>
              <span className="text-theme-text-muted">→</span>
              <span className="text-blue-400">{inputs.matureAppreciation ?? 4}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Growth Projection Chart */}
      <div className="p-4 bg-theme-card rounded-xl border border-theme-border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-theme-text">
            {language === 'es' ? 'Proyección 7 Años' : '7-Year Projection'}
          </h4>
          <div className="flex items-center gap-1 p-0.5 bg-theme-bg-alt rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPSF(false)}
              className={cn(
                "h-6 px-2 text-xs",
                !showPSF ? "bg-theme-accent/20 text-theme-accent" : "text-theme-text-muted hover:text-theme-text"
              )}
            >
              Total
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPSF(true)}
              className={cn(
                "h-6 px-2 text-xs",
                showPSF ? "bg-theme-accent/20 text-theme-accent" : "text-theme-text-muted hover:text-theme-text"
              )}
            >
              PSF
            </Button>
          </div>
        </div>
        
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectedData.data} margin={{ top: 20, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="year" 
                tick={{ fill: 'hsl(var(--theme-text-muted))', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(var(--theme-border))' }}
                tickLine={false}
                tickFormatter={(v) => `Y${v}`}
              />
              <YAxis 
                hide
                domain={['dataMin', 'dataMax']}
              />
              {projectedData.yearsToHandover > 0 && projectedData.yearsToHandover < 7 && (
                <>
                  <ReferenceLine 
                    x={handoverYear} 
                    stroke="hsl(var(--theme-accent))"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    label={{
                      value: language === 'es' ? '🔑 Entrega' : '🔑 Handover',
                      position: 'top',
                      fill: 'hsl(var(--theme-accent))',
                      fontSize: 9,
                      fontWeight: 'bold',
                    }}
                  />
                  {handoverDataPoint && (
                    <ReferenceDot
                      x={handoverYear}
                      y={showPSF ? handoverDataPoint.psfValue : handoverDataPoint.totalValue}
                      r={5}
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
                      <div className="bg-theme-bg-alt border border-theme-border rounded-lg p-2 text-xs">
                        <p className="text-theme-text-muted">Year {data.year}</p>
                        <p className="text-theme-accent font-mono font-bold">
                          {formatValue(showPSF ? data.psfValue : data.totalValue)}
                        </p>
                        <p className="text-theme-text-muted capitalize">{data.phase} phase</p>
                        {data.isHandover && (
                          <p className="text-theme-accent text-[10px] mt-1">🔑 Handover Year</p>
                        )}
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

        {/* Phase Legend */}
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-gray-500">{language === 'es' ? 'Construcción' : 'Construction'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-theme-text-muted">
              {language === 'es' ? 'Crecimiento' : 'Growth'}
              <span className="text-green-400 ml-1">({growthPeriodYears}y)</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-theme-text-muted">{language === 'es' ? 'Madurez' : 'Mature'}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics - Compact Single Row */}
      <div className="flex items-center justify-between p-3 bg-theme-card rounded-lg border border-theme-border">
        <div className="text-center flex-1">
          <p className="text-[9px] text-theme-text-muted uppercase">
            {language === 'es' ? '3 Años' : '3Y Value'}
          </p>
          <p className="text-xs font-bold text-theme-text">
            {currency} {(value3Y / 1000000).toFixed(2)}M
          </p>
        </div>
        
        <div className="h-8 w-px bg-theme-border" />
        
        <div className="text-center flex-1">
          <p className="text-[9px] text-theme-text-muted uppercase">
            {language === 'es' ? '7 Años' : '7Y Value'}
          </p>
          <p className="text-xs font-bold text-theme-accent">
            {currency} {(value7Y / 1000000).toFixed(2)}M
          </p>
        </div>
        
        <div className="h-8 w-px bg-theme-border" />
        
        <div className="text-center flex-1">
          <p className="text-[9px] text-theme-text-muted uppercase">
            {language === 'es' ? 'Crecimiento' : 'Growth'}
          </p>
          <p className="text-xs font-bold text-green-400">+{totalGrowth.toFixed(0)}%</p>
        </div>
        
        <div className="h-8 w-px bg-theme-border" />
        
        <div className="text-center flex-1">
          <p className="text-[9px] text-theme-text-muted uppercase">
            {language === 'es' ? 'PSF 7Y' : '7Y PSF'}
          </p>
          <p className="text-xs font-bold text-theme-text">
            {currency} {psf7Y.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Customize Collapsible */}
      <Collapsible open={customOpen} onOpenChange={setCustomOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-theme-card rounded-xl border border-theme-border hover:border-theme-border-alt transition-colors">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-theme-text-muted" />
            <span className="text-sm text-theme-text">
              {language === 'es' ? 'Personalizar apreciación' : 'Customize appreciation'}
            </span>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-theme-text-muted transition-transform", customOpen && "rotate-180")} />
        </CollapsibleTrigger>
        
        <CollapsibleContent className="pt-3">
          <div className="space-y-4 p-4 bg-theme-card rounded-xl border border-theme-border">
            {/* Explanation */}
            <div className="p-3 bg-theme-bg rounded-lg border border-theme-border">
              <p className="text-xs text-theme-text-muted">
                {language === 'es' 
                  ? 'La apreciación se divide en 3 fases: Construcción (antes de entrega), Crecimiento (primeros años post-entrega) y Madurez (largo plazo). Ajusta cada fase según tu análisis del mercado.'
                  : 'Appreciation is divided into 3 phases: Construction (before handover), Growth (first years post-handover), and Mature (long term). Adjust each phase based on your market analysis.'}
              </p>
            </div>

            {/* Construction */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-theme-text-muted">
                    {language === 'es' ? 'Fase Construcción' : 'Construction Phase'}
                  </label>
                  <InfoTooltip translationKey="tooltipConstructionAppreciation" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-orange-400 font-mono">{inputs.constructionAppreciation ?? 12}%</span>
                  {appreciationBonus > 0 && (
                    <>
                      <span className="text-xs text-theme-text-muted">→</span>
                      <span className="text-xs text-theme-accent font-mono font-bold">
                        {((inputs.constructionAppreciation ?? 12) + appreciationBonus).toFixed(1)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Slider
                value={[inputs.constructionAppreciation ?? 12]}
                onValueChange={([value]) => setInputs(prev => ({ ...prev, constructionAppreciation: value }))}
                min={5}
                max={20}
                step={1}
                className="roi-slider-lime"
              />
            </div>

            {/* Growth */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-theme-text-muted">
                    {language === 'es' ? `Fase Crecimiento (${inputs.growthPeriodYears ?? 5}a)` : `Growth Phase (${inputs.growthPeriodYears ?? 5}y)`}
                  </label>
                  <InfoTooltip translationKey="tooltipGrowthAppreciation" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-green-400 font-mono">{inputs.growthAppreciation ?? 8}%</span>
                  {appreciationBonus > 0 && (
                    <>
                      <span className="text-xs text-theme-text-muted">→</span>
                      <span className="text-xs text-theme-accent font-mono font-bold">
                        {((inputs.growthAppreciation ?? 8) + appreciationBonus).toFixed(1)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Slider
                value={[inputs.growthAppreciation ?? 8]}
                onValueChange={([value]) => setInputs(prev => ({ ...prev, growthAppreciation: value }))}
                min={3}
                max={15}
                step={1}
                className="roi-slider-lime"
              />
            </div>

            {/* Growth Period */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-theme-text-muted">
                    {language === 'es' ? 'Duración Crecimiento' : 'Growth Duration'}
                  </label>
                  <InfoTooltip translationKey="tooltipGrowthYears" />
                </div>
                <span className="text-xs text-theme-text font-mono">
                  {inputs.growthPeriodYears ?? 5} {language === 'es' ? 'años' : 'years'}
                </span>
              </div>
              <Slider
                value={[inputs.growthPeriodYears ?? 5]}
                onValueChange={([value]) => setInputs(prev => ({ ...prev, growthPeriodYears: value }))}
                min={2}
                max={10}
                step={1}
                className="roi-slider-lime"
              />
            </div>

            {/* Mature */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-theme-text-muted">
                    {language === 'es' ? 'Fase Madurez' : 'Mature Phase'}
                  </label>
                  <InfoTooltip translationKey="tooltipMatureAppreciation" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-blue-400 font-mono">{inputs.matureAppreciation ?? 4}%</span>
                  {appreciationBonus > 0 && (
                    <>
                      <span className="text-xs text-theme-text-muted">→</span>
                      <span className="text-xs text-theme-accent font-mono font-bold">
                        {((inputs.matureAppreciation ?? 4) + appreciationBonus).toFixed(1)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Slider
                value={[inputs.matureAppreciation ?? 4]}
                onValueChange={([value]) => setInputs(prev => ({ ...prev, matureAppreciation: value }))}
                min={1}
                max={8}
                step={1}
                className="roi-slider-lime"
              />
            </div>

            {/* Saved Presets */}
            {presets.length > 0 && (
              <div className="pt-3 border-t border-theme-border">
                <label className="text-xs text-theme-text-muted mb-2 block">
                  {language === 'es' ? 'Presets Guardados' : 'Saved Presets'}
                </label>
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
                        className="flex-1 justify-start text-xs text-theme-text hover:text-theme-text h-7"
                      >
                        {preset.name}
                        <span className="ml-auto text-[10px] text-theme-text-muted font-mono">
                          {preset.construction_appreciation}%→{preset.growth_appreciation}%→{preset.mature_appreciation}%
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreset(preset.id)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save New Preset */}
            <div className="pt-3 border-t border-theme-border">
              <label className="text-xs text-theme-text-muted mb-2 block">
                {language === 'es' ? 'Guardar como Preset' : 'Save as Preset'}
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder={language === 'es' ? 'Nombre del preset...' : 'Preset name...'}
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="flex-1 h-8 text-xs bg-theme-bg border-theme-border"
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
                  className="h-8 px-3 bg-theme-accent text-black hover:bg-theme-accent/90 text-xs"
                >
                  <Save className="w-3 h-3 mr-1" />
                  {language === 'es' ? 'Guardar' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
