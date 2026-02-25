import { Sparkles, Users, Image as ImageIcon, Upload, FileImage } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ZoneSelect } from "@/components/ui/zone-select";
import { DeveloperSelect } from "./DeveloperSelect";
import { ProjectSelect } from "./ProjectSelect";
import { ClientUnitData } from "../ClientUnitInfo";
import { UNIT_TYPES } from "../ClientUnitModal";
import { OIInputs } from "../useOICalculations";
import { useLanguage } from "@/contexts/LanguageContext";
import { PaymentPlanExtractor } from "./PaymentPlanExtractor";
import type { AIPaymentPlanResult } from "@/lib/aiExtractionTypes";
import { applyExtractedPlan } from "@/lib/applyExtractedPlan";
import { useState } from "react";
import { toast } from "sonner";
import { ClientSelector } from "@/components/clients/ClientSelector";
import { Client as DbClient } from "@/hooks/useClients";
import { CompactImageUpload } from "./CompactImageUpload";

interface LocationSectionProps {
  clientInfo: ClientUnitData;
  onClientInfoChange: (data: ClientUnitData) => void;
  inputs: OIInputs;
  setInputs: React.Dispatch<React.SetStateAction<OIInputs>>;
  // Client linking props
  dbClientId?: string | null;
  onDbClientSelect?: (clientId: string | null, client: DbClient | null) => void;
  onCreateClient?: () => void;
  clientsRefreshKey?: number;
  // Image upload props
  floorPlanUrl?: string | null;
  buildingRenderUrl?: string | null;
  heroImageUrl?: string | null;
  onFloorPlanChange?: (url: string | null) => void;
  onBuildingRenderChange?: (url: string | null) => void;
  onHeroImageChange?: (url: string | null) => void;
}

const SQF_TO_M2 = 0.092903;

