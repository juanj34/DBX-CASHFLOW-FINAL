import { Target, TrendingUp, Home, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Currency } from "@/components/roi/currencyUtils";

interface PortfolioGoalCardProps {
  yearsToDouble: number;
  targetWealth: number;
  currentProgress: number;
  totalAppreciation: number;
  appreciationPercent: number;
  projectedRentAtDouble: number;
  projectedValueAtDouble: number;
  currency: Currency;
  rate: number;
}

const formatCurrency = (value: number, currency: Currency, rate: number) => {
  const converted = value * rate;
  if (converted >= 1000000) {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency,
      maximumFractionDigits: 1,
      notation: "compact",
    }).format(converted);
  }
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(converted);
};

export const PortfolioGoalCard = ({
  yearsToDouble,
  targetWealth,
  currentProgress,
  totalAppreciation,
  appreciationPercent,
  projectedRentAtDouble,
  projectedValueAtDouble,
  currency,
  rate,
}: PortfolioGoalCardProps) => {
  // Progress toward doubling (max 100%)
  const progressPercent = Math.min(100, (currentProgress + 100) / 2);
  
  return (
    <Card className="bg-gradient-to-br from-theme-card to-theme-card/80 border-theme-accent/30">
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-theme-accent/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-theme-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-theme-text">Investment Goal</h3>
            <p className="text-xs text-theme-text-muted">Double your investment</p>
          </div>
        </div>

        {/* Main Metric */}
        <div className="text-center py-4">
          <p className="text-xs text-theme-text-muted uppercase tracking-wider mb-1">
            Double Your Investment In
          </p>
          <p className="text-4xl font-bold text-theme-accent">
            {yearsToDouble > 0 ? yearsToDouble.toFixed(1) : '—'}
            <span className="text-lg font-normal text-theme-text-muted ml-1">years</span>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-theme-text-muted mb-1">
            <span>Progress</span>
            <span>{currentProgress.toFixed(0)}% gained</span>
          </div>
          <Progress 
            value={progressPercent} 
            className="h-2 bg-theme-bg"
          />
          <div className="flex justify-between text-xs text-theme-text-muted mt-1">
            <span>Start</span>
            <span>2× Target: {formatCurrency(targetWealth, currency, rate)}</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 pt-2 border-t border-theme-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-theme-text-muted">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              Appreciation
            </span>
            <span className="text-green-400 font-medium">
              +{formatCurrency(totalAppreciation, currency, rate)} ({appreciationPercent.toFixed(1)}%)
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-theme-text-muted">
              <Home className="w-3.5 h-3.5 text-blue-400" />
              Projected Rent
            </span>
            <span className="text-blue-400 font-medium">
              +{formatCurrency(projectedRentAtDouble, currency, rate)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm pt-2 border-t border-theme-border/30">
            <span className="flex items-center gap-2 text-theme-text">
              <Wallet className="w-3.5 h-3.5 text-theme-accent" />
              Projected Wealth
            </span>
            <span className="text-theme-accent font-semibold">
              {formatCurrency(projectedValueAtDouble + projectedRentAtDouble, currency, rate)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
