import { useState } from "react";
import { TrendingUp, Zap, Shield, Rocket, ChevronDown, Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { ConfiguratorSectionProps } from "./types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateAppreciationBonus } from "../valueDifferentiators";
import { InfoTooltip } from "../InfoTooltip";
import { cn } from "@/lib/utils";

// Predefined appreciation profiles
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
    growthPeriodYears: 7,
    riskLevel: 'Higher risk, higher reward',
    riskLevelEs: 'Mayor riesgo, mayor retorno',
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
    growthPeriodYears: 5,
    riskLevel: 'Moderate risk, solid returns',
    riskLevelEs: 'Riesgo moderado, retornos sólidos',
  },
  conservative: {
    id: 'conservative',
    name: 'Capital Preservation',
    nameEs: 'Preservación de Capital',
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
  },
} as const;

type ProfileKey = keyof typeof APPRECIATION_PROFILES;

export const AppreciationSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const { t, language } = useLanguage();
  const [customOpen, setCustomOpen] = useState(false);
  
  const appreciationBonus = calculateAppreciationBonus(inputs.valueDifferentiators || []);

  // Determine which profile is currently selected (or custom)
  const getSelectedProfile = (): ProfileKey | 'custom' => {
    const construction = inputs.constructionAppreciation ?? 12;
    const growth = inputs.growthAppreciation ?? 8;
    const mature = inputs.matureAppreciation ?? 4;
    const period = inputs.growthPeriodYears ?? 5;

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
      useZoneDefaults: false, // No longer using zones
    }));
    setCustomOpen(false);
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    if (!isSelected) {
      return {
        bg: 'bg-[#1a1f2e]',
        border: 'border-[#2a3142]',
        text: 'text-gray-400',
        icon: 'text-gray-500',
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
          bg: 'bg-[#CCFF00]/10',
          border: 'border-[#CCFF00]/50',
          text: 'text-[#CCFF00]',
          icon: 'text-[#CCFF00]',
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
          bg: 'bg-[#1a1f2e]',
          border: 'border-[#2a3142]',
          text: 'text-gray-400',
          icon: 'text-gray-500',
        };
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">
          {language === 'es' ? 'Perfil de Apreciación' : 'Appreciation Profile'}
        </h3>
        <p className="text-sm text-gray-500">
          {language === 'es' 
            ? 'Selecciona cómo esperas que crezca el valor de la propiedad'
            : 'Select how you expect the property value to grow'}
        </p>
      </div>

      {/* Appreciation Bonus Banner */}
      {appreciationBonus > 0 && (
        <div className="p-2 bg-[#CCFF00]/10 rounded-lg border border-[#CCFF00]/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#CCFF00] flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {language === 'es' ? 'Bonus por Diferenciadores' : 'Value Differentiators Bonus'}
            </span>
            <span className="text-xs text-[#CCFF00] font-mono font-bold">+{appreciationBonus.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Profile Cards */}
      <div className="grid grid-cols-1 gap-3">
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
                "w-full p-4 rounded-xl border transition-all text-left",
                colors.bg,
                colors.border,
                isSelected ? "ring-1 ring-offset-1 ring-offset-[#0d1117]" : "hover:border-gray-600",
                isSelected && profile.color === 'orange' && "ring-orange-500/50",
                isSelected && profile.color === 'lime' && "ring-[#CCFF00]/50",
                isSelected && profile.color === 'blue' && "ring-blue-500/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", colors.bg)}>
                  <Icon className={cn("w-5 h-5", colors.icon)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={cn("font-semibold", isSelected ? colors.text : "text-white")}>
                      {language === 'es' ? profile.nameEs : profile.name}
                    </h4>
                    {isSelected && (
                      <div className={cn("w-2 h-2 rounded-full", 
                        profile.color === 'orange' && "bg-orange-400",
                        profile.color === 'lime' && "bg-[#CCFF00]",
                        profile.color === 'blue' && "bg-blue-400"
                      )} />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {language === 'es' ? profile.descriptionEs : profile.description}
                  </p>
                  
                  {/* Rate Preview */}
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-orange-400 font-mono">
                      {profile.constructionAppreciation}%
                      {appreciationBonus > 0 && <span className="text-[#CCFF00]">+{appreciationBonus.toFixed(0)}</span>}
                    </span>
                    <span className="text-gray-600">→</span>
                    <span className="text-green-400 font-mono">
                      {profile.growthAppreciation}%
                      {appreciationBonus > 0 && <span className="text-[#CCFF00]">+{appreciationBonus.toFixed(0)}</span>}
                    </span>
                    <span className="text-gray-600">→</span>
                    <span className="text-blue-400 font-mono">
                      {profile.matureAppreciation}%
                      {appreciationBonus > 0 && <span className="text-[#CCFF00]">+{appreciationBonus.toFixed(0)}</span>}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-gray-600 mt-1">
                    {language === 'es' ? profile.riskLevelEs : profile.riskLevel}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Profile Indicator */}
      {selectedProfile === 'custom' && (
        <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-400 font-medium">
              {language === 'es' ? 'Perfil Personalizado' : 'Custom Profile'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-orange-400 font-mono">{inputs.constructionAppreciation ?? 12}%</span>
            <span className="text-gray-600">→</span>
            <span className="text-green-400 font-mono">{inputs.growthAppreciation ?? 8}%</span>
            <span className="text-gray-600">→</span>
            <span className="text-blue-400 font-mono">{inputs.matureAppreciation ?? 4}%</span>
          </div>
        </div>
      )}

      {/* Customize Collapsible */}
      <Collapsible open={customOpen} onOpenChange={setCustomOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-[#1a1f2e] rounded-xl border border-[#2a3142] hover:border-gray-600 transition-colors">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">
              {language === 'es' ? 'Personalizar apreciación' : 'Customize appreciation'}
            </span>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", customOpen && "rotate-180")} />
        </CollapsibleTrigger>
        
        <CollapsibleContent className="pt-3">
          <div className="space-y-4 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
            {/* Explanation */}
            <div className="p-3 bg-[#0d1117] rounded-lg border border-[#2a3142]">
              <p className="text-xs text-gray-400">
                {language === 'es' 
                  ? 'La apreciación se divide en 3 fases: Construcción (antes de entrega), Crecimiento (primeros años post-entrega) y Madurez (largo plazo). Ajusta cada fase según tu análisis del mercado.'
                  : 'Appreciation is divided into 3 phases: Construction (before handover), Growth (first years post-handover), and Mature (long term). Adjust each phase based on your market analysis.'}
              </p>
            </div>

            {/* Construction */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-400">
                    {language === 'es' ? 'Fase Construcción' : 'Construction Phase'}
                  </label>
                  <InfoTooltip translationKey="tooltipConstructionAppreciation" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-orange-400 font-mono">{inputs.constructionAppreciation ?? 12}%</span>
                  {appreciationBonus > 0 && (
                    <>
                      <span className="text-xs text-gray-500">→</span>
                      <span className="text-xs text-[#CCFF00] font-mono font-bold">
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
                  <label className="text-xs text-gray-400">
                    {language === 'es' ? `Fase Crecimiento (${inputs.growthPeriodYears ?? 5}a)` : `Growth Phase (${inputs.growthPeriodYears ?? 5}y)`}
                  </label>
                  <InfoTooltip translationKey="tooltipGrowthAppreciation" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-green-400 font-mono">{inputs.growthAppreciation ?? 8}%</span>
                  {appreciationBonus > 0 && (
                    <>
                      <span className="text-xs text-gray-500">→</span>
                      <span className="text-xs text-[#CCFF00] font-mono font-bold">
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
                  <label className="text-xs text-gray-400">
                    {language === 'es' ? 'Duración Crecimiento' : 'Growth Duration'}
                  </label>
                  <InfoTooltip translationKey="tooltipGrowthYears" />
                </div>
                <span className="text-xs text-white font-mono">
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
                  <label className="text-xs text-gray-400">
                    {language === 'es' ? 'Fase Madurez' : 'Mature Phase'}
                  </label>
                  <InfoTooltip translationKey="tooltipMatureAppreciation" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-blue-400 font-mono">{inputs.matureAppreciation ?? 4}%</span>
                  {appreciationBonus > 0 && (
                    <>
                      <span className="text-xs text-gray-500">→</span>
                      <span className="text-xs text-[#CCFF00] font-mono font-bold">
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
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
