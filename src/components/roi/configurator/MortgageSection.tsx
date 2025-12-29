import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ConfiguratorSectionProps } from "./types";
import { DEFAULT_MORTGAGE_INPUTS } from "../useMortgageCalculations";
import { useLanguage } from "@/contexts/LanguageContext";

interface MortgageSectionProps extends ConfiguratorSectionProps {
  mortgageInputs: typeof DEFAULT_MORTGAGE_INPUTS;
  setMortgageInputs: (inputs: typeof DEFAULT_MORTGAGE_INPUTS) => void;
}

export const MortgageSection = ({ inputs, mortgageInputs, setMortgageInputs }: MortgageSectionProps) => {
  const { t } = useLanguage();

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-theme-text">{t('mortgageCalculator') || 'Mortgage Calculator'}</h3>
          <p className="text-xs text-theme-text-muted">{t('mortgageDesc') || 'Configure financing options'}</p>
        </div>
        <Switch
          checked={mortgageInputs.enabled}
          onCheckedChange={(checked) => updateInput('enabled', checked)}
          className="data-[state=checked]:bg-theme-accent"
        />
      </div>

      {mortgageInputs.enabled && (
        <>
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
            <div className="space-y-1.5 p-2.5 bg-theme-card rounded-lg border border-theme-border">
              <div className="flex justify-between items-center">
                <Label className="text-theme-text-muted text-xs">{t('financingPercent') || 'Financing'}</Label>
                <span className="text-theme-accent font-mono text-sm font-bold">{mortgageInputs.financingPercent}%</span>
              </div>
              <Slider
                value={[mortgageInputs.financingPercent]}
                onValueChange={([v]) => updateInput('financingPercent', v)}
                min={40}
                max={80}
                step={5}
                className="w-full"
              />
            </div>

            {/* Loan Term */}
            <div className="space-y-1.5 p-2.5 bg-theme-card rounded-lg border border-theme-border">
              <div className="flex justify-between items-center">
                <Label className="text-theme-text-muted text-xs">{t('loanTerm') || 'Term'}</Label>
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
            <div className="space-y-1.5 p-2.5 bg-theme-card rounded-lg border border-theme-border">
              <div className="flex justify-between items-center">
                <Label className="text-theme-text-muted text-xs">{t('interestRate') || 'Interest'}</Label>
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
            </div>

            {/* Processing Fee */}
            <div className="space-y-1.5 p-2.5 bg-theme-card rounded-lg border border-theme-border">
              <div className="flex justify-between items-center">
                <Label className="text-theme-text-muted text-xs">{t('processingFee') || 'Processing'}</Label>
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
          </div>

          {/* Secondary Controls - inline row */}
          <div className="grid grid-cols-3 gap-2">
            {/* Valuation Fee */}
            <div className="p-2 bg-theme-card rounded-lg border border-theme-border">
              <Label className="text-theme-text-muted text-[10px] block mb-1">{t('valuationFee') || 'Valuation'}</Label>
              <Input
                type="number"
                value={mortgageInputs.valuationFee}
                onChange={(e) => updateInput('valuationFee', Number(e.target.value))}
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

            {/* Life Insurance */}
            <div className="p-2 bg-theme-card rounded-lg border border-theme-border">
              <div className="flex justify-between items-center mb-1">
                <Label className="text-theme-text-muted text-[10px]">{t('lifeInsurance') || 'Life Ins.'}</Label>
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
          </div>

          {/* Property Insurance - full width */}
          <div className="flex items-center justify-between p-2 bg-theme-card rounded-lg border border-theme-border">
            <Label className="text-theme-text-muted text-xs">{t('propertyInsurance') || 'Property Insurance'} <span className="text-theme-text-muted/60">({t('annual') || 'annual'})</span></Label>
            <div className="flex items-center gap-1.5">
              <span className="text-theme-text-muted text-xs">AED</span>
              <Input
                type="number"
                value={mortgageInputs.propertyInsurance}
                onChange={(e) => updateInput('propertyInsurance', Number(e.target.value))}
                className="w-20 h-7 bg-theme-bg-alt border-theme-border text-theme-text text-xs text-right font-mono px-2"
              />
            </div>
          </div>

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