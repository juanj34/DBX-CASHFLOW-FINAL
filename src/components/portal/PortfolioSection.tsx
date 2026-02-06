import { Building, TrendingUp, PiggyBank, Wallet, Home, Percent, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AcquiredProperty, PortfolioMetrics } from "@/hooks/usePortfolio";
import { usePortfolioProjections } from "@/hooks/usePortfolioProjections";
import { format } from "date-fns";
import { Currency } from "@/components/roi/currencyUtils";
import { PortfolioGoalCard } from "@/components/portfolio/PortfolioGoalCard";
import { PortfolioGrowthChart } from "@/components/portfolio/PortfolioGrowthChart";

// Extended property with rental yield data from quote
export interface PropertyWithProjections extends AcquiredProperty {
  projectedMonthlyRent?: number;
  rentalYieldPercent?: number;
}

interface PortfolioSectionProps {
  properties: PropertyWithProjections[];
  metrics: PortfolioMetrics;
  currency: Currency;
  rate: number;
  language?: 'en' | 'es';
  onViewAnalysis?: (quoteId: string) => void;
  defaultRentalYield?: number; // From broker profile, fallback for properties without quotes
}

const formatCurrency = (value: number, currency: Currency, rate: number) => {
  const converted = value * rate;
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(converted);
};

export const PortfolioSection = ({ properties, metrics, currency, rate, language = 'en', onViewAnalysis, defaultRentalYield = 7 }: PortfolioSectionProps) => {
  const appreciationPositive = metrics.totalAppreciation >= 0;
  const cashflowPositive = metrics.netMonthlyCashflow >= 0;

  // Get projections for goal card and chart
  const { 
    projections, 
    yearsToDouble, 
    targetWealth, 
    currentProgress,
    projectedValueAtDouble,
    projectedRentAtDouble,
  } = usePortfolioProjections(properties, metrics);

  return (
    <div className="space-y-6">
      {/* Hero Row: Portfolio Value + Goal Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Portfolio Value */}
        <Card className="bg-gradient-to-br from-theme-accent/20 to-theme-accent/5 border-theme-accent/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-theme-text-muted mb-1">Total Portfolio Value</p>
              <p className="text-4xl font-bold text-theme-text">
                {formatCurrency(metrics.totalCurrentValue, currency, rate)}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge className={`${appreciationPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'} border-0`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {appreciationPositive ? '+' : ''}{formatCurrency(metrics.totalAppreciation, currency, rate)} ({metrics.appreciationPercent.toFixed(1)}%)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Years to Double Goal Card */}
        <PortfolioGoalCard
          yearsToDouble={yearsToDouble}
          targetWealth={targetWealth}
          currentProgress={currentProgress}
          totalAppreciation={metrics.totalAppreciation}
          appreciationPercent={metrics.appreciationPercent}
          projectedRentAtDouble={projectedRentAtDouble}
          projectedValueAtDouble={projectedValueAtDouble}
          currency={currency}
          rate={rate}
        />
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-theme-card border-theme-border">
          <CardContent className="p-4 text-center">
            <Building className="w-5 h-5 text-theme-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-theme-text">{metrics.totalProperties}</p>
            <p className="text-xs text-theme-text-muted">Properties</p>
          </CardContent>
        </Card>

        <Card className="bg-theme-card border-theme-border">
          <CardContent className="p-4 text-center">
            <PiggyBank className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-purple-400">{formatCurrency(metrics.totalEquity, currency, rate)}</p>
            <p className="text-xs text-theme-text-muted">Total Equity</p>
          </CardContent>
        </Card>

        <Card className="bg-theme-card border-theme-border">
          <CardContent className="p-4 text-center">
            <Home className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-blue-400">{formatCurrency(metrics.totalMonthlyRent, currency, rate)}</p>
            <p className="text-xs text-theme-text-muted">Monthly Rent</p>
          </CardContent>
        </Card>

        <Card className="bg-theme-card border-theme-border">
          <CardContent className="p-4 text-center">
            <Wallet className={`w-5 h-5 mx-auto mb-2 ${cashflowPositive ? 'text-green-400' : 'text-red-400'}`} />
            <p className={`text-lg font-bold ${cashflowPositive ? 'text-green-400' : 'text-red-400'}`}>
              {cashflowPositive ? '+' : ''}{formatCurrency(metrics.netMonthlyCashflow, currency, rate)}
            </p>
            <p className="text-xs text-theme-text-muted">Net Cashflow/mo</p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Growth Chart */}
      {projections.length > 0 && (
        <PortfolioGrowthChart
          projections={projections}
          currency={currency}
          rate={rate}
          targetWealth={targetWealth}
        />
      )}

      {/* Properties List */}
      <div>
        <h3 className="text-lg font-semibold text-theme-text mb-4">Your Properties</h3>
        <div className="space-y-3">
          {properties.map((property) => {
            const currentValue = property.current_value || property.purchase_price;
            const appreciation = currentValue - property.purchase_price;
            const appreciationPercent = (appreciation / property.purchase_price) * 100;
            const isPositive = appreciation >= 0;

            return (
              <Card key={property.id} className="bg-theme-card border-theme-border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-theme-accent/20 flex items-center justify-center shrink-0">
                      <Building className="w-6 h-6 text-theme-accent" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-theme-text">{property.project_name}</h4>
                          <p className="text-xs text-theme-text-muted">
                            {property.developer && `${property.developer} • `}
                            {property.unit && `Unit ${property.unit} • `}
                            {property.unit_type}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-theme-bg text-theme-text-muted text-xs shrink-0">
                          {format(new Date(property.purchase_date), "MMM yyyy")}
                        </Badge>
                      </div>

                      {/* Value & Appreciation Row */}
                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <div>
                          <p className="text-xs text-theme-text-muted">Current Value</p>
                          <p className="text-lg font-semibold text-theme-text">
                            {formatCurrency(currentValue, currency, rate)}
                          </p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          <div className="flex items-center gap-1">
                            <TrendingUp className={`w-3 h-3 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
                            <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              {isPositive ? '+' : ''}{formatCurrency(appreciation, currency, rate)}
                            </span>
                            <span className={`text-xs ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
                              ({isPositive ? '+' : ''}{appreciationPercent.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badges - Auto-calculated projections */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {(() => {
                          // Calculate projected rent from quote's rental yield or use default
                          const projectedRent = property.projectedMonthlyRent || 
                            (property.purchase_price * (defaultRentalYield / 100) / 12);
                          const hasActualRent = property.monthly_rent && property.monthly_rent > 0;
                          
                          return (
                            <>
                              {/* Always show projected/estimated rent */}
                              <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">
                                <Home className="w-3 h-3 mr-1" />
                                Est. Rent: ~{formatCurrency(projectedRent, currency, rate)}/mo
                              </Badge>
                              {/* Show actual rent if manually entered (override) */}
                              {hasActualRent && (
                                <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                                  Actual: {formatCurrency(property.monthly_rent!, currency, rate)}/mo
                                </Badge>
                              )}
                            </>
                          );
                        })()}
                        {property.has_mortgage && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">
                            <Percent className="w-3 h-3 mr-1" />
                            Mortgage: {formatCurrency(property.monthly_mortgage_payment || 0, currency, rate)}/mo
                          </Badge>
                        )}
                        {property.source_quote_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewAnalysis?.(property.source_quote_id!)}
                            className="ml-auto h-7 px-2 text-xs text-theme-accent hover:text-theme-accent/80 hover:bg-theme-accent/10"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Original Analysis
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
