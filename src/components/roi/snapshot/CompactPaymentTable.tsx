import { useState } from 'react';
import { CreditCard, ArrowRight, Users, Sparkles, Key } from 'lucide-react';
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

const estimateDateFromMonths = (monthsFromBooking: number, bookingMonth: number, bookingYear: number, language: string): string => {
  const totalMonths = bookingMonth + monthsFromBooking;
  const yearOffset = Math.floor((totalMonths - 1) / 12);
  const month = ((totalMonths - 1) % 12) + 1;
  return monthToDateString(month, bookingYear + yearOffset, language);
};

// Check if payment falls in or after handover quarter
const isPaymentInHandoverQuarter = (monthsFromBooking: number, bookingMonth: number, bookingYear: number, handoverQuarter: number, handoverYear: number): boolean => {
  const totalMonthsFromStart = bookingMonth + monthsFromBooking;
  const paymentYearOffset = Math.floor((totalMonthsFromStart - 1) / 12);
  const paymentMonth = ((totalMonthsFromStart - 1) % 12) + 1;
  const paymentYear = bookingYear + paymentYearOffset;
  
  const handoverQuarterStart = (handoverQuarter - 1) * 3 + 1;
  const handoverQuarterEnd = handoverQuarter * 3;
  
  if (paymentYear === handoverYear) {
    return paymentMonth >= handoverQuarterStart && paymentMonth <= handoverQuarterEnd;
  }
  return false;
};

const isPaymentPostHandover = (monthsFromBooking: number, bookingMonth: number, bookingYear: number, handoverQuarter: number, handoverYear: number): boolean => {
  const totalMonthsFromStart = bookingMonth + monthsFromBooking;
  const paymentYearOffset = Math.floor((totalMonthsFromStart - 1) / 12);
  const paymentMonth = ((totalMonthsFromStart - 1) % 12) + 1;
  const paymentYear = bookingYear + paymentYearOffset;
  
  const handoverMonth = (handoverQuarter - 1) * 3 + 1;
  const handoverDate = new Date(handoverYear, handoverMonth - 1);
  const paymentDate = new Date(paymentYear, paymentMonth - 1);
  
  return paymentDate >= handoverDate;
};

