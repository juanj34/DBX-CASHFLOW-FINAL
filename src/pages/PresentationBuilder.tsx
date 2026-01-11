import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Plus, Trash2, Share2, 
  FileText, GitCompare, ChevronDown, ChevronUp, GripVertical,
  Settings, Layers, Eye, TrendingUp, BarChart3,
  ChevronLeft, ChevronRight, FolderOpen, Pencil, LayoutDashboard,
  LayoutGrid, Presentation, Sparkles
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
import { usePresentations, PresentationItem, Presentation as PresentationType } from "@/hooks/usePresentations";
import { useQuotesList } from "@/hooks/useCashflowQuote";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useProfile } from "@/hooks/useProfile";
import { AdvisorInfo } from "@/components/roi/AdvisorInfo";
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

// Presentation components
import { 
  AddQuoteModal, 
  CreateComparisonModal, 
  ConfigurePresentationModal,
  PresentationPreview,
  LoadPresentationModal,
  QuoteToAdd 
} from "@/components/presentation";
import { PresentationAnalyticsModal } from "@/components/presentation/PresentationAnalyticsModal";

// App Logo Component (matching DashboardSidebar)
const AppLogo = ({ collapsed }: { collapsed: boolean }) => (
  <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-2")}>
    <div className="relative flex-shrink-0">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-purple-500 to-[#CCFF00] p-[2px]">
        <div className="w-full h-full rounded-lg bg-theme-card flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <path 
              d="M12 2L2 7L12 12L22 7L12 2Z" 
              stroke="url(#presentation-logo-gradient)" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M2 17L12 22L22 17" 
              stroke="url(#presentation-logo-gradient)" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M2 12L12 17L22 12" 
              stroke="url(#presentation-logo-gradient)" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="presentation-logo-gradient" x1="2" y1="2" x2="22" y2="22">
                <stop stopColor="#00EAFF" />
                <stop offset="0.5" stopColor="#A855F7" />
                <stop offset="1" stopColor="#CCFF00" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
    {!collapsed && (
      <span className="text-sm font-bold tracking-tight">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-[#CCFF00]">Dubai</span>
        <span className="text-theme-text">Invest</span>
        <span className="text-[#CCFF00]">Pro</span>
      </span>
    )}
  </div>
);

// Section Header Component for sidebar sections
const SidebarSectionHeader = ({ label, collapsed }: { label: string; collapsed: boolean }) => {
  if (collapsed) return null;
  return (
    <div className="px-3 pt-4 pb-2">
      <span className="text-[10px] uppercase tracking-wider text-theme-text-muted/60 font-semibold">
        {label}
      </span>
    </div>
  );
};

// Action Button Component (matching DashboardSidebar pattern)
const ActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  collapsed,
  variant = 'default',
  badge,
  to,
  isActive = false,
}: { 
  icon: typeof Settings;
  label: string;
  onClick?: () => void;
  collapsed: boolean;
  variant?: 'default' | 'primary';
  badge?: number | string;
  to?: string;
  isActive?: boolean;
}) => {
  const baseStyles = cn(
    "w-full flex items-center rounded-lg text-sm font-medium transition-all relative",
    collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5"
  );
  
  const variantStyles = variant === 'primary'
    ? "bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
    : isActive 
      ? "text-theme-text bg-theme-bg/50"
      : "text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50";

  const content = (
    <button onClick={onClick} className={cn(baseStyles, variantStyles)}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!collapsed && badge != null && (
        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
          {badge}
        </span>
      )}
      {collapsed && badge != null && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-cyan-500 text-[10px] text-white rounded-full flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </button>
  );

  if (to) {
    return (
      <Link to={to}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ) : content}
      </Link>
    );
  }

  return collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">
        {label}{badge != null ? ` (${badge})` : ''}
      </TooltipContent>
    </Tooltip>
  ) : content;
};

