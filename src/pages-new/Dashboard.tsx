import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout-new/PageShell';
import { Navbar } from '@/components/layout-new/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, FileText, Trash2, Share2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface QuoteRow {
  id: string;
  title: string | null;
  project_name: string | null;
  developer: string | null;
  client_name: string | null;
  status: string | null;
  inputs: any;
  share_token: string | null;
  updated_at: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadQuotes();
  }, [user]);

  const loadQuotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cashflow_quotes')
      .select('id, title, project_name, developer, client_name, status, inputs, share_token, updated_at, created_at')
      .eq('broker_id', user!.id)
      .neq('status', 'working_draft')
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to load strategies');
    } else {
      setQuotes((data as QuoteRow[]) || []);
    }
    setLoading(false);
  };

  const handleNewStrategy = async () => {
    // Clear any existing working draft first
    await supabase
      .from('cashflow_quotes')
      .delete()
      .eq('broker_id', user!.id)
      .eq('status', 'working_draft');

    navigate('/strategy/new');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this strategy?')) return;
    const { error } = await supabase.from('cashflow_quotes').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      toast.success('Strategy deleted');
    }
  };

  const handleShare = async (q: QuoteRow, e: React.MouseEvent) => {
    e.stopPropagation();
    let token = q.share_token;
    if (!token) {
      token = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      await supabase.from('cashflow_quotes').update({ share_token: token }).eq('id', q.id);
      setQuotes((prev) => prev.map((x) => (x.id === q.id ? { ...x, share_token: token } : x)));
    }
    const url = `${window.location.origin}/view/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success('Share link copied');
  };

  const getBasePrice = (inputs: any): number | null => {
    if (!inputs) return null;
    return typeof inputs === 'object' ? inputs.basePrice : null;
  };

  const formatPrice = (price: number) => {
    if (price >= 1_000_000) return `AED ${(price / 1_000_000).toFixed(1)}M`;
    if (price >= 1_000) return `AED ${(price / 1_000).toFixed(0)}K`;
    return `AED ${price}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  return (
    <PageShell>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-theme-text">Strategies</h1>
            <p className="text-sm text-theme-text-muted mt-1">
              {quotes.length} {quotes.length === 1 ? 'strategy' : 'strategies'}
            </p>
          </div>
          <button
            onClick={handleNewStrategy}
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
          >
            <Plus className="w-4 h-4" />
            New Strategy
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl border border-theme-border bg-theme-card animate-pulse" />
            ))}
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-theme-card border border-theme-border flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-theme-text-muted" />
            </div>
            <h3 className="font-display text-xl text-theme-text mb-2">No strategies yet</h3>
            <p className="text-sm text-theme-text-muted mb-6 max-w-xs">
              Create your first investment strategy to generate professional cashflow projections.
            </p>
            <button
              onClick={handleNewStrategy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              New Strategy
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotes.map((q) => {
              const price = getBasePrice(q.inputs);
              return (
                <div
                  key={q.id}
                  onClick={() => navigate(`/strategy/${q.id}`)}
                  className="group relative p-5 rounded-xl border border-theme-border/50 bg-theme-card hover:border-theme-accent/30 hover:bg-theme-card-alt transition-all duration-200 cursor-pointer"
                >
                  {/* Gold gradient top border */}
                  <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-base text-theme-text truncate">
                        {q.project_name || q.title || 'Untitled Strategy'}
                      </h3>
                      {q.developer && (
                        <p className="text-xs text-theme-text-muted mt-0.5 truncate">{q.developer}</p>
                      )}
                    </div>
                    {q.share_token && (
                      <ExternalLink className="w-3.5 h-3.5 text-theme-accent flex-shrink-0 ml-2 mt-1" />
                    )}
                  </div>

                  {price && (
                    <div className="font-mono text-lg text-theme-accent font-medium mb-3">
                      {formatPrice(price)}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-theme-text-muted">
                    <span>{q.client_name || 'No client'}</span>
                    <span>{formatDate(q.updated_at)}</span>
                  </div>

                  {/* Hover actions */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleShare(q, e)}
                      className="p-1.5 rounded-md bg-theme-bg/80 border border-theme-border hover:border-theme-accent/30 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-3.5 h-3.5 text-theme-text-muted" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(q.id, e)}
                      className="p-1.5 rounded-md bg-theme-bg/80 border border-theme-border hover:border-theme-negative/30 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-theme-text-muted" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </PageShell>
  );
};

export default Dashboard;
