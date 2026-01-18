import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OIInputs } from '../useOICalculations';
import { ClientUnitData } from '../ClientUnitInfo';
import { Currency, formatDualCurrency } from '../currencyUtils';
import { getCountryByCode } from '@/data/countries';
import { Users } from 'lucide-react';

interface PaymentSplitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputs: OIInputs;
  clientInfo: ClientUnitData;
  currency: Currency;
  rate: number;
  totalMonths: number;
}

export const PaymentSplitModal = ({
  open,
  onOpenChange,
  inputs,
  clientInfo,
  currency,
  rate,
  totalMonths,
}: PaymentSplitModalProps) => {
  const { basePrice, downpaymentPercent, preHandoverPercent, additionalPayments, oqoodFee } = inputs;
  
  // Get clients array
  const clients = clientInfo?.clients || [];
  if (clients.length === 0) return null;

  // Calculate totals
  const downpaymentAmount = basePrice * (downpaymentPercent / 100);
  const dldFee = basePrice * 0.04;
  const entryTotal = downpaymentAmount + dldFee + oqoodFee;
  
  const journeyTotal = additionalPayments.reduce((sum, p) => sum + (basePrice * p.paymentPercent / 100), 0);
  
  const handoverPercent = 100 - preHandoverPercent;
  const handoverAmount = basePrice * (handoverPercent / 100);
  
  const grandTotal = basePrice + dldFee + oqoodFee;

  // Get client share
  const getClientShare = (clientId: string): number => {
    if (clientInfo?.clientShares && clientInfo.clientShares.length > 0) {
      const share = clientInfo.clientShares.find(s => s.clientId === clientId);
      if (share) return share.sharePercent;
    }
    return 100 / clients.length;
  };

  const formatValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-theme-card border-theme-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-theme-text">
            <Users className="w-5 h-5 text-cyan-400" />
            Payment Split by Owner
          </DialogTitle>
          <DialogDescription className="text-theme-text-muted">
            {clients.length} owner{clients.length > 1 ? 's' : ''} • Total Investment: {formatValue(grandTotal).primary}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {clients.map((client) => {
            const share = getClientShare(client.id);
            const clientTotal = grandTotal * (share / 100);
            const clientEntry = entryTotal * (share / 100);
            const clientJourney = journeyTotal * (share / 100);
            const clientHandover = handoverAmount * (share / 100);
            
            const country = getCountryByCode(client.country);
            
            return (
              <div 
                key={client.id}
                className="bg-theme-bg/50 rounded-lg p-4 border border-theme-border"
              >
                {/* Header: Flag + Name + Share% + Total */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {country && <span className="text-lg">{country.flag}</span>}
                    <span className="font-medium text-theme-text">{client.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-cyan-400 font-semibold mr-3">{share.toFixed(1)}%</span>
                    <span className="font-bold text-theme-text">{formatValue(clientTotal).primary}</span>
                  </div>
                </div>
                
                {/* Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-theme-text-muted">
                      Entry (DP {downpaymentPercent}% + DLD 4% + Oqood)
                    </span>
                    <div className="text-right">
                      <span className="text-theme-text font-mono">{formatValue(clientEntry).primary}</span>
                      {formatValue(clientEntry).secondary && (
                        <span className="text-theme-text-muted text-xs ml-2">
                          {formatValue(clientEntry).secondary}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {journeyTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-theme-text-muted">
                        Journey ({totalMonths}mo construction)
                      </span>
                      <div className="text-right">
                        <span className="text-theme-text font-mono">{formatValue(clientJourney).primary}</span>
                        {formatValue(clientJourney).secondary && (
                          <span className="text-theme-text-muted text-xs ml-2">
                            {formatValue(clientJourney).secondary}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-2 border-t border-dashed border-theme-border">
                    <span className="text-theme-text font-medium">
                      Handover ({handoverPercent}%)
                    </span>
                    <div className="text-right">
                      <span className="text-green-400 font-mono font-semibold">{formatValue(clientHandover).primary}</span>
                      {formatValue(clientHandover).secondary && (
                        <span className="text-theme-text-muted text-xs ml-2">
                          {formatValue(clientHandover).secondary}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary */}
        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-theme-text">Combined Total Investment</span>
            <div className="text-right">
              <span className="text-lg font-bold text-primary font-mono">
                {formatValue(grandTotal).primary}
              </span>
              {formatValue(grandTotal).secondary && (
                <span className="text-sm text-theme-text-muted ml-2">
                  {formatValue(grandTotal).secondary}
                </span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
