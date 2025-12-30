import { Gem, TrendingUp, Wallet, Minus, Equal } from 'lucide-react';
import { Currency, formatCurrency } from './currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { InfoTooltip } from './InfoTooltip';

interface WealthSummaryCardProps {
  propertyValueYear10: number;
  cumulativeRentIncome: number;
  airbnbCumulativeIncome?: number;
  initialInvestment: number;
  currency: Currency;
  rate: number;
  showAirbnbComparison: boolean;
}

export const WealthSummaryCard = ({
  propertyValueYear10,
  cumulativeRentIncome,
  airbnbCumulativeIncome,
  initialInvestment,
  currency,
  rate,
  showAirbnbComparison,
}: WealthSummaryCardProps) => {
  const { t } = useLanguage();

  const netWealthLongTerm = propertyValueYear10 + cumulativeRentIncome - initialInvestment;
  const netWealthAirbnb = airbnbCumulativeIncome 
    ? propertyValueYear10 + airbnbCumulativeIncome - initialInvestment 
    : 0;
  
  const percentGainLongTerm = ((netWealthLongTerm / initialInvestment) * 100);
  const percentGainAirbnb = airbnbCumulativeIncome 
    ? ((netWealthAirbnb / initialInvestment) * 100) 
    : 0;

  return (
    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f172a] border border-[#CCFF00]/30 rounded-2xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#2a3142] flex items-center gap-2">
        <Gem className="w-5 h-5 text-[#CCFF00]" />
        <h3 className="font-semibold text-white">{t('wealthCreated10Years')}</h3>
      </div>

      <div className="p-4 space-y-3 flex-1">
        {/* Property Value */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">{t('propertyValueYear10')}</span>
            <InfoTooltip translationKey="tooltipPropertyValue10Y" />
          </div>
          <span className="text-sm font-bold text-white font-mono">
            {formatCurrency(propertyValueYear10, currency, rate)}
          </span>
        </div>

        {/* Cumulative Rent - Long Term */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-400">{t('cumulativeRentLT')}</span>
            <InfoTooltip translationKey="tooltipCumulativeRent" />
          </div>
          <span className="text-sm font-bold text-cyan-400 font-mono">
            +{formatCurrency(cumulativeRentIncome, currency, rate)}
          </span>
        </div>

        {/* Cumulative Rent - Short-Term (if enabled) */}
        {showAirbnbComparison && airbnbCumulativeIncome !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-400">{t('cumulativeRentShortTerm')}</span>
            </div>
            <span className="text-sm font-bold text-orange-400 font-mono">
              +{formatCurrency(airbnbCumulativeIncome, currency, rate)}
            </span>
          </div>
        )}

        {/* Initial Investment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4 text-red-400" />
            <span className="text-sm text-gray-400">{t('initialInvestment')}</span>
          </div>
          <span className="text-sm font-bold text-red-400 font-mono">
            -{formatCurrency(initialInvestment, currency, rate)}
          </span>
        </div>

        <div className="border-t border-[#2a3142] my-2" />

        {/* Net Wealth - Long Term */}
        <div className="flex items-center justify-between bg-cyan-500/10 -mx-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <Equal className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-white font-medium">{t('netWealthLT')}</span>
            <InfoTooltip translationKey="tooltipNetWealth" />
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-cyan-400 font-mono">
              {formatCurrency(netWealthLongTerm, currency, rate)}
            </span>
            <span className="text-xs text-green-400 ml-2">
              (+{percentGainLongTerm.toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Net Wealth - Short-Term (if enabled) */}
        {showAirbnbComparison && airbnbCumulativeIncome !== undefined && (
          <div className="flex items-center justify-between bg-orange-500/10 -mx-4 px-4 py-3">
            <div className="flex items-center gap-2">
              <Equal className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-white font-medium">{t('netWealthShortTerm')}</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-orange-400 font-mono">
                {formatCurrency(netWealthAirbnb, currency, rate)}
              </span>
              <span className="text-xs text-green-400 ml-2">
                (+{percentGainAirbnb.toFixed(0)}%)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
