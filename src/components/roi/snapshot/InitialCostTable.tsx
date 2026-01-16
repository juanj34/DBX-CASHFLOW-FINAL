import { Receipt } from 'lucide-react';
import { Currency, formatCurrency } from '../currencyUtils';
import { DualCurrencyValue } from './DualCurrencyValue';

interface InitialCostTableProps {
  eoiFee: number;
  downpaymentPercent: number;
  basePrice: number;
  dldFee: number;
  oqoodFee: number;
  currency: Currency;
  rate: number;
}

export const InitialCostTable = ({
  eoiFee,
  downpaymentPercent,
  basePrice,
  dldFee,
  oqoodFee,
  currency,
  rate,
}: InitialCostTableProps) => {
  const downpayment = basePrice * downpaymentPercent / 100;
  const totalInitialCost = eoiFee + (downpayment - eoiFee) + dldFee + oqoodFee;

  const rows = [
    {
      label: 'EOI / Holding Fee',
      description: 'Reservation Fee',
      value: eoiFee,
      badge: null,
    },
    {
      label: 'SPA Signing',
      description: `${downpaymentPercent}% of Property Value`,
      value: downpayment - eoiFee,
      badge: null,
    },
    {
      label: 'DLD Fee',
      description: '4% of Property Value',
      value: dldFee,
      badge: 'GOV',
    },
    {
      label: 'Oqood Fee',
      description: 'Admin Fee',
      value: oqoodFee,
      badge: 'GOV',
    },
  ];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Section A - Initial Cost
        </h3>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Item</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Description</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium">AED</th>
              {currency !== 'AED' && (
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">{currency}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-border/50">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">{row.label}</span>
                    {row.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded font-medium">
                        {row.badge}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{row.description}</td>
                <td className="px-4 py-2 text-right text-red-500">
                  ({formatCurrency(row.value, 'AED', 1)})
                </td>
                {currency !== 'AED' && (
                  <td className="px-4 py-2 text-right text-red-500/70 text-xs">
                    ({formatCurrency(row.value, currency, rate)})
                  </td>
                )}
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-yellow-500/10">
              <td className="px-4 py-3 font-bold text-foreground" colSpan={2}>
                Payment on Reservation
              </td>
              <td className="px-4 py-3 text-right font-bold text-foreground">
                ({formatCurrency(totalInitialCost, 'AED', 1)})
              </td>
              {currency !== 'AED' && (
                <td className="px-4 py-3 text-right font-semibold text-muted-foreground text-xs">
                  ({formatCurrency(totalInitialCost, currency, rate)})
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
