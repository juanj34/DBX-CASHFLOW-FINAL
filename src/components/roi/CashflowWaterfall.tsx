import { Currency, formatCurrency } from "./currencyUtils";
import { TrendingUp, Minus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WaterfallItem {
  label: string;
  value: number;
  type: 'positive' | 'negative' | 'result';
}

interface CashflowWaterfallProps {
  items: WaterfallItem[];
  currency: Currency;
  rate: number;
  title?: string;
  className?: string;
}

export const CashflowWaterfall = ({
  items,
  currency,
  rate,
  title = "Cashflow Breakdown",
  className,
}: CashflowWaterfallProps) => {
  // Calculate the maximum absolute value for scaling
  const maxValue = Math.max(...items.map(item => Math.abs(item.value)));
  
  // Get result item (last item with type 'result')
  const resultItem = items.find(item => item.type === 'result');
  const flowItems = items.filter(item => item.type !== 'result');

  return (
    <div className={cn("bg-theme-card/50 rounded-xl p-4 border border-theme-border", className)}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium text-theme-text-muted uppercase">{title}</span>
        </div>
      )}

      <div className="space-y-2">
        {flowItems.map((item, index) => {
          const barWidth = (Math.abs(item.value) / maxValue) * 100;
          const isPositive = item.type === 'positive';
          
          return (
            <div key={index} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-24 shrink-0">
                <p className="text-xs text-slate-400 truncate">{item.label}</p>
              </div>
              
              {/* Bar */}
              <div className="flex-1 relative h-6 bg-slate-700/30 rounded overflow-hidden">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded transition-all duration-500",
                    isPositive ? "bg-emerald-500/40" : "bg-red-500/40"
                  )}
                  style={{ width: `${Math.min(barWidth, 100)}%` }}
                />
                <div className="absolute inset-0 flex items-center px-2">
                  <span className={cn(
                    "text-xs font-mono font-medium",
                    isPositive ? "text-emerald-400" : "text-red-400"
                  )}>
                    {isPositive ? '+' : '-'}{formatCurrency(Math.abs(item.value), currency, rate)}
                  </span>
                </div>
              </div>

              {/* Plus/Minus indicator */}
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              )}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              </div>
            </div>
          );
        })}

        {/* Divider */}
        {resultItem && (
          <>
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-theme-border" />
              <ArrowRight className="w-4 h-4 text-theme-text-muted" />
              <div className="flex-1 h-px bg-theme-border" />
            </div>

            {/* Result row */}
            <div className="flex items-center gap-3">
              <div className="w-24 shrink-0">
                <p className="text-xs font-medium text-white">{resultItem.label}</p>
              </div>
              
              <div className="flex-1 relative h-8 bg-gradient-to-r from-slate-700/50 to-transparent rounded overflow-hidden border border-slate-600/30">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded transition-all duration-500",
                    resultItem.value >= 0 
                      ? "bg-gradient-to-r from-emerald-500/30 to-emerald-500/10" 
                      : "bg-gradient-to-r from-red-500/30 to-red-500/10"
                  )}
                  style={{ width: `${Math.min((Math.abs(resultItem.value) / maxValue) * 100, 100)}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className={cn(
                    "text-sm font-mono font-bold",
                    resultItem.value >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {resultItem.value >= 0 ? '+' : ''}{formatCurrency(resultItem.value, currency, rate)}
                  </span>
                </div>
              </div>

              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                resultItem.value >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              )}>
                <TrendingUp className="w-3 h-3" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Pre-configured for rental income breakdown
interface RentalWaterfallProps {
  grossRent: number;
  serviceCharges: number;
  mortgagePayment?: number;
  managementFee?: number;
  currency: Currency;
  rate: number;
  period: 'month' | 'year';
  strategy: 'LT' | 'ST';
  className?: string;
}

export const RentalCashflowWaterfall = ({
  grossRent,
  serviceCharges,
  mortgagePayment = 0,
  managementFee = 0,
  currency,
  rate,
  period,
  strategy,
  className,
}: RentalWaterfallProps) => {
  const items: WaterfallItem[] = [
    { label: 'Gross Rent', value: grossRent, type: 'positive' },
  ];

  if (serviceCharges > 0) {
    items.push({ label: 'Service Charges', value: serviceCharges, type: 'negative' });
  }

  if (managementFee > 0) {
    items.push({ label: strategy === 'ST' ? 'Platform Fees' : 'Management', value: managementFee, type: 'negative' });
  }

  if (mortgagePayment > 0) {
    items.push({ label: 'Mortgage', value: mortgagePayment, type: 'negative' });
  }

  // Calculate net result
  const netCashflow = grossRent - serviceCharges - managementFee - mortgagePayment;
  items.push({ label: 'Net Cashflow', value: netCashflow, type: 'result' });

  return (
    <CashflowWaterfall
      items={items}
      currency={currency}
      rate={rate}
      title={`${period === 'month' ? 'Monthly' : 'Yearly'} ${strategy === 'LT' ? 'Long-Term' : 'Short-Term'} Breakdown`}
      className={className}
    />
  );
};
