import { Home, TrendingUp, Calendar } from 'lucide-react';
import { OIInputs } from '../useOICalculations';
import { Currency, formatDualCurrency } from '../currencyUtils';
import { DottedRow } from './DottedRow';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompactRentCardProps {
  inputs: OIInputs;
  currency: Currency;
  rate: number;
  onViewWealthProjection?: () => void;
}

export const CompactRentCard = ({
  inputs,
  currency,
  rate,
  onViewWealthProjection,
}: CompactRentCardProps) => {
  const { t } = useLanguage();
  const { 
    basePrice,
    rentalYieldPercent, 
    serviceChargePerSqft = 18,
    unitSizeSqf = 0,
    showAirbnbComparison,
    shortTermRental,
    rentGrowthRate = 4
  } = inputs;
  
  // Long-term calculations
  const grossAnnualRent = basePrice * (rentalYieldPercent / 100);
  const annualServiceCharges = unitSizeSqf * serviceChargePerSqft;
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const monthlyRent = netAnnualRent / 12;
  const grossYield = rentalYieldPercent;
  const netYield = basePrice > 0 ? (netAnnualRent / basePrice) * 100 : 0;
  
  // Calculate 7-year average rent with growth
  const calculate7YearAverageRent = (yearOneRent: number, growthRate: number): number => {
    let totalRent = 0;
    let currentRent = yearOneRent;
    for (let year = 1; year <= 7; year++) {
      totalRent += currentRent;
      currentRent *= (1 + growthRate / 100);
    }
    return totalRent / 7;
  };
  const averageAnnualRent = calculate7YearAverageRent(netAnnualRent, rentGrowthRate);
  
  // Short-term calculations
  const adrValue = shortTermRental?.averageDailyRate || 800;
  const occupancyPercent = shortTermRental?.occupancyPercent || 70;
  const operatingExpensePercent = shortTermRental?.operatingExpensePercent || 25;
  const managementFeePercent = shortTermRental?.managementFeePercent || 15;
  
  const grossAirbnbAnnual = adrValue * 365 * (occupancyPercent / 100);
  const totalExpensePercent = operatingExpensePercent + managementFeePercent;
  const airbnbOperatingExpenses = grossAirbnbAnnual * (totalExpensePercent / 100);
  const netAirbnbAnnual = grossAirbnbAnnual - airbnbOperatingExpenses - annualServiceCharges;
  const monthlyAirbnb = netAirbnbAnnual / 12;
  
  // Comparison
  const airbnbDifferencePercent = netAnnualRent > 0 
    ? ((netAirbnbAnnual - netAnnualRent) / netAnnualRent) * 100
    : 0;

  // Dual currency helper
  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };

  if (rentalYieldPercent <= 0) return null;

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-theme-accent" />
          <span className="text-xs font-semibold text-theme-text uppercase tracking-wide">{t('rentalIncome')}</span>
        </div>
        <div className="flex items-center gap-2">
          {showAirbnbComparison && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400">
              {t('lt')} + {t('st')}
            </span>
          )}
          {onViewWealthProjection && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewWealthProjection}
              className="h-6 px-2 text-[10px] text-primary hover:text-primary hover:bg-primary/10"
            >
              <Calendar className="w-3 h-3 mr-1" />
              {t('sevenYearTable')}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={showAirbnbComparison ? "grid grid-cols-2" : ""}>
        {/* Long-Term Section */}
        <div className="p-3 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wide text-cyan-400 font-semibold mb-2">{t('longTermLabel')}</div>
          
          <DottedRow 
            label={t('grossLabel')}
            value={getDualValue(grossAnnualRent).primary}
            secondaryValue={getDualValue(grossAnnualRent).secondary}
          />
          
          {unitSizeSqf > 0 && (
            <DottedRow 
              label={`− ${t('serviceLabel')}`}
              value={`-${getDualValue(annualServiceCharges).primary}`}
              valueClassName="text-red-400"
            />
          )}
          
          <div className="pt-1 border-t border-theme-border">
            <DottedRow 
              label={`= ${t('netYearLabel')}`}
              value={getDualValue(netAnnualRent).primary}
              secondaryValue={getDualValue(netAnnualRent).secondary}
              bold
              valueClassName="text-primary"
            />
          </div>
          
          <DottedRow 
            label={t('monthlyLabel')}
            value={getDualValue(monthlyRent).primary}
            secondaryValue={getDualValue(monthlyRent).secondary}
            valueClassName="text-cyan-400"
          />
          
          {/* 7-Year Average Section */}
          <div className="mt-2 pt-2 border-t border-theme-border/50">
            <DottedRow 
              label={t('sevenYearAverageLabel')}
              value={getDualValue(averageAnnualRent).primary}
              secondaryValue={getDualValue(averageAnnualRent).secondary}
              valueClassName="text-green-400"
            />
            <span className="text-[9px] text-theme-text-muted">
              ({t('includesGrowthLabel')} {rentGrowthRate}%/{t('yearShort')})
            </span>
          </div>
          
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">
              {t('grossLabel')}: {grossYield.toFixed(1)}%
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              {t('netLabel')}: {netYield.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Short-Term Section */}
        {showAirbnbComparison && (
          <div className="p-3 space-y-1.5 border-l border-border bg-orange-500/5">
            <div className="text-[10px] uppercase tracking-wide text-orange-400 font-semibold mb-2">{t('shortTermLabel')}</div>
            
            <DottedRow 
              label={`ADR × ${occupancyPercent}%`}
              value={getDualValue(grossAirbnbAnnual).primary}
            />
            
            <DottedRow 
              label={`− ${t('expensesLabel')}`}
              value={`-${getDualValue(airbnbOperatingExpenses + annualServiceCharges).primary}`}
              valueClassName="text-red-400"
            />
            
            <div className="pt-1 border-t border-orange-500/20">
              <DottedRow 
                label={`= ${t('netYearLabel')}`}
                value={getDualValue(netAirbnbAnnual).primary}
                bold
                valueClassName="text-orange-400"
              />
            </div>
            
            <DottedRow 
              label={t('monthlyLabel')}
              value={getDualValue(monthlyAirbnb).primary}
              valueClassName="text-orange-400"
            />
            
            <div className="flex items-center gap-1 pt-1">
              <TrendingUp className={`w-3 h-3 ${airbnbDifferencePercent >= 0 ? 'text-green-400' : 'text-red-400 rotate-180'}`} />
              <span className={`text-[10px] font-medium ${airbnbDifferencePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {airbnbDifferencePercent >= 0 ? '+' : ''}{airbnbDifferencePercent.toFixed(0)}% {t('vsLongTerm')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
