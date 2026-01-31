import { Check, X } from 'lucide-react';
import { QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { 
  VALUE_DIFFERENTIATORS, 
  CATEGORY_LABELS,
  DifferentiatorCategory 
} from '@/components/roi/valueDifferentiators';
import { useTheme } from '@/contexts/ThemeContext';
import { getQuoteDisplayName } from './utils';

interface DifferentiatorsComparisonProps {
  quotesWithCalcs: QuoteWithCalculations[];
}

// Theme-aware colors for quotes
const getQuoteColors = (isLightTheme: boolean) => 
  isLightTheme 
    ? ['#B8860B', '#1e40af', '#7c3aed', '#c2410c', '#0f766e', '#be185d']
    : ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500', '#FF6B6B', '#4ECDC4'];

export const DifferentiatorsComparison = ({ quotesWithCalcs }: DifferentiatorsComparisonProps) => {
  const { theme } = useTheme();
  const isLightTheme = theme === 'consultant';
  const colors = getQuoteColors(isLightTheme);
  
  // Get all unique selected differentiators across all quotes
  const allSelectedIds = new Set<string>();
  quotesWithCalcs.forEach(({ quote }) => {
    const ids = quote.inputs.valueDifferentiators || [];
    ids.forEach((id: string) => allSelectedIds.add(id));
  });

  // If no differentiators selected in any quote, don't show section
  if (allSelectedIds.size === 0) return null;

  // Group differentiators by category
  const categorizedDifferentiators = VALUE_DIFFERENTIATORS
    .filter(d => allSelectedIds.has(d.id))
    .reduce((acc, diff) => {
      if (!acc[diff.category]) acc[diff.category] = [];
      acc[diff.category].push(diff);
      return acc;
    }, {} as Record<DifferentiatorCategory, typeof VALUE_DIFFERENTIATORS>);

  const categories = Object.keys(categorizedDifferentiators) as DifferentiatorCategory[];

  // Badge color for appreciation bonus
  const bonusBgColor = isLightTheme ? 'rgba(184, 134, 11, 0.2)' : 'rgba(204, 255, 0, 0.2)';
  const bonusTextColor = isLightTheme ? '#B8860B' : '#CCFF00';

  return (
    <div className="space-y-4">
      {/* Header with quote names */}
      <div 
        className="grid gap-4 mb-4 pb-3 border-b border-theme-border"
        style={{ gridTemplateColumns: `180px repeat(${quotesWithCalcs.length}, 1fr)` }}
      >
        <div className="text-sm text-theme-text-muted">Feature</div>
        {quotesWithCalcs.map(({ quote }, idx) => (
          <div 
            key={quote.id}
            className="text-sm font-medium truncate text-center"
            style={{ color: colors[idx % colors.length] }}
          >
            {getQuoteDisplayName(quote.title, quote.projectName)}
          </div>
        ))}
      </div>

      {/* Categories and differentiators */}
      <div className="space-y-4">
        {categories.map(category => (
          <div key={category}>
            {/* Category header */}
            <div className="text-xs text-theme-text-muted uppercase tracking-wide mb-2">
              {CATEGORY_LABELS[category]?.en || category}
            </div>
            
            {/* Differentiators in this category */}
            <div className="space-y-1">
              {categorizedDifferentiators[category].map(diff => {
                const Icon = diff.icon;
                return (
                  <div 
                    key={diff.id}
                    className="grid gap-4 py-2 hover:bg-theme-bg-alt/50 rounded-lg px-2 -mx-2"
                    style={{ gridTemplateColumns: `180px repeat(${quotesWithCalcs.length}, 1fr)` }}
                  >
                    {/* Feature name */}
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-theme-text-muted" />
                      <span className="text-sm text-theme-text">{diff.name}</span>
                      {diff.impactsAppreciation && (
                        <span 
                          className="text-[10px] px-1 py-0.5 rounded"
                          style={{ backgroundColor: bonusBgColor, color: bonusTextColor }}
                        >
                          +{diff.appreciationBonus}%
                        </span>
                      )}
                    </div>
                    
                    {/* Check/X for each quote */}
                    {quotesWithCalcs.map(({ quote }, idx) => {
                      const hasFeature = (quote.inputs.valueDifferentiators || []).includes(diff.id);
                      const color = colors[idx % colors.length];
                      
                      return (
                        <div key={quote.id} className="flex justify-center">
                          {hasFeature ? (
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${color}20` }}
                            >
                              <Check className="w-4 h-4" style={{ color }} />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-theme-bg-alt">
                              <X className="w-4 h-4 text-theme-text-muted/50" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Appreciation bonus summary */}
      <div 
        className="grid gap-4 mt-4 pt-3 border-t border-theme-border"
        style={{ gridTemplateColumns: `180px repeat(${quotesWithCalcs.length}, 1fr)` }}
      >
        <div className="text-sm text-theme-text-muted">Total Appreciation Bonus</div>
        {quotesWithCalcs.map(({ quote }, idx) => {
          const selectedIds = quote.inputs.valueDifferentiators || [];
          const bonus = VALUE_DIFFERENTIATORS
            .filter(d => selectedIds.includes(d.id) && d.impactsAppreciation)
            .reduce((sum, d) => sum + d.appreciationBonus, 0);
          const color = colors[idx % colors.length];
          
          return (
            <div 
              key={quote.id}
              className="text-center font-semibold"
              style={{ color: bonus > 0 ? color : 'var(--theme-text-muted)' }}
            >
              {bonus > 0 ? `+${Math.min(bonus, 2).toFixed(1)}%` : '-'}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DifferentiatorsComparison;
