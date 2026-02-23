import { OIInputs, monthName } from "./useOICalculations";
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
  const { basePrice, downpaymentPercent, additionalPayments, preHandoverPercent, oqoodFee, eoiFee, bookingMonth, bookingYear, handoverMonth, handoverYear } = inputs;

  // Calculate Initial Cash Required (Booking + DLD + Oqood + Downpayment)
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const dldFeeAmount = basePrice * DLD_FEE_PERCENT / 100;
  const initialCashRequired = downpaymentAmount + dldFeeAmount + oqoodFee;

  // Calculate Monthly Burn Rate during construction
  const additionalTotal = additionalPayments.reduce((sum, m) => sum + (basePrice * m.paymentPercent / 100), 0);
  
  // Calculate construction period in months
  const bookingDate = new Date(bookingYear, bookingMonth - 1, 1);
  const handoverDate = new Date(handoverYear, handoverMonth - 1, 1);
  const constructionMonths = Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  
  const monthlyBurnRate = additionalTotal > 0 && constructionMonths > 0 
    ? additionalTotal / constructionMonths 
    : 0;

  // Calculate Handover Balance
  const handoverPercent = 100 - preHandoverPercent;
  const handoverBalance = basePrice * handoverPercent / 100;

  // Format handover date
  const handoverLabel = `${monthName(handoverMonth)} ${handoverYear}`;

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
      bgFrom: 'from-theme-accent/20',
      bgTo: 'to-theme-accent/5',
      borderColor: 'border-theme-accent/40',
      iconColor: 'text-theme-accent',
      labelColor: 'text-theme-accent',
    },
    {
      icon: TrendingUp,
      label: t('monthlyBurnRate'),
      value: monthlyBurnRate,
      subLabel: `${constructionMonths} ${t('months')} ${t('construction') || 'construction'}`,
      bgFrom: 'from-theme-card-alt/40',
      bgTo: 'to-theme-card-alt/10',
      borderColor: 'border-theme-border',
      iconColor: 'text-theme-text-muted',
      labelColor: 'text-theme-text-muted',
      prefix: '~',
    },
    {
      icon: Home,
      label: t('completionBalance'),
      value: handoverBalance,
      subLabel: `${handoverLabel} (${handoverPercent}%)`,
      bgFrom: 'from-cyan-500/20',
      bgTo: 'to-cyan-500/5',
      borderColor: 'border-cyan-500/40',
      iconColor: 'text-cyan-400',
      labelColor: 'text-cyan-400',
    },
  ];

  return (
    <div className={vertical ? 'flex flex-col gap-3' : 'grid grid-cols-1 sm:grid-cols-3 gap-3'}>
      {cards.map((card, index) => (
        <div 
          key={index}
          className={`bg-gradient-to-br ${card.bgFrom} ${card.bgTo} border ${card.borderColor} rounded-xl p-3.5`}
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className={`w-4 h-4 ${card.iconColor}`} />
            <span className={`text-[11px] uppercase tracking-wide ${card.labelColor} font-medium`}>
              {card.label}
            </span>
          </div>
          <div className="text-lg font-bold text-theme-text font-mono tabular-nums">
            {card.value > 0 ? `${card.prefix || ''}${formatCurrency(card.value, currency, rate)}` : '—'}
          </div>
          <div className="text-[10px] text-theme-text-muted mt-1">
            {card.subLabel}
          </div>
        </div>
      ))}
    </div>
  );
};
