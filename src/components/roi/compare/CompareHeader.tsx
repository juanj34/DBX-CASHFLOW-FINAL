import { X, Building2, Maximize2, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComparisonQuote } from '@/hooks/useQuotesComparison';
import { formatCurrency } from '@/components/roi/currencyUtils';

interface CompareHeaderProps {
  quotes: ComparisonQuote[];
  onRemove: (id: string) => void;
}

// Helper to format handover quarter to readable date
const formatHandover = (quarter: number | undefined, year: number | undefined) => {
  if (!quarter || !year) return null;
  
  const quarterLabel = `Q${quarter} ${year}`;
  
  // Calculate months from now
  const now = new Date();
  const handoverMonth = (quarter - 1) * 3 + 1; // Q1=Jan, Q2=Apr, Q3=Jul, Q4=Oct
  const handoverDate = new Date(year, handoverMonth, 1);
  const monthsAway = Math.round((handoverDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  return {
    label: quarterLabel,
    monthsAway: monthsAway > 0 ? monthsAway : null
  };
};

// Get zone maturity badge color
const getMaturityColor = (maturity: number | undefined) => {
  if (!maturity) return '#6b7280'; // gray
  if (maturity < 40) return '#22c55e'; // green - emerging
  if (maturity < 70) return '#eab308'; // yellow - growth
  return '#3b82f6'; // blue - mature
};

const getMaturityLabel = (maturity: number | undefined) => {
  if (!maturity) return null;
  if (maturity < 40) return 'Emerging';
  if (maturity < 70) return 'Growth';
  return 'Mature';
};

export const CompareHeader = ({ quotes, onRemove }: CompareHeaderProps) => {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${quotes.length}, minmax(200px, 1fr))` }}>
      {quotes.map((quote, index) => {
        const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500'];
        const color = colors[index % colors.length];
        
        const handoverInfo = formatHandover(
          quote.inputs.handoverQuarter, 
          quote.inputs.handoverYear
        );
        
        const zoneMaturity = quote.inputs.zoneMaturityLevel;
        const zoneId = quote.inputs.zoneId;
        const maturityColor = getMaturityColor(zoneMaturity);
        const maturityLabel = getMaturityLabel(zoneMaturity);
        
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

              {/* Handover Timeline */}
              {handoverInfo && (
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-400">{handoverInfo.label}</span>
                  {handoverInfo.monthsAway && (
                    <span className="text-gray-500">({handoverInfo.monthsAway}mo away)</span>
                  )}
                </div>
              )}

              {/* Zone Information */}
              {maturityLabel && (
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3 h-3" style={{ color: maturityColor }} />
                  {zoneId && <span className="text-gray-400 truncate max-w-[100px]">{zoneId}</span>}
                  <span 
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ 
                      backgroundColor: `${maturityColor}20`, 
                      color: maturityColor 
                    }}
                  >
                    {maturityLabel} {zoneMaturity && `(${zoneMaturity}%)`}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-[#2a3142]">
                <span className="text-xs text-gray-500">Base Price</span>
                <p className="text-lg font-bold" style={{ color }}>
                  {formatCurrency(quote.inputs.basePrice, 'AED', 1)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
