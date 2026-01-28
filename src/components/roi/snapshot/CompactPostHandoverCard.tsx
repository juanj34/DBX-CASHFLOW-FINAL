import { RefreshCw, TrendingUp, TrendingDown, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { OIInputs, PaymentMilestone } from '../useOICalculations';
import { Currency, formatDualCurrency } from '../currencyUtils';
import { DottedRow } from './DottedRow';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompactPostHandoverCardProps {
  inputs: OIInputs;
  monthlyRent: number;
  currency: Currency;
  rate: number;
}

// Check if a payment is AFTER the handover quarter (strictly after Q end, not start)
// Must match the logic in CompactPaymentTable.tsx
const isPaymentAfterHandoverQuarter = (
  monthsFromBooking: number,
  bookingMonth: number,
  bookingYear: number,
  handoverQuarter: number,
  handoverYear: number
): boolean => {
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);
  
  // Handover quarter END = last month of quarter (Q3 = Sep = month 9)
  const handoverQuarterEndMonth = handoverQuarter * 3;
  const handoverQuarterEnd = new Date(handoverYear, handoverQuarterEndMonth - 1, 28);
  
  return paymentDate > handoverQuarterEnd;
};

export const CompactPostHandoverCard = ({
  inputs,
  monthlyRent,
  currency,
  rate,
}: CompactPostHandoverCardProps) => {
  const { t } = useLanguage();
  
  // Only show if post-handover plan is enabled
  if (!inputs.hasPostHandoverPlan) return null;

  const basePrice = inputs.basePrice;
  
  // First try dedicated postHandoverPayments array
  let postHandoverPaymentsToUse: PaymentMilestone[] = inputs.postHandoverPayments || [];
  
  // If empty, derive from additionalPayments (time-based payments AFTER handover quarter end)
  if (postHandoverPaymentsToUse.length === 0 && inputs.additionalPayments?.length > 0) {
    postHandoverPaymentsToUse = inputs.additionalPayments.filter(p => {
      if (p.type !== 'time') return false;
      return isPaymentAfterHandoverQuarter(
        p.triggerValue,
        inputs.bookingMonth,
        inputs.bookingYear,
        inputs.handoverQuarter,
        inputs.handoverYear
      );
    });
  }
  
  // Return null only if no post-handover payments found
  if (postHandoverPaymentsToUse.length === 0) return null;
  
  // Calculate post-handover percentage from actual payments
  const postHandoverPercent = postHandoverPaymentsToUse.reduce(
    (sum, p) => sum + p.paymentPercent, 0
  );
  
  // Calculate total post-handover payments
  const postHandoverTotal = basePrice * (postHandoverPercent / 100);
  
  // Count actual number of payments
  const numberOfPayments = postHandoverPaymentsToUse.length;

  // Calculate duration from actual payment schedule (not calendar months)
  const paymentMonths = postHandoverPaymentsToUse.map(p => p.triggerValue);
  const lastPaymentMonth = Math.max(...paymentMonths);
  const firstPaymentMonth = Math.min(...paymentMonths);
  const actualDurationMonths = Math.max(1, lastPaymentMonth - firstPaymentMonth + 1);

  // Per installment amount (what user actually pays each time)
  const perInstallmentAmount = postHandoverTotal / numberOfPayments;

  // Monthly cashflow burn rate (spread over actual payment period)
  const monthlyEquivalent = postHandoverTotal / actualDurationMonths;

  // Cashflow calculation
  const monthlyCashflow = monthlyRent - monthlyEquivalent;
  const coveragePercent = monthlyEquivalent > 0 
    ? Math.round((monthlyRent / monthlyEquivalent) * 100) 
    : 0;
  const isFullyCovered = monthlyCashflow >= 0;
  const isPartiallyCovered = monthlyRent > 0 && monthlyRent < monthlyEquivalent;
  const isNotCovered = monthlyRent === 0;

  // Total gap over the period
  const totalGap = Math.abs(monthlyCashflow) * actualDurationMonths;

  // Dual currency helper
  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };

  // Format end date for badge
  const endDateStr = `Q${inputs.postHandoverEndQuarter} ${inputs.postHandoverEndYear}`;

  // Get coverage status
  const getCoverageStatus = () => {
    if (isNotCovered) {
      return {
        icon: XCircle,
        label: t('noCoverage'),
        className: 'bg-red-500/10 border-red-500/30 text-red-400',
        description: t('noRentalIncomeConfigured')
      };
    }
    if (isFullyCovered) {
      return {
        icon: CheckCircle,
        label: t('fullCoverage'),
        className: 'bg-green-500/10 border-green-500/30 text-green-400',
        description: `${t('rentCovers')} ${coveragePercent}%+`
      };
    }
    return {
      icon: AlertCircle,
      label: t('partialCoverage'),
      className: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      description: `${t('rentCovers')} ${coveragePercent}%`
    };
  };

  const status = getCoverageStatus();
  const StatusIcon = status.icon;

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-theme-text uppercase tracking-wide">
            {t('postHandoverCoverage')}
          </span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
          {actualDurationMonths}{t('monthsShort')} ({numberOfPayments} payments)
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Post-HO Total */}
        <DottedRow 
          label={`${t('postHandoverPayments')} (${Math.round(postHandoverPercent)}%)`}
          value={getDualValue(postHandoverTotal).primary}
          secondaryValue={getDualValue(postHandoverTotal).secondary}
        />
        
        {/* Per Installment Amount */}
        <DottedRow 
          label={`Per Installment (${numberOfPayments}x)`}
          value={getDualValue(perInstallmentAmount).primary}
          secondaryValue={getDualValue(perInstallmentAmount).secondary}
          bold
          valueClassName="text-purple-400"
        />
        
        {/* Monthly Equivalent (spread rate) */}
        <DottedRow 
          label={`${t('monthlyEquivalent')} (${actualDurationMonths}mo)`}
          value={`${getDualValue(monthlyEquivalent).primary}/mo`}
          secondaryValue={currency !== 'AED' ? `${getDualValue(monthlyEquivalent).secondary}/mo` : null}
        />
        
        {/* Rental Income */}
        <DottedRow 
          label={t('rentalIncome')}
          value={`+${getDualValue(monthlyRent).primary}/mo`}
          secondaryValue={currency !== 'AED' ? `+${getDualValue(monthlyRent).secondary}/mo` : null}
          valueClassName="text-cyan-400"
        />
        
        {/* Monthly Gap/Surplus */}
        <div className="pt-2 border-t border-border">
          <DottedRow 
            label={isFullyCovered ? t('monthlySurplus') : t('monthlyGap')}
            value={`${isFullyCovered ? '+' : '-'}${getDualValue(Math.abs(monthlyCashflow)).primary}/mo`}
            secondaryValue={currency !== 'AED' ? `${isFullyCovered ? '+' : '-'}${getDualValue(Math.abs(monthlyCashflow)).secondary}/mo` : null}
            bold
            valueClassName={isFullyCovered ? 'text-green-400' : 'text-red-400'}
          />
        </div>
        
        {/* Summary badges */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 border ${status.className}`}>
            <StatusIcon className="w-2.5 h-2.5" />
            {status.label}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground flex items-center gap-1">
            {isFullyCovered ? (
              <>
                <TrendingUp className="w-2.5 h-2.5 text-green-400" />
                {status.description}
              </>
            ) : (
              <>
                <TrendingDown className="w-2.5 h-2.5 text-red-400" />
                {getDualValue(totalGap).primary} {t('totalGapOver')} {actualDurationMonths}{t('monthsShort')}
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
