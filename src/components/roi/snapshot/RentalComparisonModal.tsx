import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OIHoldAnalysis, OIInputs } from '../useOICalculations';
import { Currency, formatCurrency } from '../currencyUtils';
import { Building2, Home, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RentalComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holdAnalysis: OIHoldAnalysis;
  inputs: OIInputs;
  basePrice: number;
  currency: Currency;
  rate: number;
}

export const RentalComparisonModal = ({
  open,
  onOpenChange,
  holdAnalysis,
  inputs,
  basePrice,
  currency,
  rate,
}: RentalComparisonModalProps) => {
  const longTermAnnual = holdAnalysis.annualRent;
  const shortTermAnnual = holdAnalysis.airbnbAnnualRent || 0;
  const difference = shortTermAnnual - longTermAnnual;
  const percentDiff = longTermAnnual > 0 ? ((difference / longTermAnnual) * 100) : 0;
  
  const stConfig = inputs.shortTermRental;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Long-term vs Short-term Rental Comparison</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          {/* Comparison Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Long-term */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-foreground">Long-term Rental</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Annual</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(longTermAnnual, 'AED', 1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Annual</span>
                  <span className="font-medium text-green-500">
                    {formatCurrency(holdAnalysis.netAnnualRent, 'AED', 1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Yield</span>
                  <span className="font-bold text-blue-500">
                    {((holdAnalysis.netAnnualRent / basePrice) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Years to Pay Off</span>
                  <span className="font-medium text-foreground">
                    {holdAnalysis.yearsToPayOff.toFixed(1)} years
                  </span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-500/20 rounded text-center">
                <p className="text-xs text-muted-foreground">Best for</p>
                <p className="font-semibold text-blue-500">Passive Income</p>
              </div>
            </div>
            
            {/* Short-term */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Home className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-foreground">Short-term Rental</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ADR</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(stConfig?.averageDailyRate || 0, 'AED', 1)}/night
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Occupancy</span>
                  <span className="font-medium text-foreground">
                    {stConfig?.occupancyPercent || 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Annual</span>
                  <span className="font-medium text-green-500">
                    {formatCurrency(shortTermAnnual, 'AED', 1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Years to Pay Off</span>
                  <span className="font-medium text-foreground">
                    {holdAnalysis.airbnbYearsToPayOff?.toFixed(1) || 'N/A'} years
                  </span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-orange-500/20 rounded text-center">
                <p className="text-xs text-muted-foreground">Best for</p>
                <p className="font-semibold text-orange-500">Active Management</p>
              </div>
            </div>
          </div>
          
          {/* Comparison Bar */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Income Comparison</span>
              <span className={cn(
                "text-sm font-bold",
                percentDiff > 0 ? "text-green-500" : "text-red-500"
              )}>
                {percentDiff > 0 ? '+' : ''}{percentDiff.toFixed(0)}%
              </span>
            </div>
            
            <div className="h-8 bg-muted rounded-full overflow-hidden flex">
              <div 
                className="bg-blue-500 h-full flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${(longTermAnnual / Math.max(longTermAnnual, shortTermAnnual)) * 100}%` }}
              >
                LT
              </div>
              {shortTermAnnual > longTermAnnual && (
                <div 
                  className="bg-orange-500 h-full flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${((shortTermAnnual - longTermAnnual) / Math.max(longTermAnnual, shortTermAnnual)) * 100}%` }}
                >
                  +ST
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {percentDiff > 0 
                ? `Short-term generates ${formatCurrency(difference, 'AED', 1)} more annually`
                : `Long-term is more stable with guaranteed income`}
            </p>
          </div>
          
          {/* Considerations */}
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Long-term Pros</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Stable, predictable income</li>
                <li>• Lower management effort</li>
                <li>• No furnishing costs</li>
                <li>• Less wear and tear</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Short-term Pros</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Higher income potential</li>
                <li>• Flexibility for personal use</li>
                <li>• Premium location premiums</li>
                <li>• Dynamic pricing</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
