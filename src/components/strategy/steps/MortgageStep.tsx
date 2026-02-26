import React, { useMemo, useCallback } from 'react';
import { OIInputs } from '@/components/roi/useOICalculations';
import { MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from '@/components/roi/useMortgageCalculations';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Home, ChevronDown, ChevronUp, Settings, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Props {
  inputs: OIInputs;
  updateField: <K extends keyof OIInputs>(field: K, value: OIInputs[K]) => void;
  updateFields: (partial: Partial<OIInputs>) => void;
}

const n2s = (n: number) => new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(n);

export const MortgageStep: React.FC<Props> = ({ inputs, updateField }) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const mortgageInputs: MortgageInputs = (inputs as any)._mortgageInputs || DEFAULT_MORTGAGE_INPUTS;

  const updateMortgage = useCallback(<K extends keyof MortgageInputs>(key: K, value: MortgageInputs[K]) => {
    const updated = { ...mortgageInputs, [key]: value };
    if (key === 'financingPercent') {
      const handoverPercent = 100 - inputs.preHandoverPercent;
      const maxFinancing = Math.min(80, handoverPercent);
      updated.financingPercent = Math.min(updated.financingPercent, maxFinancing);
    }
    updateField('_mortgageInputs' as any, updated);
  }, [mortgageInputs, inputs.preHandoverPercent, updateField]);

  const resetToDefaults = useCallback(() => {
    updateField('_mortgageInputs' as any, { ...DEFAULT_MORTGAGE_INPUTS, enabled: mortgageInputs.enabled });
  }, [mortgageInputs.enabled, updateField]);

  const handoverPercent = 100 - inputs.preHandoverPercent;
  const maxFinancingPercent = Math.min(80, handoverPercent);

  const loanAmount = inputs.basePrice * (mortgageInputs.financingPercent / 100);
  const monthlyRate = mortgageInputs.interestRate / 100 / 12;
  const numPayments = mortgageInputs.loanTermYears * 12;
  const monthlyPayment = useMemo(() => {
    if (monthlyRate === 0) return loanAmount / numPayments;
    return loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  }, [loanAmount, monthlyRate, numPayments]);
  const yearlyPayment = monthlyPayment * 12;
  const isRecommendedRate = mortgageInputs.interestRate >= 4.5 && mortgageInputs.interestRate <= 5.5;


  return (
    <div className="space-y-3">
      {/* Mortgage Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-theme-border bg-theme-card">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-theme-accent" />
          <div>
            <span className="text-xs font-semibold text-theme-text">Mortgage Simulator</span>
            <p className="text-[10px] text-theme-text-muted">Compare cash vs leveraged returns</p>
          </div>
        </div>
        <Switch
          checked={mortgageInputs.enabled}
          onCheckedChange={(v) => updateMortgage('enabled', v)}
        />
      </div>

      {mortgageInputs.enabled && (
        <>
          {/* Financing + Term - side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl border border-theme-border bg-theme-card">
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Financing</Label>
                <span className="font-mono text-sm text-theme-accent font-bold">{mortgageInputs.financingPercent}%</span>
              </div>
              <Slider
                value={[mortgageInputs.financingPercent]}
                onValueChange={([v]) => updateMortgage('financingPercent', v)}
                min={20} max={maxFinancingPercent} step={5}
                className="roi-slider-lime"
              />
            </div>
            <div className="p-2.5 rounded-xl border border-theme-border bg-theme-card">
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Term</Label>
                <span className="font-mono text-sm text-theme-accent font-bold">{mortgageInputs.loanTermYears}yr</span>
              </div>
              <Slider
                value={[mortgageInputs.loanTermYears]}
                onValueChange={([v]) => updateMortgage('loanTermYears', v)}
                min={5} max={30} step={1}
                className="roi-slider-lime"
              />
            </div>
          </div>

          {/* Interest Rate */}
          <div className="p-2.5 rounded-xl border border-theme-border bg-theme-card">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Interest Rate</Label>
                {isRecommendedRate && (
                  <Badge variant="outline" className="h-3.5 px-1 text-[7px] border-emerald-500/50 text-emerald-500 bg-emerald-500/10">
                    <BadgeCheck className="w-2 h-2 mr-0.5" />Typical
                  </Badge>
                )}
              </div>
              <span className="font-mono text-sm text-theme-accent font-bold">{mortgageInputs.interestRate}%</span>
            </div>
            <Slider
              value={[mortgageInputs.interestRate * 10]}
              onValueChange={([v]) => updateMortgage('interestRate', v / 10)}
              min={20} max={100} step={1}
              className="roi-slider-lime"
            />
            <div className="flex justify-between text-[9px] text-theme-text-muted mt-0.5">
              <span>2%</span>
              <span className="text-emerald-400">4.5–5.5%</span>
              <span>10%</span>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-theme-accent/10 to-transparent border border-theme-accent/20">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[10px] text-theme-text-muted uppercase tracking-wider">Monthly</div>
                <div className="text-lg font-mono font-bold text-theme-accent">AED {n2s(monthlyPayment)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-theme-text-muted uppercase tracking-wider">Yearly</div>
                <div className="text-sm font-mono text-theme-text">AED {n2s(yearlyPayment)}</div>
              </div>
            </div>
            <div className="text-[10px] text-theme-text-muted mt-1">
              Loan: AED {n2s(loanAmount)} over {mortgageInputs.loanTermYears} years
            </div>
          </div>

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors">
                <div className="flex items-center gap-1">
                  <Settings className="w-3 h-3" />
                  <span>Advanced Settings</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-1.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-theme-border bg-theme-card">
                <Label className="text-[10px] text-theme-text-muted">Processing Fee</Label>
                <div className="flex items-center gap-1.5">
                  <Slider
                    value={[mortgageInputs.processingFeePercent * 10]}
                    onValueChange={([v]) => updateMortgage('processingFeePercent', v / 10)}
                    min={5} max={20} step={1} className="w-16"
                  />
                  <span className="font-mono text-[10px] text-theme-text w-8 text-right">{mortgageInputs.processingFeePercent}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg border border-theme-border bg-theme-card">
                  <Label className="text-[10px] text-theme-text-muted block mb-1">Valuation Fee</Label>
                  <MoneyInput
                    value={mortgageInputs.valuationFee || 0}
                    onChange={(v) => updateMortgage('valuationFee', v)}
                    className="h-6 bg-theme-bg border-theme-border text-theme-text text-[10px]"
                  />
                </div>
                <div className="p-2.5 rounded-lg border border-theme-border bg-theme-card">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-[10px] text-theme-text-muted">Registration</Label>
                    <span className="font-mono text-[9px] text-theme-text">{mortgageInputs.mortgageRegistrationPercent}%</span>
                  </div>
                  <Slider
                    value={[mortgageInputs.mortgageRegistrationPercent * 100]}
                    onValueChange={([v]) => updateMortgage('mortgageRegistrationPercent', v / 100)}
                    min={10} max={50} step={5} className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg border border-theme-border bg-theme-card">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-[10px] text-theme-text-muted">Life Insurance</Label>
                    <span className="font-mono text-[9px] text-theme-text">{mortgageInputs.lifeInsurancePercent}%</span>
                  </div>
                  <Slider
                    value={[mortgageInputs.lifeInsurancePercent * 10]}
                    onValueChange={([v]) => updateMortgage('lifeInsurancePercent', v / 10)}
                    min={1} max={10} step={1} className="w-full"
                  />
                </div>
                <div className="p-2.5 rounded-lg border border-theme-border bg-theme-card">
                  <Label className="text-[10px] text-theme-text-muted block mb-1">Property Ins.</Label>
                  <MoneyInput
                    value={mortgageInputs.propertyInsurance || 0}
                    onChange={(v) => updateMortgage('propertyInsurance', v)}
                    className="h-6 bg-theme-bg border-theme-border text-theme-text text-[10px]"
                  />
                </div>
              </div>
              <button
                onClick={resetToDefaults}
                className="w-full text-center text-[10px] text-theme-text-muted hover:text-theme-text py-1 transition-colors"
              >
                Reset to Defaults
              </button>
            </CollapsibleContent>
          </Collapsible>

        </>
      )}

    </div>
  );
};
