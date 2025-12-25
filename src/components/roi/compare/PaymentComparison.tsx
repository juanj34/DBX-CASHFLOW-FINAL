import { QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { formatCurrency } from '@/components/roi/currencyUtils';

interface PaymentComparisonProps {
  quotesWithCalcs: QuoteWithCalculations[];
}

export const PaymentComparison = ({ quotesWithCalcs }: PaymentComparisonProps) => {
  const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500'];

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-xl p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Payment Structure</h3>
      
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${quotesWithCalcs.length}, minmax(200px, 1fr))` }}>
        {quotesWithCalcs.map((item, idx) => {
          const { quote, calculations } = item;
          const color = colors[idx % colors.length];
          
          // CORRECT CALCULATION:
          // preHandoverPercent = TOTAL paid before handover (includes downpayment)
          // So installments = preHandoverPercent - downpayment
          const downpayment = quote.inputs.downpaymentPercent;
          const preHandoverTotal = quote.inputs.preHandoverPercent;
          const installments = preHandoverTotal - downpayment;
          const postHandover = 100 - preHandoverTotal;

          const basePrice = quote.inputs.basePrice;
          const downpaymentAmount = basePrice * (downpayment / 100);
          const installmentsAmount = basePrice * (installments / 100);
          const postHandoverAmount = basePrice * (postHandover / 100);

          // Payment plan label (e.g., "30/70", "50/50")
          const paymentPlanLabel = `${Math.round(preHandoverTotal)}/${Math.round(postHandover)}`;

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
          const avgMonthlyPayment = installments > 0 && constructionMonths > 0 
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
                <div 
                  className="flex items-center justify-center text-xs font-medium text-black"
                  style={{ 
                    width: `${downpayment}%`,
                    backgroundColor: color,
                  }}
                >
                  {downpayment > 10 ? `${downpayment}%` : ''}
                </div>
                {installments > 0 && (
                  <div 
                    className="flex items-center justify-center text-xs font-medium"
                    style={{ 
                      width: `${installments}%`,
                      backgroundColor: `${color}80`,
                      color: '#fff',
                    }}
                  >
                    {installments > 10 ? `${installments}%` : ''}
                  </div>
                )}
                <div 
                  className="flex items-center justify-center text-xs font-medium bg-[#0f172a] text-gray-400"
                  style={{ width: `${postHandover}%` }}
                >
                  {postHandover > 10 ? `${postHandover}%` : ''}
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                    <span className="text-gray-400">Downpayment</span>
                  </span>
                  <span className="text-white font-medium">
                    {formatCurrency(downpaymentAmount, 'AED', 1)}
                  </span>
                </div>
                {installments > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: `${color}80` }} />
                      <span className="text-gray-400">Installments</span>
                    </span>
                    <span className="text-white font-medium">
                      {formatCurrency(installmentsAmount, 'AED', 1)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#0f172a] border border-[#2a3142]" />
                    <span className="text-gray-400">On Handover</span>
                  </span>
                  <span className="text-white font-medium">
                    {formatCurrency(postHandoverAmount, 'AED', 1)}
                  </span>
                </div>
              </div>

              {/* Monthly payment during construction */}
              {avgMonthlyPayment > 0 && (
                <div className="pt-2 border-t border-[#2a3142]">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Monthly avg (construction)</span>
                    <span className="text-gray-300 font-medium">
                      ~{formatCurrency(avgMonthlyPayment, 'AED', 1)}/mo
                    </span>
                  </div>
                </div>
              )}

              {/* Entry costs */}
              <div className="pt-3 border-t border-[#2a3142]">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Entry Costs (DLD, etc.)</span>
                  <span className="text-gray-300">
                    {formatCurrency(calculations.totalEntryCosts, 'AED', 1)}
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">Total Capital Required</span>
                  <span className="text-white font-medium">
                    {formatCurrency(calculations.holdAnalysis.totalCapitalInvested, 'AED', 1)}
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
