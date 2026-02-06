import { useState } from "react";
import { Building2, DollarSign, Calendar, Eye, Download, Check, BarChart3, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Currency } from "@/components/roi/currencyUtils";

interface QuoteData {
  id: string;
  project_name: string | null;
  developer: string | null;
  unit: string | null;
  unit_type: string | null;
  share_token: string | null;
  inputs: any;
  updated_at: string;
  client_name?: string | null;
  client_country?: string | null;
  unit_size_sqf?: number | null;
}

interface OpportunitiesSectionProps {
  quotes: QuoteData[];
  currency: Currency;
  language: 'en' | 'es';
  onDownload: (quoteId: string) => void;
  onCompare: (quoteIds: string[]) => void;
  onConvertToProperty?: (quote: QuoteData) => void;
  isBrokerView?: boolean; // Shows convert button when true
}

const formatPrice = (inputs: any) => {
  const price = inputs?.basePrice || 0;
  if (price > 0) {
    return `AED ${(price / 1000000).toFixed(2)}M`;
  }
  return null;
};

export const OpportunitiesSection = ({ 
  quotes, 
  currency, 
  language, 
  onDownload,
  onCompare,
  onConvertToProperty,
  isBrokerView = false,
}: OpportunitiesSectionProps) => {
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);

  const toggleQuoteSelection = (quoteId: string) => {
    setSelectedQuotes(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : prev.length < 4 ? [...prev, quoteId] : prev
    );
  };

  const handleCompare = () => {
    if (selectedQuotes.length >= 2) {
      onCompare(selectedQuotes);
    }
  };

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 mx-auto text-theme-text-muted mb-4" />
        <h3 className="text-lg text-theme-text mb-2">No opportunities yet</h3>
        <p className="text-theme-text-muted text-sm">
          Your advisor will share investment opportunities with you soon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compare Bar - Shows when 2+ selected */}
      {selectedQuotes.length >= 2 && (
        <div className="sticky top-0 z-10 bg-theme-accent/20 border border-theme-accent/30 rounded-lg p-3 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-theme-accent" />
            <span className="text-sm text-theme-text">
              {selectedQuotes.length} opportunities selected
            </span>
          </div>
          <Button 
            size="sm" 
            onClick={handleCompare}
            className="bg-theme-accent text-slate-900 hover:bg-theme-accent/90"
          >
            Compare Side by Side
          </Button>
        </div>
      )}

      {/* Instructions */}
      {quotes.length >= 2 && selectedQuotes.length < 2 && (
        <p className="text-xs text-theme-text-muted text-center">
          Select 2 or more opportunities to compare them side by side
        </p>
      )}

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quotes.map(quote => {
          const isSelected = selectedQuotes.includes(quote.id);
          
          return (
            <Card 
              key={quote.id} 
              className={`bg-theme-card border-2 transition-all cursor-pointer ${
                isSelected 
                  ? 'border-theme-accent shadow-lg shadow-theme-accent/10' 
                  : 'border-theme-border hover:border-theme-accent/30'
              }`}
              onClick={() => toggleQuoteSelection(quote.id)}
            >
              <CardContent className="p-5">
                {/* Selection Indicator */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-theme-accent' : 'bg-theme-accent/20'
                    }`}>
                      {isSelected ? (
                        <Check className="w-5 h-5 text-slate-900" />
                      ) : (
                        <Building2 className="w-5 h-5 text-theme-accent" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-theme-text truncate">
                        {quote.project_name || 'Investment Property'}
                      </h3>
                      {quote.developer && (
                        <p className="text-xs text-theme-text-muted truncate">{quote.developer}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {quote.unit_type && (
                    <div className="flex items-center gap-2 text-sm text-theme-text-muted">
                      <Badge variant="secondary" className="bg-theme-bg">{quote.unit_type}</Badge>
                      {quote.unit && <span>Unit {quote.unit}</span>}
                    </div>
                  )}
                  {formatPrice(quote.inputs) && (
                    <div className="flex items-center gap-1 text-theme-accent font-medium">
                      <DollarSign className="w-4 h-4" />
                      {formatPrice(quote.inputs)}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-theme-text-muted">
                    <Calendar className="w-3 h-3" />
                    Updated {format(new Date(quote.updated_at), 'MMM d, yyyy')}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  {quote.share_token && (
                    <Button
                      size="sm"
                      onClick={() => window.open(`/view/${quote.share_token}?currency=${currency}&lang=${language}`, '_blank')}
                      className="flex-1 bg-theme-accent text-slate-900 hover:bg-theme-accent/90"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </Button>
                  )}
                  {isBrokerView && onConvertToProperty && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onConvertToProperty(quote)}
                      className="border-theme-accent/30 bg-theme-bg text-theme-accent hover:bg-theme-accent/10"
                      title="Add to Portfolio"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownload(quote.id)}
                    className="border-theme-border bg-theme-bg text-theme-text hover:bg-theme-bg/80"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
