import { CalendarDays, ArrowRight } from 'lucide-react';
import { Currency, formatCurrency } from '../currencyUtils';
import { PaymentMilestone, OIInputs } from '../useOICalculations';
import { cn } from '@/lib/utils';

interface MilestoneTableProps {
  inputs: OIInputs;
  basePrice: number;
  totalMonths: number;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
}

interface MilestoneRow {
  label: string;
  description: string;
  value: number;
  percent: number;
  monthFromBooking?: number;
  exitMatch?: number | null;
  isHandover?: boolean;
}

export const MilestoneTable = ({
  inputs,
  basePrice,
  totalMonths,
  exitScenarios,
  currency,
  rate,
}: MilestoneTableProps) => {
  const handoverPercent = 100 - inputs.preHandoverPercent;
  const handoverPayment = basePrice * handoverPercent / 100;
  const downpayment = basePrice * inputs.downpaymentPercent / 100;
  
  // Build rows from payment plan
  const rows: MilestoneRow[] = [];
  
  // Downpayment already in Section A - skip here
  
  // Additional payments (installments)
  inputs.additionalPayments.forEach((m, idx) => {
    if (m.paymentPercent <= 0) return;
    
    const value = basePrice * m.paymentPercent / 100;
    let description = '';
    let monthFromBooking: number | undefined;
    
    if (m.type === 'time') {
      description = `${m.paymentPercent}% @ ${m.triggerValue} months`;
      monthFromBooking = m.triggerValue;
    } else {
      description = `${m.paymentPercent}% @ ${m.triggerValue}% construction`;
    }
    
    // Find if any exit matches this milestone
    const exitMatch = exitScenarios.find(exitMonth => {
      if (m.type === 'time' && monthFromBooking) {
        // Exit is after this payment but close (within 3 months)
        return exitMonth >= monthFromBooking && exitMonth <= monthFromBooking + 3;
      }
      return false;
    });
    
    rows.push({
      label: m.label || `Installment ${idx + 1}`,
      description,
      value,
      percent: m.paymentPercent,
      monthFromBooking,
      exitMatch: exitMatch || null,
    });
  });
  
  // Handover payment
  rows.push({
    label: 'Payment on Completion',
    description: `${handoverPercent}% of Purchase Price`,
    value: handoverPayment,
    percent: handoverPercent,
    monthFromBooking: totalMonths,
    isHandover: true,
    exitMatch: exitScenarios.includes(totalMonths) ? totalMonths : null,
  });
  
  // Calculate totals
  const installmentsTotal = rows.reduce((sum, r) => sum + r.value, 0);
  const totalEquity = downpayment + installmentsTotal + (inputs.oqoodFee + basePrice * 0.04); // Include entry costs
  
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Section B - Milestone Events
        </h3>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Milestone</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Description</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium">%</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium">AED</th>
              {currency !== 'AED' && (
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">{currency}</th>
              )}
              <th className="text-center px-4 py-2 text-muted-foreground font-medium w-20">Exit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr 
                key={idx} 
                className={cn(
                  "border-b border-border/50",
                  row.isHandover && "bg-blue-500/5"
                )}
              >
                <td className="px-4 py-2">
                  <span className={cn(
                    "text-foreground",
                    row.isHandover && "font-semibold"
                  )}>
                    {row.label}
                  </span>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{row.description}</td>
                <td className="px-4 py-2 text-right text-muted-foreground">{row.percent}%</td>
                <td className="px-4 py-2 text-right text-red-500">
                  ({formatCurrency(row.value, 'AED', 1)})
                </td>
                {currency !== 'AED' && (
                  <td className="px-4 py-2 text-right text-red-500/70 text-xs">
                    ({formatCurrency(row.value, currency, rate)})
                  </td>
                )}
                <td className="px-4 py-2 text-center">
                  {row.exitMatch && (
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1",
                      row.isHandover 
                        ? "bg-green-500/20 text-green-500" 
                        : "bg-primary/20 text-primary"
                    )}>
                      <ArrowRight className="w-3 h-3" />
                      {row.isHandover ? 'HO' : `Exit`}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-yellow-500/10">
              <td className="px-4 py-3 font-bold text-foreground" colSpan={2}>
                Total Equity Required
              </td>
              <td className="px-4 py-3 text-right font-bold text-foreground">100%</td>
              <td className="px-4 py-3 text-right font-bold text-foreground">
                ({formatCurrency(totalEquity, 'AED', 1)})
              </td>
              {currency !== 'AED' && (
                <td className="px-4 py-3 text-right font-semibold text-muted-foreground text-xs">
                  ({formatCurrency(totalEquity, currency, rate)})
                </td>
              )}
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
