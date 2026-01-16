import { useState } from 'react';
import { Home, Building2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Currency, formatCurrency } from '../currencyUtils';
import { OIHoldAnalysis, OIInputs } from '../useOICalculations';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface IncomeProjectionTableProps {
  holdAnalysis: OIHoldAnalysis;
  inputs: OIInputs;
  basePrice: number;
  currency: Currency;
  rate: number;
  onCompareClick?: () => void;
}

export const IncomeProjectionTable = ({
  holdAnalysis,
  inputs,
  basePrice,
  currency,
  rate,
  onCompareClick,
}: IncomeProjectionTableProps) => {
  const [showAnnual, setShowAnnual] = useState(false);
  
  const monthlyRent = holdAnalysis.annualRent / 12;
  const monthlyServiceCharges = holdAnalysis.annualServiceCharges / 12;
  const monthlyNetRent = holdAnalysis.netAnnualRent / 12;
  const grossYield = (holdAnalysis.annualRent / basePrice) * 100;
  const netYield = (holdAnalysis.netAnnualRent / basePrice) * 100;
  
  // Short-term rental
  const hasShortTerm = inputs.showAirbnbComparison && holdAnalysis.airbnbAnnualRent;
  const monthlyAirbnbGross = hasShortTerm ? (holdAnalysis.airbnbAnnualRent || 0) / 12 : 0;
  
  const displayMultiplier = showAnnual ? 12 : 1;
  const periodLabel = showAnnual ? 'Annual' : 'Monthly';

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Home className="w-4 h-4" />
          Section C - Project {periodLabel} Net Income
        </h3>
        
        {/* Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAnnual(!showAnnual)}
          className="h-7 text-xs gap-1"
        >
          {showAnnual ? (
            <>
              <ToggleRight className="w-4 h-4" />
              Annual
            </>
          ) : (
            <>
              <ToggleLeft className="w-4 h-4" />
              Monthly
            </>
          )}
        </Button>
      </div>
      
      {/* Grid: Long-term + Optional Short-term */}
      <div className={cn(
        "grid gap-4 p-4",
        hasShortTerm ? "md:grid-cols-2" : "grid-cols-1"
      )}>
        {/* Long-term Rental */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
            <Building2 className="w-4 h-4" />
            Long-term Rental
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross {periodLabel} Rental Income</span>
              <div className="text-right">
                <span className="font-medium text-green-500">
                  {formatCurrency(monthlyRent * displayMultiplier, 'AED', 1)}
                </span>
                {currency !== 'AED' && (
                  <span className="text-xs text-muted-foreground block">
                    {formatCurrency(monthlyRent * displayMultiplier, currency, rate)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex justify-between bg-green-500/10 p-2 rounded">
              <span className="font-medium text-foreground">Gross Yield</span>
              <span className="font-bold text-green-500">{grossYield.toFixed(2)}%</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Charges</span>
              <div className="text-right">
                <span className="text-red-500">
                  ({formatCurrency(monthlyServiceCharges * displayMultiplier, 'AED', 1)})
                </span>
                {currency !== 'AED' && (
                  <span className="text-xs text-red-500/70 block">
                    ({formatCurrency(monthlyServiceCharges * displayMultiplier, currency, rate)})
                  </span>
                )}
              </div>
            </div>
            
            <div className="border-t border-border pt-2">
              <div className="flex justify-between">
                <span className="font-medium text-foreground">Net {periodLabel} Income</span>
                <div className="text-right">
                  <span className="font-bold text-green-500">
                    {formatCurrency(monthlyNetRent * displayMultiplier, 'AED', 1)}
                  </span>
                  {currency !== 'AED' && (
                    <span className="text-xs text-muted-foreground block">
                      {formatCurrency(monthlyNetRent * displayMultiplier, currency, rate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between bg-primary/10 p-2 rounded">
              <span className="font-medium text-foreground">Net Yield</span>
              <span className="font-bold text-primary">{netYield.toFixed(2)}%</span>
            </div>
          </div>
        </div>
        
        {/* Short-term Rental (if enabled) */}
        {hasShortTerm && (
          <div className="space-y-3 border-l border-border pl-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Home className="w-4 h-4" />
                Short-term Rental
              </div>
              {onCompareClick && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onCompareClick}
                  className="h-6 text-xs"
                >
                  Compare
                </Button>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ADR × Occupancy</span>
                <span className="text-foreground">
                  {formatCurrency(inputs.shortTermRental?.averageDailyRate || 0, 'AED', 1)} × {inputs.shortTermRental?.occupancyPercent || 0}%
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross {periodLabel} Income</span>
                <div className="text-right">
                  <span className="font-medium text-green-500">
                    {formatCurrency(monthlyAirbnbGross * displayMultiplier, 'AED', 1)}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operating Expenses</span>
                <span className="text-muted-foreground">
                  {inputs.shortTermRental?.operatingExpensePercent || 25}%
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Management Fee</span>
                <span className="text-muted-foreground">
                  {inputs.shortTermRental?.managementFeePercent || 15}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
