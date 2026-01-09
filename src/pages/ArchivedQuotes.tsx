import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Archive, RotateCcw, Trash2, Search, X, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, defaultShortcuts } from '@/components/layout/PageHeader';

interface ArchivedQuote {
  id: string;
  client_name: string | null;
  project_name: string | null;
  developer: string | null;
  archived_at: string | null;
  created_at: string;
  inputs: { basePrice?: number } | null;
}

const ArchivedQuotes = () => {
  useDocumentTitle("Archived Quotes");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingQuote, setDeletingQuote] = useState<ArchivedQuote | null>(null);

  const { data: archivedQuotes = [], isLoading } = useQuery({
    queryKey: ['archived-quotes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('cashflow_quotes')
        .select('id, client_name, project_name, developer, archived_at, created_at, inputs')
        .eq('broker_id', user.id)
        .eq('is_archived', true)
        .order('archived_at', { ascending: false });
      
      if (error) throw error;
      return data as ArchivedQuote[];
    },
    enabled: !!user?.id
  });

  const filteredQuotes = useMemo(() => {
    if (!searchQuery) return archivedQuotes;
    const query = searchQuery.toLowerCase();
    return archivedQuotes.filter(q => 
      q.client_name?.toLowerCase().includes(query) ||
      q.project_name?.toLowerCase().includes(query) ||
      q.developer?.toLowerCase().includes(query)
    );
  }, [archivedQuotes, searchQuery]);

  const handleReactivate = async (quoteId: string) => {
    const { error } = await supabase
      .from('cashflow_quotes')
      .update({ is_archived: false, archived_at: null })
      .eq('id', quoteId);
    
    if (error) {
      toast({ title: 'Failed to reactivate quote', variant: 'destructive' });
    } else {
      toast({ title: 'Quote reactivated successfully' });
      queryClient.invalidateQueries({ queryKey: ['archived-quotes'] });
    }
  };

  const confirmPermanentDelete = async () => {
    if (!deletingQuote) return;
    
    const { error } = await supabase
      .from('cashflow_quotes')
      .delete()
      .eq('id', deletingQuote.id);
    
    if (error) {
      toast({ title: 'Failed to delete quote', variant: 'destructive' });
    } else {
      toast({ title: 'Quote permanently deleted' });
      queryClient.invalidateQueries({ queryKey: ['archived-quotes'] });
    }
    setDeletingQuote(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '—';
    if (amount >= 1000000) return `AED ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `AED ${(amount / 1000).toFixed(0)}k`;
    return `AED ${amount.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent" />
      </div>
    );
  }

  const shortcuts = defaultShortcuts.map(s => ({
    ...s,
    active: false
  }));

  return (
    <div className="min-h-screen bg-theme-bg">
      <PageHeader
        title="Archived Quotes"
        subtitle={`${archivedQuotes.length} quotes archived`}
        icon={<Archive className="w-5 h-5" />}
        backLink="/my-quotes"
        shortcuts={shortcuts}
      />

      <main className="container mx-auto px-4 sm:px-6 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
            <Input
              placeholder="Search archived quotes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-10 bg-theme-bg-alt border-theme-border text-theme-text placeholder:text-theme-text-muted"
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
        </div>

        {filteredQuotes.length > 0 ? (
          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-theme-border hover:bg-transparent">
                    <TableHead className="text-theme-text-muted font-medium">Client / Project</TableHead>
                    <TableHead className="text-theme-text-muted font-medium hidden md:table-cell">Developer</TableHead>
                    <TableHead className="text-theme-text-muted font-medium">Value</TableHead>
                    <TableHead className="text-theme-text-muted font-medium hidden sm:table-cell">Archived</TableHead>
                    <TableHead className="text-theme-text-muted font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => (
                    <TableRow key={quote.id} className="border-theme-border hover:bg-theme-card-alt/50">
                      <TableCell>
                        <div 
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate(`/cashflow/${quote.id}`)}
                        >
                          <p className="font-medium text-theme-text hover:text-theme-accent transition-colors">
                            {quote.client_name || 'Unnamed Client'}
                          </p>
                          <p className="text-xs text-theme-text-muted">
                            {quote.project_name || 'No project'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-theme-text text-sm">
                        {quote.developer || '—'}
                      </TableCell>
                      <TableCell className="text-theme-text font-medium">
                        {formatCurrency(quote.inputs?.basePrice)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-theme-text-muted text-sm">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(quote.archived_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReactivate(quote.id)}
                                  className="h-8 w-8 text-theme-text-muted hover:text-green-400 hover:bg-green-500/10"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">Reactivate</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletingQuote(quote)}
                                  className="h-8 w-8 text-theme-text-muted hover:text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">Delete permanently</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="bg-theme-card/80 backdrop-blur-xl border border-theme-border rounded-2xl p-12 text-center">
            <Archive className="w-12 h-12 mx-auto mb-4 text-theme-text-muted opacity-50" />
            <p className="text-theme-text-muted mb-2">No archived quotes</p>
            <p className="text-sm text-theme-text-muted opacity-70">
              Quotes you archive will appear here
            </p>
            <Link to="/my-quotes">
              <Button className="mt-4 bg-theme-accent text-theme-bg hover:bg-theme-accent/90">
                Back to All Quotes
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Permanent Delete Confirmation */}
      <AlertDialog open={!!deletingQuote} onOpenChange={() => setDeletingQuote(null)}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text">Permanently delete this quote?</AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              This action cannot be undone. The quote "{deletingQuote?.client_name || 'Untitled'} - {deletingQuote?.project_name || 'No project'}" will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-theme-bg-alt text-theme-text border-theme-border hover:bg-theme-card-alt hover:text-theme-text">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmPermanentDelete}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ArchivedQuotes;
