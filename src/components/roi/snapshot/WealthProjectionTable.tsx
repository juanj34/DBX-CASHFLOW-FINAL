import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Currency, formatCurrency } from '../currencyUtils';

interface WealthProjectionTableProps {
  basePrice: number;
  constructionMonths: number;
  constructionAppreciation: number;
  growthAppreciation: number;
  matureAppreciation: number;
  growthPeriodYears: number;
  bookingYear: number;
  currency: Currency;
  rate: number;
}

export const WealthProjectionTable = ({
  basePrice,
  constructionMonths,
  constructionAppreciation,
  growthAppreciation,
  matureAppreciation,
  growthPeriodYears,
  bookingYear,
  currency,
  rate,
}: WealthProjectionTableProps) => {
  const tableData = useMemo(() => {
    const data: { year: number; value: number; phase: string; appreciation: number }[] = [];
    const constructionYears = Math.ceil(constructionMonths / 12);
    let currentValue = basePrice;

    for (let year = 0; year <= 7; year++) {
      let phase: string;
      let appreciation: number;

      if (year < constructionYears) {
        phase = 'Construction';
        appreciation = constructionAppreciation;
      } else if (year < constructionYears + growthPeriodYears) {
        phase = 'Growth';
        appreciation = growthAppreciation;
      } else {
        phase = 'Mature';
        appreciation = matureAppreciation;
      }

      data.push({
        year: bookingYear + year,
        value: Math.round(currentValue),
        phase,
        appreciation,
      });

      currentValue = currentValue * (1 + appreciation / 100);
    }

    return data;
  }, [basePrice, constructionMonths, constructionAppreciation, growthAppreciation, matureAppreciation, growthPeriodYears, bookingYear]);

  const totalGrowth = tableData.length > 0 
    ? ((tableData[tableData.length - 1].value - tableData[0].value) / tableData[0].value * 100) 
    : 0;

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'Construction': return 'bg-orange-400';
      case 'Growth': return 'bg-green-400';
      case 'Mature': return 'bg-blue-400';
      default: return 'bg-gray-400';
    }
  };

  const getPhaseTextColor = (phase: string) => {
    switch (phase) {
      case 'Construction': return 'text-orange-400';
      case 'Growth': return 'text-green-400';
      case 'Mature': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-theme-card border border-theme-border rounded-xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-xs font-semibold text-theme-text uppercase tracking-wide">
            Wealth Projection
          </span>
        </div>
        <motion.span 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium"
        >
          +{totalGrowth.toFixed(0)}% in 7 years
        </motion.span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-theme-bg/50 sticky top-0">
            <tr className="text-theme-text-muted">
              <th className="text-left py-1.5 px-3 font-medium">Year</th>
              <th className="text-right py-1.5 px-3 font-medium">Value</th>
              <th className="text-center py-1.5 px-3 font-medium">Phase</th>
              <th className="text-right py-1.5 px-3 font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <motion.tr 
                key={row.year}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                className={`border-b border-theme-border/50 last:border-0 ${index === 0 ? 'bg-theme-accent/5' : ''}`}
              >
                <td className="py-1.5 px-3 text-theme-text font-medium">
                  {row.year}
                </td>
                <td className="py-1.5 px-3 text-right">
                  <div className="text-theme-text tabular-nums font-medium">
                    {formatCurrency(row.value, 'AED', 1)}
                  </div>
                  {currency !== 'AED' && (
                    <div className="text-[10px] text-theme-text-muted tabular-nums">
                      {formatCurrency(row.value, currency, rate)}
                    </div>
                  )}
                </td>
                <td className="py-1.5 px-3 text-center">
                  <span className="inline-flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${getPhaseColor(row.phase)}`} />
                    <span className={`text-[10px] ${getPhaseTextColor(row.phase)}`}>
                      {row.phase.slice(0, 4)}
                    </span>
                  </span>
                </td>
                <td className={`py-1.5 px-3 text-right tabular-nums ${getPhaseTextColor(row.phase)}`}>
                  +{row.appreciation}%
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phase Legend */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        className="flex items-center justify-center gap-4 py-2 px-3 border-t border-theme-border/50 bg-theme-bg/30 flex-shrink-0"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-[10px] text-theme-text-muted">{constructionAppreciation}%/yr</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[10px] text-theme-text-muted">{growthAppreciation}%/yr</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-[10px] text-theme-text-muted">{matureAppreciation}%/yr</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
