import { OIInputs, OIHoldAnalysis } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingUp, Calendar, CreditCard, Home, Banknote } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";

interface InvestmentSnapshotProps {
  inputs: OIInputs;
  currency: Currency;
  totalMonths: number;
  totalEntryCosts: number;
  rate: number;
  holdAnalysis?: OIHoldAnalysis;
  unitSizeSqf?: number;
}

export const InvestmentSnapshot = ({ inputs, currency, totalMonths, totalEntryCosts, rate, unitSizeSqf = 0 }: InvestmentSnapshotProps) => {
  const { t } = useLanguage();
  
  // Calculate price per sqft
  const pricePerSqft = unitSizeSqf > 0 ? inputs.basePrice / unitSizeSqf : 0;
  
  const { basePrice, downpaymentPercent, preHandoverPercent, additionalPayments, bookingMonth, bookingYear, handoverQuarter, handoverYear, oqoodFee } = inputs;
  
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
            <InfoTooltip translationKey="tooltipBasePrice" />
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-white font-mono">{formatCurrency(basePrice, currency, rate)}</span>
            {pricePerSqft > 0 && (
              <p className="text-xs text-gray-400 font-mono">
                {formatCurrency(pricePerSqft, currency, rate)}/sqft
              </p>
            )}
          </div>
        </div>

        {/* Payment Plan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">{t('paymentPlan')}</span>
            <InfoTooltip translationKey="tooltipPaymentPlan" />
          </div>
          <span className="text-sm font-bold text-[#CCFF00] font-mono">{preHandoverPercent}/{handoverPercent}</span>
        </div>

        {/* Construction Period */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">{t('constructionPeriod')}</span>
            <InfoTooltip translationKey="tooltipConstructionPeriod" />
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
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">{t('totalEntryCosts')}</span>
            <InfoTooltip translationKey="tooltipEntryCosts" />
          </div>
          <span className="text-xs text-red-400 font-mono">-{formatCurrency(totalEntryCosts, currency, rate)}</span>
        </div>

        {/* Timeline */}
        <div className="pt-2 text-xs text-gray-400 text-center">
          {monthNames[bookingMonth - 1]} {bookingYear} → Q{handoverQuarter} {handoverYear}
        </div>
      </div>
    </div>
  );
};
