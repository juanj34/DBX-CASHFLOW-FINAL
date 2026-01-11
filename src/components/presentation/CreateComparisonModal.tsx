import { useState, useMemo } from "react";
import { Search, GitCompare, Check, Building2, User, MapPin, Star } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useQuotesList, CashflowQuote } from "@/hooks/useCashflowQuote";
import { formatCurrency } from "@/components/roi/currencyUtils";
import { cn } from "@/lib/utils";

interface CreateComparisonModalProps {
  open: boolean;
  onClose: () => void;
  onCreateComparison: (title: string, quoteIds: string[]) => void;
  presentationQuoteIds?: string[]; // Quotes already in the presentation (show first)
}

export const CreateComparisonModal = ({
  open,
  onClose,
  onCreateComparison,
  presentationQuoteIds = [],
}: CreateComparisonModalProps) => {
  const { quotes, loading } = useQuotesList();
  const [search, setSearch] = useState("");
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");

  const maxQuotes = 4;
  const minQuotes = 2;

  // Separate presentation quotes and other quotes, apply search filter
  const { presentationQuotes, otherQuotes } = useMemo(() => {
    const searchLower = search.toLowerCase();
    const matchesSearch = (q: CashflowQuote) => {
      if (!search) return true;
      const matchesProject = q.project_name?.toLowerCase().includes(searchLower);
      const matchesClient = q.client_name?.toLowerCase().includes(searchLower);
      const matchesDeveloper = q.developer?.toLowerCase().includes(searchLower);
      const matchesUnit = q.unit?.toLowerCase().includes(searchLower);
      return matchesProject || matchesClient || matchesDeveloper || matchesUnit;
    };

    const inPresentation = quotes.filter(q => 
      presentationQuoteIds.includes(q.id) && matchesSearch(q)
    );
    const notInPresentation = quotes.filter(q => 
      !presentationQuoteIds.includes(q.id) && matchesSearch(q)
    );

    return { presentationQuotes: inPresentation, otherQuotes: notInPresentation };
  }, [quotes, presentationQuoteIds, search]);

  const toggleQuote = (quoteId: string) => {
    setSelectedQuoteIds(prev => {
      if (prev.includes(quoteId)) {
        return prev.filter(id => id !== quoteId);
      }
      if (prev.length >= maxQuotes) {
        return prev;
      }
      return [...prev, quoteId];
    });
  };

  const handleCreate = () => {
    if (selectedQuoteIds.length < minQuotes) return;
    
    // Generate title if not provided
    const finalTitle = title.trim() || generateDefaultTitle();
    onCreateComparison(finalTitle, selectedQuoteIds);
    handleClose();
  };

  const generateDefaultTitle = () => {
    const selectedQuotes = quotes.filter(q => selectedQuoteIds.includes(q.id));
    const projectNames = selectedQuotes
      .map(q => q.project_name || q.unit_type || "Quote")
      .slice(0, 2);
    return projectNames.join(" vs ");
  };

  const handleClose = () => {
    setSelectedQuoteIds([]);
    setSearch("");
    setTitle("");
    onClose();
  };

  const getQuotePrice = (quote: CashflowQuote) => {
    const price = quote.inputs?.basePrice;
    if (!price) return null;
    return formatCurrency(price, 'AED', 1);
  };

  const isValid = selectedQuoteIds.length >= minQuotes;

  const renderQuoteItem = (quote: CashflowQuote, isInPresentation: boolean = false) => {
    const isSelected = selectedQuoteIds.includes(quote.id);
    const isDisabled = !isSelected && selectedQuoteIds.length >= maxQuotes;
    const price = getQuotePrice(quote);
    
    return (
      <div
        key={quote.id}
        className={cn(
          "p-3 rounded-lg border transition-all",
          isDisabled 
            ? "border-theme-border/50 bg-theme-bg/50 opacity-50 cursor-not-allowed"
            : "cursor-pointer",
          isSelected
            ? "border-purple-500 bg-purple-500/10"
            : !isDisabled && "border-theme-border bg-theme-bg hover:border-purple-500/50"
        )}
        onClick={() => !isDisabled && toggleQuote(quote.id)}
      >
        <div className="flex items-start gap-3">
          {/* Selection indicator */}
          <div className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
            isSelected
              ? "border-purple-500 bg-purple-500"
              : "border-theme-border"
          )}>
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>

          {/* Quote info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-theme-text truncate">
                {quote.project_name || "Untitled Project"}
              </span>
              {isInPresentation && (
                <Badge variant="outline" className="text-[10px] border-theme-accent/50 text-theme-accent px-1.5 py-0">
                  <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
                  In Presentation
                </Badge>
              )}
              {price && (
                <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-300">
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

          {/* Order indicator when selected */}
          {isSelected && (
            <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-medium flex items-center justify-center">
              {selectedQuoteIds.indexOf(quote.id) + 1}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-theme-card border-theme-border text-theme-text max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-theme-text flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-purple-400" />
            Create Comparison
          </DialogTitle>
        </DialogHeader>

        {/* Comparison Title */}
        <div className="space-y-1.5">
          <Label className="text-xs text-theme-text-muted">Comparison Title (optional)</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Downtown Options for John"
            className="bg-theme-bg border-theme-border text-theme-text"
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quotes..."
            className="pl-10 bg-theme-bg border-theme-border text-theme-text"
          />
        </div>

        {/* Selection info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-theme-text-muted">
            Select {minQuotes}-{maxQuotes} quotes to compare
          </span>
          <Badge 
            variant={isValid ? "default" : "secondary"}
            className={cn(
              isValid 
                ? "bg-purple-500/20 text-purple-300" 
                : "bg-theme-bg text-theme-text-muted"
            )}
          >
            {selectedQuoteIds.length} / {maxQuotes} selected
          </Badge>
        </div>

        {/* Quote List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="text-center py-8 text-theme-text-muted">
              Loading quotes...
            </div>
          ) : (presentationQuotes.length === 0 && otherQuotes.length === 0) ? (
            <div className="text-center py-8 text-theme-text-muted">
              {search ? "No quotes match your search" : "No quotes available"}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Presentation Quotes Section */}
              {presentationQuotes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase tracking-wider text-theme-accent font-semibold flex items-center gap-1.5">
                    <Star className="w-3 h-3" />
                    In This Presentation
                  </h4>
                  <div className="space-y-2">
                    {presentationQuotes.map((quote) => renderQuoteItem(quote, true))}
                  </div>
                </div>
              )}

              {/* Other Quotes Section */}
              {otherQuotes.length > 0 && (
                <div className="space-y-2">
                  {presentationQuotes.length > 0 && (
                    <h4 className="text-xs uppercase tracking-wider text-theme-text-muted font-semibold">
                      Other Quotes
                    </h4>
                  )}
                  <div className="space-y-2">
                    {otherQuotes.map((quote) => renderQuoteItem(quote, false))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-theme-border -mx-6 px-6">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-theme-border text-theme-text-muted hover:text-theme-text"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!isValid}
            className="bg-purple-500 text-white hover:bg-purple-600"
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Create Comparison
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
