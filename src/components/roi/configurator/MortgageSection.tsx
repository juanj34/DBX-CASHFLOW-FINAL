import { useState } from "react";
import { Building2, Percent, Calendar, Landmark, ChevronDown, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ConfiguratorSectionProps } from "./types";
import { DEFAULT_MORTGAGE_INPUTS } from "../useMortgageCalculations";
import { useLanguage } from "@/contexts/LanguageContext";

interface MortgageSectionProps extends ConfiguratorSectionProps {
  mortgageInputs: typeof DEFAULT_MORTGAGE_INPUTS;
  setMortgageInputs: (inputs: typeof DEFAULT_MORTGAGE_INPUTS) => void;
}

export const MortgageSection = ({ inputs, mortgageInputs, setMortgageInputs }: MortgageSectionProps) => {
  const { t } = useLanguage();
  const [feesOpen, setFeesOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);

  const equityRequired = 100 - mortgageInputs.financingPercent;
  const gapPercent = Math.max(0, equityRequired - inputs.preHandoverPercent);
  const hasGap = gapPercent > 0;

  const updateInput = <K extends keyof typeof DEFAULT_MORTGAGE_INPUTS>(key: K, value: typeof DEFAULT_MORTGAGE_INPUTS[K]) => {
    setMortgageInputs({ ...mortgageInputs, [key]: value });
  };

  const resetToDefaults = () => {
    setMortgageInputs({ ...DEFAULT_MORTGAGE_INPUTS, enabled: mortgageInputs.enabled });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-theme-text mb-0.5">{t('mortgageCalculator') || 'Mortgage Calculator'}</h3>
        <p className="text-xs text-theme-text-muted">{t('mortgageDesc') || 'Configure financing options for your investment'}</p>
      </div>

      {/* Enable/Disable Switch */}
      <div className="flex items-center justify-between p-4 bg-theme-card rounded-xl border border-theme-border">
        <div>
          <Label className="text-theme-text font-medium">{t('enableMortgage')}</Label>
          <p className="text-xs text-theme-text-muted mt-1">{t('enableMortgageDesc')}</p>
        </div>
        <Switch
          checked={mortgageInputs.enabled}
          onCheckedChange={(checked) => updateInput('enabled', checked)}
          className="data-[state=checked]:bg-theme-accent"
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
                    {t('gapExplanation')} ({inputs.preHandoverPercent}% → {equityRequired}%)
                  </p>
                </div>
              </div>
              
              {/* Payment Timeline Visual */}
              <div className="space-y-4">
                <div className="relative h-3 bg-theme-card-alt rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-green-500 rounded-l-full"
                    style={{ width: `${inputs.preHandoverPercent}%` }}
                  />
                  <div 
                    className="absolute top-0 h-full bg-yellow-400"
                    style={{ left: `${inputs.preHandoverPercent}%`, width: `${gapPercent}%` }}
                  />
                  <div 
                    className="absolute top-0 h-full bg-blue-500 rounded-r-full"
                    style={{ left: `${equityRequired}%`, width: `${mortgageInputs.financingPercent}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-theme-text-muted">{t('preHandover') || 'Pre-Handover'}</p>
                      <p className="text-green-400 font-mono">{inputs.preHandoverPercent}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 flex-shrink-0" />
                    <div>
                      <p className="text-theme-text-muted">{t('gap') || 'Gap'}</p>
                      <p className="text-yellow-300 font-mono font-semibold">{gapPercent.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-theme-text-muted">{t('mortgage')}</p>
                      <p className="text-blue-400 font-mono">{mortgageInputs.financingPercent}%</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-amber-700/30 flex justify-between">
                <span className="text-sm text-theme-text-muted">{t('totalBeforeHandover') || 'Total Before Handover'}</span>
                <span className="text-sm font-mono text-theme-text font-bold">{equityRequired}%</span>
              </div>
            </div>
          )}

          {/* Financing Percentage */}
          <div className="space-y-3 p-3 bg-theme-card rounded-xl border border-theme-border">
            <div className="flex justify-between items-center">
              <Label className="text-theme-text-muted flex items-center gap-2">
                <Percent className="w-4 h-4" />
                {t('financingPercent')}
              </Label>
              <span className="text-theme-accent font-mono font-bold">{mortgageInputs.financingPercent}%</span>
            </div>
            <Slider
              value={[mortgageInputs.financingPercent]}
              onValueChange={([v]) => updateInput('financingPercent', v)}
              min={40}
              max={80}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-theme-text-muted">
              <span>40%</span>
              <span>80%</span>
            </div>
          </div>

          {/* Loan Term */}
          <div className="space-y-3 p-3 bg-theme-card rounded-xl border border-theme-border">
            <div className="flex justify-between items-center">
              <Label className="text-theme-text-muted flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('loanTerm')}
              </Label>
              <span className="text-theme-accent font-mono font-bold">{mortgageInputs.loanTermYears} {t('years')}</span>
            </div>
            <Slider
              value={[mortgageInputs.loanTermYears]}
              onValueChange={([v]) => updateInput('loanTermYears', v)}
              min={5}
              max={30}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-theme-text-muted">
              <span>5 {t('years')}</span>
              <span>30 {t('years')}</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div className="space-y-3 p-3 bg-theme-card rounded-xl border border-theme-border">
            <div className="flex justify-between items-center">
              <Label className="text-theme-text-muted flex items-center gap-2">
                <Landmark className="w-4 h-4" />
                {t('interestRate')}
              </Label>
              <span className="text-theme-accent font-mono font-bold">{mortgageInputs.interestRate}%</span>
            </div>
            <Slider
              value={[mortgageInputs.interestRate * 10]}
              onValueChange={([v]) => updateInput('interestRate', v / 10)}
              min={20}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-theme-text-muted">
              <span>2%</span>
              <span>10%</span>
            </div>
          </div>

          {/* Fees Section */}
          <Collapsible open={feesOpen} onOpenChange={setFeesOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-theme-card rounded-lg border border-theme-border hover:border-theme-border-alt transition-colors">
              <span className="text-theme-text-muted font-medium">{t('mortgageFees')}</span>
              <ChevronDown className={`w-4 h-4 text-theme-text-muted transition-transform ${feesOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-4">
              {/* Processing Fee */}
              <div className="space-y-2 p-3 bg-theme-bg-alt rounded-lg">
                <div className="flex justify-between items-center">
                  <Label className="text-theme-text-muted text-sm">{t('processingFee')}</Label>
                  <span className="text-theme-text font-mono text-sm">{mortgageInputs.processingFeePercent}%</span>
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
              <div className="space-y-2 p-3 bg-theme-bg-alt rounded-lg">
                <div className="flex justify-between items-center">
                  <Label className="text-theme-text-muted text-sm">{t('valuationFee')}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-theme-text-muted text-sm">AED</span>
                    <Input
                      type="number"
                      value={mortgageInputs.valuationFee}
                      onChange={(e) => updateInput('valuationFee', Number(e.target.value))}
                      className="w-24 h-8 bg-theme-bg-alt border-theme-border text-theme-text text-right font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Mortgage Registration */}
              <div className="space-y-2 p-3 bg-theme-bg-alt rounded-lg">
                <div className="flex justify-between items-center">
                  <Label className="text-theme-text-muted text-sm">{t('mortgageRegistration')}</Label>
                  <span className="text-theme-text font-mono text-sm">{mortgageInputs.mortgageRegistrationPercent}%</span>
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
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-theme-card rounded-lg border border-theme-border hover:border-theme-border-alt transition-colors">
              <span className="text-theme-text-muted font-medium">{t('insurance')}</span>
              <ChevronDown className={`w-4 h-4 text-theme-text-muted transition-transform ${insuranceOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-4">
              {/* Life Insurance */}
              <div className="space-y-2 p-3 bg-theme-bg-alt rounded-lg">
                <div className="flex justify-between items-center">
                  <Label className="text-theme-text-muted text-sm">{t('lifeInsurance')} ({t('annual')})</Label>
                  <span className="text-theme-text font-mono text-sm">{mortgageInputs.lifeInsurancePercent}%</span>
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
              <div className="space-y-2 p-3 bg-theme-bg-alt rounded-lg">
                <div className="flex justify-between items-center">
                  <Label className="text-theme-text-muted text-sm">{t('propertyInsurance')} ({t('annual')})</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-theme-text-muted text-sm">AED</span>
                    <Input
                      type="number"
                      value={mortgageInputs.propertyInsurance}
                      onChange={(e) => updateInput('propertyInsurance', Number(e.target.value))}
                      className="w-24 h-8 bg-theme-bg-alt border-theme-border text-theme-text text-right font-mono"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="w-full border-theme-border text-theme-text-muted hover:text-theme-text"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('resetToDefaults')}
          </Button>
        </>
      )}
    </div>
  );
};
