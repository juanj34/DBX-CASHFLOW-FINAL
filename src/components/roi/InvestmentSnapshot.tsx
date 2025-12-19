import { OIInputs, OIHoldAnalysis } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingUp, Calendar, CreditCard, Home, Target, Banknote } from "lucide-react";

interface InvestmentSnapshotProps {
  inputs: OIInputs;
  currency: Currency;
  totalMonths: number;
  totalEntryCosts: number;
  rate: number;
  holdAnalysis?: OIHoldAnalysis;
}

export const InvestmentSnapshot = ({ inputs, currency, totalMonths, totalEntryCosts, rate, holdAnalysis }: InvestmentSnapshotProps) => {
  const { t } = useLanguage();
  
  const { basePrice, downpaymentPercent, preHandoverPercent, additionalPayments, bookingMonth, bookingYear, handoverQuarter, handoverYear, oqoodFee, eoiFee } = inputs;
  
  // DLD is 4%
  const dldFee = basePrice * 0.04;
  
  // Calculate amounts
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const amountUntilSPA = downpaymentAmount + dldFee + oqoodFee; // What's paid at booking
  
  // Additional payments during construction
  const additionalTotal = additionalPayments.reduce((sum, p) => sum + (basePrice * p.paymentPercent / 100), 0);
  
  // Handover amount
  const handoverPercent = 100 - preHandoverPercent;
  const handoverAmount = basePrice * handoverPercent / 100;
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden h-fit">
      <div className="p-4 border-b border-[#2a3142] flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-[#CCFF00]" />
        <h3 className="font-semibold text-white">{t('investmentSnapshot')}</h3>
      </div>

      <div className="p-4 space-y-3">
        {/* Property Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">{t('basePropertyPrice')}</span>
          </div>
          <span className="text-sm font-bold text-white font-mono">{formatCurrency(basePrice, currency, rate)}</span>
        </div>

        {/* Payment Plan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">{t('paymentPlan')}</span>
          </div>
          <span className="text-sm font-bold text-[#CCFF00] font-mono">{preHandoverPercent}/{handoverPercent}</span>
        </div>

        {/* Construction Period */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">{t('constructionPeriod')}</span>
          </div>
          <span className="text-sm font-bold text-white font-mono">{totalMonths} {t('months')}</span>
        </div>

        <div className="border-t border-[#2a3142] my-2" />

        {/* Amount Until SPA (at booking) */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{t('amountUntilSPA')}</span>
          <span className="text-sm font-bold text-[#CCFF00] font-mono">{formatCurrency(amountUntilSPA, currency, rate)}</span>
        </div>

        {/* Amount During Construction */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{t('amountDuringConstruction')}</span>
          <span className="text-sm font-bold text-white font-mono">{formatCurrency(additionalTotal, currency, rate)}</span>
        </div>

        {/* Amount at Handover */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-400">{t('amountAtHandover')}</span>
          </div>
          <span className="text-sm font-bold text-cyan-400 font-mono">{formatCurrency(handoverAmount, currency, rate)}</span>
        </div>

        <div className="border-t border-[#2a3142] my-2" />

        {/* Total Entry Costs */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{t('totalEntryCosts')}</span>
          <span className="text-xs text-red-400 font-mono">-{formatCurrency(totalEntryCosts, currency, rate)}</span>
        </div>

        {/* Timeline */}
        <div className="pt-2 text-xs text-gray-500 text-center">
          {monthNames[bookingMonth - 1]} {bookingYear} → Q{handoverQuarter} {handoverYear}
        </div>

        {/* Years to Pay Off Section */}
        {holdAnalysis && holdAnalysis.yearsToPayOff < 999 && (
          <div className="pt-3 mt-3 border-t border-[#2a3142]">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-[#CCFF00]" />
              <span className="text-sm font-medium text-white">{t('yearsToPayOff')}</span>
            </div>
            <div className="space-y-2">
              {/* Long-Term Rental */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{t('longTermRental')}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-[#2a3142] rounded-full overflow-hidden">
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
                    <div className="w-16 h-1.5 bg-[#2a3142] rounded-full overflow-hidden">
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
    </div>
  );
};