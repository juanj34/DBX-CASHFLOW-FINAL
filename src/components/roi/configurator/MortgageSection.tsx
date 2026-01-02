import { useState } from "react";
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp, Settings, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ConfiguratorSectionProps } from "./types";
import { DEFAULT_MORTGAGE_INPUTS } from "../useMortgageCalculations";
import { useLanguage } from "@/contexts/LanguageContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InfoTooltip } from "../InfoTooltip";

interface MortgageSectionProps extends ConfiguratorSectionProps {
  mortgageInputs: typeof DEFAULT_MORTGAGE_INPUTS;
  setMortgageInputs: (inputs: typeof DEFAULT_MORTGAGE_INPUTS) => void;
}

export const MortgageSection = ({ inputs, mortgageInputs, setMortgageInputs }: MortgageSectionProps) => {
  const { t } = useLanguage();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const equityRequired = 100 - mortgageInputs.financingPercent;
  const handoverPercent = 100 - inputs.preHandoverPercent;
  
  // Max financing is limited by handover amount (can't finance more than what's due at handover)
  const maxFinancingPercent = Math.min(80, handoverPercent);
  
  const gapPercent = Math.max(0, equityRequired - inputs.preHandoverPercent);
  const hasGap = gapPercent > 0;

  const updateInput = <K extends keyof typeof DEFAULT_MORTGAGE_INPUTS>(key: K, value: typeof DEFAULT_MORTGAGE_INPUTS[K]) => {
    // Enforce max financing rule
    if (key === 'financingPercent') {
      const clampedValue = Math.min(value as number, maxFinancingPercent);
      setMortgageInputs({ ...mortgageInputs, [key]: clampedValue });
    } else {
      setMortgageInputs({ ...mortgageInputs, [key]: value });
    }
  };

  const resetToDefaults = () => {
    setMortgageInputs({ ...DEFAULT_MORTGAGE_INPUTS, enabled: mortgageInputs.enabled });
  };

  // Handle number input that allows empty/deletion
  const handleNumberInputChange = (value: string, setter: (val: number) => void) => {
    if (value === '') {
      setter(0);
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setter(num);
    }
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Toggle Header */}
      <div className="p-4 bg-theme-card rounded-xl border border-theme-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-theme-accent/20 flex items-center justify-center">
              <Home className="w-5 h-5 text-theme-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-theme-text">{t('mortgageCalculator') || 'Mortgage Calculator'}</h3>
              <p className="text-xs text-theme-text-muted">Calculate monthly payments and compare cash vs financed returns</p>
            </div>
          </div>
          <Switch
            checked={mortgageInputs.enabled}
            onCheckedChange={(checked) => updateInput('enabled', checked)}
            className="data-[state=checked]:bg-theme-accent"
          />
        </div>
      </div>

      {/* Info Box */}
      {!mortgageInputs.enabled && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-300">
              <p className="font-medium mb-1">Why use mortgage financing?</p>
              <p className="text-blue-200/80">
                Compare cash purchases vs. leveraged investments. See how financing affects your ROI, monthly payments, and overall returns.
              </p>
            </div>
          </div>
        </div>
      )}

      {mortgageInputs.enabled && (
        <>
          {/* Max Financing Warning */}
          {mortgageInputs.financingPercent > maxFinancingPercent && (
            <div className="p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-amber-200 text-sm">
                  Max financing is {maxFinancingPercent}% based on your {inputs.preHandoverPercent}/{handoverPercent} payment plan
                </p>
              </div>
            </div>
          )}

          {/* Gap Warning - Compact */}
          {hasGap && (
            <div className="p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-amber-200 text-sm font-medium">{t('additionalPaymentRequired') || 'Gap Payment Required'}</p>
              </div>
              <div className="relative h-2 bg-theme-card-alt rounded-full overflow-hidden mb-2">
                <div className="absolute left-0 top-0 h-full bg-green-500" style={{ width: `${inputs.preHandoverPercent}%` }} />
                <div className="absolute top-0 h-full bg-yellow-400" style={{ left: `${inputs.preHandoverPercent}%`, width: `${gapPercent}%` }} />
                <div className="absolute top-0 h-full bg-blue-500" style={{ left: `${equityRequired}%`, width: `${mortgageInputs.financingPercent}%` }} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-400">{inputs.preHandoverPercent}% paid</span>
                <span className="text-yellow-300 font-semibold">+{gapPercent.toFixed(0)}% gap</span>
                <span className="text-blue-400">{mortgageInputs.financingPercent}% financed</span>
              </div>
            </div>
          )}

          {/* Main Controls - 2 column grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Financing % */}
            <div className="space-y-1.5 p-3 bg-theme-card rounded-lg border border-theme-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Label className="text-theme-text-muted text-xs">{t('financingPercent') || 'Financing'}</Label>
                  <InfoTooltip translationKey="tooltipFinancingPercent" />
                </div>
                <span className="text-theme-accent font-mono text-sm font-bold">{mortgageInputs.financingPercent}%</span>
              </div>
              <Slider
                value={[mortgageInputs.financingPercent]}
                onValueChange={([v]) => updateInput('financingPercent', v)}
                min={40}
                max={maxFinancingPercent}
                step={5}
                className="w-full"
              />
              <div className="text-[10px] text-theme-text-muted text-right">Max: {maxFinancingPercent}%</div>
            </div>

            {/* Loan Term */}
            <div className="space-y-1.5 p-3 bg-theme-card rounded-lg border border-theme-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Label className="text-theme-text-muted text-xs">{t('loanTerm') || 'Term'}</Label>
                  <InfoTooltip translationKey="tooltipLoanTerm" />
                </div>
                <span className="text-theme-accent font-mono text-sm font-bold">{mortgageInputs.loanTermYears}y</span>
              </div>
              <Slider
                value={[mortgageInputs.loanTermYears]}
                onValueChange={([v]) => updateInput('loanTermYears', v)}
                min={5}
                max={30}
                step={1}
                className="w-full"
              />
            </div>

            {/* Interest Rate */}
            <div className="col-span-2 space-y-1.5 p-3 bg-theme-card rounded-lg border border-theme-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Label className="text-theme-text-muted text-xs">{t('interestRate') || 'Interest Rate'}</Label>
                  <InfoTooltip translationKey="tooltipInterestRate" />
                </div>
                <span className="text-theme-accent font-mono text-sm font-bold">{mortgageInputs.interestRate}%</span>
              </div>
              <Slider
                value={[mortgageInputs.interestRate * 10]}
                onValueChange={([v]) => updateInput('interestRate', v / 10)}
                min={20}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-theme-text-muted">
                <span>2%</span>
                <span>10%</span>
              </div>
            </div>
          </div>

          {/* Advanced Settings - Collapsible */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between text-theme-text-muted hover:text-theme-text h-10"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Advanced Settings</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {/* Processing Fee */}
              <div className="space-y-1.5 p-2.5 bg-theme-card rounded-lg border border-theme-border">
                <div className="flex justify-between items-center">
                  <Label className="text-theme-text-muted text-xs">{t('processingFee') || 'Processing Fee'}</Label>
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

              <div className="grid grid-cols-2 gap-2">
                {/* Valuation Fee */}
                <div className="p-2 bg-theme-card rounded-lg border border-theme-border">
                  <Label className="text-theme-text-muted text-[10px] block mb-1">{t('valuationFee') || 'Valuation Fee'}</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={mortgageInputs.valuationFee || ''}
                    onChange={(e) => handleNumberInputChange(e.target.value, (v) => updateInput('valuationFee', v))}
                    className="h-7 bg-theme-bg-alt border-theme-border text-theme-text text-xs text-right font-mono px-2"
                  />
                </div>

                {/* Mortgage Registration */}
                <div className="p-2 bg-theme-card rounded-lg border border-theme-border">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-theme-text-muted text-[10px]">{t('mortgageRegistration') || 'Registration'}</Label>
                    <span className="text-theme-text font-mono text-[10px]">{mortgageInputs.mortgageRegistrationPercent}%</span>
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
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Life Insurance */}
                <div className="p-2 bg-theme-card rounded-lg border border-theme-border">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-theme-text-muted text-[10px]">{t('lifeInsurance') || 'Life Insurance'}</Label>
                    <span className="text-theme-text font-mono text-[10px]">{mortgageInputs.lifeInsurancePercent}%</span>
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
                <div className="p-2 bg-theme-card rounded-lg border border-theme-border">
                  <Label className="text-theme-text-muted text-[10px] block mb-1">{t('propertyInsurance') || 'Property Ins.'}</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={mortgageInputs.propertyInsurance || ''}
                    onChange={(e) => handleNumberInputChange(e.target.value, (v) => updateInput('propertyInsurance', v))}
                    className="h-7 bg-theme-bg-alt border-theme-border text-theme-text text-xs text-right font-mono px-2"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Reset Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefaults}
            className="w-full text-theme-text-muted hover:text-theme-text text-xs h-8"
          >
            <RotateCcw className="w-3 h-3 mr-1.5" />
            {t('resetToDefaults') || 'Reset to Defaults'}
          </Button>
        </>
      )}
    </div>
  );
};