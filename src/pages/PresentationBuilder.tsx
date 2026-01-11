import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, Plus, Trash2, Share2, 
  FileText, GitCompare, ChevronDown, ChevronUp, GripVertical,
  Settings, Layers, BookOpen, Eye, TrendingUp, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePresentations, PresentationItem, Presentation } from "@/hooks/usePresentations";
import { useQuotesList } from "@/hooks/useCashflowQuote";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/components/AppLogo";

// Drag and drop
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Presentation components
import { 
  AddQuoteModal, 
  CreateComparisonModal, 
  ConfigurePresentationModal,
  PresentationPreview,
  QuoteToAdd 
} from "@/components/presentation";
import { PresentationAnalyticsModal } from "@/components/presentation/PresentationAnalyticsModal";

// Sortable sidebar item wrapper
const SortableItem = ({ 
  children,
  id,
}: { 
  children: React.ReactNode;
  id: string;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 p-1 cursor-grab opacity-0 group-hover/sortable:opacity-100 transition-opacity text-theme-text-muted hover:text-theme-text"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      {children}
    </div>
  );
};

const PresentationBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { presentations, updatePresentation, generateShareToken } = usePresentations();
  const { quotes, loading: quotesLoading } = useQuotesList();
  
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<PresentationItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Modal states
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [addQuoteModalOpen, setAddQuoteModalOpen] = useState(false);
  const [createComparisonModalOpen, setCreateComparisonModalOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  
  // Preview state
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  
  // Section collapsed states
  const [quotesOpen, setQuotesOpen] = useState(true);
  const [comparisonsOpen, setComparisonsOpen] = useState(true);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  
  useDocumentTitle(presentation?.title || "Presentation Builder");

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Auto-save when items change
  useEffect(() => {
    if (!id || !presentation || !hasChanges) return;
    
    const timeoutId = setTimeout(async () => {
      await updatePresentation(id, { title, description, items });
      setHasChanges(false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [id, presentation, title, description, items, hasChanges, updatePresentation]);

  // Group items by type
  const quoteItems = items.filter(item => item.type === 'quote');
  const comparisonItems = items.filter(item => item.type === 'comparison' || item.type === 'inline_comparison');

  // Generate unique IDs for sortable items
  const getItemUniqueId = (item: PresentationItem, index: number) => `${item.type}-${item.id}-${item.viewMode || ''}-${index}`;

  // All item IDs for sortable context
  const allItemIds = items.map((item, index) => getItemUniqueId(item, index));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = allItemIds.indexOf(active.id as string);
      const newIndex = allItemIds.indexOf(over.id as string);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setItems(prev => arrayMove(prev, oldIndex, newIndex));
      }
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

  // Save from config modal
  const handleConfigSave = async (newTitle: string, newDescription: string) => {
    setTitle(newTitle);
    setDescription(newDescription);
    if (id) {
      await updatePresentation(id, { title: newTitle, description: newDescription, items });
      setHasChanges(false);
    }
  };

  // Add quotes from modal
  const handleAddQuotes = (quotesToAdd: QuoteToAdd[]) => {
    const newItems: PresentationItem[] = quotesToAdd.map(q => ({
      type: 'quote' as const,
      id: q.quoteId,
      viewMode: q.viewMode,
      title: q.title,
    }));
    setItems(prev => [...prev, ...newItems]);
  };

  // Create inline comparison
  const handleCreateComparison = (comparisonTitle: string, quoteIds: string[]) => {
    const newItem: PresentationItem = {
      type: 'inline_comparison',
      id: crypto.randomUUID(),
      title: comparisonTitle,
      quoteIds,
    };
    setItems(prev => [...prev, newItem]);
    toast.success("Comparison created");
  };

  const removeItem = (itemToRemove: PresentationItem) => {
    const index = items.findIndex((item, i) => 
      getItemUniqueId(item, i) === getItemUniqueId(itemToRemove, items.indexOf(itemToRemove))
    );
    if (index !== -1) {
      setItems(prev => prev.filter((_, i) => i !== index));
      // Adjust preview index if needed
      if (selectedPreviewIndex >= items.length - 1) {
        setSelectedPreviewIndex(Math.max(0, items.length - 2));
      }
    }
  };

  // Toggle view mode for a quote item
  const toggleViewMode = useCallback((itemToToggle: PresentationItem) => {
    setItems(prev => prev.map((item, i) => {
      if (item.type === 'quote' && item.id === itemToToggle.id && item.viewMode === itemToToggle.viewMode) {
        return { 
          ...item, 
          viewMode: item.viewMode === 'story' ? 'vertical' : 'story' 
        };
      }
      return item;
    }));
  }, []);

  const getQuoteTitle = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return "Quote";
    return quote.project_name || quote.client_name || "Quote";
  };

  const getQuoteDetails = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return null;
    
    const details: string[] = [];
    if (quote.unit) details.push(quote.unit);
    if (quote.unit_type) details.push(quote.unit_type);
    if (quote.unit_size_sqf) details.push(`${quote.unit_size_sqf.toLocaleString()} sqft`);
    
    return details.length > 0 ? details.join(' • ') : null;
  };

  const getItemIndex = (item: PresentationItem) => {
    return items.findIndex((i, idx) => getItemUniqueId(i, idx) === getItemUniqueId(item, items.indexOf(item)));
  };

  const selectItem = (item: PresentationItem) => {
    const index = items.indexOf(item);
    if (index !== -1) {
      setSelectedPreviewIndex(index);
    }
  };

  const existingQuoteIds = items
    .filter(item => item.type === 'quote')
    .map(item => item.id);

  // Get the active item for drag overlay
  const getActiveItem = () => {
    if (!activeId) return null;
    const index = allItemIds.indexOf(activeId);
    return index !== -1 ? items[index] : null;
  };

  const activeItem = getActiveItem();

  if (!presentation) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-theme-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  // Sidebar Item Component
  const SidebarItemContent = ({ item }: { item: PresentationItem }) => {
    const itemIndex = items.indexOf(item);
    const isSelected = itemIndex === selectedPreviewIndex;
    const isComparison = item.type === 'comparison' || item.type === 'inline_comparison';
    
    return (
      <div
        className={cn(
          "group flex items-center gap-2 p-2 pl-6 rounded-lg border transition-all cursor-pointer",
          isSelected
            ? isComparison
              ? "border-purple-500/50 bg-purple-500/10"
              : "border-theme-accent/50 bg-theme-accent/10"
            : "border-transparent hover:border-theme-border hover:bg-theme-bg/50"
        )}
        onClick={() => selectItem(item)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isComparison ? (
              <GitCompare className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-theme-accent flex-shrink-0" />
            )}
            <span className="text-sm text-theme-text truncate">
              {item.title || (item.type === 'quote' ? getQuoteTitle(item.id) : "Comparison")}
            </span>
          </div>
          {item.type === 'quote' && (
            <div className="mt-0.5 ml-5 text-[10px] text-theme-text-muted truncate">
              {getQuoteDetails(item.id) || 'No unit details'}
            </div>
          )}
          {item.type === 'quote' && (
            <div className="mt-0.5 pl-5 flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleViewMode(item);
                }}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded transition-colors",
                  item.viewMode === 'story' 
                    ? "bg-theme-accent/20 text-theme-accent" 
                    : "bg-theme-border/50 text-theme-text-muted hover:bg-theme-accent/10"
                )}
              >
                <BookOpen className="w-3 h-3 inline mr-0.5" />
                Showcase
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleViewMode(item);
                }}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded transition-colors",
                  item.viewMode === 'vertical' 
                    ? "bg-theme-accent/20 text-theme-accent" 
                    : "bg-theme-border/50 text-theme-text-muted hover:bg-theme-accent/10"
                )}
              >
                <BarChart3 className="w-3 h-3 inline mr-0.5" />
                Cashflow
              </button>
            </div>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeItem(item);
          }}
          className="p-1 text-theme-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // Section Header Component
  const SectionHeader = ({ 
    label, 
    count, 
    isOpen, 
    onToggle,
    accentColor = "theme-accent"
  }: { 
    label: string; 
    count: number; 
    isOpen: boolean; 
    onToggle: () => void;
    accentColor?: string;
  }) => (
    <CollapsibleTrigger asChild onClick={onToggle}>
      <button className="w-full flex items-center justify-between py-2 text-xs uppercase tracking-wider text-theme-text-muted font-semibold hover:text-theme-text transition-colors">
        <span className="flex items-center gap-2">
          {label}
          {count > 0 && (
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium",
              accentColor === "purple" 
                ? "bg-purple-500/20 text-purple-300" 
                : "bg-theme-accent/20 text-theme-accent"
            )}>
              {count}
            </span>
          )}
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
    </CollapsibleTrigger>
  );

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col">
      {/* Top Header */}
      <header className="h-14 border-b border-theme-border bg-theme-card flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <AppLogo size="sm" showGlow={false} />
          
          <div className="h-6 w-px bg-theme-border" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/presentations")}
            className="text-theme-text-muted hover:text-theme-text -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Presentations
          </Button>
          
          <div className="h-6 w-px bg-theme-border hidden sm:block" />
          
          <h1 className="text-sm font-medium text-theme-text truncate max-w-[200px] hidden sm:block">
            {title || "Untitled Presentation"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Nav shortcuts */}
          <TooltipProvider>
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: "Home", href: "/home" },
                { label: "All Quotes", href: "/my-quotes" },
                { label: "Compare", href: "/compare" },
                { label: "Analytics", href: "/quotes-analytics" },
              ].map((shortcut) => (
                <Tooltip key={shortcut.href}>
                  <TooltipTrigger asChild>
                    <Link
                      to={shortcut.href}
                      className="px-2 py-1.5 rounded-lg text-xs text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors"
                    >
                      {shortcut.label}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-theme-card border-theme-border text-theme-text">
                    {shortcut.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          <div className="h-6 w-px bg-theme-border hidden md:block" />

          {/* Configure Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfigModalOpen(true)}
            className="border-theme-border text-theme-text-muted hover:text-theme-text"
          >
            <Settings className="w-4 h-4 mr-1.5" />
            Configure
          </Button>

          {/* Analytics Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAnalyticsModalOpen(true)}
                  className="border-theme-border text-theme-text-muted hover:text-theme-text h-9 w-9"
                >
                  <TrendingUp className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-theme-card border-theme-border text-theme-text">
                View Analytics
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Share Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="border-theme-border text-theme-text-muted hover:text-theme-text"
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            Share
          </Button>

          {/* View Shared Link */}
          {presentation.share_token && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(`/present/${presentation.share_token}`, '_blank')}
                    className="border-theme-border text-theme-text-muted hover:text-theme-text h-9 w-9"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-theme-card border-theme-border text-theme-text">
                  View Shared Presentation
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-theme-card border-r border-theme-border flex flex-col">
          {/* Add Buttons */}
          <div className="p-3 border-b border-theme-border">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddQuoteModalOpen(true)}
                className="flex-1 border-theme-accent/50 text-theme-accent hover:bg-theme-accent/10"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Quote
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateComparisonModalOpen(true)}
                className="flex-1 border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              >
                <GitCompare className="w-3.5 h-3.5 mr-1.5" />
                Compare
              </Button>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {/* Quotes Section */}
                  <Collapsible open={quotesOpen} onOpenChange={setQuotesOpen}>
                    <SectionHeader 
                      label="Quotes" 
                      count={quoteItems.length} 
                      isOpen={quotesOpen}
                      onToggle={() => setQuotesOpen(!quotesOpen)}
                    />
                    <CollapsibleContent className="space-y-1 pb-3">
                      {quoteItems.length === 0 ? (
                        <p className="text-xs text-theme-text-muted py-2 pl-2">No quotes added</p>
                      ) : (
                        quoteItems.map((item) => {
                          const originalIndex = items.indexOf(item);
                          const uniqueId = getItemUniqueId(item, originalIndex);
                          return (
                            <SortableItem key={uniqueId} id={uniqueId}>
                              <SidebarItemContent item={item} />
                            </SortableItem>
                          );
                        })
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Comparisons Section */}
                  <Collapsible open={comparisonsOpen} onOpenChange={setComparisonsOpen}>
                    <SectionHeader 
                      label="Comparisons" 
                      count={comparisonItems.length} 
                      isOpen={comparisonsOpen}
                      onToggle={() => setComparisonsOpen(!comparisonsOpen)}
                      accentColor="purple"
                    />
                    <CollapsibleContent className="space-y-1 pb-3">
                      {comparisonItems.length === 0 ? (
                        <p className="text-xs text-theme-text-muted py-2 pl-2">No comparisons added</p>
                      ) : (
                        comparisonItems.map((item) => {
                          const originalIndex = items.indexOf(item);
                          const uniqueId = getItemUniqueId(item, originalIndex);
                          return (
                            <SortableItem key={uniqueId} id={uniqueId}>
                              <SidebarItemContent item={item} />
                            </SortableItem>
                          );
                        })
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Empty State */}
                  {items.length === 0 && (
                    <div className="text-center py-8 text-theme-text-muted">
                      <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No content added yet</p>
                      <p className="text-xs mt-1">Add quotes or create comparisons</p>
                    </div>
                  )}
                </div>
              </SortableContext>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeItem ? (
                  <div className="bg-theme-card border border-theme-accent rounded-lg p-2 shadow-lg">
                    <div className="flex items-center gap-2">
                      {activeItem.type === 'comparison' || activeItem.type === 'inline_comparison' ? (
                        <GitCompare className="w-3.5 h-3.5 text-purple-400" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-theme-accent" />
                      )}
                      <span className="text-sm text-theme-text">
                        {activeItem.title || (activeItem.type === 'quote' ? getQuoteTitle(activeItem.id) : "Comparison")}
                      </span>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </aside>

        {/* Main Content - Live Preview */}
        <main className="flex-1 overflow-hidden">
          <PresentationPreview
            items={items}
            selectedIndex={selectedPreviewIndex}
            onSelectIndex={setSelectedPreviewIndex}
            quotes={quotes}
          />
        </main>
      </div>

      {/* Modals */}
      <ConfigurePresentationModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        title={title}
        description={description}
        items={items}
        onSave={handleConfigSave}
        onOpenAddQuotes={() => {
          setConfigModalOpen(false);
          setTimeout(() => setAddQuoteModalOpen(true), 150);
        }}
        onOpenCreateComparison={() => {
          setConfigModalOpen(false);
          setTimeout(() => setCreateComparisonModalOpen(true), 150);
        }}
        onRemoveItem={removeItem}
        onToggleViewMode={toggleViewMode}
        getQuoteTitle={getQuoteTitle}
      />

      <AddQuoteModal
        open={addQuoteModalOpen}
        onClose={() => setAddQuoteModalOpen(false)}
        onAddQuotes={handleAddQuotes}
        existingQuoteIds={existingQuoteIds}
      />

      <CreateComparisonModal
        open={createComparisonModalOpen}
        onClose={() => setCreateComparisonModalOpen(false)}
        onCreateComparison={handleCreateComparison}
        presentationQuoteIds={existingQuoteIds}
      />

      <PresentationAnalyticsModal
        open={analyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
        presentationId={id || ''}
        presentationTitle={title}
      />
    </div>
  );
};

export default PresentationBuilder;
