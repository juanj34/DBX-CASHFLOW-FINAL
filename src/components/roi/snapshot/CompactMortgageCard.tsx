import { Landmark, TrendingUp, TrendingDown } from 'lucide-react';
import { MortgageInputs, MortgageAnalysis } from '../useMortgageCalculations';
import { Currency, formatDualCurrency, calculateAverageMonthlyRent } from '../currencyUtils';
import { DottedRow } from './DottedRow';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompactMortgageCardProps {
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  monthlyRent: number; // Year 1 rent
  rentGrowthRate: number; // Annual growth rate %
  currency: Currency;
  rate: number;
}

export const CompactMortgageCard = ({
  mortgageInputs,
  mortgageAnalysis,
  monthlyRent,
  rentGrowthRate,
  currency,
  rate,
}: CompactMortgageCardProps) => {
  const { t } = useLanguage();
  
  if (!mortgageInputs.enabled) return null;

  const { loanAmount, monthlyPayment, totalInterest, equityRequiredPercent } = mortgageAnalysis;
  
  // Calculate average rent over the mortgage term for more accurate coverage analysis
  const loanTermYears = mortgageInputs.loanTermYears;
  const averageMonthlyRent = calculateAverageMonthlyRent(monthlyRent, rentGrowthRate, loanTermYears);
  
  // Cash flow calculation using average rent
  const monthlyCashflow = averageMonthlyRent - monthlyPayment;
  const isPositive = monthlyCashflow >= 0;

  // Dual currency helper
  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-theme-text uppercase tracking-wide">{t('mortgageHeader')}</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
          {mortgageInputs.loanTermYears}{t('yearsShort')} @ {mortgageInputs.interestRate}%
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Loan Amount */}
        <DottedRow 
          label={`${t('loanAmountLabel')} (${100 - equityRequiredPercent}%)`}
          value={getDualValue(loanAmount).primary}
          secondaryValue={getDualValue(loanAmount).secondary}
        />
        
        {/* Monthly Payment */}
        <DottedRow 
          label={t('monthlyPaymentLabel')}
          value={getDualValue(monthlyPayment).primary}
          secondaryValue={getDualValue(monthlyPayment).secondary}
          bold
          valueClassName="text-purple-400"
        />
        
        {/* Rental Income - Average over mortgage term */}
        <DottedRow 
          label={`${t('rentalIncome')} (${t('avgShort')} ${loanTermYears}${t('yearsShort')})`}
          value={`+${getDualValue(averageMonthlyRent).primary}`}
          valueClassName="text-cyan-400"
        />
        
        {/* Year 1 reference */}
        <div className="text-[9px] text-theme-text-muted text-right -mt-1">
          {t('year1')}: {getDualValue(monthlyRent).primary} → {rentGrowthRate}%/{t('yearsShort')}
        </div>
        
        {/* Cash Flow */}
        <div className="pt-2 border-t border-border">
          <DottedRow 
            label={t('monthlyCashFlowLabel')}
            value={`${isPositive ? '+' : ''}${getDualValue(monthlyCashflow).primary}`}
            bold
            valueClassName={isPositive ? 'text-green-400' : 'text-red-400'}
          />
        </div>
        
        {/* Summary badges */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-theme-card-alt border border-theme-border text-theme-text-muted">
            {t('interestLabel')}: {getDualValue(totalInterest).primary}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${isPositive ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {isPositive ? t('positiveLabel') : t('negativeLabel')}
          </span>
        </div>
      </div>
    </div>
  );
};
