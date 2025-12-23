import { OIYearlyProjection } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { Home, Building, TrendingUp, Star, TrendingDown, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface OIYearlyProjectionTableProps {
  projections: OIYearlyProjection[];
  currency: Currency;
  rate: number;
  showAirbnbComparison: boolean;
  unitSizeSqf?: number;
  showMortgage?: boolean;
  mortgageMonthlyPayment?: number;
  mortgageStartYear?: number;
}

const getPhaseColor = (phase: 'construction' | 'growth' | 'mature') => {
  switch (phase) {
    case 'construction': return 'text-orange-400';
    case 'growth': return 'text-green-400';
    case 'mature': return 'text-blue-400';
  }
};

const getPhaseLabel = (phase: 'construction' | 'growth' | 'mature') => {
  switch (phase) {
    case 'construction': return '🏗️';
    case 'growth': return '📈';
    case 'mature': return '🏠';
  }
};

export const OIYearlyProjectionTable = ({ projections, currency, rate, showAirbnbComparison, unitSizeSqf, showMortgage, mortgageMonthlyPayment, mortgageStartYear }: OIYearlyProjectionTableProps) => {
  const { t } = useLanguage();
  const lastProjection = projections[projections.length - 1];
  const longTermTotal = lastProjection?.cumulativeNetIncome || 0;
  const airbnbTotal = lastProjection?.airbnbCumulativeNetIncome || 0;
  const winner = airbnbTotal > longTermTotal ? 'airbnb' : 'long-term';
  const difference = Math.abs(airbnbTotal - longTermTotal);
  
  // Calculate mortgage impact
  const annualMortgagePayment = (mortgageMonthlyPayment || 0) * 12;
  
  return (
    <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#2a3142] flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#CCFF00]" />
            {t('tenYearHoldSimulation')}
          </h3>
          <p className="text-xs text-gray-400 mt-1">{t('propertyValueRentalYield')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
            🏢 {t('longTerm')}
          </span>
          {showAirbnbComparison && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
              🏠 Airbnb
            </span>
          )}
        </div>
      </div>
      
      {/* Comparison Summary Header */}
      {showAirbnbComparison && (
        <div className="p-4 border-b border-[#2a3142] grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <div className="text-xs text-gray-400">{t('longTermTenYear')}</div>
            <div className="text-lg font-bold text-blue-400">{formatCurrency(longTermTotal, currency, rate)}</div>
          </div>
          <div className="text-center p-3 bg-[#CCFF00]/10 rounded-lg border border-[#CCFF00]/30">
            <div className="text-xs text-gray-400">{t('difference')}</div>
            <div className={`text-lg font-bold ${winner === 'airbnb' ? 'text-purple-400' : 'text-blue-400'}`}>
              +{formatCurrency(difference, currency, rate)}
            </div>
            <div className="text-xs text-gray-500">
              {winner === 'airbnb' ? t('airbnbWins') : t('longTermWins')}
            </div>
          </div>
          <div className="text-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
            <div className="text-xs text-gray-400">{t('airbnbTenYear')}</div>
            <div className="text-lg font-bold text-purple-400">{formatCurrency(airbnbTotal, currency, rate)}</div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-[#0d1117]">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('yearColumn')}</th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('phase')}</th>
              <th className="px-2 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('value')}</th>
              <th className="px-2 py-3 text-right text-xs font-medium text-cyan-400 uppercase tracking-wider whitespace-nowrap">{t('netRent')}</th>
              {showMortgage && (
                <th className="px-2 py-3 text-right text-xs font-medium text-blue-400 uppercase tracking-wider whitespace-nowrap">{t('mortgage')}</th>
              )}
              {showMortgage && (
                <th className="px-2 py-3 text-right text-xs font-medium text-green-400 uppercase tracking-wider whitespace-nowrap">{t('netAfterMortgage')}</th>
              )}
              {showAirbnbComparison && (
                <th className="px-2 py-3 text-right text-xs font-medium text-orange-400 uppercase tracking-wider whitespace-nowrap">{t('airbnbNet')}</th>
              )}
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a3142]">
            {projections.map((proj) => {
              // Calculate mortgage payment for this year (only after handover)
              const isMortgageActive = showMortgage && mortgageStartYear && proj.calendarYear >= mortgageStartYear;
              const yearMortgagePayment = isMortgageActive ? annualMortgagePayment : 0;
              const netAfterMortgage = (proj.netIncome || 0) - yearMortgagePayment;
              
              return (
                <tr 
                  key={proj.year}
                  className={
                    proj.isBreakEven || proj.isAirbnbBreakEven
                      ? 'bg-green-500/10' 
                      : proj.isHandover 
                        ? 'bg-[#CCFF00]/10' 
                        : ''
                  }
                >
                  <td className="px-2 py-2 sm:py-3 text-xs sm:text-sm text-white font-medium whitespace-nowrap">
                    {proj.calendarYear}
                    {proj.monthsActive && proj.monthsActive < 12 && (
                      <span className="text-[10px] text-gray-500 ml-1">({proj.monthsActive} {t('mo')})</span>
                    )}
                  </td>
                  <td className="px-2 py-2 sm:py-3 text-center">
                    <span className={`text-xs sm:text-sm ${getPhaseColor(proj.phase)}`} title={proj.phase}>
                      {getPhaseLabel(proj.phase)}
                    </span>
                  </td>
                  <td className="px-2 py-2 sm:py-3 text-right whitespace-nowrap">
                    <div className="text-xs sm:text-sm text-white font-mono">
                      {formatCurrency(proj.propertyValue, currency, rate)}
                    </div>
                    {unitSizeSqf && unitSizeSqf > 0 && (
                      <div className="text-[10px] text-gray-600 font-mono">
                        {formatCurrency(proj.propertyValue / unitSizeSqf, currency, rate)}/sqft
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 sm:py-3 text-xs sm:text-sm text-right font-mono whitespace-nowrap">
                    {proj.netIncome ? (
                      <span className="text-cyan-400">
                        {formatCurrency(proj.netIncome, currency, rate)}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  {showMortgage && (
                    <td className="px-2 py-2 sm:py-3 text-xs sm:text-sm text-right font-mono whitespace-nowrap">
                      {isMortgageActive ? (
                        <span className="text-blue-400">
                          -{formatCurrency(yearMortgagePayment, currency, rate)}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  )}
                  {showMortgage && (
                    <td className="px-2 py-2 sm:py-3 text-xs sm:text-sm text-right font-mono whitespace-nowrap">
                      {proj.netIncome ? (
                        <span className={netAfterMortgage >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {formatCurrency(netAfterMortgage, currency, rate)}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  )}
                  {showAirbnbComparison && (
                    <td className="px-2 py-2 sm:py-3 text-xs sm:text-sm text-right font-mono whitespace-nowrap">
                      {proj.airbnbNetIncome ? (
                        <span className="text-orange-400">
                          {formatCurrency(proj.airbnbNetIncome, currency, rate)}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-2 py-3 text-sm text-center">
                    {proj.isConstruction && !proj.isHandover && (
                      <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400 inline-flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {t('build')}
                      </span>
                    )}
                    {proj.isHandover && (
                      <span className="px-2 py-1 rounded-full text-xs bg-[#CCFF00]/20 text-[#CCFF00] inline-flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        {t('handover')}
                      </span>
                    )}
                    {proj.isBreakEven && (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 inline-flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {t('breakEven')}
                      </span>
                    )}
                    {!proj.isConstruction && !proj.isHandover && !proj.isBreakEven && (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                        {proj.phase === 'growth' ? t('growth') : t('mature')}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Summary Footer */}
      <div className="p-4 border-t border-[#2a3142] bg-[#0d1117]">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{t('totalNetIncome10Y')}</span>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="text-orange-400">🏗️</span> {t('build')}</span>
              <span className="flex items-center gap-1"><span className="text-green-400">📈</span> {t('growth')}</span>
              <span className="flex items-center gap-1"><span className="text-blue-400">🏠</span> {t('mature')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-blue-400 font-mono font-bold">
              {t('ltLabel')} {formatCurrency(longTermTotal, currency, rate)}
            </span>
            {showAirbnbComparison && (
              <span className="text-purple-400 font-mono font-bold">
                {t('airbnbLabel')} {formatCurrency(airbnbTotal, currency, rate)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
