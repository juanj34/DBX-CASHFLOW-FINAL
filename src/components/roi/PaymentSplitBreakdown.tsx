import { OIInputs } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { ClientShare, ClientUnitData } from "./ClientUnitInfo";
import { User, Percent } from "lucide-react";
import { Client } from "./ClientUnitModal";
import { getCountryByCode } from "@/data/countries";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

interface PaymentSplitBreakdownProps {
  inputs: OIInputs;
  clientInfo: ClientUnitData;
  currency: Currency;
  totalMonths: number;
  rate: number;
}

const DLD_FEE_PERCENT = 4;

export const PaymentSplitBreakdown = ({ 
  inputs, 
  clientInfo, 
  currency, 
  totalMonths, 
  rate 
}: PaymentSplitBreakdownProps) => {
  const { t } = useLanguage();
  const { basePrice, downpaymentPercent, additionalPayments, preHandoverPercent, oqoodFee, eoiFee } = inputs;
  
  // Get clients and shares
  const clients = clientInfo.clients || [];
  const clientShares = clientInfo.clientShares || [];
  
  if (!clientInfo.splitEnabled || clients.length < 2) {
    return null;
  }

  // Calculate totals
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const eoiFeeActual = Math.min(eoiFee, downpaymentAmount);
  const restOfDownpayment = downpaymentAmount - eoiFeeActual;
  const dldFeeAmount = basePrice * DLD_FEE_PERCENT / 100;
  const handoverPercent = 100 - preHandoverPercent;
  const handoverAmount = basePrice * handoverPercent / 100;
  const additionalTotal = additionalPayments.reduce((sum, m) => sum + (basePrice * m.paymentPercent / 100), 0);
  const todayTotal = downpaymentAmount + dldFeeAmount + oqoodFee;
  const grandTotal = basePrice + dldFeeAmount + oqoodFee;

  // Get share for a client
  const getClientShare = (clientId: string): number => {
    const share = clientShares.find(s => s.clientId === clientId);
    return share?.sharePercent || 0;
  };

  // Get client name with flag
  const getClientDisplay = (client: Client): { name: string; flag?: string } => {
    const country = getCountryByCode(client.country);
    return {
      name: client.name || t('client'),
      flag: country?.flag
    };
  };

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden mt-4">
      <div className="p-3 sm:p-4 border-b border-[#2a3142] flex items-center gap-2">
        <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#00EAFF]" />
        <div>
          <h3 className="font-semibold text-white text-sm sm:text-base">{t('paymentSplitByPerson')}</h3>
          <p className="text-[10px] sm:text-xs text-gray-400">{t('individualContributionBreakdown')}</p>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <Accordion type="multiple" className="space-y-2">
          {clients.map((client) => {
            const sharePercent = getClientShare(client.id);
            const clientDisplay = getClientDisplay(client);
            
            // Calculate this client's share of each payment
            const clientTodayTotal = todayTotal * sharePercent / 100;
            const clientAdditionalTotal = additionalTotal * sharePercent / 100;
            const clientHandover = handoverAmount * sharePercent / 100;
            const clientGrandTotal = grandTotal * sharePercent / 100;
            const clientEoi = eoiFeeActual * sharePercent / 100;
            const clientRestDownpayment = restOfDownpayment * sharePercent / 100;
            const clientDld = dldFeeAmount * sharePercent / 100;
            const clientOqood = oqoodFee * sharePercent / 100;

            return (
              <AccordionItem 
                key={client.id} 
                value={client.id}
                className="bg-[#0d1117] border border-[#2a3142] rounded-xl overflow-hidden"
              >
                <AccordionTrigger className="px-3 sm:px-4 py-3 hover:no-underline hover:bg-[#1a1f2e]/50">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-[#CCFF00]" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white flex items-center gap-1">
                          {clientDisplay.name}
                          {clientDisplay.flag && <span className="text-xs">{clientDisplay.flag}</span>}
                        </p>
                        <p className="text-xs text-[#00EAFF] flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          {sharePercent.toFixed(2)}% {t('shareLabel')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-bold text-[#CCFF00] font-mono">
                        {formatCurrency(clientGrandTotal, currency, rate)}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{t('totalContribution')}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 sm:px-4 pb-4">
                  <div className="space-y-3 pt-2">
                    {/* At Booking */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[#CCFF00] uppercase">{t('atBookingLabel')}</p>
                      <div className="pl-3 space-y-1.5">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] sm:text-sm text-gray-400 truncate min-w-0 flex-1">{t('eoiBookingFee')}</span>
                          <span className="text-[10px] sm:text-sm text-white font-mono flex-shrink-0">{formatCurrency(clientEoi, currency, rate)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] sm:text-sm text-gray-400 truncate min-w-0 flex-1">{t('restOfDownpayment')}</span>
                          <span className="text-[10px] sm:text-sm text-white font-mono flex-shrink-0">{formatCurrency(clientRestDownpayment, currency, rate)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] sm:text-sm text-gray-400 truncate min-w-0 flex-1">{t('dldFee')}</span>
                          <span className="text-[10px] sm:text-sm text-white font-mono flex-shrink-0">{formatCurrency(clientDld, currency, rate)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] sm:text-sm text-gray-400 truncate min-w-0 flex-1">{t('oqoodFee')}</span>
                          <span className="text-[10px] sm:text-sm text-white font-mono flex-shrink-0">{formatCurrency(clientOqood, currency, rate)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2 pt-1 border-t border-[#2a3142]/50">
                          <span className="text-[10px] sm:text-sm text-gray-300 font-medium truncate min-w-0 flex-1">{t('todayTotal')}</span>
                          <span className="text-[10px] sm:text-sm text-[#CCFF00] font-mono font-medium flex-shrink-0">{formatCurrency(clientTodayTotal, currency, rate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* During Construction */}
                    {additionalTotal > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-400 uppercase">{t('duringConstructionLabel')}</p>
                        <div className="pl-3 space-y-1.5">
                          {additionalPayments.map((payment) => {
                            const amount = basePrice * payment.paymentPercent / 100 * sharePercent / 100;
                            const label = payment.type === 'time' 
                              ? `${t('monthLabel')} ${payment.triggerValue}` 
                              : `${payment.triggerValue}% ${t('construction')}`;
                            return (
                              <div key={payment.id} className="flex justify-between items-center gap-2">
                                <span className="text-[10px] sm:text-sm text-gray-400 truncate min-w-0 flex-1">{payment.paymentPercent}% @ {label}</span>
                                <span className="text-[10px] sm:text-sm text-white font-mono flex-shrink-0">{formatCurrency(amount, currency, rate)}</span>
                              </div>
                            );
                          })}
                          <div className="flex justify-between items-center gap-2 pt-1 border-t border-[#2a3142]/50">
                            <span className="text-[10px] sm:text-sm text-gray-300 font-medium truncate min-w-0 flex-1">{t('installmentsTotal')}</span>
                            <span className="text-[10px] sm:text-sm text-gray-300 font-mono font-medium flex-shrink-0">{formatCurrency(clientAdditionalTotal, currency, rate)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pre-Handover Total - For Resale */}
                    {(() => {
                      const clientPreHandoverTotal = clientTodayTotal + clientAdditionalTotal;
                      return (
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-sm font-bold text-orange-400">{t('preHandoverTotal')}</span>
                              <p className="text-[10px] text-orange-300/70">{t('amountNeededToResell')}</p>
                            </div>
                            <span className="text-base font-bold text-orange-400 font-mono">
                              {formatCurrency(clientPreHandoverTotal, currency, rate)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* At Handover */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-cyan-400 uppercase">{t('atHandoverLabel')}</p>
                      <div className="pl-3">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] sm:text-sm text-gray-400 truncate min-w-0 flex-1">{t('finalPayment')} ({100 - preHandoverPercent}%)</span>
                          <span className="text-[10px] sm:text-sm text-white font-mono flex-shrink-0">{formatCurrency(clientHandover, currency, rate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Grand Total */}
                    <div className="bg-[#CCFF00]/10 border border-[#CCFF00]/30 rounded-lg p-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-[#CCFF00]">{t('totalContributionUpper')}</span>
                        <span className="text-base font-bold text-[#CCFF00] font-mono">{formatCurrency(clientGrandTotal, currency, rate)}</span>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
};