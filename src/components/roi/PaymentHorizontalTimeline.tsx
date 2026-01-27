import { OIInputs } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { constructionToMonth } from "./constructionProgress";
import { Check, Clock, ArrowRight } from "lucide-react";

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
  isEstimate: boolean;
  isPostHandover?: boolean;
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
  const entryPercent = downpaymentPercent + DLD_FEE_PERCENT;
  
  const handoverPercent = 100 - preHandoverPercent;
  const handoverAmount = basePrice * handoverPercent / 100;

  // Build payments array with TRUE proportional positioning
  const payments: TimelinePayment[] = useMemo(() => {
    const result: TimelinePayment[] = [];

    // Entry (position 0%)
    result.push({
      id: 'entry',
      label: t('booking') || 'Booking',
      percent: entryPercent,
      amount: entryTotal,
      monthsFromBooking: 0,
      positionPercent: 0,
      type: 'entry',
      date: monthToDateString(bookingMonth, bookingYear),
      isEstimate: false,
    });

    // Additional payments (milestones) - use S-curve for construction-linked
    additionalPayments.forEach((payment) => {
      const amount = basePrice * payment.paymentPercent / 100;
      const isTimeBased = payment.type === 'time';
      
      let monthsFromBooking: number;
      let label: string;
      let isEstimate: boolean;
      
      if (isTimeBased) {
        monthsFromBooking = payment.triggerValue;
        label = `M${payment.triggerValue}`;
        isEstimate = false;
      } else {
        monthsFromBooking = constructionToMonth(payment.triggerValue, totalMonths);
        label = `${payment.triggerValue}%`;
        isEstimate = true;
      }
      
      const positionPercent = (monthsFromBooking / totalMonths) * 100;
      
      // Check if this payment is post-handover
      const isPostHandover = positionPercent > 100;
      
      result.push({
        id: payment.id,
        label,
        percent: payment.paymentPercent,
        amount,
        monthsFromBooking,
        positionPercent: Math.min(positionPercent, 100), // Cap at 100% for positioning
        type: 'milestone',
        date: estimateDateFromMonths(monthsFromBooking),
        isEstimate,
        isPostHandover,
      });
    });

    // Handover payment (position 100%)
    result.push({
      id: 'handover',
      label: t('handover') || 'Handover',
      percent: handoverPercent,
      amount: handoverAmount,
      monthsFromBooking: totalMonths,
      positionPercent: 100,
      type: 'handover',
      date: `Q${handoverQuarter} ${handoverYear}`,
      isEstimate: false,
    });

    return result.sort((a, b) => a.positionPercent - b.positionPercent);
  }, [inputs, totalMonths, t, language]);

  // Detect overlapping labels and assign alternating vertical offsets
  const paymentsWithOffsets = useMemo(() => {
    const MIN_SPACING = 12; // Minimum spacing in percentage points to avoid overlap
    const result: Array<TimelinePayment & { labelOffset: 'top' | 'bottom' }> = [];
    
    payments.forEach((payment, index) => {
      // Check if this payment is too close to the previous one
      const prevPayment = result[result.length - 1];
      const isTooClose = prevPayment && 
        Math.abs(payment.positionPercent - prevPayment.positionPercent) < MIN_SPACING;
      
      // If too close and previous is on top, put this one on bottom (and vice versa)
      const labelOffset: 'top' | 'bottom' = isTooClose && prevPayment?.labelOffset === 'top' 
        ? 'bottom' 
        : 'top';
      
      result.push({ ...payment, labelOffset });
    });
    
    return result;
  }, [payments]);

  // No payments have been made yet - progress should be 0
  // The timeline shows the payment plan, not actual progress
  const paidProgress = 0;

  const startDate = monthToDateString(bookingMonth, bookingYear);
  const endDate = `Q${handoverQuarter} ${handoverYear}`;

  // Summary totals
  const totalPreHandover = payments.filter(p => p.type !== 'handover').reduce((sum, p) => sum + p.amount, 0);
  const totalHandover = handoverAmount;

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-emerald-400 uppercase tracking-wide">{t('preHandover') || 'Pre-Handover'}</p>
              <p className="text-lg font-bold text-emerald-400 font-mono">{formatCurrency(totalPreHandover, currency, rate)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-sm font-bold text-emerald-400">{preHandoverPercent}%</span>
            </div>
          </div>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-cyan-400 uppercase tracking-wide">{t('atHandoverLabel') || 'At Handover'}</p>
              <p className="text-lg font-bold text-cyan-400 font-mono">{formatCurrency(totalHandover, currency, rate)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <span className="text-sm font-bold text-cyan-400">{handoverPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-3 h-3 text-emerald-400" />
          </div>
          <span className="text-white font-medium">{startDate}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{totalMonths} {t('months') || 'months'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{endDate}</span>
          <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <ArrowRight className="w-3 h-3 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative h-32 px-4">
        {/* Track Background */}
        <div className="absolute top-1/2 left-4 right-4 h-2 bg-slate-700/80 rounded-full transform -translate-y-1/2" />
        
        {/* Progress Fill - only shows if payments have been made */}
        {paidProgress > 0 && (
          <div 
            className="absolute top-1/2 left-4 h-2 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transform -translate-y-1/2 transition-all duration-500"
            style={{ width: `calc(${paidProgress}% - 16px)` }}
          />
        )}

        {/* Payment Markers */}
        <TooltipProvider delayDuration={0}>
          {paymentsWithOffsets.map((payment, index) => {
            const isHovered = hoveredId === payment.id;
            const leftPercent = payment.positionPercent;
            const leftCalc = `calc(${leftPercent}% + 16px - ${leftPercent * 0.32}px)`;
            
            const markerSize = payment.type === 'handover' ? 'w-8 h-8' : payment.type === 'entry' ? 'w-7 h-7' : 'w-6 h-6';
            const markerColor = payment.type === 'handover' ? 'bg-cyan-500' : payment.type === 'entry' ? 'bg-emerald-500' : payment.isPostHandover ? 'bg-purple-500' : 'bg-slate-500';
            const borderColor = payment.type === 'handover' ? 'border-cyan-300' : payment.type === 'entry' ? 'border-emerald-300' : payment.isPostHandover ? 'border-purple-400' : 'border-slate-400';
            const textColor = payment.type === 'handover' ? 'text-cyan-400' : payment.type === 'entry' ? 'text-emerald-400' : payment.isPostHandover ? 'text-purple-400' : 'text-slate-300';
            
            const isLabelOnTop = payment.labelOffset === 'top';
            
            return (
              <Tooltip key={payment.id}>
                <TooltipTrigger asChild>
                  <div
                    className="absolute transform -translate-x-1/2 cursor-pointer z-10 animate-fade-in"
                    style={{ 
                      left: leftCalc,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      animationDelay: `${index * 150}ms`,
                      animationFillMode: 'both',
                    }}
                    onMouseEnter={() => setHoveredId(payment.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Percent label - positioned based on offset */}
                    {isLabelOnTop ? (
                      <div 
                        className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center animate-fade-in"
                        style={{ animationDelay: `${index * 150 + 100}ms`, animationFillMode: 'both' }}
                      >
                        <div className={`text-sm font-bold ${textColor}`}>
                          {payment.percent}%
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="absolute top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center animate-fade-in"
                        style={{ animationDelay: `${index * 150 + 100}ms`, animationFillMode: 'both' }}
                      >
                        <div className={`text-sm font-bold ${textColor}`}>
                          {payment.percent}%
                        </div>
                      </div>
                    )}
                    
                    {/* Marker Circle with number */}
                    <div 
                      className={`
                        ${markerSize} ${markerColor} ${borderColor}
                        rounded-full shadow-lg border-2
                        flex items-center justify-center
                        transition-all duration-300
                        ${isHovered ? 'scale-125 ring-4 ring-white/30 shadow-xl' : 'hover:scale-110'}
                      `}
                    >
                      <span className="text-xs font-bold text-white">
                        {index + 1}
                      </span>
                    </div>
                    
                    {/* Labels - positioned based on offset */}
                    {isLabelOnTop ? (
                      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center">
                        <div className={`text-[10px] font-semibold ${textColor}`}>
                          {payment.label}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          {payment.isEstimate ? '~' : ''}{payment.date}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center">
                        <div className="text-[9px] text-slate-500 mb-0.5">
                          {payment.isEstimate ? '~' : ''}{payment.date}
                        </div>
                        <div className={`text-[10px] font-semibold ${textColor}`}>
                          {payment.label}
                        </div>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent 
                  side={isLabelOnTop ? "top" : "bottom"}
                  className="bg-slate-800 border-slate-700 p-3 max-w-[220px]"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${markerColor} flex items-center justify-center`}>
                        <span className="text-[10px] font-bold text-white">{index + 1}</span>
                      </div>
                      <span className="font-semibold text-sm text-white">{payment.label}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {payment.isEstimate ? '~' : ''}{payment.date}
                      {payment.isEstimate && <span className="text-amber-400 ml-1">({t('estimate') || 'estimate'})</span>}
                    </div>
                    <div className="text-lg font-bold font-mono text-white">
                      {formatCurrency(payment.amount, currency, rate)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {payment.percent}% {t('ofPropertyPrice') || 'of property price'}
                    </div>
                    {payment.type === 'entry' && (
                      <div className="text-[10px] text-amber-400 pt-1 border-t border-slate-700">
                        {t('includesDldOqood') || 'Includes DLD (4%) + Oqood fees'}
                      </div>
                    )}
                    {payment.isPostHandover && (
                      <div className="text-[10px] text-purple-400 pt-1 border-t border-slate-700">
                        Post-handover payment
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
      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">1</span>
          </div>
          <span>{t('booking') || 'Booking'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-slate-500 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">#</span>
          </div>
          <span>{t('milestones') || 'Milestones'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-cyan-500 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">✓</span>
          </div>
          <span>{t('handover') || 'Handover'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">+</span>
          </div>
          <span>Post-HO</span>
        </div>
      </div>
    </div>
  );
};
