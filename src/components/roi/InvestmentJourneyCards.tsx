import { Building, Key, Wallet, TrendingUp, Trophy, Zap, Info } from "lucide-react";
import { OIYearlyProjection } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InvestmentJourneyCardsProps {
  projections: OIYearlyProjection[];
  currency: Currency;
  rate: number;
  showAirbnbComparison: boolean;
  totalCapitalInvested: number;
  basePrice: number;
}

export const InvestmentJourneyCards = ({
  projections,
  currency,
  rate,
  showAirbnbComparison,
  totalCapitalInvested,
  basePrice,
}: InvestmentJourneyCardsProps) => {
  const { t } = useLanguage();
  
  // Find key milestones
  const handoverProjection = projections.find(p => p.isHandover);
  const lastProjection = projections[projections.length - 1];
  
  // First COMPLETE year of rent (the year AFTER handover, not the handover year which may be partial)
  const cashflowYears = projections.filter(p => !p.isConstruction);
  const firstCompleteRentYear = cashflowYears.length > 1 
    ? cashflowYears[1] // Second cashflow year is first complete year
    : cashflowYears[0]; // Fallback to first if only one
  
  // Calculate phase data
  const constructionYears = projections.filter(p => p.isConstruction);
  
  // Construction phase appreciation
  const constructionAppreciation = handoverProjection 
    ? ((handoverProjection.propertyValue - basePrice) / basePrice) * 100 
    : 0;
  
  // Appreciation breakdown for tooltip
  const appreciationPerYear = constructionYears.length > 0 
    ? constructionAppreciation / constructionYears.length 
    : 0;
  
  // Cashflow phase income - separate LT and ST totals
  const totalLTIncome = lastProjection?.cumulativeNetIncome || 0;
  const totalSTIncome = lastProjection?.airbnbCumulativeNetIncome || 0;
  
  // Only count complete years for averages (exclude handover year which may be partial)
  const completeRentYears = cashflowYears.slice(1); // Skip handover year
  const avgAnnualLT = completeRentYears.length > 0 
    ? completeRentYears.reduce((sum, p) => sum + (p.netIncome || 0), 0) / completeRentYears.length
    : 0;
  const avgAnnualST = completeRentYears.length > 0 && showAirbnbComparison
    ? completeRentYears.reduce((sum, p) => sum + (p.airbnbNetIncome || 0), 0) / completeRentYears.length
    : 0;

  // Final wealth
  const finalPropertyValue = lastProjection?.propertyValue || 0;
  const totalAppreciation = ((finalPropertyValue - basePrice) / basePrice) * 100;
  
  // Calculate actual total years (construction + rental period)
  const totalYears = projections.length;
  const rentalYears = cashflowYears.length;

  return (
    <div className="space-y-4">
      {/* Strategy Winner Banner - Only show if comparison enabled */}
      {showAirbnbComparison && (
        <div className="bg-gradient-to-r from-theme-positive/10 via-theme-accent/10 to-theme-positive/10 border border-theme-positive/30 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-theme-accent/20 rounded-xl">
                <Trophy className="w-6 h-6 text-theme-accent" />
              </div>
              <div>
                <p className="text-xs text-theme-text-muted uppercase tracking-wider">{t('strategyWinnerLabel')}</p>
                <p className="text-lg sm:text-xl font-bold text-theme-text">
                  {totalSTIncome > totalLTIncome ? t('shortTermRentalWinner') : t('longTermRentalWinner')} 🏆
                </p>
              </div>
            </div>
            
            <div className="text-center sm:text-right">
              <p className="text-2xl sm:text-3xl font-bold text-theme-accent font-mono">
                +{formatCurrency(Math.abs(totalSTIncome - totalLTIncome), currency, rate)}
              </p>
              <p className="text-xs text-theme-text-muted">
                {totalSTIncome > totalLTIncome
                  ? `+${(((totalSTIncome - totalLTIncome) / totalLTIncome) * 100).toFixed(0)}% ${t('moreThanLongTermOver10Years')}`
                  : t('stableIncomeWithLongTerm')
                }
              </p>
            </div>
          </div>
          
          {/* Visual comparison bar */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-theme-positive w-20 shrink-0">{t('longTerm')}</span>
            <div className="flex-1 h-2 bg-theme-border rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-theme-positive transition-all duration-500"
                style={{ width: `${Math.min((totalLTIncome / Math.max(totalLTIncome, totalSTIncome)) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-theme-positive w-24 text-right">{formatCurrency(totalLTIncome, currency, rate)}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-theme-accent w-20 shrink-0">{t('shortTerm')}</span>
            <div className="flex-1 h-2 bg-theme-border rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-theme-accent transition-all duration-500"
                style={{ width: `${Math.min((totalSTIncome / Math.max(totalLTIncome, totalSTIncome)) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-theme-accent w-24 text-right">{formatCurrency(totalSTIncome, currency, rate)}</span>
          </div>
        </div>
      )}

      {/* Investment Journey Timeline */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-theme-accent" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-theme-text-muted">
            {t('investmentOverviewLabel')}
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-theme-text-muted cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-theme-card border-theme-border text-theme-text">
                <p className="text-xs">
                  {constructionYears.length} {t('constructionTooltipPrefix')} {rentalYears} {t('constructionTooltipSuffix')}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Visual Timeline */}
        <div className="relative mb-6 hidden sm:block">
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-theme-border" />
          <div className="flex justify-between relative">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-theme-accent flex items-center justify-center z-10">
                <span className="text-xs font-bold text-theme-bg">1</span>
              </div>
              <span className="text-[10px] text-theme-text-muted mt-1">{projections[0]?.calendarYear || t('todayLabel')}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-theme-accent/50 flex items-center justify-center z-10 border-2 border-theme-accent">
                <Key className="w-3 h-3 text-theme-accent" />
              </div>
              <span className="text-[10px] text-theme-accent mt-1">{handoverProjection?.calendarYear || t('handover')}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-theme-positive flex items-center justify-center z-10">
                <TrendingUp className="w-3 h-3 text-theme-text" />
              </div>
              <span className="text-[10px] text-theme-text-muted mt-1">{lastProjection?.calendarYear || t('targetLabel')}</span>
            </div>
          </div>
        </div>

        {/* 3 Milestone Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: The Build (Construction Phase) */}
          <div className="bg-theme-bg border border-theme-accent/30 rounded-xl p-4 hover:border-theme-accent/60 transition-colors cursor-default group">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-theme-accent/20 rounded-lg">
                <Building className="w-4 h-4 text-theme-accent" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-theme-text">{t('theBuildCardTitle')}</h4>
                <p className="text-[10px] text-theme-text-muted">{t('yearsRange')} 1-{constructionYears.length || 3}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-theme-text-muted">{t('cashDeployedLabel')}</span>
                <span className="text-sm font-mono text-theme-negative">
                  -{formatCurrency(totalCapitalInvested, currency, rate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-theme-text-muted flex items-center gap-1 cursor-help underline decoration-dotted decoration-theme-border">
                        {t('capitalGrowthLabel')}
                        <Info className="w-3 h-3 text-theme-text-muted" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-theme-card border-theme-border text-theme-text">
                      <div className="space-y-1">
                        <p className="text-xs font-medium">{t('constructionPhaseAppreciationLabel')}</p>
                        <p className="text-[10px] text-theme-text-muted">
                          {t('offPlanAppreciationExplanation')}
                        </p>
                        <div className="mt-2 pt-2 border-t border-theme-border">
                          <p className="text-[10px] text-theme-text-muted">
                            ~{appreciationPerYear.toFixed(1)}% {t('perYearLabel')} × {constructionYears.length} {t('years')} = <span className="text-theme-positive font-medium">+{constructionAppreciation.toFixed(0)}%</span>
                          </p>
                          <p className="text-[10px] text-theme-text-muted mt-1">
                            {t('valueAtHandoverColonLabel')} {formatCurrency(handoverProjection?.propertyValue || basePrice, currency, rate)}
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-sm font-mono text-theme-positive">
                  +{constructionAppreciation.toFixed(0)}%
                </span>
              </div>
            </div>
            
            <div className="mt-3 pt-2 border-t border-theme-border">
              <p className="text-[10px] text-theme-text-muted">
                {t('buildPhaseExplanation')}
              </p>
            </div>
          </div>

          {/* Card 2: The Handover */}
          <div className="bg-theme-bg border border-theme-accent/30 rounded-xl p-4 hover:border-theme-accent/60 transition-colors cursor-default">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-theme-accent/20 rounded-lg">
                <Key className="w-4 h-4 text-theme-accent" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-theme-text">{t('theHandoverCardTitle')}</h4>
                <p className="text-[10px] text-theme-text-muted">{t('yearColumn')} {constructionYears.length || 3}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-theme-text-muted">{t('propertyValue')}</span>
                <span className="text-sm font-mono text-theme-accent">
                  {formatCurrency(handoverProjection?.propertyValue || basePrice, currency, rate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-theme-text-muted flex items-center gap-1 cursor-help underline decoration-dotted decoration-theme-border">
                        {t('firstFullYearRentLabel')}
                        <Info className="w-3 h-3 text-theme-text-muted" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-theme-card border-theme-border text-theme-text">
                      <p className="text-xs">
                        {t('annualRentalIncomeFor')} {firstCompleteRentYear?.calendarYear || t('year1RentalIncomeLabel')} {t('firstYearRentExplanationSuffix')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-sm font-mono text-theme-positive">
                  {formatCurrency(firstCompleteRentYear?.netIncome || 0, currency, rate)}
                </span>
              </div>
            </div>
            
            <div className="mt-3 pt-2 border-t border-theme-border">
              <p className="text-[10px] text-theme-text-muted">
                {t('handoverPhaseExplanation')}
              </p>
            </div>
          </div>

          {/* Card 3: The Cashflow Engine */}
          <div className="bg-theme-bg border border-theme-positive/30 rounded-xl p-4 hover:border-theme-positive/60 transition-colors cursor-default">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-theme-positive/20 rounded-lg">
                <Wallet className="w-4 h-4 text-theme-positive" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-theme-text">{t('theCashflowEngineTitle')}</h4>
                <p className="text-[10px] text-theme-text-muted">{rentalYears} {t('yearsOfRental')}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {/* Show separate LT/ST total profits instead of averages */}
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-theme-text-muted flex items-center gap-1 cursor-help underline decoration-dotted decoration-theme-border">
                        {t('totalProfitLtLabel')}
                        <Info className="w-3 h-3 text-theme-text-muted" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-theme-card border-theme-border text-theme-text">
                      <p className="text-xs">
                        {t('cumulativeNetRentalIncomePrefix')} {rentalYears} {t('yearsWithStrategyAvg')} Long-Term {t('strategyAvgSuffix')} {formatCurrency(avgAnnualLT, currency, rate)}{t('avgPerYearLabel')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-sm font-mono text-theme-positive">
                  +{formatCurrency(totalLTIncome, currency, rate)}
                </span>
              </div>
              {showAirbnbComparison && (
                <div className="flex justify-between items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-theme-text-muted flex items-center gap-1 cursor-help underline decoration-dotted decoration-theme-border">
                          {t('totalProfitStLabel')}
                          <Info className="w-3 h-3 text-theme-text-muted" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-theme-card border-theme-border text-theme-text">
                        <p className="text-xs">
                          {t('cumulativeNetRentalIncomePrefix')} {rentalYears} {t('yearsWithStrategyAvg')} Short-Term {t('strategyAvgSuffix')} {formatCurrency(avgAnnualST, currency, rate)}{t('avgPerYearLabel')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-sm font-mono text-theme-accent">
                    +{formatCurrency(totalSTIncome, currency, rate)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Winner indicator when comparison enabled */}
            {showAirbnbComparison && (
              <div className="mt-3 pt-2 border-t border-theme-border">
                <p className="text-[10px] text-theme-text-muted">
                  {totalSTIncome > totalLTIncome
                    ? `🏆 ${t('stWinsByLabel')} +${formatCurrency(totalSTIncome - totalLTIncome, currency, rate)}`
                    : `🏆 ${t('ltWinsByLabel')} +${formatCurrency(totalLTIncome - totalSTIncome, currency, rate)}`
                  }
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};