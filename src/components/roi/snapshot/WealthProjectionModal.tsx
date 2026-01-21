import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp } from 'lucide-react';
import { WealthProjectionTable } from './WealthProjectionTable';
import { Currency } from '../currencyUtils';

interface WealthProjectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basePrice: number;
  constructionMonths: number;
  constructionAppreciation: number;
  growthAppreciation: number;
  matureAppreciation: number;
  growthPeriodYears: number;
  bookingYear: number;
  rentalYieldPercent: number;
  rentGrowthRate: number;
  currency: Currency;
  rate: number;
}

export const WealthProjectionModal = ({
  open,
  onOpenChange,
  basePrice,
  constructionMonths,
  constructionAppreciation,
  growthAppreciation,
  matureAppreciation,
  growthPeriodYears,
  bookingYear,
  rentalYieldPercent,
  rentGrowthRate,
  currency,
  rate,
}: WealthProjectionModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-theme-card border-theme-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-theme-text">
            <TrendingUp className="w-5 h-5 text-primary" />
            7-Year Wealth Projection
          </DialogTitle>
        </DialogHeader>
        
        <WealthProjectionTable
          basePrice={basePrice}
          constructionMonths={constructionMonths}
          constructionAppreciation={constructionAppreciation}
          growthAppreciation={growthAppreciation}
          matureAppreciation={matureAppreciation}
          growthPeriodYears={growthPeriodYears}
          bookingYear={bookingYear}
          rentalYieldPercent={rentalYieldPercent}
          rentGrowthRate={rentGrowthRate}
          currency={currency}
          rate={rate}
        />
      </DialogContent>
    </Dialog>
  );
};
