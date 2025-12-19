import { OIInputs, OIHoldAnalysis } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Home, Building, Percent, DollarSign, Calendar, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RentSnapshotProps {
  inputs: OIInputs;
  currency: Currency;
  rate: number;
  holdAnalysis?: OIHoldAnalysis;
}

export const RentSnapshot = ({ inputs, currency, rate, holdAnalysis }: RentSnapshotProps) => {
  const { t } = useLanguage();
  
  const { 
    basePrice, 
    rentalYieldPercent, 
    serviceChargePerSqft = 18,
    unitSizeSqf = 0,
    showAirbnbComparison,
    shortTermRental
  } = inputs;

  // Long-Term calculations
  const estimatedAnnualRent = basePrice * (rentalYieldPercent / 100);
  const annualServiceCharges = unitSizeSqf * serviceChargePerSqft;
  const netAnnualRent = estimatedAnnualRent - annualServiceCharges;

  // Airbnb calculations (if enabled)
  const adrValue = shortTermRental?.averageDailyRate || 800;
  const occupancyPercent = shortTermRental?.occupancyPercent || 70;
  const operatingExpensePercent = shortTermRental?.operatingExpensePercent || 25;
  const managementFeePercent = shortTermRental?.managementFeePercent || 15;

  const grossAirbnbAnnual = adrValue * 365 * (occupancyPercent / 100);
  const totalExpensePercent = operatingExpensePercent + managementFeePercent;
  const netAirbnbAnnual = grossAirbnbAnnual * (1 - totalExpensePercent / 100) - annualServiceCharges;

  // Comparison
  const airbnbDifferencePercent = netAnnualRent > 0 
    ? ((netAirbnbAnnual - netAnnualRent) / netAnnualRent) * 100
    : 0;

  // Visual bar widths
  const maxIncome = Math.max(netAnnualRent, netAirbnbAnnual);
  const ltBarWidth = maxIncome > 0 ? (netAnnualRent / maxIncome) * 100 : 50;
  const airbnbBarWidth = maxIncome > 0 ? (netAirbnbAnnual / maxIncome) * 100 : 50;

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden h-fit mt-4 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#2a3142] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-[#CCFF00]" />
          <h3 className="font-semibold text-white">{t('rentSnapshot')}</h3>
        </div>
        <Badge 
          variant={showAirbnbComparison ? "default" : "secondary"}
          className={showAirbnbComparison 
            ? "bg-orange-500/20 text-orange-400 border-orange-500/30" 
            : "bg-[#2a3142] text-gray-400 border-[#2a3142]"
          }
        >
          {showAirbnbComparison ? t('ltPlusAirbnb') : t('longTermOnly')}
        </Badge>
      </div>

      {/* Long-Term Rental Section */}
      <div className="p-4 space-y-3 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <Building className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-medium text-white">{t('longTermRental')}</h4>
        </div>

        {/* Initial Yield */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-sm text-gray-400">{t('rentalYield')}</span>
          </div>
          <span className="text-sm font-bold text-[#CCFF00] font-mono">{rentalYieldPercent}%</span>
        </div>

        {/* Estimated Annual Rent */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-sm text-gray-400">{t('estimatedAnnualRent')}</span>
          </div>
          <span className="text-sm font-bold text-white font-mono">{formatCurrency(estimatedAnnualRent, currency, rate)}</span>
        </div>

        {/* Service Charges */}
        {unitSizeSqf > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('serviceCharges')}</span>
            <span className="text-sm font-bold text-red-400 font-mono">-{formatCurrency(annualServiceCharges, currency, rate)}</span>
          </div>
        )}

        {/* Net Annual Rent */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2a3142]">
          <span className="text-sm text-gray-300 font-medium">{t('netAnnualRent')}</span>
          <span className="text-sm font-bold text-cyan-400 font-mono">{formatCurrency(netAnnualRent, currency, rate)}</span>
        </div>
      </div>

      {/* Airbnb Section (conditional) */}
      {showAirbnbComparison && (
        <div className="p-4 space-y-3 border-t border-[#2a3142] bg-orange-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-orange-400" />
            <h4 className="text-sm font-medium text-white">{t('airbnbComparison')}</h4>
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

          {/* Total Expenses */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('totalExpenses')} ({totalExpensePercent}%)</span>
            <span className="text-sm font-bold text-red-400 font-mono">-{formatCurrency(grossAirbnbAnnual * totalExpensePercent / 100 + annualServiceCharges, currency, rate)}</span>
          </div>

          {/* Net Annual Airbnb */}
          <div className="flex items-center justify-between pt-2 border-t border-orange-500/20">
            <span className="text-sm text-gray-300 font-medium">{t('netAnnual')}</span>
            <span className="text-sm font-bold text-orange-400 font-mono">{formatCurrency(netAirbnbAnnual, currency, rate)}</span>
          </div>
        </div>
      )}

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

            {/* Airbnb Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-16 shrink-0">Airbnb</span>
              <div className="flex-1 h-3 bg-[#2a3142] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-400 rounded-full transition-all duration-300"
                  style={{ width: `${airbnbBarWidth}%` }}
                />
              </div>
              <span className="text-xs font-mono text-orange-400 w-20 text-right">{formatCurrency(netAirbnbAnnual, currency, rate)}</span>
            </div>
          </div>

          {/* Difference */}
          <div className="mt-3 text-center">
            <span className={`text-xs font-bold ${airbnbDifferencePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {airbnbDifferencePercent >= 0 ? '+' : ''}{airbnbDifferencePercent.toFixed(0)}% {t('vsLongTerm')}
            </span>
          </div>
        </div>
      )}

      {/* Years to Pay Off Section - Moved from InvestmentSnapshot */}
      {holdAnalysis && holdAnalysis.yearsToPayOff < 999 && (
        <div className="p-4 border-t border-[#2a3142] bg-[#0f172a]/50">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-[#CCFF00]" />
            <span className="text-sm font-medium text-white">{t('yearsToPayOff')}</span>
          </div>
          <div className="space-y-2">
            {/* Long-Term Rental */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{t('longTermRental')}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-[#2a3142] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      holdAnalysis.yearsToPayOff <= 15 ? 'bg-green-400' :
                      holdAnalysis.yearsToPayOff <= 20 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(100, (15 / holdAnalysis.yearsToPayOff) * 100)}%` }}
                  />
                </div>
                <span className={`text-sm font-bold font-mono ${
                  holdAnalysis.yearsToPayOff <= 15 ? 'text-green-400' :
                  holdAnalysis.yearsToPayOff <= 20 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {holdAnalysis.yearsToPayOff.toFixed(1)}y
                </span>
              </div>
            </div>
            
            {/* Airbnb (if enabled) */}
            {holdAnalysis.airbnbYearsToPayOff && holdAnalysis.airbnbYearsToPayOff < 999 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Airbnb</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-[#2a3142] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        holdAnalysis.airbnbYearsToPayOff <= 12 ? 'bg-green-400' :
                        holdAnalysis.airbnbYearsToPayOff <= 18 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${Math.min(100, (12 / holdAnalysis.airbnbYearsToPayOff) * 100)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold font-mono ${
                    holdAnalysis.airbnbYearsToPayOff <= 12 ? 'text-green-400' :
                    holdAnalysis.airbnbYearsToPayOff <= 18 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {holdAnalysis.airbnbYearsToPayOff.toFixed(1)}y
                  </span>
                </div>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-600 mt-2 text-center">{t('basedOnNetRentalIncome')}</p>
        </div>
      )}
    </div>
  );
};
