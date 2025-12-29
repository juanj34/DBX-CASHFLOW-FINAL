import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Currency, formatCurrency } from "./currencyUtils";
import { ExitScenarioResult } from "./constructionProgress";
import { Info, TrendingUp, Wallet, Receipt, DollarSign, ArrowRight } from "lucide-react";

interface ROEBreakdownTooltipProps {
  scenario: ExitScenarioResult;
  currency: Currency;
  rate?: number;
  children: React.ReactNode;
}

export const ROEBreakdownTooltip = ({ 
  scenario, 
  currency, 
  rate = 1,
  children 
}: ROEBreakdownTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="w-72 p-0 bg-[#1a1f2e] border border-[#2a3142]"
        >
          <div className="p-3 border-b border-[#2a3142]">
            <div className="flex items-center gap-2 text-xs font-medium text-white">
              <Info className="w-3.5 h-3.5 text-[#CCFF00]" />
              ROE Calculation Breakdown
            </div>
          </div>
          
          <div className="p-3 space-y-3">
            {/* Exit Value */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <TrendingUp className="w-3 h-3" />
                Exit Value
              </div>
              <span className="text-xs font-mono text-white">
                {formatCurrency(scenario.exitPrice, currency, rate)}
              </span>
            </div>

            {/* Base Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <DollarSign className="w-3 h-3" />
                Original Price
              </div>
              <span className="text-xs font-mono text-gray-400">
                -{formatCurrency(scenario.basePrice, currency, rate)}
              </span>
            </div>

            {/* Appreciation */}
            <div className="flex items-center justify-between border-t border-[#2a3142] pt-2">
              <span className="text-xs text-gray-400">= Appreciation</span>
              <span className="text-xs font-mono text-green-400">
                +{formatCurrency(scenario.appreciation, currency, rate)} ({scenario.appreciationPercent.toFixed(1)}%)
              </span>
            </div>

            <div className="border-t border-[#2a3142] pt-2 space-y-2">
              {/* Equity Deployed */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Wallet className="w-3 h-3" />
                  Equity Deployed
                </div>
                <span className="text-xs font-mono text-white">
                  {formatCurrency(scenario.equityDeployed, currency, rate)} ({scenario.equityPercent.toFixed(0)}%)
                </span>
              </div>

              {/* Entry Costs */}
              {scenario.entryCosts > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Receipt className="w-3 h-3" />
                    Entry Costs
                  </div>
                  <span className="text-xs font-mono text-red-400">
                    +{formatCurrency(scenario.entryCosts, currency, rate)}
                  </span>
                </div>
              )}

              {/* Total Capital */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">= Total Capital</span>
                <span className="text-xs font-mono text-white font-medium">
                  {formatCurrency(scenario.totalCapital, currency, rate)}
                </span>
              </div>
            </div>

            {/* Profit */}
            <div className="border-t border-[#2a3142] pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {scenario.entryCosts > 0 ? 'True Profit' : 'Profit'}
                </span>
                <span className={`text-xs font-mono ${scenario.trueProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {scenario.trueProfit >= 0 ? '+' : ''}{formatCurrency(scenario.trueProfit, currency, rate)}
                </span>
              </div>
            </div>

            {/* ROE Calculation */}
            <div className="bg-[#0d1117] rounded-lg p-2 border border-[#2a3142]">
              <div className="flex items-center gap-1.5 text-xs mb-2">
                <span className="text-gray-400">ROE =</span>
                <span className="text-white font-mono">
                  {scenario.entryCosts > 0 ? 'True Profit' : 'Profit'} ÷ Total Capital
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-400">=</span>
                <span className="text-white font-mono">
                  {formatCurrency(scenario.trueProfit, currency, rate)}
                </span>
                <span className="text-gray-400">÷</span>
                <span className="text-white font-mono">
                  {formatCurrency(scenario.totalCapital, currency, rate)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#2a3142]">
                <ArrowRight className="w-3 h-3 text-[#CCFF00]" />
                <span className={`text-lg font-bold font-mono ${scenario.trueROE >= 0 ? 'text-[#CCFF00]' : 'text-red-400'}`}>
                  {scenario.trueROE.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">
                  ({scenario.annualizedROE.toFixed(1)}% annualized)
                </span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};