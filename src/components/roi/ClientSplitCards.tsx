import { OIInputs, monthName } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { ClientUnitData } from "./ClientUnitInfo";
import { getCountryByCode } from "@/data/countries";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, ChevronRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ClientSplitCardsProps {
  inputs: OIInputs;
  clientInfo: ClientUnitData;
  currency: Currency;
  rate: number;
  vertical?: boolean;
}

// DLD Fee is always 4%
const DLD_FEE_PERCENT = 4;

export const ClientSplitCards = ({ inputs, clientInfo, currency, rate }: ClientSplitCardsProps) => {
  const { t, language } = useLanguage();
  const { basePrice, downpaymentPercent, additionalPayments, oqoodFee, eoiFee, preHandoverPercent, bookingMonth, bookingYear, handoverMonth, handoverYear } = inputs;

  const clients = clientInfo.clients || [];
  const clientShares = clientInfo.clientShares || [];

  // Calculate total amounts
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const dldFeeAmount = basePrice * DLD_FEE_PERCENT / 100;
  const eoiFeeActual = Math.min(eoiFee, downpaymentAmount);
  const restOfDownpayment = downpaymentAmount - eoiFeeActual;
  const todayTotal = downpaymentAmount + dldFeeAmount + oqoodFee;
  const grandTotal = basePrice + dldFeeAmount + oqoodFee;
  
  // Additional payments
  const additionalTotal = additionalPayments.reduce((sum, m) => sum + (basePrice * m.paymentPercent / 100), 0);
  
  // Handover
  const handoverPercent = 100 - preHandoverPercent;
  const handoverAmount = basePrice * handoverPercent / 100;

  const getClientShare = (clientId: string): number => {
    const share = clientShares.find(s => s.clientId === clientId);
    return share?.sharePercent || 0;
  };

  const getClientDisplay = (client: { id: string; name: string; country: string }) => {
    const country = getCountryByCode(client.country);
    return { name: client.name || t('client'), flag: country?.flag };
  };

  // Format booking date
  const monthNamesShort = language === 'es' 
    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const bookingLabel = `${monthNamesShort[bookingMonth - 1]} ${bookingYear}`;
  const handoverLabel = `${monthName(handoverMonth)} ${handoverYear}`;

  if (!clients || clients.length < 2) return null;

  return (
    <div className="bg-theme-card/50 rounded-xl border border-theme-border/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-theme-border/20">
        <Users className="w-4 h-4 text-theme-accent" />
        <span className="text-xs text-theme-text-muted uppercase tracking-wide font-medium">
          {t('ownershipStructure')}
        </span>
        <span className="ml-auto text-xs text-theme-text-muted">
          {clients.length} {t('clients')?.toLowerCase() || 'partners'}
        </span>
      </div>

      {/* Accordion */}
      <Accordion type="single" collapsible className="w-full">
        {clients.map((client, index) => {
          const sharePercent = getClientShare(client.id);
          const clientDisplay = getClientDisplay(client);
          const clientGrandTotal = grandTotal * sharePercent / 100;
          const clientTodayTotal = todayTotal * sharePercent / 100;
          const clientEoi = eoiFeeActual * sharePercent / 100;
          const clientRest = restOfDownpayment * sharePercent / 100;
          const clientDld = dldFeeAmount * sharePercent / 100;
          const clientOqood = oqoodFee * sharePercent / 100;
          const clientJourney = additionalTotal * sharePercent / 100;
          const clientHandover = handoverAmount * sharePercent / 100;

          return (
            <AccordionItem key={client.id} value={client.id} className="border-b border-theme-border/10 last:border-0">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-theme-bg/30 group">
                <div className="flex items-center w-full pr-2">
                  <ChevronRight className="w-3.5 h-3.5 text-theme-text-muted mr-2 transition-transform group-data-[state=open]:rotate-90" />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {clientDisplay.flag && (
                      <span className="text-base flex-shrink-0">{clientDisplay.flag}</span>
                    )}
                    <span className="text-sm font-medium text-theme-text truncate">{clientDisplay.name}</span>
                  </div>
                  <span className="text-xs text-cyan-400 font-medium w-14 text-right">{sharePercent.toFixed(1)}%</span>
                  <span className="text-sm font-mono font-bold text-theme-text tabular-nums w-28 text-right">
                    {formatCurrency(clientGrandTotal, currency, rate)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="space-y-3 pt-2">
                  {/* Entry */}
                  <div className="bg-emerald-900/20 rounded-lg p-2.5 border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-emerald-400 uppercase tracking-wide font-medium">
                        {t('theEntry')}
                      </span>
                      <span className="text-[10px] text-emerald-400/70">{bookingLabel}</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-theme-text-muted">{t('eoiBookingFee')}</span>
                        <span className="font-mono text-theme-text tabular-nums text-right">{formatCurrency(clientEoi, currency, rate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-theme-text-muted">{t('restOfDownpayment')}</span>
                        <span className="font-mono text-theme-text tabular-nums text-right">{formatCurrency(clientRest, currency, rate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-theme-text-muted">{t('dldFeePercent')}</span>
                        <span className="font-mono text-theme-text tabular-nums text-right">{formatCurrency(clientDld, currency, rate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-theme-text-muted">{t('oqoodFee')}</span>
                        <span className="font-mono text-theme-text tabular-nums text-right">{formatCurrency(clientOqood, currency, rate)}</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-emerald-500/20">
                        <span className="text-emerald-400 font-medium">{t('totalCashNow')}</span>
                        <span className="font-mono font-bold text-emerald-400 tabular-nums text-right">{formatCurrency(clientTodayTotal, currency, rate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Journey */}
                  {additionalTotal > 0 && (
                    <div className="bg-slate-700/30 rounded-lg p-2.5 border border-slate-500/20">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-2">
                        {t('theJourney')}
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-theme-text-muted">{t('duringConstruction')}</span>
                        <span className="font-mono font-medium text-theme-text tabular-nums text-right">{formatCurrency(clientJourney, currency, rate)}</span>
                      </div>
                    </div>
                  )}

                  {/* Completion */}
                  <div className="bg-cyan-900/20 rounded-lg p-2.5 border border-cyan-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-cyan-400 uppercase tracking-wide font-medium">
                        {t('completionHandover')}
                      </span>
                      <span className="text-[10px] text-cyan-400/70">{handoverLabel}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-theme-text-muted">{t('finalPayment')} ({handoverPercent}%)</span>
                      <span className="font-mono font-medium text-theme-text tabular-nums text-right">{formatCurrency(clientHandover, currency, rate)}</span>
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="flex justify-between items-center pt-2 border-t border-theme-border/30">
                    <span className="text-xs text-theme-text-muted font-medium uppercase">{t('totalToDisburse')}</span>
                    <span className="text-base font-mono font-bold text-theme-accent tabular-nums">{formatCurrency(clientGrandTotal, currency, rate)}</span>
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
