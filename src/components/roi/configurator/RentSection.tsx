import { useState } from "react";
import { Home, Plane, DollarSign, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from "lucide-react";
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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Rental Strategy</h3>
        <p className="text-sm text-gray-500">Configure rental income projections</p>
      </div>

      {/* Long-Term Rental Toggle & Config */}
      <div className="space-y-3 p-3 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-[#CCFF00]" />
            <span className="text-sm text-gray-300 font-medium">Long-Term Rental</span>
          </div>
          <Switch
            checked={longTermEnabled}
            onCheckedChange={handleLongTermToggle}
            className="data-[state=checked]:bg-[#CCFF00]"
          />
        </div>

        {longTermEnabled && (
          <div className="space-y-3 pt-2 border-t border-[#2a3142]">
            {/* Rental Yield */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-400">Annual Rental Yield</label>
                  <InfoTooltip translationKey="tooltipRentalYield" />
                </div>
                <span className="text-sm text-[#CCFF00] font-mono font-bold">{inputs.rentalYieldPercent}%</span>
              </div>
              <Slider
                value={[inputs.rentalYieldPercent]}
                onValueChange={([value]) => setInputs(prev => ({ ...prev, rentalYieldPercent: value }))}
                min={3}
                max={15}
                step={0.5}
                className="roi-slider-lime"
              />
            </div>

            {/* Annual Income Display */}
            <div className="p-2.5 bg-[#0d1117] rounded-lg border border-[#CCFF00]/20">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Year 1 Rent</span>
                <span className="text-base font-mono text-[#CCFF00] font-bold">
                  {formatCurrency(annualLongTermRent, currency)}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {formatCurrency(annualLongTermRent / 12, currency)}/month
              </div>
            </div>

            {/* Service Charges - Inline */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                <label className="text-xs text-gray-400">Service Charges</label>
                <InfoTooltip translationKey="tooltipServiceCharges" />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={inputs.serviceChargePerSqft || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    setInputs(prev => ({ ...prev, serviceChargePerSqft: Math.min(Math.max(val, 0), 100) }));
                  }}
                  className="w-16 h-7 text-right bg-[#0d1117] border-[#2a3142] text-white font-mono text-xs"
                />
                <span className="text-[10px] text-gray-500">AED/sqft</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Short-Term Comparison Toggle & Config */}
      <div className="space-y-3 p-3 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-300 font-medium">Short-Term Comparison</span>
          </div>
          <Switch
            checked={airbnbEnabled}
            onCheckedChange={handleAirbnbToggle}
            className="data-[state=checked]:bg-orange-500"
          />
        </div>

        {airbnbEnabled && (
          <div className="space-y-3 pt-2 border-t border-[#2a3142]">
            {/* ADR - Main visible control */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-400">Average Daily Rate (ADR)</label>
                  <InfoTooltip translationKey="tooltipADR" />
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">
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
                    className="w-24 h-7 text-right bg-[#0d1117] border-[#2a3142] text-white font-mono text-sm pl-8"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Settings - Collapsible */}
            <Collapsible open={showAdvancedAirbnb} onOpenChange={setShowAdvancedAirbnb}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-7 px-2 text-gray-500 hover:text-white text-xs">
                  <span>Advanced Settings</span>
                  {showAdvancedAirbnb ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {/* Occupancy */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Occupancy</label>
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
                    <span className="text-xs text-white font-mono w-10 text-right">{shortTermRental.occupancyPercent}%</span>
                  </div>
                </div>

                {/* Operating Expenses */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Op. Expenses</label>
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
                  <label className="text-xs text-gray-400">Management</label>
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
            <div className="p-2.5 bg-[#0d1117] rounded-lg border border-orange-500/30 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Gross</span>
                <span className="text-white font-mono">{formatCurrency(grossAirbnbIncome, currency)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Expenses</span>
                <span className="text-red-400 font-mono">-{formatCurrency(airbnbExpenses, currency)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1.5 border-t border-[#2a3142]">
                <span className="text-orange-400 font-medium">Net</span>
                <span className="text-[#CCFF00] font-mono font-bold">{formatCurrency(netAirbnbIncome, currency)}</span>
              </div>
              
              {/* Comparison with Long-Term */}
              {longTermEnabled && annualLongTermRent > 0 && (
                <div className="pt-1.5 border-t border-[#2a3142]">
                  <div className={`flex items-center justify-between text-xs ${comparisonPercent >= 0 ? 'text-green-400' : 'text-amber-400'}`}>
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
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};