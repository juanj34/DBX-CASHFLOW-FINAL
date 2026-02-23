import { useMemo } from "react";
import { Clock, CalendarCheck } from "lucide-react";
import { OIInputs, OICalculations, monthName } from "@/components/roi/useOICalculations";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";
import { useLanguage } from '@/contexts/LanguageContext';

interface PostHandoverTabProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
}

export const PostHandoverTab = ({ inputs, calculations, currency, rate }: PostHandoverTabProps) => {
  const { basePrice, yearlyProjections } = calculations;
  const { t } = useLanguage();
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
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-theme-accent" />
          <h3 className="text-sm font-semibold text-theme-text">{t('postHandoverHeader')}</h3>
        </div>
        <p className="text-xs text-theme-text-muted">
          {t('postHandoverCoverageSubtitle')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-theme-card rounded-xl border border-theme-accent/30 text-center">
          <div className="text-[10px] text-theme-accent uppercase">{t('postHoTotalLabel')}</div>
          <div className="text-sm font-mono font-semibold text-theme-accent mt-1">{totalPostHOPercent.toFixed(0)}%</div>
          <div className="text-[10px] text-theme-text-muted">{formatValue(totalPostHOPayments)}</div>
        </div>
        <div className="p-3 bg-theme-card rounded-xl border border-theme-accent/30 text-center">
          <div className="text-[10px] text-theme-accent uppercase">{t('rentEarnedLabel')}</div>
          <div className="text-sm font-mono font-semibold text-theme-accent mt-1">{formatValue(totalRentDuringPeriod)}</div>
        </div>
        <div className={`p-3 bg-theme-card rounded-xl border text-center ${netSurplus >= 0 ? 'border-theme-positive/30' : 'border-theme-negative/30'}`}>
          <div className={`text-[10px] uppercase ${netSurplus >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
            {netSurplus >= 0 ? t('netSurplusLabel') : t('netDeficitLabel')}
          </div>
          <div className={`text-sm font-mono font-semibold mt-1 ${netSurplus >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
            {formatValue(Math.abs(netSurplus))}
          </div>
        </div>
        <div className="p-3 bg-theme-card rounded-xl border border-theme-border text-center">
          <div className="text-[10px] text-theme-text-muted uppercase">{t('monthlyRent')}</div>
          <div className="text-sm font-mono font-semibold text-theme-accent mt-1">{formatValue(monthlyNetRent)}</div>
          <div className="text-[10px] text-theme-text-muted">{t('atHandover')}</div>
        </div>
      </div>

      {/* Installment Schedule */}
      {installmentSchedule.length > 0 && (
        <div className="p-4 bg-theme-card rounded-xl border border-theme-border overflow-x-auto">
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck className="w-4 h-4 text-theme-accent" />
            <h4 className="text-sm font-semibold text-theme-text">{t('postHandoverInstallmentSchedule')}</h4>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-theme-border">
                <th className="text-left py-2 text-theme-text-muted font-medium">{t('numberCol')}</th>
                <th className="text-left py-2 text-theme-text-muted font-medium">{t('dateCol')}</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">{t('percentCol')}</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">{t('amountCol')}</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">{t('cumPaidCol')}</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">{t('cumRentCol')}</th>
                <th className="text-right py-2 text-theme-text-muted font-medium">{t('netPositionCol')}</th>
              </tr>
            </thead>
            <tbody>
              {installmentSchedule.map((inst) => (
                <tr key={inst.index} className="border-b border-theme-border/50 hover:bg-theme-bg/30">
                  <td className="py-2 text-theme-accent font-mono">{inst.index}</td>
                  <td className="py-2 text-theme-text">
                    {monthName(inst.paymentDate.getMonth() + 1)} {inst.paymentDate.getFullYear()}
                    <span className="text-theme-text-muted ml-1">(+{inst.monthsAfterHandover}mo)</span>
                  </td>
                  <td className="py-2 text-right text-theme-accent font-mono">{inst.paymentPercent}%</td>
                  <td className="py-2 text-right text-theme-text font-mono">{formatValue(inst.paymentAmount)}</td>
                  <td className="py-2 text-right text-theme-text-muted font-mono">{formatValue(inst.cumulativePaid)}</td>
                  <td className="py-2 text-right text-theme-accent font-mono">{formatValue(inst.cumulativeRentEarned)}</td>
                  <td className={`py-2 text-right font-mono font-semibold ${inst.netPosition >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
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
          <p className="text-sm text-theme-text-muted">{t('noPostHandoverInstallments')}</p>
          <p className="text-xs text-theme-text-muted mt-1">{t('addPostHandoverPaymentsMessage')}</p>
        </div>
      )}
    </div>
  );
};
