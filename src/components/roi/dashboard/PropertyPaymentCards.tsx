import { Building2, Calendar, CreditCard, TrendingUp } from "lucide-react";
import { OIInputs, OICalculations } from "@/components/roi/useOICalculations";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { PaymentHorizontalTimeline } from "@/components/roi/PaymentHorizontalTimeline";

interface PropertyPaymentCardsProps {
  inputs: OIInputs;
  calculations: OICalculations;
  currency: Currency;
  rate: number;
  unitSizeSqf?: number;
}

export const PropertyPaymentCards = ({
  inputs,
  calculations,
  currency,
  rate,
  unitSizeSqf,
}: PropertyPaymentCardsProps) => {
  const { t } = useLanguage();

  // Calculate values
  const pricePerSqft = unitSizeSqf && unitSizeSqf > 0 
    ? inputs.basePrice / unitSizeSqf 
    : 0;

  const preHandoverPercent = inputs.preHandoverPercent;
  const handoverPercent = 100 - preHandoverPercent;
  const preHandoverAmount = inputs.basePrice * (preHandoverPercent / 100);
  const handoverAmount = inputs.basePrice * (handoverPercent / 100);

  // Format handover date
  const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
  const handoverQuarterLabel = quarterLabels[inputs.handoverQuarter - 1] || 'Q4';
  const handoverDateFormatted = `${handoverQuarterLabel} ${inputs.handoverYear}`;

  // Format booking date
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const bookingDateFormatted = `${monthNames[inputs.bookingMonth - 1]} ${inputs.bookingYear}`;

  // Entry costs breakdown
  const dldFee = inputs.basePrice * 0.04;
  const oqoodFee = inputs.oqoodFee || 0;
  const adminFee = inputs.eoiFee || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Card 1: The Property */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-theme-accent/10">
            <Building2 className="h-4 w-4 text-theme-accent" />
          </div>
          <span className="text-sm font-medium text-theme-muted">{t('theProperty')}</span>
        </div>

        <div className="space-y-4">
          {/* Hero Price */}
          <div>
            <p className="text-2xl font-bold text-theme-text">
              {formatCurrency(inputs.basePrice, currency, rate)}
            </p>
            <p className="text-xs text-theme-muted mt-1">{t('basePropertyPrice')}</p>
          </div>

          {/* Size & Price per sqft */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-theme-border">
            {unitSizeSqf && unitSizeSqf > 0 && (
              <div>
                <p className="text-lg font-semibold text-theme-text">{unitSizeSqf.toLocaleString()}</p>
                <p className="text-xs text-theme-muted">sqft</p>
              </div>
            )}
            {pricePerSqft > 0 && (
              <div>
                <p className="text-lg font-semibold text-theme-text">
                  {formatCurrency(pricePerSqft, currency, rate)}
                </p>
                <p className="text-xs text-theme-muted">{t('pricePerSqft')}</p>
              </div>
            )}
          </div>

          {/* Handover Date */}
          <div className="flex items-center gap-2 pt-3 border-t border-theme-border">
            <Calendar className="h-4 w-4 text-theme-muted" />
            <div>
              <p className="text-sm font-medium text-theme-text">{handoverDateFormatted}</p>
              <p className="text-xs text-theme-muted">{t('handoverDate')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Payment Plan */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="text-sm font-medium text-theme-muted">{t('paymentPlanSplit')}</span>
          </div>
          <span className="px-2 py-1 rounded-full bg-theme-accent/20 text-theme-accent text-xs font-bold">
            {preHandoverPercent}/{handoverPercent}
          </span>
        </div>

        <div className="space-y-4">
          {/* Visual Split Bar */}
          <div className="relative h-8 rounded-lg overflow-hidden bg-[#1a1f2e]">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-theme-accent/80 to-theme-accent/60 flex items-center justify-center"
              style={{ width: `${preHandoverPercent}%` }}
            >
              <span className="text-xs font-bold text-[#0d1117]">{preHandoverPercent}%</span>
            </div>
            <div 
              className="absolute right-0 top-0 h-full bg-gradient-to-r from-cyan-600/60 to-cyan-500/80 flex items-center justify-center"
              style={{ width: `${handoverPercent}%` }}
            >
              <span className="text-xs font-bold text-white">{handoverPercent}%</span>
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-theme-accent/5 rounded-lg p-3 border border-theme-accent/20">
              <p className="text-sm font-semibold text-theme-accent">
                {formatCurrency(preHandoverAmount, currency, rate)}
              </p>
              <p className="text-xs text-theme-muted">{t('preHandoverLabel')}</p>
            </div>
            <div className="bg-cyan-500/5 rounded-lg p-3 border border-cyan-500/20">
              <p className="text-sm font-semibold text-cyan-400">
                {formatCurrency(handoverAmount, currency, rate)}
              </p>
              <p className="text-xs text-theme-muted">{t('atHandoverLabel')}</p>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-theme-border">
            <p className="text-xs text-theme-muted">
              {t('duringMonthsConstruction').replace('{months}', calculations.totalMonths.toString())}
            </p>
          </div>
        </div>
      </div>

      {/* Card 3: Day-1 Costs */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-red-500/10">
            <CreditCard className="h-4 w-4 text-red-400" />
          </div>
          <span className="text-sm font-medium text-theme-muted">{t('dayOneCosts')}</span>
        </div>

        <div className="space-y-3">
          {/* DLD Fee */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-theme-muted">{t('dldFee')} (4%)</span>
            <span className="text-sm font-medium text-theme-text">
              {formatCurrency(dldFee, currency, rate)}
            </span>
          </div>

          {/* Oqood Fee */}
          {oqoodFee > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-theme-muted">{t('oqoodFee')}</span>
              <span className="text-sm font-medium text-theme-text">
                {formatCurrency(oqoodFee, currency, rate)}
              </span>
            </div>
          )}

          {/* Admin/EOI Fee */}
          {adminFee > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-theme-muted">{t('adminFee')}</span>
              <span className="text-sm font-medium text-theme-text">
                {formatCurrency(adminFee, currency, rate)}
              </span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-3 border-t border-theme-border">
            <span className="text-sm font-semibold text-theme-text">{t('totalDayOneCosts')}</span>
            <span className="text-base font-bold text-red-400">
              {formatCurrency(calculations.totalEntryCosts, currency, rate)}
            </span>
          </div>
        </div>
      </div>

      {/* Card 4: Payment Journey Timeline - Full Width on Mobile */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-5 md:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Calendar className="h-4 w-4 text-purple-400" />
            </div>
            <span className="text-sm font-medium text-theme-muted">{t('paymentJourney')}</span>
          </div>
          <span className="text-xs text-theme-muted">
            {bookingDateFormatted} → {handoverDateFormatted}
          </span>
        </div>

        <PaymentHorizontalTimeline
          inputs={inputs}
          currency={currency}
          rate={rate}
          totalMonths={calculations.totalMonths}
        />
      </div>
    </div>
  );
};