// Calculate date from months after handover
const getPostHandoverDate = (monthsAfterHandover: number, handoverQuarter: number, handoverYear: number, language: string): string => {
  const handoverMonth = (handoverQuarter - 1) * 3 + 1;
  const totalMonths = handoverMonth + monthsAfterHandover;
  const yearOffset = Math.floor((totalMonths - 1) / 12);
  const month = ((totalMonths - 1) % 12) + 1;
  return monthToDateString(month, handoverYear + yearOffset, language);
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
    preHandoverPercent, 
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
  const remainingDownpayment = downpaymentAmount - eoiFee; // Downpayment minus EOI
  const dldFee = basePrice * 0.04;
  
  // Calculate handover and post-handover amounts
  let handoverPercent: number;
  let handoverAmount: number;
  let postHandoverTotal = 0;
  
  if (hasPostHandoverPlan) {
    // Post-handover plan: on-handover is a specific percentage
    handoverPercent = inputs.onHandoverPercent || 0;
    handoverAmount = basePrice * handoverPercent / 100;
    // Calculate post-handover total
    postHandoverTotal = (inputs.postHandoverPayments || []).reduce(
      (sum, p) => sum + (basePrice * p.paymentPercent / 100), 0
    );
  } else {
    // Standard plan: handover is the remaining balance
    handoverPercent = 100 - inputs.preHandoverPercent;
    handoverAmount = basePrice * handoverPercent / 100;
  }
  
  // Entry subtotal (before fees)
  const entrySubtotal = downpaymentAmount;
  
  // Entry total (with fees)
  const entryTotal = downpaymentAmount + dldFee + oqoodFee;
  
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

  // Sort additional payments (pre-handover installments)
  const sortedPayments = [...(additionalPayments || [])].sort((a, b) => {
    if (a.type === 'time' && b.type === 'time') return a.triggerValue - b.triggerValue;
    if (a.type === 'construction' && b.type === 'construction') return a.triggerValue - b.triggerValue;
    return a.type === 'time' ? -1 : 1;
  });

  // For post-handover plans, filter out payments that fall after handover (they're in postHandoverPayments)
  const preHandoverPayments = hasPostHandoverPlan
    ? sortedPayments.filter(p => {
        if (p.type !== 'time') return true; // construction-based = pre-handover
        return !isPaymentPostHandover(p.triggerValue, bookingMonth, bookingYear, handoverQuarter, handoverYear);
      })
    : sortedPayments;

  // Calculate journey total (pre-handover installments excluding downpayment)
  const journeyTotal = preHandoverPayments.reduce(
    (sum, p) => sum + (basePrice * p.paymentPercent / 100), 0
  );

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
              <span>Q{handoverQuarter} {handoverYear}</span>
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
                  
                  // Check for handover indicators
                  const isHandoverQuarter = payment.type === 'time' && isPaymentInHandoverQuarter(
                    payment.triggerValue,
                    bookingMonth,
                    bookingYear,
                    handoverQuarter,
                    handoverYear
                  );
                  
                  return (
                    <div 
                      key={index}
                      className={cn(
                        "flex items-center justify-between gap-2",
                        isHandoverQuarter && "bg-green-500/10 rounded px-1 py-0.5 -mx-1"
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
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-mono text-theme-text">{getDualValue(amount).primary}</div>
                        {currency !== 'AED' && (
                          <div className="text-[10px] text-theme-text-muted">{getDualValue(amount).secondary}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="pt-1 border-t border-theme-border mt-1">
                  <DottedRow 
                    label="Subtotal"
                    value={getDualValue(journeyTotal).primary}
                    secondaryValue={getDualValue(journeyTotal).secondary}
                    bold
                    valueClassName="text-cyan-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Handover - only show for standard plans OR if onHandoverPercent > 0 */}
          {(!hasPostHandoverPlan || handoverPercent > 0) && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-green-400 font-semibold mb-2">
                {hasPostHandoverPlan ? `On Handover (${handoverPercent}%)` : `Handover (${handoverPercent}%)`}
              </div>
              <div className="space-y-1">
                <DottedRow 
                  label={hasPostHandoverPlan ? "Handover Payment" : "Final Payment"}
                  value={getDualValue(handoverAmount).primary}
                  secondaryValue={getDualValue(handoverAmount).secondary}
                  bold
                  valueClassName="text-green-400"
                />
              </div>
            </div>
          )}

          {/* Section: Post-Handover Installments - only for post-handover plans */}
          {hasPostHandoverPlan && (inputs.postHandoverPayments || []).length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-purple-400 font-semibold mb-2">
                Post-Handover ({((inputs.postHandoverPayments || []).reduce((sum, p) => sum + p.paymentPercent, 0)).toFixed(0)}%)
              </div>
              <div className="space-y-1">
                {(inputs.postHandoverPayments || []).map((payment, index) => {
                  const amount = basePrice * (payment.paymentPercent / 100);
                  const monthsAfterHandover = payment.triggerValue;
                  const dateStr = getPostHandoverDate(monthsAfterHandover, handoverQuarter, handoverYear, language);
                  const label = `Month +${monthsAfterHandover} (${dateStr})`;
                  
                  return (
                    <div key={index} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-theme-text-muted truncate">{label}</span>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-mono text-theme-text">{getDualValue(amount).primary}</div>
                        {currency !== 'AED' && (
                          <div className="text-[10px] text-theme-text-muted">{getDualValue(amount).secondary}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="pt-1 border-t border-theme-border mt-1">
                  <DottedRow 
                    label="Subtotal Post-Handover"
                    value={getDualValue(postHandoverTotal).primary}
                    secondaryValue={getDualValue(postHandoverTotal).secondary}
                    bold
                    valueClassName="text-purple-400"
                  />
                </div>
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
