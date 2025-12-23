import { Building2, AlertTriangle, TrendingUp, Shield, CreditCard, Calculator } from "lucide-react";
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
}

export const MortgageBreakdown = ({
  mortgageInputs,
  mortgageAnalysis,
  basePrice,
  currency,
  rate,
  preHandoverPercent = 30,
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
    totalInterest,
    totalLoanPayments,
    processingFee,
    valuationFee,
    mortgageRegistration,
    totalUpfrontFees,
    annualLifeInsurance,
    annualPropertyInsurance,
    totalAnnualInsurance,
    totalInsuranceOverTerm,
    totalCostWithMortgage,
    totalInterestAndFees,
  } = mortgageAnalysis;

  const preHandoverAmount = basePrice * preHandoverPercent / 100;
  const totalBeforeHandover = basePrice * equityRequiredPercent / 100;

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

        {/* Loan Summary */}
        <div className="p-3 bg-[#0f172a] rounded-xl border border-[#2a3142]">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-[#CCFF00]" />
            <span className="text-sm font-medium text-gray-300">{t('loanSummary')}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">{t('loanAmount')}</p>
              <p className="text-sm font-mono text-white">{formatCurrency(loanAmount, currency, rate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('monthlyPayment')}</p>
              <p className="text-sm font-mono text-[#CCFF00]">{formatCurrency(monthlyPayment, currency, rate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('equityRequired')}</p>
              <p className="text-sm font-mono text-white">{equityRequiredPercent}% ({formatCurrency(basePrice * equityRequiredPercent / 100, currency, rate)})</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('totalInterest')}</p>
              <p className="text-sm font-mono text-red-400">{formatCurrency(totalInterest, currency, rate)}</p>
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
                <span className="text-purple-400 font-mono font-medium">{formatCurrency(totalUpfrontFees, currency, rate)}</span>
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

        {/* Total Cost Summary */}
        <div className="p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-700/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-300">{t('totalCostSummary')}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">{t('totalLoanPayments')}</span>
              <span className="text-white font-mono">{formatCurrency(totalLoanPayments, currency, rate)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">{t('totalInterestAndFees')}</span>
              <span className="text-red-400 font-mono">{formatCurrency(totalInterestAndFees, currency, rate)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-blue-700/30">
              <span className="text-gray-200 font-medium">{t('grandTotal')}</span>
              <span className="text-blue-400 font-mono font-bold text-lg">{formatCurrency(totalCostWithMortgage, currency, rate)}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{t('grandTotalExplanation')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
