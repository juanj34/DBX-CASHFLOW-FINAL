import { OIInputs, PaymentMilestone, monthName } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { Calendar, CreditCard, Home, Clock, Building2, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { InfoTooltip } from "./InfoTooltip";
import { ClientUnitData } from "./ClientUnitInfo";
import { PaymentSummaryCards } from "./PaymentSummaryCards";
import { PaymentVisualBar } from "./PaymentVisualBar";
import { ClientSplitCards } from "./ClientSplitCards";
import { PaymentPlanBadge } from "./PaymentPlanBadge";
import { PaymentHorizontalTimeline } from "./PaymentHorizontalTimeline";

interface PaymentBreakdownProps {
  inputs: OIInputs;
  currency: Currency;
  totalMonths: number;
  rate: number;
  unitSizeSqf?: number;
  clientInfo?: ClientUnitData;
  compact?: boolean;
}

// Check if a payment is at or after handover
const isPaymentAtOrAfterHandover = (
  paymentMonthsFromBooking: number,
  bookingMonth: number,
  bookingYear: number,
  handoverMonth: number,
  handoverYear: number
): { isHandover: boolean; isPostHandover: boolean } => {
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + paymentMonthsFromBooking);

  const handoverDate = new Date(handoverYear, handoverMonth - 1);
  const handoverDateEnd = new Date(handoverYear, handoverMonth);

  const isHandover = paymentDate >= handoverDate && paymentDate < handoverDateEnd;
  const isPostHandover = paymentDate >= handoverDateEnd;

  return { isHandover, isPostHandover };
};

// Check if a payment falls within the handover month specifically (for strong highlighting)
const isPaymentInHandoverMonth = (
  monthsFromBooking: number,
  bookingMonth: number,
  bookingYear: number,
  handoverMonth: number,
  handoverYear: number
): boolean => {
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);

  return paymentDate.getFullYear() === handoverYear && (paymentDate.getMonth() + 1) === handoverMonth;
};

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

