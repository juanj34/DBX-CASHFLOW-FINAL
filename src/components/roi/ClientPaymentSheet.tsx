import { OIInputs, PaymentMilestone } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { ClientUnitData } from "./ClientUnitInfo";
import { getCountryByCode } from "@/data/countries";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, Building2, Home, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface ClientPaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | null;
  inputs: OIInputs;
  clientInfo: ClientUnitData;
  currency: Currency;
  rate: number;
  totalMonths: number;
}

// DLD Fee is always 4%
const DLD_FEE_PERCENT = 4;

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

export const ClientPaymentSheet = ({ 
  isOpen, 
  onClose, 
  clientId, 
  inputs, 
  clientInfo, 
  currency, 
  rate, 
  totalMonths 
}: ClientPaymentSheetProps) => {
  const { t, language } = useLanguage();
  
  if (!clientId) return null;
  
  const clients = clientInfo.clients || [];
  const clientShares = clientInfo.clientShares || [];
  const client = clients.find(c => c.id === clientId);
  
  if (!client) return null;

  const { basePrice, downpaymentPercent, additionalPayments, preHandoverPercent, oqoodFee, eoiFee, bookingMonth, bookingYear, handoverQuarter, handoverYear } = inputs;

  const getClientShare = (cId: string): number => {
    const share = clientShares.find(s => s.clientId === cId);
    return share?.sharePercent || 0;
  };

  const getClientDisplay = (c: { id: string; name: string; country: string }) => {
    const country = getCountryByCode(c.country);
    return { name: c.name || t('client'), flag: country?.flag };
  };

  const sharePercent = getClientShare(client.id);
  const clientDisplay = getClientDisplay(client);

  // Calculate all amounts
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

  // Client-specific amounts
  const clientEoi = eoiFeeActual * sharePercent / 100;
  const clientRestDownpayment = restOfDownpayment * sharePercent / 100;
  const clientDld = dldFeeAmount * sharePercent / 100;
  const clientOqood = oqoodFee * sharePercent / 100;
  const clientTodayTotal = todayTotal * sharePercent / 100;
  const clientAdditionalTotal = additionalTotal * sharePercent / 100;
  const clientPreHandover = totalPreHandover * sharePercent / 100;
  const clientHandover = handoverAmount * sharePercent / 100;
  const clientGrandTotal = grandTotal * sharePercent / 100;

  // Sort additional payments
  const sortedAdditionalPayments = [...additionalPayments].sort((a, b) => {
    if (a.type === 'time' && b.type === 'time') return a.triggerValue - b.triggerValue;
    if (a.type === 'construction' && b.type === 'construction') return a.triggerValue - b.triggerValue;
    const aMonths = a.type === 'time' ? a.triggerValue : (a.triggerValue / 100) * totalMonths;
    const bMonths = b.type === 'time' ? b.triggerValue : (b.triggerValue / 100) * totalMonths;
    return aMonths - bMonths;
  });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] bg-theme-bg border-theme-border rounded-t-2xl">
        <SheetHeader className="pb-4 border-b border-theme-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {clientDisplay.flag && (
                <span className="text-3xl">{clientDisplay.flag}</span>
              )}
              <div>
                <SheetTitle className="text-theme-text text-lg">
                  {clientDisplay.name}
                </SheetTitle>
                <p className="text-sm text-cyan-400 font-medium">
                  {sharePercent.toFixed(1)}% {t('shareLabel') || 'share'} • {formatCurrency(clientGrandTotal, currency, rate)}
                </p>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="overflow-y-auto py-4 space-y-4">
          {/* THE ENTRY */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-theme-accent">
              <div className="w-6 h-6 rounded-lg bg-theme-accent/20 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wide">
                {t('theEntryLabel') || 'The Entry'}
              </span>
              <span className="text-xs text-theme-text-muted">
                ({monthToDateString(bookingMonth, bookingYear, language)})
              </span>
            </div>
            
            <div className="bg-theme-accent/5 border border-theme-accent/20 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-theme-text-muted">{t('eoiBookingFee')}</span>
                <span className="text-theme-text font-mono">{formatCurrency(clientEoi, currency, rate)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-theme-text-muted">{t('restOfDownpayment')}</span>
                <span className="text-theme-text font-mono">{formatCurrency(clientRestDownpayment, currency, rate)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-theme-text-muted">{t('govRegistrationDld') || 'Gov. Registration (DLD)'}</span>
                <span className="text-theme-text font-mono">{formatCurrency(clientDld, currency, rate)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-theme-text-muted">{t('oqoodFee')}</span>
                <span className="text-theme-text font-mono">{formatCurrency(clientOqood, currency, rate)}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-theme-accent/20 font-medium">
                <span className="text-theme-accent">{t('initialCashRequired') || 'Initial Cash Required'}</span>
                <span className="text-theme-accent font-bold font-mono">{formatCurrency(clientTodayTotal, currency, rate)}</span>
              </div>
            </div>
          </div>

          {/* THE JOURNEY */}
          {sortedAdditionalPayments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-6 h-6 rounded-lg bg-slate-500/20 flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {t('theJourneyLabel') || 'The Journey'}
                </span>
              </div>
              
              <div className="bg-slate-500/5 border border-slate-500/20 rounded-xl p-4 space-y-2">
                {sortedAdditionalPayments.map((payment) => {
                  const paymentAmount = basePrice * payment.paymentPercent / 100;
                  const clientPaymentAmount = paymentAmount * sharePercent / 100;
                  const isTimeBased = payment.type === 'time';
                  const triggerLabel = isTimeBased
                    ? `${t('constructionMilestone') || 'Milestone'} M${payment.triggerValue}`
                    : `${payment.triggerValue}% ${t('constructionPercent')}`;
                  const dateStr = isTimeBased 
                    ? estimateDateFromMonths(payment.triggerValue, bookingMonth, bookingYear, language)
                    : null;
                  
                  return (
                    <div key={payment.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-theme-text-muted">
                          {payment.paymentPercent}% @ {triggerLabel}
                        </span>
                        {dateStr && (
                          <span className="text-xs text-theme-text-muted">({dateStr})</span>
                        )}
                      </div>
                      <span className="text-theme-text font-mono">{formatCurrency(clientPaymentAmount, currency, rate)}</span>
                    </div>
                  );
                })}
                {clientAdditionalTotal > 0 && (
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-500/20">
                    <span className="text-slate-400">{t('subtotalInstallments')}</span>
                    <span className="text-slate-300 font-mono">{formatCurrency(clientAdditionalTotal, currency, rate)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pre-Handover Total */}
          <div className="bg-theme-accent/10 border border-theme-accent/30 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-theme-accent">
                {t('totalPreHandover')} ({preHandoverPercent}%)
              </span>
              <span className="text-lg font-bold text-theme-accent font-mono">
                {formatCurrency(clientPreHandover, currency, rate)}
              </span>
            </div>
          </div>

          {/* COMPLETION */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-400">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Home className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wide">
                {t('completionSettlement') || 'Completion Settlement'}
              </span>
              <span className="text-xs text-theme-text-muted">
                (Q{handoverQuarter} {handoverYear})
              </span>
            </div>
            
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-theme-text-muted">{t('finalPayment')} ({handoverPercent}%)</span>
                <span className="text-theme-text font-mono">{formatCurrency(clientHandover, currency, rate)}</span>
              </div>
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-emerald-400">
                {t('totalToDisburse')}
              </span>
              <span className="text-xl font-bold text-emerald-400 font-mono">
                {formatCurrency(clientGrandTotal, currency, rate)}
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
