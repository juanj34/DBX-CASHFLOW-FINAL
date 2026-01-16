import { Wallet } from 'lucide-react';
import { Currency, formatCurrency } from '../currencyUtils';
import { DualCurrencyValue } from './DualCurrencyValue';

interface EquitySummaryCardProps {
  downpayment: number;
  installmentsTotal: number;
  handoverPayment: number;
  entryCosts: number;
  currency: Currency;
  rate: number;
}

export const EquitySummaryCard = ({
  downpayment,
  installmentsTotal,
  handoverPayment,
  entryCosts,
  currency,
  rate,
}: EquitySummaryCardProps) => {
  const totalEquityRequired = downpayment + installmentsTotal + handoverPayment + entryCosts;
  const cashToStart = downpayment + entryCosts;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <Wallet className="w-4 h-4" />
        Snapshot
      </h3>
      
      <div className="space-y-3 text-sm">
        {/* Cash to Start - Highlighted */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <div className="flex justify-between items-start">
            <span className="text-foreground font-medium">Cash to Start</span>
            <DualCurrencyValue 
              value={cashToStart} 
              currency={currency} 
              rate={rate}
              highlight
              size="md"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Downpayment + Entry Costs
          </p>
        </div>

        {/* Downpayment */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Downpayment (SPA)</span>
          <DualCurrencyValue 
            value={downpayment} 
            currency={currency} 
            rate={rate}
            negative
          />
        </div>
        
        {/* Entry Costs */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Entry Costs (DLD + Fees)</span>
          <DualCurrencyValue 
            value={entryCosts} 
            currency={currency} 
            rate={rate}
            negative
          />
        </div>
        
        {/* Additional Installments */}
        {installmentsTotal > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Additional Installments</span>
            <DualCurrencyValue 
              value={installmentsTotal} 
              currency={currency} 
              rate={rate}
              negative
            />
          </div>
        )}
        
        {/* Handover Payment */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment on Handover</span>
          <DualCurrencyValue 
            value={handoverPayment} 
            currency={currency} 
            rate={rate}
            negative
          />
        </div>
        
        <div className="border-t border-border my-3" />
        
        {/* Total Equity Required - Big highlight */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex justify-between items-start">
            <span className="text-foreground font-bold">Total Equity Required</span>
            <DualCurrencyValue 
              value={totalEquityRequired} 
              currency={currency} 
              rate={rate}
              highlight
              size="lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
