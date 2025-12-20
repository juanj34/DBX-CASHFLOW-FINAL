import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, Calendar, User, FolderOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  is_draft: boolean | null;
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

  useEffect(() => {
    if (open) {
      fetchQuotes();
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
      .select('id, project_name, client_name, developer, created_at, updated_at, is_draft, inputs')
      .eq('broker_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setQuotes(data);
    }
    setLoading(false);
  };

  const handleSelectQuote = (quoteId: string) => {
    onOpenChange(false);
    navigate(`/cashflow/${quoteId}`);
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
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#CCFF00]" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('noQuotesFound')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {quotes.map((quote) => {
                const basePrice = quote.inputs?.basePrice || 0;
                return (
                  <button
                    key={quote.id}
                    onClick={() => handleSelectQuote(quote.id)}
                    className="w-full p-4 bg-[#0d1117] border border-[#2a3142] rounded-xl hover:border-[#CCFF00]/50 transition-colors text-left group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white truncate group-hover:text-[#CCFF00] transition-colors">
                            {quote.project_name || 'Untitled Quote'}
                          </h4>
                          {quote.is_draft && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                              {t('draft') || 'Draft'}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          {quote.client_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {quote.client_name}
                            </span>
                          )}
                          {quote.developer && (
                            <span className="truncate">{quote.developer}</span>
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
