import { useState } from 'react';
import { CreditCard, ArrowRight, Users, Sparkles, Key, Wallet } from 'lucide-react';
import { OIInputs, PaymentMilestone } from '../useOICalculations';
import { ClientUnitData } from '../ClientUnitInfo';
import { Currency, formatDualCurrency } from '../currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { DottedRow } from './DottedRow';
import { PaymentSplitModal } from './PaymentSplitModal';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

interface CompactPaymentTableProps {
  inputs: OIInputs;
  clientInfo?: ClientUnitData;
  valueDifferentiators?: string[];
  appreciationBonus?: number;
  currency: Currency;
  rate: number;
  totalMonths: number;
}

const monthToDateString = (month: number, year: number, language: string): string => {
  const monthNames = language === 'es' 
    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1]} ${year}`;
};

const getQuarterMonths = (quarter: number, language: string): string => {
  const quarterMonths = language === 'es'
    ? ['Ene-Mar', 'Abr-Jun', 'Jul-Sep', 'Oct-Dic']
    : ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'];
  return quarterMonths[quarter - 1];
};

const estimateDateFromMonths = (monthsFromBooking: number, bookingMonth: number, bookingYear: number, language: string): string => {
  const totalMonths = bookingMonth + monthsFromBooking;
  const yearOffset = Math.floor((totalMonths - 1) / 12);
  const month = ((totalMonths - 1) % 12) + 1;
  return monthToDateString(month, bookingYear + yearOffset, language);
};

// Check if payment falls in handover quarter
const isPaymentInHandoverQuarter = (monthsFromBooking: number, bookingMonth: number, bookingYear: number, handoverQuarter: number, handoverYear: number): boolean => {
  // Calculate actual payment date using Date object for accuracy
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);
  
  const paymentYear = paymentDate.getFullYear();
  const paymentMonth = paymentDate.getMonth() + 1;
  const paymentQuarter = Math.ceil(paymentMonth / 3);
  
  return paymentYear === handoverYear && paymentQuarter === handoverQuarter;
};

// Check if payment is AFTER the handover quarter (strictly after Q end, not start)
const isPaymentAfterHandoverQuarter = (monthsFromBooking: number, bookingMonth: number, bookingYear: number, handoverQuarter: number, handoverYear: number): boolean => {
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);
  
  // Handover quarter END = last month of quarter (Q3 = Sep = month 9)
  const handoverQuarterEndMonth = handoverQuarter * 3;
  const handoverQuarterEnd = new Date(handoverYear, handoverQuarterEndMonth - 1, 28); // End of last month in quarter
  
  return paymentDate > handoverQuarterEnd;
};

export const CompactPaymentTable = ({
  inputs,
  clientInfo,
  valueDifferentiators = [],
  appreciationBonus = 0,
  currency,
  rate,
  totalMonths,
}: CompactPaymentTableProps) => {
  const { language, t } = useLanguage();
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  
  const { 
    basePrice, 
    downpaymentPercent, 
    additionalPayments, 
    bookingMonth, 
    bookingYear,
    handoverQuarter,
    handoverYear,
    oqoodFee,
    eoiFee = 0
  } = inputs;
  
  // Check for post-handover plan
  const hasPostHandoverPlan = inputs.hasPostHandoverPlan ?? false;
  
  // Calculate amounts
  const downpaymentAmount = basePrice * (downpaymentPercent / 100);
  const remainingDownpayment = downpaymentAmount - eoiFee;
  const dldFee = basePrice * 0.04;
  
  // Sort additional payments
  const sortedPayments = [...(additionalPayments || [])].sort((a, b) => {
    if (a.type === 'time' && b.type === 'time') return a.triggerValue - b.triggerValue;
    if (a.type === 'construction' && b.type === 'construction') return a.triggerValue - b.triggerValue;
    return a.type === 'time' ? -1 : 1;
  });

  // Derive pre-handover and post-handover payments from additionalPayments by date
  // Pre-handover includes payments UP TO AND INCLUDING the handover quarter
  // Post-handover is STRICTLY AFTER the handover quarter ends
  const preHandoverPayments = hasPostHandoverPlan
    ? sortedPayments.filter(p => {
        if (p.type !== 'time') return true; // construction-based = pre-handover
        return !isPaymentAfterHandoverQuarter(p.triggerValue, bookingMonth, bookingYear, handoverQuarter, handoverYear);
      })
    : sortedPayments;

  const derivedPostHandoverPayments = hasPostHandoverPlan
    ? sortedPayments.filter(p => {
        if (p.type !== 'time') return false;
        return isPaymentAfterHandoverQuarter(p.triggerValue, bookingMonth, bookingYear, handoverQuarter, handoverYear);
      })
    : [];
  
  // Calculate handover and post-handover amounts
  let handoverPercent: number;
  let handoverAmount: number;
  let postHandoverTotal = 0;
  
  if (hasPostHandoverPlan) {
    handoverPercent = inputs.onHandoverPercent || 0;
    handoverAmount = basePrice * handoverPercent / 100;
    // Calculate from derived payments
    postHandoverTotal = derivedPostHandoverPayments.reduce(
      (sum, p) => sum + (basePrice * p.paymentPercent / 100), 0
    );
  } else {
    handoverPercent = 100 - inputs.preHandoverPercent;
    handoverAmount = basePrice * handoverPercent / 100;
  }
  
  // Entry subtotal (before fees)
  const entrySubtotal = downpaymentAmount;
  
  // Entry total (with fees)
  const entryTotal = downpaymentAmount + dldFee + oqoodFee;

  // Calculate journey total (pre-handover installments excluding downpayment)
  const journeyTotal = preHandoverPayments.reduce(
    (sum, p) => sum + (basePrice * p.paymentPercent / 100), 0
  );

  // Total Cash Until Handover = Entry + Journey + On Handover
  const totalUntilHandover = entryTotal + journeyTotal + handoverAmount;
  
  const getPaymentLabel = (payment: PaymentMilestone): string => {
    if (payment.type === 'time') {
      return `Month ${payment.triggerValue}`;
    }
    if (payment.type === 'construction') {
      return `${payment.triggerValue}% Built`;
    }
    return payment.label || 'Payment';
  };
  
  const getPaymentDate = (payment: PaymentMilestone): string => {
    if (payment.type === 'time') {
      return estimateDateFromMonths(payment.triggerValue, bookingMonth, bookingYear, language);
    }
    if (payment.type === 'construction') {
      const monthsForPercent = Math.round((payment.triggerValue / 100) * totalMonths);
      return estimateDateFromMonths(monthsForPercent, bookingMonth, bookingYear, language);
    }
    return '';
  };

  // Dual currency helpers
  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };

  // Check for multiple clients
  const hasMultipleClients = clientInfo?.clients && clientInfo.clients.length > 1;

  // Grand total calculation
  const grandTotal = hasPostHandoverPlan
    ? entryTotal + journeyTotal + handoverAmount + postHandoverTotal
    : entryTotal + journeyTotal + handoverAmount;

  return (
    <>
      <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden h-fit">
        {/* Header */}
        <div className="p-3 border-b border-theme-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-semibold text-theme-text uppercase tracking-wide">Payment Breakdown</span>
          </div>
          <div className="flex items-center gap-2">
            {/* View Split button for multiple clients */}
            {hasMultipleClients && clientInfo && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSplitModalOpen(true)}
                className="text-xs h-6 px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
              >
                <Users className="w-3 h-3 mr-1" />
                View Split
              </Button>
            )}
            <div className="flex items-center gap-1.5 text-[10px] text-theme-text-muted">
              <span>{monthToDateString(bookingMonth, bookingYear, language)}</span>
              <ArrowRight className="w-3 h-3" />
              <span>Q{handoverQuarter} ({getQuarterMonths(handoverQuarter, language)}) {handoverYear}</span>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-3 space-y-3">
          {/* Section: The Entry */}
          <div>
            <div className="text-[10px] uppercase tracking-wide text-theme-accent font-semibold mb-2">
              The Entry
            </div>
            <div className="space-y-1">
              {/* EOI / Booking Fee */}
              {eoiFee > 0 && (
                <DottedRow 
                  label="EOI / Booking Fee"
                  value={getDualValue(eoiFee).primary}
                  secondaryValue={getDualValue(eoiFee).secondary}
                />
              )}
              {/* Remaining Downpayment (or full if no EOI) */}
              <DottedRow 
                label={eoiFee > 0 ? `Downpayment Balance` : `Downpayment (${downpaymentPercent}%)`}
                value={getDualValue(eoiFee > 0 ? remainingDownpayment : downpaymentAmount).primary}
                secondaryValue={getDualValue(eoiFee > 0 ? remainingDownpayment : downpaymentAmount).secondary}
              />
              {/* Subtotal Pre-Handover (if EOI exists) */}
              {eoiFee > 0 && (
                <div className="pt-1 border-t border-dashed border-theme-border/50 mt-1">
                  <DottedRow 
                    label={`Subtotal (${downpaymentPercent}%)`}
                    value={getDualValue(entrySubtotal).primary}
                    secondaryValue={getDualValue(entrySubtotal).secondary}
                    className="text-theme-text-muted"
                  />
                </div>
              )}
              <DottedRow 
                label="DLD Fee (4%)"
                value={getDualValue(dldFee).primary}
                secondaryValue={getDualValue(dldFee).secondary}
              />
              <DottedRow 
                label="Oqood/Admin"
                value={getDualValue(oqoodFee).primary}
                secondaryValue={getDualValue(oqoodFee).secondary}
              />
              <div className="pt-1 border-t border-theme-border mt-1">
                <DottedRow 
                  label="Total Entry"
                  value={getDualValue(entryTotal).primary}
                  secondaryValue={getDualValue(entryTotal).secondary}
                  bold
                  valueClassName="text-primary"
                />
              </div>
            </div>
          </div>

          {/* Section: The Journey (Pre-Handover) */}
          {preHandoverPayments.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-cyan-400 font-semibold mb-2">
                The Journey ({totalMonths}mo)
              </div>
              <div className="space-y-1">
                {preHandoverPayments.map((payment, index) => {
                  const amount = basePrice * (payment.paymentPercent / 100);
                  const dateStr = getPaymentDate(payment);
                  const labelWithDate = dateStr ? `${getPaymentLabel(payment)} (${dateStr})` : getPaymentLabel(payment);
                  
                  // Check for handover indicators - highlight payments in handover quarter
                  const isHandoverQuarter = payment.type === 'time' && isPaymentInHandoverQuarter(
                    payment.triggerValue,
                    bookingMonth,
                    bookingYear,
                    handoverQuarter,
                    handoverYear
                  );
                  
                  // Check if this is the LAST payment in the handover quarter
                  const isLastHandoverQuarterPayment = isHandoverQuarter && 
                    !preHandoverPayments.slice(index + 1).some(p => 
                      p.type === 'time' && isPaymentInHandoverQuarter(p.triggerValue, bookingMonth, bookingYear, handoverQuarter, handoverYear)
                    );
                  
                  return (
                    <div key={index}>
                      <div 
                        className={cn(
                          "flex items-center justify-between gap-2",
                          isHandoverQuarter && "bg-green-500/10 rounded px-1 py-0.5 -mx-1 border-l-2 border-green-400"
                        )}
                      >
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <span className="text-xs text-theme-text-muted truncate">{labelWithDate}</span>
                          {isHandoverQuarter && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 whitespace-nowrap flex items-center gap-0.5">
                              <Key className="w-2.5 h-2.5" />
                              Handover
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-theme-text whitespace-nowrap flex-shrink-0">
                          {getDualValue(amount).primary}
                          {currency !== 'AED' && (
                            <span className="text-theme-text-muted ml-1">({getDualValue(amount).secondary})</span>
                          )}
                        </span>
                      </div>
                      
                      {/* Show cumulative total right after the last handover quarter payment */}
                      {isLastHandoverQuarterPayment && (
                        <div className="mt-2 pt-1.5 border-t border-dashed border-theme-border/50">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-theme-text-muted flex items-center gap-1">
                              <Wallet className="w-2.5 h-2.5" />
                              Total to this point
                            </span>
                            <span className="font-mono text-theme-accent font-medium">
                              {getDualValue(totalUntilHandover).primary}
                              {currency !== 'AED' && (
                                <span className="text-theme-text-muted ml-1">({getDualValue(totalUntilHandover).secondary})</span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Handover - show for standard plans OR post-handover plans with onHandoverPercent > 0 */}
          {/* For post-handover plans with 0% on-handover, cumulative is shown inline after last handover quarter payment above */}
          {!hasPostHandoverPlan && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-green-400 font-semibold mb-2">
                Handover ({handoverPercent}%)
              </div>
              <div className="space-y-1">
                <DottedRow 
                  label="Final Payment"
                  value={getDualValue(handoverAmount).primary}
                  secondaryValue={getDualValue(handoverAmount).secondary}
                  bold
                  valueClassName="text-green-400"
                />
              </div>
              {/* Inline Cumulative: Total to Handover */}
              <div className="mt-2 pt-1.5 border-t border-dashed border-theme-border/50">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-theme-text-muted flex items-center gap-1">
                    <Wallet className="w-2.5 h-2.5" />
                    Total to this point
                  </span>
                  <span className="font-mono text-theme-accent font-medium">
                    {getDualValue(totalUntilHandover).primary}
                    {currency !== 'AED' && (
                      <span className="text-theme-text-muted ml-1">({getDualValue(totalUntilHandover).secondary})</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* For post-handover plans with explicit on-handover payment */}
          {hasPostHandoverPlan && handoverPercent > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-green-400 font-semibold mb-2">
                On Handover ({handoverPercent}%)
              </div>
              <div className="space-y-1">
                <DottedRow 
                  label="Handover Payment"
                  value={getDualValue(handoverAmount).primary}
                  secondaryValue={getDualValue(handoverAmount).secondary}
                  bold
                  valueClassName="text-green-400"
                />
              </div>
            </div>
          )}


          {/* Section: Post-Handover Installments - only for post-handover plans */}
          {hasPostHandoverPlan && derivedPostHandoverPayments.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-purple-400 font-semibold mb-2">
                Post-Handover ({(derivedPostHandoverPayments.reduce((sum, p) => sum + p.paymentPercent, 0)).toFixed(0)}%)
              </div>
              <div className="space-y-1">
                {derivedPostHandoverPayments.map((payment, index) => {
                  const amount = basePrice * (payment.paymentPercent / 100);
                  const dateStr = getPaymentDate(payment);
                  const label = `${getPaymentLabel(payment)} (${dateStr})`;
                  
                  // Post-handover payments don't get handover highlighting - they're already past handover
                  return (
                    <div key={index} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-theme-text-muted truncate">{label}</span>
                      <span className="text-xs font-mono text-theme-text whitespace-nowrap flex-shrink-0">
                        {getDualValue(amount).primary}
                        {currency !== 'AED' && (
                          <span className="text-theme-text-muted ml-1">({getDualValue(amount).secondary})</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grand Total with Fee Breakdown */}
          <div className="pt-2 border-t border-theme-border space-y-1">
            {/* Property Price */}
            <DottedRow 
              label={t('basePropertyPrice')}
              value={getDualValue(basePrice).primary}
              secondaryValue={getDualValue(basePrice).secondary}
              className="text-xs"
            />
            {/* Transaction Fees */}
            <DottedRow 
              label={t('transactionFees')}
              value={getDualValue(dldFee + oqoodFee).primary}
              secondaryValue={getDualValue(dldFee + oqoodFee).secondary}
              className="text-xs"
              valueClassName="text-theme-text-muted"
            />
            
            {/* Show subtotals for post-handover plans */}
            {hasPostHandoverPlan && postHandoverTotal > 0 && (
              <div className="pt-1 mt-1 border-t border-dashed border-theme-border/50 space-y-1">
                <DottedRow 
                  label="Paid Until Handover"
                  value={getDualValue(totalUntilHandover).primary}
                  secondaryValue={getDualValue(totalUntilHandover).secondary}
                  className="text-xs"
                  valueClassName="text-green-400"
                />
                <DottedRow 
                  label="Post-Handover Balance"
                  value={getDualValue(postHandoverTotal).primary}
                  secondaryValue={getDualValue(postHandoverTotal).secondary}
                  className="text-xs"
                  valueClassName="text-purple-400"
                />
              </div>
            )}
            
            {/* Total Investment */}
            <DottedRow 
              label={t('totalInvestmentLabel')}
              value={getDualValue(grandTotal).primary}
              secondaryValue={getDualValue(grandTotal).secondary}
              bold
              className="text-sm"
              labelClassName="text-sm"
              valueClassName="text-sm"
            />
          </div>


          {/* Value Differentiators - AFTER Total Investment */}
          {valueDifferentiators.length > 0 && (
            <div className="pt-2 border-t border-dashed border-theme-border">
              <div className="text-[10px] uppercase tracking-wide text-yellow-400 font-semibold mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Value Adds
              </div>
              <div className="flex flex-wrap gap-1.5">
                {valueDifferentiators.map((diff, i) => (
                  <span 
                    key={i}
                    className="px-2 py-0.5 text-[10px] bg-yellow-400/10 text-yellow-400 rounded-full border border-yellow-400/30"
                  >
                    {diff}
                  </span>
                ))}
                {appreciationBonus > 0 && (
                  <span className="px-2 py-0.5 text-[10px] bg-green-400/10 text-green-400 rounded-full border border-green-400/30">
                    +{appreciationBonus}% bonus
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Split Modal */}
      {clientInfo && (
        <PaymentSplitModal 
          open={splitModalOpen}
          onOpenChange={setSplitModalOpen}
          inputs={inputs}
          clientInfo={clientInfo}
          currency={currency}
          rate={rate}
          totalMonths={totalMonths}
        />
      )}
    </>
  );
};
