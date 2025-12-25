import { X, Building2, User, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComparisonQuote } from '@/hooks/useQuotesComparison';
import { formatCurrency } from '@/components/roi/currencyUtils';

interface CompareHeaderProps {
  quotes: ComparisonQuote[];
  onRemove: (id: string) => void;
}

export const CompareHeader = ({ quotes, onRemove }: CompareHeaderProps) => {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${quotes.length}, minmax(200px, 1fr))` }}>
      {quotes.map((quote, index) => {
        const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500'];
        const color = colors[index % colors.length];
        
        return (
          <div
            key={quote.id}
            className="bg-[#1a1f2e] border border-[#2a3142] rounded-xl p-4 relative group"
            style={{ borderTopColor: color, borderTopWidth: '3px' }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(quote.id)}
              className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white hover:bg-[#2a3142]"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-white truncate pr-8">
                  {quote.title || 'Untitled Quote'}
                </h3>
                {quote.projectName && (
                  <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                    <Building2 className="w-3 h-3" />
                    {quote.projectName}
                  </p>
                )}
                {quote.developer && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    by {quote.developer}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0f172a] rounded-lg p-2">
                  <span className="text-gray-500 block">Unit</span>
                  <span className="text-white font-medium">
                    {quote.unit || quote.unitType || 'N/A'}
                  </span>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-2">
                  <span className="text-gray-500 block">Size</span>
                  <span className="text-white font-medium">
                    {quote.unitSizeSqf ? `${quote.unitSizeSqf.toLocaleString()} sqft` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#2a3142]">
                <span className="text-xs text-gray-500">Base Price</span>
                <p className="text-lg font-bold" style={{ color }}>
                  {formatCurrency(quote.inputs.basePrice, 'AED', 1)}
                </p>
              </div>

              {quote.clientName && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <User className="w-3 h-3" />
                  <span>{quote.clientName}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
