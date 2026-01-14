import { useState } from "react";
import { OIInputs, OIHoldAnalysis } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Home, Building, Percent, DollarSign, Calendar, Target, Minus, Equal, TrendingUp, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "./InfoTooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface RentSnapshotProps {
  inputs: OIInputs;
  currency: Currency;
  rate: number;
  holdAnalysis?: OIHoldAnalysis;
  onOccupancyChange?: (occupancy: number) => void;
}

export const RentSnapshot = ({ inputs, currency, rate, holdAnalysis, onOccupancyChange }: RentSnapshotProps) => {
  const { t } = useLanguage();
  const [localOccupancy, setLocalOccupancy] = useState<number | null>(null);
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  
  const { 
    rentalYieldPercent, 
    serviceChargePerSqft = 18,
    unitSizeSqf = 0,
    showAirbnbComparison,
    shortTermRental
  } = inputs;

  // Rental yields are calculated on PURCHASE PRICE (rent compression principle)
  const { basePrice } = inputs;
  const grossAnnualRent = basePrice * (rentalYieldPercent / 100);
  const annualServiceCharges = unitSizeSqf * serviceChargePerSqft;
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const netYieldPercent = basePrice > 0 ? (netAnnualRent / basePrice) * 100 : 0;

  // Short-term calculations (if enabled)
  const adrValue = shortTermRental?.averageDailyRate || 800;
  const baseOccupancy = shortTermRental?.occupancyPercent || 70;
  const occupancyPercent = localOccupancy ?? baseOccupancy;
  const operatingExpensePercent = shortTermRental?.operatingExpensePercent || 25;
  const managementFeePercent = shortTermRental?.managementFeePercent || 15;

  const grossAirbnbAnnual = adrValue * 365 * (occupancyPercent / 100);
  const totalExpensePercent = operatingExpensePercent + managementFeePercent;
  const airbnbOperatingExpenses = grossAirbnbAnnual * (totalExpensePercent / 100);
  const netAirbnbAnnual = grossAirbnbAnnual - airbnbOperatingExpenses - annualServiceCharges;

  const isScenarioMode = localOccupancy !== null && localOccupancy !== baseOccupancy;

  const handleOccupancyChange = (value: number) => {
    setLocalOccupancy(value);
    onOccupancyChange?.(value);
  };

  const resetOccupancy = () => {
    setLocalOccupancy(null);
    onOccupancyChange?.(baseOccupancy);
  };

  // Comparison
  const airbnbDifferencePercent = netAnnualRent > 0 
    ? ((netAirbnbAnnual - netAnnualRent) / netAnnualRent) * 100
    : 0;

  // Visual bar widths
  const maxIncome = Math.max(netAnnualRent, netAirbnbAnnual);
  const ltBarWidth = maxIncome > 0 ? (netAnnualRent / maxIncome) * 100 : 50;
  const airbnbBarWidth = maxIncome > 0 ? (netAirbnbAnnual / maxIncome) * 100 : 50;

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-[#CCFF00]" />
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-theme-text-muted">Yield & Income</h3>
            <p className="text-[10px] text-theme-text-muted">{t('basedOnPurchasePrice')}</p>
          </div>
        </div>
        <Badge 
          variant="secondary"
          className="bg-theme-card-alt text-theme-text-muted border-theme-border text-[10px]"
        >
          {showAirbnbComparison ? t('ltPlusShortTerm') : t('longTermOnly')}
        </Badge>
      </div>

      {/* Main Content - Side by Side on Desktop when Airbnb is enabled */}
      <div className={showAirbnbComparison ? "grid md:grid-cols-2 gap-0" : ""}>
        {/* Long-Term Rental Section */}
        <div className="p-4 space-y-3 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Building className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-medium text-white">{t('longTermRental')}</h4>
          </div>

          {/* Gross Annual Rent */}
          <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm text-gray-400">{t('grossAnnualRent')}</span>
              <InfoTooltip translationKey="tooltipGrossRent" />
            </div>
            <span className="text-sm font-bold text-white font-mono">{formatCurrency(grossAnnualRent, currency, rate)}</span>
          </div>

          {/* Service Charges (subtracted) */}
          {unitSizeSqf > 0 && (
            <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
              <div className="flex items-center gap-2">
                <Minus className="w-3.5 h-3.5 text-red-400" />
                <span className="text-sm text-gray-400">{t('serviceCharges')}</span>
                <InfoTooltip translationKey="tooltipServiceCharge" />
              </div>
              <span className="text-sm font-bold text-red-400 font-mono">-{formatCurrency(annualServiceCharges, currency, rate)}</span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-[#2a3142] pt-2"></div>

          {/* Net Annual Rent - HERO NUMBER */}
          <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
            <div className="flex items-center gap-2">
              <Equal className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span className="text-sm text-gray-300 font-medium">{t('netAnnualRent')}</span>
              <InfoTooltip translationKey="tooltipNetRent" />
            </div>
            <span className="text-xl font-bold text-[#CCFF00] font-mono">{formatCurrency(netAnnualRent, currency, rate)}</span>
          </div>

          {/* Yield Summary */}
          <div className="bg-[#0d1117] rounded-lg p-3 mt-2 space-y-2">
            <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
              <div className="flex items-center gap-2">
                <Percent className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-sm text-gray-400">{t('grossYield')}</span>
                <InfoTooltip translationKey="tooltipGrossYield" />
              </div>
              <span className="text-sm font-bold text-white font-mono">{rentalYieldPercent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
              <div className="flex items-center gap-2">
                <Percent className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-sm text-gray-400">{t('netYieldAfterCharges')}</span>
                <InfoTooltip translationKey="tooltipNetYield" />
              </div>
              <span className="text-sm font-bold text-cyan-400 font-mono">{netYieldPercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Short-Term Section (conditional) */}
        {showAirbnbComparison && (
          <div className={`p-4 space-y-3 border-t md:border-t-0 md:border-l border-[#2a3142] ${isScenarioMode ? 'bg-orange-500/10' : 'bg-orange-500/5'}`}>
            {/* Short-Term Header with Interactive Occupancy Badge */}
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 flex-shrink-0" />
                <h4 className="text-xs sm:text-sm font-medium text-white truncate">{t('shortTermComparison')}</h4>
                {isScenarioMode && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0 animate-fade-in flex-shrink-0">
                    {t('scenarioModeActive')}
                  </Badge>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className={`cursor-pointer transition-all hover:scale-105 rounded-full border text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ${
                      isScenarioMode 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                        : 'bg-orange-500/10 text-orange-300 border-orange-500/30'
                    }`}
                  >
                    <SlidersHorizontal className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="whitespace-nowrap">{occupancyPercent}%</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-[#1a1f2e] border-[#2a3142] p-4" side="bottom" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{t('occupancy')}</span>
                      <span className="text-lg font-bold text-orange-400 font-mono">{occupancyPercent}%</span>
                    </div>
                    
                    <Slider
                      value={[occupancyPercent]}
                      onValueChange={([value]) => handleOccupancyChange(value)}
                      min={30}
                      max={95}
                      step={5}
                      className="roi-slider-lime"
                    />
                    
                    {/* Quick Select Buttons */}
                    <div className="flex gap-2 justify-between">
                      {[50, 60, 70, 80].map((val) => (
                        <Button
                          key={val}
                          variant="outline"
                          size="sm"
                          onClick={() => handleOccupancyChange(val)}
                          className={`flex-1 text-xs h-7 ${
                            occupancyPercent === val 
                              ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' 
                              : 'bg-[#0d1117] border-[#2a3142] text-gray-400 hover:text-white'
                          }`}
                        >
                          {val}%
                        </Button>
                      ))}
                    </div>
                    
                    {isScenarioMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetOccupancy}
                        className="w-full text-xs text-gray-400 hover:text-white"
                      >
                        {t('resetToDefault')} ({baseOccupancy}%)
                      </Button>
                    )}
                    
                    <p className="text-[10px] text-gray-500 text-center">
                      {t('tooltipOccupancyRate')}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* ADR */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t('averageDailyRate')}</span>
              <span className="text-sm font-bold text-white font-mono">{formatCurrency(adrValue, currency, rate)}</span>
            </div>

            {/* Gross Annual */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t('grossAnnual')}</span>
              <span className="text-sm font-bold text-white font-mono">{formatCurrency(grossAirbnbAnnual, currency, rate)}</span>
            </div>

            {/* Grouped Operating Expenses - Collapsible */}
            <div className="space-y-1">
              <button 
                onClick={() => setShowExpenseBreakdown(!showExpenseBreakdown)}
                className="w-full flex items-center justify-between group hover:bg-[#2a3142]/30 rounded-lg py-1 -mx-1 px-1 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Minus className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-sm text-gray-400">Operating Expenses ({totalExpensePercent}%)</span>
                  {showExpenseBreakdown 
                    ? <ChevronUp className="w-3 h-3 text-gray-500" />
                    : <ChevronDown className="w-3 h-3 text-gray-500" />
                  }
                </div>
                <span className="text-sm font-bold text-red-400 font-mono">
                  -{formatCurrency(airbnbOperatingExpenses + annualServiceCharges, currency, rate)}
                </span>
              </button>
              
              {/* Expanded breakdown */}
              {showExpenseBreakdown && (
                <div className="ml-6 space-y-1 pt-1 border-l-2 border-[#2a3142] pl-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{t('utilitiesAndUpkeep')} ({operatingExpensePercent}%)</span>
                    <span className="text-red-400/70 font-mono">-{formatCurrency(grossAirbnbAnnual * (operatingExpensePercent / 100), currency, rate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{t('managementFee')} ({managementFeePercent}%)</span>
                    <span className="text-red-400/70 font-mono">-{formatCurrency(grossAirbnbAnnual * (managementFeePercent / 100), currency, rate)}</span>
                  </div>
                  {unitSizeSqf > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{t('serviceCharges')}</span>
                      <span className="text-red-400/70 font-mono">-{formatCurrency(annualServiceCharges, currency, rate)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Net Annual Short-Term - HERO NUMBER */}
            <div className="flex items-center justify-between pt-2 border-t border-orange-500/20">
              <span className="text-sm text-gray-300 font-medium">{t('netAnnual')}</span>
              <span className="text-xl font-bold text-orange-400 font-mono">{formatCurrency(netAirbnbAnnual, currency, rate)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Visual Comparison Bar */}
      {showAirbnbComparison && (
        <div className="p-4 border-t border-[#2a3142]">
          <p className="text-xs text-gray-500 mb-3">{t('incomeComparison')}</p>
          
          <div className="space-y-2">
            {/* Long-Term Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-16 shrink-0">{t('longTerm')}</span>
              <div className="flex-1 h-3 bg-[#2a3142] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${ltBarWidth}%` }}
                />
              </div>
              <span className="text-xs font-mono text-cyan-400 w-20 text-right">{formatCurrency(netAnnualRent, currency, rate)}</span>
            </div>

            {/* Short-Term Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-16 shrink-0">{t('shortTerm')}</span>
              <div className="flex-1 h-3 bg-[#2a3142] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-400 rounded-full transition-all duration-300"
                  style={{ width: `${airbnbBarWidth}%` }}
                />
              </div>
              <span className="text-xs font-mono text-orange-400 w-20 text-right">{formatCurrency(netAirbnbAnnual, currency, rate)}</span>
            </div>
          </div>

          {/* Winner Badge */}
          <div className="mt-3 text-center">
            <Badge 
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-bold ${
                airbnbDifferencePercent >= 0 
                  ? 'bg-green-500/20 text-green-400 border-green-500/40' 
                  : 'bg-red-500/20 text-red-400 border-red-500/40'
              }`}
            >
              <TrendingUp className={`w-4 h-4 ${airbnbDifferencePercent < 0 ? 'rotate-180' : ''}`} />
              {airbnbDifferencePercent >= 0 ? '+' : ''}{airbnbDifferencePercent.toFixed(0)}% {t('vsLongTerm')}
            </Badge>
          </div>
        </div>
      )}

      {/* Payback Period Section */}
      {holdAnalysis && holdAnalysis.yearsToPayOff < 999 && (
        <div className="p-4 border-t border-[#2a3142] bg-[#0f172a]/50">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-[#CCFF00]" />
            <span className="text-sm font-medium text-white">{t('paybackPeriod')}</span>
            <InfoTooltip translationKey="tooltipYearsToPayOff" />
          </div>
          <p className="text-[10px] text-gray-500 mb-3 ml-6">{t('paybackPeriodDesc')}</p>
          
          <div className="space-y-2">
            {/* Calculate bar widths based on max payback for proportional display */}
            {(() => {
              const ltPayback = holdAnalysis.yearsToPayOff;
              const stPayback = holdAnalysis.airbnbYearsToPayOff && holdAnalysis.airbnbYearsToPayOff < 999 
                ? holdAnalysis.airbnbYearsToPayOff 
                : null;
              const maxPayback = Math.max(ltPayback, stPayback || 0);
              const ltBarWidth = maxPayback > 0 ? (ltPayback / maxPayback) * 100 : 50;
              const stBarWidth = stPayback && maxPayback > 0 ? (stPayback / maxPayback) * 100 : 0;
              
              return (
                <>
                  {/* Long-Term Rental */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{t('longTermRental')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-[#2a3142] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            ltPayback <= 15 ? 'bg-green-400' :
                            ltPayback <= 20 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${ltBarWidth}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold font-mono ${
                        ltPayback <= 15 ? 'text-green-400' :
                        ltPayback <= 20 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {ltPayback.toFixed(1)}y
                      </span>
                    </div>
                  </div>
                  
                  {/* Short-Term (if enabled) */}
                  {stPayback && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{t('shortTerm')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-[#2a3142] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              stPayback <= 12 ? 'bg-green-400' :
                              stPayback <= 18 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${stBarWidth}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold font-mono ${
                          stPayback <= 12 ? 'text-green-400' :
                          stPayback <= 18 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {stPayback.toFixed(1)}y
                        </span>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">{t('basedOnNetRentalIncome')}</p>
        </div>
      )}
    </div>
  );
};
