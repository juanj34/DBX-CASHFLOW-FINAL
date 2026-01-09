import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Plus, Trash2, Save, Share2, Eye, ChevronLeft, ChevronRight, 
  FileText, GitCompare, Layers, ChevronDown, ChevronUp, GripVertical,
  Maximize2, X, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePresentations, PresentationItem, Presentation } from "@/hooks/usePresentations";
import { useQuotesList } from "@/hooks/useCashflowQuote";
import { useSavedComparisons } from "@/hooks/useSavedComparisons";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

// New presentation components
import { 
  AddQuoteModal, 
  CreateComparisonModal, 
  PresentationPreview,
  QuoteToAdd 
} from "@/components/presentation";

// Sortable sidebar item wrapper
const SortableItem = ({ 
  item, 
  children,
  id,
}: { 
  item: PresentationItem;
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
  const { comparisons, loading: comparisonsLoading } = useSavedComparisons();
  
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<PresentationItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Modal states
  const [addQuoteModalOpen, setAddQuoteModalOpen] = useState(false);
  const [createComparisonModalOpen, setCreateComparisonModalOpen] = useState(false);
  
  // Preview state
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  
  // Section collapsed states
  const [showcasesOpen, setShowcasesOpen] = useState(true);
  const [cashflowsOpen, setCashflowsOpen] = useState(true);
  const [comparisonsOpen, setComparisonsOpen] = useState(true);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);

  // Fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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

  // Fullscreen keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (isFullscreen) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSelectedPreviewIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSelectedPreviewIndex(prev => Math.min(items.length - 1, prev + 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, items.length]);

  // Group items by type and viewMode
  const showcaseItems = items.filter(item => item.type === 'quote' && item.viewMode === 'story');
  const cashflowItems = items.filter(item => item.type === 'quote' && item.viewMode === 'vertical');
  const comparisonItems = items.filter(item => item.type === 'comparison' || item.type === 'inline_comparison');

  // Generate unique IDs for sortable items
  const getItemUniqueId = (item: PresentationItem, index: number) => `${item.type}-${item.id}-${index}`;

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
    const index = items.findIndex(item => 
      item.type === itemToRemove.type && item.id === itemToRemove.id
    );
    if (index !== -1) {
      setItems(prev => prev.filter((_, i) => i !== index));
      // Adjust preview index if needed
      if (selectedPreviewIndex >= items.length - 1) {
        setSelectedPreviewIndex(Math.max(0, items.length - 2));
      }
    }
  };

  const updateItemViewMode = (itemToUpdate: PresentationItem, newViewMode: 'story' | 'vertical') => {
    setItems(prev => prev.map(item => 
      item.type === itemToUpdate.type && item.id === itemToUpdate.id
        ? { ...item, viewMode: newViewMode }
        : item
    ));
  };

  const getQuoteTitle = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return "Quote";
    return quote.project_name || quote.client_name || "Quote";
  };

  const getItemIndex = (item: PresentationItem) => {
    return items.findIndex(i => i.type === item.type && i.id === item.id);
  };

  const selectItem = (item: PresentationItem) => {
    const index = getItemIndex(item);
    if (index !== -1) {
      setSelectedPreviewIndex(index);
    }
  };

  const existingQuoteIds = items
    .filter(item => item.type === 'quote')
    .map(item => item.id);

  if (!presentation) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-theme-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  // Sidebar Item Component
  const SidebarItemContent = ({ item, showViewModeSelector = false }: { item: PresentationItem; showViewModeSelector?: boolean }) => {
    const isSelected = getItemIndex(item) === selectedPreviewIndex;
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
          {showViewModeSelector && item.type === 'quote' && (
            <div className="mt-1 pl-5" onClick={(e) => e.stopPropagation()}>
              <Select
                value={item.viewMode || 'story'}
                onValueChange={(v) => updateItemViewMode(item, v as 'story' | 'vertical')}
              >
                <SelectTrigger className="h-6 text-xs bg-transparent border-none text-theme-text-muted p-0 focus:ring-0 w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-theme-card border-theme-border">
                  <SelectItem value="story">Showcase</SelectItem>
                  <SelectItem value="vertical">Cashflow</SelectItem>
                </SelectContent>
              </Select>
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

  // Get the active item for drag overlay
  const getActiveItem = () => {
    if (!activeId) return null;
    const index = allItemIds.indexOf(activeId);
    return index !== -1 ? items[index] : null;
  };

  const activeItem = getActiveItem();

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

        {/* Items List - Grouped with Drag and Drop */}
        <div className="flex-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
                <div className="p-4 space-y-1">
                  {/* Showcases Section */}
                  <Collapsible open={showcasesOpen} onOpenChange={setShowcasesOpen}>
                    <SectionHeader 
                      label="Showcases" 
                      count={showcaseItems.length} 
                      isOpen={showcasesOpen}
                      onToggle={() => setShowcasesOpen(!showcasesOpen)}
                    />
                    <CollapsibleContent className="space-y-1 pb-3">
                      {showcaseItems.length === 0 ? (
                        <p className="text-xs text-theme-text-muted py-2 pl-2">No showcases added</p>
                      ) : (
                        showcaseItems.map((item) => {
                          const originalIndex = items.findIndex(i => i.type === item.type && i.id === item.id);
                          const uniqueId = getItemUniqueId(item, originalIndex);
                          return (
                            <SortableItem key={uniqueId} item={item} id={uniqueId}>
                              <SidebarItemContent item={item} />
                            </SortableItem>
                          );
                        })
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Cashflows Section */}
                  <Collapsible open={cashflowsOpen} onOpenChange={setCashflowsOpen}>
                    <SectionHeader 
                      label="Cashflows" 
                      count={cashflowItems.length} 
                      isOpen={cashflowsOpen}
                      onToggle={() => setCashflowsOpen(!cashflowsOpen)}
                    />
                    <CollapsibleContent className="space-y-1 pb-3">
                      {cashflowItems.length === 0 ? (
                        <p className="text-xs text-theme-text-muted py-2 pl-2">No cashflows added</p>
                      ) : (
                        cashflowItems.map((item) => {
                          const originalIndex = items.findIndex(i => i.type === item.type && i.id === item.id);
                          const uniqueId = getItemUniqueId(item, originalIndex);
                          return (
                            <SortableItem key={uniqueId} item={item} id={uniqueId}>
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
                          const originalIndex = items.findIndex(i => i.type === item.type && i.id === item.id);
                          const uniqueId = getItemUniqueId(item, originalIndex);
                          return (
                            <SortableItem key={uniqueId} item={item} id={uniqueId}>
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
          )}
        </div>

        {/* Add Buttons */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-t border-theme-border">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddQuoteModalOpen(true)}
                className="flex-1 border-theme-border text-theme-text hover:bg-theme-accent/10 hover:border-theme-accent/50"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Quote
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateComparisonModalOpen(true)}
                className="flex-1 border-theme-border text-theme-text hover:bg-purple-500/10 hover:border-purple-500/50"
              >
                <GitCompare className="w-3.5 h-3.5 mr-1.5" />
                Compare
              </Button>
            </div>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className={cn(
          "border-t border-theme-border",
          sidebarCollapsed ? "p-2" : "p-4"
        )}>
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                onClick={() => setIsFullscreen(true)}
                disabled={items.length === 0}
                className="h-10 w-10 bg-purple-600 text-white hover:bg-purple-700"
              >
                <Play className="w-4 h-4" />
              </Button>
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
            <div className="space-y-2">
              {/* Present Button */}
              <Button
                onClick={() => setIsFullscreen(true)}
                disabled={items.length === 0}
                className="w-full bg-purple-600 text-white hover:bg-purple-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Present
              </Button>
              
              {/* Save & Share Row */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="flex-1 bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : hasChanges ? "Save" : "Saved"}
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
            </div>
          )}
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

      {/* Modals */}
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
      />

      {/* Fullscreen Presentation Mode */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-theme-bg flex flex-col">
          {/* Fullscreen Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-3">
              <span className="text-white/70 text-sm">
                {selectedPreviewIndex + 1} / {items.length}
              </span>
              <span className="text-white font-medium">
                {title || "Presentation"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Fullscreen Content */}
          <div className="flex-1 overflow-hidden">
            <PresentationPreview
              items={items}
              selectedIndex={selectedPreviewIndex}
              onSelectIndex={setSelectedPreviewIndex}
              quotes={quotes}
            />
          </div>

          {/* Fullscreen Navigation */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-4 p-6 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setSelectedPreviewIndex(prev => Math.max(0, prev - 1))}
              disabled={selectedPreviewIndex === 0}
              className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            <div className="flex items-center gap-2">
              {items.map((item, index) => (
                <button
                  key={`fullscreen-dot-${item.type}-${item.id}-${index}`}
                  onClick={() => setSelectedPreviewIndex(index)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    index === selectedPreviewIndex
                      ? item.type === 'comparison' || item.type === 'inline_comparison'
                        ? "bg-purple-500 scale-125"
                        : "bg-theme-accent scale-125"
                      : "bg-white/30 hover:bg-white/50"
                  )}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => setSelectedPreviewIndex(prev => Math.min(items.length - 1, prev + 1))}
              disabled={selectedPreviewIndex === items.length - 1}
              className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          {/* Keyboard hints */}
          <div className="absolute bottom-4 right-4 text-white/40 text-xs">
            ESC to exit • ← → to navigate
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationBuilder;