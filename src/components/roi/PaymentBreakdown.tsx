import { OIInputs, PaymentMilestone, quarterToMonth } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { Calendar, CreditCard, Home, Clock, Building2, User, ChevronDown, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { InfoTooltip } from "./InfoTooltip";
import { ClientUnitData } from "./ClientUnitInfo";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getCountryByCode } from "@/data/countries";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface PaymentBreakdownProps {
  inputs: OIInputs;
  currency: Currency;
  totalMonths: number;
  rate: number;
  unitSizeSqf?: number;
  clientInfo?: ClientUnitData;
}

// Convert booking month/year to readable date string
const monthToDateString = (month: number, year: number, language: string): string => {
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthNames = language === 'es' ? monthNamesEs : monthNamesEn;
  return `${monthNames[month - 1]} ${year}`;
};

// Estimate date from months after booking
const estimateDateFromMonths = (months: number, bookingMonth: number, bookingYear: number, language: string): string => {
  const totalMonthsFromJan = bookingMonth + months;
  const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
  const month = ((totalMonthsFromJan - 1) % 12) + 1;
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthNames = language === 'es' ? monthNamesEs : monthNamesEn;
  return `${monthNames[month - 1]} ${bookingYear + yearOffset}`;
};

// DLD Fee is always 4%
const DLD_FEE_PERCENT = 4;

