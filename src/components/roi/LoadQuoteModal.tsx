import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, Calendar, User, FolderOpen, Search, MapPin, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from './currencyUtils';

interface Quote {
  id: string;
  project_name: string | null;
  client_name: string | null;
  developer: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
  inputs: any;
}

interface LoadQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoadQuoteModal = ({ open, onOpenChange }: LoadQuoteModalProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      fetchQuotes();
      setSearchQuery('');
    }
  }, [open]);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('cashflow_quotes')
        .select('id, project_name, client_name, developer, created_at, updated_at, status, inputs')
        .eq('broker_id', user.id)
        .neq('status', 'working_draft')
        .or('is_archived.is.null,is_archived.eq.false')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setQuotes(data);
      }
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = useMemo(() => {
    if (!searchQuery.trim()) return quotes;
    
    const query = searchQuery.toLowerCase();
    return quotes.filter(quote => {
      const zoneName = quote.inputs?._clientInfo?.zoneName?.toLowerCase() || '';
      const developer = (quote.developer || '').toLowerCase();
      const clientName = (quote.client_name || '').toLowerCase();
      const projectName = (quote.project_name || '').toLowerCase();
      
      return zoneName.includes(query) || 
             developer.includes(query) || 
             clientName.includes(query) || 
             projectName.includes(query);
    });
  }, [quotes, searchQuery]);

  const handleSelectQuote = (quoteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/cashflow/${quoteId}`);
    onOpenChange(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-theme-card border-theme-border text-theme-text max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-theme-text flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-theme-accent" />
            {t('loadQuote')}
          </DialogTitle>
          <p className="text-sm text-theme-text-muted">{t('searchQuotes')}</p>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchQuotes')}
            className="pl-10 bg-theme-bg border-theme-border text-theme-text placeholder:text-theme-text-muted"
          />
        </div>

        <ScrollArea className="max-h-[50vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-theme-accent" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-theme-text-muted">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{searchQuery ? 'No matching quotes' : t('noQuotesFound')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredQuotes.map((quote) => {
                const basePrice = quote.inputs?.basePrice || 0;
                const zoneName = quote.inputs?._clientInfo?.zoneName || null;
                return (
                  <button
                    key={quote.id}
                    onClick={(e) => handleSelectQuote(quote.id, e)}
                    className="w-full p-4 bg-theme-bg border border-theme-border rounded-xl hover:border-theme-accent/50 transition-colors text-left group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-theme-text truncate group-hover:text-theme-accent transition-colors">
                          {quote.project_name || 'Untitled Quote'}
                        </h4>
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-theme-text-muted flex-wrap">
                          {quote.client_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {quote.client_name}
                            </span>
                          )}
                          {quote.developer && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {quote.developer}
                            </span>
                          )}
                          {zoneName && (
                            <span className="flex items-center gap-1 text-cyan-500">
                              <MapPin className="w-3 h-3" />
                              {zoneName}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1 text-xs text-theme-text-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(quote.updated_at || quote.created_at)}
                          </span>
                          {basePrice > 0 && (
                            <span className="text-theme-accent">
                              {formatCurrency(basePrice, 'AED', 1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
