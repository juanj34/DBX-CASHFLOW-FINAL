import { useMemo } from 'react';
import { FileText, Building, Wallet, TrendingUp, Calendar } from 'lucide-react';
import { OIInputs, OICalculations, OIYearlyProjection } from '../useOICalculations';
import { ClientUnitData } from '../ClientUnitInfo';
import { Currency, formatCurrency, formatDualCurrency } from '../currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PaymentBreakdownDetailedProps {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo?: ClientUnitData;
  currency: Currency;
  rate: number;
}

/** Dual-currency display row */
const DualRow = ({
  label,
  value,
  currency,
  rate,
  highlight,
  bold,
  negative,
  subLabel,
}: {
  label: string;
  value: number;
  currency: Currency;
  rate: number;
  highlight?: boolean;
  bold?: boolean;
  negative?: boolean;
  subLabel?: string;
}) => {
  const dual = formatDualCurrency(value, currency, rate);
  return (
    <div className={cn(
      "flex items-center justify-between py-1.5",
      bold && "font-semibold",
      highlight && "text-theme-accent"
    )}>
      <div className="flex flex-col">
        <span className={cn(
          "text-xs",
          highlight ? "text-theme-accent" : "text-theme-text-muted"
        )}>
          {label}
        </span>
        {subLabel && (
          <span className="text-[10px] text-theme-text-muted">{subLabel}</span>
        )}
      </div>
      <div className="text-right">
        <span className={cn(
          "text-xs font-mono",
          negative ? "text-theme-negative" : highlight ? "text-theme-accent" : "text-theme-text"
        )}>
          {negative ? '-' : ''}{dual.primary}
        </span>
        {dual.secondary && (
          <div className="text-[10px] text-theme-text-muted font-mono">
            {negative ? '-' : ''}{dual.secondary}
          </div>
        )}
      </div>
    </div>
  );
};

/** Month name helper */
const getMonthName = (month: number, language: string): string => {
  const namesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const namesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return (language === 'es' ? namesEs : namesEn)[(month - 1) % 12] || '';
};

