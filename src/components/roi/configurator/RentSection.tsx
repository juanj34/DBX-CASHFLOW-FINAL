import { useState } from "react";
import { Home, Plane, TrendingUp, DollarSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ConfiguratorSectionProps, DEFAULT_SHORT_TERM_RENTAL } from "./types";
import { formatCurrency } from "../currencyUtils";
import { InfoTooltip } from "../InfoTooltip";

export const RentSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const shortTermRental = inputs.shortTermRental || DEFAULT_SHORT_TERM_RENTAL;
  const longTermEnabled = inputs.enabledSections?.longTermHold ?? true;
  const airbnbEnabled = inputs.showAirbnbComparison ?? false;

  // Calculate projected incomes
  const annualLongTermRent = inputs.basePrice * (inputs.rentalYieldPercent / 100);
  const grossAirbnbIncome = shortTermRental.averageDailyRate * 365 * (shortTermRental.occupancyPercent / 100);
  const airbnbExpenses = grossAirbnbIncome * ((shortTermRental.operatingExpensePercent + shortTermRental.managementFeePercent) / 100);
  const netAirbnbIncome = grossAirbnbIncome - airbnbExpenses;

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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Rental Strategy</h3>
        <p className="text-sm text-gray-500">Configure long-term rental and optional Airbnb comparison</p>
      </div>

      {/* Long-Term Rental Toggle & Config */}
      <div className="space-y-4 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
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
          <div className="space-y-4 pt-3 border-t border-[#2a3142]">
            {/* Rental Yield */}
            <div className="space-y-2">
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
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Conservative (3%)</span>
                <span>Aggressive (15%)</span>
              </div>
            </div>

            {/* Rent Growth Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400">Annual Rent Growth</label>
                <span className="text-sm text-green-400 font-mono">{inputs.rentGrowthRate ?? 4}%</span>
              </div>
              <Slider
                value={[inputs.rentGrowthRate ?? 4]}
                onValueChange={([value]) => setInputs(prev => ({ ...prev, rentGrowthRate: value }))}
                min={0}
                max={10}
                step={0.5}
                className="roi-slider-lime"
              />
            </div>

            {/* Annual Income Display */}
            <div className="p-3 bg-[#0d1117] rounded-lg border border-[#CCFF00]/20">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Year 1 Annual Rent</span>
                <span className="text-lg font-mono text-[#CCFF00] font-bold">
                  {formatCurrency(annualLongTermRent, currency)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrency(annualLongTermRent / 12, currency)}/month
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Airbnb Comparison Toggle & Config */}
      <div className="space-y-4 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300 font-medium">Airbnb Comparison</span>
          </div>
          <Switch
            checked={airbnbEnabled}
            onCheckedChange={handleAirbnbToggle}
            className="data-[state=checked]:bg-purple-500"
          />
        </div>

        {airbnbEnabled && (
          <div className="space-y-4 pt-3 border-t border-[#2a3142]">
            {/* ADR */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400">Average Daily Rate</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                    {currency === 'USD' ? '$' : 'AED'}
                  </span>
                  <Input
                    type="number"
                    value={shortTermRental.averageDailyRate}
                    onChange={(e) => setInputs(prev => ({
                      ...prev,
                      shortTermRental: { ...(prev.shortTermRental || DEFAULT_SHORT_TERM_RENTAL), averageDailyRate: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-28 h-8 text-right bg-[#0d1117] border-[#2a3142] text-white font-mono text-sm pl-10"
                  />
                </div>
              </div>
              <Slider
                value={[shortTermRental.averageDailyRate]}
                onValueChange={([value]) => setInputs(prev => ({
                  ...prev,
                  shortTermRental: { ...(prev.shortTermRental || DEFAULT_SHORT_TERM_RENTAL), averageDailyRate: value }
                }))}
                min={200}
                max={3000}
                step={50}
                className="roi-slider-lime"
              />
            </div>

            {/* ADR Growth Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400">ADR Growth Rate</label>
                <span className="text-sm text-purple-400 font-mono">{inputs.adrGrowthRate ?? 3}%</span>
              </div>
              <Slider
                value={[inputs.adrGrowthRate ?? 3]}
                onValueChange={([value]) => setInputs(prev => ({ ...prev, adrGrowthRate: value }))}
                min={0}
                max={10}
                step={0.5}
                className="roi-slider-lime"
              />
            </div>

            {/* Occupancy, Expenses, Management in stacked layout */}
            <div className="space-y-3">
              {/* Occupancy */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-400">Occupancy Rate</label>
                  <span className="text-sm text-white font-mono">{shortTermRental.occupancyPercent}%</span>
                </div>
                <Slider
                  value={[shortTermRental.occupancyPercent]}
                  onValueChange={([value]) => setInputs(prev => ({
                    ...prev,
                    shortTermRental: { ...(prev.shortTermRental || DEFAULT_SHORT_TERM_RENTAL), occupancyPercent: value }
                  }))}
                  min={30}
                  max={95}
                  step={5}
                  className="roi-slider-lime"
                />
              </div>

              {/* Operating Expenses */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-400">Operating Expenses</label>
                  <span className="text-sm text-red-400 font-mono">{shortTermRental.operatingExpensePercent}%</span>
                </div>
                <Slider
                  value={[shortTermRental.operatingExpensePercent]}
                  onValueChange={([value]) => setInputs(prev => ({
                    ...prev,
                    shortTermRental: { ...(prev.shortTermRental || DEFAULT_SHORT_TERM_RENTAL), operatingExpensePercent: value }
                  }))}
                  min={10}
                  max={50}
                  step={5}
                  className="roi-slider-lime"
                />
              </div>

              {/* Management Fee */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-400">Management Fee</label>
                  <span className="text-sm text-amber-400 font-mono">{shortTermRental.managementFeePercent}%</span>
                </div>
                <Slider
                  value={[shortTermRental.managementFeePercent]}
                  onValueChange={([value]) => setInputs(prev => ({
                    ...prev,
                    shortTermRental: { ...(prev.shortTermRental || DEFAULT_SHORT_TERM_RENTAL), managementFeePercent: value }
                  }))}
                  min={0}
                  max={30}
                  step={5}
                  className="roi-slider-lime"
                />
              </div>
            </div>

            {/* Airbnb Income Summary */}
            <div className="p-3 bg-[#0d1117] rounded-lg border border-purple-500/30 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Gross Income</span>
                <span className="text-white font-mono">{formatCurrency(grossAirbnbIncome, currency)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">- Expenses</span>
                <span className="text-red-400 font-mono">-{formatCurrency(airbnbExpenses, currency)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-[#2a3142]">
                <span className="text-purple-400 font-medium">Net Income</span>
                <span className="text-[#CCFF00] font-mono font-bold">{formatCurrency(netAirbnbIncome, currency)}</span>
              </div>
              {/* Comparison */}
              {longTermEnabled && (
                <div className="text-xs text-gray-500 pt-2">
                  {netAirbnbIncome > annualLongTermRent ? (
                    <span className="text-green-400">
                      +{formatCurrency(netAirbnbIncome - annualLongTermRent, currency)} vs Long-Term
                    </span>
                  ) : (
                    <span className="text-amber-400">
                      {formatCurrency(netAirbnbIncome - annualLongTermRent, currency)} vs Long-Term
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Service Charges */}
      <div className="space-y-4 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#CCFF00]" />
          <label className="text-sm text-gray-300 font-medium">Service Charges</label>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs text-gray-400">Per sqft/year (AED)</label>
            <Input
              type="number"
              value={inputs.serviceChargePerSqft ?? 18}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                if (!isNaN(num)) {
                  setInputs(prev => ({ ...prev, serviceChargePerSqft: Math.min(Math.max(num, 0), 100) }));
                }
              }}
              className="w-20 h-8 text-right bg-[#0d1117] border-[#2a3142] text-white font-mono text-sm"
            />
          </div>
          <Slider
            value={[inputs.serviceChargePerSqft ?? 18]}
            onValueChange={([value]) => setInputs(prev => ({ ...prev, serviceChargePerSqft: value }))}
            min={5}
            max={50}
            step={1}
            className="roi-slider-lime"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Low (5 AED)</span>
            <span>Premium (50 AED)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
