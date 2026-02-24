import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Currency, formatCurrency } from "./currencyUtils";
import { ExitScenarioResult } from "./constructionProgress";
import { Info, TrendingUp, Wallet, Receipt, DollarSign, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="w-72 p-0 bg-theme-card border border-theme-border"
        >
          <div className="p-3 border-b border-theme-border">
            <div className="flex items-center gap-2 text-xs font-medium text-theme-text">
              <Info className="w-3.5 h-3.5 text-theme-accent" />
              {t('roeBreakdownTitle')}
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* Exit Value */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                <TrendingUp className="w-3 h-3" />
                {t('exitValueLabel')}
              </div>
              <span className="text-xs font-mono text-theme-text">
                {formatCurrency(scenario.exitPrice, currency, rate)}
              </span>
            </div>

            {/* Base Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                <DollarSign className="w-3 h-3" />
                {t('originalPriceLabel')}
              </div>
              <span className="text-xs font-mono text-theme-text-muted">
                -{formatCurrency(scenario.basePrice, currency, rate)}
              </span>
            </div>

            {/* Appreciation */}
            <div className="flex items-center justify-between border-t border-theme-border pt-2">
              <span className="text-xs text-theme-text-muted">= {t('appreciationLabel')}</span>
              <span className="text-xs font-mono text-theme-positive">
                +{formatCurrency(scenario.appreciation, currency, rate)} ({scenario.appreciationPercent.toFixed(1)}%)
              </span>
            </div>

            <div className="border-t border-theme-border pt-2 space-y-2">
              {/* Equity Deployed */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                  <Wallet className="w-3 h-3" />
                  {t('equityDeployedLabel')}
                </div>
                <span className="text-xs font-mono text-theme-text">
                  {formatCurrency(scenario.equityDeployed, currency, rate)} ({scenario.equityPercent.toFixed(0)}%)
                </span>
              </div>

              {/* Entry Costs */}
              {scenario.entryCosts > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                    <Receipt className="w-3 h-3" />
                    {t('entryCostsLabel')}
                  </div>
                  <span className="text-xs font-mono text-theme-negative">
                    +{formatCurrency(scenario.entryCosts, currency, rate)}
                  </span>
                </div>
              )}

              {/* Total Capital */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-muted">= {t('totalCapitalLabel')}</span>
                <span className="text-xs font-mono text-theme-text font-medium">
                  {formatCurrency(scenario.totalCapital, currency, rate)}
                </span>
              </div>
            </div>

            {/* Profit */}
            <div className="border-t border-theme-border pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-text-muted">
                  {scenario.entryCosts > 0 ? t('grossProfitLabel') : t('profitLabel')}
                </span>
                <span className={`text-xs font-mono ${scenario.trueProfit >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                  {scenario.trueProfit >= 0 ? '+' : ''}{formatCurrency(scenario.trueProfit, currency, rate)}
                </span>
              </div>

              {/* Exit Costs */}
              {scenario.exitCosts > 0 && (
                <>
                  {scenario.agentCommission > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-theme-text-muted">{t('agentCommissionLabel')}</span>
                      <span className="text-xs font-mono text-theme-negative">
                        -{formatCurrency(scenario.agentCommission, currency, rate)}
                      </span>
                    </div>
                  )}
                  {scenario.nocFee > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-theme-text-muted">{t('nocFeeLabel')}</span>
                      <span className="text-xs font-mono text-theme-negative">
                        -{formatCurrency(scenario.nocFee, currency, rate)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-theme-border/50 pt-1">
                    <span className="text-xs text-theme-text-muted font-medium">= {t('netProfitLabel')}</span>
                    <span className={`text-xs font-mono font-medium ${scenario.netProfit >= 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                      {scenario.netProfit >= 0 ? '+' : ''}{formatCurrency(scenario.netProfit, currency, rate)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* ROE Calculation */}
            <div className="bg-theme-bg rounded-lg p-2 border border-theme-border">
              <div className="flex items-center gap-1.5 text-xs mb-2">
                <span className="text-theme-text-muted">ROE =</span>
                <span className="text-theme-text font-mono">
                  {scenario.exitCosts > 0 ? t('netProfitLabel') : (scenario.entryCosts > 0 ? t('trueProfitLabel') : t('profitLabel'))} ÷ {t('totalCapitalLabel')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-theme-text-muted">=</span>
                <span className="text-theme-text font-mono">
                  {formatCurrency(scenario.exitCosts > 0 ? scenario.netProfit : scenario.trueProfit, currency, rate)}
                </span>
                <span className="text-theme-text-muted">÷</span>
                <span className="text-theme-text font-mono">
                  {formatCurrency(scenario.totalCapital, currency, rate)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-theme-border">
                <ArrowRight className="w-3 h-3 text-theme-accent" />
                <span className={`text-lg font-bold font-mono ${(scenario.exitCosts > 0 ? scenario.netROE : scenario.trueROE) >= 0 ? 'text-theme-accent' : 'text-theme-negative'}`}>
                  {(scenario.exitCosts > 0 ? scenario.netROE : scenario.trueROE).toFixed(1)}%
                </span>
                <span className="text-xs text-theme-text-muted">
                  ({(scenario.exitCosts > 0 ? scenario.netAnnualizedROE : scenario.annualizedROE).toFixed(1)}% {t('annualizedLabel')})
                </span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
