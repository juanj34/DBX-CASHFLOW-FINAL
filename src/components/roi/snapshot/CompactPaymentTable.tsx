import { CreditCard, ArrowRight } from 'lucide-react';
import { OIInputs, PaymentMilestone } from '../useOICalculations';
import { Currency, formatDualCurrency } from '../currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { DottedRow } from './DottedRow';

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

  // Dual currency helpers
  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
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
            <DottedRow 
              label={`Downpayment (${downpaymentPercent}%)`}
              value={getDualValue(downpaymentAmount).primary}
              secondaryValue={getDualValue(downpaymentAmount).secondary}
            />
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
                const labelWithDate = dateStr ? `${getPaymentLabel(payment)} (${dateStr})` : getPaymentLabel(payment);
                return (
                  <DottedRow 
                    key={index}
                    label={labelWithDate}
                    value={getDualValue(amount).primary}
                    secondaryValue={getDualValue(amount).secondary}
                  />
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

        {/* Section: Handover */}
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
        </div>

        {/* Grand Total */}
        <div className="pt-2 border-t border-theme-border">
          <DottedRow 
            label="Total Investment"
            value={getDualValue(grandTotal).primary}
            secondaryValue={getDualValue(grandTotal).secondary}
            bold
            className="text-sm"
            labelClassName="text-sm"
            valueClassName="text-sm"
          />
        </div>
      </div>
    </div>
  );
};
