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
  embedded?: boolean; // When true, removes outer container styling
}

const getPhaseColor = (phase: 'construction' | 'growth' | 'mature') => {
  switch (phase) {
    case 'construction': return 'text-theme-accent';
    case 'growth': return 'text-theme-positive';
    case 'mature': return 'text-theme-text-highlight';
  }
};

const getPhaseLabel = (phase: 'construction' | 'growth' | 'mature') => {
  switch (phase) {
    case 'construction': return '🏗️';
    case 'growth': return '📈';
    case 'mature': return '🏠';
  }
};

export const OIYearlyProjectionTable = ({ projections, currency, rate, showAirbnbComparison, unitSizeSqf, embedded = false }: OIYearlyProjectionTableProps) => {
  const { t } = useLanguage();
  const lastProjection = projections[projections.length - 1];
  const longTermTotal = lastProjection?.cumulativeNetIncome || 0;
  const airbnbTotal = lastProjection?.airbnbCumulativeNetIncome || 0;
  const winner = airbnbTotal > longTermTotal ? 'airbnb' : 'long-term';
  const difference = Math.abs(airbnbTotal - longTermTotal);
  
  // When embedded, skip the outer container
  if (embedded) {
    return (
      <div>
        {/* Comparison Summary Header */}
        {showAirbnbComparison && (
          <div className="p-4 border-b border-theme-border grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-theme-text-highlight/10 rounded-lg border border-theme-text-highlight/30">
              <div className="text-xs text-theme-text-muted">{t('longTermTenYear')}</div>
              <div className="text-lg font-bold text-theme-text-highlight">{formatCurrency(longTermTotal, currency, rate)}</div>
            </div>
            <div className="text-center p-3 bg-theme-accent/10 rounded-lg border border-theme-accent/30">
              <div className="text-xs text-theme-text-muted">{t('difference')}</div>
              <div className={`text-lg font-bold ${winner === 'airbnb' ? 'text-theme-accent' : 'text-theme-text-highlight'}`}>
                +{formatCurrency(difference, currency, rate)}
              </div>
              <div className="text-xs text-theme-text-muted">
                {winner === 'airbnb' ? t('shortTermPremium') : t('longTermAdvantage')}
              </div>
            </div>
            <div className="text-center p-3 bg-theme-accent/10 rounded-lg border border-theme-accent/30">
              <div className="text-xs text-theme-text-muted">{t('shortTermTenYear')}</div>
              <div className="text-lg font-bold text-theme-accent">{formatCurrency(airbnbTotal, currency, rate)}</div>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-theme-bg-alt">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-theme-text-muted tracking-wider whitespace-nowrap">{t('yearColumn')}</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-theme-text-muted tracking-wider whitespace-nowrap">{t('phase')}</th>
                <th className="px-2 py-3 text-right text-xs font-medium text-theme-text-muted tracking-wider whitespace-nowrap">{t('value')}</th>
                <th className="px-2 py-3 text-right text-xs font-medium text-theme-positive tracking-wider whitespace-nowrap">{t('netRent')}</th>
                {showAirbnbComparison && (
                  <th className="px-2 py-3 text-right text-xs font-medium text-theme-accent tracking-wider whitespace-nowrap">{t('shortTermNet')}</th>
                )}
                <th className="px-2 py-3 text-center text-xs font-medium text-theme-text-muted tracking-wider whitespace-nowrap">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {projections.map((proj) => (
                <tr 
                  key={proj.year}
                  className={
                    proj.isBreakEven || proj.isAirbnbBreakEven
                      ? 'bg-theme-positive/10' 
                      : proj.isHandover 
                        ? 'bg-theme-accent/10' 
                        : ''
                  }
                >
                  <td className="px-2 py-2 sm:py-3 text-xs sm:text-sm text-theme-text font-medium whitespace-nowrap">
                    {proj.calendarYear}
                    {proj.monthsActive && proj.monthsActive < 12 && (
                      <span className="text-[10px] text-theme-text-muted ml-1">({proj.monthsActive} {t('mo')})</span>
                    )}
                  </td>
                  <td className="px-2 py-2 sm:py-3 text-center">
                    <span className={`text-xs sm:text-sm ${getPhaseColor(proj.phase)}`} title={proj.phase}>
                      {getPhaseLabel(proj.phase)}
                    </span>
                  </td>
                  <td className="px-2 py-2 sm:py-3 text-right whitespace-nowrap">
                    <div className="text-xs sm:text-sm text-theme-text font-mono">
                      {formatCurrency(proj.propertyValue, currency, rate)}
                    </div>
                    {unitSizeSqf && unitSizeSqf > 0 && (
                      <div className="text-[10px] text-theme-text-muted font-mono">
                        {formatCurrency(proj.propertyValue / unitSizeSqf, currency, rate)}/sqft
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 sm:py-3 text-xs sm:text-sm text-right font-mono whitespace-nowrap">
                    {proj.netIncome ? (
                      <span className="text-theme-positive">
                        {formatCurrency(proj.netIncome, currency, rate)}
                      </span>
                    ) : (
                      <span className="text-theme-text-muted">—</span>
                    )}
                  </td>
                  {showAirbnbComparison && (
                    <td className="px-2 py-2 sm:py-3 text-xs sm:text-sm text-right font-mono whitespace-nowrap">
                      {proj.airbnbNetIncome ? (
                        <span className="text-theme-accent">
                          {formatCurrency(proj.airbnbNetIncome, currency, rate)}
                        </span>
                      ) : (
                        <span className="text-theme-text-muted">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-2 py-3 text-sm text-center">
                    {proj.isConstruction && !proj.isHandover && (
                      <span className="px-2 py-1 rounded-full text-xs bg-theme-accent/20 text-theme-accent inline-flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {t('build')}
                      </span>
                    )}
                    {proj.isHandover && (
                      <span className="px-2 py-1 rounded-full text-xs bg-theme-accent/20 text-theme-accent inline-flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        {t('handover')}
                      </span>
                    )}
                    {proj.isBreakEven && (
                      <span className="px-2 py-1 rounded-full text-xs bg-theme-positive/20 text-theme-positive inline-flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {t('breakEven')}
                      </span>
                    )}
                    {!proj.isConstruction && !proj.isHandover && !proj.isBreakEven && (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        proj.phase === 'growth' 
                          ? 'bg-theme-positive/20 text-theme-positive' 
                          : 'bg-theme-text-highlight/20 text-theme-text-highlight'
                      }`}>
                        {proj.phase === 'growth' ? t('growth') : t('mature')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Summary Footer */}
        <div className="p-4 border-t border-theme-border bg-theme-bg-alt">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
            <span className="text-theme-text-muted">{t('totalNetIncome7Y')}</span>
              <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                <span className="flex items-center gap-1"><span className="text-theme-accent">🏗️</span> {t('build')}</span>
                <span className="flex items-center gap-1"><span className="text-theme-positive">📈</span> {t('growth')}</span>
                <span className="flex items-center gap-1"><span className="text-theme-text-highlight">🏠</span> {t('mature')}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-theme-text-highlight font-mono font-bold">
                {t('ltLabel')} {formatCurrency(longTermTotal, currency, rate)}
              </span>
              {showAirbnbComparison && (
                <span className="text-theme-accent font-mono font-bold">
                  {t('stLabel')} {formatCurrency(airbnbTotal, currency, rate)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-theme-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-theme-text flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-theme-accent" />
            {t('sevenYearHoldSimulation')}
          </h3>
          <p className="text-xs text-theme-text-muted mt-1">{t('propertyValueRentalYield')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-theme-text-highlight/20 text-theme-text-highlight">
            🏢 {t('longTerm')}
          </span>
          {showAirbnbComparison && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-theme-accent/20 text-theme-accent">
              🏠 {t('shortTerm')}
            </span>
          )}
        </div>
      </div>
      
      {/* Comparison Summary Header */}
      {showAirbnbComparison && (
        <div className="p-4 border-b border-theme-border grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-theme-text-highlight/10 rounded-lg border border-theme-text-highlight/30">
            <div className="text-xs text-theme-text-muted">{t('longTermTenYear')}</div>
            <div className="text-lg font-bold text-theme-text-highlight">{formatCurrency(longTermTotal, currency, rate)}</div>
          </div>
          <div className="text-center p-3 bg-theme-accent/10 rounded-lg border border-theme-accent/30">
            <div className="text-xs text-theme-text-muted">{t('difference')}</div>
            <div className={`text-lg font-bold ${winner === 'airbnb' ? 'text-theme-accent' : 'text-theme-text-highlight'}`}>
              +{formatCurrency(difference, currency, rate)}
            </div>
            <div className="text-xs text-theme-text-muted">
              {winner === 'airbnb' ? t('shortTermPremium') : t('longTermAdvantage')}
            </div>
          </div>
          <div className="text-center p-3 bg-theme-accent/10 rounded-lg border border-theme-accent/30">
            <div className="text-xs text-theme-text-muted">{t('shortTermTenYear')}</div>
            <div className="text-lg font-bold text-theme-accent">{formatCurrency(airbnbTotal, currency, rate)}</div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-theme-bg-alt">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-theme-text-muted tracking-wider whitespace-nowrap">{t('yearColumn')}</th>
              <th className="px-2 py-3 text-center text-xs font-medium text-theme-text-muted tracking-wider whitespace-nowrap">{t('phase')}</th>
              <th className="px-2 py-3 text-right text-xs font-medium text-theme-text-muted tracking-wider whitespace-nowrap">{t('value')}</th>
              <th className="px-2 py-3 text-right text-xs font-medium text-theme-positive tracking-wider whitespace-nowrap">{t('netRent')}</th>
              {showAirbnbComparison && (
                <th className="px-2 py-3 text-right text-xs font-medium text-theme-accent tracking-wider whitespace-nowrap">{t('shortTermNet')}</th>
              )}
              <th className="px-2 py-3 text-center text-xs font-medium text-theme-text-muted tracking-wider whitespace-nowrap">{t('status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {projections.map((proj) => (
              <tr 
                key={proj.year}
                className={
                  proj.isBreakEven || proj.isAirbnbBreakEven
                    ? 'bg-theme-positive/10' 
                    : proj.isHandover 
                      ? 'bg-theme-accent/10' 
                      : ''
                }
              >
                <td className="px-2 py-2 sm:py-3 text-xs sm:text-sm text-theme-text font-medium whitespace-nowrap">
                  {proj.calendarYear}
                  {proj.monthsActive && proj.monthsActive < 12 && (
                    <span className="text-[10px] text-theme-text-muted ml-1">({proj.monthsActive} {t('mo')})</span>
                  )}
                </td>
                <td className="px-2 py-2 sm:py-3 text-center">
                  <span className={`text-xs sm:text-sm ${getPhaseColor(proj.phase)}`} title={proj.phase}>
                    {getPhaseLabel(proj.phase)}
                  </span>
                </td>
                <td className="px-2 py-2 sm:py-3 text-right whitespace-nowrap">
                  <div className="text-xs sm:text-sm text-theme-text font-mono">
                    {formatCurrency(proj.propertyValue, currency, rate)}
                  </div>
                  {unitSizeSqf && unitSizeSqf > 0 && (
                    <div className="text-[10px] text-theme-text-muted font-mono">
                      {formatCurrency(proj.propertyValue / unitSizeSqf, currency, rate)}/sqft
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 sm:py-3 text-xs sm:text-sm text-right font-mono whitespace-nowrap">
                  {proj.netIncome ? (
                    <span className="text-theme-positive">
                      {formatCurrency(proj.netIncome, currency, rate)}
                    </span>
                  ) : (
                    <span className="text-theme-text-muted">—</span>
                  )}
                </td>
                {showAirbnbComparison && (
                  <td className="px-2 py-2 sm:py-3 text-xs sm:text-sm text-right font-mono whitespace-nowrap">
                    {proj.airbnbNetIncome ? (
                      <span className="text-theme-accent">
                        {formatCurrency(proj.airbnbNetIncome, currency, rate)}
                      </span>
                    ) : (
                      <span className="text-theme-text-muted">—</span>
                    )}
                  </td>
                )}
                <td className="px-2 py-3 text-sm text-center">
                  {proj.isConstruction && !proj.isHandover && (
                    <span className="px-2 py-1 rounded-full text-xs bg-theme-accent/20 text-theme-accent inline-flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {t('build')}
                    </span>
                  )}
                  {proj.isHandover && (
                    <span className="px-2 py-1 rounded-full text-xs bg-theme-accent/20 text-theme-accent inline-flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      {t('handover')}
                    </span>
                  )}
                  {proj.isBreakEven && (
                    <span className="px-2 py-1 rounded-full text-xs bg-theme-positive/20 text-theme-positive inline-flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {t('breakEven')}
                    </span>
                  )}
                  {!proj.isConstruction && !proj.isHandover && !proj.isBreakEven && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      proj.phase === 'growth' 
                        ? 'bg-theme-positive/20 text-theme-positive' 
                        : 'bg-theme-text-highlight/20 text-theme-text-highlight'
                    }`}>
                      {proj.phase === 'growth' ? t('growth') : t('mature')}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary Footer */}
      <div className="p-4 border-t border-theme-border bg-theme-bg-alt">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-theme-text-muted">{t('totalNetIncome7Y')}</span>
            <div className="flex items-center gap-2 text-xs text-theme-text-muted">
              <span className="flex items-center gap-1"><span className="text-theme-accent">🏗️</span> {t('build')}</span>
              <span className="flex items-center gap-1"><span className="text-theme-positive">📈</span> {t('growth')}</span>
              <span className="flex items-center gap-1"><span className="text-theme-text-highlight">🏠</span> {t('mature')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-theme-text-highlight font-mono font-bold">
              {t('ltLabel')} {formatCurrency(longTermTotal, currency, rate)}
            </span>
            {showAirbnbComparison && (
              <span className="text-theme-accent font-mono font-bold">
                {t('stLabel')} {formatCurrency(airbnbTotal, currency, rate)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
