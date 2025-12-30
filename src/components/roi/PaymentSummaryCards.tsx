import { OIInputs } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { Wallet, TrendingUp, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PaymentSummaryCardsProps {
  inputs: OIInputs;
  currency: Currency;
  rate: number;
  totalMonths: number;
  vertical?: boolean;
}

// DLD Fee is always 4%
const DLD_FEE_PERCENT = 4;

export const PaymentSummaryCards = ({ inputs, currency, rate, totalMonths, vertical = false }: PaymentSummaryCardsProps) => {
  const { t, language } = useLanguage();
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
  const monthNamesShort = language === 'es' 
    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const bookingLabel = `${monthNamesShort[bookingMonth - 1]} ${bookingYear}`;

  const cards = [
    {
      icon: Wallet,
      label: t('initialCashRequired'),
      value: initialCashRequired,
      subLabel: `${t('dueBy')} ${bookingLabel}`,
      borderColor: 'border-theme-accent',
      iconColor: 'text-theme-accent',
      labelColor: 'text-theme-accent',
    },
    {
      icon: TrendingUp,
      label: t('monthlyBurnRate'),
      value: monthlyBurnRate,
      subLabel: `${constructionMonths} ${t('months')} ${t('construction') || 'construction'}`,
      borderColor: 'border-slate-500',
      iconColor: 'text-slate-400',
      labelColor: 'text-slate-400',
      prefix: '~',
    },
    {
      icon: Home,
      label: t('completionBalance'),
      value: handoverBalance,
      subLabel: `${handoverLabel} (${handoverPercent}%)`,
      borderColor: 'border-cyan-500',
      iconColor: 'text-cyan-400',
      labelColor: 'text-cyan-400',
    },
  ];

  return (
    <div className={vertical ? 'flex flex-col gap-2' : 'grid grid-cols-1 sm:grid-cols-3 gap-3'}>
      {cards.map((card, index) => (
        <div 
          key={index}
          className={`bg-theme-card/50 border-l-4 ${card.borderColor} rounded-lg px-3 py-2.5 flex items-center justify-between gap-3`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <card.icon className={`w-4 h-4 ${card.iconColor} flex-shrink-0`} />
            <span className={`text-[11px] uppercase tracking-wide ${card.labelColor} font-medium truncate`}>
              {card.label}
            </span>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-base font-bold text-theme-text font-mono tabular-nums">
              {card.value > 0 ? `${card.prefix || ''}${formatCurrency(card.value, currency, rate)}` : '—'}
            </div>
            <div className="text-[10px] text-theme-text-muted">
              {card.subLabel}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
