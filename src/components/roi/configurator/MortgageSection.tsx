import { useState, useMemo } from "react";
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp, Settings, HelpCircle, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ConfiguratorSectionProps } from "./types";
import { DEFAULT_MORTGAGE_INPUTS } from "../useMortgageCalculations";
import { useLanguage } from "@/contexts/LanguageContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InfoTooltip } from "../InfoTooltip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "../currencyUtils";

interface MortgageSectionProps extends ConfiguratorSectionProps {
  mortgageInputs: typeof DEFAULT_MORTGAGE_INPUTS;
  setMortgageInputs: (inputs: typeof DEFAULT_MORTGAGE_INPUTS) => void;
}

export const MortgageSection = ({ inputs, mortgageInputs, setMortgageInputs, currency }: MortgageSectionProps) => {
  const { t } = useLanguage();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const equityRequired = 100 - mortgageInputs.financingPercent;
  const handoverPercent = 100 - inputs.preHandoverPercent;
  
  // Max financing is limited by handover amount (can't finance more than what's due at handover)
  const maxFinancingPercent = Math.min(80, handoverPercent);
  
  const gapPercent = Math.max(0, equityRequired - inputs.preHandoverPercent);
  const hasGap = gapPercent > 0;

  // Calculate monthly/yearly mortgage payment
  const loanAmount = inputs.basePrice * (mortgageInputs.financingPercent / 100);
  const monthlyRate = mortgageInputs.interestRate / 100 / 12;
  const numPayments = mortgageInputs.loanTermYears * 12;
  const monthlyPayment = useMemo(() => {
    if (monthlyRate === 0) return loanAmount / numPayments;
    return loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  }, [loanAmount, monthlyRate, numPayments]);
  const yearlyPayment = monthlyPayment * 12;

  // Check if interest rate is in recommended range
  const isRecommendedRate = mortgageInputs.interestRate >= 4.5 && mortgageInputs.interestRate <= 5.5;

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

  // Format number with commas
  const formatWithCommas = (num: number) => num.toLocaleString();

  return (
    <div className="space-y-3">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-theme-accent" />
          <h3 className="text-lg font-semibold text-theme-text">{t('mortgageCalculator') || 'Mortgage Calculator'}</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-theme-text-muted cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-theme-card border-theme-border text-theme-text">
                <p className="text-xs">Compare cash purchases vs. leveraged investments. See how financing affects your ROI, monthly payments, and overall returns.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          checked={mortgageInputs.enabled}
          onCheckedChange={(checked) => updateInput('enabled', checked)}
          className="data-[state=checked]:bg-theme-accent"
        />
      </div>

      {mortgageInputs.enabled && (
        <>
          {/* Gap Warning - Theme Style */}
          {hasGap && (
            <div className="p-3 bg-theme-card border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-amber-300 text-sm font-medium">Gap Payment Required</p>
              </div>
              <p className="text-xs text-theme-text-muted mb-2">
                Your pre-handover payments ({inputs.preHandoverPercent}%) don't cover the required equity ({equityRequired}%). You'll need to pay an additional {gapPercent.toFixed(0)}% at handover before financing.
              </p>
              <div className="relative h-2 bg-theme-bg-alt rounded-full overflow-hidden">
                <div className="absolute left-0 top-0 h-full bg-green-500/60" style={{ width: `${inputs.preHandoverPercent}%` }} />
                <div className="absolute top-0 h-full bg-amber-500/60" style={{ left: `${inputs.preHandoverPercent}%`, width: `${gapPercent}%` }} />
                <div className="absolute top-0 h-full bg-blue-500/60" style={{ left: `${equityRequired}%`, width: `${mortgageInputs.financingPercent}%` }} />
              </div>
              <div className="flex justify-between text-[10px] mt-1">
                <span className="text-green-400">{inputs.preHandoverPercent}% paid</span>
                <span className="text-amber-400 font-semibold">+{gapPercent.toFixed(0)}% gap</span>
                <span className="text-blue-400">{mortgageInputs.financingPercent}% financed</span>
              </div>
            </div>
          )}

          {/* Main Controls - Compact 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Financing % */}
            <div className="space-y-1 p-2.5 bg-theme-card rounded-lg border border-theme-border">
              <div className="flex justify-between items-center">
                <Label className="text-theme-text-muted text-[10px]">Financing</Label>
                <span className="text-theme-accent font-mono text-sm font-bold">{mortgageInputs.financingPercent}%</span>
              </div>
              <Slider
                value={[mortgageInputs.financingPercent]}
                onValueChange={([v]) => updateInput('financingPercent', v)}
                min={20}
                max={maxFinancingPercent}
                step={5}
                className="w-full"
              />
            </div>

            {/* Loan Term */}
            <div className="space-y-1 p-2.5 bg-theme-card rounded-lg border border-theme-border">
              <div className="flex justify-between items-center">
                <Label className="text-theme-text-muted text-[10px]">Term</Label>
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

            {/* Interest Rate - Full Width with Recommended Badge */}
            <div className="col-span-2 space-y-1 p-2.5 bg-theme-card rounded-lg border border-theme-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Label className="text-theme-text-muted text-[10px]">Interest Rate</Label>
                  {isRecommendedRate && (
                    <Badge variant="outline" className="h-4 px-1 text-[8px] border-green-500/50 text-green-400 bg-green-500/10">
                      <BadgeCheck className="w-2.5 h-2.5 mr-0.5" />
                      Recommended
                    </Badge>
                  )}
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
              <div className="flex justify-between text-[9px] text-theme-text-muted">
                <span>2%</span>
                <span className="text-green-400">4.5-5.5% typical</span>
                <span>10%</span>
              </div>
            </div>
          </div>

          {/* Monthly Payment Summary */}
          <div className="p-3 bg-gradient-to-r from-theme-accent/10 to-transparent rounded-lg border border-theme-accent/30">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-theme-text-muted">Monthly Payment</div>
                <div className="text-lg font-mono font-bold text-theme-accent">
                  {formatCurrency(monthlyPayment, currency)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-theme-text-muted">Yearly</div>
                <div className="text-sm font-mono text-theme-text">
                  {formatCurrency(yearlyPayment, currency)}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-theme-text-muted mt-1">
              Loan: {formatCurrency(loanAmount, currency)} over {mortgageInputs.loanTermYears} years
            </div>
          </div>

          {/* Advanced Settings - Collapsible */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between text-theme-text-muted hover:text-theme-text h-8 text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Advanced Settings</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {/* Processing Fee */}
              <div className="flex items-center justify-between p-2 bg-theme-card rounded-lg border border-theme-border">
                <Label className="text-theme-text-muted text-[10px]">Processing Fee</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[mortgageInputs.processingFeePercent * 10]}
                    onValueChange={([v]) => updateInput('processingFeePercent', v / 10)}
                    min={5}
                    max={20}
                    step={1}
                    className="w-20"
                  />
                  <span className="text-theme-text font-mono text-xs w-10 text-right">{mortgageInputs.processingFeePercent}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Valuation Fee */}
                <div className="p-2 bg-theme-card rounded-lg border border-theme-border">
                  <Label className="text-theme-text-muted text-[10px] block mb-1">Valuation Fee</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={mortgageInputs.valuationFee ? formatWithCommas(mortgageInputs.valuationFee) : ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                      updateInput('valuationFee', val);
                    }}
                    className="h-7 bg-theme-bg-alt border-theme-border text-theme-text text-xs text-right font-mono px-2"
                  />
                </div>

                {/* Mortgage Registration */}
                <div className="p-2 bg-theme-card rounded-lg border border-theme-border">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-theme-text-muted text-[10px]">Registration</Label>
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
                    <Label className="text-theme-text-muted text-[10px]">Life Insurance</Label>
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
                  <Label className="text-theme-text-muted text-[10px] block mb-1">Property Ins.</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={mortgageInputs.propertyInsurance ? formatWithCommas(mortgageInputs.propertyInsurance) : ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                      updateInput('propertyInsurance', val);
                    }}
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
            className="w-full text-theme-text-muted hover:text-theme-text text-xs h-7"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset to Defaults
          </Button>
        </>
      )}
    </div>
  );
};