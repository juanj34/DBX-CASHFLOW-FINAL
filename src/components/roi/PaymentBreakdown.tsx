import { OIInputs, PaymentMilestone, quarterToMonth } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { Calendar, CreditCard, Home, Clock, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { InfoTooltip } from "./InfoTooltip";
import { ClientUnitData } from "./ClientUnitInfo";
import { useState } from "react";
import { PaymentSummaryCards } from "./PaymentSummaryCards";
import { PaymentVisualBar } from "./PaymentVisualBar";
import { ClientSplitCards } from "./ClientSplitCards";
import { ClientPaymentSheet } from "./ClientPaymentSheet";

interface PaymentBreakdownProps {
  inputs: OIInputs;
  currency: Currency;
  totalMonths: number;
  rate: number;
  unitSizeSqf?: number;
  clientInfo?: ClientUnitData;
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

export const PaymentBreakdown = ({ inputs, currency, totalMonths, rate, unitSizeSqf = 0, clientInfo }: PaymentBreakdownProps) => {
  const { t, language } = useLanguage();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
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

  // Calculate avg monthly during construction
  const bookingDate = new Date(bookingYear, bookingMonth - 1, 1);
  const handoverMonth = (handoverQuarter - 1) * 3 + 1;
  const handoverDate = new Date(handoverYear, handoverMonth, 1);
  const constructionMonths = Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const avgMonthlyPayment = additionalTotal > 0 && constructionMonths > 0 
    ? additionalTotal / constructionMonths 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-theme-accent" />
        <div>
          <h3 className="font-semibold text-theme-text text-base">{t('capitalInjectionPlan') || 'Capital Injection Plan'}</h3>
          <p className="text-xs text-theme-text-muted">{t('paymentBreakdownSubtitle') || 'Complete payment schedule and milestones'}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <PaymentSummaryCards 
        inputs={inputs} 
        currency={currency} 
        rate={rate} 
        totalMonths={totalMonths} 
      />

      {/* Visual Bar */}
      <PaymentVisualBar 
        inputs={inputs} 
        currency={currency} 
        rate={rate} 
      />

      {/* Detailed Breakdown Card */}
      <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden">
        <div className="p-4 space-y-4">
          {/* Asset Value */}
          <div className="flex justify-between items-center pb-3 border-b border-theme-border">
            <span className="text-sm text-theme-text-muted">{t('assetValue') || 'Asset Value'}</span>
            <div className="text-right">
              <span className="text-lg font-bold text-theme-text font-mono">{formatCurrency(basePrice, currency, rate)}</span>
              {unitSizeSqf > 0 && (
                <p className="text-xs text-theme-text-muted font-mono">
                  {formatCurrency(basePrice / unitSizeSqf, currency, rate)}/sqft
                </p>
              )}
            </div>
          </div>

          {/* Section: THE ENTRY */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-theme-accent/20 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-theme-accent" />
              </div>
              <span className="text-sm font-semibold text-theme-accent uppercase tracking-wide">
                {t('theEntryLabel') || 'The Entry'}
              </span>
              <span className="text-xs text-theme-text-muted">
                ({monthToDateString(bookingMonth, bookingYear, language)})
              </span>
            </div>
            
            <div className="bg-theme-accent/5 border border-theme-accent/20 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span className="text-sm text-theme-text-muted truncate">{t('eoiBookingFee')}</span>
                  <InfoTooltip translationKey="tooltipEoiFee" />
                </div>
                <span className="text-sm text-theme-text font-mono flex-shrink-0">{formatCurrency(eoiFeeActual, currency, rate)}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span className="text-sm text-theme-text-muted truncate">{t('restOfDownpayment')} ({downpaymentPercent}% - EOI)</span>
                  <InfoTooltip translationKey="tooltipDownpayment" />
                </div>
                <span className="text-sm text-theme-text font-mono flex-shrink-0">{formatCurrency(restOfDownpayment, currency, rate)}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span className="text-sm text-theme-text-muted truncate">{t('govRegistrationDld') || 'Gov. Registration (DLD)'}</span>
                  <InfoTooltip translationKey="tooltipDldFee" />
                </div>
                <span className="text-sm text-theme-text font-mono flex-shrink-0">{formatCurrency(dldFeeAmount, currency, rate)}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span className="text-sm text-theme-text-muted truncate">{t('oqoodFee')}</span>
                  <InfoTooltip translationKey="tooltipOqoodFee" />
                </div>
                <span className="text-sm text-theme-text font-mono flex-shrink-0">{formatCurrency(oqoodFee, currency, rate)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-theme-accent/30">
                <span className="text-sm font-semibold text-theme-accent">{t('initialCashRequired') || 'Initial Cash Required'}</span>
                <span className="text-base font-bold text-theme-accent font-mono">{formatCurrency(todayTotal, currency, rate)}</span>
              </div>
            </div>
          </div>

          {/* Section: THE JOURNEY */}
          {sortedAdditionalPayments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-500/20 flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                  {t('theJourneyLabel') || 'The Journey'}
                </span>
                <span className="text-xs text-theme-text-muted">
                  ({constructionMonths} {t('months') || 'months'})
                </span>
              </div>
              
              <div className="bg-slate-500/5 border border-slate-500/20 rounded-xl p-4 space-y-2">
                {sortedAdditionalPayments.map((payment, index) => {
                  const amount = basePrice * payment.paymentPercent / 100;
                  const isTimeBased = payment.type === 'time';
                  const triggerLabel = isTimeBased
                    ? `${t('constructionMilestone') || 'Milestone'} ${payment.triggerValue}`
                    : `${payment.triggerValue}% ${t('constructionPercent')}`;
                  
                  const dateStr = isTimeBased 
                    ? estimateDateFromMonths(payment.triggerValue, bookingMonth, bookingYear, language)
                    : null;
                  
                  return (
                    <div key={payment.id} className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isTimeBased ? (
                          <Clock className="w-3 h-3 text-theme-text-muted flex-shrink-0" />
                        ) : (
                          <Building2 className="w-3 h-3 text-theme-text-muted flex-shrink-0" />
                        )}
                        <span className="text-sm text-theme-text-muted truncate">
                          {payment.paymentPercent}% @ {triggerLabel}
                        </span>
                        {dateStr && (
                          <span className="text-xs text-theme-text-muted flex-shrink-0">({dateStr})</span>
                        )}
                      </div>
                      <span className="text-sm text-theme-text font-mono flex-shrink-0">{formatCurrency(amount, currency, rate)}</span>
                    </div>
                  );
                })}
                {additionalTotal > 0 && (
                  <>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-500/30">
                      <span className="text-sm text-slate-400">{t('subtotalInstallments')}</span>
                      <span className="text-sm text-slate-300 font-mono">{formatCurrency(additionalTotal, currency, rate)}</span>
                    </div>
                    {avgMonthlyPayment > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-theme-text-muted">{t('avgMonthlyPayment') || 'Avg. monthly'}</span>
                        <span className="text-theme-text-muted font-mono">~{formatCurrency(avgMonthlyPayment, currency, rate)}/mo</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Pre-Handover Summary */}
          <div className="bg-theme-accent/10 border border-theme-accent/30 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-theme-accent">{t('totalPreHandover')} ({preHandoverPercent}%)</span>
              <span className="text-lg font-bold text-theme-accent font-mono">{formatCurrency(totalPreHandover, currency, rate)}</span>
            </div>
          </div>

          {/* Section: COMPLETION */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Home className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">
                {t('completionSettlement') || 'Completion Settlement'}
              </span>
              <span className="text-xs text-theme-text-muted">
                (Q{handoverQuarter} {handoverYear})
              </span>
            </div>
            
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span className="text-sm text-theme-text-muted truncate">{t('finalPayment')} ({handoverPercent}%)</span>
                  <InfoTooltip translationKey="tooltipFinalPayment" />
                </div>
                <span className="text-sm text-theme-text font-mono flex-shrink-0">{formatCurrency(handoverAmount, currency, rate)}</span>
              </div>
            </div>
          </div>

          {/* Grand Total */}
          <div className="pt-4 border-t border-theme-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-theme-text-muted">{t('assetValue') || 'Asset Value'}</span>
              <span className="text-sm text-theme-text font-mono">{formatCurrency(totalPropertyPayments, currency, rate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-theme-text-muted">{t('entryCostsDldOqood')}</span>
              <span className="text-sm text-theme-text font-mono">{formatCurrency(totalEntryCosts, currency, rate)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 bg-gradient-to-r from-emerald-500/10 to-transparent border-t border-emerald-500/30 -mx-4 px-4 py-3 rounded-b-xl">
              <span className="text-sm font-bold text-emerald-400">{t('totalToDisburse')}</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{formatCurrency(grandTotal, currency, rate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Client Split Cards */}
      {clientInfo?.splitEnabled && clientInfo?.clients && clientInfo.clients.length >= 2 && (
        <ClientSplitCards
          inputs={inputs}
          clientInfo={clientInfo}
          currency={currency}
          rate={rate}
          onViewDetails={(clientId) => setSelectedClientId(clientId)}
        />
      )}

      {/* Client Payment Sheet */}
      {clientInfo && (
        <ClientPaymentSheet
          isOpen={!!selectedClientId}
          onClose={() => setSelectedClientId(null)}
          clientId={selectedClientId}
          inputs={inputs}
          clientInfo={clientInfo}
          currency={currency}
          rate={rate}
          totalMonths={totalMonths}
        />
      )}
    </div>
  );
};
