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
  type: 'downpayment' | 'milestone' | 'govt-fee' | 'handover';
  date: string;
  isGovFee: boolean;
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
    eoiFee,
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

  // Calculate amounts
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const dldFeeAmount = basePrice * DLD_FEE_PERCENT / 100;
  const handoverPercent = 100 - preHandoverPercent;
  const handoverAmount = basePrice * handoverPercent / 100;

  // Build payments array
  const payments: TimelinePayment[] = [];

  // Entry payments (position 0)
  payments.push({
    id: 'downpayment',
    label: t('downpayment'),
    percent: downpaymentPercent,
    amount: downpaymentAmount,
    monthsFromBooking: 0,
    positionPercent: 0,
    type: 'downpayment',
    date: monthToDateString(bookingMonth, bookingYear),
    isGovFee: false,
  });

  // DLD Fee (govt fee at booking)
  payments.push({
    id: 'dld',
    label: 'DLD (4%)',
    percent: 4,
    amount: dldFeeAmount,
    monthsFromBooking: 0,
    positionPercent: 2, // Slight offset for visibility
    type: 'govt-fee',
    date: monthToDateString(bookingMonth, bookingYear),
    isGovFee: true,
  });

  // Oqood Fee (govt fee at booking)
  if (oqoodFee > 0) {
    payments.push({
      id: 'oqood',
      label: t('oqoodFee'),
      percent: Math.round((oqoodFee / basePrice) * 100 * 10) / 10,
      amount: oqoodFee,
      monthsFromBooking: 0,
      positionPercent: 4, // Slight offset for visibility
      type: 'govt-fee',
      date: monthToDateString(bookingMonth, bookingYear),
      isGovFee: true,
    });
  }

  // Additional payments (milestones)
  additionalPayments.forEach((payment, index) => {
    const amount = basePrice * payment.paymentPercent / 100;
    const isTimeBased = payment.type === 'time';
    
    // Calculate position
    let monthsFromBooking: number;
    if (isTimeBased) {
      monthsFromBooking = payment.triggerValue;
    } else {
      // Construction-based: convert percentage to months
      monthsFromBooking = (payment.triggerValue / 100) * totalMonths;
    }
    
    const positionPercent = Math.min(95, Math.max(8, (monthsFromBooking / totalMonths) * 100));
    
    payments.push({
      id: payment.id,
      label: `${t('constructionMilestone')} ${index + 1}`,
      percent: payment.paymentPercent,
      amount,
      monthsFromBooking,
      positionPercent,
      type: 'milestone',
      date: estimateDateFromMonths(monthsFromBooking),
      isGovFee: false,
    });
  });

  // Handover payment (position 100)
  payments.push({
    id: 'handover',
    label: t('handover'),
    percent: handoverPercent,
    amount: handoverAmount,
    monthsFromBooking: totalMonths,
    positionPercent: 100,
    type: 'handover',
    date: `Q${handoverQuarter} ${handoverYear}`,
    isGovFee: false,
  });

  // Sort by position
  const sortedPayments = [...payments].sort((a, b) => a.positionPercent - b.positionPercent);

  // Group payments at same position for stacking
  const groupedPayments: { [key: number]: TimelinePayment[] } = {};
  sortedPayments.forEach(payment => {
    const key = Math.round(payment.positionPercent);
    if (!groupedPayments[key]) {
      groupedPayments[key] = [];
    }
    groupedPayments[key].push(payment);
  });

  const getMarkerStyle = (payment: TimelinePayment) => {
    if (payment.isGovFee) {
      return {
        bg: 'bg-red-500',
        border: 'border-red-400',
        size: 'w-3 h-3',
        ring: 'ring-red-500/30',
      };
    }
    if (payment.type === 'handover') {
      return {
        bg: 'bg-cyan-400',
        border: 'border-cyan-300',
        size: 'w-4 h-4',
        ring: 'ring-cyan-400/30',
      };
    }
    if (payment.type === 'downpayment') {
      return {
        bg: '',
        border: '',
        size: 'w-3.5 h-3.5',
        ring: '',
        custom: { backgroundColor: accentColor },
      };
    }
    return {
      bg: 'bg-slate-400',
      border: 'border-slate-300',
      size: 'w-2.5 h-2.5',
      ring: 'ring-slate-400/30',
    };
  };

  const startDate = monthToDateString(bookingMonth, bookingYear);
  const endDate = `Q${handoverQuarter} ${handoverYear}`;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-theme-text-muted">
        <span>{startDate}</span>
        <span className="uppercase tracking-wider font-medium">{t('paymentTimelineLabel')}</span>
        <span>{endDate}</span>
      </div>

      {/* Timeline Container */}
      <div className="relative h-20 px-2">
        {/* Track */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-theme-border rounded-full transform -translate-y-1/2" />
        
        {/* Filled portion (pre-handover) */}
        <div 
          className="absolute top-1/2 left-0 h-1 rounded-full transform -translate-y-1/2"
          style={{ 
            width: `${100 - handoverPercent}%`,
            backgroundColor: `${accentColor}40`,
          }}
        />

        {/* Markers */}
        <TooltipProvider delayDuration={0}>
          {Object.entries(groupedPayments).map(([posKey, paymentsAtPos]) => {
            const position = parseInt(posKey);
            
            return paymentsAtPos.map((payment, stackIndex) => {
              const style = getMarkerStyle(payment);
              const isHovered = hoveredId === payment.id;
              const verticalOffset = stackIndex * 6; // Stack vertically if multiple at same position
              
              return (
                <Tooltip key={payment.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute transform -translate-x-1/2 cursor-pointer transition-all duration-200"
                      style={{ 
                        left: `${Math.min(98, Math.max(2, position))}%`,
                        top: `calc(50% - ${verticalOffset}px)`,
                      }}
                      onMouseEnter={() => setHoveredId(payment.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {/* Marker */}
                      <div 
                        className={`
                          ${style.size} ${style.bg} ${style.border} 
                          rounded-full border-2 shadow-lg
                          transition-all duration-200
                          ${isHovered ? `ring-4 ${style.ring} scale-125` : ''}
                        `}
                        style={style.custom}
                      />
                      
                      {/* Label below (only for key payments) */}
                      {(payment.type === 'downpayment' || payment.type === 'handover' || payment.isGovFee) && (
                        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center">
                          <div className={`text-[10px] font-medium ${payment.isGovFee ? 'text-red-400' : 'text-theme-text-muted'}`}>
                            {payment.isGovFee ? (
                              <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[9px]">
                                {t('govFeeLabel')}
                              </span>
                            ) : (
                              `${payment.percent}%`
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className={`${payment.isGovFee ? 'bg-red-900 border-red-700' : 'bg-theme-card border-theme-border'} p-3`}
                  >
                    <div className="space-y-1">
                      <div className={`font-semibold text-sm ${payment.isGovFee ? 'text-red-300' : 'text-theme-text'}`}>
                        {payment.label}
                        {payment.isGovFee && (
                          <span className="ml-2 text-[10px] bg-red-500/30 text-red-300 px-1.5 py-0.5 rounded">
                            {t('govFeeLabel')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-theme-text-muted">{payment.date}</div>
                      <div className="text-sm font-bold font-mono" style={{ color: payment.isGovFee ? '#f87171' : accentColor }}>
                        {formatCurrency(payment.amount, currency, rate)}
                      </div>
                      {!payment.isGovFee && (
                        <div className="text-xs text-theme-text-muted">
                          {payment.percent}% of property
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            });
          })}
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-theme-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
          <span>{t('entryLabel')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-400" />
          <span>{t('constructionMilestone')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>{t('govFeeLabel')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-cyan-400" />
          <span>{t('handover')}</span>
        </div>
      </div>
    </div>
  );
};