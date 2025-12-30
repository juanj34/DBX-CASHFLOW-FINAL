import { Building, Key, Wallet, TrendingUp, Trophy, Zap } from "lucide-react";
import { OIYearlyProjection } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const firstRentYear = projections.find(p => !p.isConstruction && p.netIncome > 0);
  
  // Calculate phase data
  const constructionYears = projections.filter(p => p.isConstruction);
  const cashflowYears = projections.filter(p => !p.isConstruction);
  
  // Construction phase appreciation
  const constructionAppreciation = handoverProjection 
    ? ((handoverProjection.propertyValue - basePrice) / basePrice) * 100 
    : 0;
  
  // Cashflow phase income
  const totalLTIncome = lastProjection?.cumulativeNetIncome || 0;
  const totalSTIncome = lastProjection?.airbnbCumulativeNetIncome || 0;
  const avgAnnualLT = cashflowYears.length > 0 
    ? cashflowYears.reduce((sum, p) => sum + (p.netIncome || 0), 0) / cashflowYears.filter(p => p.netIncome > 0).length
    : 0;
  const avgAnnualST = cashflowYears.length > 0 && showAirbnbComparison
    ? cashflowYears.reduce((sum, p) => sum + (p.airbnbNetIncome || 0), 0) / cashflowYears.filter(p => p.airbnbNetIncome > 0).length
    : 0;

  // Final wealth
  const finalPropertyValue = lastProjection?.propertyValue || 0;
  const totalAppreciation = ((finalPropertyValue - basePrice) / basePrice) * 100;

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

      {/* 10-Year Journey Timeline */}
      <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-[#CCFF00]" />
          <h3 className="font-semibold text-white">The 10-Year Journey</h3>
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
          <div className="bg-[#0d1117] border border-amber-500/30 rounded-xl p-4">
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
                <span className="text-xs text-gray-400">Capital Growth</span>
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
          <div className="bg-[#0d1117] border border-[#CCFF00]/30 rounded-xl p-4">
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
                <span className="text-xs text-gray-400">First Year Rent</span>
                <span className="text-sm font-mono text-cyan-400">
                  {formatCurrency(firstRentYear?.netIncome || 0, currency, rate)}
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
          <div className="bg-[#0d1117] border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-500/20 rounded-lg">
                <Wallet className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">The Cashflow Engine</h4>
                <p className="text-[10px] text-gray-500">Years {(constructionYears.length || 3) + 1}-10</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Avg. Annual (LT)</span>
                <span className="text-sm font-mono text-cyan-400">
                  {formatCurrency(avgAnnualLT, currency, rate)}
                </span>
              </div>
              {showAirbnbComparison && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Avg. Annual (ST)</span>
                  <span className="text-sm font-mono text-orange-400">
                    {formatCurrency(avgAnnualST, currency, rate)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-3 pt-2 border-t border-[#2a3142]">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Total Profit</span>
                <span className="text-sm font-bold font-mono text-green-400">
                  +{formatCurrency(showAirbnbComparison ? Math.max(totalLTIncome, totalSTIncome) : totalLTIncome, currency, rate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Final Wealth Summary */}
        <div className="mt-4 p-4 bg-gradient-to-r from-[#CCFF00]/10 to-green-500/10 rounded-xl border border-[#CCFF00]/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total Net Wealth Created</p>
              <p className="text-sm text-gray-500">(Property Value + Reinvested Rental Income)</p>
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
                +{totalAppreciation.toFixed(0)}% property appreciation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};