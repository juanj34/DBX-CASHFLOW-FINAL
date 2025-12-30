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
      bgFrom: 'from-theme-accent/20',
      bgTo: 'to-theme-accent/5',
      borderColor: 'border-theme-accent/30',
      iconBg: 'bg-theme-accent/20',
      iconColor: 'text-theme-accent',
      labelColor: 'text-theme-accent',
    },
    {
      icon: TrendingUp,
      label: t('monthlyBurnRate'),
      value: monthlyBurnRate,
      subLabel: `${constructionMonths} ${t('months')} ${t('construction') || 'construction'}`,
      bgFrom: 'from-slate-500/20',
      bgTo: 'to-slate-500/5',
      borderColor: 'border-slate-500/30',
      iconBg: 'bg-slate-500/20',
      iconColor: 'text-slate-400',
      labelColor: 'text-slate-400',
      prefix: '~',
    },
    {
      icon: Home,
      label: t('completionBalance'),
      value: handoverBalance,
      subLabel: `${handoverLabel} (${handoverPercent}%)`,
      bgFrom: 'from-cyan-500/20',
      bgTo: 'to-cyan-500/5',
      borderColor: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
      labelColor: 'text-cyan-400',
    },
  ];

  return (
    <div className={vertical ? 'flex flex-col gap-3' : 'grid grid-cols-1 sm:grid-cols-3 gap-3'}>
      {cards.map((card, index) => (
        <div 
          key={index}
          className={`bg-gradient-to-br ${card.bgFrom} ${card.bgTo} border ${card.borderColor} rounded-xl p-4`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center`}>
              <card.icon className={`w-4 h-4 ${card.iconColor}`} />
            </div>
            <span className={`text-xs uppercase tracking-wide ${card.labelColor} font-medium`}>
              {card.label}
            </span>
          </div>
          <div className="text-xl font-bold text-theme-text font-mono tabular-nums text-right">
            {card.value > 0 ? `${card.prefix || ''}${formatCurrency(card.value, currency, rate)}` : '—'}
          </div>
          <div className="text-xs text-theme-text-muted mt-1 text-right">
            {card.subLabel}
          </div>
        </div>
      ))}
    </div>
  );
};
