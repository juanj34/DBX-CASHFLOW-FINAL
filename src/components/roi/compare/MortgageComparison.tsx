import { useMemo } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { MortgageInputs } from '@/components/roi/useMortgageCalculations';
import { formatCurrency, Currency } from '@/components/roi/currencyUtils';
import { useTheme } from '@/contexts/ThemeContext';
import { getQuoteDisplayName } from './utils';

// Theme-aware colors for quotes
const getQuoteColors = (isLightTheme: boolean) => 
  isLightTheme 
    ? ['#B8860B', '#1e40af', '#7c3aed', '#c2410c', '#0f766e', '#be185d']
    : ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500', '#FF6B6B', '#4ECDC4'];

interface MortgageComparisonProps {
  quotesWithCalcs: QuoteWithCalculations[];
  currency?: Currency;
  exchangeRate?: number;
}

interface MortgageData {
  quoteId: string;
  enabled: boolean;
  financingPercent: number;
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  monthlyPayment: number;
  totalInterest: number;
  gapPercent: number;
  hasGap: boolean;
}

// Calculate monthly payment helper
const calculateMonthlyPayment = (principal: number, annualRate: number, termYears: number): number => {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  
  if (monthlyRate > 0 && numPayments > 0) {
    const factor = Math.pow(1 + monthlyRate, numPayments);
    return principal * (monthlyRate * factor) / (factor - 1);
  } else if (numPayments > 0) {
    return principal / numPayments;
  }
  return 0;
};

