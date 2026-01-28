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

// Check if a payment is post-handover (at or after handover quarter start)
const isPaymentPostHandover = (
  monthsFromBooking: number,
  bookingMonth: number,
  bookingYear: number,
  handoverQuarter: number,
  handoverYear: number
): boolean => {
  const totalMonthsFromStart = bookingMonth + monthsFromBooking;
  const paymentYearOffset = Math.floor((totalMonthsFromStart - 1) / 12);
  const paymentMonth = ((totalMonthsFromStart - 1) % 12) + 1;
  const paymentYear = bookingYear + paymentYearOffset;
  
  const handoverMonthStart = (handoverQuarter - 1) * 3 + 1;
  const handoverDate = new Date(handoverYear, handoverMonthStart - 1);
  const paymentDate = new Date(paymentYear, paymentMonth - 1);
  
  return paymentDate >= handoverDate;
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
  
  // If empty, derive from additionalPayments (time-based payments at/after handover)
  if (postHandoverPaymentsToUse.length === 0 && inputs.additionalPayments?.length > 0) {
    postHandoverPaymentsToUse = inputs.additionalPayments.filter(p => {
      if (p.type !== 'time') return false;
      return isPaymentPostHandover(
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
  
  // Calculate total post-handover payments
  const postHandoverTotal = postHandoverPaymentsToUse.reduce(
    (sum, p) => sum + (basePrice * p.paymentPercent / 100), 0
  );

  // Calculate duration in months (from handover to post-handover end)
  const handoverMonth = (inputs.handoverQuarter - 1) * 3 + 1;
  const handoverDate = new Date(inputs.handoverYear, handoverMonth - 1);
  const endMonth = (inputs.postHandoverEndQuarter - 1) * 3 + 1;
  const endDate = new Date(inputs.postHandoverEndYear, endMonth - 1);
  
  const postHandoverMonths = Math.max(1, 
    (endDate.getFullYear() - handoverDate.getFullYear()) * 12 + 
    (endDate.getMonth() - handoverDate.getMonth())
  );

  // Monthly equivalent payment
  const monthlyEquivalent = postHandoverTotal / postHandoverMonths;

  // Cashflow calculation
  const monthlyCashflow = monthlyRent - monthlyEquivalent;
  const coveragePercent = monthlyEquivalent > 0 
    ? Math.round((monthlyRent / monthlyEquivalent) * 100) 
    : 0;
  const isFullyCovered = monthlyCashflow >= 0;
  const isPartiallyCovered = monthlyRent > 0 && monthlyRent < monthlyEquivalent;
  const isNotCovered = monthlyRent === 0;

  // Total gap over the period
  const totalGap = Math.abs(monthlyCashflow) * postHandoverMonths;

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
          {postHandoverMonths}{t('monthsShort')} @ {endDateStr}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Post-HO Total */}
        <DottedRow 
          label={`${t('postHandoverPayments')} (${inputs.postHandoverPercent || 0}%)`}
          value={getDualValue(postHandoverTotal).primary}
          secondaryValue={getDualValue(postHandoverTotal).secondary}
        />
        
        {/* Monthly Equivalent */}
        <DottedRow 
          label={t('monthlyEquivalent')}
          value={`${getDualValue(monthlyEquivalent).primary}/mo`}
          bold
          valueClassName="text-purple-400"
        />
        
        {/* Rental Income */}
        <DottedRow 
          label={t('rentalIncome')}
          value={`+${getDualValue(monthlyRent).primary}/mo`}
          valueClassName="text-cyan-400"
        />
        
        {/* Monthly Gap/Surplus */}
        <div className="pt-2 border-t border-border">
          <DottedRow 
            label={isFullyCovered ? t('monthlySurplus') : t('monthlyGap')}
            value={`${isFullyCovered ? '+' : '-'}${getDualValue(Math.abs(monthlyCashflow)).primary}/mo`}
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
                {getDualValue(totalGap).primary} {t('totalGapOver')} {postHandoverMonths}{t('monthsShort')}
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
