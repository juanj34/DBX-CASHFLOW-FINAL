import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Scale, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComparisonMetrics } from './types';
import { Currency, formatCurrency as formatCurrencyUtil } from '@/components/roi/currencyUtils';

interface HeadToHeadTableProps {
  metrics: ComparisonMetrics;
  offPlanLabel?: string;
  showAirbnb?: boolean;
  currency?: Currency;
  rate?: number;
  language?: 'en' | 'es';
}

interface MetricRow {
  category: string;
  metric: string;
  offPlanValue: string | number;
  secondaryValue: string | number;
  winner: 'off-plan' | 'secondary' | 'tie';
  highlight?: boolean;
}

export const HeadToHeadTable = ({ 
  metrics, 
  offPlanLabel = 'Off-Plan',
  showAirbnb = true,
  currency = 'AED',
  rate = 1,
  language = 'es',
}: HeadToHeadTableProps) => {
  const t = language === 'es' ? {
    detailedComparison: 'Comparación Detallada',
    secondary: 'Secundaria',
    winner: 'Ganador',
    metric: 'Métrica',
    capital: 'Capital',
    wealth: 'Riqueza',
    returnLabel: 'Retorno',
    airbnb: 'Airbnb',
    totalCapital: 'Capital Total',
    totalCapitalTooltip: 'Compromiso total de la propiedad incluyendo precio de compra y costos de cierre',
    totalCapitalHandover: 'Capital Total (Handover)',
    wealthYear5LT: 'Riqueza Año 5',
    wealthYear10LT: 'Riqueza Año 10',
    annualizedROE: 'ROE Anualizado (10Y)',
    wealthYear10ST: 'Riqueza Año 10 (Airbnb)',
  } : {
    detailedComparison: 'Detailed Comparison',
    secondary: 'Secondary',
    winner: 'Winner',
    metric: 'Metric',
    capital: 'Capital',
    wealth: 'Wealth',
    returnLabel: 'Return',
    airbnb: 'Airbnb',
    totalCapital: 'Total Capital',
    totalCapitalTooltip: 'Full property commitment including purchase price and closing costs',
    totalCapitalHandover: 'Total Capital (Handover)',
    wealthYear5LT: 'Wealth Year 5',
    wealthYear10LT: 'Wealth Year 10',
    annualizedROE: 'Annualized ROE (10Y)',
    wealthYear10ST: 'Wealth Year 10 (Airbnb)',
  };

  const categoryLabels: Record<string, string> = {
    CAPITAL: t.capital,
    RIQUEZA: t.wealth,
    RETORNO: t.returnLabel,
    AIRBNB: t.airbnb,
  };

  // Format currency with dual display
  const formatMoney = (value: number): string => {
    const aed = Math.abs(value) >= 1000000 
      ? `AED ${(value / 1000000).toFixed(2)}M`
      : `AED ${(value / 1000).toFixed(0)}K`;
    
    if (currency === 'AED') return aed;
    
    const converted = value * rate;
    const secondary = Math.abs(converted) >= 1000000 
      ? `${(converted / 1000000).toFixed(2)}M`
      : `${(converted / 1000).toFixed(0)}K`;
    
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
    return `${aed} (${symbol}${secondary})`;
  };

  const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

  const rows: MetricRow[] = [
    // Capital
    {
      category: 'CAPITAL',
      metric: t.totalCapital,
      offPlanValue: formatMoney(metrics.offPlanCapitalDay1),
      secondaryValue: formatMoney(metrics.secondaryCapitalDay1),
      winner: metrics.offPlanCapitalDay1 < metrics.secondaryCapitalDay1 ? 'off-plan' : 'secondary',
      highlight: true,
    },
    {
      category: 'CAPITAL',
      metric: t.totalCapitalHandover,
      offPlanValue: formatMoney(metrics.offPlanTotalCapitalAtHandover),
      secondaryValue: formatMoney(metrics.secondaryCapitalDay1),
      winner: metrics.offPlanTotalCapitalAtHandover < metrics.secondaryCapitalDay1 ? 'off-plan' : 'secondary',
    },
    // Wealth (no more DSCR/Mortgage rows)
    {
      category: 'RIQUEZA',
      metric: t.wealthYear5LT,
      offPlanValue: formatMoney(metrics.offPlanWealthYear5),
      secondaryValue: formatMoney(metrics.secondaryWealthYear5LT),
      winner: metrics.offPlanWealthYear5 > metrics.secondaryWealthYear5LT ? 'off-plan' : 'secondary',
    },
    {
      category: 'RIQUEZA',
      metric: t.wealthYear10LT,
      offPlanValue: formatMoney(metrics.offPlanWealthYear10),
      secondaryValue: formatMoney(metrics.secondaryWealthYear10LT),
      winner: metrics.offPlanWealthYear10 > metrics.secondaryWealthYear10LT ? 'off-plan' : 'secondary',
      highlight: true,
    },
    // ROE
    {
      category: 'RETORNO',
      metric: t.annualizedROE,
      offPlanValue: formatPercent(metrics.offPlanROEYear10),
      secondaryValue: formatPercent(metrics.secondaryROEYear10LT),
      winner: metrics.offPlanROEYear10 > metrics.secondaryROEYear10LT ? 'off-plan' : 'secondary',
      highlight: true,
    },
  ];

  // Add Airbnb rows if enabled
  if (showAirbnb) {
    rows.push(
      {
        category: 'AIRBNB',
        metric: t.wealthYear10ST,
        offPlanValue: formatMoney(metrics.offPlanWealthYear10),
        secondaryValue: formatMoney(metrics.secondaryWealthYear10ST),
        winner: metrics.offPlanWealthYear10 > metrics.secondaryWealthYear10ST ? 'off-plan' : 'secondary',
      }
    );
  }

  // Count wins
  const offPlanWins = rows.filter(r => r.winner === 'off-plan').length;
  const secondaryWins = rows.filter(r => r.winner === 'secondary').length;

  // Group by category
  const categories = [...new Set(rows.map(r => r.category))];

  return (
    <Card className="bg-theme-card border-theme-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-theme-text flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-theme-accent" />
            {t.detailedComparison}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500 text-xs">
              <Trophy className="w-3 h-3 mr-1" />
              Off-Plan: {offPlanWins}
            </Badge>
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500 text-xs">
              <Trophy className="w-3 h-3 mr-1" />
              {t.secondary}: {secondaryWins}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-theme-border hover:bg-transparent">
                <TableHead className="text-theme-text-muted text-xs w-[180px]">{t.metric}</TableHead>
                <TableHead className="text-theme-text-muted text-xs text-center">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500">
                    {offPlanLabel}
                  </Badge>
                </TableHead>
                <TableHead className="text-theme-text-muted text-xs text-center">
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500">
                    {t.secondary}
                  </Badge>
                </TableHead>
                <TableHead className="text-theme-text-muted text-xs text-center w-[100px]">{t.winner}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(category => (
                <>
                  {/* Category Header */}
                  <TableRow key={`cat-${category}`} className="border-theme-border bg-theme-bg/30">
                    <TableCell colSpan={4} className="py-2">
                      <span className="text-xs font-medium text-theme-text-muted uppercase tracking-wider">
                        {categoryLabels[category] || category}
                      </span>
                    </TableCell>
                  </TableRow>
                  
                  {/* Category Rows */}
                  {rows.filter(r => r.category === category).map((row, idx) => (
                    <TableRow 
                      key={`${category}-${idx}`}
                      className={cn(
                        "border-theme-border",
                        row.highlight && "bg-theme-accent/5"
                      )}
                    >
                      <TableCell className="text-sm text-theme-text py-3">
                        {row.metric}
                      </TableCell>
                      <TableCell className={cn(
                        "text-sm text-center py-3 font-medium",
                        row.winner === 'off-plan' ? "text-emerald-500" : "text-theme-text"
                      )}>
                        {row.offPlanValue}
                      </TableCell>
                      <TableCell className={cn(
                        "text-sm text-center py-3 font-medium",
                        row.winner === 'secondary' ? "text-cyan-500" : "text-theme-text"
                      )}>
                        {row.secondaryValue}
                      </TableCell>
                      <TableCell className="text-center py-3">
                        {row.winner === 'off-plan' && (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500 text-[10px]">
                            🏆 OP
                          </Badge>
                        )}
                        {row.winner === 'secondary' && (
                          <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500 text-[10px]">
                            🏆 SEC
                          </Badge>
                        )}
                        {row.winner === 'tie' && (
                          <Badge variant="outline" className="text-theme-text-muted text-[10px]">
                            ≈
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
