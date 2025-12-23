import { Building2, AlertTriangle, TrendingUp, Shield, CreditCard, Calculator, Home, CheckCircle, AlertCircle, Building } from "lucide-react";
import { MortgageAnalysis, MortgageInputs } from "./useMortgageCalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";

interface MortgageBreakdownProps {
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  basePrice: number;
  currency: Currency;
  rate: number;
  preHandoverPercent?: number;
  // Rent comparison props
  monthlyLongTermRent?: number;
  monthlyServiceCharges?: number;
  monthlyAirbnbNet?: number;
  showAirbnbComparison?: boolean;
}

export const MortgageBreakdown = ({
  mortgageInputs,
  mortgageAnalysis,
  basePrice,
  currency,
  rate,
  preHandoverPercent = 30,
  monthlyLongTermRent,
  monthlyServiceCharges,
  monthlyAirbnbNet,
  showAirbnbComparison,
}: MortgageBreakdownProps) => {
  const { t } = useLanguage();

  if (!mortgageInputs.enabled) return null;

  const {
    hasGap,
    gapPercent,
    gapAmount,
    equityRequiredPercent,
    loanAmount,
    monthlyPayment,
    totalLoanPayments,
    processingFee,
    valuationFee,
    mortgageRegistration,
    totalUpfrontFees,
    annualLifeInsurance,
    annualPropertyInsurance,
    totalAnnualInsurance,
    totalInsuranceOverTerm,
    totalInterestAndFees,
  } = mortgageAnalysis;

  const preHandoverAmount = basePrice * preHandoverPercent / 100;
  const totalBeforeHandover = basePrice * equityRequiredPercent / 100;

  // Calculate rent vs mortgage coverage
  const netMonthlyRent = (monthlyLongTermRent || 0) - (monthlyServiceCharges || 0);
  const monthlyMortgageTotal = monthlyPayment + totalAnnualInsurance / 12;
  const monthlyCashflow = netMonthlyRent - monthlyMortgageTotal;
  const isCovered = monthlyCashflow >= 0;

  // Airbnb cashflow
  const airbnbCashflow = (monthlyAirbnbNet || 0) - monthlyMortgageTotal;
  const isAirbnbCovered = airbnbCashflow >= 0;

  // Grand total calculation: gap + total loan payments + fees + insurance
  const grandTotal = gapAmount + totalLoanPayments + totalUpfrontFees + totalInsuranceOverTerm;

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Building2 className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{t('mortgageBreakdown')}</h3>
          <p className="text-xs text-gray-400">{mortgageInputs.financingPercent}% {t('financing')} · {mortgageInputs.loanTermYears} {t('years')} · {mortgageInputs.interestRate}%</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Enhanced Gap Alert with Timeline */}
        {hasGap && (
          <div className="p-4 bg-amber-900/30 border border-amber-700/50 rounded-xl">
            <div className="flex items-start gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-amber-400 font-semibold">{t('gapPaymentRequired')}</h4>
                <p className="text-sm text-gray-400">{t('gapPaymentDesc')}</p>
              </div>
            </div>
            
            {/* Payment Timeline Visual */}
            <div className="space-y-3 mt-4 pl-2 border-l-2 border-amber-500/50">
              <div className="flex justify-between items-center pl-4 relative">
                <div className="absolute -left-[9px] w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-300">{t('preHandoverPayments')}</span>
                <span className="text-sm font-mono text-green-400">
                  {formatCurrency(preHandoverAmount, currency, rate)} ({preHandoverPercent}%)
                </span>
              </div>
              
              <div className="flex justify-between items-center pl-4 relative">
                <div className="absolute -left-[9px] w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-gray-300 font-medium">{t('gapPaymentBeforeHandover')}</span>
                <span className="text-sm font-mono text-amber-400 font-bold">
                  {formatCurrency(gapAmount, currency, rate)} ({gapPercent.toFixed(1)}%)
                </span>
              </div>
              
              <div className="flex justify-between items-center pl-4 relative">
                <div className="absolute -left-[9px] w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-300">{t('mortgageAtHandover')}</span>
                <span className="text-sm font-mono text-blue-400">
                  {formatCurrency(loanAmount, currency, rate)} ({mortgageInputs.financingPercent}%)
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-amber-700/30 flex justify-between">
              <span className="text-sm text-gray-400">{t('totalBeforeHandover')}</span>
              <span className="text-sm font-mono text-white font-bold">
                {formatCurrency(totalBeforeHandover, currency, rate)} ({equityRequiredPercent}%)
              </span>
            </div>
          </div>
        )}

        {/* Loan Summary - Updated: added gap, removed equity/total interest */}
        <div className="p-3 bg-[#0f172a] rounded-xl border border-[#2a3142]">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-[#CCFF00]" />
            <span className="text-sm font-medium text-gray-300">{t('loanSummary')}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Gap Payment - only if exists */}
            {hasGap && (
              <div>
                <p className="text-xs text-gray-500">{t('gapPayment')}</p>
                <p className="text-sm font-mono text-amber-400">{formatCurrency(gapAmount, currency, rate)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">{t('loanAmount')}</p>
              <p className="text-sm font-mono text-white">{formatCurrency(loanAmount, currency, rate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('monthlyPayment')}</p>
              <p className="text-sm font-mono text-[#CCFF00]">{formatCurrency(monthlyPayment, currency, rate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('loanTerm')}</p>
              <p className="text-sm font-mono text-white">{mortgageInputs.loanTermYears} {t('years')}</p>
            </div>
          </div>
        </div>

        {/* Fees & Insurance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Fees */}
          <div className="p-3 bg-[#0f172a] rounded-xl border border-[#2a3142]">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">{t('upfrontFees')}</span>
            </div>
            <div className="space-y-2 text-xs">
              {hasGap && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('gapPayment')}</span>
                  <span className="text-amber-400 font-mono">{formatCurrency(gapAmount, currency, rate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">{t('processingFee')} ({mortgageInputs.processingFeePercent}%)</span>
                <span className="text-white font-mono">{formatCurrency(processingFee, currency, rate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('valuationFee')}</span>
                <span className="text-white font-mono">{formatCurrency(valuationFee, currency, rate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('mortgageRegistration')} ({mortgageInputs.mortgageRegistrationPercent}%)</span>
                <span className="text-white font-mono">{formatCurrency(mortgageRegistration, currency, rate)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#2a3142]">
                <span className="text-gray-400 font-medium">{t('total')}</span>
                <span className="text-purple-400 font-mono font-medium">{formatCurrency(totalUpfrontFees + gapAmount, currency, rate)}</span>
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="p-3 bg-[#0f172a] rounded-xl border border-[#2a3142]">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-gray-300">{t('insurance')}</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('lifeInsurance')} ({mortgageInputs.lifeInsurancePercent}%)</span>
                <span className="text-white font-mono">{formatCurrency(annualLifeInsurance, currency, rate)}/{t('yr')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('propertyInsurance')}</span>
                <span className="text-white font-mono">{formatCurrency(annualPropertyInsurance, currency, rate)}/{t('yr')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('totalAnnual')}</span>
                <span className="text-white font-mono">{formatCurrency(totalAnnualInsurance, currency, rate)}/{t('yr')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#2a3142]">
                <span className="text-gray-400 font-medium">{t('overTerm')} ({mortgageInputs.loanTermYears}y)</span>
                <span className="text-green-400 font-mono font-medium">{formatCurrency(totalInsuranceOverTerm, currency, rate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rent vs Mortgage Coverage - Side-by-Side Comparison */}
        {monthlyLongTermRent !== undefined && monthlyLongTermRent > 0 && (
          <div className="space-y-3">
            {/* Header with mortgage payment - shared for both */}
            <div className="flex justify-between items-center text-xs p-3 bg-[#0f172a] rounded-lg border border-[#2a3142]">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300 font-medium">{t('rentVsMortgage')}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 text-[10px] block">{t('monthlyMortgageTotal')}</span>
                <span className="text-purple-400 font-mono font-bold">
                  -{formatCurrency(monthlyMortgageTotal, currency, rate)}
                </span>
              </div>
            </div>

            {/* Two columns comparison */}
            <div className={`grid gap-3 ${showAirbnbComparison && monthlyAirbnbNet !== undefined && monthlyAirbnbNet > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* Long-Term Rental Column */}
              <div className="p-3 bg-[#0f172a] rounded-xl border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Home className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">{t('longTerm')}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('monthlyRent')}</span>
                    <span className="text-white font-mono">{formatCurrency(monthlyLongTermRent, currency, rate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">- {t('serviceCharges')}</span>
                    <span className="text-white font-mono">-{formatCurrency(monthlyServiceCharges || 0, currency, rate)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#2a3142]">
                    <span className="text-gray-400">{t('netMonthlyRent')}</span>
                    <span className="text-emerald-400 font-mono">{formatCurrency(netMonthlyRent, currency, rate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">- {t('mortgage')}</span>
                    <span className="text-purple-400 font-mono">-{formatCurrency(monthlyMortgageTotal, currency, rate)}</span>
                  </div>
                  {/* Cashflow result */}
                  <div className={`flex justify-between items-center pt-2 mt-2 border-t border-[#2a3142] ${isCovered ? 'text-emerald-400' : 'text-red-400'}`}>
                    <div className="flex items-center gap-1">
                      {isCovered ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span className="font-medium">{t('cashflow')}</span>
                    </div>
                    <span className="font-mono font-bold">
                      {monthlyCashflow >= 0 ? '+' : ''}{formatCurrency(monthlyCashflow, currency, rate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Airbnb Column (if enabled) */}
              {showAirbnbComparison && monthlyAirbnbNet !== undefined && monthlyAirbnbNet > 0 && (
                <div className="p-3 bg-[#0f172a] rounded-xl border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium text-orange-400">Airbnb</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('airbnbNetMonthly')}</span>
                      <span className="text-white font-mono">{formatCurrency(monthlyAirbnbNet, currency, rate)}</span>
                    </div>
                    <div className="flex justify-between opacity-50">
                      <span className="text-gray-500">- {t('serviceCharges')}</span>
                      <span className="text-gray-500 font-mono italic">{t('included')}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#2a3142]">
                      <span className="text-gray-400">{t('netMonthlyRent')}</span>
                      <span className="text-orange-400 font-mono">{formatCurrency(monthlyAirbnbNet, currency, rate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">- {t('mortgage')}</span>
                      <span className="text-purple-400 font-mono">-{formatCurrency(monthlyMortgageTotal, currency, rate)}</span>
                    </div>
                    {/* Cashflow result */}
                    <div className={`flex justify-between items-center pt-2 mt-2 border-t border-[#2a3142] ${isAirbnbCovered ? 'text-orange-400' : 'text-red-400'}`}>
                      <div className="flex items-center gap-1">
                        {isAirbnbCovered ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span className="font-medium">{t('cashflow')}</span>
                      </div>
                      <span className="font-mono font-bold">
                        {airbnbCashflow >= 0 ? '+' : ''}{formatCurrency(airbnbCashflow, currency, rate)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Total Cost Summary - Restructured */}
        <div className="p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-700/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-300">{t('totalCostSummary')}</span>
          </div>
          <div className="space-y-2">
            {/* Gap Payment (if exists) */}
            {hasGap && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">{t('gapPayment')}</span>
                <span className="text-amber-400 font-mono">{formatCurrency(gapAmount, currency, rate)}</span>
              </div>
            )}
            {/* Total Loan Payments */}
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">{t('totalLoanPayments')}</span>
              <span className="text-white font-mono">{formatCurrency(totalLoanPayments, currency, rate)}</span>
            </div>
            {/* Interest & Fees */}
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">{t('interestAndFees')}</span>
              <span className="text-red-400 font-mono">{formatCurrency(totalInterestAndFees, currency, rate)}</span>
            </div>
            {/* Grand Total */}
            <div className="flex justify-between pt-2 border-t border-blue-700/30">
              <span className="text-gray-200 font-medium">{t('grandTotal')}</span>
              <span className="text-blue-400 font-mono font-bold text-lg">{formatCurrency(grandTotal, currency, rate)}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{t('grandTotalExplanation')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
