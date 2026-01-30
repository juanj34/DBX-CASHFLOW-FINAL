import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SecondaryYearlyProjection } from './types';
import { OIYearlyProjection } from '@/components/roi/useOICalculations';
import { Currency, formatDualCurrencyCompact } from '@/components/roi/currencyUtils';

interface YearByYearWealthTableProps {
  offPlanProjections: OIYearlyProjection[];
  secondaryProjections: SecondaryYearlyProjection[];
  offPlanCapitalInvested: number;
  handoverYearIndex: number;
  rentalMode: 'long-term' | 'airbnb';
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
  offPlanBasePrice: number;      // Purchase price for Year 1 display
  secondaryPurchasePrice: number; // Purchase price for Year 1 display
}

const formatCompact = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '—';
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toFixed(0);
};

export const YearByYearWealthTable = ({
  offPlanProjections,
  secondaryProjections,
  offPlanCapitalInvested,
  handoverYearIndex,
  rentalMode,
  currency,
  rate,
  language,
  offPlanBasePrice,
  secondaryPurchasePrice,
}: YearByYearWealthTableProps) => {
  const isAirbnb = rentalMode === 'airbnb';

  const tableData = useMemo(() => {
    const data = [];
    
    // Years 1-10 (no Year 0)
    let opCumulativeRent = 0;
    let secCumulativeRent = 0;
    
    for (let index = 0; index < Math.min(offPlanProjections.length, 10); index++) {
      const opProj = offPlanProjections[index];
      const secProj = secondaryProjections[index];
      const year = index + 1;
      
      const isBeforeHandover = year < handoverYearIndex;
      
      // Get annual NET rent values (after service charges)
      const opAnnualRent = isBeforeHandover ? 0 : (opProj?.netIncome || 0);
      const secAnnualRent = isAirbnb ? (secProj?.netRentST || 0) : (secProj?.netRentLT || 0);
      
      // Accumulate rent
      opCumulativeRent += opAnnualRent;
      secCumulativeRent += secAnnualRent;
      
      // USE THE SAME VALUE for display AND wealth calculation
      // This ensures Value + Cumulative Rent = Wealth (consistent)
      const offPlanValue = opProj?.propertyValue || offPlanBasePrice;
      const secondaryValue = secProj?.propertyValue || secondaryPurchasePrice;
      
      // Wealth = Property Value + Cumulative Net Rent (now uses displayed value)
      const opWealth = offPlanValue + opCumulativeRent;
      const secWealth = secondaryValue + secCumulativeRent;
      const delta = opWealth - secWealth;
      
      data.push({
        year,
        calendarYear: opProj?.calendarYear || new Date().getFullYear() + year,
        offPlanValue,
        offPlanRent: opAnnualRent,
        offPlanCumulativeRent: opCumulativeRent,
        offPlanWealth: opWealth,
        secondaryValue,
        secondaryRent: secAnnualRent,
        secondaryCumulativeRent: secCumulativeRent,
        secondaryWealth: secWealth,
        delta,
        isHandover: year === handoverYearIndex,
        isBeforeHandover,
      });
    }
    
    return data;
  }, [offPlanProjections, secondaryProjections, handoverYearIndex, isAirbnb, offPlanBasePrice, secondaryPurchasePrice]);

  const formatValue = (value: number): string => {
    const dual = formatDualCurrencyCompact(value, currency, rate);
    if (dual.secondary) {
      return `${dual.primary} (${dual.secondary})`;
    }
    return dual.primary;
  };

  const formatSmallValue = (value: number): string => {
    return `AED ${formatCompact(value)}`;
  };

  const t = language === 'es' ? {
    title: 'Progresión de Riqueza Año a Año',
    tooltip: 'Riqueza = Valor de Propiedad + Rentas Netas Acumuladas (después de gastos de servicio). Muestra cómo cada inversión construye riqueza a lo largo del tiempo.',
    year: 'Año',
    value: 'Valor',
  rent: 'Renta Acum.',
  wealth: 'Riqueza',
    delta: 'Delta',
    longTerm: 'Renta Larga',
    airbnb: 'Airbnb',
    underConstruction: 'En construcción',
    handover: 'Handover',
    offPlan: 'Off-Plan',
    secondary: 'Secundaria',
    noRent: '—',
    cumulativeRent: 'Renta Acumulada',
    propertyValue: 'Valor Propiedad',
  } : {
    title: 'Year-by-Year Wealth Progression',
    tooltip: 'Wealth = Property Value + Cumulative Net Rent (after service charges). Shows how each investment builds wealth over time.',
    year: 'Year',
    value: 'Value',
  rent: 'Cumul. Rent',
  wealth: 'Wealth',
    delta: 'Delta',
    longTerm: 'Long-Term',
    airbnb: 'Airbnb',
    underConstruction: 'Under construction',
    handover: 'Handover',
    offPlan: 'Off-Plan',
    secondary: 'Secondary',
    noRent: '—',
    cumulativeRent: 'Cumulative Rent',
    propertyValue: 'Property Value',
  };

  return (
    <TooltipProvider>
      <Card className="p-4 bg-theme-card border-theme-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-theme-text">{t.title}</h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-theme-text-muted" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[250px]">
                <p className="text-xs">{t.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Badge variant="outline" className="text-xs">
            {isAirbnb ? t.airbnb : t.longTerm}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-theme-border hover:bg-transparent">
                <TableHead className="text-theme-text-muted text-xs w-12">{t.year}</TableHead>
                {/* Off-Plan Columns */}
                <TableHead className="text-theme-text-muted text-xs text-right" colSpan={3}>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-emerald-500">{t.offPlan}</span>
                  </div>
                </TableHead>
                {/* Secondary Columns */}
                <TableHead className="text-theme-text-muted text-xs text-right" colSpan={3}>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span className="text-cyan-500">{t.secondary}</span>
                  </div>
                </TableHead>
                <TableHead className="text-theme-text-muted text-xs text-right w-24">{t.delta}</TableHead>
              </TableRow>
              <TableRow className="border-theme-border hover:bg-transparent">
                <TableHead className="text-theme-text-muted text-[10px]"></TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-right">{t.value}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-right">{t.rent}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-right">{t.wealth}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-right">{t.value}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-right">{t.rent}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-right">{t.wealth}</TableHead>
                <TableHead className="text-theme-text-muted text-[10px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => {
                const deltaIcon = row.delta > 0
                  ? <TrendingUp className="w-3 h-3 text-emerald-500" />
                  : row.delta < 0 
                  ? <TrendingDown className="w-3 h-3 text-red-500" />
                  : <Minus className="w-3 h-3 text-theme-text-muted" />;

                return (
                  <TableRow 
                    key={row.year}
                    className={`border-theme-border ${
                      row.isHandover ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500' : ''
                    }`}
                  >
                    <TableCell className="font-medium text-theme-text text-sm">
                      <div className="flex items-center gap-2">
                        {row.year}
                        {row.isHandover && (
                          <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px] px-1.5 py-0 border-0">
                            🔑
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {/* Off-Plan Value */}
                    <TableCell className="text-right text-xs text-theme-text">
                      {formatSmallValue(row.offPlanValue)}
                    </TableCell>
                    {/* Off-Plan Cumulative Rent */}
                    <TableCell className="text-right text-xs">
                      {row.isBeforeHandover ? (
                        <span className="text-theme-text-muted">{t.noRent}</span>
                      ) : (
                        <span className="text-theme-text">{formatSmallValue(row.offPlanCumulativeRent)}</span>
                      )}
                    </TableCell>
                    {/* Off-Plan Wealth with hover tooltip */}
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={`text-sm font-medium cursor-help ${
                            row.delta > 0 ? 'text-emerald-500' : 'text-theme-text'
                          }`}>
                            {formatSmallValue(row.offPlanWealth)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="p-2">
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-theme-text-muted">{t.propertyValue}:</span>
                              <span className="font-mono">{formatSmallValue(row.offPlanValue)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-theme-text-muted">+ {t.cumulativeRent}:</span>
                              <span className="font-mono">{formatSmallValue(row.offPlanCumulativeRent)}</span>
                            </div>
                            <div className="border-t border-theme-border pt-1 flex justify-between gap-4 font-semibold">
                              <span>= {t.wealth}:</span>
                              <span className="font-mono">{formatSmallValue(row.offPlanWealth)}</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    {/* Secondary Value */}
                    <TableCell className="text-right text-xs text-theme-text">
                      {formatSmallValue(row.secondaryValue)}
                    </TableCell>
                    {/* Secondary Cumulative Rent */}
                    <TableCell className="text-right text-xs text-theme-text">
                      {formatSmallValue(row.secondaryCumulativeRent)}
                    </TableCell>
                    {/* Secondary Wealth with hover tooltip */}
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={`text-sm font-medium cursor-help ${
                            row.delta < 0 ? 'text-cyan-500' : 'text-theme-text'
                          }`}>
                            {formatSmallValue(row.secondaryWealth)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="p-2">
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-theme-text-muted">{t.propertyValue}:</span>
                              <span className="font-mono">{formatSmallValue(row.secondaryValue)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-theme-text-muted">+ {t.cumulativeRent}:</span>
                              <span className="font-mono">{formatSmallValue(row.secondaryCumulativeRent)}</span>
                            </div>
                            <div className="border-t border-theme-border pt-1 flex justify-between gap-4 font-semibold">
                              <span>= {t.wealth}:</span>
                              <span className="font-mono">{formatSmallValue(row.secondaryWealth)}</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    {/* Delta */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {deltaIcon}
                        <span className={`text-sm font-medium ${
                          row.delta > 0 ? 'text-emerald-500' : row.delta < 0 ? 'text-red-500' : 'text-theme-text-muted'
                        }`}>
                          {row.delta >= 0 ? '+' : '-'}AED {formatCompact(Math.abs(row.delta))}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-theme-border text-xs text-theme-text-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500" />
            <span>{t.offPlan}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-cyan-500/20 border border-cyan-500" />
            <span>{t.secondary}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px] px-1 py-0 border-0">🔑</Badge>
            <span>{t.handover}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-theme-text-muted">{t.noRent}</span>
            <span>= {t.underConstruction}</span>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};
