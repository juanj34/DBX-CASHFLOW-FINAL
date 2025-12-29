import { useState } from "react";
import { MapPin, TrendingUp, Save, FolderOpen, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfiguratorSectionProps } from "./types";
import { ZoneSelect } from "@/components/ui/zone-select";
import { ZoneAppreciationIndicator } from "../ZoneAppreciationIndicator";
import { getZoneAppreciationProfile } from "../useOICalculations";
import { useAppreciationPresets } from "@/hooks/useAppreciationPresets";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateAppreciationBonus } from "../valueDifferentiators";

export const AppreciationSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const { t } = useLanguage();
  const { presets, loading: loadingPresets, saving: savingPreset, savePreset, applyPreset } = useAppreciationPresets();
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  const appreciationBonus = calculateAppreciationBonus(inputs.valueDifferentiators || []);

  const handleApplyAppreciationPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      const values = applyPreset(preset);
      setInputs(prev => ({
        ...prev,
        useZoneDefaults: false,
        constructionAppreciation: values.constructionAppreciation,
        growthAppreciation: values.growthAppreciation,
        matureAppreciation: values.matureAppreciation,
        growthPeriodYears: values.growthPeriodYears,
        ...(values.rentGrowthRate !== undefined ? { rentGrowthRate: values.rentGrowthRate } : {}),
      }));
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    const success = await savePreset(presetName.trim(), {
      constructionAppreciation: inputs.constructionAppreciation ?? 12,
      growthAppreciation: inputs.growthAppreciation ?? 8,
      matureAppreciation: inputs.matureAppreciation ?? 4,
      growthPeriodYears: inputs.growthPeriodYears ?? 5,
      rentGrowthRate: inputs.rentGrowthRate,
    });
    if (success) {
      setPresetName('');
      setShowSavePreset(false);
    }
  };

  const handleNumberChange = (field: keyof typeof inputs, value: string, min: number, max: number) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setInputs(prev => ({ ...prev, [field]: Math.min(Math.max(num, min), max) }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Appreciation & Expenses</h3>
        <p className="text-sm text-gray-500">Configure zone-based or custom appreciation rates</p>
      </div>

      {/* Zone Defaults Toggle */}
      <div className="flex items-center justify-between p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#CCFF00]" />
          <span className="text-sm text-gray-300">Use Zone Defaults</span>
        </div>
        <Switch
          checked={inputs.useZoneDefaults ?? true}
          onCheckedChange={(checked) => {
            if (checked) {
              const profile = getZoneAppreciationProfile(inputs.zoneMaturityLevel ?? 60);
              setInputs(prev => ({
                ...prev,
                useZoneDefaults: true,
                constructionAppreciation: profile.constructionAppreciation,
                growthAppreciation: profile.growthAppreciation,
                matureAppreciation: profile.matureAppreciation,
                growthPeriodYears: profile.growthPeriodYears,
              }));
            } else {
              setInputs(prev => ({ ...prev, useZoneDefaults: false }));
            }
          }}
          className="data-[state=checked]:bg-[#CCFF00]"
        />
      </div>

      {/* Zone Selection (when using defaults) */}
      {(inputs.useZoneDefaults ?? true) && (
        <div className="space-y-4 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
          <label className="text-sm text-gray-300 font-medium">Select Zone</label>
          <ZoneSelect
            value={inputs.zoneId || ''}
            onValueChange={(zoneId, zone) => {
              if (zone && zone.maturity_level !== null) {
                const profile = getZoneAppreciationProfile(zone.maturity_level);
                setInputs(prev => ({
                  ...prev,
                  zoneId,
                  zoneMaturityLevel: zone.maturity_level!,
                  ...(prev.useZoneDefaults ? {
                    constructionAppreciation: profile.constructionAppreciation,
                    growthAppreciation: profile.growthAppreciation,
                    matureAppreciation: profile.matureAppreciation,
                    growthPeriodYears: profile.growthPeriodYears,
                  } : {})
                }));
              }
            }}
            className="w-full"
          />

          {/* Manual Maturity Slider (when no zone selected) */}
          {!inputs.zoneId && (
            <div className="space-y-2 pt-3 border-t border-[#2a3142]">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400">Or set maturity manually</label>
                <span className="text-sm font-bold text-[#CCFF00] font-mono">{inputs.zoneMaturityLevel ?? 60}%</span>
              </div>
              <Slider
                value={[inputs.zoneMaturityLevel ?? 60]}
                onValueChange={([value]) => {
                  const profile = getZoneAppreciationProfile(value);
                  if (inputs.useZoneDefaults ?? true) {
                    setInputs(prev => ({
                      ...prev,
                      zoneMaturityLevel: value,
                      constructionAppreciation: profile.constructionAppreciation,
                      growthAppreciation: profile.growthAppreciation,
                      matureAppreciation: profile.matureAppreciation,
                      growthPeriodYears: profile.growthPeriodYears,
                    }));
                  } else {
                    setInputs(prev => ({ ...prev, zoneMaturityLevel: value }));
                  }
                }}
                min={0}
                max={100}
                step={5}
                className="roi-slider-lime"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Emerging (0%)</span>
                <span>Established (100%)</span>
              </div>
            </div>
          )}

          <ZoneAppreciationIndicator maturityLevel={inputs.zoneMaturityLevel ?? 60} compact={false} />
        </div>
      )}

      {/* Custom Appreciation (when not using zone defaults) */}
      {!(inputs.useZoneDefaults ?? true) && (
        <div className="space-y-4 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
          {/* Preset Selector */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#2a3142]">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Load Preset</span>
            </div>
            <Select onValueChange={handleApplyAppreciationPreset}>
              <SelectTrigger className="w-40 h-8 text-xs bg-[#0d1117] border-[#2a3142] text-white">
                <SelectValue placeholder={loadingPresets ? "Loading..." : "Select preset"} />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                {presets.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-gray-500">No presets saved</div>
                ) : (
                  presets.map(preset => (
                    <SelectItem key={preset.id} value={preset.id} className="text-white hover:bg-[#2a3142] text-xs">
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>{preset.name}</span>
                        <span className="text-[10px] text-gray-500">{preset.construction_appreciation}/{preset.growth_appreciation}/{preset.mature_appreciation}%</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Appreciation Bonus Banner */}
          {appreciationBonus > 0 && (
            <div className="p-2 bg-[#CCFF00]/10 rounded-lg border border-[#CCFF00]/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#CCFF00] flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Value Differentiators Bonus
                </span>
                <span className="text-xs text-[#CCFF00] font-mono font-bold">+{appreciationBonus.toFixed(1)}%</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">Added to all appreciation phases</p>
            </div>
          )}

          {/* Appreciation Rates */}
          <div className="space-y-4">
            {/* Construction */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400">Construction Phase</label>
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
                <label className="text-xs text-gray-400">Growth Phase ({inputs.growthPeriodYears ?? 5}y)</label>
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
                <label className="text-xs text-gray-400">Growth Period</label>
                <span className="text-xs text-white font-mono">{inputs.growthPeriodYears ?? 5} years</span>
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
                <label className="text-xs text-gray-400">Mature Phase</label>
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

          {/* Save Preset */}
          <div className="pt-3 border-t border-[#2a3142]">
            {!showSavePreset ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSavePreset(true)}
                className="w-full h-8 text-xs bg-[#0d1117] border-[#CCFF00]/30 text-[#CCFF00] hover:bg-[#CCFF00]/20"
              >
                <Save className="w-3 h-3 mr-1" />
                Save as Preset
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Preset name..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="flex-1 h-8 text-xs bg-[#0d1117] border-[#2a3142] text-white"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSavePreset}
                  disabled={!presetName.trim() || savingPreset}
                  className="h-8 text-xs bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
                >
                  {savingPreset ? '...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
