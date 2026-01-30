import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Scale, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComparisonMetrics } from './types';

interface HeadToHeadTableProps {
  metrics: ComparisonMetrics;
  offPlanLabel?: string;
  showAirbnb?: boolean;
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
}: HeadToHeadTableProps) => {
  const formatCurrency = (value: number): string => {
    if (Math.abs(value) >= 1000000) {
      return `AED ${(value / 1000000).toFixed(2)}M`;
    }
    return `AED ${(value / 1000).toFixed(0)}K`;
  };

  const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

  const rows: MetricRow[] = [
    // Capital
    {
      category: 'CAPITAL',
      metric: 'Capital Día 1',
      offPlanValue: formatCurrency(metrics.offPlanCapitalDay1),
      secondaryValue: formatCurrency(metrics.secondaryCapitalDay1),
      winner: metrics.offPlanCapitalDay1 < metrics.secondaryCapitalDay1 ? 'off-plan' : 'secondary',
      highlight: true,
    },
    {
      category: 'CAPITAL',
      metric: 'Capital Total (Handover)',
      offPlanValue: formatCurrency(metrics.offPlanTotalCapitalAtHandover),
      secondaryValue: formatCurrency(metrics.secondaryCapitalDay1),
      winner: metrics.offPlanTotalCapitalAtHandover < metrics.secondaryCapitalDay1 ? 'off-plan' : 'secondary',
    },
    {
      category: 'CAPITAL',
      metric: 'Meses Sin Ingreso',
      offPlanValue: `${metrics.offPlanMonthsNoIncome} meses`,
      secondaryValue: '0 meses',
      winner: 'secondary',
    },
    // Cashflow
    {
      category: 'CASHFLOW',
      metric: 'Cashflow Año 1 (LT)',
      offPlanValue: metrics.offPlanCashflowYear1 === 0 ? 'En construcción' : formatCurrency(metrics.offPlanCashflowYear1),
      secondaryValue: formatCurrency(metrics.secondaryCashflowYear1LT),
      winner: metrics.offPlanCashflowYear1 > metrics.secondaryCashflowYear1LT ? 'off-plan' : 'secondary',
    },
    // Mortgage Coverage
    {
      category: 'HIPOTECA',
      metric: 'DSCR Largo Plazo',
      offPlanValue: metrics.offPlanDSCRLT === Infinity ? '∞' : formatPercent(metrics.offPlanDSCRLT * 100),
      secondaryValue: metrics.secondaryDSCRLT === Infinity ? '∞' : formatPercent(metrics.secondaryDSCRLT * 100),
      winner: metrics.offPlanDSCRLT > metrics.secondaryDSCRLT ? 'off-plan' : 
              metrics.offPlanDSCRLT < metrics.secondaryDSCRLT ? 'secondary' : 'tie',
    },
    // Wealth
    {
      category: 'RIQUEZA',
      metric: 'Riqueza Año 5 (LT)',
      offPlanValue: formatCurrency(metrics.offPlanWealthYear5),
      secondaryValue: formatCurrency(metrics.secondaryWealthYear5LT),
      winner: metrics.offPlanWealthYear5 > metrics.secondaryWealthYear5LT ? 'off-plan' : 'secondary',
    },
    {
      category: 'RIQUEZA',
      metric: 'Riqueza Año 10 (LT)',
      offPlanValue: formatCurrency(metrics.offPlanWealthYear10),
      secondaryValue: formatCurrency(metrics.secondaryWealthYear10LT),
      winner: metrics.offPlanWealthYear10 > metrics.secondaryWealthYear10LT ? 'off-plan' : 'secondary',
      highlight: true,
    },
    // ROE
    {
      category: 'RETORNO',
      metric: 'ROE Anualizado (10Y)',
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
        metric: 'Cashflow Año 1 (ST)',
        offPlanValue: metrics.offPlanCashflowYear1 === 0 ? 'En construcción' : formatCurrency(metrics.offPlanCashflowYear1 * 1.3), // Estimate
        secondaryValue: formatCurrency(metrics.secondaryCashflowYear1ST),
        winner: 'secondary',
      },
      {
        category: 'AIRBNB',
        metric: 'DSCR Airbnb',
        offPlanValue: metrics.offPlanDSCRST === Infinity ? '∞' : formatPercent(metrics.offPlanDSCRST * 100),
        secondaryValue: metrics.secondaryDSCRST === Infinity ? '∞' : formatPercent(metrics.secondaryDSCRST * 100),
        winner: metrics.offPlanDSCRST > metrics.secondaryDSCRST ? 'off-plan' : 'secondary',
      },
      {
        category: 'AIRBNB',
        metric: 'Riqueza Año 10 (ST)',
        offPlanValue: formatCurrency(metrics.offPlanWealthYear10),
        secondaryValue: formatCurrency(metrics.secondaryWealthYear10ST),
        winner: metrics.offPlanWealthYear10 > metrics.secondaryWealthYear10ST ? 'off-plan' : 'secondary',
      }
    );
  }

  // Crossover
  if (metrics.crossoverYearLT) {
    rows.push({
      category: 'ESTRATEGIA',
      metric: 'Punto de Cruce',
      offPlanValue: `Año ${metrics.crossoverYearLT}`,
      secondaryValue: '—',
      winner: 'off-plan',
    });
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
            Comparación Detallada
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500 text-xs">
              <Trophy className="w-3 h-3 mr-1" />
              Off-Plan: {offPlanWins}
            </Badge>
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500 text-xs">
              <Trophy className="w-3 h-3 mr-1" />
              Secundaria: {secondaryWins}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-theme-border hover:bg-transparent">
                <TableHead className="text-theme-text-muted text-xs w-[180px]">Métrica</TableHead>
                <TableHead className="text-theme-text-muted text-xs text-center">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500">
                    {offPlanLabel}
                  </Badge>
                </TableHead>
                <TableHead className="text-theme-text-muted text-xs text-center">
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500">
                    Secundaria
                  </Badge>
                </TableHead>
                <TableHead className="text-theme-text-muted text-xs text-center w-[100px]">Ganador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(category => (
                <>
                  {/* Category Header */}
                  <TableRow key={`cat-${category}`} className="border-theme-border bg-theme-bg/30">
                    <TableCell colSpan={4} className="py-2">
                      <span className="text-xs font-medium text-theme-text-muted uppercase tracking-wider">
                        {category}
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
