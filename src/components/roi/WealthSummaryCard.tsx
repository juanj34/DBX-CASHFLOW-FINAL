import { Gem, TrendingUp, Wallet, Minus, Equal } from 'lucide-react';
import { Currency, formatCurrency } from './currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { InfoTooltip } from './InfoTooltip';

interface WealthSummaryCardProps {
  propertyValueFinal: number;
  cumulativeRentIncome: number;
  airbnbCumulativeIncome?: number;
  initialInvestment: number;
  currency: Currency;
  rate: number;
  showAirbnbComparison: boolean;
}

export const WealthSummaryCard = ({
  propertyValueFinal,
  cumulativeRentIncome,
  airbnbCumulativeIncome,
  initialInvestment,
  currency,
  rate,
  showAirbnbComparison,
}: WealthSummaryCardProps) => {
  const { t } = useLanguage();

  const netWealthLongTerm = propertyValueFinal + cumulativeRentIncome - initialInvestment;
  const netWealthAirbnb = airbnbCumulativeIncome 
    ? propertyValueFinal + airbnbCumulativeIncome - initialInvestment 
    : 0;
  
  const percentGainLongTerm = ((netWealthLongTerm / initialInvestment) * 100);
  const percentGainAirbnb = airbnbCumulativeIncome 
    ? ((netWealthAirbnb / initialInvestment) * 100) 
    : 0;

  return (
    <div className="bg-gradient-to-br from-theme-card to-theme-bg border border-theme-accent/30 rounded-2xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-theme-border flex items-center gap-2">
        <Gem className="w-5 h-5 text-theme-accent" />
        <h3 className="font-semibold text-theme-text">{t('wealthCreated7Years') || 'Wealth Created Over 7 Years'}</h3>
      </div>

      <div className="p-4 space-y-3 flex-1">
        {/* Property Value */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-theme-text-muted" />
            <span className="text-sm text-theme-text-muted">{t('estMarketValue')}</span>
            <InfoTooltip translationKey="tooltipEstMarketValue" />
          </div>
          <span className="text-sm font-bold text-theme-text font-mono">
            {formatCurrency(propertyValueFinal, currency, rate)}
          </span>
        </div>

        {/* Cumulative Rent - Long Term */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-theme-accent-secondary" />
            <span className="text-sm text-theme-text-muted">{t('cumulativeRentLT')}</span>
            <InfoTooltip translationKey="tooltipCumulativeRent" />
          </div>
          <span className="text-sm font-bold text-theme-accent-secondary font-mono">
            +{formatCurrency(cumulativeRentIncome, currency, rate)}
          </span>
        </div>

        {/* Cumulative Rent - Short-Term (if enabled) */}
        {showAirbnbComparison && airbnbCumulativeIncome !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-theme-text-muted">{t('cumulativeRentShortTerm')}</span>
            </div>
            <span className="text-sm font-bold text-orange-400 font-mono">
              +{formatCurrency(airbnbCumulativeIncome, currency, rate)}
            </span>
          </div>
        )}

        {/* Initial Investment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4 text-theme-negative" />
            <span className="text-sm text-theme-text-muted">{t('initialInvestment')}</span>
          </div>
          <span className="text-sm font-bold text-theme-negative font-mono">
            -{formatCurrency(initialInvestment, currency, rate)}
          </span>
        </div>

        <div className="border-t border-theme-border my-2" />

        {/* Net Wealth - Long Term */}
        <div className="flex items-center justify-between bg-theme-accent-secondary/10 -mx-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <Equal className="w-4 h-4 text-theme-accent-secondary" />
            <span className="text-sm text-theme-text font-medium">{t('netWealthLT')}</span>
            <InfoTooltip translationKey="tooltipUnrealizedProfit" />
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-theme-accent-secondary font-mono">
              {formatCurrency(netWealthLongTerm, currency, rate)}
            </span>
            <span className="text-xs text-theme-positive ml-2">
              (+{percentGainLongTerm.toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Net Wealth - Short-Term (if enabled) */}
        {showAirbnbComparison && airbnbCumulativeIncome !== undefined && (
          <div className="flex items-center justify-between bg-orange-500/10 -mx-4 px-4 py-3">
            <div className="flex items-center gap-2">
              <Equal className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-theme-text font-medium">{t('netWealthShortTerm')}</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-orange-400 font-mono">
                {formatCurrency(netWealthAirbnb, currency, rate)}
              </span>
              <span className="text-xs text-theme-positive ml-2">
                (+{percentGainAirbnb.toFixed(0)}%)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
