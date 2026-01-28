import { QuoteWithCalculations, ComparisonMetrics } from '@/hooks/useQuotesComparison';
import { formatCurrency } from '@/components/roi/currencyUtils';

interface MetricsTableProps {
  quotesWithCalcs: QuoteWithCalculations[];
  metrics: ComparisonMetrics;
}

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
    <div className="grid items-center border-b border-[#2a3142] py-3" 
      style={{ gridTemplateColumns: `180px repeat(${values.length}, minmax(120px, 1fr))` }}>
      <span className="text-gray-400 text-sm">{label}</span>
      {values.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="font-medium text-white">
            {formatter(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const MetricsTable = ({ quotesWithCalcs, metrics }: MetricsTableProps) => {
  const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500', '#FF6B6B', '#4ECDC4'];

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
      // Use stored postHandoverPercent if available
      const postHandover = quote.inputs.postHandoverPercent ?? 
        (100 - preHandoverTotal - onHandover);
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
      <div className="grid border-b border-[#2a3142] pb-3 mb-2" 
        style={{ gridTemplateColumns: `180px repeat(${quotesWithCalcs.length}, minmax(120px, 1fr))` }}>
        <span className="text-theme-text-muted text-sm">Metric</span>
        {quotesWithCalcs.map((q, idx) => (
          <span 
            key={q.quote.id} 
            className="font-medium text-sm truncate pr-2"
            style={{ color: colors[idx % colors.length] }}
          >
            {q.quote.title || q.quote.projectName || 'Quote'}
          </span>
        ))}
      </div>

      <div className="space-y-0">
        {/* Developer */}
        <MetricRow
          label="Developer"
          values={quotesWithCalcs.map(q => ({ value: q.quote.developer || 'N/A' }))}
          formatter={(v) => v}
        />
        {/* Payment Plan */}
        <MetricRow
          label="Payment Plan"
          values={quotesWithCalcs.map(q => ({ value: getPaymentPlanLabel(q.quote) }))}
          formatter={(v) => v.type === 'post-handover' 
            ? `Post-HO ${v.label}` 
            : `Standard ${v.label}`}
        />
        <MetricRow
          label="Base Price"
          values={metrics.basePrice}
          formatter={(v) => formatCurrency(v, 'AED', 1)}
        />
        <MetricRow
          label="Price / sqft"
          values={metrics.pricePerSqft}
          formatter={(v) => v !== null ? `AED ${Math.round(v).toLocaleString()}` : 'N/A'}
        />
        {/* Handover Date with time to completion */}
        <MetricRow
          label="Handover"
          values={quotesWithCalcs.map(q => ({ 
            value: `${formatHandoverDate(q.quote)} (${getTimeToCompletion(q.quote)})` 
          }))}
          formatter={(v) => v}
        />
        {/* Monthly Burn Rate */}
        <MetricRow
          label="Monthly Burn"
          values={quotesWithCalcs.map(q => ({ value: getMonthlyBurn(q) }))}
          formatter={(v) => formatCurrency(v, 'AED', 1)}
        />
        <MetricRow
          label="Total Investment"
          values={metrics.totalInvestment}
          formatter={(v) => formatCurrency(v, 'AED', 1)}
        />
        {/* Pre-Handover Amount */}
        <MetricRow
          label="Pre-Handover"
          values={quotesWithCalcs.map(q => ({ 
            value: q.quote.inputs.basePrice * q.quote.inputs.preHandoverPercent / 100 
          }))}
          formatter={(v) => formatCurrency(v, 'AED', 1)}
        />
        {/* On Handover Amount */}
        <MetricRow
          label="On Handover"
          values={quotesWithCalcs.map(q => {
            const hasPostHandover = q.quote.inputs.hasPostHandoverPlan;
            const onHandoverPercent = hasPostHandover 
              ? (q.quote.inputs.onHandoverPercent || 0)
              : (100 - q.quote.inputs.preHandoverPercent);
            return { value: q.quote.inputs.basePrice * onHandoverPercent / 100 };
          })}
          formatter={(v) => formatCurrency(v, 'AED', 1)}
        />
        {/* Post-Handover Amount - always show */}
        <MetricRow
          label="Post-Handover"
          values={quotesWithCalcs.map(q => {
            if (!q.quote.inputs.hasPostHandoverPlan) return { value: 0 };
            // Use stored postHandoverPercent if available
            const postPercent = q.quote.inputs.postHandoverPercent ?? 
              (100 - q.quote.inputs.preHandoverPercent - (q.quote.inputs.onHandoverPercent || 0));
            return { value: q.quote.inputs.basePrice * postPercent / 100 };
          })}
          formatter={(v) => v > 0 ? formatCurrency(v, 'AED', 1) : '—'}
        />
        {/* Y1 Rent Income */}
        <MetricRow
          label="Y1 Rent Income"
          values={quotesWithCalcs.map(q => ({ value: getY1RentIncome(q) }))}
          formatter={(v) => v > 0 ? formatCurrency(v, 'AED', 1) : 'N/A'}
        />
        <MetricRow
          label="Rental Yield"
          values={metrics.rentalYieldY1}
          formatter={(v) => v !== null ? `${v.toFixed(1)}%` : 'N/A'}
        />
      </div>
    </div>
  );
};

export default MetricsTable;