export const PaymentBreakdown = ({ inputs, currency, totalMonths, rate, unitSizeSqf = 0, clientInfo, compact = false }: PaymentBreakdownProps) => {
  const { t, language } = useLanguage();
  const { basePrice, downpaymentPercent, additionalPayments, preHandoverPercent, oqoodFee, eoiFee, bookingMonth, bookingYear, handoverMonth, handoverYear } = inputs;
  const hasPostHandoverPlan = inputs.hasPostHandoverPlan ?? false;

  // Calculate amounts
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const eoiFeeActual = Math.min(eoiFee, downpaymentAmount);
  const restOfDownpayment = downpaymentAmount - eoiFeeActual;
  const dldFeeAmount = basePrice * DLD_FEE_PERCENT / 100;

  // For post-handover plans, handover is the explicit onHandoverPercent
  // For standard plans, handover is the remaining balance (100 - preHandover)
  const totalAdditionalPercent = additionalPayments.reduce((sum, p) => sum + p.paymentPercent, 0);
  const totalAllocatedPercent = downpaymentPercent + totalAdditionalPercent;
  let handoverPercent: number;
  if (hasPostHandoverPlan) {
    handoverPercent = Math.abs(totalAllocatedPercent - 100) < 0.5
      ? 0
      : (inputs.onHandoverPercent || 0);
  } else {
    handoverPercent = 100 - preHandoverPercent;
  }
  const handoverAmount = basePrice * handoverPercent / 100;

  // Post-handover payments
  const postHandoverPayments = hasPostHandoverPlan ? (inputs.postHandoverPayments || []) : [];
  const postHandoverTotal = postHandoverPayments.reduce((sum, p) => sum + (basePrice * p.paymentPercent / 100), 0);

  // Calculate additional payments total
  const additionalTotal = additionalPayments.reduce((sum, m) => sum + (basePrice * m.paymentPercent / 100), 0);
  
  // Calculate pre-handover totals
  const todayTotal = downpaymentAmount + dldFeeAmount + oqoodFee;
  const totalPreHandover = todayTotal + additionalTotal;
  
  // Sort additional payments by trigger
  const sortedAdditionalPayments = [...additionalPayments].sort((a, b) => {
    if (a.type === 'time' && b.type === 'time') return a.triggerValue - b.triggerValue;
    if (a.type === 'construction' && b.type === 'construction') return a.triggerValue - b.triggerValue;
    const aMonths = a.type === 'time' ? a.triggerValue : (a.triggerValue / 100) * totalMonths;
    const bMonths = b.type === 'time' ? b.triggerValue : (b.triggerValue / 100) * totalMonths;
    return aMonths - bMonths;
  });

  // Calculate totals
  const totalPropertyPayments = basePrice;
  const totalEntryCosts = dldFeeAmount + oqoodFee;
  const grandTotal = totalPropertyPayments + totalEntryCosts;
  const totalUntilHandover = todayTotal + additionalTotal + handoverAmount;

  // Calculate avg monthly during construction
  const bookingDate = new Date(bookingYear, bookingMonth - 1, 1);
  const handoverDate = new Date(handoverYear, handoverMonth - 1, 1);
  const constructionMonths = Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const avgMonthlyPayment = additionalTotal > 0 && constructionMonths > 0 
    ? additionalTotal / constructionMonths 
    : 0;

  const hasClientSplit = clientInfo?.splitEnabled && clientInfo?.clients && clientInfo.clients.length >= 2;

  return (
    <div className="space-y-6">
      {/* Interactive Horizontal Timeline - Full Width at TOP */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-4">
        <PaymentHorizontalTimeline
          inputs={inputs}
          currency={currency}
          rate={rate}
          totalMonths={totalMonths}
        />
      </div>

      {/* Layout: Full width if compact, otherwise 2:1 grid */}
      <div className={compact ? "space-y-4" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
        {/* Left Column: Detailed Breakdown */}
        <div className={compact ? "" : "lg:col-span-2 space-y-4"}>

          {/* Detailed Breakdown Card */}
          <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden">
            {/* Investment Schedule Badge as Card Header */}
            <div className="px-4 pt-4 pb-3 border-b border-theme-border">
              <PaymentPlanBadge
                preHandoverPercent={preHandoverPercent}
                handoverPercent={handoverPercent}
                constructionMonths={constructionMonths}
              />
            </div>
            
            <div className="p-4 pt-2 space-y-5">
              {/* Base Property Price Header */}
              <div className="flex justify-between items-center pb-3 border-b border-theme-border">
                <span className="text-xs text-theme-text-muted uppercase tracking-wide font-medium">{t('basePropertyPrice')}</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-theme-text font-mono tabular-nums">{formatCurrency(basePrice, currency, rate)}</span>
                  {unitSizeSqf > 0 && (
                    <p className="text-xs text-theme-text-muted font-mono tabular-nums">
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
                    {t('theEntry')}
                  </span>
                  <span className="text-xs text-theme-text-muted">
                    ({monthToDateString(bookingMonth, bookingYear, language)})
                  </span>
                </div>
                
                <div className="bg-emerald-900/20 border border-emerald-600/30 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <span className="text-sm text-theme-text-muted truncate">{t('eoiBookingFee')}</span>
                      <InfoTooltip translationKey="tooltipEoiFee" />
                    </div>
                    <span className="text-sm text-theme-text font-mono flex-shrink-0 text-right tabular-nums">{formatCurrency(eoiFeeActual, currency, rate)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <span className="text-sm text-theme-text-muted truncate">{t('restOfDownpayment')} ({downpaymentPercent}% - EOI)</span>
                      <InfoTooltip translationKey="tooltipDownpayment" />
                    </div>
                    <span className="text-sm text-theme-text font-mono flex-shrink-0 text-right tabular-nums">{formatCurrency(restOfDownpayment, currency, rate)}</span>
                  </div>
                  
                  {/* DLD Fee */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <span className="text-sm text-theme-text-muted truncate">
                        {t('dldRegistrationFee')}
                      </span>
                      <span className="ml-1 text-[10px] bg-slate-700 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded">
                        {t('govtFee')}
                      </span>
                      <InfoTooltip translationKey="tooltipDldFee" />
                    </div>
                    <span className="text-sm text-red-400 font-mono flex-shrink-0 text-right tabular-nums">{formatCurrency(dldFeeAmount, currency, rate)}</span>
                  </div>
                  
                  {/* Oqood Fee - Admin Fee, not Govt */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <span className="text-sm text-theme-text-muted truncate">{t('oqoodFee')}</span>
                      <span className="ml-1 text-[10px] bg-slate-700 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        {t('adminFee')}
                      </span>
                      <InfoTooltip translationKey="tooltipOqoodFee" />
                    </div>
                    <span className="text-sm text-amber-400 font-mono flex-shrink-0 text-right tabular-nums">{formatCurrency(oqoodFee, currency, rate)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-600/30">
                    <span className="text-sm font-semibold text-theme-accent">{t('totalCashNow')}</span>
                    <span className="text-base font-bold text-theme-accent font-mono tabular-nums">{formatCurrency(todayTotal, currency, rate)}</span>
                  </div>
                </div>
              </div>

              {/* Section: THE JOURNEY */}
              {sortedAdditionalPayments.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-500/20 flex items-center justify-center">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                      {t('theJourney')}
                    </span>
                    <span className="text-xs text-theme-text-muted">
                      ({constructionMonths} {t('months')})
                    </span>
                  </div>
                  
                  <div className="bg-slate-500/5 border border-slate-500/20 rounded-xl p-4 space-y-2">
                    {sortedAdditionalPayments.map((payment, index) => {
                      const amount = basePrice * payment.paymentPercent / 100;
                      const isTimeBased = payment.type === 'time';

                      // Calculate date for all payment types
                      let dateStr: string | null = null;
                      if (isTimeBased) {
                        dateStr = estimateDateFromMonths(payment.triggerValue, bookingMonth, bookingYear, language);
                      } else {
                        // Construction-linked: estimate based on % of construction period
                        const estMonths = Math.round((payment.triggerValue / 100) * totalMonths);
                        dateStr = '~' + estimateDateFromMonths(estMonths, bookingMonth, bookingYear, language);
                      }
                      
                      // Check if this payment falls in or after handover
                      const monthsFromBooking = isTimeBased 
                        ? payment.triggerValue 
                        : Math.round((payment.triggerValue / 100) * totalMonths);
                      const { isHandover, isPostHandover } = isPaymentAtOrAfterHandover(
                        monthsFromBooking, bookingMonth, bookingYear, handoverMonth, handoverYear
                      );
                      
                      // Check if in handover quarter for strong highlighting
                      const inHandoverQuarter = isPaymentInHandoverMonth(
                        monthsFromBooking, bookingMonth, bookingYear, handoverMonth, handoverYear
                      );
                      
                      // Check if this is the first payment in delivery quarter to show divider
                      const isFirstInDeliveryQuarter = inHandoverQuarter && !sortedAdditionalPayments.slice(0, index).some(p => {
                        const prevMonths = p.type === 'time' ? p.triggerValue : Math.round((p.triggerValue / 100) * totalMonths);
                        return isPaymentInHandoverMonth(prevMonths, bookingMonth, bookingYear, handoverMonth, handoverYear);
                      });
                      
                      return (
                        <div key={payment.id}>
                          {/* Delivery Quarter Divider */}
                          {isFirstInDeliveryQuarter && (
                            <div className="flex items-center gap-2 py-2 -mx-2 px-2 mb-2 border-t border-b border-green-500/30 bg-green-500/5">
                              <Key className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-[10px] uppercase tracking-wide font-semibold text-green-400">
                                {t('deliveryQuarter') || 'Delivery Quarter'} ({monthName(handoverMonth)} {handoverYear})
                              </span>
                            </div>
                          )}
                          <div 
                            className={cn(
                              "flex justify-between items-center gap-2",
                              inHandoverQuarter && "bg-green-500/15 rounded px-2 py-1.5 -mx-2 border-l-4 border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.15)]"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {isTimeBased ? (
                                <Clock className="w-3 h-3 text-theme-text-muted flex-shrink-0" />
                              ) : (
                                <Building2 className="w-3 h-3 text-theme-text-muted flex-shrink-0" />
                              )}
                              <span className="text-sm text-theme-text-muted truncate">
                                {payment.paymentPercent}% · {dateStr}
                              </span>
                              {inHandoverQuarter && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded border border-green-500/30 whitespace-nowrap flex items-center gap-0.5">
                                  <Key className="w-2.5 h-2.5" />
                                  {t('handover') || 'Handover'}
                                </span>
                              )}
                              {isPostHandover && !inHandoverQuarter && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30 whitespace-nowrap">
                                  Post-HO
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-theme-text font-mono flex-shrink-0 text-right tabular-nums">{formatCurrency(amount, currency, rate)}</span>
                          </div>
                        </div>
                      );
                    })}
                    {additionalTotal > 0 && (
                      <>
                        <div className="flex justify-between items-center pt-2 border-t border-theme-border">
                          <span className="text-sm text-theme-text-muted">{t('subtotalInstallments')}</span>
                          <span className="text-sm text-theme-text font-mono tabular-nums">{formatCurrency(additionalTotal, currency, rate)}</span>
                        </div>
                        {avgMonthlyPayment > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-theme-text-muted">{t('avgMonthly')}</span>
                            <span className="text-theme-text-muted font-mono tabular-nums">~{formatCurrency(avgMonthlyPayment, currency, rate)}/mo</span>
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
                  <span className="text-lg font-bold text-theme-accent font-mono tabular-nums">{formatCurrency(totalPreHandover, currency, rate)}</span>
                </div>
              </div>

              {/* Section: COMPLETION / HANDOVER */}
              {handoverPercent > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Home className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">
                      {hasPostHandoverPlan ? t('onHandoverLabel') || 'On Handover' : t('completionHandover')}
                    </span>
                    <span className="text-xs text-theme-text-muted">
                      ({monthName(handoverMonth)} {handoverYear})
                    </span>
                  </div>

                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <span className="text-sm text-theme-text-muted truncate">
                          {hasPostHandoverPlan ? 'Handover Payment' : t('finalPayment')} ({handoverPercent}%)
                        </span>
                        <InfoTooltip translationKey="tooltipFinalPayment" />
                      </div>
                      <span className="text-sm text-theme-text font-mono flex-shrink-0 text-right tabular-nums">{formatCurrency(handoverAmount, currency, rate)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Section: POST-HANDOVER */}
              {hasPostHandoverPlan && postHandoverPayments.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <span className="text-sm font-semibold text-purple-400 uppercase tracking-wide">
                      Post-Handover ({postHandoverPayments.reduce((sum, p) => sum + p.paymentPercent, 0).toFixed(0)}%)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {[...postHandoverPayments].sort((a, b) => a.triggerValue - b.triggerValue).map((payment, index) => {
                      const amount = basePrice * payment.paymentPercent / 100;
                      const label = payment.type === 'post-handover'
                        ? `+${payment.triggerValue}mo`
                        : `Month ${payment.triggerValue}`;
                      const handoverMonthsFromBooking = (handoverYear - bookingYear) * 12 + (handoverMonth - bookingMonth);
                      const absoluteMonth = payment.type === 'post-handover'
                        ? handoverMonthsFromBooking + payment.triggerValue
                        : payment.triggerValue;
                      const dateStr = estimateDateFromMonths(absoluteMonth, bookingMonth, bookingYear, language);

                      return (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-theme-text-muted">
                            {label} <span className="text-xs text-purple-400/70">({dateStr})</span>
                          </span>
                          <span className="text-sm text-theme-text font-mono tabular-nums">{formatCurrency(amount, currency, rate)}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center pt-2 border-t border-theme-border">
                      <span className="text-sm text-purple-400 font-semibold">Subtotal Post-Handover</span>
                      <span className="text-sm text-purple-400 font-bold font-mono tabular-nums">{formatCurrency(postHandoverTotal, currency, rate)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Grand Total */}
              <div className="pt-4 border-t border-theme-border space-y-2">
                {hasPostHandoverPlan && postHandoverTotal > 0 ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-theme-text-muted">Paid Until Handover</span>
                      <span className="text-sm text-green-400 font-mono tabular-nums">{formatCurrency(totalUntilHandover, currency, rate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-theme-text-muted">Paid Post-Handover</span>
                      <span className="text-sm text-purple-400 font-mono tabular-nums">{formatCurrency(postHandoverTotal, currency, rate)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-theme-text-muted">{t('basePropertyPrice')}</span>
                      <span className="text-sm text-theme-text font-mono tabular-nums">{formatCurrency(totalPropertyPayments, currency, rate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-theme-text-muted">{t('entryCostsDldOqood')}</span>
                        <span className="text-[10px] bg-slate-700 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded">
                          {t('govtFee')}
                        </span>
                      </div>
                      <span className="text-sm text-red-400 font-mono tabular-nums">{formatCurrency(totalEntryCosts, currency, rate)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-2 bg-gradient-to-r from-emerald-500/10 to-transparent border-t border-emerald-500/30 -mx-4 px-4 py-3 rounded-b-xl">
                  <span className="text-sm font-bold text-emerald-400">{t('totalToDisburse')}</span>
                  <span className="text-xl font-bold text-emerald-400 font-mono tabular-nums">{formatCurrency(grandTotal, currency, rate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: KPIs + Ownership (1/3 width) - Hidden in compact mode */}
        {!compact && (
          <div className="lg:col-span-1 space-y-4">
            {/* KPI Cards - Vertical Stack */}
            <PaymentSummaryCards 
              inputs={inputs} 
              currency={currency} 
              rate={rate} 
              totalMonths={totalMonths}
              vertical={true}
            />

            {/* Ownership Structure - Accordion */}
            {hasClientSplit && clientInfo && (
              <ClientSplitCards
                inputs={inputs}
                clientInfo={clientInfo}
                currency={currency}
                rate={rate}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
