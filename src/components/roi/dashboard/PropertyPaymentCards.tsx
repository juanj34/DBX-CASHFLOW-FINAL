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
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Building2 className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-sm font-medium text-white">{t('theProperty')}</span>
        </div>

        <div className="space-y-4">
          {/* Hero Price */}
          <div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(inputs.basePrice, currency, rate)}
            </p>
            <p className="text-xs text-slate-400 mt-1">{t('basePropertyPrice')}</p>
          </div>

          {/* Size & Price per sqft */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-700/50">
            {unitSizeSqf && unitSizeSqf > 0 && (
              <div>
                <p className="text-lg font-semibold text-white">{unitSizeSqf.toLocaleString()}</p>
                <p className="text-xs text-slate-400">sqft</p>
              </div>
            )}
            {pricePerSqft > 0 && (
              <div>
                <p className="text-lg font-semibold text-white">
                  {formatCurrency(pricePerSqft, currency, rate)}
                </p>
                <p className="text-xs text-slate-400">{t('pricePerSqft')}</p>
              </div>
            )}
          </div>

          {/* Handover Date */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-700/50">
            <Calendar className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-white">{handoverDateFormatted}</p>
              <p className="text-xs text-slate-400">{t('handoverDate')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Payment Plan */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="text-sm font-medium text-white">{t('paymentPlanSplit')}</span>
          </div>
          <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">
            {preHandoverPercent}/{handoverPercent}
          </span>
        </div>

        <div className="space-y-4">
          {/* Visual Split Bar */}
          <div className="relative h-8 rounded-lg overflow-hidden bg-slate-700">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center"
              style={{ width: `${preHandoverPercent}%` }}
            >
              <span className="text-xs font-bold text-white drop-shadow-md">{preHandoverPercent}%</span>
            </div>
            <div 
              className="absolute right-0 top-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-500 flex items-center justify-center"
              style={{ width: `${handoverPercent}%` }}
            >
              <span className="text-xs font-bold text-white drop-shadow-md">{handoverPercent}%</span>
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30">
              <p className="text-sm font-semibold text-emerald-400">
                {formatCurrency(preHandoverAmount, currency, rate)}
              </p>
              <p className="text-xs text-slate-400">{t('preHandoverLabel')}</p>
            </div>
            <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/30">
              <p className="text-sm font-semibold text-cyan-400">
                {formatCurrency(handoverAmount, currency, rate)}
              </p>
              <p className="text-xs text-slate-400">{t('atHandoverLabel')}</p>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-slate-700/50">
            <p className="text-xs text-slate-400">
              {t('duringMonthsConstruction').replace('{months}', calculations.totalMonths.toString())}
            </p>
          </div>
        </div>
      </div>

      {/* Card 3: Day-1 Costs */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-red-500/20">
            <CreditCard className="h-4 w-4 text-red-400" />
          </div>
          <span className="text-sm font-medium text-white">{t('dayOneCosts')}</span>
        </div>

        <div className="space-y-3">
          {/* DLD Fee */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">{t('dldFee')} (4%)</span>
            <span className="text-sm font-medium text-white">
              {formatCurrency(dldFee, currency, rate)}
            </span>
          </div>

          {/* Oqood Fee */}
          {oqoodFee > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">{t('oqoodFee')}</span>
              <span className="text-sm font-medium text-white">
                {formatCurrency(oqoodFee, currency, rate)}
              </span>
            </div>
          )}

          {/* Admin/EOI Fee */}
          {adminFee > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">{t('adminFee')}</span>
              <span className="text-sm font-medium text-white">
                {formatCurrency(adminFee, currency, rate)}
              </span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-700/50">
            <span className="text-sm font-semibold text-white">{t('totalDayOneCosts')}</span>
            <span className="text-base font-bold text-red-400">
              {formatCurrency(calculations.totalEntryCosts, currency, rate)}
            </span>
          </div>
        </div>
      </div>

      {/* Card 4: Payment Journey Timeline */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 md:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Calendar className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <span className="text-sm font-medium text-white block">{t('paymentJourney')}</span>
              <span className="text-[10px] text-slate-400">{t('whenYouPay') || 'When you pay during construction'}</span>
            </div>
          </div>
          <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
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
