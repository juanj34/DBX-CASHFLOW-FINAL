import { useState, useMemo } from "react";
import { Search, FileText, Check, Building2, User, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuotesList, CashflowQuote } from "@/hooks/useCashflowQuote";
import { formatCurrency } from "@/components/roi/currencyUtils";
import { cn } from "@/lib/utils";

export type ViewMode = 'snapshot' | 'vertical';

export interface QuoteToAdd {
  quoteId: string;
  viewMode: ViewMode;
  title: string;
}

interface AddQuoteModalProps {
  open: boolean;
  onClose: () => void;
  onAddQuotes: (quotes: QuoteToAdd[]) => void;
  existingQuoteIds: string[];
}

export const AddQuoteModal = ({
  open,
  onClose,
  onAddQuotes,
  existingQuoteIds,
}: AddQuoteModalProps) => {
  const { quotes, loading } = useQuotesList();
  const [search, setSearch] = useState("");
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set());

  // Filter out already added quotes and apply search
  const availableQuotes = useMemo(() => {
    return quotes.filter(q => {
      // Exclude already added
      if (existingQuoteIds.includes(q.id)) return false;
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesProject = q.project_name?.toLowerCase().includes(searchLower);
        const matchesClient = q.client_name?.toLowerCase().includes(searchLower);
        const matchesDeveloper = q.developer?.toLowerCase().includes(searchLower);
        const matchesUnit = q.unit?.toLowerCase().includes(searchLower);
        return matchesProject || matchesClient || matchesDeveloper || matchesUnit;
      }
      return true;
    });
  }, [quotes, existingQuoteIds, search]);

  const toggleQuote = (quoteId: string) => {
    setSelectedQuotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(quoteId)) {
        newSet.delete(quoteId);
      } else {
        newSet.add(quoteId);
      }
      return newSet;
    });
  };

  // Add ONE item per quote with default viewMode 'story'
  const handleAddSelected = () => {
    const quotesToAdd: QuoteToAdd[] = [];
    selectedQuotes.forEach((quoteId) => {
      const quote = quotes.find(q => q.id === quoteId);
      if (quote) {
        const title = quote.project_name || quote.client_name || "Quote";
        quotesToAdd.push({
          quoteId,
          viewMode: 'vertical', // Default to Cashflow view
          title,
        });
      }
    });
    onAddQuotes(quotesToAdd);
    setSelectedQuotes(new Set());
    setSearch("");
    onClose();
  };

  const handleClose = () => {
    setSelectedQuotes(new Set());
    setSearch("");
    onClose();
  };

  const getQuotePrice = (quote: CashflowQuote) => {
    const price = quote.inputs?.basePrice;
    if (!price) return null;
    return formatCurrency(price, 'AED', 1);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-theme-card border-theme-border text-theme-text max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-theme-text flex items-center gap-2">
            <FileText className="w-5 h-5 text-theme-accent" />
            Add Quotes to Presentation
          </DialogTitle>
          <p className="text-xs text-theme-text-muted mt-1">
            Select quotes to add. You can toggle between Snapshot and Cashflow views in the sidebar.
          </p>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project, client, developer..."
            className="pl-10 bg-theme-bg border-theme-border text-theme-text"
          />
        </div>

        {/* Quote List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="text-center py-8 text-theme-text-muted">
              Loading quotes...
            </div>
          ) : availableQuotes.length === 0 ? (
            <div className="text-center py-8 text-theme-text-muted">
              {search ? "No quotes match your search" : "No quotes available to add"}
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {availableQuotes.map((quote) => {
                const isSelected = selectedQuotes.has(quote.id);
                const price = getQuotePrice(quote);
                
                return (
                  <div
                    key={quote.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all cursor-pointer",
                      isSelected
                        ? "border-theme-accent bg-theme-accent/10"
                        : "border-theme-border bg-theme-bg hover:border-theme-accent/50"
                    )}
                    onClick={() => toggleQuote(quote.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection indicator */}
                      <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                        isSelected
                          ? "border-theme-accent bg-theme-accent"
                          : "border-theme-border"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-theme-bg" />}
                      </div>

                      {/* Quote info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-theme-text truncate">
                            {quote.project_name || "Untitled Project"}
                          </span>
                          {price && (
                            <Badge variant="secondary" className="text-xs bg-theme-accent/20 text-theme-accent">
                              {price}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-theme-text-muted">
                          {quote.client_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {quote.client_name}
                            </span>
                          )}
                          {quote.developer && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {quote.developer}
                            </span>
                          )}
                          {quote.unit_type && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {quote.unit_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-theme-border -mx-6 px-6">
          <span className="text-sm text-theme-text-muted">
            {selectedQuotes.size} quote{selectedQuotes.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-theme-border text-theme-text-muted hover:text-theme-text"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={selectedQuotes.size === 0}
              className="bg-theme-accent text-white hover:bg-theme-accent/90"
            >
              Add {selectedQuotes.size > 0 ? `${selectedQuotes.size} Quote${selectedQuotes.size !== 1 ? 's' : ''}` : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