export const LocationSection = ({
  clientInfo,
  onClientInfoChange,
  inputs,
  setInputs,
  dbClientId,
  onDbClientSelect,
  onCreateClient,
  clientsRefreshKey,
  floorPlanUrl,
  buildingRenderUrl,
  heroImageUrl,
  onFloorPlanChange,
  onBuildingRenderChange,
  onHeroImageChange,
}: LocationSectionProps) => {
  const { language, t } = useLanguage();
  const [showAIExtractor, setShowAIExtractor] = useState(false);

  const handleChange = (field: keyof ClientUnitData, value: string | number | boolean) => {
    if (field === 'unitSizeSqf') {
      const sqf = typeof value === 'number' ? value : parseFloat(value as string) || 0;
      const m2 = Math.round(sqf * SQF_TO_M2 * 10) / 10;
      onClientInfoChange({ ...clientInfo, unitSizeSqf: sqf, unitSizeM2: m2 });
    } else if (field === 'unitSizeM2') {
      const m2 = typeof value === 'number' ? value : parseFloat(value as string) || 0;
      const sqf = Math.round(m2 / SQF_TO_M2);
      onClientInfoChange({ ...clientInfo, unitSizeSqf: sqf, unitSizeM2: m2 });
    } else {
      onClientInfoChange({ ...clientInfo, [field]: value });
    }
  };

  const handleZoneChange = (zoneId: string, zone?: { name: string }) => {
    onClientInfoChange({ ...clientInfo, zoneId, zoneName: zone?.name });
  };

  // Handle AI extraction results
  const handleAIExtraction = (plan: AIPaymentPlanResult, bookingDate: { month: number; year: number }) => {
    const { inputs: newInputs, clientInfo: newClientInfo } = applyExtractedPlan(plan, bookingDate, inputs);

    onClientInfoChange({
      ...clientInfo,
      ...newClientInfo,
    });

    setInputs(prev => ({ ...prev, ...newInputs }));
    toast.success('Property data and payment plan imported!');
    setShowAIExtractor(false);
  };

  return (
    <>
      <PaymentPlanExtractor
        open={showAIExtractor}
        onOpenChange={setShowAIExtractor}
        existingBookingMonth={inputs.bookingMonth}
        existingBookingYear={inputs.bookingYear}
        onApply={handleAIExtraction}
      />
      
      <div className="space-y-4">
        {/* Section Header */}
        <div>
          <h3 className="text-lg font-semibold text-theme-text">Location & Property</h3>
        </div>

        {/* AI Import Card */}
        <div className="rounded-xl border-2 border-dashed border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-theme-text">AI Import</h4>
              <p className="text-xs text-theme-text-muted">Upload a brochure or payment plan — AI fills location, property & payment fields</p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setShowAIExtractor(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2 h-9 px-4 font-medium"
          >
            <Upload className="w-4 h-4" />
            Upload PDF / Image
          </Button>
          <div className="flex items-center gap-4 text-[11px] text-theme-text-muted">
            <span className="flex items-center gap-1"><FileImage className="w-3 h-3" /> PNG, JPG, PDF</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Auto-fills all fields</span>
          </div>
        </div>

        {/* Client Selector */}
        {onDbClientSelect && (
          <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30 space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-theme-text-muted">Link to Client</span>
            </div>
            <ClientSelector
              key={clientsRefreshKey}
              value={dbClientId || null}
              onValueChange={onDbClientSelect}
              onCreateNew={onCreateClient}
              placeholder="Select or create client..."
            />
          </div>
        )}

        {/* Zone Field - Compact grouped layout */}
        <div className="p-3 bg-theme-bg/50 rounded-lg space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-theme-text-muted uppercase tracking-wide">
              {language === 'es' ? 'Zona' : 'Zone'}
            </label>
            <ZoneSelect
              value={clientInfo.zoneId}
              onValueChange={handleZoneChange}
              className="w-full"
            />
          </div>

          {/* Developer & Project - Stacked */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-theme-text-muted uppercase tracking-wide">
              {t('developer')}
            </label>
            <DeveloperSelect
              value={clientInfo.developer || ''}
              onValueChange={(name) => handleChange('developer', name)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-theme-text-muted uppercase tracking-wide">
              {t('projectName')}
            </label>
            <ProjectSelect
              value={clientInfo.projectName || ''}
              developer={clientInfo.developer}
              onValueChange={(name) => handleChange('projectName', name)}
              className="w-full"
            />
          </div>
        </div>

        {/* Unit Details Grid - Compact */}
        <div className="p-3 bg-theme-bg/50 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-theme-text-muted uppercase tracking-wide">
                {t('unit')}
              </label>
              <Input
                value={clientInfo.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                placeholder="e.g. 3011"
                className="bg-theme-bg border-theme-border text-theme-text h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-theme-text-muted uppercase tracking-wide">
                {t('unitType')}
              </label>
              <Select value={clientInfo.unitType} onValueChange={(v) => handleChange('unitType', v)}>
                <SelectTrigger className="bg-theme-bg border-theme-border text-theme-text h-9">
                  <SelectValue placeholder={t('selectType')} />
                </SelectTrigger>
                <SelectContent className="bg-theme-card border-theme-border">
                  {UNIT_TYPES.map((type) => (
                    <SelectItem 
                      key={type.value} 
                      value={type.value}
                      className="text-theme-text hover:bg-theme-border focus:bg-theme-border"
                    >
                      {language === 'es' ? type.labelEs : type.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bedroom Count - only for villa/townhouse */}
            {(clientInfo.unitType === 'villa' || clientInfo.unitType === 'townhouse') && (
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-theme-text-muted uppercase tracking-wide">
                  {language === 'es' ? 'Habitaciones' : 'Bedrooms'}
                </label>
                <Select 
                  value={clientInfo.bedrooms?.toString() || ''} 
                  onValueChange={(v) => handleChange('bedrooms', parseInt(v) || 0)}
                >
                  <SelectTrigger className="bg-theme-bg border-theme-border text-theme-text h-9">
                    <SelectValue placeholder={language === 'es' ? 'Seleccionar' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent className="bg-theme-card border-theme-border">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <SelectItem key={num} value={num.toString()} className="text-theme-text hover:bg-theme-border">
                        {num} {num === 1 ? (language === 'es' ? 'Habitación' : 'Bedroom') : (language === 'es' ? 'Habitaciones' : 'Bedrooms')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-theme-text-muted uppercase tracking-wide">
                {t('unitSizeSqf')}
              </label>
              <Input
                type="number"
                value={clientInfo.unitSizeSqf || ''}
                onChange={(e) => handleChange('unitSizeSqf', parseFloat(e.target.value) || 0)}
                placeholder="e.g. 1250"
                className="bg-theme-bg border-theme-border text-theme-text h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-theme-text-muted uppercase tracking-wide">
                {t('unitSizeM2')}
              </label>
              <Input
                type="number"
                value={clientInfo.unitSizeM2 || ''}
                onChange={(e) => handleChange('unitSizeM2', parseFloat(e.target.value) || 0)}
                placeholder="e.g. 116"
                className="bg-theme-bg border-theme-border text-theme-text h-9"
              />
            </div>
          </div>
        </div>

        {/* Compact Image Uploads */}
        {onFloorPlanChange && onBuildingRenderChange && onHeroImageChange && (
          <div className="p-3 bg-theme-bg/50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-theme-text-muted">Property Images (Optional)</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <CompactImageUpload
                label="Floor Plan"
                imageUrl={floorPlanUrl || null}
                onChange={onFloorPlanChange}
              />
              <CompactImageUpload
                label="Render"
                imageUrl={buildingRenderUrl || null}
                onChange={onBuildingRenderChange}
              />
              <CompactImageUpload
                label="Hero"
                imageUrl={heroImageUrl || null}
                onChange={onHeroImageChange}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};
