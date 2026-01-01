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
        <div className="bg-gradient-to-r from-green-500/10 via-[#CCFF00]/10 to-green-500/10 border border-green-500/30 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#CCFF00]/20 rounded-xl">
                <Trophy className="w-6 h-6 text-[#CCFF00]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Strategy Winner</p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {totalSTIncome > totalLTIncome ? 'Short-Term Rental' : 'Long-Term Rental'} 🏆
                </p>
              </div>
            </div>
            
            <div className="text-center sm:text-right">
              <p className="text-2xl sm:text-3xl font-bold text-[#CCFF00] font-mono">
                +{formatCurrency(Math.abs(totalSTIncome - totalLTIncome), currency, rate)}
              </p>
              <p className="text-xs text-gray-400">
                {totalSTIncome > totalLTIncome 
                  ? `+${(((totalSTIncome - totalLTIncome) / totalLTIncome) * 100).toFixed(0)}% more than Long-Term over 10 years`
                  : `more stable income with Long-Term strategy`
                }
              </p>
            </div>
          </div>
          
          {/* Visual comparison bar */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-cyan-400 w-20 shrink-0">Long-Term</span>
            <div className="flex-1 h-2 bg-[#2a3142] rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-cyan-400 transition-all duration-500"
                style={{ width: `${Math.min((totalLTIncome / Math.max(totalLTIncome, totalSTIncome)) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-cyan-400 w-24 text-right">{formatCurrency(totalLTIncome, currency, rate)}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-orange-400 w-20 shrink-0">Short-Term</span>
            <div className="flex-1 h-2 bg-[#2a3142] rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-orange-400 transition-all duration-500"
                style={{ width: `${Math.min((totalSTIncome / Math.max(totalLTIncome, totalSTIncome)) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-orange-400 w-24 text-right">{formatCurrency(totalSTIncome, currency, rate)}</span>
          </div>
        </div>
      )}

      {/* Investment Journey Timeline */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-[#CCFF00]" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-theme-text-muted">
            Investment Overview
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-[#1a1f2e] border-[#2a3142] text-white">
                <p className="text-xs">
                  {constructionYears.length} years construction + {rentalYears} years of rental income within a 10-year window
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Visual Timeline */}
        <div className="relative mb-6 hidden sm:block">
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-[#2a3142]" />
          <div className="flex justify-between relative">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-[#CCFF00] flex items-center justify-center z-10">
                <span className="text-xs font-bold text-black">1</span>
              </div>
              <span className="text-[10px] text-gray-500 mt-1">{projections[0]?.calendarYear || 'Today'}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-[#CCFF00]/50 flex items-center justify-center z-10 border-2 border-[#CCFF00]">
                <Key className="w-3 h-3 text-[#CCFF00]" />
              </div>
              <span className="text-[10px] text-[#CCFF00] mt-1">{handoverProjection?.calendarYear || 'Handover'}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center z-10">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] text-gray-500 mt-1">{lastProjection?.calendarYear || 'Target'}</span>
            </div>
          </div>
        </div>

        {/* 3 Milestone Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: The Build (Construction Phase) */}
          <div className="bg-[#0d1117] border border-amber-500/30 rounded-xl p-4 hover:border-amber-500/60 transition-colors cursor-default group">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-amber-500/20 rounded-lg">
                <Building className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">The Build</h4>
                <p className="text-[10px] text-gray-500">Years 1-{constructionYears.length || 3}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Cash Deployed</span>
                <span className="text-sm font-mono text-red-400">
                  -{formatCurrency(totalCapitalInvested, currency, rate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-gray-400 flex items-center gap-1 cursor-help underline decoration-dotted decoration-gray-600">
                        Capital Growth
                        <Info className="w-3 h-3 text-gray-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-[#1a1f2e] border-[#2a3142] text-white">
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Construction Phase Appreciation</p>
                        <p className="text-[10px] text-gray-400">
                          Off-plan properties typically appreciate during construction as the project progresses and risk decreases.
                        </p>
                        <div className="mt-2 pt-2 border-t border-[#2a3142]">
                          <p className="text-[10px] text-gray-400">
                            ~{appreciationPerYear.toFixed(1)}% per year × {constructionYears.length} years = <span className="text-green-400 font-medium">+{constructionAppreciation.toFixed(0)}%</span>
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            Value at handover: {formatCurrency(handoverProjection?.propertyValue || basePrice, currency, rate)}
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-sm font-mono text-green-400">
                  +{constructionAppreciation.toFixed(0)}%
                </span>
              </div>
            </div>
            
            <div className="mt-3 pt-2 border-t border-[#2a3142]">
              <p className="text-[10px] text-gray-500">
                Property appreciates while under construction. No rental income yet.
              </p>
            </div>
          </div>

          {/* Card 2: The Handover */}
          <div className="bg-[#0d1117] border border-[#CCFF00]/30 rounded-xl p-4 hover:border-[#CCFF00]/60 transition-colors cursor-default">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-[#CCFF00]/20 rounded-lg">
                <Key className="w-4 h-4 text-[#CCFF00]" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">The Handover</h4>
                <p className="text-[10px] text-gray-500">Year {constructionYears.length || 3}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Property Value</span>
                <span className="text-sm font-mono text-[#CCFF00]">
                  {formatCurrency(handoverProjection?.propertyValue || basePrice, currency, rate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-gray-400 flex items-center gap-1 cursor-help underline decoration-dotted decoration-gray-600">
                        First Full Year Rent
                        <Info className="w-3 h-3 text-gray-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-[#1a1f2e] border-[#2a3142] text-white">
                      <p className="text-xs">
                        Annual rental income for {firstCompleteRentYear?.calendarYear || 'first full year'} (first complete 12-month period after handover).
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-sm font-mono text-cyan-400">
                  {formatCurrency(firstCompleteRentYear?.netIncome || 0, currency, rate)}
                </span>
              </div>
            </div>
            
            <div className="mt-3 pt-2 border-t border-[#2a3142]">
              <p className="text-[10px] text-gray-500">
                Keys collected! Start earning rental income.
              </p>
            </div>
          </div>

          {/* Card 3: The Cashflow Engine */}
          <div className="bg-[#0d1117] border border-green-500/30 rounded-xl p-4 hover:border-green-500/60 transition-colors cursor-default">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-500/20 rounded-lg">
                <Wallet className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">The Cashflow Engine</h4>
                <p className="text-[10px] text-gray-500">{rentalYears} years of rental</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {/* Show separate LT/ST total profits instead of averages */}
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-gray-400 flex items-center gap-1 cursor-help underline decoration-dotted decoration-gray-600">
                        Total Profit (LT)
                        <Info className="w-3 h-3 text-gray-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-[#1a1f2e] border-[#2a3142] text-white">
                      <p className="text-xs">
                        Cumulative net rental income over {rentalYears} years with Long-Term strategy. Avg: {formatCurrency(avgAnnualLT, currency, rate)}/year
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-sm font-mono text-cyan-400">
                  +{formatCurrency(totalLTIncome, currency, rate)}
                </span>
              </div>
              {showAirbnbComparison && (
                <div className="flex justify-between items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-gray-400 flex items-center gap-1 cursor-help underline decoration-dotted decoration-gray-600">
                          Total Profit (ST)
                          <Info className="w-3 h-3 text-gray-500" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-[#1a1f2e] border-[#2a3142] text-white">
                        <p className="text-xs">
                          Cumulative net rental income over {rentalYears} years with Short-Term strategy. Avg: {formatCurrency(avgAnnualST, currency, rate)}/year
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-sm font-mono text-orange-400">
                    +{formatCurrency(totalSTIncome, currency, rate)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Winner indicator when comparison enabled */}
            {showAirbnbComparison && (
              <div className="mt-3 pt-2 border-t border-[#2a3142]">
                <p className="text-[10px] text-gray-500">
                  {totalSTIncome > totalLTIncome 
                    ? `🏆 ST wins by +${formatCurrency(totalSTIncome - totalLTIncome, currency, rate)}`
                    : `🏆 LT wins by +${formatCurrency(totalLTIncome - totalSTIncome, currency, rate)}`
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Final Wealth Summary */}
        <div className="mt-4 p-4 bg-gradient-to-r from-[#CCFF00]/10 to-green-500/10 rounded-xl border border-[#CCFF00]/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Total Net Wealth Created</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-[#1a1f2e] border-[#2a3142] text-white">
                      <div className="space-y-2">
                        <p className="text-xs font-medium">Wealth created over 10 years:</p>
                        <div className="text-[10px] space-y-1 text-gray-400">
                          <p>Final Property Value: {formatCurrency(finalPropertyValue, currency, rate)}</p>
                          <p>+ Total Rental Income: {formatCurrency(showAirbnbComparison ? Math.max(totalLTIncome, totalSTIncome) : totalLTIncome, currency, rate)}</p>
                          <p>- Capital Invested: {formatCurrency(totalCapitalInvested, currency, rate)}</p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-gray-500">Over 10 years ({constructionYears.length}yr build + {rentalYears}yr rental)</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-3xl sm:text-4xl font-bold text-[#CCFF00] font-mono">
                {formatCurrency(
                  finalPropertyValue + (showAirbnbComparison ? Math.max(totalLTIncome, totalSTIncome) : totalLTIncome) - totalCapitalInvested,
                  currency,
                  rate
                )}
              </p>
              <p className="text-xs text-green-400">
                +{totalAppreciation.toFixed(0)}% property appreciation over 10 years
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};