export const PaymentBreakdown = ({ inputs, currency, totalMonths, rate, unitSizeSqf = 0, clientInfo }: PaymentBreakdownProps) => {
  const { t, language } = useLanguage();
  const [splitOpen, setSplitOpen] = useState(false);
  const { basePrice, downpaymentPercent, additionalPayments, preHandoverPercent, oqoodFee, eoiFee, bookingMonth, bookingYear, handoverQuarter, handoverYear } = inputs;

  // Calculate amounts
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const eoiFeeActual = Math.min(eoiFee, downpaymentAmount); // EOI can't exceed downpayment
  const restOfDownpayment = downpaymentAmount - eoiFeeActual;
  const dldFeeAmount = basePrice * DLD_FEE_PERCENT / 100;
  const handoverPercent = 100 - preHandoverPercent;
  const handoverAmount = basePrice * handoverPercent / 100;

  // Calculate additional payments total
  const additionalTotal = additionalPayments.reduce((sum, m) => sum + (basePrice * m.paymentPercent / 100), 0);
  
  // Calculate pre-handover totals
  const todayTotal = downpaymentAmount + dldFeeAmount + oqoodFee;
  const totalPreHandover = todayTotal + additionalTotal;
  
  // Sort additional payments by trigger
  const sortedAdditionalPayments = [...additionalPayments].sort((a, b) => {
    // Time-based come before construction-based at same effective time
    if (a.type === 'time' && b.type === 'time') return a.triggerValue - b.triggerValue;
    if (a.type === 'construction' && b.type === 'construction') return a.triggerValue - b.triggerValue;
    // Convert to comparable time
    const aMonths = a.type === 'time' ? a.triggerValue : (a.triggerValue / 100) * totalMonths;
    const bMonths = b.type === 'time' ? b.triggerValue : (b.triggerValue / 100) * totalMonths;
    return aMonths - bMonths;
  });

  // Calculate totals
  const totalPropertyPayments = basePrice;
  const totalEntryCosts = dldFeeAmount + oqoodFee;
  const grandTotal = totalPropertyPayments + totalEntryCosts;

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-theme-border flex items-center gap-2">
        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-theme-accent" />
        <div>
          <h3 className="font-semibold text-theme-text text-sm sm:text-base">{t('paymentBreakdownTitle')}</h3>
          <p className="text-[10px] sm:text-xs text-theme-text-muted">{preHandoverPercent}/{handoverPercent} {t('paymentStructure')}</p>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Base Price */}
        <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-theme-border">
          <span className="text-xs sm:text-sm text-theme-text-muted">{t('basePropertyPrice')}</span>
          <div className="text-right">
            <span className="text-sm sm:text-lg font-bold text-theme-text font-mono">{formatCurrency(basePrice, currency, rate)}</span>
            {unitSizeSqf > 0 && (
              <p className="text-[10px] text-theme-text-muted font-mono">
                {formatCurrency(basePrice / unitSizeSqf, currency, rate)}/sqft
              </p>
            )}
          </div>
        </div>

        {/* Section: At Booking */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-theme-accent">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">{t('atBooking')} ({monthToDateString(bookingMonth, bookingYear, language)})</span>
          </div>
          
          <div className="pl-4 sm:pl-6 space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className="text-[10px] sm:text-sm text-theme-text-muted truncate">{t('eoiBookingFee')}</span>
                <InfoTooltip translationKey="tooltipEoiFee" />
              </div>
              <span className="text-[10px] sm:text-sm text-theme-text font-mono flex-shrink-0">{formatCurrency(eoiFeeActual, currency, rate)}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className="text-[10px] sm:text-sm text-theme-text-muted truncate">{t('restOfDownpayment')} ({downpaymentPercent}% - EOI)</span>
                <InfoTooltip translationKey="tooltipDownpayment" />
              </div>
              <span className="text-[10px] sm:text-sm text-theme-text font-mono flex-shrink-0">{formatCurrency(restOfDownpayment, currency, rate)}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className="text-[10px] sm:text-sm text-theme-text-muted truncate">{t('dldFeePercent')}</span>
                <InfoTooltip translationKey="tooltipDldFee" />
              </div>
              <span className="text-[10px] sm:text-sm text-theme-text font-mono flex-shrink-0">{formatCurrency(dldFeeAmount, currency, rate)}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className="text-[10px] sm:text-sm text-theme-text-muted truncate">{t('oqoodFee')}</span>
                <InfoTooltip translationKey="tooltipOqoodFee" />
              </div>
              <span className="text-[10px] sm:text-sm text-theme-text font-mono flex-shrink-0">{formatCurrency(oqoodFee, currency, rate)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-theme-border/50">
              <span className="text-xs sm:text-sm font-medium text-theme-accent">{t('totalToday')}</span>
              <span className="text-xs sm:text-sm font-bold text-theme-accent font-mono">{formatCurrency(todayTotal, currency, rate)}</span>
            </div>
          </div>
        </div>

        {/* Section: During Construction */}
        {sortedAdditionalPayments.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-1.5 sm:gap-2 text-theme-text-muted">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">{t('duringConstruction')}</span>
            </div>
            
            <div className="pl-4 sm:pl-6 space-y-2 sm:space-y-3">
              {sortedAdditionalPayments.map((payment, index) => {
                const amount = basePrice * payment.paymentPercent / 100;
                const isTimeBased = payment.type === 'time';
                // Compact label for mobile
                const triggerLabel = isTimeBased
                  ? `M${payment.triggerValue}`
                  : `${payment.triggerValue}%`;
                const triggerLabelFull = isTimeBased
                  ? `${t('monthLabel')} ${payment.triggerValue}`
                  : `${payment.triggerValue}% ${t('constructionPercent')}`;
                
                // Only show date for time-based payments
                const dateStr = isTimeBased 
                  ? estimateDateFromMonths(payment.triggerValue, bookingMonth, bookingYear, language)
                  : null;
                
                return (
                  <div key={payment.id} className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                      {isTimeBased ? (
                        <Clock className="w-3 h-3 text-theme-text-muted flex-shrink-0" />
                      ) : (
                        <Building2 className="w-3 h-3 text-theme-text-muted flex-shrink-0" />
                      )}
                      <span className="text-[10px] sm:text-sm text-theme-text-muted truncate">
                        {payment.paymentPercent}% @ <span className="sm:hidden">{triggerLabel}</span><span className="hidden sm:inline">{triggerLabelFull}</span>
                      </span>
                      {dateStr && (
                        <span className="text-[10px] sm:text-xs text-theme-text-muted flex-shrink-0">({dateStr})</span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-sm text-theme-text font-mono flex-shrink-0">{formatCurrency(amount, currency, rate)}</span>
                  </div>
                );
              })}
              {additionalTotal > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-theme-border/50">
                  <span className="text-xs sm:text-sm text-theme-text-muted">{t('subtotalInstallments')}</span>
                  <span className="text-xs sm:text-sm text-theme-text-muted font-mono">{formatCurrency(additionalTotal, currency, rate)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pre-Handover Summary */}
        <div className="bg-theme-accent/10 border border-theme-accent/30 rounded-xl p-3 sm:p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-theme-text-muted">{t('totalToday')}</span>
            <span className="text-xs sm:text-sm text-theme-text font-mono">{formatCurrency(todayTotal, currency, rate)}</span>
          </div>
          {additionalTotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-theme-text-muted">{t('plusInstallments')}</span>
              <span className="text-xs sm:text-sm text-theme-text font-mono">{formatCurrency(additionalTotal, currency, rate)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-theme-accent/30">
            <span className="text-xs sm:text-sm font-bold text-theme-accent">{t('totalPreHandover')} ({preHandoverPercent}%)</span>
            <span className="text-sm sm:text-base font-bold text-theme-accent font-mono">{formatCurrency(totalPreHandover, currency, rate)}</span>
          </div>
        </div>

        {/* Section: At Handover */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-cyan-400">
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">{t('atHandoverLabel')} (Q{handoverQuarter} {handoverYear})</span>
          </div>
          
          <div className="pl-4 sm:pl-6 space-y-2">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className="text-[10px] sm:text-sm text-theme-text-muted truncate">{t('finalPayment')} ({handoverPercent}%)</span>
                <InfoTooltip translationKey="tooltipFinalPayment" />
              </div>
              <span className="text-[10px] sm:text-sm text-theme-text font-mono flex-shrink-0">{formatCurrency(handoverAmount, currency, rate)}</span>
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-theme-border space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-theme-text-muted">{t('propertyPayments')}</span>
            <span className="text-xs sm:text-sm text-theme-text font-mono">{formatCurrency(totalPropertyPayments, currency, rate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-theme-text-muted">{t('entryCostsDldOqood')}</span>
            <span className="text-xs sm:text-sm text-theme-text font-mono">{formatCurrency(totalEntryCosts, currency, rate)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-theme-accent/30 bg-theme-accent/5 -mx-3 sm:-mx-4 px-3 sm:px-4 py-2">
            <span className="text-xs sm:text-sm font-bold text-theme-accent">{t('totalToDisburse')}</span>
            <span className="text-sm sm:text-lg font-bold text-theme-accent font-mono">{formatCurrency(grandTotal, currency, rate)}</span>
          </div>
        </div>

        {/* Payment Split by Person - Collapsible */}
        {clientInfo?.splitEnabled && clientInfo?.clients && clientInfo.clients.length >= 2 && (
          <div className="mt-4 pt-4 border-t border-theme-border">
            <button
              onClick={() => setSplitOpen(!splitOpen)}
              className="w-full flex items-center justify-between py-2 hover:bg-theme-card-alt/30 rounded-lg transition-colors -mx-2 px-2"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-theme-text">{t('paymentSplitByPerson')}</span>
                <span className="text-xs text-theme-text-muted">({clientInfo.clients.length} {t('clients').toLowerCase()})</span>
              </div>
              {splitOpen ? (
                <ChevronDown className="w-4 h-4 text-theme-text-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-theme-text-muted" />
              )}
            </button>
            
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              splitOpen ? "max-h-[2000px] opacity-100 mt-3" : "max-h-0 opacity-0"
            )}>
              <PaymentSplitContent
                inputs={inputs}
                clientInfo={clientInfo}
                currency={currency}
                totalMonths={totalMonths}
                rate={rate}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Inline Payment Split Content (extracted from PaymentSplitBreakdown)
interface PaymentSplitContentProps {
  inputs: OIInputs;
  clientInfo: ClientUnitData;
  currency: Currency;
  totalMonths: number;
  rate: number;
}

const PaymentSplitContent = ({ inputs, clientInfo, currency, totalMonths, rate }: PaymentSplitContentProps) => {
  const { t, language } = useLanguage();
  const { basePrice, downpaymentPercent, additionalPayments, preHandoverPercent, oqoodFee, eoiFee, bookingMonth, bookingYear } = inputs;
  const DLD_FEE_PERCENT = 4;
  
  const clients = clientInfo.clients || [];
  const clientShares = clientInfo.clientShares || [];
  
  // State for controlled accordion - persist to localStorage
  const [expandedClients, setExpandedClients] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('payment-split-expanded-clients');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Persist expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('payment-split-expanded-clients', JSON.stringify(expandedClients));
  }, [expandedClients]);
  
  // Calculate totals
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const eoiFeeActual = Math.min(eoiFee, downpaymentAmount);
  const restOfDownpayment = downpaymentAmount - eoiFeeActual;
  const dldFeeAmount = basePrice * DLD_FEE_PERCENT / 100;
  const handoverPercent = 100 - preHandoverPercent;
  const handoverAmount = basePrice * handoverPercent / 100;
  const additionalTotal = additionalPayments.reduce((sum, m) => sum + (basePrice * m.paymentPercent / 100), 0);
  const todayTotal = downpaymentAmount + dldFeeAmount + oqoodFee;
  const totalPreHandover = todayTotal + additionalTotal;
  const grandTotal = basePrice + dldFeeAmount + oqoodFee;

  // Sort additional payments
  const sortedAdditionalPayments = [...additionalPayments].sort((a, b) => {
    if (a.type === 'time' && b.type === 'time') return a.triggerValue - b.triggerValue;
    if (a.type === 'construction' && b.type === 'construction') return a.triggerValue - b.triggerValue;
    const aMonths = a.type === 'time' ? a.triggerValue : (a.triggerValue / 100) * totalMonths;
    const bMonths = b.type === 'time' ? b.triggerValue : (b.triggerValue / 100) * totalMonths;
    return aMonths - bMonths;
  });

  const getClientShare = (clientId: string): number => {
    const share = clientShares.find(s => s.clientId === clientId);
    return share?.sharePercent || 0;
  };

  const getClientDisplay = (client: { id: string; name: string; country: string }) => {
    const country = getCountryByCode(client.country);
    return { name: client.name || t('client'), flag: country?.flag };
  };

  const allExpanded = expandedClients.length === clients.length;
  
  const toggleAll = () => {
    if (allExpanded) {
      setExpandedClients([]);
    } else {
      setExpandedClients(clients.map(c => c.id));
    }
  };

  return (
    <div className="space-y-2">
      {/* Expand/Collapse All Button */}
      <div className="flex justify-end">
        <Button
          variant="ghostDark"
          size="sm"
          onClick={toggleAll}
          className="text-xs text-theme-text-muted hover:text-theme-text h-7 px-2"
        >
          {allExpanded ? (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              {t('collapseAll') || 'Collapse All'}
            </>
          ) : (
            <>
              <ChevronRight className="w-3 h-3 mr-1" />
              {t('expandAll') || 'Expand All'}
            </>
          )}
        </Button>
      </div>
      
      <Accordion 
        type="multiple" 
        value={expandedClients}
        onValueChange={setExpandedClients}
        className="space-y-2"
      >
      {clients.map((client) => {
        const sharePercent = getClientShare(client.id);
        const clientDisplay = getClientDisplay(client);
        
        // Calculate all client-specific amounts
        const clientEoi = eoiFeeActual * sharePercent / 100;
        const clientRestDownpayment = restOfDownpayment * sharePercent / 100;
        const clientDld = dldFeeAmount * sharePercent / 100;
        const clientOqood = oqoodFee * sharePercent / 100;
        const clientTodayTotal = todayTotal * sharePercent / 100;
        const clientAdditionalTotal = additionalTotal * sharePercent / 100;
        const clientPreHandover = totalPreHandover * sharePercent / 100;
        const clientHandover = handoverAmount * sharePercent / 100;
        const clientGrandTotal = grandTotal * sharePercent / 100;
        
        return (
          <AccordionItem 
            key={client.id} 
            value={client.id}
            className="bg-theme-bg/50 border border-theme-border/50 rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-theme-card-alt/30">
              <div className="flex items-center justify-between w-full pr-2">
                <div className="flex items-center gap-2">
                  {clientDisplay.flag && <span className="text-base">{clientDisplay.flag}</span>}
                  <span className="text-sm font-medium text-theme-text">{clientDisplay.name}</span>
                  <span className="text-xs text-cyan-400">({sharePercent.toFixed(1)}%)</span>
                </div>
                <span className="text-sm font-bold text-theme-accent font-mono">
                  {formatCurrency(clientGrandTotal, currency, rate)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-3 pt-2">
                {/* At Booking Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-theme-accent">
                    <Calendar className="w-3 h-3" />
                    <span className="text-xs font-medium">{t('atBooking')}</span>
                  </div>
                  <div className="pl-4 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-theme-text-muted">{t('eoiBookingFee')}</span>
                      <span className="text-theme-text font-mono">{formatCurrency(clientEoi, currency, rate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-text-muted">{t('restOfDownpayment')}</span>
                      <span className="text-theme-text font-mono">{formatCurrency(clientRestDownpayment, currency, rate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-text-muted">{t('dldFeePercent')}</span>
                      <span className="text-theme-text font-mono">{formatCurrency(clientDld, currency, rate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-text-muted">{t('oqoodFee')}</span>
                      <span className="text-theme-text font-mono">{formatCurrency(clientOqood, currency, rate)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-theme-border/50 font-medium">
                      <span className="text-theme-accent">{t('totalToday')}</span>
                      <span className="text-theme-accent font-mono">{formatCurrency(clientTodayTotal, currency, rate)}</span>
                    </div>
                  </div>
                </div>

                {/* During Construction Section */}
                {sortedAdditionalPayments.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-theme-text-muted">
                      <Building2 className="w-3 h-3" />
                      <span className="text-xs font-medium">{t('duringConstruction')}</span>
                    </div>
                    <div className="pl-4 space-y-1 text-xs">
                      {sortedAdditionalPayments.map((payment, index) => {
                        const paymentAmount = basePrice * payment.paymentPercent / 100;
                        const clientPaymentAmount = paymentAmount * sharePercent / 100;
                        const triggerLabel = payment.type === 'time' 
                          ? `M${payment.triggerValue}` 
                          : `${payment.triggerValue}%`;
                        
                        return (
                          <div key={payment.id} className="flex justify-between">
                            <span className="text-theme-text-muted">{payment.paymentPercent}% @ {triggerLabel}</span>
                            <span className="text-theme-text font-mono">{formatCurrency(clientPaymentAmount, currency, rate)}</span>
                          </div>
                        );
                      })}
                      {clientAdditionalTotal > 0 && (
                        <div className="flex justify-between pt-1 border-t border-theme-border/50">
                          <span className="text-theme-text-muted">{t('subtotalInstallments')}</span>
                          <span className="text-theme-text font-mono">{formatCurrency(clientAdditionalTotal, currency, rate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pre-Handover Total */}
                <div className="bg-theme-accent/10 border border-theme-accent/30 rounded-lg p-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-theme-accent">{t('totalPreHandover')}</span>
                    <span className="font-bold text-theme-accent font-mono">{formatCurrency(clientPreHandover, currency, rate)}</span>
                  </div>
                </div>

                {/* At Handover Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <Home className="w-3 h-3" />
                    <span className="text-xs font-medium">{t('atHandoverLabel')}</span>
                  </div>
                  <div className="pl-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-theme-text-muted">{t('finalPayment')} ({handoverPercent}%)</span>
                      <span className="text-theme-text font-mono">{formatCurrency(clientHandover, currency, rate)}</span>
                    </div>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-emerald-400">{t('totalToDisburse')}</span>
                    <span className="font-bold text-emerald-400 font-mono">{formatCurrency(clientGrandTotal, currency, rate)}</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
      </Accordion>
    </div>
  );
};
