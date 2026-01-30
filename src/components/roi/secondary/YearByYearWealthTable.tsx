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

interface YearByYearWealthTableProps {
  offPlanProjections: OIYearlyProjection[];
  secondaryProjections: SecondaryYearlyProjection[];
  offPlanCapitalInvested: number;
  handoverYearIndex: number;
  rentalMode: 'long-term' | 'airbnb';
}

const formatCompact = (value: number): string => {
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
}: YearByYearWealthTableProps) => {
  const isAirbnb = rentalMode === 'airbnb';

  const tableData = useMemo(() => {
    return offPlanProjections.slice(0, 10).map((opProj, index) => {
      const secProj = secondaryProjections[index];
      const year = index + 1;
      
      // Calculate off-plan cumulative rent (only after handover)
      let opCumulativeRent = 0;
      for (let i = 0; i <= index; i++) {
        if (i >= handoverYearIndex - 1 && offPlanProjections[i]?.netIncome) {
          opCumulativeRent += offPlanProjections[i].netIncome;
        }
      }
      
      const opWealth = (opProj?.propertyValue || 0) + opCumulativeRent - offPlanCapitalInvested;
      const secWealth = isAirbnb ? secProj?.totalWealthST : secProj?.totalWealthLT;
      const delta = opWealth - (secWealth || 0);
      
      const isBeforeHandover = year < handoverYearIndex;
      
      return {
        year,
        calendarYear: opProj?.calendarYear || new Date().getFullYear() + year,
        offPlanValue: opProj?.propertyValue || 0,
        offPlanRent: isBeforeHandover ? 0 : (opProj?.netIncome || 0),
        offPlanWealth: opWealth,
        secondaryValue: secProj?.propertyValue || 0,
        secondaryRent: isAirbnb ? (secProj?.netRentST || 0) : (secProj?.netRentLT || 0),
        secondaryWealth: secWealth || 0,
        delta,
        isHandover: year === handoverYearIndex,
        isBeforeHandover,
      };
    });
  }, [offPlanProjections, secondaryProjections, offPlanCapitalInvested, handoverYearIndex, isAirbnb]);

  return (
    <TooltipProvider>
      <Card className="p-4 bg-theme-card border-theme-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-theme-text">Progresión de Riqueza Año a Año</h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-theme-text-muted" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[250px]">
                <p className="text-xs">
                  Riqueza = Valor de Propiedad + Rentas Acumuladas - Capital Invertido. 
                  Muestra cómo cada inversión construye riqueza a lo largo del tiempo.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Badge variant="outline" className="text-xs">
            {isAirbnb ? 'Airbnb' : 'Renta Larga'}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-theme-border hover:bg-transparent">
                <TableHead className="text-theme-text-muted text-xs w-16">Año</TableHead>
                <TableHead className="text-theme-text-muted text-xs text-right">
                  <span className="text-emerald-500">Off-Plan</span> Riqueza
                </TableHead>
                <TableHead className="text-theme-text-muted text-xs text-right">
                  <span className="text-cyan-500">Secundaria</span> Riqueza
                </TableHead>
                <TableHead className="text-theme-text-muted text-xs text-right w-28">Delta</TableHead>
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
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-medium ${
                          row.delta > 0 ? 'text-emerald-500' : 'text-theme-text'
                        }`}>
                          {formatCompact(row.offPlanWealth)}
                        </span>
                        {row.isBeforeHandover && (
                          <span className="text-[10px] text-theme-text-muted">En construcción</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-medium ${
                        row.delta < 0 ? 'text-cyan-500' : 'text-theme-text'
                      }`}>
                        {formatCompact(row.secondaryWealth)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {deltaIcon}
                        <span className={`text-sm font-medium ${
                          row.delta > 0 ? 'text-emerald-500' : row.delta < 0 ? 'text-red-500' : 'text-theme-text-muted'
                        }`}>
                          {row.delta >= 0 ? '+' : ''}{formatCompact(row.delta)}
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
            <span>Off-Plan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-cyan-500/20 border border-cyan-500" />
            <span>Secundaria</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px] px-1 py-0 border-0">🔑</Badge>
            <span>Handover</span>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};
