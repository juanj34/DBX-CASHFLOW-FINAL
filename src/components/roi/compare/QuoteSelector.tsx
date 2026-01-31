import { useState } from 'react';
import { Search, Plus, X, Building2, User, Calendar, FolderOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuotesList, CashflowQuote } from '@/hooks/useCashflowQuote';
import { useSavedComparisons } from '@/hooks/useSavedComparisons';
import { formatCurrency } from '@/components/roi/currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuoteSelectorProps {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  maxQuotes?: number;
  onLoadComparison?: (comparison: any) => void;
}

export const QuoteSelector = ({
  open,
  onClose,
  selectedIds,
  onSelect,
  maxQuotes = 6,
  onLoadComparison,
}: QuoteSelectorProps) => {
  const { quotes, loading } = useQuotesList();
  const { comparisons } = useSavedComparisons();
  const [search, setSearch] = useState('');
  const { t } = useLanguage();

  // Get recent comparisons (last 5)
  const recentComparisons = comparisons
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const filteredQuotes = quotes.filter((quote) => {
    const searchLower = search.toLowerCase();
    return (
      (quote.title?.toLowerCase().includes(searchLower)) ||
      (quote.project_name?.toLowerCase().includes(searchLower)) ||
      (quote.developer?.toLowerCase().includes(searchLower)) ||
      (quote.client_name?.toLowerCase().includes(searchLower))
    );
  });

  const toggleQuote = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter((qId) => qId !== id));
    } else if (selectedIds.length < maxQuotes) {
      onSelect([...selectedIds, id]);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleLoadComparison = (comparison: any) => {
    if (onLoadComparison) {
      onLoadComparison(comparison);
    } else {
      onSelect(comparison.quote_ids);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-theme-card border-theme-border max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-theme-text flex items-center justify-between">
            <span>Select Quotes to Compare</span>
            <span className="text-sm font-normal text-theme-text-muted">
              {selectedIds.length}/{maxQuotes} selected
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Recent Comparisons Section */}
        {recentComparisons.length > 0 && !search && (
          <div className="border-b border-theme-border pb-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-theme-text-muted mb-3">
              <FolderOpen className="w-4 h-4" />
              <span>Recent Comparisons</span>
            </div>
            <div className="space-y-2">
              {recentComparisons.map((comparison) => (
                <button
                  key={comparison.id}
                  onClick={() => handleLoadComparison(comparison)}
                  className="w-full text-left p-2 rounded-lg bg-theme-bg-alt border border-theme-border hover:border-theme-accent/50 transition-all flex items-center justify-between group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-theme-text truncate">{comparison.title}</p>
                    <p className="text-xs text-theme-text-muted">
                      {comparison.quote_ids.length} quotes · {formatDate(comparison.updated_at)}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-theme-text-muted group-hover:text-theme-accent transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
          <Input
            placeholder="Search by project, developer, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-theme-bg-alt border-theme-border text-theme-text placeholder:text-theme-text-muted"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mt-4 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-theme-accent" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-theme-text-muted">
              {search ? 'No quotes match your search' : 'No quotes available'}
            </div>
          ) : (
            filteredQuotes.map((quote) => {
              const isSelected = selectedIds.includes(quote.id);
              const isDisabled = !isSelected && selectedIds.length >= maxQuotes;

              return (
                <button
                  key={quote.id}
                  onClick={() => toggleQuote(quote.id)}
                  disabled={isDisabled}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-theme-accent/10 border-theme-accent ring-1 ring-theme-accent/30'
                      : isDisabled
                      ? 'bg-theme-bg-alt/50 border-theme-border opacity-50 cursor-not-allowed'
                      : 'bg-theme-bg-alt border-theme-border hover:border-theme-accent/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-theme-text truncate">
                        {quote.title || 'Untitled Quote'}
                      </h4>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-theme-text-muted">
                        {quote.project_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {quote.project_name}
                          </span>
                        )}
                        {quote.client_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {quote.client_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(quote.updated_at)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-theme-accent">
                        {formatCurrency(quote.inputs.basePrice, 'AED', 1)}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected 
                        ? 'bg-theme-accent border-theme-accent' 
                        : 'border-theme-text-muted'
                    }`}>
                      {isSelected && <X className="w-3 h-3 text-theme-bg" />}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-theme-border text-theme-text-muted hover:bg-theme-card-alt"
          >
            Cancel
          </Button>
          <Button
            onClick={onClose}
            disabled={selectedIds.length < 2}
            className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
          >
            Compare {selectedIds.length} Quotes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
