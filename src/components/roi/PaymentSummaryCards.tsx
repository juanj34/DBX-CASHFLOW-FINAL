import { OIInputs } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { Wallet, TrendingUp, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PaymentSummaryCardsProps {
  inputs: OIInputs;
  currency: Currency;
  rate: number;
  totalMonths: number;
}

// DLD Fee is always 4%
const DLD_FEE_PERCENT = 4;

export const PaymentSummaryCards = ({ inputs, currency, rate, totalMonths }: PaymentSummaryCardsProps) => {
  const { t } = useLanguage();
  const { basePrice, downpaymentPercent, additionalPayments, preHandoverPercent, oqoodFee, eoiFee, bookingMonth, bookingYear, handoverQuarter, handoverYear } = inputs;

  // Calculate Initial Cash Required (Booking + DLD + Oqood + Downpayment)
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const dldFeeAmount = basePrice * DLD_FEE_PERCENT / 100;
  const initialCashRequired = downpaymentAmount + dldFeeAmount + oqoodFee;

  // Calculate Monthly Burn Rate during construction
  const additionalTotal = additionalPayments.reduce((sum, m) => sum + (basePrice * m.paymentPercent / 100), 0);
  
  // Calculate construction period in months
  const bookingDate = new Date(bookingYear, bookingMonth - 1, 1);
  const handoverMonth = (handoverQuarter - 1) * 3 + 1;
  const handoverDate = new Date(handoverYear, handoverMonth, 1);
  const constructionMonths = Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  
  const monthlyBurnRate = additionalTotal > 0 && constructionMonths > 0 
    ? additionalTotal / constructionMonths 
    : 0;

  // Calculate Handover Balance
  const handoverPercent = 100 - preHandoverPercent;
  const handoverBalance = basePrice * handoverPercent / 100;

  // Format handover date
  const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
  const handoverLabel = `${quarterLabels[handoverQuarter - 1]} ${handoverYear}`;

  // Format booking date
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const bookingLabel = `${monthNamesShort[bookingMonth - 1]} ${bookingYear}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Initial Cash Required */}
      <div className="bg-gradient-to-br from-theme-accent/20 to-theme-accent/5 border border-theme-accent/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-theme-accent/20 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-theme-accent" />
          </div>
          <span className="text-xs uppercase tracking-wide text-theme-accent font-medium">
            {t('initialCashRequired') || 'Initial Cash Required'}
          </span>
        </div>
        <div className="text-xl font-bold text-theme-text font-mono">
          {formatCurrency(initialCashRequired, currency, rate)}
        </div>
        <div className="text-xs text-theme-text-muted mt-1">
          {t('dueLabel') || 'Due'} {bookingLabel}
        </div>
      </div>

      {/* Monthly Burn Rate */}
      <div className="bg-gradient-to-br from-slate-500/20 to-slate-500/5 border border-slate-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-xs uppercase tracking-wide text-slate-400 font-medium">
            {t('monthlyBurnRate') || 'Monthly Burn Rate'}
          </span>
        </div>
        <div className="text-xl font-bold text-theme-text font-mono">
          {monthlyBurnRate > 0 ? `~${formatCurrency(monthlyBurnRate, currency, rate)}` : '—'}
        </div>
        <div className="text-xs text-theme-text-muted mt-1">
          {constructionMonths} {t('months') || 'months'} {t('constructionPeriodLabel') || 'construction'}
        </div>
      </div>

      {/* Handover Balance */}
      <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Home className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xs uppercase tracking-wide text-cyan-400 font-medium">
            {t('completionBalance') || 'Completion Balance'}
          </span>
        </div>
        <div className="text-xl font-bold text-theme-text font-mono">
          {formatCurrency(handoverBalance, currency, rate)}
        </div>
        <div className="text-xs text-theme-text-muted mt-1">
          {handoverLabel} ({handoverPercent}%)
        </div>
      </div>
    </div>
  );
};
