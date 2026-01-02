import { useState } from "react";
import { Table, ChevronDown, ChevronUp } from "lucide-react";
import { AmortizationPoint } from "../useMortgageCalculations";
import { Currency, formatCurrency } from "../currencyUtils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface AmortizationTableProps {
  amortizationSchedule: AmortizationPoint[];
  loanAmount: number;
  loanTermYears: number;
  currency: Currency;
  rate: number;
}

const KEY_YEARS = [5, 10, 15, 20, 25];

export const AmortizationTable = ({
  amortizationSchedule,
  loanAmount,
  loanTermYears,
  currency,
  rate,
}: AmortizationTableProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!amortizationSchedule || amortizationSchedule.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 rounded-xl bg-theme-bg-alt border border-theme-border hover:border-theme-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-theme-text">Amortization Schedule</span>
            <span className="text-xs text-theme-text-muted">({loanTermYears} Years)</span>
          </div>
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-theme-text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-theme-text-muted" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-xl bg-theme-bg-alt border border-theme-border overflow-hidden">
          <ScrollArea className="h-[320px]">
            <TableComponent>
              <TableHeader className="sticky top-0 bg-theme-bg-alt z-10">
                <TableRow className="border-b border-theme-border hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-theme-text-muted w-16">Year</TableHead>
                  <TableHead className="text-xs font-medium text-theme-text-muted text-right">Principal</TableHead>
                  <TableHead className="text-xs font-medium text-theme-text-muted text-right">Interest</TableHead>
                  <TableHead className="text-xs font-medium text-theme-text-muted text-right">Balance</TableHead>
                  <TableHead className="text-xs font-medium text-theme-text-muted text-right w-20">Equity %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amortizationSchedule.map((point) => {
                  const isKeyYear = KEY_YEARS.includes(point.year);
                  const equityPercent = loanAmount > 0 
                    ? ((point.principalPaid / loanAmount) * 100).toFixed(1) 
                    : "0.0";
                  
                  return (
                    <TableRow
                      key={point.year}
                      className={cn(
                        "border-b border-theme-border/50 hover:bg-theme-card/50",
                        isKeyYear && "bg-theme-accent/5"
                      )}
                    >
                      <TableCell className={cn(
                        "text-xs font-mono",
                        isKeyYear ? "text-theme-accent font-semibold" : "text-theme-text"
                      )}>
                        {point.year}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-emerald-400 text-right">
                        {formatCurrency(point.yearlyPrincipal, currency, rate)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-red-400/70 text-right">
                        {formatCurrency(point.yearlyInterest, currency, rate)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-theme-text text-right">
                        {formatCurrency(point.balance, currency, rate)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-xs font-mono text-right",
                        isKeyYear ? "text-theme-accent font-semibold" : "text-theme-text-muted"
                      )}>
                        {equityPercent}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </TableComponent>
          </ScrollArea>
          
          {/* Summary Footer */}
          <div className="p-3 border-t border-theme-border bg-theme-card/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-theme-text-muted">Total over {loanTermYears} years:</span>
              <div className="flex items-center gap-4">
                <span className="text-emerald-400 font-mono">
                  Principal: {formatCurrency(loanAmount, currency, rate)}
                </span>
                <span className="text-red-400/70 font-mono">
                  Interest: {formatCurrency(
                    amortizationSchedule[amortizationSchedule.length - 1]?.interestPaid || 0, 
                    currency, 
                    rate
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
