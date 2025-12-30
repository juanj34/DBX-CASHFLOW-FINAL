import { OIInputs } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { ClientUnitData } from "./ClientUnitInfo";
import { getCountryByCode } from "@/data/countries";
import { useLanguage } from "@/contexts/LanguageContext";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientSplitCardsProps {
  inputs: OIInputs;
  clientInfo: ClientUnitData;
  currency: Currency;
  rate: number;
  onViewDetails?: (clientId: string) => void;
  vertical?: boolean;
}

// DLD Fee is always 4%
const DLD_FEE_PERCENT = 4;

export const ClientSplitCards = ({ inputs, clientInfo, currency, rate, onViewDetails, vertical = false }: ClientSplitCardsProps) => {
  const { t } = useLanguage();
  const { basePrice, downpaymentPercent, additionalPayments, oqoodFee } = inputs;

  const clients = clientInfo.clients || [];
  const clientShares = clientInfo.clientShares || [];

  // Calculate total amounts
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const dldFeeAmount = basePrice * DLD_FEE_PERCENT / 100;
  const todayTotal = downpaymentAmount + dldFeeAmount + oqoodFee;
  const grandTotal = basePrice + dldFeeAmount + oqoodFee;

  const getClientShare = (clientId: string): number => {
    const share = clientShares.find(s => s.clientId === clientId);
    return share?.sharePercent || 0;
  };

  const getClientDisplay = (client: { id: string; name: string; country: string }) => {
    const country = getCountryByCode(client.country);
    return { name: client.name || t('client'), flag: country?.flag };
  };

  if (!clients || clients.length < 2) return null;

  // Dynamic grid based on client count and vertical prop
  const getGridClass = () => {
    if (vertical) return 'flex flex-col gap-3';
    const count = clients.length;
    if (count === 2) return 'grid grid-cols-2 gap-3';
    if (count === 3) return 'grid grid-cols-3 gap-3';
    return 'grid grid-cols-2 lg:grid-cols-4 gap-3';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-theme-text flex items-center gap-2">
          👥 {t('ownershipStructure')}
        </span>
        <span className="text-xs text-theme-text-muted">
          {clients.length} {t('clients').toLowerCase()}
        </span>
      </div>

      <div className={getGridClass()}>
        {clients.map((client) => {
          const sharePercent = getClientShare(client.id);
          const clientDisplay = getClientDisplay(client);
          const clientEntryTotal = todayTotal * sharePercent / 100;
          const clientGrandTotal = grandTotal * sharePercent / 100;

          return (
            <div 
              key={client.id}
              className="bg-theme-card-alt/50 border border-theme-border/50 rounded-xl p-4 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {clientDisplay.flag && (
                    <span className="text-xl">{clientDisplay.flag}</span>
                  )}
                  <div>
                    <div className="text-sm font-medium text-theme-text">
                      {clientDisplay.name}
                    </div>
                    <div className="text-xs text-cyan-400 font-medium">
                      {sharePercent.toFixed(1)}% {t('shareLabel')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-theme-text-muted">{t('booking')}</span>
                  <span className="text-theme-text font-mono">{formatCurrency(clientEntryTotal, currency, rate)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1 border-t border-theme-border/30">
                  <span className="text-theme-accent font-medium">{t('total')}</span>
                  <span className="text-theme-accent font-bold font-mono">{formatCurrency(clientGrandTotal, currency, rate)}</span>
                </div>
              </div>

              {onViewDetails && (
                <Button
                  variant="ghostDark"
                  size="sm"
                  onClick={() => onViewDetails(client.id)}
                  className="w-full mt-3 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {t('viewBreakdown')}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};