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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('cashflow_quotes')
      .select('id, project_name, client_name, developer, created_at, updated_at, status, inputs')
      .eq('broker_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setQuotes(data);
    }
    setLoading(false);
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
      <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-[#CCFF00]" />
            {t('loadQuote')}
          </DialogTitle>
          <p className="text-sm text-gray-400">{t('searchQuotes')}</p>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchQuotes')}
            className="pl-10 bg-[#0d1117] border-[#2a3142] text-white placeholder:text-gray-500"
          />
        </div>

        <ScrollArea className="max-h-[50vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#CCFF00]" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
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
                    className="w-full p-4 bg-[#0d1117] border border-[#2a3142] rounded-xl hover:border-[#CCFF00]/50 transition-colors text-left group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white truncate group-hover:text-[#CCFF00] transition-colors">
                            {quote.project_name || 'Untitled Quote'}
                          </h4>
                          {quote.status === 'draft' && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                              {t('draft') || 'Draft'}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
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
                            <span className="flex items-center gap-1 text-cyan-400">
                              <MapPin className="w-3 h-3" />
                              {zoneName}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(quote.updated_at || quote.created_at)}
                          </span>
                          {basePrice > 0 && (
                            <span className="text-gray-400">
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
