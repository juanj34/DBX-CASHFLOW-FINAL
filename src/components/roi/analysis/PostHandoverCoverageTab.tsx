import { useMemo } from "react";
import { OIInputs, OICalculations, monthName } from "@/components/roi/useOICalculations";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";

interface PostHandoverCoverageTabProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
}

export const PostHandoverCoverageTab = ({ inputs, calculations, currency, rate }: PostHandoverCoverageTabProps) => {
  const { basePrice, yearlyProjections } = calculations;
  const postPayments = inputs.postHandoverPayments || [];

  // Calculate handover date
  const handoverDate = new Date(inputs.handoverYear, inputs.handoverMonth - 1);

  // Calculate monthly rent at handover (first rental year)
  const firstRentalYear = yearlyProjections.find(p => !p.isConstruction && !p.isHandover && p.netRent && p.netRent > 0);
  const monthlyNetRent = firstRentalYear ? (firstRentalYear.netRent || 0) / 12 : 0;

  // Build installment schedule with coverage analysis
  const installmentSchedule = useMemo(() => {
    let cumulativePaid = 0;
    let cumulativeRentEarned = 0;

    return postPayments.map((payment, idx) => {
      const monthsAfterHandover = payment.triggerValue;
      const paymentAmount = basePrice * (payment.paymentPercent / 100);
      cumulativePaid += paymentAmount;

      // Estimate rent earned by this month (simple: monthly rent * months)
      // Rent grows annually per rentGrowthRate
      const yearsAfterHandover = monthsAfterHandover / 12;
      const rentGrowthMultiplier = Math.pow(1 + (inputs.rentGrowthRate || 4) / 100, Math.floor(yearsAfterHandover));
      const adjustedMonthlyRent = monthlyNetRent * rentGrowthMultiplier;
      cumulativeRentEarned += adjustedMonthlyRent * (idx === 0 ? monthsAfterHandover : monthsAfterHandover - (postPayments[idx - 1]?.triggerValue || 0));

      const paymentDate = new Date(handoverDate);
      paymentDate.setMonth(paymentDate.getMonth() + monthsAfterHandover);

      return {
        index: idx + 1,
        monthsAfterHandover,
        paymentDate,
        paymentPercent: payment.paymentPercent,
        paymentAmount,
        cumulativePaid,
        cumulativeRentEarned,
        netPosition: cumulativeRentEarned - cumulativePaid,
        coverageRatio: paymentAmount > 0 ? (adjustedMonthlyRent * (idx === 0 ? monthsAfterHandover : monthsAfterHandover - (postPayments[idx - 1]?.triggerValue || 0))) / paymentAmount : 0,
      };
    });
  }, [postPayments, basePrice, monthlyNetRent, handoverDate, inputs.rentGrowthRate]);

  const totalPostHOPayments = postPayments.reduce((sum, p) => sum + (basePrice * p.paymentPercent / 100), 0);
  const totalPostHOPercent = postPayments.reduce((sum, p) => sum + p.paymentPercent, 0);
  const lastInstallment = installmentSchedule[installmentSchedule.length - 1];
  const totalRentDuringPeriod = lastInstallment?.cumulativeRentEarned || 0;
  const netSurplus = totalRentDuringPeriod - totalPostHOPayments;

  const formatValue = (value: number) => formatCurrency(value, currency, rate);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-theme-card rounded-xl border border-purple-500/30 text-center">
          <div className="text-[10px] text-purple-400 uppercase">Post-HO Total</div>
          <div className="text-sm font-mono font-semibold text-purple-400 mt-1">{totalPostHOPercent.toFixed(0)}%</div>
          <div className="text-[10px] text-theme-text-muted">{formatValue(totalPostHOPayments)}</div>
        </div>
        <div className="p-3 bg-theme-card rounded-xl border border-cyan-500/30 text-center">
          <div className="text-[10px] text-cyan-400 uppercase">Rent Earned</div>
          <div className="text-sm font-mono font-semibold text-cyan-400 mt-1">{formatValue(totalRentDuringPeriod)}</div>
        </div>
        <div className={`p-3 bg-theme-card rounded-xl border text-center ${netSurplus >= 0 ? 'border-green-500/30' : 'border-red-500/30'}`}>
          <div className={`text-[10px] uppercase ${netSurplus >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Net {netSurplus >= 0 ? 'Surplus' : 'Deficit'}
          </div>
          <div className={`text-sm font-mono font-semibold mt-1 ${netSurplus >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatValue(Math.abs(netSurplus))}
          </div>
        </div>
        <div className="p-3 bg-theme-card rounded-xl border border-theme-border text-center">
          <div className="text-[10px] text-theme-text-muted uppercase">Monthly Rent</div>
          <div className="text-sm font-mono font-semibold text-theme-accent mt-1">{formatValue(monthlyNetRent)}</div>
          <div className="text-[10px] text-theme-text-muted">at handover</div>
        </div>
      </div>

      {/* Installment Schedule */}
      {installmentSchedule.length > 0 && (
        <div className="p-4 bg-theme-card rounded-xl border border-theme-border overflow-x-auto">
          <h4 className="text-sm font-semibold text-theme-text mb-3">Post-Handover Installment Schedule</h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-theme-border">
                <th className="text-left py-2 text-theme-text-muted font-medium">#</th>
                <th className="text-left py-2 text-theme-text-muted font-medium">Date</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">%</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">Amount</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">Cum. Paid</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">Cum. Rent</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">Net Position</th>
              </tr>
            </thead>
            <tbody>
              {installmentSchedule.map((inst) => (
                <tr key={inst.index} className="border-b border-theme-border/50 hover:bg-theme-bg/30">
                  <td className="py-2 text-purple-400 font-mono">{inst.index}</td>
                  <td className="py-2 text-theme-text">
                    {monthName(inst.paymentDate.getMonth() + 1)} {inst.paymentDate.getFullYear()}
                    <span className="text-theme-text-muted ml-1">(+{inst.monthsAfterHandover}mo)</span>
                  </td>
                  <td className="py-2 text-right text-purple-400 font-mono">{inst.paymentPercent}%</td>
                  <td className="py-2 text-right text-theme-text font-mono">{formatValue(inst.paymentAmount)}</td>
                  <td className="py-2 text-right text-theme-text-muted font-mono">{formatValue(inst.cumulativePaid)}</td>
                  <td className="py-2 text-right text-cyan-400 font-mono">{formatValue(inst.cumulativeRentEarned)}</td>
                  <td className={`py-2 text-right font-mono font-semibold ${inst.netPosition >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {inst.netPosition >= 0 ? '+' : ''}{formatValue(inst.netPosition)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {postPayments.length === 0 && (
        <div className="p-6 bg-theme-card rounded-xl border border-theme-border text-center">
          <p className="text-sm text-theme-text-muted">No post-handover installments configured.</p>
          <p className="text-xs text-theme-text-muted mt-1">Add post-handover payments in the configurator to see coverage analysis.</p>
        </div>
      )}
    </div>
  );
};
