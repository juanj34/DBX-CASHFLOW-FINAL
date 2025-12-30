import { OIInputs } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PaymentHorizontalTimelineProps {
  inputs: OIInputs;
  currency: Currency;
  rate: number;
  totalMonths: number;
  accentColor?: string;
}

interface TimelinePayment {
  id: string;
  label: string;
  percent: number;
  amount: number;
  monthsFromBooking: number;
  positionPercent: number;
  type: 'entry' | 'milestone' | 'handover';
  date: string;
  monthLabel: string;
}

// DLD Fee is always 4%
const DLD_FEE_PERCENT = 4;

export const PaymentHorizontalTimeline = ({ 
  inputs, 
  currency, 
  rate, 
  totalMonths,
  accentColor = '#CCFF00' 
}: PaymentHorizontalTimelineProps) => {
  const { t, language } = useLanguage();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  const { 
    basePrice, 
    downpaymentPercent, 
    additionalPayments, 
    preHandoverPercent,
    oqoodFee,
    bookingMonth, 
    bookingYear, 
    handoverQuarter, 
    handoverYear 
  } = inputs;

  // Helper to format date
  const monthToDateString = (month: number, year: number): string => {
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthNames = language === 'es' ? monthNamesEs : monthNamesEn;
    return `${monthNames[month - 1]} ${year}`;
  };

  const estimateDateFromMonths = (months: number): string => {
    const totalMonthsFromJan = bookingMonth + months;
    const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
    const month = ((totalMonthsFromJan - 1) % 12) + 1;
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthNames = language === 'es' ? monthNamesEs : monthNamesEn;
    return `${monthNames[month - 1]} ${bookingYear + yearOffset}`;
  };

  // Calculate amounts - Entry includes DLD (24% typically)
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const dldFeeAmount = basePrice * DLD_FEE_PERCENT / 100;
  const entryTotal = downpaymentAmount + dldFeeAmount + oqoodFee;
  const entryPercent = downpaymentPercent + DLD_FEE_PERCENT; // Show combined 24%
  
  const handoverPercent = 100 - preHandoverPercent;
  const handoverAmount = basePrice * handoverPercent / 100;

  // Build payments array with TRUE proportional positioning
  const payments: TimelinePayment[] = [];

  // Entry (position 0%)
  payments.push({
    id: 'entry',
    label: t('entry') || 'Entry',
    percent: entryPercent,
    amount: entryTotal,
    monthsFromBooking: 0,
    positionPercent: 0,
    type: 'entry',
    date: monthToDateString(bookingMonth, bookingYear),
    monthLabel: 'M0',
  });

  // Additional payments (milestones) - TRUE proportional positioning
  additionalPayments.forEach((payment, index) => {
    const amount = basePrice * payment.paymentPercent / 100;
    const isTimeBased = payment.type === 'time';
    
    // Calculate months from booking
    let monthsFromBooking: number;
    if (isTimeBased) {
      monthsFromBooking = payment.triggerValue;
    } else {
      // Construction-based: convert percentage to months
      monthsFromBooking = Math.round((payment.triggerValue / 100) * totalMonths);
    }
    
    // TRUE proportional positioning: (months / totalMonths) * 100 - NO CLAMPING
    const positionPercent = (monthsFromBooking / totalMonths) * 100;
    
    payments.push({
      id: payment.id,
      label: `M${index + 1}`,
      percent: payment.paymentPercent,
      amount,
      monthsFromBooking,
      positionPercent,
      type: 'milestone',
      date: estimateDateFromMonths(monthsFromBooking),
      monthLabel: `M${monthsFromBooking}`,
    });
  });

  // Handover payment (position 100%)
  payments.push({
    id: 'handover',
    label: t('completion') || 'Handover',
    percent: handoverPercent,
    amount: handoverAmount,
    monthsFromBooking: totalMonths,
    positionPercent: 100,
    type: 'handover',
    date: `Q${handoverQuarter} ${handoverYear}`,
    monthLabel: `M${totalMonths}`,
  });

  // Sort by position
  const sortedPayments = [...payments].sort((a, b) => a.positionPercent - b.positionPercent);

  const getMarkerStyle = (payment: TimelinePayment, isHovered: boolean) => {
    const baseSize = payment.type === 'handover' ? 'w-5 h-5' : payment.type === 'entry' ? 'w-4 h-4' : 'w-3.5 h-3.5';
    const hoverSize = payment.type === 'handover' ? 'w-6 h-6' : payment.type === 'entry' ? 'w-5 h-5' : 'w-4 h-4';
    
    if (payment.type === 'handover') {
      return {
        bg: 'bg-cyan-400',
        border: 'border-cyan-300',
        size: isHovered ? hoverSize : baseSize,
        ring: 'ring-cyan-400/40',
      };
    }
    if (payment.type === 'entry') {
      return {
        bg: '',
        border: 'border-2 border-white/30',
        size: isHovered ? hoverSize : baseSize,
        ring: 'ring-theme-accent/40',
        custom: { backgroundColor: accentColor },
      };
    }
    return {
      bg: 'bg-slate-400',
      border: 'border-slate-300',
      size: isHovered ? hoverSize : baseSize,
      ring: 'ring-slate-400/30',
    };
  };

  const startDate = monthToDateString(bookingMonth, bookingYear);
  const endDate = `Q${handoverQuarter} ${handoverYear}`;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-theme-text font-medium">{startDate}</span>
        <span className="text-theme-text-muted uppercase tracking-wider text-[11px]">{t('paymentTimeline')}</span>
        <span className="text-theme-text font-medium">{endDate}</span>
      </div>

      {/* Timeline Container */}
      <div className="relative h-28 px-4">
        {/* Track - neutral gray, no green fill */}
        <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-theme-border/50 rounded-full transform -translate-y-1/2" />

        {/* Payment Markers */}
        <TooltipProvider delayDuration={0}>
          {sortedPayments.map((payment) => {
            const isHovered = hoveredId === payment.id;
            const style = getMarkerStyle(payment, isHovered);
            
            // Calculate left position accounting for container padding
            const leftPercent = payment.positionPercent;
            const leftCalc = `calc(${leftPercent}% + 16px - ${leftPercent * 0.32}px)`;
            
            return (
              <Tooltip key={payment.id}>
                <TooltipTrigger asChild>
                  <div
                    className="absolute transform -translate-x-1/2 cursor-pointer transition-all duration-200 z-10"
                    style={{ 
                      left: leftCalc,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                    onMouseEnter={() => setHoveredId(payment.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Percent label above marker */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center">
                      <div className={`text-xs font-bold ${
                        payment.type === 'handover' ? 'text-cyan-400' : 
                        payment.type === 'entry' ? 'text-theme-accent' : 
                        'text-slate-400'
                      }`}>
                        {payment.percent}%
                      </div>
                    </div>
                    
                    {/* Marker */}
                    <div 
                      className={`
                        ${style.size} ${style.bg} ${style.border} 
                        rounded-full shadow-lg
                        transition-all duration-200
                        ${isHovered ? `ring-4 ${style.ring}` : ''}
                      `}
                      style={style.custom}
                    />
                    
                    {/* Labels below marker */}
                    <div className="absolute top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center">
                      <div className={`text-[10px] font-semibold ${
                        payment.type === 'handover' ? 'text-cyan-400' : 
                        payment.type === 'entry' ? 'text-theme-accent' : 
                        'text-slate-400'
                      }`}>
                        {payment.label}
                      </div>
                      <div className="text-[9px] text-theme-text-muted mt-0.5">
                        {payment.monthLabel}
                      </div>
                      <div className="text-[9px] text-theme-text-muted">
                        {payment.date}
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="bg-theme-card border-theme-border p-3 max-w-[200px]"
                >
                  <div className="space-y-1.5">
                    <div className="font-semibold text-sm text-theme-text">
                      {payment.label}
                    </div>
                    <div className="text-xs text-theme-text-muted">{payment.date}</div>
                    <div className="text-sm font-bold font-mono" style={{ color: payment.type === 'handover' ? '#22d3ee' : accentColor }}>
                      {formatCurrency(payment.amount, currency, rate)}
                    </div>
                    <div className="text-xs text-theme-text-muted">
                      {payment.percent}% of property
                    </div>
                    {payment.type === 'entry' && (
                      <div className="text-[10px] text-red-400 pt-1 border-t border-theme-border">
                        Incl. DLD ({DLD_FEE_PERCENT}%) + Oqood fees
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 text-[11px] text-theme-text-muted pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }} />
          <span>{t('entry') || 'Entry'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <span>{t('milestone')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-cyan-400" />
          <span>{t('completion') || 'Completion'}</span>
        </div>
      </div>
    </div>
  );
};
