import { Home, Plane } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ConfiguratorSectionProps, DEFAULT_SHORT_TERM_RENTAL } from "./types";
import { formatCurrency } from "../currencyUtils";
import { InfoTooltip } from "../InfoTooltip";
import { EnabledSectionsToggle, DEFAULT_ENABLED_SECTIONS } from "../EnabledSectionsToggle";

export const IncomeSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const shortTermRental = inputs.shortTermRental || DEFAULT_SHORT_TERM_RENTAL;
  const rentalMode = inputs.rentalMode || 'long-term';
  const enabledSections = inputs.enabledSections || DEFAULT_ENABLED_SECTIONS;

  const handleNumberChange = (field: keyof typeof inputs, value: string, min: number, max: number) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setInputs(prev => ({ ...prev, [field]: Math.min(Math.max(num, min), max) }));
    }
  };

  // Calculate projected incomes
  const annualLongTermRent = inputs.basePrice * (inputs.rentalYieldPercent / 100);
  const grossAirbnbIncome = shortTermRental.averageDailyRate * 365 * (shortTermRental.occupancyPercent / 100);
  const airbnbExpenses = grossAirbnbIncome * ((shortTermRental.operatingExpensePercent + shortTermRental.managementFeePercent) / 100);
  const netAirbnbIncome = grossAirbnbIncome - airbnbExpenses;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Rental Income</h3>
        <p className="text-sm text-gray-500">Configure long-term rental and optional short-term comparison</p>
      </div>

      {/* Enabled Sections Toggle */}
      <div className="p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
        <EnabledSectionsToggle
          enabledSections={enabledSections}
          onChange={(sections) => setInputs(prev => ({ ...prev, enabledSections: sections }))}
        />
      </div>

      {/* Long-Term Rental */}
      <div className="space-y-4 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-[#CCFF00]" />
          <label className="text-sm text-gray-300 font-medium">Long-Term Rental</label>
        </div>

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
          <div className="flex justify-between text-xs text-gray-500">
            <span>Conservative (3%)</span>
            <span>Aggressive (15%)</span>
          </div>
        </div>

        {/* Annual Income Display */}
        <div className="p-3 bg-[#0d1117] rounded-lg border border-[#CCFF00]/20">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Projected Annual Rent</span>
            <span className="text-lg font-mono text-[#CCFF00] font-bold">
              {formatCurrency(annualLongTermRent, currency)}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatCurrency(annualLongTermRent / 12, currency)}/month
          </div>
        </div>

        {/* Minimum Exit Threshold */}
        <div className="space-y-2 pt-3 border-t border-[#2a3142]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-400">Minimum Exit Threshold</label>
              <InfoTooltip translationKey="tooltipMinimumExitThreshold" />
            </div>
            <span className="text-xs text-white font-mono">{inputs.minimumExitThreshold}%</span>
          </div>
          <Slider
            value={[inputs.minimumExitThreshold]}
            onValueChange={([value]) => setInputs(prev => ({ ...prev, minimumExitThreshold: value }))}
            min={10}
            max={50}
            step={5}
            className="roi-slider-lime"
          />
        </div>
      </div>

      {/* Airbnb Comparison Toggle */}
      <div className="space-y-4 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-purple-400" />
            <label className="text-sm text-gray-300 font-medium">Airbnb Comparison</label>
          </div>
          <Switch
            checked={inputs.showAirbnbComparison}
            onCheckedChange={(checked) => setInputs(prev => ({ ...prev, showAirbnbComparison: checked }))}
            className="data-[state=checked]:bg-purple-500"
          />
        </div>

        {inputs.showAirbnbComparison && (
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

            <div className="grid grid-cols-3 gap-3">
              {/* Occupancy */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Occupancy</label>
                <div className="text-sm text-white font-mono">{shortTermRental.occupancyPercent}%</div>
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
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Op. Expenses</label>
                <div className="text-sm text-red-400 font-mono">{shortTermRental.operatingExpensePercent}%</div>
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
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Mgmt Fee</label>
                <div className="text-sm text-amber-400 font-mono">{shortTermRental.managementFeePercent}%</div>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
