import { OIInputs, PaymentMilestone, quarterToMonth } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { Calendar, CreditCard, Home, Clock, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { InfoTooltip } from "./InfoTooltip";

interface PaymentBreakdownProps {
  inputs: OIInputs;
  currency: Currency;
  totalMonths: number;
  rate: number;
}

// Convert booking month/year to readable date string
const monthToDateString = (month: number, year: number, language: string): string => {
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthNames = language === 'es' ? monthNamesEs : monthNamesEn;
  return `${monthNames[month - 1]} ${year}`;
};

// Estimate date from months after booking
const estimateDateFromMonths = (months: number, bookingMonth: number, bookingYear: number, language: string): string => {
  const totalMonthsFromJan = bookingMonth + months;
  const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
  const month = ((totalMonthsFromJan - 1) % 12) + 1;
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthNames = language === 'es' ? monthNamesEs : monthNamesEn;
  return `${monthNames[month - 1]} ${bookingYear + yearOffset}`;
};

// DLD Fee is always 4%
const DLD_FEE_PERCENT = 4;

export const PaymentBreakdown = ({ inputs, currency, totalMonths, rate }: PaymentBreakdownProps) => {
  const { t, language } = useLanguage();
  const { basePrice, downpaymentPercent, additionalPayments, preHandoverPercent, oqoodFee, eoiFee, bookingMonth, bookingYear, handoverQuarter, handoverYear } = inputs;

  // Calculate amounts
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const eoiFeeActual = Math.min(eoiFee, downpaymentAmount); // EOI can't exceed downpayment
  const restOfDownpayment = downpaymentAmount - eoiFeeActual;
  const dldFeeAmount = basePrice * DLD_FEE_PERCENT / 100;
  const handoverPercent = 100 - preHandoverPercent;
  const handoverAmount = basePrice * handoverPercent / 100;

  // Calculate additional payments total
  const additionalTotal = additionalPayments.reduce((sum, m) => sum + (basePrice * m.paymentPercent / 100), 0);
  
  // Calculate pre-handover totals
  const todayTotal = downpaymentAmount + dldFeeAmount + oqoodFee;
  const totalPreHandover = todayTotal + additionalTotal;
  
  // Sort additional payments by trigger
  const sortedAdditionalPayments = [...additionalPayments].sort((a, b) => {
    // Time-based come before construction-based at same effective time
    if (a.type === 'time' && b.type === 'time') return a.triggerValue - b.triggerValue;
    if (a.type === 'construction' && b.type === 'construction') return a.triggerValue - b.triggerValue;
    // Convert to comparable time
    const aMonths = a.type === 'time' ? a.triggerValue : (a.triggerValue / 100) * totalMonths;
    const bMonths = b.type === 'time' ? b.triggerValue : (b.triggerValue / 100) * totalMonths;
    return aMonths - bMonths;
  });

  // Calculate totals
  const totalPropertyPayments = basePrice;
  const totalEntryCosts = dldFeeAmount + oqoodFee;
  const grandTotal = totalPropertyPayments + totalEntryCosts;

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-[#2a3142] flex items-center gap-2">
        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[#CCFF00]" />
        <div>
          <h3 className="font-semibold text-white text-sm sm:text-base">{t('paymentBreakdownTitle')}</h3>
          <p className="text-[10px] sm:text-xs text-gray-400">{preHandoverPercent}/{handoverPercent} {t('paymentStructure')}</p>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Base Price */}
        <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-[#2a3142]">
          <span className="text-xs sm:text-sm text-gray-400">{t('basePropertyPrice')}</span>
          <span className="text-sm sm:text-lg font-bold text-white font-mono">{formatCurrency(basePrice, currency, rate)}</span>
        </div>

        {/* Section: At Booking */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[#CCFF00]">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">{t('atBooking')} ({monthToDateString(bookingMonth, bookingYear, language)})</span>
          </div>
          
          <div className="pl-4 sm:pl-6 space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm text-gray-300">{t('eoiBookingFee')}</span>
                <InfoTooltip translationKey="tooltipEoiFee" />
              </div>
              <span className="text-xs sm:text-sm text-white font-mono">{formatCurrency(eoiFeeActual, currency, rate)}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm text-gray-300">{t('restOfDownpayment')} ({downpaymentPercent}% - EOI)</span>
                <InfoTooltip translationKey="tooltipDownpayment" />
              </div>
              <span className="text-xs sm:text-sm text-white font-mono">{formatCurrency(restOfDownpayment, currency, rate)}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm text-gray-300">{t('dldFeePercent')}</span>
                <InfoTooltip translationKey="tooltipDldFee" />
              </div>
              <span className="text-xs sm:text-sm text-white font-mono">{formatCurrency(dldFeeAmount, currency, rate)}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm text-gray-300">{t('oqoodFee')}</span>
                <InfoTooltip translationKey="tooltipOqoodFee" />
              </div>
              <span className="text-xs sm:text-sm text-white font-mono">{formatCurrency(oqoodFee, currency, rate)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#2a3142]/50">
              <span className="text-xs sm:text-sm font-medium text-[#CCFF00]">{t('totalToday')}</span>
              <span className="text-xs sm:text-sm font-bold text-[#CCFF00] font-mono">{formatCurrency(todayTotal, currency, rate)}</span>
            </div>
          </div>
        </div>

        {/* Section: During Construction */}
        {sortedAdditionalPayments.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">{t('duringConstruction')}</span>
            </div>
            
            <div className="pl-4 sm:pl-6 space-y-2 sm:space-y-3">
              {sortedAdditionalPayments.map((payment, index) => {
                const amount = basePrice * payment.paymentPercent / 100;
                const isTimeBased = payment.type === 'time';
                // Compact label for mobile
                const triggerLabel = isTimeBased
                  ? `M${payment.triggerValue}`
                  : `${payment.triggerValue}%`;
                const triggerLabelFull = isTimeBased
                  ? `${t('monthLabel')} ${payment.triggerValue}`
                  : `${payment.triggerValue}% ${t('constructionPercent')}`;
                
                // Only show date for time-based payments
                const dateStr = isTimeBased 
                  ? estimateDateFromMonths(payment.triggerValue, bookingMonth, bookingYear, language)
                  : null;
                
                return (
                  <div key={payment.id} className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {isTimeBased ? (
                        <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      ) : (
                        <Building2 className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      )}
                      <span className="text-xs sm:text-sm text-gray-300">
                        {payment.paymentPercent}% @ <span className="sm:hidden">{triggerLabel}</span><span className="hidden sm:inline">{triggerLabelFull}</span>
                      </span>
                      {dateStr && (
                        <span className="text-[10px] sm:text-xs text-gray-500">({dateStr})</span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm text-white font-mono pl-4 sm:pl-0">{formatCurrency(amount, currency, rate)}</span>
                  </div>
                );
              })}
              {additionalTotal > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-[#2a3142]/50">
                  <span className="text-xs sm:text-sm text-gray-400">{t('subtotalInstallments')}</span>
                  <span className="text-xs sm:text-sm text-gray-300 font-mono">{formatCurrency(additionalTotal, currency, rate)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pre-Handover Summary */}
        <div className="bg-[#CCFF00]/10 border border-[#CCFF00]/30 rounded-xl p-3 sm:p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-gray-300">{t('totalToday')}</span>
            <span className="text-xs sm:text-sm text-white font-mono">{formatCurrency(todayTotal, currency, rate)}</span>
          </div>
          {additionalTotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-300">{t('plusInstallments')}</span>
              <span className="text-xs sm:text-sm text-white font-mono">{formatCurrency(additionalTotal, currency, rate)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-[#CCFF00]/30">
            <span className="text-xs sm:text-sm font-bold text-[#CCFF00]">{t('totalPreHandover')} ({preHandoverPercent}%)</span>
            <span className="text-sm sm:text-base font-bold text-[#CCFF00] font-mono">{formatCurrency(totalPreHandover, currency, rate)}</span>
          </div>
        </div>

        {/* Section: At Handover */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-cyan-400">
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">{t('atHandoverLabel')} (Q{handoverQuarter} {handoverYear})</span>
          </div>
          
          <div className="pl-4 sm:pl-6 space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm text-gray-300">{t('finalPayment')} ({handoverPercent}%)</span>
                <InfoTooltip translationKey="tooltipFinalPayment" />
              </div>
              <span className="text-xs sm:text-sm text-white font-mono">{formatCurrency(handoverAmount, currency, rate)}</span>
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#2a3142] space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-gray-400">{t('propertyPayments')}</span>
            <span className="text-xs sm:text-sm text-white font-mono">{formatCurrency(totalPropertyPayments, currency, rate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-gray-400">{t('entryCostsDldOqood')}</span>
            <span className="text-xs sm:text-sm text-white font-mono">{formatCurrency(totalEntryCosts, currency, rate)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[#CCFF00]/30 bg-[#CCFF00]/5 -mx-3 sm:-mx-4 px-3 sm:px-4 py-2">
            <span className="text-xs sm:text-sm font-bold text-[#CCFF00]">{t('totalToDisburse')}</span>
            <span className="text-sm sm:text-lg font-bold text-[#CCFF00] font-mono">{formatCurrency(grandTotal, currency, rate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
