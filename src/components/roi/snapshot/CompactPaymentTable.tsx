import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CreditCard, ArrowRight, Users, Sparkles, Key, Wallet, Info } from 'lucide-react';
import { OIInputs, PaymentMilestone } from '../useOICalculations';
import { ClientUnitData } from '../ClientUnitInfo';
import { Currency, formatDualCurrency } from '../currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { DottedRow } from './DottedRow';
import { PaymentSplitModal } from './PaymentSplitModal';
import { PaymentSelectionBar } from './PaymentSelectionBar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

interface CompactPaymentTableProps {
  inputs: OIInputs;
  clientInfo?: ClientUnitData;
  valueDifferentiators?: string[];
  appreciationBonus?: number;
  currency: Currency;
  rate: number;
  totalMonths: number;
  /** Control multi-column layout for journey section: 'auto' (>12 payments), 'always', or 'never'. Default: 'auto' */
  twoColumnMode?: 'auto' | 'always' | 'never';
  /** Number of columns to use when multi-column is enabled (2 or 3). Default: 2 */
  columnCount?: 2 | 3;
}

const monthToDateString = (month: number, year: number, language: string): string => {
  const monthNames = language === 'es' 
    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1]} ${year}`;
};

const getQuarterMonths = (quarter: number, language: string): string => {
  const quarterMonths = language === 'es'
    ? ['Ene-Mar', 'Abr-Jun', 'Jul-Sep', 'Oct-Dic']
    : ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'];
  return quarterMonths[quarter - 1];
};

const estimateDateFromMonths = (monthsFromBooking: number, bookingMonth: number, bookingYear: number, language: string): string => {
  const totalMonths = bookingMonth + monthsFromBooking;
  const yearOffset = Math.floor((totalMonths - 1) / 12);
  const month = ((totalMonths - 1) % 12) + 1;
  return monthToDateString(month, bookingYear + yearOffset, language);
};

// Check if payment falls in handover quarter
const isPaymentInHandoverQuarter = (monthsFromBooking: number, bookingMonth: number, bookingYear: number, handoverQuarter: number, handoverYear: number): boolean => {
  // Calculate actual payment date using Date object for accuracy
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);
  
  const paymentYear = paymentDate.getFullYear();
  const paymentMonth = paymentDate.getMonth() + 1;
  const paymentQuarter = Math.ceil(paymentMonth / 3);
  
  return paymentYear === handoverYear && paymentQuarter === handoverQuarter;
};

// Check if payment is AFTER the handover month (month-based detection for accuracy)
// Uses handoverMonth (1-12) if available, falls back to quarter-based detection
const isPaymentAfterHandover = (
  monthsFromBooking: number, 
  bookingMonth: number, 
  bookingYear: number, 
  handoverMonth: number | undefined,
  handoverQuarter: number, 
  handoverYear: number
): boolean => {
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);
  
  // If we have the exact handover month, use it for precise detection
  if (handoverMonth !== undefined) {
    const handoverDate = new Date(handoverYear, handoverMonth - 1);
    return paymentDate > handoverDate;
  }
  
  // Fallback: use quarter-based detection (end of quarter)
  const handoverQuarterEndMonth = handoverQuarter * 3;
  const handoverQuarterEnd = new Date(handoverYear, handoverQuarterEndMonth - 1, 28);
  return paymentDate > handoverQuarterEnd;
};

export const CompactPaymentTable = ({
  inputs,
  clientInfo,
  valueDifferentiators = [],
  appreciationBonus = 0,
  currency,
  rate,
  totalMonths,
  twoColumnMode = 'auto',
  columnCount = 2,
}: CompactPaymentTableProps) => {
  const { language, t } = useLanguage();
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<Map<string, number>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  
  // Clear selection when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSelectedPayments(new Map());
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle mouse up to stop dragging
  useEffect(() => {
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);
  
  // Start drag selection on mousedown
  const handleMouseDown = useCallback((e: React.MouseEvent, id: string, amount: number) => {
    e.preventDefault(); // Prevent text selection
    isDragging.current = true;
    // Start fresh selection with this row
    setSelectedPayments(new Map([[id, amount]]));
  }, []);
  
  // Add to selection on mouseenter while dragging
  const handleMouseEnter = useCallback((id: string, amount: number) => {
    if (isDragging.current) {
      setSelectedPayments(prev => {
        const next = new Map(prev);
        next.set(id, amount);
        return next;
      });
    }
  }, []);
  
  // Toggle payment selection (for single click without drag)
  const togglePaymentSelection = useCallback((id: string, amount: number) => {
    setSelectedPayments(prev => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, amount);
      }
      return next;
    });
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedPayments(new Map());
  }, []);
  
  const { 
    basePrice, 
    downpaymentPercent, 
    additionalPayments, 
    bookingMonth, 
    bookingYear,
    handoverMonth, // NEW: month-based handover (1-12)
    handoverQuarter,
    handoverYear,
    oqoodFee,
    eoiFee = 0
  } = inputs;
  
  // Check for post-handover plan
  const hasPostHandoverPlan = inputs.hasPostHandoverPlan ?? false;
  
  // Calculate amounts
  const downpaymentAmount = basePrice * (downpaymentPercent / 100);
  const remainingDownpayment = downpaymentAmount - eoiFee;
  const dldFee = basePrice * 0.04;
  
  // Sort additional payments
  const sortedPayments = [...(additionalPayments || [])].sort((a, b) => {
    if (a.type === 'time' && b.type === 'time') return a.triggerValue - b.triggerValue;
    if (a.type === 'construction' && b.type === 'construction') return a.triggerValue - b.triggerValue;
    return a.type === 'time' ? -1 : 1;
  });

  // Derive pre-handover and post-handover payments from additionalPayments by date
  // Pre-handover includes payments UP TO AND INCLUDING the handover month/quarter
  // Post-handover is STRICTLY AFTER the handover
  const preHandoverPayments = hasPostHandoverPlan
    ? sortedPayments.filter(p => {
        if (p.type !== 'time') return true; // construction-based = pre-handover
        return !isPaymentAfterHandover(p.triggerValue, bookingMonth, bookingYear, handoverMonth, handoverQuarter, handoverYear);
      })
    : sortedPayments;

  const derivedPostHandoverPayments = hasPostHandoverPlan
    ? sortedPayments.filter(p => {
        if (p.type !== 'time') return false;
        return isPaymentAfterHandover(p.triggerValue, bookingMonth, bookingYear, handoverMonth, handoverQuarter, handoverYear);
      })
    : [];
  
  // Calculate handover and post-handover amounts
  let handoverPercent: number;
  let handoverAmount: number;
  let postHandoverTotal = 0;
  
  // Calculate total percentage from all payments
  const totalAdditionalPercent = sortedPayments.reduce((sum, p) => sum + p.paymentPercent, 0);
  const totalAllocatedPercent = downpaymentPercent + totalAdditionalPercent;
  
  if (hasPostHandoverPlan) {
    // Calculate from derived payments
    postHandoverTotal = derivedPostHandoverPayments.reduce(
      (sum, p) => sum + (basePrice * p.paymentPercent / 100), 0
    );
    
    // Check if payments already sum to 100% - if so, handover is already included
    // and we should NOT add an extra onHandoverPercent
    if (Math.abs(totalAllocatedPercent - 100) < 0.5) {
      // All payments are in additionalPayments, no separate handover payment
      handoverPercent = 0;
      handoverAmount = 0;
    } else {
      // Use configured onHandoverPercent for explicit handover payment
      handoverPercent = inputs.onHandoverPercent || 0;
      handoverAmount = basePrice * handoverPercent / 100;
    }
  } else {
    handoverPercent = 100 - inputs.preHandoverPercent;
    handoverAmount = basePrice * handoverPercent / 100;
  }
  
  // Entry subtotal (before fees)
  const entrySubtotal = downpaymentAmount;
  
  // Entry total (with fees)
  const entryTotal = downpaymentAmount + dldFee + oqoodFee;

  // Calculate journey total (pre-handover installments excluding downpayment)
  const journeyTotal = preHandoverPayments.reduce(
    (sum, p) => sum + (basePrice * p.paymentPercent / 100), 0
  );
  
  // Calculate journey percentage
  const journeyPercent = preHandoverPayments.reduce(
    (sum, p) => sum + p.paymentPercent, 0
  );

  // Determine if we should use multi-column layout for journey section
  const useMultiColumn = useMemo(() => {
    if (twoColumnMode === 'never') return false;
    if (twoColumnMode === 'always') return true;
    // Auto: trigger when total payments > 12
    const totalPayments = preHandoverPayments.length + derivedPostHandoverPayments.length;
    return totalPayments > 12;
  }, [twoColumnMode, preHandoverPayments.length, derivedPostHandoverPayments.length]);

  // Determine actual column count based on payment count
  const actualColumnCount = useMemo(() => {
    if (!useMultiColumn) return 1;
    // If explicit columnCount prop is provided and valid, use it
    if (columnCount === 3) return 3;
    // Auto-upgrade to 3 columns for very long plans
    const totalPayments = preHandoverPayments.length + derivedPostHandoverPayments.length;
    if (totalPayments >= 21) return 3;
    return 2;
  }, [useMultiColumn, columnCount, preHandoverPayments.length, derivedPostHandoverPayments.length]);

  // Helper to split payments into N columns
  const splitIntoColumns = useCallback((payments: PaymentMilestone[], numColumns: number) => {
    if (numColumns <= 1 || payments.length === 0) {
      return [payments];
    }
    const itemsPerColumn = Math.ceil(payments.length / numColumns);
    return Array.from({ length: numColumns }, (_, i) =>
      payments.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn)
    );
  }, []);

  // Split journey payments into columns
  const splitJourneyPayments = useMemo(() => {
    return splitIntoColumns(preHandoverPayments, actualColumnCount);
  }, [preHandoverPayments, actualColumnCount, splitIntoColumns]);

  // Split post-handover payments into columns
  const splitPostHandoverPayments = useMemo(() => {
    return splitIntoColumns(derivedPostHandoverPayments, actualColumnCount);
  }, [derivedPostHandoverPayments, actualColumnCount, splitIntoColumns]);

  // Legacy compatibility aliases
  const useTwoColumns = useMultiColumn;

  // Total Cash Until Handover = Entry + Journey + On Handover (for grand total)
  const totalUntilHandover = entryTotal + journeyTotal + handoverAmount;
  
  // "Total to this point" = entry + journey payments only
  // Handover payment is shown AFTER this total in the UI
  const totalToHandoverQuarter = entryTotal + journeyTotal;
  
  const getPaymentLabel = (payment: PaymentMilestone): string => {
    if (payment.type === 'time') {
      return `Month ${payment.triggerValue}`;
    }
    if (payment.type === 'construction') {
      return `${payment.triggerValue}% Built`;
    }
    return payment.label || 'Payment';
  };
  
  // Check if payment is construction-based (needs S-curve disclaimer)
  const isConstructionPayment = (payment: PaymentMilestone): boolean => {
    return payment.type === 'construction';
  };
  
  const getPaymentDate = (payment: PaymentMilestone): string => {
    if (payment.type === 'time') {
      return estimateDateFromMonths(payment.triggerValue, bookingMonth, bookingYear, language);
    }
    if (payment.type === 'construction') {
      // S-curve estimation for construction milestones
      const monthsForPercent = Math.round((payment.triggerValue / 100) * totalMonths);
      return `~${estimateDateFromMonths(monthsForPercent, bookingMonth, bookingYear, language)}`;
    }
    return '';
  };

  // Dual currency helpers
  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };

  // Check for multiple clients
  const hasMultipleClients = clientInfo?.clients && clientInfo.clients.length > 1;

  // Grand total calculation
  const grandTotal = hasPostHandoverPlan
    ? entryTotal + journeyTotal + handoverAmount + postHandoverTotal
    : entryTotal + journeyTotal + handoverAmount;

  return (
    <>
      <div ref={containerRef} className="bg-theme-card border border-theme-border rounded-xl overflow-hidden h-fit">
        {/* Header */}
        <div className="p-3 border-b border-theme-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-semibold text-theme-text uppercase tracking-wide">{t('paymentBreakdownHeader')}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* View Split button for multiple clients */}
            {hasMultipleClients && clientInfo && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSplitModalOpen(true)}
                className="text-xs h-6 px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
              >
                <Users className="w-3 h-3 mr-1" />
                {t('viewSplitLabel')}
              </Button>
            )}
            <div className="flex items-center gap-1.5 text-[10px] text-theme-text-muted">
              <span>{monthToDateString(bookingMonth, bookingYear, language)}</span>
              <ArrowRight className="w-3 h-3" />
              <span>Q{handoverQuarter} ({getQuarterMonths(handoverQuarter, language)}) {handoverYear}</span>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-3 space-y-3">
          {/* Section: The Entry */}
          <div>
            <div className="text-[10px] uppercase tracking-wide text-theme-accent font-semibold mb-2">
              {t('theEntryLabel')}
            </div>
            <div className="space-y-1">
              {/* EOI / Booking Fee */}
              {eoiFee > 0 && (
                <div
                  onMouseDown={(e) => handleMouseDown(e, 'eoi', eoiFee)}
                  onMouseEnter={() => handleMouseEnter('eoi', eoiFee)}
                  className={cn(
                    "cursor-pointer rounded transition-colors select-none",
                    selectedPayments.has('eoi') && "bg-theme-accent/20 ring-1 ring-theme-accent/40"
                  )}
                >
                  <DottedRow 
                    label={t('eoiBookingLabel')}
                    value={getDualValue(eoiFee).primary}
                    secondaryValue={getDualValue(eoiFee).secondary}
                  />
                </div>
              )}
              {/* Remaining Downpayment (or full if no EOI) */}
              <div
                onMouseDown={(e) => handleMouseDown(e, 'downpayment', eoiFee > 0 ? remainingDownpayment : downpaymentAmount)}
                onMouseEnter={() => handleMouseEnter('downpayment', eoiFee > 0 ? remainingDownpayment : downpaymentAmount)}
                className={cn(
                  "cursor-pointer rounded transition-colors select-none",
                  selectedPayments.has('downpayment') && "bg-theme-accent/20 ring-1 ring-theme-accent/40"
                )}
              >
                <DottedRow 
                  label={eoiFee > 0 ? t('downpaymentBalanceLabel') : `${t('downpaymentPercentLabel')} (${downpaymentPercent}%)`}
                  value={getDualValue(eoiFee > 0 ? remainingDownpayment : downpaymentAmount).primary}
                  secondaryValue={getDualValue(eoiFee > 0 ? remainingDownpayment : downpaymentAmount).secondary}
                />
              </div>
              {/* Subtotal Pre-Handover (if EOI exists) */}
              {eoiFee > 0 && (
                <div className="pt-1 border-t border-dashed border-theme-border/50 mt-1">
                  <DottedRow 
                    label={`${t('subtotalLabel')} (${downpaymentPercent}%)`}
                    value={getDualValue(entrySubtotal).primary}
                    secondaryValue={getDualValue(entrySubtotal).secondary}
                    className="text-theme-text-muted"
                  />
                </div>
              )}
              <div
                onMouseDown={(e) => handleMouseDown(e, 'dld', dldFee)}
                onMouseEnter={() => handleMouseEnter('dld', dldFee)}
                className={cn(
                  "cursor-pointer rounded transition-colors select-none",
                  selectedPayments.has('dld') && "bg-theme-accent/20 ring-1 ring-theme-accent/40"
                )}
              >
                <DottedRow 
                  label={t('dldFeeLabel')}
                  value={getDualValue(dldFee).primary}
                  secondaryValue={getDualValue(dldFee).secondary}
                />
              </div>
              <div
                onMouseDown={(e) => handleMouseDown(e, 'oqood', oqoodFee)}
                onMouseEnter={() => handleMouseEnter('oqood', oqoodFee)}
                className={cn(
                  "cursor-pointer rounded transition-colors select-none",
                  selectedPayments.has('oqood') && "bg-theme-accent/20 ring-1 ring-theme-accent/40"
                )}
              >
                <DottedRow 
                  label={t('oqoodAdminLabel')}
                  value={getDualValue(oqoodFee).primary}
                  secondaryValue={getDualValue(oqoodFee).secondary}
                />
              </div>
              <div className="pt-1 border-t border-theme-border mt-1">
                <DottedRow 
                  label={t('totalEntryLabel')}
                  value={getDualValue(entryTotal).primary}
                  secondaryValue={getDualValue(entryTotal).secondary}
                  bold
                  valueClassName="text-primary"
                />
              </div>
            </div>
          </div>

          {/* Section: The Journey (Pre-Handover) - with optional 2-column layout */}
          {preHandoverPayments.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-cyan-400 font-semibold mb-2">
                {t('theJourneyLabel')} ({totalMonths}{t('moShort')})
              </div>
              
              {/* Render payment row - extracted for reuse */}
              {(() => {
                const renderPaymentRow = (payment: PaymentMilestone, index: number, originalIndex: number) => {
                  const amount = basePrice * (payment.paymentPercent / 100);
                  const dateStr = getPaymentDate(payment);
                  const labelWithDate = dateStr ? `${getPaymentLabel(payment)} (${dateStr})` : getPaymentLabel(payment);
                  
                  // Check for handover indicators - highlight payments in handover quarter
                  // BUT NOT for post-handover plans, which have an explicit handover section
                  const isHandoverQuarterPayment = !hasPostHandoverPlan && payment.type === 'time' && isPaymentInHandoverQuarter(
                    payment.triggerValue,
                    bookingMonth,
                    bookingYear,
                    handoverQuarter,
                    handoverYear
                  );
                  
                  // Check if this is the LAST payment in the handover quarter (for cumulative total display)
                  // Only show in single-column mode - in 2-column we show subtotal at end
                  const isLastHandoverQuarterPayment = !useTwoColumns && isHandoverQuarterPayment && 
                    !preHandoverPayments.slice(originalIndex + 1).some(p => 
                      p.type === 'time' && isPaymentInHandoverQuarter(p.triggerValue, bookingMonth, bookingYear, handoverQuarter, handoverYear)
                    );
                  
                  const paymentId = `journey-${originalIndex}`;
                  const isSelected = selectedPayments.has(paymentId);
                  
                  return (
                    <div key={originalIndex}>
                      <div 
                        onMouseDown={(e) => handleMouseDown(e, paymentId, amount)}
                        onMouseEnter={() => handleMouseEnter(paymentId, amount)}
                        className={cn(
                          "flex items-center justify-between gap-2 cursor-pointer rounded transition-colors select-none",
                          isHandoverQuarterPayment && "bg-green-500/10 px-1 py-0.5 -mx-1 border-l-2 border-green-400",
                          isSelected && "ring-1 ring-theme-accent/40 bg-theme-accent/20"
                        )}
                      >
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <span className={cn("text-xs text-theme-text-muted", useTwoColumns ? "truncate text-[11px]" : "truncate")}>
                            {payment.paymentPercent}% · {labelWithDate}
                          </span>
                          {isConstructionPayment(payment) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-orange-400/70 shrink-0 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[200px]">
                                  <p className="text-xs">Estimated date based on typical Dubai construction S-curve. Actual timing may vary.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {isHandoverQuarterPayment && !useTwoColumns && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 whitespace-nowrap flex items-center gap-0.5">
                              <Key className="w-2.5 h-2.5" />
                              {t('handoverBadge')}
                            </span>
                          )}
                        </div>
                        <span className={cn("text-xs font-mono text-theme-text whitespace-nowrap flex-shrink-0", useTwoColumns && "text-[10px]")}>
                          {getDualValue(amount).primary}
                          {currency !== 'AED' && (
                            <span className={cn("text-theme-text-muted ml-1", useTwoColumns && "text-[9px]")}>({getDualValue(amount).secondary})</span>
                          )}
                        </span>
                      </div>
                      
                      {/* Show cumulative total right after the last handover quarter payment - single column only */}
                      {isLastHandoverQuarterPayment && (
                        <div className="mt-2 pt-1.5 border-t border-dashed border-theme-border/50">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-theme-text-muted flex items-center gap-1">
                              <Wallet className="w-2.5 h-2.5" />
                              {t('totalToThisPointLabel')}
                            </span>
                            <span className="font-mono text-theme-accent font-medium">
                              {getDualValue(totalToHandoverQuarter).primary}
                              {currency !== 'AED' && (
                                <span className="text-theme-text-muted ml-1">({getDualValue(totalToHandoverQuarter).secondary})</span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                };

                // Multi-column layout
                if (useTwoColumns) {
                  const gridColsClass = actualColumnCount === 3 ? 'grid-cols-3' : 'grid-cols-2';
                  return (
                    <div className={cn("grid gap-4", gridColsClass)}>
                      {splitJourneyPayments.map((columnPayments, colIndex) => (
                        <div key={colIndex} className="space-y-1">
                          {columnPayments.map((payment, index) => {
                            const originalIndex = preHandoverPayments.indexOf(payment);
                            return renderPaymentRow(payment, index, originalIndex);
                          })}
                        </div>
                      ))}
                    </div>
                  );
                }

                // Single-column layout (original)
                return (
                  <div className="space-y-1">
                    {preHandoverPayments.map((payment, index) => renderPaymentRow(payment, index, index))}
                  </div>
                );
              })()}
              
              {/* Journey Subtotal */}
              {preHandoverPayments.length > 0 && (
                <div className="pt-1 border-t border-theme-border mt-2">
                  <DottedRow 
                    label={`${t('subtotalLabel')} (${journeyPercent}%)`}
                    value={getDualValue(journeyTotal).primary}
                    secondaryValue={getDualValue(journeyTotal).secondary}
                    bold
                    valueClassName="text-cyan-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* Section: Handover - show for standard plans OR post-handover plans with onHandoverPercent > 0 */}
          {/* For post-handover plans with 0% on-handover, cumulative is shown inline after last handover quarter payment above */}
          {!hasPostHandoverPlan && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-green-400 font-semibold mb-2">
                {t('handoverBadge')} ({handoverPercent}%)
              </div>
              <div className="space-y-1">
                <div
                  onMouseDown={(e) => handleMouseDown(e, 'handover', handoverAmount)}
                  onMouseEnter={() => handleMouseEnter('handover', handoverAmount)}
                  className={cn(
                    "cursor-pointer rounded transition-colors select-none",
                    selectedPayments.has('handover') && "bg-theme-accent/20 ring-1 ring-theme-accent/40"
                  )}
                >
                  <DottedRow 
                    label={t('finalPayment')}
                    value={getDualValue(handoverAmount).primary}
                    secondaryValue={getDualValue(handoverAmount).secondary}
                    bold
                    valueClassName="text-green-400"
                  />
                </div>
              </div>
            </div>
          )}

          {hasPostHandoverPlan && handoverPercent > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-green-400 font-semibold mb-2">
                {t('onHandoverLabel')} ({handoverPercent}%)
              </div>
              <div className="space-y-1">
                <div
                  onMouseDown={(e) => handleMouseDown(e, 'onhandover', handoverAmount)}
                  onMouseEnter={() => handleMouseEnter('onhandover', handoverAmount)}
                  className={cn(
                    "cursor-pointer rounded transition-colors select-none",
                    selectedPayments.has('onhandover') && "bg-theme-accent/20 ring-1 ring-theme-accent/40"
                  )}
                >
                  <DottedRow 
                    label={t('handoverPaymentAlt')}
                    value={getDualValue(handoverAmount).primary}
                    secondaryValue={getDualValue(handoverAmount).secondary}
                    bold
                    valueClassName="text-green-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Post-Handover Installments - only for post-handover plans */}
          {hasPostHandoverPlan && derivedPostHandoverPayments.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-purple-400 font-semibold mb-2">
                {t('postHandoverLabel')} ({(derivedPostHandoverPayments.reduce((sum, p) => sum + p.paymentPercent, 0)).toFixed(0)}%)
              </div>
              {(() => {
                const renderPostHandoverRow = (payment: PaymentMilestone, index: number) => {
                  const amount = basePrice * (payment.paymentPercent / 100);
                  const dateStr = getPaymentDate(payment);
                  const label = `${getPaymentLabel(payment)} (${dateStr})`;
                  const paymentId = `posthandover-${index}`;
                  const isSelected = selectedPayments.has(paymentId);
                  
                  return (
                    <div 
                      key={index} 
                      onMouseDown={(e) => handleMouseDown(e, paymentId, amount)}
                      onMouseEnter={() => handleMouseEnter(paymentId, amount)}
                      className={cn(
                        "flex items-center justify-between gap-2 cursor-pointer rounded transition-colors select-none",
                        isSelected && "bg-theme-accent/20 ring-1 ring-theme-accent/40"
                      )}
                    >
                      <span className={cn("text-xs text-theme-text-muted truncate", useTwoColumns && "text-[11px]")}>{label}</span>
                      <span className={cn("text-xs font-mono text-theme-text whitespace-nowrap flex-shrink-0", useTwoColumns && "text-[10px]")}>
                        {getDualValue(amount).primary}
                        {currency !== 'AED' && (
                          <span className={cn("text-theme-text-muted ml-1", useTwoColumns && "text-[9px]")}>({getDualValue(amount).secondary})</span>
                        )}
                      </span>
                    </div>
                  );
                };

                if (useTwoColumns && derivedPostHandoverPayments.length > 2) {
                  const gridColsClass = actualColumnCount === 3 ? 'grid-cols-3' : 'grid-cols-2';
                  let runningIndex = 0;
                  return (
                    <div className={cn("grid gap-4", gridColsClass)}>
                      {splitPostHandoverPayments.map((columnPayments, colIndex) => (
                        <div key={colIndex} className="space-y-1">
                          {columnPayments.map((payment) => {
                            const idx = runningIndex++;
                            return renderPostHandoverRow(payment, idx);
                          })}
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div className="space-y-1">
                    {derivedPostHandoverPayments.map((payment, index) => renderPostHandoverRow(payment, index))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Grand Total with Fee Breakdown */}
          <div className="pt-2 border-t border-theme-border space-y-1">
            {/* Property Price */}
            <DottedRow 
              label={t('basePropertyPrice')}
              value={getDualValue(basePrice).primary}
              secondaryValue={getDualValue(basePrice).secondary}
              className="text-xs"
            />
            {/* Transaction Fees */}
            <DottedRow 
              label={t('transactionFees')}
              value={getDualValue(dldFee + oqoodFee).primary}
              secondaryValue={getDualValue(dldFee + oqoodFee).secondary}
              className="text-xs"
              valueClassName="text-theme-text-muted"
            />
            
            {/* Show subtotals for post-handover plans */}
            {hasPostHandoverPlan && postHandoverTotal > 0 && (
              <div className="pt-1 mt-1 border-t border-dashed border-theme-border/50 space-y-1">
                <DottedRow 
                  label="Paid Until Handover"
                  value={getDualValue(totalUntilHandover).primary}
                  secondaryValue={getDualValue(totalUntilHandover).secondary}
                  className="text-xs"
                  valueClassName="text-green-400"
                />
                <DottedRow 
                  label="Post-Handover Balance"
                  value={getDualValue(postHandoverTotal).primary}
                  secondaryValue={getDualValue(postHandoverTotal).secondary}
                  className="text-xs"
                  valueClassName="text-purple-400"
                />
              </div>
            )}
            
            {/* Total Investment */}
            <DottedRow 
              label={t('totalInvestmentLabel')}
              value={getDualValue(grandTotal).primary}
              secondaryValue={getDualValue(grandTotal).secondary}
              bold
              className="text-sm"
              labelClassName="text-sm"
              valueClassName="text-sm"
            />
          </div>


          {/* Value Differentiators - AFTER Total Investment */}
          {valueDifferentiators.length > 0 && (
            <div className="pt-2 border-t border-dashed border-theme-border">
              <div className="text-[10px] uppercase tracking-wide text-yellow-400 font-semibold mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Value Adds
              </div>
              <div className="flex flex-wrap gap-1.5">
                {valueDifferentiators.map((diff, i) => (
                  <span 
                    key={i}
                    className="px-2 py-0.5 text-[10px] bg-yellow-400/10 text-yellow-400 rounded-full border border-yellow-400/30"
                  >
                    {diff}
                  </span>
                ))}
                {appreciationBonus > 0 && (
                  <span className="px-2 py-0.5 text-[10px] bg-green-400/10 text-green-400 rounded-full border border-green-400/30">
                    +{appreciationBonus}% bonus
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Split Modal */}
      {clientInfo && (
        <PaymentSplitModal 
          open={splitModalOpen}
          onOpenChange={setSplitModalOpen}
          inputs={inputs}
          clientInfo={clientInfo}
          currency={currency}
          rate={rate}
          totalMonths={totalMonths}
        />
      )}
      
      {/* Selection Bar - Excel-like sum/average display */}
      <PaymentSelectionBar
        selectedAmounts={Array.from(selectedPayments.values())}
        currency={currency}
        rate={rate}
        onClear={clearSelection}
      />
    </>
  );
};
