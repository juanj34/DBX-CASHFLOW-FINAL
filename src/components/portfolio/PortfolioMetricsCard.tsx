import { TrendingUp, TrendingDown, Building, DollarSign, Home, Percent, PiggyBank, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioMetrics } from "@/hooks/usePortfolio";

interface PortfolioMetricsCardProps {
  metrics: PortfolioMetrics;
  currency?: string;
}

const formatCurrency = (value: number, currency = "AED") => {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

export const PortfolioMetricsCard = ({ metrics, currency = "AED" }: PortfolioMetricsCardProps) => {
  const appreciationPositive = metrics.totalAppreciation >= 0;
  const cashflowPositive = metrics.netMonthlyCashflow >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Properties */}
      <Card className="bg-theme-card border-theme-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-theme-accent/20 flex items-center justify-center">
              <Building className="w-5 h-5 text-theme-accent" />
            </div>
            <div>
              <p className="text-xs text-theme-text-muted">Properties</p>
              <p className="text-xl font-bold text-theme-text">{metrics.totalProperties}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Value */}
      <Card className="bg-theme-card border-theme-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-theme-text-muted">Portfolio Value</p>
              <p className="text-xl font-bold text-theme-text">{formatCurrency(metrics.totalCurrentValue, currency)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Appreciation */}
      <Card className="bg-theme-card border-theme-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${appreciationPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {appreciationPositive ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <p className="text-xs text-theme-text-muted">Appreciation</p>
              <p className={`text-xl font-bold ${appreciationPositive ? 'text-green-400' : 'text-red-400'}`}>
                {appreciationPositive ? '+' : ''}{formatCurrency(metrics.totalAppreciation, currency)}
              </p>
              <p className={`text-xs ${appreciationPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
                {appreciationPositive ? '+' : ''}{metrics.appreciationPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Equity */}
      <Card className="bg-theme-card border-theme-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-theme-text-muted">Total Equity</p>
              <p className="text-xl font-bold text-purple-400">{formatCurrency(metrics.totalEquity, currency)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Rent */}
      <Card className="bg-theme-card border-theme-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Home className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-theme-text-muted">Monthly Rent</p>
              <p className="text-xl font-bold text-blue-400">{formatCurrency(metrics.totalMonthlyRent, currency)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mortgage Payments */}
      <Card className="bg-theme-card border-theme-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Percent className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-theme-text-muted">Mortgage/mo</p>
              <p className="text-xl font-bold text-amber-400">{formatCurrency(metrics.monthlyMortgagePayments, currency)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Cashflow */}
      <Card className="bg-theme-card border-theme-border col-span-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cashflowPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Wallet className={`w-5 h-5 ${cashflowPositive ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div>
              <p className="text-xs text-theme-text-muted">Net Monthly Cashflow</p>
              <p className={`text-xl font-bold ${cashflowPositive ? 'text-green-400' : 'text-red-400'}`}>
                {cashflowPositive ? '+' : ''}{formatCurrency(metrics.netMonthlyCashflow, currency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
