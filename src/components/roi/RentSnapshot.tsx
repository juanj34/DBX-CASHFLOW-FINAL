import { OIInputs, OIHoldAnalysis } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Home, Building, Percent, DollarSign, Calendar, Target, Minus, Equal } from "lucide-react";
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
    rentalYieldPercent, 
    serviceChargePerSqft = 18,
    unitSizeSqf = 0,
    showAirbnbComparison,
    shortTermRental
  } = inputs;

  // Use property value at handover (1 month after) for rent calculation
  const propertyValueAtHandover = holdAnalysis?.propertyValueAtHandover || inputs.basePrice;
  
  // Long-Term calculations based on property value at handover
  const grossAnnualRent = propertyValueAtHandover * (rentalYieldPercent / 100);
  const annualServiceCharges = unitSizeSqf * serviceChargePerSqft;
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const netYieldPercent = propertyValueAtHandover > 0 ? (netAnnualRent / propertyValueAtHandover) * 100 : 0;

  // Airbnb calculations (if enabled)
  const adrValue = shortTermRental?.averageDailyRate || 800;
  const occupancyPercent = shortTermRental?.occupancyPercent || 70;
  const operatingExpensePercent = shortTermRental?.operatingExpensePercent || 25;
  const managementFeePercent = shortTermRental?.managementFeePercent || 15;

  const grossAirbnbAnnual = adrValue * 365 * (occupancyPercent / 100);
  const totalExpensePercent = operatingExpensePercent + managementFeePercent;
  const airbnbOperatingExpenses = grossAirbnbAnnual * (totalExpensePercent / 100);
  const netAirbnbAnnual = grossAirbnbAnnual - airbnbOperatingExpenses - annualServiceCharges;

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
          <div>
            <h3 className="font-semibold text-white">{t('rentSnapshot')}</h3>
            <p className="text-[10px] text-gray-500">Based on property value at handover</p>
          </div>
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

      {/* Long-Term Rental Section - Clear Breakdown */}
      <div className="p-4 space-y-3 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <Building className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-medium text-white">{t('longTermRental')}</h4>
        </div>

        {/* Gross Annual Rent */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-sm text-gray-400">Gross Annual Rent</span>
          </div>
          <span className="text-sm font-bold text-white font-mono">{formatCurrency(grossAnnualRent, currency, rate)}</span>
        </div>

        {/* Service Charges (subtracted) */}
        {unitSizeSqf > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Minus className="w-3.5 h-3.5 text-red-400" />
              <span className="text-sm text-gray-400">{t('serviceCharges')}</span>
            </div>
            <span className="text-sm font-bold text-red-400 font-mono">-{formatCurrency(annualServiceCharges, currency, rate)}</span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-[#2a3142] pt-2"></div>

        {/* Net Annual Rent */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Equal className="w-3.5 h-3.5 text-[#CCFF00]" />
            <span className="text-sm text-gray-300 font-medium">{t('netAnnualRent')}</span>
          </div>
          <span className="text-sm font-bold text-[#CCFF00] font-mono">{formatCurrency(netAnnualRent, currency, rate)}</span>
        </div>

        {/* Yield Summary */}
        <div className="bg-[#0d1117] rounded-lg p-3 mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm text-gray-400">Gross Yield</span>
            </div>
            <span className="text-sm font-bold text-white font-mono">{rentalYieldPercent.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-sm text-gray-400">Net Yield (after charges)</span>
            </div>
            <span className="text-sm font-bold text-cyan-400 font-mono">{netYieldPercent.toFixed(1)}%</span>
          </div>
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

          {/* Operating Expenses */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Minus className="w-3.5 h-3.5 text-red-400" />
              <span className="text-sm text-gray-400">{t('operatingExpenses')} ({operatingExpensePercent}%)</span>
            </div>
            <span className="text-sm font-bold text-red-400 font-mono">-{formatCurrency(grossAirbnbAnnual * (operatingExpensePercent / 100), currency, rate)}</span>
          </div>

          {/* Management Fee */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Minus className="w-3.5 h-3.5 text-red-400" />
              <span className="text-sm text-gray-400">{t('managementFee')} ({managementFeePercent}%)</span>
            </div>
            <span className="text-sm font-bold text-red-400 font-mono">-{formatCurrency(grossAirbnbAnnual * (managementFeePercent / 100), currency, rate)}</span>
          </div>

          {/* Service Charges */}
          {unitSizeSqf > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minus className="w-3.5 h-3.5 text-red-400" />
                <span className="text-sm text-gray-400">{t('serviceCharges')}</span>
              </div>
              <span className="text-sm font-bold text-red-400 font-mono">-{formatCurrency(annualServiceCharges, currency, rate)}</span>
            </div>
          )}

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

      {/* Years to Pay Off Section */}
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