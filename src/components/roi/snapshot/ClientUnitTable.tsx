import { User, Home, DollarSign, Flag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Currency, CURRENCY_CONFIG, formatCurrency } from '../currencyUtils';
import { ClientUnitData } from '../ClientUnitInfo';

interface ClientUnitTableProps {
  clientInfo: ClientUnitData;
  basePrice: number;
  currency: Currency;
  rate: number;
  onCurrencyChange: (currency: Currency) => void;
}

export const ClientUnitTable = ({
  clientInfo,
  basePrice,
  currency,
  rate,
  onCurrencyChange,
}: ClientUnitTableProps) => {
  const primaryClient = clientInfo.clients[0];
  
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <User className="w-4 h-4" />
        Client & Unit Information
      </h3>
      
      <div className="space-y-3 text-sm">
        {/* Developer */}
        {clientInfo.developer && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Developer</span>
            <span className="font-medium text-foreground">{clientInfo.developer}</span>
          </div>
        )}
        
        {/* Client Name */}
        {primaryClient?.name && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Client Name</span>
            <span className="font-medium text-foreground">{primaryClient.name}</span>
          </div>
        )}
        
        {/* Country */}
        {primaryClient?.country && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Country</span>
            <span className="font-medium text-foreground flex items-center gap-1">
              <Flag className="w-3 h-3" />
              {primaryClient.country}
            </span>
          </div>
        )}
        
        {/* Broker */}
        {clientInfo.brokerName && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Broker</span>
            <span className="font-medium text-foreground">{clientInfo.brokerName}</span>
          </div>
        )}
        
        <div className="border-t border-border my-3" />
        
        {/* Unit */}
        {clientInfo.unit && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unit</span>
            <span className="font-medium text-foreground">{clientInfo.unit}</span>
          </div>
        )}
        
        {/* Size */}
        {clientInfo.unitSizeSqf > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Size</span>
            <span className="font-medium text-foreground">
              {clientInfo.unitSizeSqf.toLocaleString()} sqft
            </span>
          </div>
        )}
        
        {/* Type */}
        {clientInfo.unitType && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium text-foreground">{clientInfo.unitType}</span>
          </div>
        )}
        
        <div className="border-t border-border my-3" />
        
        {/* Purchase Price */}
        <div className="flex justify-between items-start">
          <span className="text-muted-foreground">Purchase Price</span>
          <div className="text-right">
            <span className="font-bold text-foreground block">
              {formatCurrency(basePrice, 'AED', 1)}
            </span>
            {currency !== 'AED' && (
              <span className="text-xs text-muted-foreground">
                {formatCurrency(basePrice, currency, rate)}
              </span>
            )}
          </div>
        </div>
        
        {/* Currency Selector */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-muted-foreground">Convert to</span>
          <Select value={currency} onValueChange={(v) => onCurrencyChange(v as Currency)}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.flag} {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
