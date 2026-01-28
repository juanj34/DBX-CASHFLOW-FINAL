import { QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { formatCurrency, Currency } from '@/components/roi/currencyUtils';

interface PaymentComparisonProps {
  quotesWithCalcs: QuoteWithCalculations[];
  currency?: Currency;
  exchangeRate?: number;
}

export const PaymentComparison = ({ 
  quotesWithCalcs,
  currency = 'AED',
  exchangeRate = 1,
}: PaymentComparisonProps) => {
  const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500', '#FF6B6B', '#4ECDC4'];

  return (
    <div className="space-y-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${quotesWithCalcs.length}, minmax(200px, 1fr))` }}>
        {quotesWithCalcs.map((item, idx) => {
          const { quote, calculations } = item;
          const color = colors[idx % colors.length];
          
          // Check if post-handover plan
          const hasPostHandover = quote.inputs.hasPostHandoverPlan;
          
          // Calculate segments based on payment plan type
          const downpayment = quote.inputs.downpaymentPercent;
          const preHandoverTotal = quote.inputs.preHandoverPercent;
          const preHandoverInstallments = preHandoverTotal - downpayment;
          
          let onHandover: number;
          let postHandoverPercent: number;
          
          if (hasPostHandover) {
            onHandover = quote.inputs.onHandoverPercent || 0;
            postHandoverPercent = 100 - preHandoverTotal - onHandover;
          } else {
            onHandover = 100 - preHandoverTotal;
            postHandoverPercent = 0;
          }

          const basePrice = quote.inputs.basePrice;
          const downpaymentAmount = basePrice * (downpayment / 100);
          const preHandoverInstallmentsAmount = basePrice * (preHandoverInstallments / 100);
          const onHandoverAmount = basePrice * (onHandover / 100);
          const postHandoverAmount = basePrice * (postHandoverPercent / 100);

          // Payment plan label
          const paymentPlanLabel = hasPostHandover 
            ? `${Math.round(preHandoverTotal)}/${Math.round(onHandover)}/${Math.round(postHandoverPercent)}`
            : `${Math.round(preHandoverTotal)}/${Math.round(onHandover)}`;

          // Calculate monthly payment during construction
          const additionalPayments = quote.inputs.additionalPayments || [];
          
          // Calculate construction period from booking to handover
          const bookingDate = new Date(quote.inputs.bookingYear, quote.inputs.bookingMonth - 1, 1);
          const handoverMonth = (quote.inputs.handoverQuarter - 1) * 3 + 1;
          const handoverDate = new Date(quote.inputs.handoverYear, handoverMonth, 1);
          const constructionMonths = Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
          
          // Sum all installment payments during construction
          const totalInstallments = additionalPayments.reduce((sum: number, p: any) => {
            return sum + (basePrice * (p.paymentPercent || 0) / 100);
          }, 0);
          
          // Calculate average monthly payment (if there are installments)
          const avgMonthlyPayment = preHandoverInstallments > 0 && constructionMonths > 0 
            ? totalInstallments / constructionMonths 
            : 0;

          return (
            <div key={quote.id} className="space-y-4">
              {/* Payment Plan Label */}
              <div className="flex items-center gap-2">
                <span 
                  className="text-sm font-medium truncate"
                  style={{ color }}
                >
                  {quote.title || quote.projectName || 'Quote'}
                </span>
                <span 
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {paymentPlanLabel}
                </span>
              </div>

              {/* Visual bar */}
              <div className="h-8 rounded-lg overflow-hidden flex">
                {/* Downpayment */}
                <div 
                  className="flex items-center justify-center text-xs font-medium text-black"
                  style={{ 
                    width: `${downpayment}%`,
                    backgroundColor: color,
                  }}
                >
                  {downpayment > 8 ? `${Math.round(downpayment)}%` : ''}
                </div>
                {/* Pre-handover installments */}
                {preHandoverInstallments > 0 && (
                  <div 
                    className="flex items-center justify-center text-xs font-medium"
                    style={{ 
                      width: `${preHandoverInstallments}%`,
                      backgroundColor: `${color}80`,
                      color: '#fff',
                    }}
                  >
                    {preHandoverInstallments > 8 ? `${Math.round(preHandoverInstallments)}%` : ''}
                  </div>
                )}
                {/* On Handover */}
                <div 
                  className="flex items-center justify-center text-xs font-medium bg-[#0f172a] text-theme-text-muted"
                  style={{ width: `${onHandover}%` }}
                >
                  {onHandover > 8 ? `${Math.round(onHandover)}%` : ''}
                </div>
                {/* Post-handover (if applicable) */}
                {hasPostHandover && postHandoverPercent > 0 && (
                  <div 
                    className="flex items-center justify-center text-xs font-medium"
                    style={{ 
                      width: `${postHandoverPercent}%`,
                      background: `repeating-linear-gradient(45deg, ${color}40, ${color}40 2px, ${color}20 2px, ${color}20 4px)`,
                      color: '#fff',
                    }}
                  >
                    {postHandoverPercent > 8 ? `${Math.round(postHandoverPercent)}%` : ''}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                    <span className="text-theme-text-muted">Downpayment</span>
                  </span>
                  <span className="text-white font-medium">
                    {formatCurrency(downpaymentAmount, currency, exchangeRate)}
                  </span>
                </div>
                {preHandoverInstallments > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: `${color}80` }} />
                      <span className="text-theme-text-muted">Pre-Handover</span>
                    </span>
                    <span className="text-white font-medium">
                      {formatCurrency(preHandoverInstallmentsAmount, currency, exchangeRate)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#0f172a] border border-[#2a3142]" />
                    <span className="text-theme-text-muted">On Handover</span>
                  </span>
                  <span className="text-white font-medium">
                    {formatCurrency(onHandoverAmount, currency, exchangeRate)}
                  </span>
                </div>
                {hasPostHandover && postHandoverPercent > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded" 
                        style={{ background: `repeating-linear-gradient(45deg, ${color}40, ${color}40 2px, ${color}20 2px, ${color}20 4px)` }} 
                      />
                      <span className="text-theme-text-muted">Post-Handover</span>
                    </span>
                    <span className="text-white font-medium">
                      {formatCurrency(postHandoverAmount, currency, exchangeRate)}
                    </span>
                  </div>
                )}
              </div>

              {/* Monthly payment during construction */}
              {avgMonthlyPayment > 0 && (
                <div className="pt-2 border-t border-[#2a3142]">
                  <div className="flex justify-between text-xs">
                    <span className="text-theme-text-muted">Monthly avg (construction)</span>
                    <span className="text-theme-text-muted font-medium">
                      ~{formatCurrency(avgMonthlyPayment, currency, exchangeRate)}/mo
                    </span>
                  </div>
                </div>
              )}

              {/* Entry costs */}
              <div className="pt-3 border-t border-[#2a3142]">
                <div className="flex justify-between text-xs">
                  <span className="text-theme-text-muted">Entry Costs (DLD, etc.)</span>
                  <span className="text-theme-text-muted">
                    {formatCurrency(calculations.totalEntryCosts, currency, exchangeRate)}
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-theme-text-muted">Total Capital Required</span>
                  <span className="text-white font-medium">
                    {formatCurrency(calculations.holdAnalysis.totalCapitalInvested, currency, exchangeRate)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentComparison;
