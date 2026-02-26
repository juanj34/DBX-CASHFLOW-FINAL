import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Search, FileText, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuoteItem {
  id: string;
  title: string | null;
  project_name: string | null;
  developer: string | null;
  client_name: string | null;
  status: string | null;
  updated_at: string;
  inputs: any;
}

interface LoadQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (quoteId: string) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-400',
  sent: 'bg-blue-500/20 text-blue-400',
  viewed: 'bg-amber-500/20 text-amber-400',
  negotiation: 'bg-purple-500/20 text-purple-400',
  sold: 'bg-emerald-500/20 text-emerald-400',
};

export const LoadQuoteModal: React.FC<LoadQuoteModalProps> = ({ open, onOpenChange, onSelect }) => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    const load = async () => {
      const { data } = await supabase
        .from('cashflow_quotes')
        .select('id, title, project_name, developer, client_name, status, updated_at, inputs')
        .eq('broker_id', user.id)
        .neq('status', 'working_draft')
        .order('updated_at', { ascending: false });
      setQuotes((data as QuoteItem[]) || []);
      setLoading(false);
    };
    load();
  }, [open, user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return quotes;
    const q = search.toLowerCase();
    return quotes.filter(
      (item) =>
        item.project_name?.toLowerCase().includes(q) ||
        item.client_name?.toLowerCase().includes(q) ||
        item.developer?.toLowerCase().includes(q) ||
        item.title?.toLowerCase().includes(q)
    );
  }, [quotes, search]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPrice = (inputs: any) => {
    if (!inputs?.basePrice) return null;
    return new Intl.NumberFormat('en', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(inputs.basePrice);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-theme-card border-theme-border">
        <DialogHeader>
          <DialogTitle className="font-display text-theme-text">Load Strategy</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
          <Input
            placeholder="Search by project, client, or developer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-theme-bg border-theme-border text-theme-text placeholder:text-theme-text-muted"
            autoFocus
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto -mx-1 px-1 space-y-1">
          {loading ? (
            <div className="py-12 text-center text-sm text-theme-text-muted">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-theme-text-muted">
              {search ? 'No strategies match your search' : 'No saved strategies yet'}
            </div>
          ) : (
            filtered.map((q) => (
              <button
                key={q.id}
                onClick={() => { onSelect(q.id); onOpenChange(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-theme-accent/10 transition-colors group flex items-start gap-3"
              >
                <FileText className="w-4 h-4 text-theme-text-muted mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-theme-text truncate">
                      {q.project_name || q.title || 'Untitled'}
                    </span>
                    {q.status && q.status !== 'working_draft' && (
                      <span className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide',
                        statusColors[q.status] || 'bg-slate-500/20 text-slate-400'
                      )}>
                        {q.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-theme-text-muted">
                    {q.client_name && <span>{q.client_name}</span>}
                    {q.client_name && q.developer && <span>·</span>}
                    {q.developer && <span>{q.developer}</span>}
                    {getPrice(q.inputs) && (
                      <>
                        <span>·</span>
                        <span className="font-mono">{getPrice(q.inputs)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-theme-text-muted">
                    <Calendar className="w-3 h-3" />
                    {formatDate(q.updated_at)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
