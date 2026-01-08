import { Check, X } from 'lucide-react';
import { QuoteWithCalculations } from '@/hooks/useQuotesComparison';
import { 
  VALUE_DIFFERENTIATORS, 
  CATEGORY_LABELS,
  DifferentiatorCategory 
} from '@/components/roi/valueDifferentiators';

interface DifferentiatorsComparisonProps {
  quotesWithCalcs: QuoteWithCalculations[];
}

export const DifferentiatorsComparison = ({ quotesWithCalcs }: DifferentiatorsComparisonProps) => {
  const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500'];
  
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

  return (
    <div className="space-y-4">
      {/* Header with quote names */}
      <div 
        className="grid gap-4 mb-4 pb-3 border-b border-[#2a3142]"
        style={{ gridTemplateColumns: `180px repeat(${quotesWithCalcs.length}, 1fr)` }}
      >
        <div className="text-sm text-gray-500">Feature</div>
        {quotesWithCalcs.map(({ quote }, idx) => (
          <div 
            key={quote.id}
            className="text-sm font-medium truncate text-center"
            style={{ color: colors[idx % colors.length] }}
          >
            {quote.title || quote.projectName || 'Quote'}
          </div>
        ))}
      </div>

      {/* Categories and differentiators */}
      <div className="space-y-4">
        {categories.map(category => (
          <div key={category}>
            {/* Category header */}
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              {CATEGORY_LABELS[category]?.en || category}
            </div>
            
            {/* Differentiators in this category */}
            <div className="space-y-1">
              {categorizedDifferentiators[category].map(diff => {
                const Icon = diff.icon;
                return (
                  <div 
                    key={diff.id}
                    className="grid gap-4 py-2 hover:bg-[#0f172a]/50 rounded-lg px-2 -mx-2"
                    style={{ gridTemplateColumns: `180px repeat(${quotesWithCalcs.length}, 1fr)` }}
                  >
                    {/* Feature name */}
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-300">{diff.name}</span>
                      {diff.impactsAppreciation && (
                        <span className="text-[10px] px-1 py-0.5 bg-[#CCFF00]/20 text-[#CCFF00] rounded">
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
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#0f172a]">
                              <X className="w-4 h-4 text-gray-600" />
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
        className="grid gap-4 mt-4 pt-3 border-t border-[#2a3142]"
        style={{ gridTemplateColumns: `180px repeat(${quotesWithCalcs.length}, 1fr)` }}
      >
        <div className="text-sm text-gray-400">Total Appreciation Bonus</div>
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
              style={{ color: bonus > 0 ? color : '#6b7280' }}
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
