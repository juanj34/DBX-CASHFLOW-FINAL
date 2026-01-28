import { useState, useMemo } from "react";
import { Plus, ChevronRight, ChevronLeft, Presentation, FileText, GitCompare, Check, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQuotesList, CashflowQuote } from "@/hooks/useCashflowQuote";
import { PresentationViewMode } from "@/hooks/usePresentations";

export interface WizardQuote {
  quoteId: string;
  viewMode: PresentationViewMode;
  title?: string;
}

export interface WizardComparison {
  id: string;
  title: string;
  quoteIds: string[];
}

interface CreatePresentationWizardProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    quotes: WizardQuote[];
    comparisons: WizardComparison[];
  }) => Promise<void>;
}

type Step = 'title' | 'quotes' | 'comparisons';

const steps: { id: Step; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'title', label: 'Title', icon: Presentation },
  { id: 'quotes', label: 'Quotes', icon: FileText },
  { id: 'comparisons', label: 'Compare', icon: GitCompare },
];

export const CreatePresentationWizard = ({ open, onClose, onCreate }: CreatePresentationWizardProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('title');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedQuotes, setSelectedQuotes] = useState<WizardQuote[]>([]);
  const [comparisons, setComparisons] = useState<WizardComparison[]>([]);
  const [search, setSearch] = useState('');
  const [comparisonTitle, setComparisonTitle] = useState('');
  const [comparisonQuotes, setComparisonQuotes] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const { quotes, loading: quotesLoading } = useQuotesList();

  const filteredQuotes = useMemo(() => {
    if (!search.trim()) return quotes;
    const searchLower = search.toLowerCase();
    return quotes.filter(q => 
      q.project_name?.toLowerCase().includes(searchLower) ||
      q.client_name?.toLowerCase().includes(searchLower) ||
      q.developer?.toLowerCase().includes(searchLower) ||
      q.unit?.toLowerCase().includes(searchLower)
    );
  }, [quotes, search]);

  const resetWizard = () => {
    setCurrentStep('title');
    setTitle('');
    setDescription('');
    setSelectedQuotes([]);
    setComparisons([]);
    setSearch('');
    setComparisonTitle('');
    setComparisonQuotes(new Set());
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const handleNext = () => {
    if (currentStep === 'title') setCurrentStep('quotes');
    else if (currentStep === 'quotes') setCurrentStep('comparisons');
  };

  const handleBack = () => {
    if (currentStep === 'quotes') setCurrentStep('title');
    else if (currentStep === 'comparisons') setCurrentStep('quotes');
  };

  const toggleQuote = (quote: CashflowQuote) => {
    setSelectedQuotes(prev => {
      const exists = prev.find(q => q.quoteId === quote.id);
      if (exists) {
        return prev.filter(q => q.quoteId !== quote.id);
      }
      // Default to snapshot view
      return [...prev, { 
        quoteId: quote.id, 
        viewMode: 'snapshot' as PresentationViewMode,
        title: quote.project_name || quote.client_name || 'Quote'
      }];
    });
  };

  // Removed toggleViewMode - all quotes use snapshot view only

  const toggleComparisonQuote = (quoteId: string) => {
    setComparisonQuotes(prev => {
      const next = new Set(prev);
      if (next.has(quoteId)) {
        next.delete(quoteId);
      } else if (next.size < 4) {
        next.add(quoteId);
      }
      return next;
    });
  };

  const addComparison = () => {
    if (comparisonQuotes.size < 2) return;
    const newComparison: WizardComparison = {
      id: crypto.randomUUID(),
      title: comparisonTitle || `Comparison ${comparisons.length + 1}`,
      quoteIds: Array.from(comparisonQuotes),
    };
    setComparisons(prev => [...prev, newComparison]);
    setComparisonTitle('');
    setComparisonQuotes(new Set());
  };

  const removeComparison = (id: string) => {
    setComparisons(prev => prev.filter(c => c.id !== id));
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsCreating(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        quotes: selectedQuotes,
        comparisons,
      });
      handleClose();
    } finally {
      setIsCreating(false);
    }
  };

  const getQuotePrice = (quote: CashflowQuote) => {
    const price = quote.inputs?.basePrice || 0;
    return price > 0 ? `AED ${(price / 1000000).toFixed(2)}M` : '';
  };

  const canProceed = currentStep === 'title' ? title.trim().length > 0 : true;
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-theme-card border-theme-border text-theme-text sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-theme-border">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
              <Presentation className="w-5 h-5 text-purple-400" />
            </div>
            Create Presentation
          </DialogTitle>
          
          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isComplete = currentStepIndex > index;
              
              return (
                <div key={step.id} className="flex items-center">
                  {index > 0 && (
                    <div className={cn(
                      "w-8 h-0.5 mx-1",
                      isComplete ? "bg-theme-accent" : "bg-theme-border"
                    )} />
                  )}
                  <button
                    onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                    disabled={index > currentStepIndex}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-theme-accent/20 text-theme-accent" 
                        : isComplete 
                          ? "bg-theme-accent/10 text-theme-accent cursor-pointer hover:bg-theme-accent/20"
                          : "bg-theme-bg text-theme-text-muted"
                    )}
                  >
                    {isComplete ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 'title' && (
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wizard-title">Presentation Title *</Label>
                <Input
                  id="wizard-title"
                  placeholder="e.g., Q1 Investment Options for John"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-theme-bg border-theme-border text-theme-text"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wizard-description">Description (optional)</Label>
                <Textarea
                  id="wizard-description"
                  placeholder="Brief description of this presentation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-theme-bg border-theme-border text-theme-text resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          {currentStep === 'quotes' && (
            <div className="flex flex-col h-[400px]">
              <div className="p-4 border-b border-theme-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
                  <Input
                    placeholder="Search quotes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-theme-bg border-theme-border text-theme-text"
                  />
                </div>
                {selectedQuotes.length > 0 && (
                  <p className="text-xs text-theme-accent mt-2">
                    {selectedQuotes.length} quote{selectedQuotes.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {quotesLoading ? (
                    <div className="text-center py-8 text-theme-text-muted">Loading quotes...</div>
                  ) : filteredQuotes.length === 0 ? (
                    <div className="text-center py-8 text-theme-text-muted">No quotes found</div>
                  ) : (
                    filteredQuotes.map(quote => {
                      const selected = selectedQuotes.find(q => q.quoteId === quote.id);
                      return (
                        <div
                          key={quote.id}
                          className={cn(
                            "p-3 rounded-lg border transition-all cursor-pointer",
                            selected
                              ? "border-theme-accent bg-theme-accent/10"
                              : "border-theme-border hover:border-theme-accent/30"
                          )}
                          onClick={() => toggleQuote(quote)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                selected 
                                  ? "border-theme-accent bg-theme-accent" 
                                  : "border-theme-border"
                              )}>
                                {selected && <Check className="w-3 h-3 text-theme-bg" />}
                              </div>
                              <div>
                                <p className="font-medium text-theme-text text-sm">
                                  {quote.project_name || 'Unnamed Project'}
                                </p>
                                <p className="text-xs text-theme-text-muted">
                                  {[quote.client_name, quote.developer, quote.unit_type].filter(Boolean).join(' • ')}
                                </p>
                              </div>
                            </div>
                            {getQuotePrice(quote) && (
                              <span className="text-xs font-medium text-theme-accent">{getQuotePrice(quote)}</span>
                            )}
                          </div>
                          {/* View Mode indicator (snapshot only) */}
                          {selected && (
                            <div className="mt-2 pl-8 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[10px] px-2 py-1 rounded bg-theme-accent/20 text-theme-accent">
                                Snapshot
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {currentStep === 'comparisons' && (
            <div className="flex flex-col h-[400px]">
              <div className="p-4 border-b border-theme-border space-y-3">
                <div>
                  <Label className="text-xs text-theme-text-muted">Create a comparison (optional)</Label>
                  <Input
                    placeholder="Comparison title..."
                    value={comparisonTitle}
                    onChange={(e) => setComparisonTitle(e.target.value)}
                    className="mt-1 bg-theme-bg border-theme-border text-theme-text"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedQuotes.map(sq => {
                    const quote = quotes.find(q => q.id === sq.quoteId);
                    const isInComparison = comparisonQuotes.has(sq.quoteId);
                    return (
                      <button
                        key={sq.quoteId}
                        onClick={() => toggleComparisonQuote(sq.quoteId)}
                        className={cn(
                          "text-xs px-2 py-1 rounded-full transition-colors",
                          isInComparison
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-theme-bg text-theme-text-muted border border-theme-border hover:border-purple-500/30"
                        )}
                      >
                        {quote?.project_name || 'Quote'}
                      </button>
                    );
                  })}
                </div>
                <Button
                  onClick={addComparison}
                  disabled={comparisonQuotes.size < 2}
                  size="sm"
                  className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Comparison ({comparisonQuotes.size}/2-4 quotes)
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {comparisons.length === 0 ? (
                    <div className="text-center py-8 text-theme-text-muted">
                      <GitCompare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No comparisons created</p>
                      <p className="text-xs mt-1">Select 2-4 quotes above to create a comparison</p>
                    </div>
                  ) : (
                    comparisons.map(comp => (
                      <div
                        key={comp.id}
                        className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GitCompare className="w-4 h-4 text-purple-400" />
                            <span className="font-medium text-theme-text text-sm">{comp.title}</span>
                          </div>
                          <button
                            onClick={() => removeComparison(comp.id)}
                            className="p-1 text-theme-text-muted hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-theme-text-muted mt-1 pl-6">
                          {comp.quoteIds.length} quotes
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-theme-border flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={currentStep === 'title' ? handleClose : handleBack}
            className="text-theme-text-muted"
          >
            {currentStep === 'title' ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </>
            )}
          </Button>

          {currentStep === 'comparisons' ? (
            <Button
              onClick={handleCreate}
              disabled={isCreating || !title.trim()}
              className="bg-theme-accent text-slate-900 hover:bg-theme-accent/90"
            >
              {isCreating ? 'Creating...' : 'Create Presentation'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="bg-theme-accent text-slate-900 hover:bg-theme-accent/90"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