// Sortable sidebar item wrapper with improved drag handle visibility
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
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "relative group/sortable",
        isDragging && "ring-2 ring-theme-accent/50 rounded-lg"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 p-1.5 cursor-grab rounded transition-all",
          "text-theme-text-muted hover:text-theme-accent hover:bg-theme-accent/10",
          "opacity-40 group-hover/sortable:opacity-100"
        )}
      >
        <GripVertical className="w-4 h-4" />
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
  const { profile } = useProfile();
  
  const [presentation, setPresentation] = useState<PresentationType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<PresentationItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Modal states
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [addQuoteModalOpen, setAddQuoteModalOpen] = useState(false);
  const [createComparisonModalOpen, setCreateComparisonModalOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  
  // Section collapsed states
  const [quotesOpen, setQuotesOpen] = useState(true);
  const [comparisonsOpen, setComparisonsOpen] = useState(true);
  const [navigateOpen, setNavigateOpen] = useState(false); // Collapsed by default

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

  // Sidebar Item Component - Compact version with icon toggle for view mode
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
        {/* Icon */}
        {isComparison ? (
          <GitCompare className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-theme-accent flex-shrink-0" />
        )}
        
        {/* Title and details */}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-theme-text truncate block">
            {item.title || (item.type === 'quote' ? getQuoteTitle(item.id) : "Comparison")}
          </span>
          {item.type === 'quote' && !sidebarCollapsed && (
            <span className="text-[10px] text-theme-text-muted truncate block">
              {getQuoteDetails(item.id) || 'No unit details'}
            </span>
          )}
        </div>

        {/* View mode toggle - compact icon button for quotes */}
        {item.type === 'quote' && !sidebarCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleViewMode(item);
                }}
                className={cn(
                  "p-1 rounded transition-colors",
                  item.viewMode === 'story' 
                    ? "text-theme-accent bg-theme-accent/10" 
                    : "text-theme-text-muted hover:text-theme-text"
                )}
              >
                {item.viewMode === 'story' ? (
                  <Sparkles className="w-3.5 h-3.5" />
                ) : (
                  <BarChart3 className="w-3.5 h-3.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {item.viewMode === 'story' ? 'Showcase mode' : 'Cashflow mode'} - Click to toggle
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Edit button - only for quotes */}
        {item.type === 'quote' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/cashflow-dashboard/${item.id}`, '_blank');
            }}
            className="p-1 text-theme-text-muted hover:text-theme-accent opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        
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

  // Section Header Component for collapsible content sections
  const ContentSectionHeader = ({ 
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
    <TooltipProvider>
      <div className="h-screen bg-theme-bg flex overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={cn(
            "bg-theme-card border-r border-theme-border flex flex-col h-full transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          {/* Logo + Collapse Toggle */}
          <div className={cn(
            "h-14 border-b border-theme-border flex items-center px-3 flex-shrink-0",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}>
            <AppLogo collapsed={sidebarCollapsed} />
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(true)}
                className="h-7 w-7 text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Expand button when collapsed */}
          {sidebarCollapsed && (
            <div className="py-2 flex justify-center border-b border-theme-border flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(false)}
                className="h-7 w-7 text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Agent Thumbnail */}
          {profile && (
            <Link to="/account-settings" className="block flex-shrink-0">
              <div className={cn(
                "border-b border-theme-border hover:bg-theme-bg/50 transition-colors cursor-pointer",
                sidebarCollapsed ? "p-2 flex justify-center" : "p-3"
              )}>
                {sidebarCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2a3142] ring-2 ring-[#CCFF00]/30">
                        {profile.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt={profile.full_name || 'Advisor'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-theme-text-muted text-xs font-medium">
                            {profile.full_name?.charAt(0) || 'A'}
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <div>
                        <p className="font-medium">{profile.full_name}</p>
                        <p className="text-xs text-muted-foreground">Wealth Advisor</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <AdvisorInfo profile={profile} size="sm" showSubtitle />
                )}
              </div>
            </Link>
          )}

          {/* Add Buttons - At top, after agent thumbnail */}
          <div className="p-3 border-b border-theme-border flex-shrink-0">
            <div className={cn("flex gap-2", sidebarCollapsed && "flex-col")}>
              {sidebarCollapsed ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAddQuoteModalOpen(true)}
                        className="w-10 h-10 text-theme-accent hover:bg-theme-accent/10"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Add Quote</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCreateComparisonModalOpen(true)}
                        className="w-10 h-10 text-purple-400 hover:bg-purple-500/10"
                      >
                        <GitCompare className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Create Comparison</TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddQuoteModalOpen(true)}
                    className="flex-1 text-theme-accent hover:bg-theme-accent/10 h-8"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">Quote</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreateComparisonModalOpen(true)}
                    className="flex-1 text-purple-400 hover:bg-purple-500/10 h-8"
                  >
                    <GitCompare className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">Compare</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Scrollable Content Area - Only this section scrolls */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Quotes & Comparisons */}
            <div className={cn("px-3 py-2", sidebarCollapsed && "px-2")}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {/* Quotes Section */}
                    {!sidebarCollapsed ? (
                      <Collapsible open={quotesOpen} onOpenChange={setQuotesOpen}>
                        <ContentSectionHeader 
                          label="Quotes" 
                          count={quoteItems.length} 
                          isOpen={quotesOpen}
                          onToggle={() => setQuotesOpen(!quotesOpen)}
                        />
                        <CollapsibleContent className="space-y-1 pb-2">
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
                          
                          {/* Create Comparison from quotes */}
                          <button
                            onClick={() => setCreateComparisonModalOpen(true)}
                            className="w-full flex items-center gap-2 mt-2 px-2 py-1.5 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded transition-colors"
                          >
                            <GitCompare className="w-3 h-3" />
                            <span>Create Comparison</span>
                          </button>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50 relative">
                            <FileText className="w-4 h-4" />
                            {quoteItems.length > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-theme-accent text-[10px] text-theme-bg rounded-full flex items-center justify-center px-1">
                                {quoteItems.length}
                              </span>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Quotes ({quoteItems.length})</TooltipContent>
                      </Tooltip>
                    )}

                    {/* Comparisons Section */}
                    {!sidebarCollapsed ? (
                      <Collapsible open={comparisonsOpen} onOpenChange={setComparisonsOpen}>
                        <ContentSectionHeader 
                          label="Comparisons" 
                          count={comparisonItems.length} 
                          isOpen={comparisonsOpen}
                          onToggle={() => setComparisonsOpen(!comparisonsOpen)}
                          accentColor="purple"
                        />
                        <CollapsibleContent className="space-y-1 pb-2">
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
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50 relative">
                            <GitCompare className="w-4 h-4" />
                            {comparisonItems.length > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-purple-500 text-[10px] text-white rounded-full flex items-center justify-center px-1">
                                {comparisonItems.length}
                              </span>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Comparisons ({comparisonItems.length})</TooltipContent>
                      </Tooltip>
                    )}

                    {/* Empty State */}
                    {items.length === 0 && !sidebarCollapsed && (
                      <div className="text-center py-6 text-theme-text-muted">
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
          </div>

          {/* PRESENTATION Section - Fixed */}
          <div className="border-t border-theme-border flex-shrink-0">
            <SidebarSectionHeader label="Presentation" collapsed={sidebarCollapsed} />
            <div className={cn("space-y-1 pb-2", sidebarCollapsed ? "px-2" : "px-3")}>
              <ActionButton 
                icon={Settings} 
                label="Configure" 
                onClick={() => setConfigModalOpen(true)} 
                collapsed={sidebarCollapsed}
                variant="primary"
              />
              <ActionButton 
                icon={TrendingUp} 
                label="Analytics" 
                onClick={() => setAnalyticsModalOpen(true)} 
                collapsed={sidebarCollapsed}
                badge={presentation.view_count > 0 ? presentation.view_count : undefined}
              />
              <ActionButton 
                icon={Share2} 
                label="Share" 
                onClick={handleShare} 
                collapsed={sidebarCollapsed}
              />
              {presentation.share_token && (
                <ActionButton 
                  icon={Eye} 
                  label="View Live" 
                  onClick={() => window.open(`/present/${presentation.share_token}`, '_blank')} 
                  collapsed={sidebarCollapsed}
                />
              )}
              <ActionButton 
                icon={FolderOpen} 
                label="Load Other" 
                onClick={() => setLoadModalOpen(true)} 
                collapsed={sidebarCollapsed}
              />
            </div>
          </div>

          {/* NAVIGATE Section - Collapsible */}
          {!sidebarCollapsed ? (
            <div className="border-t border-theme-border flex-shrink-0">
              <Collapsible open={navigateOpen} onOpenChange={setNavigateOpen}>
                <div className="px-3">
                  <ContentSectionHeader 
                    label="Navigate" 
                    count={0} 
                    isOpen={navigateOpen}
                    onToggle={() => setNavigateOpen(!navigateOpen)}
                  />
                </div>
                <CollapsibleContent>
                  <div className="space-y-1 pb-2 px-3">
                    <ActionButton 
                      icon={LayoutDashboard} 
                      label="Home" 
                      to="/home" 
                      collapsed={sidebarCollapsed}
                    />
                    <ActionButton 
                      icon={LayoutGrid} 
                      label="All Quotes" 
                      to="/my-quotes" 
                      collapsed={sidebarCollapsed}
                    />
                    <ActionButton 
                      icon={GitCompare} 
                      label="Compare" 
                      to="/compare" 
                      collapsed={sidebarCollapsed}
                    />
                    <ActionButton 
                      icon={Presentation} 
                      label="Presentations" 
                      to="/presentations" 
                      collapsed={sidebarCollapsed}
                      isActive
                    />
                    <ActionButton 
                      icon={BarChart3} 
                      label="Analytics" 
                      to="/quotes-analytics" 
                      collapsed={sidebarCollapsed}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ) : (
            <div className="border-t border-theme-border flex-shrink-0 py-2 px-2 space-y-1">
              <ActionButton icon={LayoutDashboard} label="Home" to="/home" collapsed={sidebarCollapsed} />
              <ActionButton icon={LayoutGrid} label="All Quotes" to="/my-quotes" collapsed={sidebarCollapsed} />
            </div>
          )}
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

        <LoadPresentationModal
          open={loadModalOpen}
          onClose={() => setLoadModalOpen(false)}
          onLoad={(p) => navigate(`/presentations/${p.id}`)}
          currentPresentationId={id}
        />
      </div>
    </TooltipProvider>
  );
};

export default PresentationBuilder;
