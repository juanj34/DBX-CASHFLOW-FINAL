import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, GripVertical, Trash2, Save, Share2, Play, Eye, ChevronLeft, ChevronRight, FileText, GitCompare, LayoutGrid, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePresentations, PresentationItem, Presentation } from "@/hooks/usePresentations";
import { useQuotesList } from "@/hooks/useCashflowQuote";
import { useSavedComparisons } from "@/hooks/useSavedComparisons";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PresentationBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { presentations, updatePresentation, generateShareToken } = usePresentations();
  const { quotes, loading: quotesLoading } = useQuotesList();
  const { comparisons, loading: comparisonsLoading } = useSavedComparisons();
  
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<PresentationItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [addItemSheetOpen, setAddItemSheetOpen] = useState(false);
  
  useDocumentTitle(presentation?.title || "Presentation Builder");

  // Load presentation data
  useEffect(() => {
    const found = presentations.find(p => p.id === id);
    if (found) {
      setPresentation(found);
      setTitle(found.title);
      setDescription(found.description || "");
      setItems(found.items);
    }
  }, [id, presentations]);

  // Track changes
  useEffect(() => {
    if (!presentation) return;
    const changed = 
      title !== presentation.title ||
      description !== (presentation.description || "") ||
      JSON.stringify(items) !== JSON.stringify(presentation.items);
    setHasChanges(changed);
  }, [presentation, title, description, items]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const success = await updatePresentation(id, { title, description, items });
    setSaving(false);
    if (success) {
      setHasChanges(false);
      toast.success("Presentation saved");
    }
  };

  const handleShare = async () => {
    if (!id) return;
    const token = await generateShareToken(id);
    if (token) {
      const url = `${window.location.origin}/present/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard");
    }
  };

  const addItem = (type: 'quote' | 'comparison', itemId: string, title?: string) => {
    const newItem: PresentationItem = {
      type,
      id: itemId,
      viewMode: type === 'quote' ? 'story' : undefined,
      title,
    };
    setItems(prev => [...prev, newItem]);
    setAddItemSheetOpen(false);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemViewMode = (index: number, viewMode: 'story' | 'vertical' | 'compact') => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, viewMode } : item
    ));
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    setItems(prev => {
      const newItems = [...prev];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      return newItems;
    });
  };

  const getQuoteTitle = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return "Quote";
    return quote.project_name || quote.client_name || "Quote";
  };

  const getComparisonTitle = (comparisonId: string) => {
    const comparison = comparisons.find(c => c.id === comparisonId);
    return comparison?.title || "Comparison";
  };

  if (!presentation) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-theme-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-theme-card border-r border-theme-border flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-80"
      )}>
        {/* Sidebar Header */}
        <div className="h-14 border-b border-theme-border flex items-center justify-between px-4">
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/presentations")}
              className="text-theme-text-muted hover:text-theme-text -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 text-theme-text-muted hover:text-theme-text ml-auto"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Title & Description */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-theme-border space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Presentation title"
                className="bg-theme-bg border-theme-border text-theme-text h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-theme-text-muted">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                className="bg-theme-bg border-theme-border text-theme-text resize-none text-sm"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-theme-text-muted font-semibold">
                  Content ({items.length})
                </span>
                <Sheet open={addItemSheetOpen} onOpenChange={setAddItemSheetOpen}>
                  <SheetTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs border-theme-border text-theme-text-muted hover:text-theme-text">
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="bg-theme-card border-theme-border text-theme-text">
                    <SheetHeader>
                      <SheetTitle className="text-theme-text">Add Content</SheetTitle>
                      <SheetDescription className="text-theme-text-muted">
                        Select quotes or comparisons to add to your presentation.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      {/* Quotes Section */}
                      <div>
                        <h4 className="text-sm font-medium text-theme-text mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-theme-accent" />
                          Quotes
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {quotesLoading ? (
                            <p className="text-sm text-theme-text-muted">Loading...</p>
                          ) : quotes.length === 0 ? (
                            <p className="text-sm text-theme-text-muted">No quotes available</p>
                          ) : (
                            quotes.map(quote => (
                              <button
                                key={quote.id}
                                onClick={() => addItem('quote', quote.id, quote.project_name || quote.client_name || undefined)}
                                className="w-full text-left px-3 py-2 rounded-lg bg-theme-bg hover:bg-theme-bg/80 border border-theme-border hover:border-theme-accent/30 transition-colors"
                              >
                                <p className="text-sm font-medium text-theme-text truncate">
                                  {quote.project_name || "Untitled Quote"}
                                </p>
                                <p className="text-xs text-theme-text-muted">
                                  {quote.client_name || "No client"} • {quote.unit_type || "Unit"}
                                </p>
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Comparisons Section */}
                      <div>
                        <h4 className="text-sm font-medium text-theme-text mb-3 flex items-center gap-2">
                          <GitCompare className="w-4 h-4 text-purple-400" />
                          Comparisons
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {comparisonsLoading ? (
                            <p className="text-sm text-theme-text-muted">Loading...</p>
                          ) : comparisons.length === 0 ? (
                            <p className="text-sm text-theme-text-muted">No comparisons saved</p>
                          ) : (
                            comparisons.map(comparison => (
                              <button
                                key={comparison.id}
                                onClick={() => addItem('comparison', comparison.id, comparison.title)}
                                className="w-full text-left px-3 py-2 rounded-lg bg-theme-bg hover:bg-theme-bg/80 border border-theme-border hover:border-theme-accent/30 transition-colors"
                              >
                                <p className="text-sm font-medium text-theme-text truncate">
                                  {comparison.title}
                                </p>
                                <p className="text-xs text-theme-text-muted">
                                  {comparison.quote_ids.length} quotes compared
                                </p>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 text-theme-text-muted">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No content added yet</p>
                  <p className="text-xs mt-1">Click "Add" to include quotes or comparisons</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={`${item.type}-${item.id}-${index}`}
                      className="group flex items-center gap-2 p-2 rounded-lg bg-theme-bg border border-theme-border hover:border-theme-accent/30 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveItem(index, index - 1)}
                          disabled={index === 0}
                          className="p-0.5 text-theme-text-muted hover:text-theme-text disabled:opacity-30"
                        >
                          <ChevronLeft className="w-3 h-3 rotate-90" />
                        </button>
                        <button
                          onClick={() => moveItem(index, index + 1)}
                          disabled={index === items.length - 1}
                          className="p-0.5 text-theme-text-muted hover:text-theme-text disabled:opacity-30"
                        >
                          <ChevronRight className="w-3 h-3 rotate-90" />
                        </button>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {item.type === 'quote' ? (
                            <FileText className="w-3.5 h-3.5 text-theme-accent flex-shrink-0" />
                          ) : (
                            <GitCompare className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          )}
                          <span className="text-sm text-theme-text truncate">
                            {item.type === 'quote' 
                              ? getQuoteTitle(item.id)
                              : getComparisonTitle(item.id)
                            }
                          </span>
                        </div>
                        {item.type === 'quote' && (
                          <Select
                            value={item.viewMode || 'story'}
                            onValueChange={(v) => updateItemViewMode(index, v as 'story' | 'vertical' | 'compact')}
                          >
                            <SelectTrigger className="h-6 mt-1 text-xs bg-transparent border-none text-theme-text-muted p-0 focus:ring-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-theme-card border-theme-border">
                              <SelectItem value="story">Story View</SelectItem>
                              <SelectItem value="vertical">Vertical View</SelectItem>
                              <SelectItem value="compact">Compact View</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removeItem(index)}
                        className="p-1 text-theme-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className={cn(
          "border-t border-theme-border",
          sidebarCollapsed ? "p-2" : "p-4"
        )}>
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="h-10 w-10 bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex-1 bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : hasChanges ? "Save Changes" : "Saved"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                className="border-theme-border text-theme-text-muted hover:text-theme-text"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              {presentation.share_token && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(`/present/${presentation.share_token}`, '_blank')}
                  className="border-theme-border text-theme-text-muted hover:text-theme-text"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content - Preview Area */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
              <Play className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-theme-text mb-2">Presentation Preview</h2>
            <p className="text-theme-text-muted mb-6">
              Add quotes and comparisons from the sidebar, then share your presentation with clients.
            </p>
            {items.length > 0 && presentation.share_token && (
              <Button
                onClick={() => window.open(`/present/${presentation.share_token}`, '_blank')}
                className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90"
              >
                <Play className="w-4 h-4 mr-2" />
                Preview Presentation
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PresentationBuilder;
