import { useState } from 'react';
import { Search, Plus, X, Building2, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuotesList, CashflowQuote } from '@/hooks/useCashflowQuote';
import { formatCurrency } from '@/components/roi/currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuoteSelectorProps {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  maxQuotes?: number;
}

export const QuoteSelector = ({
  open,
  onClose,
  selectedIds,
  onSelect,
  maxQuotes = 4,
}: QuoteSelectorProps) => {
  const { quotes, loading } = useQuotesList();
  const [search, setSearch] = useState('');
  const { t } = useLanguage();

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1f2e] border-[#2a3142] max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between">
            <span>Select Quotes to Compare</span>
            <span className="text-sm font-normal text-gray-400">
              {selectedIds.length}/{maxQuotes} selected
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by project, developer, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#0f172a] border-[#2a3142] text-white placeholder:text-gray-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mt-4 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CCFF00]" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
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
                      ? 'bg-[#CCFF00]/10 border-[#CCFF00] ring-1 ring-[#CCFF00]/30'
                      : isDisabled
                      ? 'bg-[#0f172a]/50 border-[#2a3142] opacity-50 cursor-not-allowed'
                      : 'bg-[#0f172a] border-[#2a3142] hover:border-[#CCFF00]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">
                        {quote.title || 'Untitled Quote'}
                      </h4>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-400">
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
                      <div className="mt-2 text-sm text-[#CCFF00]">
                        {formatCurrency(quote.inputs.basePrice, 'AED', 1)}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected 
                        ? 'bg-[#CCFF00] border-[#CCFF00]' 
                        : 'border-gray-500'
                    }`}>
                      {isSelected && <X className="w-3 h-3 text-black" />}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#2a3142]">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#2a3142] text-gray-300 hover:bg-[#2a3142]"
          >
            Cancel
          </Button>
          <Button
            onClick={onClose}
            disabled={selectedIds.length < 2}
            className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
          >
            Compare {selectedIds.length} Quotes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