export const MortgageComparison = ({ 
  quotesWithCalcs, 
  currency = 'AED',
  exchangeRate = 1 
}: MortgageComparisonProps) => {
  const { theme } = useTheme();
  const isLightTheme = theme === 'consultant';
  const colors = getQuoteColors(isLightTheme);

  const mortgageData = useMemo(() => {
    return quotesWithCalcs.map(({ quote, calculations }) => {
      const mortgageInputs = (quote.inputs as any)?._mortgageInputs as MortgageInputs | undefined;
      const inputs = quote.inputs;
      
      if (!mortgageInputs?.enabled) {
        return {
          quoteId: quote.id,
          enabled: false,
          financingPercent: 0,
          loanAmount: 0,
          interestRate: 0,
          loanTermYears: 0,
          monthlyPayment: 0,
          totalInterest: 0,
          gapPercent: 0,
          hasGap: false,
        };
      }

      const { financingPercent, loanTermYears, interestRate } = mortgageInputs;
      const basePrice = inputs.basePrice;
      const preHandoverPercent = inputs.downpaymentPercent + inputs.preHandoverPercent;
      
      const equityRequiredPercent = 100 - financingPercent;
      const gapPercent = Math.max(0, equityRequiredPercent - preHandoverPercent);
      const hasGap = gapPercent > 0;
      
      const loanAmount = basePrice * financingPercent / 100;
      const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTermYears);
      const totalPayments = monthlyPayment * loanTermYears * 12;
      const totalInterest = totalPayments - loanAmount;

      return {
        quoteId: quote.id,
        enabled: true,
        financingPercent,
        loanAmount,
        interestRate,
        loanTermYears,
        monthlyPayment,
        totalInterest,
        gapPercent,
        hasGap,
      };
    });
  }, [quotesWithCalcs]);

  // Check if any quote has mortgage enabled
  const hasMortgageData = mortgageData.some(d => d.enabled);
  
  if (!hasMortgageData) {
    return null;
  }

  // Find best values for highlighting
  const enabledData = mortgageData.filter(d => d.enabled);
  const lowestMonthly = enabledData.length > 0 ? Math.min(...enabledData.map(d => d.monthlyPayment)) : 0;
  const lowestInterest = enabledData.length > 0 ? Math.min(...enabledData.map(d => d.totalInterest)) : 0;
  const lowestRate = enabledData.length > 0 ? Math.min(...enabledData.map(d => d.interestRate)) : 0;

  

  const MetricRow = ({ 
    label, 
    values, 
    format = 'text',
    highlightLowest = false,
    highlightHighest = false,
  }: { 
    label: string; 
    values: (string | number | null)[];
    format?: 'text' | 'currency' | 'percent' | 'years';
    highlightLowest?: boolean;
    highlightHighest?: boolean;
  }) => {
    const numericValues = values.map(v => typeof v === 'number' ? v : null);
    const validValues = numericValues.filter((v): v is number => v !== null && v > 0);
    const targetValue = highlightLowest 
      ? Math.min(...validValues)
      : highlightHighest 
        ? Math.max(...validValues) 
        : null;

    return (
      <div className="grid gap-4 items-center py-2 border-b border-theme-border/50" 
           style={{ gridTemplateColumns: `180px repeat(${values.length}, 1fr)` }}>
        <div className="text-sm text-theme-text-muted">{label}</div>
        {values.map((value, index) => {
          const isTarget = targetValue !== null && numericValues[index] === targetValue;
          const formatted = value === null || value === '-' 
            ? '-' 
            : format === 'currency' 
              ? formatCurrency(value as number, currency, exchangeRate)
              : format === 'percent'
                ? `${value}%`
                : format === 'years'
                  ? `${value} yrs`
                  : value;
          
          return (
            <div 
              key={index}
              className={`text-sm font-mono text-center ${
                isTarget ? 'text-green-400 font-semibold' : 'text-theme-text'
              }`}
            >
              {formatted}
              {isTarget && <Check className="w-3 h-3 inline ml-1" />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `180px repeat(${quotesWithCalcs.length}, 1fr)` }}>
        <div className="text-xs text-theme-text-muted uppercase tracking-wider">Metric</div>
        {quotesWithCalcs.map((q, i) => (
          <div key={q.quote.id} className="text-center">
            <div 
              className="text-xs font-medium truncate px-2"
              style={{ color: colors[i % colors.length] }}
            >
              {getQuoteDisplayName(q.quote.title, q.quote.projectName)}
            </div>
          </div>
        ))}
      </div>

      {/* Mortgage Status */}
      <MetricRow 
        label="Financing Enabled" 
        values={mortgageData.map(d => d.enabled ? 'Yes' : 'No (Cash)')}
      />

      {/* Financing % */}
      <MetricRow 
        label="Financing %" 
        values={mortgageData.map(d => d.enabled ? d.financingPercent : '-')}
        format="percent"
      />

      {/* Loan Amount */}
      <MetricRow 
        label="Loan Amount" 
        values={mortgageData.map(d => d.enabled ? d.loanAmount : null)}
        format="currency"
      />

      {/* Interest Rate */}
      <MetricRow 
        label="Interest Rate" 
        values={mortgageData.map(d => d.enabled ? d.interestRate : '-')}
        format="percent"
        highlightLowest
      />

      {/* Loan Term */}
      <MetricRow 
        label="Loan Term" 
        values={mortgageData.map(d => d.enabled ? d.loanTermYears : '-')}
        format="years"
      />

      {/* Monthly Payment */}
      <MetricRow 
        label="Monthly Payment" 
        values={mortgageData.map(d => d.enabled ? d.monthlyPayment : null)}
        format="currency"
        highlightLowest
      />

      {/* Total Interest */}
      <MetricRow 
        label="Total Interest" 
        values={mortgageData.map(d => d.enabled ? d.totalInterest : null)}
        format="currency"
        highlightLowest
      />

      {/* Gap Warning */}
      {mortgageData.some(d => d.hasGap) && (
        <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: `180px repeat(${quotesWithCalcs.length}, 1fr)` }}>
          <div className="text-sm text-theme-text-muted flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Gap Payment
          </div>
          {mortgageData.map((d, i) => (
            <div key={i} className="text-center">
              {d.hasGap ? (
                <span className="text-amber-400 text-sm font-mono">+{d.gapPercent.toFixed(0)}%</span>
              ) : (
                <span className="text-theme-text-muted text-sm">—</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
