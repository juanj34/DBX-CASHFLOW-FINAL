import { useState } from "react";
import { Home, Plane, ArrowUp, ArrowDown, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfiguratorSectionProps, DEFAULT_SHORT_TERM_RENTAL } from "./types";
import { formatCurrency } from "../currencyUtils";
import { InfoTooltip } from "../InfoTooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const RentSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const shortTermRental = inputs.shortTermRental || DEFAULT_SHORT_TERM_RENTAL;
  const longTermEnabled = inputs.enabledSections?.longTermHold ?? true;
  const airbnbEnabled = inputs.showAirbnbComparison ?? false;
  const [showAdvancedAirbnb, setShowAdvancedAirbnb] = useState(false);

  // Calculate projected incomes
  const annualLongTermRent = inputs.basePrice * (inputs.rentalYieldPercent / 100);
  const grossAirbnbIncome = shortTermRental.averageDailyRate * 365 * (shortTermRental.occupancyPercent / 100);
  const airbnbExpenses = grossAirbnbIncome * ((shortTermRental.operatingExpensePercent + shortTermRental.managementFeePercent) / 100);
  const netAirbnbIncome = grossAirbnbIncome - airbnbExpenses;

  // Calculate comparison percentage
  const comparisonPercent = annualLongTermRent > 0 
    ? ((netAirbnbIncome - annualLongTermRent) / annualLongTermRent) * 100 
    : 0;

  const handleLongTermToggle = (enabled: boolean) => {
    setInputs(prev => ({
      ...prev,
      enabledSections: {
        ...prev.enabledSections,
        exitStrategy: prev.enabledSections?.exitStrategy ?? true,
        longTermHold: enabled,
      },
    }));
  };

  const handleAirbnbToggle = (enabled: boolean) => {
    setInputs(prev => ({
      ...prev,
      showAirbnbComparison: enabled,
    }));
  };

  // Format number with commas
  const formatWithCommas = (num: number) => num.toLocaleString();

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-semibold text-theme-text">Rental Strategy</h3>
        <p className="text-sm text-theme-text-muted">Configure rental income projections</p>
      </div>

      {/* Long-Term Rental */}
      <div className="space-y-3">
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-theme-accent" />
            <span className="text-sm text-theme-text font-medium">Long-Term Rental</span>
          </div>
          <Switch
            checked={longTermEnabled}
            onCheckedChange={handleLongTermToggle}
            className="data-[state=checked]:bg-theme-accent"
          />
        </div>

        {longTermEnabled && (
          <div className="space-y-3 pl-4 border-l-2 border-theme-accent/30">
            {/* Rental Yield */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <label className="text-xs text-theme-text-muted">Annual Yield</label>
                <InfoTooltip translationKey="tooltipRentalYield" />
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[inputs.rentalYieldPercent]}
                  onValueChange={([value]) => setInputs(prev => ({ ...prev, rentalYieldPercent: value }))}
                  min={3}
                  max={15}
                  step={0.5}
                  className="w-24 roi-slider-lime"
                />
                <span className="text-sm text-theme-accent font-mono font-bold w-10 text-right">{inputs.rentalYieldPercent}%</span>
              </div>
            </div>

            {/* Rent Growth */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <ArrowUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-theme-text-muted">Rent Growth</span>
                <InfoTooltip translationKey="tooltipRentGrowth" />
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[inputs.rentGrowthRate ?? 4]}
                  onValueChange={([value]) => setInputs(prev => ({ ...prev, rentGrowthRate: value }))}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-24 roi-slider-lime"
                />
                <span className="text-xs text-green-500 font-mono w-10 text-right">{inputs.rentGrowthRate ?? 4}%</span>
              </div>
            </div>

            {/* Service Charge */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-theme-text-muted" />
                <span className="text-xs text-theme-text-muted">Service Charge</span>
                <InfoTooltip translationKey="tooltipServiceCharges" />
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={inputs.serviceChargePerSqft || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    setInputs(prev => ({ ...prev, serviceChargePerSqft: Math.min(Math.max(val, 0), 100) }));
                  }}
                  placeholder="18"
                  className="w-16 h-7 text-right bg-theme-bg border-theme-border text-theme-text font-mono text-xs"
                />
                <span className="text-[10px] text-theme-text-muted">/sqft</span>
              </div>
            </div>

            {/* Year 1 Rent Display */}
            <div className="flex justify-between items-center pt-2 border-t border-theme-border/20">
              <span className="text-xs text-theme-text-muted">Year 1 Rent</span>
              <div className="text-right">
                <span className="text-sm font-mono text-theme-accent font-bold">
                  {formatCurrency(annualLongTermRent, currency)}
                </span>
                <span className="text-[10px] text-theme-text-muted ml-1">
                  ({formatCurrency(annualLongTermRent / 12, currency)}/mo)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-theme-border/30" />

      {/* Short-Term Comparison */}
      <div className="space-y-3">
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-theme-text font-medium">Short-Term (Airbnb)</span>
          </div>
          <Switch
            checked={airbnbEnabled}
            onCheckedChange={handleAirbnbToggle}
            className="data-[state=checked]:bg-orange-500"
          />
        </div>

        {airbnbEnabled && (
          <div className="space-y-3 pl-4 border-l-2 border-orange-400/30">
            {/* ADR - Main visible control */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <label className="text-xs text-theme-text-muted">Daily Rate (ADR)</label>
                <InfoTooltip translationKey="tooltipADR" />
              </div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-theme-text-muted text-[10px]">
                  {currency === 'USD' ? '$' : 'AED'}
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={shortTermRental.averageDailyRate ? formatWithCommas(shortTermRental.averageDailyRate) : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                    setInputs(prev => ({
                      ...prev,
                      shortTermRental: { ...(prev.shortTermRental || DEFAULT_SHORT_TERM_RENTAL), averageDailyRate: val }
                    }));
                  }}
                  className="w-24 h-8 text-right bg-theme-bg border-theme-border text-theme-text font-mono text-sm pl-8"
                />
              </div>
            </div>

            {/* Advanced Settings - Collapsible */}
            <Collapsible open={showAdvancedAirbnb} onOpenChange={setShowAdvancedAirbnb}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-6 px-0 text-theme-text-muted hover:text-theme-text hover:bg-transparent text-[11px]">
                  <span>Advanced Settings</span>
                  {showAdvancedAirbnb ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {/* Occupancy */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-theme-text-muted">Occupancy</label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[shortTermRental.occupancyPercent]}
                      onValueChange={([value]) => setInputs(prev => ({
                        ...prev,
                        shortTermRental: { ...(prev.shortTermRental || DEFAULT_SHORT_TERM_RENTAL), occupancyPercent: value }
                      }))}
                      min={30}
                      max={95}
                      step={5}
                      className="w-20 roi-slider-lime"
                    />
                    <span className="text-xs text-theme-text font-mono w-10 text-right">{shortTermRental.occupancyPercent}%</span>
                  </div>
                </div>

                {/* Operating Expenses */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-theme-text-muted">Op. Expenses</label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[shortTermRental.operatingExpensePercent]}
                      onValueChange={([value]) => setInputs(prev => ({
                        ...prev,
                        shortTermRental: { ...(prev.shortTermRental || DEFAULT_SHORT_TERM_RENTAL), operatingExpensePercent: value }
                      }))}
                      min={10}
                      max={50}
                      step={5}
                      className="w-20 roi-slider-lime"
                    />
                    <span className="text-xs text-red-400 font-mono w-10 text-right">{shortTermRental.operatingExpensePercent}%</span>
                  </div>
                </div>

                {/* Management Fee */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-theme-text-muted">Management</label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[shortTermRental.managementFeePercent]}
                      onValueChange={([value]) => setInputs(prev => ({
                        ...prev,
                        shortTermRental: { ...(prev.shortTermRental || DEFAULT_SHORT_TERM_RENTAL), managementFeePercent: value }
                      }))}
                      min={0}
                      max={30}
                      step={5}
                      className="w-20 roi-slider-lime"
                    />
                    <span className="text-xs text-amber-400 font-mono w-10 text-right">{shortTermRental.managementFeePercent}%</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Short-Term Income Summary */}
            <div className="space-y-1.5 pt-2 border-t border-theme-border/20">
              <div className="flex justify-between text-xs">
                <span className="text-theme-text-muted">Gross</span>
                <span className="text-theme-text font-mono">{formatCurrency(grossAirbnbIncome, currency)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-theme-text-muted">Expenses</span>
                <span className="text-red-400 font-mono">-{formatCurrency(airbnbExpenses, currency)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-theme-border/20">
                <span className="text-orange-400 font-medium">Net</span>
                <span className="text-theme-accent font-mono font-bold">{formatCurrency(netAirbnbIncome, currency)}</span>
              </div>
              
              {/* Comparison with Long-Term */}
              {longTermEnabled && annualLongTermRent > 0 && (
                <div className={`flex items-center justify-between text-xs pt-1 ${comparisonPercent >= 0 ? 'text-green-500' : 'text-amber-500'}`}>
                  <span className="flex items-center gap-1">
                    {comparisonPercent >= 0 ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    vs Long-Term
                  </span>
                  <span className="font-mono font-bold">
                    {comparisonPercent >= 0 ? '+' : ''}{comparisonPercent.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