export const PaymentBreakdownDetailed = ({
  inputs,
  calculations,
  clientInfo,
  currency,
  rate,
}: PaymentBreakdownDetailedProps) => {
  const { t, language } = useLanguage();

  const {
    basePrice,
    downpaymentPercent,
    additionalPayments,
    bookingMonth,
    bookingYear,
    handoverMonth,
    handoverYear,
    oqoodFee,
    eoiFee = 0,
    rentalYieldPercent,
    serviceChargePerSqft = 18,
    rentGrowthRate = 4,
  } = inputs;

  const unitSizeSqf = clientInfo?.unitSizeSqf || inputs.unitSizeSqf || 0;

  // ====== Section A: Initial Cost ======
  const downpaymentAmount = basePrice * (downpaymentPercent / 100);
  const spaPayment = downpaymentAmount - eoiFee; // Remaining after holding fee
  const dldFee = basePrice * 0.04;
  const totalSectionA = eoiFee + spaPayment + dldFee + oqoodFee;
  const sectionAPercent = basePrice > 0 ? (totalSectionA / basePrice) * 100 : 0;

  // ====== Section B: Milestone Events ======
  const sortedPayments = useMemo(() => {
    return [...(additionalPayments || [])].sort((a, b) => {
      if (a.type === 'time' && b.type === 'time') return a.triggerValue - b.triggerValue;
      if (a.type === 'construction' && b.type === 'construction') return a.triggerValue - b.triggerValue;
      return a.type === 'time' ? -1 : 1;
    });
  }, [additionalPayments]);

  // Completion payment (at handover)
  const totalAdditionalPercent = sortedPayments.reduce((sum, p) => sum + p.paymentPercent, 0);
  const totalAllocatedPercent = downpaymentPercent + totalAdditionalPercent;

  // Post-handover payments
  const hasPostHandover = inputs.hasPostHandoverPlan;
  const postHandoverPayments = hasPostHandover ? (inputs.postHandoverPayments || []) : [];
  const postHandoverPercent = postHandoverPayments.reduce((sum, p) => sum + p.paymentPercent, 0);

  // Completion/handover payment = remainder
  const completionPercent = hasPostHandover
    ? (inputs.onHandoverPercent || 0)
    : Math.max(0, 100 - totalAllocatedPercent);
  const completionAmount = basePrice * (completionPercent / 100);

  const totalMilestonePercent = totalAdditionalPercent + completionPercent + postHandoverPercent;
  const totalMilestoneAmount = sortedPayments.reduce((sum, p) => sum + basePrice * p.paymentPercent / 100, 0)
    + completionAmount
    + postHandoverPayments.reduce((sum, p) => sum + basePrice * p.paymentPercent / 100, 0);

  // Total equity required
  const totalEquity = totalSectionA + totalMilestoneAmount;

  // ====== Section C: Monthly Net Income ======
  const grossAnnualRent = basePrice * (rentalYieldPercent / 100);
  const grossMonthlyRent = grossAnnualRent / 12;
  const annualServiceCharges = unitSizeSqf * serviceChargePerSqft;
  const monthlyServiceCharge = annualServiceCharges / 12;
  const netMonthlyIncome = grossMonthlyRent - monthlyServiceCharge;
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const netYieldPercent = basePrice > 0 ? (netAnnualRent / basePrice) * 100 : 0;

  // ====== Annual projections ======
  const rentalYears = calculations.yearlyProjections.filter(p => !p.isConstruction);

  // Date helper
  const estimateDate = (monthsFromBooking: number) => {
    const totalMonths = bookingMonth + monthsFromBooking;
    const yearOffset = Math.floor((totalMonths - 1) / 12);
    const month = ((totalMonths - 1) % 12) + 1;
    return `${getMonthName(month, language)} ${bookingYear + yearOffset}`;
  };

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-theme-border">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-theme-accent" />
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-theme-text-muted">
              {t('paymentBreakdownOption2Label')}
            </h3>
            <p className="text-[10px] text-theme-text-muted">
              {clientInfo?.projectName || ''} {clientInfo?.unitNumber ? `· ${clientInfo.unitNumber}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-theme-border">
        {/* ====== SECTION A: Initial Cost ====== */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-theme-accent/20 flex items-center justify-center">
              <span className="text-xs font-bold text-theme-accent">A</span>
            </div>
            <span className="text-sm font-semibold text-theme-text">{t('initialCostSectionLabel')}</span>
          </div>

          <div className="space-y-0 divide-y divide-theme-border/30">
            {/* Holding Fee / EOI */}
            {eoiFee > 0 && (
              <DualRow
                label={t('holdingFeeLabel')}
                subLabel={t('paymentOnReservationLabel')}
                value={eoiFee}
                currency={currency}
                rate={rate}
              />
            )}

            {/* SPA Payment */}
            <DualRow
              label={t('signedPurchaseAgreementLabel')}
              subLabel={`${downpaymentPercent}% ${eoiFee > 0 ? `(- ${t('holdingFeeLabel')})` : ''}`}
              value={spaPayment}
              currency={currency}
              rate={rate}
            />

            {/* DLD Fee */}
            <DualRow
              label={t('dubaiLandDeptFeeLabel')}
              subLabel="4%"
              value={dldFee}
              currency={currency}
              rate={rate}
            />

            {/* Oqood */}
            {oqoodFee > 0 && (
              <DualRow
                label={t('oqoodFeesLabel')}
                value={oqoodFee}
                currency={currency}
                rate={rate}
              />
            )}

            {/* Section A Total */}
            <div className="pt-2 mt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-theme-accent/10 border border-theme-accent/20">
                <span className="text-xs font-semibold text-theme-accent">
                  {t('totalEntryLabel')} ({sectionAPercent.toFixed(1)}%)
                </span>
                <div className="text-right">
                  <span className="text-sm font-bold text-theme-accent font-mono">
                    {formatDualCurrency(totalSectionA, currency, rate).primary}
                  </span>
                  {formatDualCurrency(totalSectionA, currency, rate).secondary && (
                    <div className="text-[10px] text-theme-text-muted font-mono">
                      {formatDualCurrency(totalSectionA, currency, rate).secondary}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====== SECTION B: Milestone Events ====== */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-theme-accent/20 flex items-center justify-center">
              <span className="text-xs font-bold text-theme-accent">B</span>
            </div>
            <span className="text-sm font-semibold text-theme-text">{t('milestoneEventSectionLabel')}</span>
          </div>

          <div className="space-y-0 divide-y divide-theme-border/30">
            {/* Construction installments */}
            {sortedPayments.map((payment, idx) => {
              const amount = basePrice * (payment.paymentPercent / 100);
              const triggerLabel = payment.type === 'time'
                ? `${payment.triggerValue} ${t('monthsAfterBookingLabel')}`
                : `${payment.triggerValue}% ${t('onProjectCompletion')}`;
              const dateEstimate = payment.type === 'time'
                ? estimateDate(payment.triggerValue)
                : '';

              return (
                <div key={payment.id || idx} className="flex items-center justify-between py-1.5">
                  <div className="flex flex-col">
                    <span className="text-xs text-theme-text-muted">
                      {t('installmentWithNumber')} {idx + 1} ({payment.paymentPercent}%)
                    </span>
                    <span className="text-[10px] text-theme-text-muted">
                      {triggerLabel}
                      {dateEstimate && ` · ${t('estimatedLabel')}: ${dateEstimate}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-theme-text">
                      {formatDualCurrency(amount, currency, rate).primary}
                    </span>
                    {formatDualCurrency(amount, currency, rate).secondary && (
                      <div className="text-[10px] text-theme-text-muted font-mono">
                        {formatDualCurrency(amount, currency, rate).secondary}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Completion payment */}
            {completionPercent > 0 && (
              <div className="flex items-center justify-between py-1.5">
                <div className="flex flex-col">
                  <span className="text-xs text-theme-accent font-medium">
                    {t('paymentOnCompletionLabel')} ({completionPercent}%)
                  </span>
                  <span className="text-[10px] text-theme-text-muted">
                    {t('estimatedLabel')}: {getMonthName(handoverMonth, language)} {handoverYear}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-theme-accent font-medium">
                    {formatDualCurrency(completionAmount, currency, rate).primary}
                  </span>
                  {formatDualCurrency(completionAmount, currency, rate).secondary && (
                    <div className="text-[10px] text-theme-text-muted font-mono">
                      {formatDualCurrency(completionAmount, currency, rate).secondary}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Post-handover installments */}
            {postHandoverPayments.length > 0 && (
              <>
                <div className="pt-2">
                  <span className="text-[10px] uppercase tracking-wider text-theme-positive font-medium">
                    {t('postHoTabLabel')}
                  </span>
                </div>
                {postHandoverPayments.map((payment, idx) => {
                  const amount = basePrice * (payment.paymentPercent / 100);
                  return (
                    <div key={`post-${idx}`} className="flex items-center justify-between py-1.5">
                      <div className="flex flex-col">
                        <span className="text-xs text-theme-text-muted">
                          {t('installmentWithNumber')} {idx + 1} ({payment.paymentPercent}%)
                        </span>
                        <span className="text-[10px] text-theme-text-muted">
                          +{payment.triggerValue} {t('monthsAfterBookingLabel')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono text-theme-text">
                          {formatDualCurrency(amount, currency, rate).primary}
                        </span>
                        {formatDualCurrency(amount, currency, rate).secondary && (
                          <div className="text-[10px] text-theme-text-muted font-mono">
                            {formatDualCurrency(amount, currency, rate).secondary}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Total Equity Required */}
            <div className="pt-2 mt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-theme-positive/10 border border-theme-positive/20">
                <span className="text-xs font-semibold text-theme-positive">
                  {t('totalEquityRequiredLabel')} (100%)
                </span>
                <div className="text-right">
                  <span className="text-sm font-bold text-theme-positive font-mono">
                    {formatDualCurrency(totalEquity, currency, rate).primary}
                  </span>
                  {formatDualCurrency(totalEquity, currency, rate).secondary && (
                    <div className="text-[10px] text-theme-text-muted font-mono">
                      {formatDualCurrency(totalEquity, currency, rate).secondary}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====== SECTION C: Monthly Net Income ====== */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-theme-positive/20 flex items-center justify-center">
              <span className="text-xs font-bold text-theme-positive">C</span>
            </div>
            <span className="text-sm font-semibold text-theme-text">{t('projectMonthlyNetIncomeSectionLabel')}</span>
          </div>

          <div className="space-y-0 divide-y divide-theme-border/30">
            {/* Gross Monthly Rent */}
            <DualRow
              label={t('estimatedGrossMonthlyRentalLabel')}
              subLabel={`${rentalYieldPercent}% ${t('ofPurchasePriceLabel')}`}
              value={grossMonthlyRent}
              currency={currency}
              rate={rate}
            />

            {/* Service Charge */}
            {unitSizeSqf > 0 && (
              <DualRow
                label={t('serviceChargePsftLabel')}
                subLabel={`${serviceChargePerSqft} AED/sqft/${t('yr')}`}
                value={monthlyServiceCharge}
                currency={currency}
                rate={rate}
                negative
              />
            )}

            {/* Net Monthly Income */}
            <div className="pt-2 mt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-theme-positive/10 border border-theme-positive/20">
                <div>
                  <span className="text-xs font-semibold text-theme-positive">
                    {t('netMonthlyIncomeLabel')}
                  </span>
                  <div className="text-[10px] text-theme-text-muted">
                    {t('perMonthLabel')} · {netYieldPercent.toFixed(1)}% {t('netYield')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-theme-positive font-mono">
                    {formatDualCurrency(netMonthlyIncome, currency, rate).primary}
                  </span>
                  {formatDualCurrency(netMonthlyIncome, currency, rate).secondary && (
                    <div className="text-[10px] text-theme-text-muted font-mono">
                      {formatDualCurrency(netMonthlyIncome, currency, rate).secondary}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====== Annual Net Cash Position ====== */}
        {rentalYears.length > 0 && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-theme-accent" />
              <span className="text-sm font-semibold text-theme-text">{t('annualNetCashPositionLabel')}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-theme-border">
                    <th className="text-left py-2 text-theme-text-muted font-medium">{t('yearColumn')}</th>
                    <th className="text-right py-2 text-theme-text-muted font-medium">{t('netRent')}</th>
                    <th className="text-right py-2 text-theme-text-muted font-medium">{t('propertyValue')}</th>
                    {currency !== 'AED' && (
                      <th className="text-right py-2 text-theme-text-muted font-medium">{t('netRent')} ({currency})</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/30">
                  {rentalYears.slice(0, 10).map((proj) => (
                    <tr key={proj.year} className={cn(
                      proj.isHandover && "bg-theme-accent/5",
                      proj.isBreakEven && "bg-theme-positive/5"
                    )}>
                      <td className="py-1.5 text-theme-text font-medium">
                        {proj.calendarYear}
                        {proj.monthsActive && proj.monthsActive < 12 && (
                          <span className="text-[10px] text-theme-text-muted ml-1">({proj.monthsActive}{t('mo')})</span>
                        )}
                      </td>
                      <td className="py-1.5 text-right font-mono text-theme-positive">
                        {proj.netIncome ? formatCurrency(proj.netIncome, 'AED', 1) : '—'}
                      </td>
                      <td className="py-1.5 text-right font-mono text-theme-text">
                        {formatCurrency(proj.propertyValue, 'AED', 1)}
                      </td>
                      {currency !== 'AED' && (
                        <td className="py-1.5 text-right font-mono text-theme-text-muted">
                          {proj.netIncome ? formatCurrency(proj.netIncome, currency, rate) : '—'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====== Projected ROI ====== */}
        {rentalYears.length > 0 && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-theme-accent" />
              <span className="text-sm font-semibold text-theme-text">{t('projectedROILabel')}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Property Value at Key Years */}
              {[3, 5, 7, 10].map(targetYear => {
                const proj = calculations.yearlyProjections.find(p => p.year === targetYear);
                if (!proj) return null;
                const appreciation = basePrice > 0 ? ((proj.propertyValue - basePrice) / basePrice) * 100 : 0;
                return (
                  <div key={targetYear} className="p-3 bg-theme-bg rounded-lg border border-theme-border text-center">
                    <div className="text-[10px] text-theme-text-muted">{t('yearColumn')} {targetYear}</div>
                    <div className="text-sm font-bold font-mono text-theme-text">
                      {formatCurrency(proj.propertyValue, currency, rate)}
                    </div>
                    <div className="text-[10px] text-theme-positive font-mono">
                      +{appreciation.toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ====== Footer Note ====== */}
        <div className="p-3 bg-theme-bg-alt">
          <p className="text-[9px] text-theme-text-muted text-center leading-relaxed">
            {t('acceptedCurrenciesNote')}
          </p>
        </div>
      </div>
    </div>
  );
};
