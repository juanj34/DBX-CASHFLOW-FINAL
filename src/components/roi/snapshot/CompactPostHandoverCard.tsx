import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { OIInputs, PaymentMilestone } from '../useOICalculations';
import { Currency, formatDualCurrency, calculateAverageMonthlyRent } from '../currencyUtils';
import { DottedRow } from './DottedRow';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface CompactPostHandoverCardProps {
  inputs: OIInputs;
  monthlyRent: number; // Year 1 rent
  rentGrowthRate: number; // Annual growth rate %
  currency: Currency;
  rate: number;
}

// Local translations for post-handover card (inline to avoid context issues)
const translations = {
  postHandoverCoverage: { en: 'Post-Handover Coverage', es: 'Cobertura Post-Entrega' },
  postHandoverPayments: { en: 'Post-HO Payments', es: 'Pagos Post-Entrega' },
  perInstallment: { en: 'Per Installment', es: 'Por Cuota' },
  monthlyPayment: { en: 'Monthly Payment', es: 'Pago Mensual' },
  monthlyRentLabel: { en: 'Monthly Rent', es: 'Renta Mensual' },
  monthlyGap: { en: 'Monthly Gap', es: 'Diferencia Mensual' },
  monthlySurplus: { en: 'Monthly Surplus', es: 'Excedente Mensual' },
  onHandover: { en: 'On Handover', es: 'En Entrega' },
  tenantCovers: { en: 'Tenant Covers', es: 'El Inquilino Cubre' },
  youPay: { en: 'You Pay', es: 'Tú Pagas' },
  tenantFullyCovers: { en: 'Tenant fully covers!', es: '¡El inquilino cubre totalmente!' },
  surplus: { en: 'surplus', es: 'excedente' },
  net: { en: 'Net', es: 'Neto' },
  payments: { en: 'payments', es: 'pagos' },
  mo: { en: 'mo', es: 'mes' },
  avgShort: { en: 'Avg', es: 'Prom' },
  year1: { en: 'Y1', es: 'A1' },
  yearsShort: { en: 'yr', es: 'año' },
};

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
  rentGrowthRate,
  currency,
  rate,
}: CompactPostHandoverCardProps) => {
  const { language } = useLanguage();
  
  // Local translation function using inline translations
  const t = (key: keyof typeof translations) => translations[key][language];
  
  // Only show if post-handover plan is enabled
  if (!inputs.hasPostHandoverPlan) return null;

  const basePrice = inputs.basePrice;
  
  // On-handover payment (what's due at handover, separate from post-HO installments)
  const onHandoverPercent = inputs.onHandoverPercent || 0;
  const onHandoverAmount = basePrice * (onHandoverPercent / 100);
  
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
  const actualDurationYears = actualDurationMonths / 12;

  // Calculate average rent over the post-handover period for accurate coverage
  const averageMonthlyRent = calculateAverageMonthlyRent(monthlyRent, rentGrowthRate, Math.ceil(actualDurationYears));

  // Per installment amount (what user actually pays each time)
  const perInstallmentAmount = postHandoverTotal / numberOfPayments;

  // Monthly cashflow burn rate (spread over actual payment period)
  const monthlyEquivalent = postHandoverTotal / actualDurationMonths;

  // Cashflow calculation using average rent
  const monthlyCashflow = averageMonthlyRent - monthlyEquivalent;
  const isFullyCovered = monthlyCashflow >= 0;

  // Total tenant contribution over the post-handover period (using average rent)
  const totalTenantContribution = averageMonthlyRent * actualDurationMonths;

  // What investor actually pays out of pocket (after tenant covers portion)
  const netOutOfPocket = Math.max(0, postHandoverTotal - totalTenantContribution);

  // Coverage percentage (how much of post-HO is covered by tenant)
  const tenantCoversPercent = postHandoverTotal > 0 
    ? Math.min(100, Math.round((totalTenantContribution / postHandoverTotal) * 100))
    : 0;

  // Surplus if tenant pays more than post-HO
  const surplus = totalTenantContribution - postHandoverTotal;

  // Dual currency helper
  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };

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
          {actualDurationMonths}{t('mo')} ({numberOfPayments} {t('payments')})
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
          label={`${t('perInstallment')} (${numberOfPayments}x)`}
          value={getDualValue(perInstallmentAmount).primary}
          secondaryValue={getDualValue(perInstallmentAmount).secondary}
          valueClassName="text-purple-400"
        />
        
        {/* Monthly Cashflow Analysis */}
        <div className="pt-2 mt-1 border-t border-dashed border-theme-border/50 space-y-1">
          <DottedRow 
            label={t('monthlyPayment')}
            value={`${getDualValue(monthlyEquivalent).primary}/${t('mo')}`}
            secondaryValue={getDualValue(monthlyEquivalent).secondary}
          />
          <DottedRow 
            label={`${t('monthlyRentLabel')} (${t('avgShort')})`}
            value={`+${getDualValue(averageMonthlyRent).primary}/${t('mo')}`}
            secondaryValue={getDualValue(averageMonthlyRent).secondary}
            valueClassName="text-cyan-400"
          />
          {/* Year 1 reference */}
          <div className="text-[9px] text-theme-text-muted text-right -mt-1">
            {t('year1')}: {getDualValue(monthlyRent).primary} → {rentGrowthRate}%/{t('yearsShort')}
          </div>
          <DottedRow 
            label={isFullyCovered ? t('monthlySurplus') : t('monthlyGap')}
            value={`${isFullyCovered ? '+' : '-'}${getDualValue(Math.abs(monthlyCashflow)).primary}/${t('mo')}`}
            secondaryValue={getDualValue(Math.abs(monthlyCashflow)).secondary}
            bold
            valueClassName={isFullyCovered ? "text-green-400" : "text-red-400"}
          />
        </div>
        
        {/* Simple Summary */}
        <div className="pt-2 mt-1 border-t border-theme-border space-y-1">
          {/* On Handover Payment - what's due on handover day */}
          {onHandoverAmount > 0 && (
            <DottedRow 
              label={t('onHandover')}
              value={getDualValue(onHandoverAmount).primary}
              secondaryValue={getDualValue(onHandoverAmount).secondary}
              valueClassName="text-yellow-400"
            />
          )}
          <DottedRow 
            label={`${t('tenantCovers')} (${actualDurationMonths}${t('mo')} ${t('avgShort')})`}
            value={`+${getDualValue(totalTenantContribution).primary}`}
            secondaryValue={getDualValue(totalTenantContribution).secondary}
            valueClassName="text-cyan-400"
          />
          <DottedRow 
            label={t('youPay')}
            value={getDualValue(netOutOfPocket).primary}
            secondaryValue={getDualValue(netOutOfPocket).secondary}
            bold
            valueClassName={netOutOfPocket > 0 ? "text-red-400" : "text-green-400"}
          />
        </div>
        
        {/* Status Badge */}
        <div className="pt-1.5 mt-1 border-t border-theme-border">
          <div className={cn(
            "p-2 rounded-lg text-center text-[11px]",
            tenantCoversPercent >= 100 
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
          )}>
            {tenantCoversPercent >= 100 ? (
              <span className="flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {t('tenantFullyCovers')} +{getDualValue(surplus).primary} {t('surplus')}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {t('tenantCovers')} {tenantCoversPercent}% • {t('net')}: {getDualValue(netOutOfPocket).primary}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
