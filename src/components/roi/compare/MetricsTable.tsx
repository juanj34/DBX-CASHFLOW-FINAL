import { QuoteWithCalculations, ComparisonMetrics } from '@/hooks/useQuotesComparison';
import { formatCurrency, formatDualCurrency, Currency } from '@/components/roi/currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getQuoteDisplayName } from './utils';

interface MetricsTableProps {
  quotesWithCalcs: QuoteWithCalculations[];
  metrics: ComparisonMetrics;
  currency?: Currency;
  exchangeRate?: number;
}

// Theme-aware colors for quotes
const getQuoteColors = (isLightTheme: boolean) => 
  isLightTheme 
    ? ['#B8860B', '#1e40af', '#7c3aed', '#c2410c', '#0f766e', '#be185d']  // Gold, blue, purple, orange, teal, pink
    : ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500', '#FF6B6B', '#4ECDC4']; // Lime, cyan, magenta, orange, coral, teal

const MetricRow = ({ 
  label, 
  values, 
  formatter = (v: any) => v?.toString() ?? 'N/A',
}: { 
  label: string; 
  values: { value: any }[];
  formatter?: (value: any) => string;
}) => {
  return (
    <div className="grid items-center border-b border-theme-border py-3" 
      style={{ gridTemplateColumns: `180px repeat(${values.length}, minmax(120px, 1fr))` }}>
      <span className="text-theme-text-muted text-sm">{label}</span>
      {values.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="font-medium text-theme-text">
            {formatter(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const MetricsTable = ({ quotesWithCalcs, metrics, currency = 'AED', exchangeRate = 1 }: MetricsTableProps) => {
  const { theme } = useTheme();
  const isLightTheme = theme === 'consultant';
  const colors = getQuoteColors(isLightTheme);
  const { t } = useLanguage();
  
  // Dual currency formatting - shows AED primary with converted value in parentheses
  const fmtDual = (v: number): string => {
    const { primary, secondary } = formatDualCurrency(v, currency, exchangeRate);
    if (!secondary) return primary;
    return `${primary} (${secondary})`;
  };

  // Format handover date as "Q# YYYY"
  const formatHandoverDate = (quote: QuoteWithCalculations['quote']) => {
    const q = quote.inputs.handoverQuarter;
    const y = quote.inputs.handoverYear;
    return `Q${q} ${y}`;
  };

  // Calculate time to completion
  const getTimeToCompletion = (quote: QuoteWithCalculations['quote']) => {
    const now = new Date();
    const handoverDate = new Date(quote.inputs.handoverYear, (quote.inputs.handoverQuarter - 1) * 3, 1);
    const diffMonths = Math.max(0, (handoverDate.getFullYear() - now.getFullYear()) * 12 + 
      (handoverDate.getMonth() - now.getMonth()));
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years > 0 && months > 0) return `${years}y ${months}m`;
    if (years > 0) return `${years}y`;
    if (months > 0) return `${months}m`;
    return 'Now';
  };

  // Get payment plan label (Standard vs Post-HO with percentage breakdown)
  const getPaymentPlanLabel = (quote: QuoteWithCalculations['quote']) => {
    const hasPostHandover = quote.inputs.hasPostHandoverPlan;
    const preHandoverTotal = quote.inputs.preHandoverPercent;
    
    if (hasPostHandover) {
      const onHandover = quote.inputs.onHandoverPercent || 0;
      const postHandover = quote.inputs.postHandoverPercent || 0;
      return {
        type: 'post-handover',
        label: `${Math.round(preHandoverTotal)}/${Math.round(onHandover)}/${Math.round(postHandover)}`
      };
    } else {
      const onHandover = 100 - preHandoverTotal;
      return {
        type: 'standard',
        label: `${Math.round(preHandoverTotal)}/${Math.round(onHandover)}`
      };
    }
  };

  // Calculate monthly burn rate
  const getMonthlyBurn = (item: QuoteWithCalculations) => {
    const totalPreHandover = item.calculations.totalEntryCosts + 
      (item.quote.inputs.basePrice * item.quote.inputs.preHandoverPercent / 100);
    return totalPreHandover / item.calculations.totalMonths;
  };

  // Get Y1 rent income in AED
  const getY1RentIncome = (item: QuoteWithCalculations) => {
    const grossAnnualRent = item.quote.inputs.basePrice * (item.quote.inputs.rentalYieldPercent / 100);
    return grossAnnualRent;
  };

  return (
    <div className="space-y-0">
      {/* Header row with quote names */}
      <div className="grid border-b border-theme-border pb-3 mb-2" 
        style={{ gridTemplateColumns: `180px repeat(${quotesWithCalcs.length}, minmax(120px, 1fr))` }}>
        <span className="text-theme-text-muted text-sm">{t('metric') || 'Metric'}</span>
        {quotesWithCalcs.map((q, idx) => (
          <span 
            key={q.quote.id} 
            className="font-medium text-sm truncate pr-2"
            style={{ color: colors[idx % colors.length] }}
          >
            {getQuoteDisplayName(q.quote.title, q.quote.projectName)}
          </span>
        ))}
      </div>

      <div className="space-y-0">
        {/* Developer */}
        <MetricRow
          label={t('developer')}
          values={quotesWithCalcs.map(q => ({ value: q.quote.developer || 'N/A' }))}
          formatter={(v) => v}
        />
        {/* Payment Plan */}
        <MetricRow
          label={t('paymentPlan')}
          values={quotesWithCalcs.map(q => ({ value: getPaymentPlanLabel(q.quote) }))}
          formatter={(v) => v.type === 'post-handover' 
            ? `Post-HO ${v.label}` 
            : `${t('standard') || 'Standard'} ${v.label}`}
        />
        <MetricRow
          label={t('basePropertyPrice') || 'Base Price'}
          values={metrics.basePrice}
          formatter={(v) => fmtDual(v)}
        />
        <MetricRow
          label={t('pricePerSqft')}
          values={metrics.pricePerSqft}
          formatter={(v) => v !== null ? fmtDual(v) : 'N/A'}
        />
        {/* Handover Date with time to completion */}
        <MetricRow
          label={t('handoverDate') || 'Handover'}
          values={quotesWithCalcs.map(q => ({ 
            value: `${formatHandoverDate(q.quote)} (${getTimeToCompletion(q.quote)})` 
          }))}
          formatter={(v) => v}
        />
        {/* Monthly Burn Rate */}
        <MetricRow
          label={t('monthlyBurn') || 'Monthly Burn'}
          values={quotesWithCalcs.map(q => ({ value: getMonthlyBurn(q) }))}
          formatter={(v) => fmtDual(v)}
        />
        <MetricRow
          label={t('totalInvestmentLabel') || 'Total Investment'}
          values={metrics.totalInvestment}
          formatter={(v) => fmtDual(v)}
        />
        {/* Pre-Handover Amount (everything paid until handover) */}
        <MetricRow
          label={t('preHandover') || 'Pre-Handover'}
          values={quotesWithCalcs.map(q => {
            const basePrice = q.quote.inputs.basePrice;
            
            if (q.quote.inputs.hasPostHandoverPlan) {
              // Post-handover plan: downpayment + pre-handover installments + on-handover
              const downpaymentPercent = q.quote.inputs.downpaymentPercent || 0;
              const preHandoverPercent = q.quote.inputs.preHandoverPercent || 0;
              const onHandoverPercent = q.quote.inputs.onHandoverPercent || 0;
              return { value: basePrice * ((downpaymentPercent + preHandoverPercent + onHandoverPercent) / 100) };
            } else {
              // Standard plan: 100% is paid by handover
              return { value: basePrice };
            }
          })}
          formatter={(v) => fmtDual(v)}
        />
        {/* On Handover Amount */}
        <MetricRow
          label={t('onHandover') || 'On Handover'}
          values={quotesWithCalcs.map(q => {
            const hasPostHandover = q.quote.inputs.hasPostHandoverPlan;
            
            if (!hasPostHandover) {
              const onHandoverPercent = 100 - q.quote.inputs.preHandoverPercent;
              return { value: q.quote.inputs.basePrice * onHandoverPercent / 100 };
            }
            
            // Check if payments already sum to 100%
            const totalAdditionalPercent = (q.quote.inputs.additionalPayments || []).reduce(
              (sum, p) => sum + p.paymentPercent, 0
            );
            const totalAllocatedPercent = q.quote.inputs.downpaymentPercent + totalAdditionalPercent;
            
            // If payments sum to 100%, on-handover is effectively 0
            if (Math.abs(totalAllocatedPercent - 100) < 0.5) {
              return { value: 0 };
            }
            
            const onHandoverPercent = q.quote.inputs.onHandoverPercent || 0;
            return { value: q.quote.inputs.basePrice * onHandoverPercent / 100 };
          })}
          formatter={(v) => v > 0 ? fmtDual(v) : '—'}
        />
        {/* Post-Handover Amount - always show */}
        <MetricRow
          label={t('postHandover') || 'Post-Handover'}
          values={quotesWithCalcs.map(q => {
            if (!q.quote.inputs.hasPostHandoverPlan) return { value: 0 };
            const postPercent = q.quote.inputs.postHandoverPercent || 0;
            return { value: q.quote.inputs.basePrice * postPercent / 100 };
          })}
          formatter={(v) => v > 0 ? fmtDual(v) : '—'}
        />
        {/* Post-Handover Payments Count */}
        <MetricRow
          label={t('postHandoverPayments') || 'Post-HO Payments'}
          values={quotesWithCalcs.map(q => {
            if (!q.quote.inputs.hasPostHandoverPlan) return { value: 0 };
            const postPayments = (q.quote.inputs.additionalPayments || [])
              .filter((p: any) => p.type === 'post-handover').length;
            const fromPostHandover = (q.quote.inputs.postHandoverPayments || []).length;
            return { value: postPayments + fromPostHandover };
          })}
          formatter={(v) => v > 0 ? `${v} ${t('payments') || 'payments'}` : '—'}
        />
        {/* Y1 Rent Income */}
        <MetricRow
          label={t('y1RentIncome') || 'Y1 Rent Income'}
          values={quotesWithCalcs.map(q => ({ value: getY1RentIncome(q) }))}
          formatter={(v) => v > 0 ? fmtDual(v) : 'N/A'}
        />
        {/* Rent at Year 5 */}
        <MetricRow
          label={t('rentYear5') || 'Rent (Year 5)'}
          values={quotesWithCalcs.map(q => {
            const year5Proj = q.calculations.yearlyProjections?.[4];
            const rentY5 = year5Proj?.annualRent;
            return { value: rentY5 && rentY5 > 0 ? rentY5 : null };
          })}
          formatter={(v) => v !== null ? fmtDual(v) : '—'}
        />
        {/* Value at Year 5 */}
        <MetricRow
          label={t('valueYear5') || 'Value (Year 5)'}
          values={quotesWithCalcs.map(q => {
            const year5Proj = q.calculations.yearlyProjections?.[4];
            const valueY5 = year5Proj?.propertyValue;
            return { value: valueY5 && valueY5 > 0 ? valueY5 : null };
          })}
          formatter={(v) => v !== null ? fmtDual(v) : '—'}
        />
        <MetricRow
          label={t('rentalYield')}
          values={metrics.rentalYieldY1}
          formatter={(v) => v !== null ? `${v.toFixed(1)}%` : 'N/A'}
        />
      </div>
    </div>
  );
};

export default MetricsTable;
