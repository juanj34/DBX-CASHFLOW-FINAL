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
  const { basePrice, rentGrowthRate = 4 } = inputs;
  const grossAnnualRent = basePrice * (rentalYieldPercent / 100);
  const annualServiceCharges = unitSizeSqf * serviceChargePerSqft;
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const netYieldPercent = basePrice > 0 ? (netAnnualRent / basePrice) * 100 : 0;

  // Calculate 7-year average rent (with compounding growth)
  const PROJECTION_YEARS = 7;
  const growthRate = rentGrowthRate / 100;
  let totalRent7Years = 0;
  for (let year = 0; year < PROJECTION_YEARS; year++) {
    totalRent7Years += netAnnualRent * Math.pow(1 + growthRate, year);
  }
  const avgAnnualRent7Years = totalRent7Years / PROJECTION_YEARS;
  const avgMonthlyRent7Years = avgAnnualRent7Years / 12;

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
          <Home className="w-5 h-5 text-theme-accent" />
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-theme-text-muted">{t('yieldIncomeLabel')}</h3>
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
            <Building className="w-4 h-4 text-theme-positive" />
            <h4 className="text-sm font-medium text-theme-text">{t('longTermRental')}</h4>
          </div>

          {/* Gross Annual Rent */}
          <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-theme-text-muted" />
              <span className="text-sm text-theme-text-muted">{t('grossAnnualRent')}</span>
              <InfoTooltip translationKey="tooltipGrossRent" />
            </div>
            <span className="text-sm font-bold text-theme-text font-mono">{formatCurrency(grossAnnualRent, currency, rate)}</span>
          </div>

          {/* Service Charges (subtracted) */}
          {unitSizeSqf > 0 && (
            <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
              <div className="flex items-center gap-2">
                <Minus className="w-3.5 h-3.5 text-theme-negative" />
                <span className="text-sm text-theme-text-muted">{t('serviceCharges')}</span>
                <InfoTooltip translationKey="tooltipServiceCharge" />
              </div>
              <span className="text-sm font-bold text-theme-negative font-mono">-{formatCurrency(annualServiceCharges, currency, rate)}</span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-theme-border pt-2"></div>

          {/* 7-Year Average Rent - HERO NUMBER */}
          <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Equal className="w-3.5 h-3.5 text-theme-accent" />
                <span className="text-sm text-theme-text font-medium">{t('avgAnnualRent7Years') || t('avgAnnualRentLabel')}</span>
                <InfoTooltip translationKey="tooltipNetRent" />
              </div>
              <span className="text-[10px] text-theme-text-muted ml-5">{t('over7YearsWithGrowth') || `${t('sevenYearAvgWithGrowth')} @ ${rentGrowthRate}%${t('yrGrowthLabel')}`}</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-theme-accent font-mono">{formatCurrency(avgAnnualRent7Years, currency, rate)}<span className="text-sm text-theme-text-muted">/{t('yearShort')}</span></span>
              <div className="text-[10px] text-theme-text-muted">{formatCurrency(avgMonthlyRent7Years, currency, rate)}/{t('moShort')}</div>
            </div>
          </div>

          {/* Year 1 Reference */}
          <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none text-xs">
            <div className="flex items-center gap-2">
              <span className="text-theme-text-muted ml-5">{t('year1Label') || t('year1')}:</span>
            </div>
            <span className="text-theme-text-muted font-mono">{formatCurrency(netAnnualRent, currency, rate)}/{t('yearShort')} ({formatCurrency(netAnnualRent / 12, currency, rate)}/{t('moShort')})</span>
          </div>

          {/* Yield Summary */}
          <div className="bg-theme-bg rounded-lg p-3 mt-2 space-y-2">
            <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
              <div className="flex items-center gap-2">
                <Percent className="w-3.5 h-3.5 text-theme-text-muted" />
                <span className="text-sm text-theme-text-muted">{t('grossYield')}</span>
                <InfoTooltip translationKey="tooltipGrossYield" />
              </div>
              <span className="text-sm font-bold text-theme-text font-mono">{rentalYieldPercent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
              <div className="flex items-center gap-2">
                <Percent className="w-3.5 h-3.5 text-theme-positive" />
                <span className="text-sm text-theme-text-muted">{t('netYieldAfterCharges')}</span>
                <InfoTooltip translationKey="tooltipNetYield" />
              </div>
              <span className="text-sm font-bold text-theme-positive font-mono">{netYieldPercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Short-Term Section (conditional) */}
        {showAirbnbComparison && (
          <div className={`p-4 space-y-3 border-t md:border-t-0 md:border-l border-theme-border ${isScenarioMode ? 'bg-theme-accent/10' : 'bg-theme-accent/5'}`}>
            {/* Short-Term Header with Interactive Occupancy Badge */}
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-theme-accent flex-shrink-0" />
                <h4 className="text-xs sm:text-sm font-medium text-theme-text truncate">{t('shortTermComparison')}</h4>
                {isScenarioMode && (
                  <Badge className="bg-theme-accent/20 text-theme-accent border-theme-accent/30 text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0 animate-fade-in flex-shrink-0">
                    {t('scenarioModeActive')}
                  </Badge>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className={`cursor-pointer transition-all hover:scale-105 rounded-full border text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ${
                      isScenarioMode 
                        ? 'bg-theme-accent/20 text-theme-accent border-theme-accent/50' 
                        : 'bg-theme-accent/10 text-theme-accent border-theme-accent/30'
                    }`}
                  >
                    <SlidersHorizontal className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="whitespace-nowrap">{occupancyPercent}%</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-theme-card border-theme-border p-4" side="bottom" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-theme-text">{t('occupancy')}</span>
                      <span className="text-lg font-bold text-theme-accent font-mono">{occupancyPercent}%</span>
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
                              ? 'bg-theme-accent/20 border-theme-accent/50 text-theme-accent' 
                              : 'bg-theme-bg border-theme-border text-theme-text-muted hover:text-theme-text'
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
                        className="w-full text-xs text-theme-text-muted hover:text-theme-text"
                      >
                        {t('resetToDefault')} ({baseOccupancy}%)
                      </Button>
                    )}
                    
                    <p className="text-[10px] text-theme-text-muted text-center">
                      {t('tooltipOccupancyRate')}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* ADR */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-theme-text-muted">{t('averageDailyRate')}</span>
              <span className="text-sm font-bold text-theme-text font-mono">{formatCurrency(adrValue, currency, rate)}</span>
            </div>

            {/* Gross Annual */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-theme-text-muted">{t('grossAnnual')}</span>
              <span className="text-sm font-bold text-theme-text font-mono">{formatCurrency(grossAirbnbAnnual, currency, rate)}</span>
            </div>

            {/* Grouped Operating Expenses - Collapsible */}
            <div className="space-y-1">
              <button 
                onClick={() => setShowExpenseBreakdown(!showExpenseBreakdown)}
                className="w-full flex items-center justify-between group hover:bg-theme-border/30 rounded-lg py-1 -mx-1 px-1 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Minus className="w-3.5 h-3.5 text-theme-negative" />
                  <span className="text-sm text-theme-text-muted">{t('operatingExpensesLabel')} ({totalExpensePercent}%)</span>
                  {showExpenseBreakdown 
                    ? <ChevronUp className="w-3 h-3 text-theme-text-muted" />
                    : <ChevronDown className="w-3 h-3 text-theme-text-muted" />
                  }
                </div>
                <span className="text-sm font-bold text-theme-negative font-mono">
                  -{formatCurrency(airbnbOperatingExpenses + annualServiceCharges, currency, rate)}
                </span>
              </button>
              
              {/* Expanded breakdown */}
              {showExpenseBreakdown && (
                <div className="ml-6 space-y-1 pt-1 border-l-2 border-theme-border pl-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-theme-text-muted">{t('utilitiesAndUpkeep')} ({operatingExpensePercent}%)</span>
                    <span className="text-theme-negative/70 font-mono">-{formatCurrency(grossAirbnbAnnual * (operatingExpensePercent / 100), currency, rate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-theme-text-muted">{t('managementFee')} ({managementFeePercent}%)</span>
                    <span className="text-theme-negative/70 font-mono">-{formatCurrency(grossAirbnbAnnual * (managementFeePercent / 100), currency, rate)}</span>
                  </div>
                  {unitSizeSqf > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-theme-text-muted">{t('serviceCharges')}</span>
                      <span className="text-theme-negative/70 font-mono">-{formatCurrency(annualServiceCharges, currency, rate)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Net Annual Short-Term - HERO NUMBER */}
            <div className="flex items-center justify-between pt-2 border-t border-theme-accent/20">
              <span className="text-sm text-theme-text font-medium">{t('netAnnual')}</span>
              <span className="text-xl font-bold text-theme-accent font-mono">{formatCurrency(netAirbnbAnnual, currency, rate)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Visual Comparison Bar */}
      {showAirbnbComparison && (
        <div className="p-4 border-t border-theme-border">
          <p className="text-xs text-theme-text-muted mb-3">{t('incomeComparison')}</p>
          
          <div className="space-y-2">
            {/* Long-Term Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-theme-text-muted w-16 shrink-0">{t('longTerm')}</span>
              <div className="flex-1 h-3 bg-theme-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-theme-positive rounded-full transition-all duration-300"
                  style={{ width: `${ltBarWidth}%` }}
                />
              </div>
              <span className="text-xs font-mono text-theme-positive w-20 text-right">{formatCurrency(netAnnualRent, currency, rate)}</span>
            </div>

            {/* Short-Term Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-theme-text-muted w-16 shrink-0">{t('shortTerm')}</span>
              <div className="flex-1 h-3 bg-theme-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-theme-accent rounded-full transition-all duration-300"
                  style={{ width: `${airbnbBarWidth}%` }}
                />
              </div>
              <span className="text-xs font-mono text-theme-accent w-20 text-right">{formatCurrency(netAirbnbAnnual, currency, rate)}</span>
            </div>
          </div>

          {/* Winner Badge */}
          <div className="mt-3 text-center">
            <Badge 
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-bold ${
                airbnbDifferencePercent >= 0 
                  ? 'bg-theme-positive/20 text-theme-positive border-theme-positive/40' 
                  : 'bg-theme-negative/20 text-theme-negative border-theme-negative/40'
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
        <div className="p-4 border-t border-theme-border bg-theme-bg/50">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-theme-accent" />
            <span className="text-sm font-medium text-theme-text">{t('paybackPeriod')}</span>
            <InfoTooltip translationKey="tooltipYearsToPayOff" />
          </div>
          <p className="text-[10px] text-theme-text-muted mb-3 ml-6">{t('paybackPeriodDesc')}</p>
          
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
                    <span className="text-xs text-theme-text-muted">{t('longTermRental')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-theme-border rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            ltPayback <= 15 ? 'bg-theme-positive' :
                            ltPayback <= 20 ? 'bg-theme-accent' : 'bg-theme-negative'
                          }`}
                          style={{ width: `${ltBarWidth}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold font-mono ${
                        ltPayback <= 15 ? 'text-theme-positive' :
                        ltPayback <= 20 ? 'text-theme-accent' : 'text-theme-negative'
                      }`}>
                        {ltPayback.toFixed(1)}y
                      </span>
                    </div>
                  </div>
                  
                  {/* Short-Term (if enabled) */}
                  {stPayback && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-theme-text-muted">{t('shortTerm')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-theme-border rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              stPayback <= 12 ? 'bg-theme-positive' :
                              stPayback <= 18 ? 'bg-theme-accent' : 'bg-theme-negative'
                            }`}
                            style={{ width: `${stBarWidth}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold font-mono ${
                          stPayback <= 12 ? 'text-theme-positive' :
                          stPayback <= 18 ? 'text-theme-accent' : 'text-theme-negative'
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
          <p className="text-[10px] text-theme-text-muted mt-2 text-center">{t('basedOnNetRentalIncome')}</p>
        </div>
      )}
    </div>
  );
};
