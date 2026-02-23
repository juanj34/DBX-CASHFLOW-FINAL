import { useState, useEffect } from "react";
import { Settings, FileText, GitCompare, Plus, Trash2, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PresentationItem } from "@/hooks/usePresentations";

interface ConfigurePresentationModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  items: PresentationItem[];
  onSave: (title: string, description: string) => void;
  onOpenAddQuotes: () => void;
  onOpenCreateComparison: () => void;
  onRemoveItem: (item: PresentationItem) => void;
  getQuoteTitle: (quoteId: string) => string;
}

export const ConfigurePresentationModal = ({
  open,
  onClose,
  title: initialTitle,
  description: initialDescription,
  items,
  onSave,
  onOpenAddQuotes,
  onOpenCreateComparison,
  onRemoveItem,
  getQuoteTitle,
}: ConfigurePresentationModalProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  // Sync with props when modal opens
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setDescription(initialDescription);
    }
  }, [open, initialTitle, initialDescription]);

  const handleClose = () => {
    // Auto-save on close
    onSave(title, description);
    onClose();
  };

  const quoteItems = items.filter(item => item.type === 'quote');
  const comparisonItems = items.filter(item => item.type === 'comparison' || item.type === 'inline_comparison');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-theme-card border-theme-border text-theme-text max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-theme-text flex items-center gap-2">
            <Settings className="w-5 h-5 text-theme-accent" />
            Configure Presentation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
          {/* Title & Description */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">Presentation Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Q1 Investment Options for John"
                className="bg-theme-bg border-theme-border text-theme-text"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief notes about this presentation..."
                className="bg-theme-bg border-theme-border text-theme-text resize-none text-sm"
                rows={2}
              />
            </div>
          </div>

          <Separator className="bg-theme-border" />

          {/* Content Section */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-theme-text">Presentation Content</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenAddQuotes}
                  className="border-theme-accent/50 text-theme-accent hover:bg-theme-accent/10"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Quotes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenCreateComparison}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  <GitCompare className="w-3.5 h-3.5 mr-1.5" />
                  Compare
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
              {items.length === 0 ? (
                <div className="text-center py-8 text-theme-text-muted">
                  <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No content added yet</p>
                  <p className="text-xs mt-1">Add quotes or create comparisons to get started</p>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  {/* Quotes Section */}
                  {quoteItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase tracking-wider text-theme-text-muted font-semibold flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        Quotes ({quoteItems.length})
                      </h4>
                      <div className="space-y-1.5">
                        {quoteItems.map((item, index) => (
                          <div
                            key={`quote-${item.id}-${index}`}
                            className="flex items-center gap-3 p-3 rounded-lg bg-theme-bg border border-theme-border group"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-theme-text truncate block">
                                {item.title || getQuoteTitle(item.id)}
                              </span>
                              <span className="text-xs text-theme-text-muted">
                                Cashflow View
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemoveItem(item)}
                              className="text-theme-text-muted hover:text-red-400 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comparisons Section */}
                  {comparisonItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase tracking-wider text-theme-text-muted font-semibold flex items-center gap-2">
                        <GitCompare className="w-3.5 h-3.5 text-purple-400" />
                        Comparisons ({comparisonItems.length})
                      </h4>
                      <div className="space-y-1.5">
                        {comparisonItems.map((item, index) => (
                          <div
                            key={`comparison-${item.id}-${index}`}
                            className="flex items-center gap-3 p-3 rounded-lg bg-theme-bg border border-purple-500/30 group"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-theme-text truncate block">
                                {item.title || "Comparison"}
                              </span>
                              {item.quoteIds && (
                                <span className="text-xs text-theme-text-muted">
                                  {item.quoteIds.length} properties
                                </span>
                              )}
                            </div>
                            <Badge className="bg-purple-500/20 text-purple-300 border-0">
                              Compare
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemoveItem(item)}
                              className="text-theme-text-muted hover:text-red-400 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-theme-border -mx-6 px-6">
          <span className="text-xs text-theme-text-muted">
            {items.length} item{items.length !== 1 ? 's' : ''} in presentation
          </span>
          <Button
            onClick={handleClose}
            className="bg-theme-accent text-white hover:bg-theme-accent/90"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
