import { CreditCard, ArrowRight } from 'lucide-react';
import { OIInputs, PaymentMilestone } from '../useOICalculations';
import { Currency, formatCurrency } from '../currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompactPaymentTableProps {
  inputs: OIInputs;
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

export const CompactPaymentTable = ({
  inputs,
  currency,
  rate,
  totalMonths,
}: CompactPaymentTableProps) => {
  const { language } = useLanguage();
  
  const { 
    basePrice, 
    downpaymentPercent, 
    preHandoverPercent, 
    additionalPayments, 
    bookingMonth, 
    bookingYear,
    handoverQuarter,
    handoverYear,
    oqoodFee 
  } = inputs;
  
  // Calculate amounts
  const downpaymentAmount = basePrice * (downpaymentPercent / 100);
  const dldFee = basePrice * 0.04;
  const handoverPercent = 100 - preHandoverPercent;
  const handoverAmount = basePrice * (handoverPercent / 100);
  
  // Entry total
  const entryTotal = downpaymentAmount + dldFee + oqoodFee;
  
  // Sort additional payments by trigger value
  const sortedPayments = [...additionalPayments].sort((a, b) => a.triggerValue - b.triggerValue);
  
  // Journey total
  const journeyTotal = sortedPayments.reduce((sum, p) => sum + (basePrice * p.paymentPercent / 100), 0);
  
  // Grand total
  const grandTotal = basePrice + dldFee + oqoodFee;
  
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

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden h-fit">
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-theme-accent" />
          <span className="text-xs font-semibold text-theme-text uppercase tracking-wide">Payment Breakdown</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-theme-text-muted">
          <span>{monthToDateString(bookingMonth, bookingYear, language)}</span>
          <ArrowRight className="w-3 h-3" />
          <span>Q{handoverQuarter} {handoverYear}</span>
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
            <div className="flex justify-between text-xs">
              <span className="text-theme-text-muted">Downpayment ({downpaymentPercent}%)</span>
              <span className="font-mono tabular-nums text-theme-text">{formatCurrency(downpaymentAmount, currency, rate)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-theme-text-muted">DLD Fee (4%)</span>
              <span className="font-mono tabular-nums text-theme-text">{formatCurrency(dldFee, currency, rate)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-theme-text-muted">Oqood/Admin</span>
              <span className="font-mono tabular-nums text-theme-text">{formatCurrency(oqoodFee, currency, rate)}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-theme-border mt-1">
              <span className="font-medium text-theme-text">Total Entry</span>
              <span className="font-mono tabular-nums font-bold text-theme-accent">{formatCurrency(entryTotal, currency, rate)}</span>
            </div>
          </div>
        </div>

        {/* Section: The Journey */}
        {sortedPayments.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-cyan-400 font-semibold mb-2">
              The Journey ({totalMonths}mo)
            </div>
            <div className="space-y-1">
              {sortedPayments.map((payment, index) => {
                const amount = basePrice * (payment.paymentPercent / 100);
                const dateStr = getPaymentDate(payment);
                return (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-theme-text-muted">
                      {getPaymentLabel(payment)}
                      {dateStr && <span className="text-theme-text-muted/60 ml-1">({dateStr})</span>}
                    </span>
                    <span className="font-mono tabular-nums text-theme-text">{formatCurrency(amount, currency, rate)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between text-xs pt-1 border-t border-theme-border mt-1">
                <span className="font-medium text-theme-text">Subtotal</span>
                <span className="font-mono tabular-nums font-medium text-cyan-400">{formatCurrency(journeyTotal, currency, rate)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Section: Handover */}
        <div>
          <div className="text-[10px] uppercase tracking-wide text-green-400 font-semibold mb-2">
            Handover ({handoverPercent}%)
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-theme-text-muted">Final Payment</span>
              <span className="font-mono tabular-nums font-bold text-green-400">{formatCurrency(handoverAmount, currency, rate)}</span>
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="pt-2 border-t border-theme-border">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-theme-text">Total Investment</span>
            <span className="font-mono tabular-nums font-bold text-theme-text">{formatCurrency(grandTotal, currency, rate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
