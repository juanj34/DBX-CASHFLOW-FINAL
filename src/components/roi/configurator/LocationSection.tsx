import { Sparkles } from "lucide-react";
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
  const handleAIExtraction = (extractedData: ExtractedPaymentPlan, bookingDate?: { month: number; year: number }) => {
    const sqfToM2 = (sqf: number) => Math.round(sqf * SQF_TO_M2 * 10) / 10;
    
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
    
    const effectiveBookingDate = bookingDate || { month: inputs.bookingMonth, year: inputs.bookingYear };
    
    const handoverPayment = extractedData.installments.find(i => i.type === 'handover');
    let handoverMonth: number | undefined = inputs.handoverMonth;
    let handoverYear = inputs.handoverYear;
    let handoverQuarter = inputs.handoverQuarter;
    
    if (handoverPayment && handoverPayment.triggerValue > 0) {
      const bookingDateObj = new Date(effectiveBookingDate.year, effectiveBookingDate.month - 1);
      const handoverDateObj = new Date(bookingDateObj);
      handoverDateObj.setMonth(handoverDateObj.getMonth() + handoverPayment.triggerValue);
      handoverMonth = handoverDateObj.getMonth() + 1;
      handoverYear = handoverDateObj.getFullYear();
      handoverQuarter = Math.ceil(handoverMonth / 3) as 1 | 2 | 3 | 4;
    } else if (extractedData.paymentStructure.handoverMonthFromBooking) {
      const bookingDateObj = new Date(effectiveBookingDate.year, effectiveBookingDate.month - 1);
      const handoverDateObj = new Date(bookingDateObj);
      handoverDateObj.setMonth(handoverDateObj.getMonth() + extractedData.paymentStructure.handoverMonthFromBooking);
      handoverMonth = handoverDateObj.getMonth() + 1;
      handoverYear = handoverDateObj.getFullYear();
      handoverQuarter = Math.ceil(handoverMonth / 3) as 1 | 2 | 3 | 4;
    }
    
    const downpayment = extractedData.installments.find(i => i.type === 'time' && i.triggerValue === 0);
    const downpaymentPercent = downpayment?.paymentPercent || inputs.downpaymentPercent;
    
    let preHandoverPercent = inputs.preHandoverPercent;
    if (extractedData.paymentStructure.paymentSplit) {
      const [pre] = extractedData.paymentStructure.paymentSplit.split('/').map(Number);
      if (!isNaN(pre)) preHandoverPercent = pre;
    } else {
      const preHOInstallments = extractedData.installments.filter(i => 
        i.type === 'time' || i.type === 'construction'
      );
      const preHOTotal = preHOInstallments.reduce((sum, i) => sum + i.paymentPercent, 0);
      if (preHOTotal > 0 && preHOTotal <= 100) preHandoverPercent = preHOTotal;
    }
    
    const additionalPayments = extractedData.installments
      .filter(i => {
        if (i.type === 'time' && i.triggerValue === 0) return false;
        if (i.type === 'handover') return false;
        return true;
      })
      .map((inst, idx) => ({
        id: inst.id || `ai-${Date.now()}-${idx}`,
        type: inst.type === 'construction' ? 'construction' as const : 'time' as const,
        triggerValue: inst.triggerValue,
        paymentPercent: inst.paymentPercent,
      }))
      .sort((a, b) => a.triggerValue - b.triggerValue);
    
    const postHandoverInstallments = extractedData.installments.filter(i => i.type === 'post-handover');
    const postHandoverTotal = postHandoverInstallments.reduce((sum, i) => sum + i.paymentPercent, 0);
    const hasPostHandover = extractedData.paymentStructure.hasPostHandover || postHandoverTotal > 0;
    
    setInputs(prev => ({
      ...prev,
      basePrice: extractedData.property?.basePrice || prev.basePrice,
      unitSizeSqf: extractedData.property?.unitSizeSqft || prev.unitSizeSqf,
      bookingMonth: effectiveBookingDate.month,
      bookingYear: effectiveBookingDate.year,
      downpaymentPercent,
      preHandoverPercent,
      additionalPayments,
      hasPostHandoverPlan: hasPostHandover,
      postHandoverPercent: postHandoverTotal,
      handoverMonth,
      handoverQuarter,
      handoverYear,
    }));
    
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
      
      <div className="space-y-5">
        {/* Section Header with AI Import */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-theme-text">Location & Property</h3>
            <p className="text-sm text-theme-text-muted">Zone and property details</p>
          </div>
          <Button
            onClick={() => setShowAIExtractor(true)}
            variant="ghost"
            size="sm"
            className="text-theme-accent hover:bg-theme-accent/10 h-8 gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs">AI Import</span>
          </Button>
        </div>

        {/* Zone */}
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

        {/* Developer & Project - Side by Side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-theme-text-muted uppercase tracking-wide">
              {t('developer')}
            </label>
            <DeveloperSelect
              value={clientInfo.developer || ''}
              onValueChange={(name) => handleChange('developer', name)}
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
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-theme-border/50" />

        {/* Unit Details - Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
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
            <div className="space-y-1.5 col-span-2">
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

          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
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
    </>
  );
};
