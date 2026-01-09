import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, Edit, Calendar, DollarSign, MapPin, 
  LayoutGrid, Check, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X,
  FileText, TrendingUp, CheckCircle2, Eye, EyeOff, Copy, CheckSquare, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuotesList, CashflowQuote } from '@/hooks/useCashflowQuote';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/components/roi/currencyUtils';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PipelineAnalyticsChart } from '@/components/dashboard/PipelineAnalyticsChart';
import { PageHeader, defaultShortcuts } from '@/components/layout/PageHeader';
import { QuoteAnalyticsPopover } from '@/components/analytics/QuoteAnalyticsPopover';
import { ShareIconButton } from '@/components/roi/ShareIconButton';

type QuoteStatus = "draft" | "presented" | "negotiating" | "sold";
type SortField = 'date' | 'value' | 'developer' | 'status';
type SortDirection = 'asc' | 'desc';

const QuotesDashboard = () => {
  useDocumentTitle("All Opportunities");
  const { quotes, loading, deleteQuote, duplicateQuote } = useQuotesList();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [deletingQuote, setDeletingQuote] = useState<CashflowQuote | null>(null);
  const [duplicatingQuote, setDuplicatingQuote] = useState<CashflowQuote | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | '30days' | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const commissionRate = profile?.commission_rate ?? 2;

  const statusConfig: Record<QuoteStatus, { label: string; className: string }> = {
    draft: { label: t("statusDraft"), className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
    presented: { label: t("statusPresented"), className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    negotiating: { label: t("statusNegotiating"), className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    sold: { label: t("statusSold"), className: "bg-green-500/20 text-green-400 border-green-500/30" },
  };

  // Filter quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const clientMatch = quote.client_name?.toLowerCase().includes(query);
        const projectMatch = quote.project_name?.toLowerCase().includes(query);
        const developerMatch = quote.developer?.toLowerCase().includes(query);
        if (!clientMatch && !projectMatch && !developerMatch) return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && quote.status !== statusFilter) return false;
      
      // Date filter
      const created = new Date(quote.created_at || quote.updated_at);
      const now = new Date();
      
      if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (created < weekAgo) return false;
      } else if (dateFilter === 'month') {
        if (created.getMonth() !== now.getMonth() || created.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (created < thirtyDaysAgo) return false;
      }
      
      return true;
    });
  }, [quotes, statusFilter, dateFilter, searchQuery]);

  // Sort quotes
  const sortedQuotes = useMemo(() => {
    return [...filteredQuotes].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'value':
          comparison = (a.inputs?.basePrice || 0) - (b.inputs?.basePrice || 0);
          break;
        case 'developer':
          comparison = (a.developer || '').localeCompare(b.developer || '');
          break;
        case 'status':
          comparison = (a.status || 'draft').localeCompare(b.status || 'draft');
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredQuotes, sortField, sortDirection]);

  // Pipeline stats
  const pipelineStats = useMemo(() => {
    const soldQuotes = quotes.filter(q => q.status === 'sold');
    const nonSoldQuotes = quotes.filter(q => q.status !== 'sold');
    
    const pipelineVolume = quotes.reduce((sum, q) => sum + (q.inputs?.basePrice || 0), 0);
    const potentialVolume = nonSoldQuotes.reduce((sum, q) => sum + (q.inputs?.basePrice || 0), 0);
    const earnedVolume = soldQuotes.reduce((sum, q) => sum + (q.inputs?.basePrice || 0), 0);
    
    return {
      totalQuotes: quotes.length,
      pipelineVolume,
      potentialCommission: potentialVolume * (commissionRate / 100),
      earnedCommission: earnedVolume * (commissionRate / 100)
    };
  }, [quotes, commissionRate]);

  const formatCurrencyShort = (amount: number) => {
    if (amount >= 1000000) return `AED ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `AED ${(amount / 1000).toFixed(0)}k`;
    return `AED ${amount.toFixed(0)}`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3" /> 
      : <ArrowDown className="w-3 h-3" />;
  };

  const handleDeleteClick = (quote: CashflowQuote) => {
    setDeletingQuote(quote);
  };

  const confirmDelete = async () => {
    if (!deletingQuote) return;
    const { error } = await deleteQuote(deletingQuote.id);
    if (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    } else {
      toast({ title: 'Quote deleted' });
    }
    setDeletingQuote(null);
  };

  const handleDuplicateClick = (quote: CashflowQuote) => {
    setDuplicatingQuote(quote);
  };

  const confirmDuplicate = async () => {
    if (!duplicatingQuote) return;
    
    setIsDuplicating(true);
    const { newId, error } = await duplicateQuote(duplicatingQuote.id);
    setIsDuplicating(false);
    
    if (error) {
      toast({ title: 'Failed to duplicate quote', variant: 'destructive' });
    } else if (newId) {
      toast({ title: 'Quote duplicated successfully!' });
      navigate(`/cashflow/${newId}`);
    }
    setDuplicatingQuote(null);
  };

  const updateQuoteStatus = async (quoteId: string, status: QuoteStatus) => {
    const now = new Date().toISOString();
    const quote = quotes.find(q => q.id === quoteId);
    
    const updateData: any = {
      status,
      status_changed_at: now,
    };

    if (status === 'sold') updateData.sold_at = now;
    if (status === 'presented') updateData.presented_at = now;
    if (status === 'negotiating') updateData.negotiation_started_at = now;

    const { error } = await supabase
      .from("cashflow_quotes")
      .update(updateData)
      .eq("id", quoteId);

    if (error) {
      sonnerToast.error(t("errorUpdatingStatus"));
      return;
    }
    
    if (status === 'sold') {
      sonnerToast.success("🎉 " + t("dealClosed"));
      
      if (profile?.email && quote) {
        try {
          await supabase.functions.invoke('send-status-notification', {
            body: {
              brokerEmail: profile.email,
              brokerName: profile.full_name,
              clientName: quote.client_name,
              projectName: quote.project_name,
              dealValue: quote.inputs?.basePrice || 0,
              commission: (quote.inputs?.basePrice || 0) * (commissionRate / 100),
              newStatus: status,
              clientEmail: quote.client_email
            }
          });
        } catch (err) {
          console.error("Failed to send notification:", err);
        }
      }
    } else {
      sonnerToast.success(t("statusUpdated"));
    }
    
    // Reload page to refresh data
    window.location.reload();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toggleCompareSelection = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(prev => prev.filter(qId => qId !== id));
    } else if (selectedForCompare.length < 4) {
      setSelectedForCompare(prev => [...prev, id]);
    }
  };

  const handleBulkDelete = async () => {
    const { error } = await supabase
      .from('cashflow_quotes')
      .delete()
      .in('id', selectedForDelete);

    if (error) {
      toast({ title: 'Failed to delete quotes', variant: 'destructive' });
    } else {
      toast({ title: `${selectedForDelete.length} quotes deleted` });
      setSelectedForDelete([]);
      setSelectMode(false);
      window.location.reload();
    }
    setShowBulkDeleteDialog(false);
  };

  const toggleDeleteSelection = (id: string) => {
    setSelectedForDelete(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedForDelete.length === sortedQuotes.length) {
      setSelectedForDelete([]);
    } else {
      setSelectedForDelete(sortedQuotes.map(q => q.id));
    }
  };

  const handleCompare = () => {
    if (selectedForCompare.length >= 2) {
      navigate(`/compare?ids=${selectedForCompare.join(',')}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent" />
      </div>
    );
  }

  const shortcuts = defaultShortcuts.map(s => ({
    ...s,
    active: s.href === '/my-quotes'
  }));

  return (
    <div className="min-h-screen bg-theme-bg">
      <PageHeader
        title={t('allOpportunities')}
        subtitle={`${quotes.length} ${t('quotesSaved')}`}
        icon={<FileText className="w-5 h-5" />}
        backLink="/home"
        shortcuts={shortcuts}
        actions={
          <div className="flex items-center gap-2 sm:gap-3">
            {quotes.length >= 2 && (
              <Button
                variant={compareMode ? "default" : "outline"}
                onClick={() => {
                  setCompareMode(!compareMode);
                  setSelectedForCompare([]);
                  setSelectMode(false);
                  setSelectedForDelete([]);
                }}
                className={compareMode 
                  ? "bg-theme-accent text-theme-bg hover:bg-theme-accent/90 gap-2" 
                  : "border-theme-border text-theme-text-muted hover:bg-theme-card-alt gap-2"
                }
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">{compareMode ? t('quotesCancel') : t('compare')}</span>
              </Button>
            )}
            {quotes.length >= 1 && !compareMode && (
              <Button
                variant={selectMode ? "default" : "outline"}
                onClick={() => {
                  setSelectMode(!selectMode);
                  setSelectedForDelete([]);
                }}
                className={selectMode 
                  ? "bg-red-600 text-white hover:bg-red-500 gap-2" 
                  : "border-theme-border text-theme-text-muted hover:bg-theme-card-alt gap-2"
                }
              >
                <CheckSquare className="w-4 h-4" />
                <span className="hidden sm:inline">{selectMode ? t('quotesCancel') : 'Select'}</span>
              </Button>
            )}
            <Link to="/cashflow-generator">
              <Button className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90 gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('quotesNewQuote')}</span>
              </Button>
            </Link>
          </div>
        }
      />
        
      {/* Compare bar */}
      {compareMode && selectedForCompare.length > 0 && (
        <div className="container mx-auto px-4 sm:px-6 py-4 border-b border-theme-border bg-theme-bg/80">
          <div className="flex items-center justify-between bg-theme-card border border-theme-accent/30 rounded-lg px-4 py-3">
            <span className="text-theme-text-muted text-sm">
              {selectedForCompare.length} {t('quotesSelected')} ({t('min2Max4')})
            </span>
            <Button
              onClick={handleCompare}
              disabled={selectedForCompare.length < 2}
              className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
            >
              {t('compareSelected')}
            </Button>
          </div>
        </div>
      )}

      {/* Bulk delete bar */}
      {selectMode && selectedForDelete.length > 0 && (
        <div className="container mx-auto px-4 sm:px-6 py-4 border-b border-theme-border bg-theme-bg/80">
          <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
            <span className="text-theme-text-muted text-sm">
              {selectedForDelete.length} selected for deletion
            </span>
            <Button
              onClick={() => setShowBulkDeleteDialog(true)}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 sm:px-6 py-6">
        {/* Pipeline Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-xl p-4 relative overflow-hidden group hover:border-theme-accent/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-theme-accent" />
              <span className="text-xs text-theme-text-muted uppercase">{t("totalQuotes")}</span>
            </div>
            <p className="text-2xl font-bold text-theme-text">{pipelineStats.totalQuotes}</p>
          </div>

          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-xl p-4 relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-theme-text-muted uppercase">{t("pipelineVolume")}</span>
            </div>
            <p className="text-2xl font-bold text-theme-text">{formatCurrencyShort(pipelineStats.pipelineVolume)}</p>
          </div>

          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-xl p-4 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-theme-text-muted uppercase">{t("potentialCommission")}</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400">{formatCurrencyShort(pipelineStats.potentialCommission)}</p>
          </div>

          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-xl p-4 relative overflow-hidden group hover:border-green-500/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-xs text-theme-text-muted uppercase">{t("earnedCommission")}</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{formatCurrencyShort(pipelineStats.earnedCommission)}</p>
          </div>
        </div>

        {/* Pipeline Analytics Chart */}
        <PipelineAnalyticsChart 
          quotes={quotes.map(q => ({
            id: q.id,
            created_at: q.created_at || q.updated_at,
            status: q.status,
            sold_at: q.sold_at,
            inputs: q.inputs
          }))} 
          commissionRate={commissionRate} 
        />

        {quotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-card flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-theme-text-muted" />
            </div>
            <h2 className="text-xl text-theme-text mb-2">{t('quotesNoQuotes')}</h2>
            <p className="text-theme-text-muted mb-6">{t('quotesNoQuotesDesc')}</p>
            <Link to="/cashflow-generator">
              <Button className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90">
                {t('quotesCreateQuote')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl overflow-hidden">
            {/* Search and Filters */}
            <div className="flex flex-col gap-4 p-5 border-b border-theme-border">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
                  <Input
                    placeholder={t("searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 h-9 bg-theme-bg-alt border-theme-border text-theme-text placeholder:text-theme-text-muted"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-theme-text-muted hover:text-theme-text"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                {/* Filters */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-theme-text-muted hidden sm:block" />
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as QuoteStatus | 'all')}>
                    <SelectTrigger className="w-[130px] h-9 text-xs bg-theme-bg-alt border-theme-border text-theme-text">
                      <SelectValue placeholder={t("allStatuses")} />
                    </SelectTrigger>
                    <SelectContent className="bg-theme-card border-theme-border">
                      <SelectItem value="all" className="text-theme-text hover:bg-theme-card-alt">{t("allStatuses")}</SelectItem>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key} className="text-theme-text hover:bg-theme-card-alt">
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as 'week' | 'month' | '30days' | 'all')}>
                    <SelectTrigger className="w-[130px] h-9 text-xs bg-theme-bg-alt border-theme-border text-theme-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-theme-card border-theme-border">
                      <SelectItem value="week" className="text-theme-text hover:bg-theme-card-alt">{t("thisWeek")}</SelectItem>
                      <SelectItem value="month" className="text-theme-text hover:bg-theme-card-alt">{t("thisMonth")}</SelectItem>
                      <SelectItem value="30days" className="text-theme-text hover:bg-theme-card-alt">{t("last30Days")}</SelectItem>
                      <SelectItem value="all" className="text-theme-text hover:bg-theme-card-alt">{t("allTime")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-theme-border hover:bg-transparent">
                    {selectMode && (
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedForDelete.length === sortedQuotes.length && sortedQuotes.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                    )}
                    {compareMode && <TableHead className="w-12"></TableHead>}
                    <TableHead 
                      className="text-theme-text-muted font-medium cursor-pointer hover:text-theme-text"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        {t("clientProject")}
                        {getSortIcon('date')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-theme-text-muted font-medium cursor-pointer hover:text-theme-text"
                      onClick={() => handleSort('value')}
                    >
                      <div className="flex items-center gap-1">
                        {t("dealValue")}
                        {getSortIcon('value')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-theme-text-muted font-medium hidden md:table-cell cursor-pointer hover:text-theme-text"
                      onClick={() => handleSort('developer')}
                    >
                      <div className="flex items-center gap-1">
                        {t("developer")}
                        {getSortIcon('developer')}
                      </div>
                    </TableHead>
                    <TableHead className="text-theme-text-muted font-medium hidden lg:table-cell">{t("zone")}</TableHead>
                    <TableHead className="text-theme-text-muted font-medium hidden md:table-cell">{t("views") || "Views"}</TableHead>
                    <TableHead 
                      className="text-theme-text-muted font-medium cursor-pointer hover:text-theme-text"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        {t("status")}
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead className="text-theme-text-muted font-medium text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedQuotes.map((quote) => {
                    const isSelected = selectedForCompare.includes(quote.id);
                    const currentStatus = (quote.status as QuoteStatus) || "draft";
                    
                    return (
                      <TableRow 
                        key={quote.id} 
                        className={`border-theme-border ${compareMode || selectMode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-theme-accent/10' : selectedForDelete.includes(quote.id) ? 'bg-red-500/10' : 'hover:bg-theme-card-alt/50'}`}
                        onClick={() => {
                          if (compareMode) toggleCompareSelection(quote.id);
                          if (selectMode) toggleDeleteSelection(quote.id);
                        }}
                      >
                        {selectMode && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={selectedForDelete.includes(quote.id)}
                              onCheckedChange={() => toggleDeleteSelection(quote.id)}
                            />
                          </TableCell>
                        )}
                        {compareMode && (
                          <TableCell>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'bg-theme-accent border-theme-accent' : 'border-theme-text-muted'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-theme-bg" />}
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <div>
                            <p className="font-medium text-theme-text">
                              {quote.client_name || t('homeUnnamedClient')}
                            </p>
                            <p className="text-xs text-theme-text-muted">
                              {quote.project_name || t('homeNoProject')}
                            </p>
                            <p className="text-xs text-theme-text-muted flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(quote.updated_at)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-theme-text font-medium">
                          {quote.inputs?.basePrice ? formatCurrency(quote.inputs.basePrice, 'AED', 1) : "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-theme-text text-sm">
                            {quote.developer || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {(quote.inputs as any)?._clientInfo?.zoneName && (
                            <span className="text-cyan-400 text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {(quote.inputs as any)._clientInfo.zoneName}
                            </span>
                          )}
                          {!(quote.inputs as any)?._clientInfo?.zoneName && (
                            <span className="text-theme-text-muted text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {quote.view_count != null && quote.view_count > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-cyan-500/20 rounded-full">
                                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-theme-text font-medium">
                                  {quote.view_count} {quote.view_count === 1 ? 'view' : 'views'}
                                </span>
                                {quote.first_viewed_at && (
                                  <span className="text-xs text-theme-text-muted">
                                    {formatDate(quote.first_viewed_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 opacity-50">
                              <div className="p-1.5 bg-theme-card-alt rounded-full">
                                <EyeOff className="w-3.5 h-3.5 text-theme-text-muted" />
                              </div>
                              <span className="text-theme-text-muted text-sm">Not viewed</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={currentStatus}
                            onValueChange={(value) => updateQuoteStatus(quote.id, value as QuoteStatus)}
                          >
                            <SelectTrigger className={`w-[130px] h-8 text-xs border ${statusConfig[currentStatus].className} bg-transparent`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-theme-card border-theme-border">
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key} className="text-theme-text hover:bg-theme-card-alt">
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {!compareMode && !selectMode && (
                            <div className="flex items-center justify-end gap-1">
                              <ShareIconButton
                                quoteId={quote.id}
                                shareToken={quote.share_token}
                                projectName={quote.project_name}
                                clientEmail={quote.client_email}
                              />
                              
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDuplicateClick(quote)}
                                      className="h-8 w-8 text-theme-text-muted hover:text-cyan-400 hover:bg-cyan-500/10"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">Duplicate</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => navigate(`/cashflow/${quote.id}`)}
                                      className="h-8 w-8 text-theme-text-muted hover:text-theme-accent hover:bg-theme-accent/10"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">Edit</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteClick(quote)}
                                      className="h-8 w-8 text-theme-text-muted hover:text-red-400 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">Delete</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingQuote} onOpenChange={() => setDeletingQuote(null)}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text">{t('quotesDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              {t('quotesDeleteDesc').replace('{title}', deletingQuote?.title || t('quotesUntitled'))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-theme-bg-alt text-theme-text border-theme-border hover:bg-theme-card-alt hover:text-theme-text">
              {t('quotesCancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {t('quotesDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Confirmation Dialog */}
      <AlertDialog open={!!duplicatingQuote} onOpenChange={() => setDuplicatingQuote(null)}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text">{t('duplicateQuote') || 'Duplicate Quote'}</AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              {t('duplicateQuoteDesc') || 'A copy of this quote will be created with all current settings. You will be redirected to edit the new copy.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-theme-bg-alt text-theme-text border-theme-border hover:bg-theme-card-alt hover:text-theme-text"
              disabled={isDuplicating}
            >
              {t('quotesCancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDuplicate}
              disabled={isDuplicating}
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              {isDuplicating ? 'Duplicating...' : t('duplicate') || 'Duplicate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text">Delete {selectedForDelete.length} quotes?</AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              This action cannot be undone. All selected quotes will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-theme-bg-alt text-theme-text border-theme-border hover:bg-theme-card-alt hover:text-theme-text">
              {t('quotesCancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Delete {selectedForDelete.length} Quotes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuotesDashboard;
