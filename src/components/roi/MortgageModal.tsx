import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Building2, ChevronDown, AlertTriangle, Percent, Calendar, Landmark } from "lucide-react";
import { MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from "./useMortgageCalculations";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

interface MortgageModalProps {
  mortgageInputs: MortgageInputs;
  setMortgageInputs: (inputs: MortgageInputs) => void;
  preHandoverPercent: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTrigger?: boolean;
}

export const MortgageModal = ({
  mortgageInputs,
  setMortgageInputs,
  preHandoverPercent,
  open,
  onOpenChange,
  showTrigger = false,
}: MortgageModalProps) => {
  const { t } = useLanguage();
  const [feesOpen, setFeesOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);

  const equityRequired = 100 - mortgageInputs.financingPercent;
  const gapPercent = Math.max(0, equityRequired - preHandoverPercent);
  const hasGap = gapPercent > 0;

  const updateInput = <K extends keyof MortgageInputs>(key: K, value: MortgageInputs[K]) => {
    setMortgageInputs({ ...mortgageInputs, [key]: value });
  };

  const resetToDefaults = () => {
    setMortgageInputs({ ...DEFAULT_MORTGAGE_INPUTS, enabled: mortgageInputs.enabled });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            variant="outlineDark"
            size="sm"
            className={`h-8 px-2 sm:px-3 ${mortgageInputs.enabled ? 'border-[#CCFF00]/50 text-[#CCFF00]' : ''}`}
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline ml-1.5">{t('mortgage')}</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#CCFF00]" />
            {t('mortgageCalculator')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable/Disable Switch */}
          <div className="flex items-center justify-between p-4 bg-[#0f172a] rounded-xl border border-[#2a3142]">
            <div>
              <Label className="text-white font-medium">{t('enableMortgage')}</Label>
              <p className="text-xs text-gray-400 mt-1">{t('enableMortgageDesc')}</p>
            </div>
            <Switch
              checked={mortgageInputs.enabled}
              onCheckedChange={(checked) => updateInput('enabled', checked)}
            />
          </div>

          {mortgageInputs.enabled && (
            <>
              {/* Gap Warning with Timeline Visual */}
              {hasGap && (
                <div className="p-4 bg-amber-900/30 border border-amber-700/50 rounded-xl">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-200 font-medium">{t('additionalPaymentRequired') || 'Additional Payment Required'}</p>
                      <p className="text-amber-300/70 text-sm mt-1">
                        {t('gapExplanation')} ({preHandoverPercent}% → {equityRequired}%)
                      </p>
                    </div>
                  </div>
                  
                  {/* Payment Timeline Visual - Matching Client View */}
                  <div className="space-y-4">
                    {/* Timeline bar */}
                    <div className="relative h-3 bg-[#1e293b] rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-green-500 rounded-l-full"
                        style={{ width: `${preHandoverPercent}%` }}
                      />
                      <div 
                        className="absolute top-0 h-full bg-yellow-400"
                        style={{ left: `${preHandoverPercent}%`, width: `${gapPercent}%` }}
                      />
                      <div 
                        className="absolute top-0 h-full bg-blue-500 rounded-r-full"
                        style={{ left: `${equityRequired}%`, width: `${mortgageInputs.financingPercent}%` }}
                      />
                    </div>
                    
                    {/* Legend */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                        <div>
                          <p className="text-gray-400">{t('preHandover') || 'Pre-Handover'}</p>
                          <p className="text-green-400 font-mono">{preHandoverPercent}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400 flex-shrink-0" />
                        <div>
                          <p className="text-gray-400">{t('gap') || 'Gap'}</p>
                          <p className="text-yellow-300 font-mono font-semibold">{gapPercent.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                        <div>
                          <p className="text-gray-400">{t('mortgage')}</p>
                          <p className="text-blue-400 font-mono">{mortgageInputs.financingPercent}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-amber-700/30 flex justify-between">
                    <span className="text-sm text-gray-400">{t('totalBeforeHandover') || 'Total Before Handover'}</span>
                    <span className="text-sm font-mono text-white font-bold">{equityRequired}%</span>
                  </div>
                </div>
              )}

              {/* Financing Percentage */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    {t('financingPercent')}
                  </Label>
                  <span className="text-[#CCFF00] font-mono font-bold">{mortgageInputs.financingPercent}%</span>
                </div>
              <Slider
                  value={[mortgageInputs.financingPercent]}
                  onValueChange={([v]) => updateInput('financingPercent', v)}
                  min={20}
                  max={80}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>20%</span>
                  <span>80%</span>
                </div>
              </div>

              {/* Loan Term */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('loanTerm')}
                  </Label>
                  <span className="text-[#CCFF00] font-mono font-bold">{mortgageInputs.loanTermYears} {t('years')}</span>
                </div>
                <Slider
                  value={[mortgageInputs.loanTermYears]}
                  onValueChange={([v]) => updateInput('loanTermYears', v)}
                  min={5}
                  max={30}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5 {t('years')}</span>
                  <span>30 {t('years')}</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <Landmark className="w-4 h-4" />
                    {t('interestRate')}
                  </Label>
                  <span className="text-[#CCFF00] font-mono font-bold">{mortgageInputs.interestRate}%</span>
                </div>
                <Slider
                  value={[mortgageInputs.interestRate * 10]}
                  onValueChange={([v]) => updateInput('interestRate', v / 10)}
                  min={20}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>2%</span>
                  <span>10%</span>
                </div>
              </div>

              {/* Fees Section */}
              <Collapsible open={feesOpen} onOpenChange={setFeesOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#0f172a] rounded-lg border border-[#2a3142] hover:border-[#3a4152] transition-colors">
                  <span className="text-gray-300 font-medium">{t('mortgageFees')}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${feesOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-4">
                  {/* Processing Fee */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-gray-400 text-sm">{t('processingFee')}</Label>
                      <span className="text-white font-mono text-sm">{mortgageInputs.processingFeePercent}%</span>
                    </div>
                    <Slider
                      value={[mortgageInputs.processingFeePercent * 10]}
                      onValueChange={([v]) => updateInput('processingFeePercent', v / 10)}
                      min={5}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Valuation Fee */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-gray-400 text-sm">{t('valuationFee')}</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">AED</span>
                        <Input
                          type="number"
                          value={mortgageInputs.valuationFee}
                          onChange={(e) => updateInput('valuationFee', Number(e.target.value))}
                          className="w-24 h-8 bg-[#0f172a] border-[#2a3142] text-white text-right font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mortgage Registration */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-gray-400 text-sm">{t('mortgageRegistration')}</Label>
                      <span className="text-white font-mono text-sm">{mortgageInputs.mortgageRegistrationPercent}%</span>
                    </div>
                    <Slider
                      value={[mortgageInputs.mortgageRegistrationPercent * 100]}
                      onValueChange={([v]) => updateInput('mortgageRegistrationPercent', v / 100)}
                      min={10}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Insurance Section */}
              <Collapsible open={insuranceOpen} onOpenChange={setInsuranceOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#0f172a] rounded-lg border border-[#2a3142] hover:border-[#3a4152] transition-colors">
                  <span className="text-gray-300 font-medium">{t('insurance')}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${insuranceOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-4">
                  {/* Life Insurance */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-gray-400 text-sm">{t('lifeInsurance')} ({t('annual')})</Label>
                      <span className="text-white font-mono text-sm">{mortgageInputs.lifeInsurancePercent}%</span>
                    </div>
                    <Slider
                      value={[mortgageInputs.lifeInsurancePercent * 10]}
                      onValueChange={([v]) => updateInput('lifeInsurancePercent', v / 10)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Property Insurance */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-gray-400 text-sm">{t('propertyInsurance')} ({t('annual')})</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">AED</span>
                        <Input
                          type="number"
                          value={mortgageInputs.propertyInsurance}
                          onChange={(e) => updateInput('propertyInsurance', Number(e.target.value))}
                          className="w-24 h-8 bg-[#0f172a] border-[#2a3142] text-white text-right font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Reset Button */}
              <Button
                variant="outlineDark"
                size="sm"
                onClick={resetToDefaults}
                className="w-full"
              >
                {t('resetToDefaults')}
              </Button>
            </>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-[#2a3142]">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
          >
            {t('applyParameters')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
