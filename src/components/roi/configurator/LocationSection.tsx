import { MapPin, Building, Building2, Sparkles } from "lucide-react";
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
import { ExtractedPaymentPlan } from "@/lib/paymentPlanTypes";
import { useState } from "react";
import { toast } from "sonner";

interface LocationSectionProps {
  clientInfo: ClientUnitData;
  onClientInfoChange: (data: ClientUnitData) => void;
  inputs: OIInputs;
  setInputs: React.Dispatch<React.SetStateAction<OIInputs>>;
}

const SQF_TO_M2 = 0.092903;

export const LocationSection = ({
  clientInfo,
  onClientInfoChange,
  inputs,
  setInputs,
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
  const handleAIExtraction = (extractedData: ExtractedPaymentPlan) => {
    const sqfToM2 = (sqf: number) => Math.round(sqf * SQF_TO_M2 * 10) / 10;
    
    // Update client info with extracted property details
    onClientInfoChange({
      ...clientInfo,
      developer: extractedData.property?.developer || clientInfo.developer,
      projectName: extractedData.property?.projectName || clientInfo.projectName,
      unit: extractedData.property?.unitNumber || clientInfo.unit,
      unitType: extractedData.property?.unitType || clientInfo.unitType,
      unitSizeSqf: extractedData.property?.unitSizeSqft || clientInfo.unitSizeSqf,
      unitSizeM2: extractedData.property?.unitSizeSqft 
        ? sqfToM2(extractedData.property.unitSizeSqft) 
        : clientInfo.unitSizeM2,
    });
    
    // Also update base price and payment plan in inputs
    if (extractedData.property?.basePrice) {
      setInputs(prev => ({
        ...prev,
        basePrice: extractedData.property!.basePrice!,
      }));
    }
    
    toast.success('Property data imported!');
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
      
      <div className="space-y-6">
        {/* Section Header */}
        <div>
          <h3 className="text-lg font-semibold text-theme-text mb-1">Location & Property</h3>
          <p className="text-sm text-theme-text-muted">Select the zone and enter property details</p>
        </div>

        {/* AI Import Banner */}
        <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-theme-text flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI Auto-Fill
              </h4>
              <p className="text-xs text-theme-text-muted mt-1">
                Upload a brochure or payment plan to auto-fill developer, project, and unit info.
              </p>
            </div>
            <Button
              onClick={() => setShowAIExtractor(true)}
              variant="outline"
              size="sm"
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Import
            </Button>
          </div>
        </div>

        {/* Zone Selection */}
        <div className="p-4 rounded-xl border border-theme-border bg-theme-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-theme-accent/10">
              <MapPin className="w-4 h-4 text-theme-accent" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-theme-text">Investment Zone</h4>
              <p className="text-xs text-theme-text-muted">Select where the property is located</p>
            </div>
          </div>
          <ZoneSelect
            value={clientInfo.zoneId}
            onValueChange={handleZoneChange}
            className="w-full"
          />
        </div>

        {/* Developer & Project */}
        <div className="p-4 rounded-xl border border-theme-border bg-theme-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-theme-accent-secondary/10">
              <Building className="w-4 h-4 text-theme-accent-secondary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-theme-text">Developer & Project</h4>
              <p className="text-xs text-theme-text-muted">Who is building the property</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-theme-text-muted">{t('developer')}</label>
              <DeveloperSelect
                value={clientInfo.developer || ''}
                onValueChange={(name) => handleChange('developer', name)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-theme-text-muted">{t('projectName')}</label>
              <ProjectSelect
                value={clientInfo.projectName || ''}
                developer={clientInfo.developer}
                onValueChange={(name) => handleChange('projectName', name)}
              />
            </div>
          </div>
        </div>

        {/* Unit Details */}
        <div className="p-4 rounded-xl border border-theme-border bg-theme-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-theme-info/10">
              <Building2 className="w-4 h-4 text-theme-info" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-theme-text">Unit Details</h4>
              <p className="text-xs text-theme-text-muted">Specific unit information</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Unit */}
            <div className="space-y-1.5">
              <label className="text-xs text-theme-text-muted">{t('unit')}</label>
              <Input
                value={clientInfo.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                placeholder="e.g. 3011"
                className="bg-theme-bg border-theme-border text-theme-text h-9"
              />
            </div>

            {/* Unit Type */}
            <div className="space-y-1.5">
              <label className="text-xs text-theme-text-muted">{t('unitType')}</label>
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
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs text-theme-text-muted">{language === 'es' ? 'Habitaciones' : 'Bedrooms'}</label>
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

            {/* Unit Size */}
            <div className="space-y-1.5">
              <label className="text-xs text-theme-text-muted">{t('unitSizeSqf')}</label>
              <Input
                type="number"
                value={clientInfo.unitSizeSqf || ''}
                onChange={(e) => handleChange('unitSizeSqf', parseFloat(e.target.value) || 0)}
                placeholder="e.g. 1250"
                className="bg-theme-bg border-theme-border text-theme-text h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-theme-text-muted">{t('unitSizeM2')}</label>
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
      </div>
    </>
  );
};
