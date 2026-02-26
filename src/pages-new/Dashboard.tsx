import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout-new/PageShell';
import { Navbar } from '@/components/layout-new/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, FileText, Trash2, Share2, ExternalLink, Search, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface QuoteRow {
  id: string;
  title: string | null;
  project_name: string | null;
  developer: string | null;
  client_name: string | null;
  status: string | null;
  basePrice: number | null;
  share_token: string | null;
  updated_at: string;
  created_at: string;
}

type SortField = 'project_name' | 'client_name' | 'developer' | 'price' | 'updated_at';
type SortDir = 'asc' | 'desc';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    if (!user) return;
    loadQuotes();
  }, [user]);

  const loadQuotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cashflow_quotes')
      .select('id, title, project_name, developer, client_name, status, share_token, updated_at, created_at, inputs->basePrice')
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

  const handleNewStrategy = () => {
    navigate('/strategy/new?fresh=true');
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

  const getBasePrice = (row: QuoteRow): number | null => {
    // basePrice comes from the PostgREST JSON accessor `inputs->basePrice`
    const val = row.basePrice;
    if (val == null) return null;
    return typeof val === 'number' ? val : Number(val) || null;
  };

  const formatPrice = (price: number) => {
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
    if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`;
    return `${price}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'updated_at' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-theme-accent" /> : <ChevronDown className="w-3 h-3 text-theme-accent" />;
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...quotes];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        (r.project_name || '').toLowerCase().includes(q) ||
        (r.client_name || '').toLowerCase().includes(q) ||
        (r.developer || '').toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'project_name': aVal = (a.project_name || '').toLowerCase(); bVal = (b.project_name || '').toLowerCase(); break;
        case 'client_name': aVal = (a.client_name || '').toLowerCase(); bVal = (b.client_name || '').toLowerCase(); break;
        case 'developer': aVal = (a.developer || '').toLowerCase(); bVal = (b.developer || '').toLowerCase(); break;
        case 'price': aVal = getBasePrice(a) || 0; bVal = getBasePrice(b) || 0; break;
        case 'updated_at': aVal = new Date(a.updated_at).getTime(); bVal = new Date(b.updated_at).getTime(); break;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [quotes, search, sortField, sortDir]);

  const thClass = "px-4 py-2.5 text-[10px] font-semibold text-theme-text-muted uppercase tracking-wider text-left cursor-pointer hover:text-theme-text transition-colors select-none";
  const tdClass = "px-4 py-3 text-sm";

  return (
    <PageShell>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-theme-text">Strategies</h1>
            <p className="text-sm text-theme-text-muted mt-1">
              {quotes.length} {quotes.length === 1 ? 'strategy' : 'strategies'}
            </p>
          </div>
          <button
            onClick={handleNewStrategy}
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#C9A04A] to-[#B3893A] text-white hover:from-[#D4AA55] hover:to-[#C9A04A] transition-all shadow-lg shadow-[#B3893A]/20 hover:shadow-[#B3893A]/40"
          >
            <Plus className="w-4 h-4" />
            New Strategy
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project, client, or developer..."
            className="pl-10 bg-theme-card border-theme-border text-theme-text text-sm h-10"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg border border-theme-border bg-theme-card animate-pulse" />
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#C9A04A] to-[#B3893A] text-white hover:from-[#D4AA55] hover:to-[#C9A04A] transition-all shadow-lg shadow-[#B3893A]/20"
            >
              <Plus className="w-4 h-4" />
              New Strategy
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-theme-border bg-theme-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-theme-border bg-theme-card-alt">
                  <th className={thClass} onClick={() => toggleSort('project_name')}>
                    <span className="inline-flex items-center gap-1">Project <SortIcon field="project_name" /></span>
                  </th>
                  <th className={thClass} onClick={() => toggleSort('client_name')}>
                    <span className="inline-flex items-center gap-1">Client <SortIcon field="client_name" /></span>
                  </th>
                  <th className={thClass} onClick={() => toggleSort('developer')}>
                    <span className="inline-flex items-center gap-1">Developer <SortIcon field="developer" /></span>
                  </th>
                  <th className={thClass + ' text-right'} onClick={() => toggleSort('price')}>
                    <span className="inline-flex items-center gap-1 justify-end">Price <SortIcon field="price" /></span>
                  </th>
                  <th className={thClass} onClick={() => toggleSort('updated_at')}>
                    <span className="inline-flex items-center gap-1">Updated <SortIcon field="updated_at" /></span>
                  </th>
                  <th className={thClass + ' w-20 text-right'}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((q) => {
                  const price = getBasePrice(q);
                  return (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/strategy/${q.id}`)}
                      className="border-t border-theme-border/50 hover:bg-theme-bg/50 cursor-pointer transition-colors group"
                    >
                      <td className={tdClass}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-theme-text truncate max-w-[200px]">
                            {q.project_name || q.title || 'Untitled'}
                          </span>
                          {q.share_token && <ExternalLink className="w-3 h-3 text-theme-accent flex-shrink-0" />}
                        </div>
                      </td>
                      <td className={tdClass + ' text-theme-text-muted'}>{q.client_name || '—'}</td>
                      <td className={tdClass + ' text-theme-text-muted'}>{q.developer || '—'}</td>
                      <td className={tdClass + ' text-right'}>
                        {price ? (
                          <span className="font-mono text-theme-accent font-medium">AED {formatPrice(price)}</span>
                        ) : (
                          <span className="text-theme-text-muted">—</span>
                        )}
                      </td>
                      <td className={tdClass + ' text-theme-text-muted text-xs font-mono'}>{formatDate(q.updated_at)}</td>
                      <td className={tdClass + ' text-right'}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleShare(q, e)}
                            className="p-1.5 rounded-md hover:bg-theme-bg border border-transparent hover:border-theme-border transition-colors"
                            title="Copy share link"
                          >
                            <Share2 className="w-3.5 h-3.5 text-theme-text-muted" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(q.id, e)}
                            className="p-1.5 rounded-md hover:bg-theme-negative/10 border border-transparent hover:border-theme-negative/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-theme-text-muted" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredAndSorted.length === 0 && search && (
              <div className="py-8 text-center text-sm text-theme-text-muted">
                No strategies matching "{search}"
              </div>
            )}
          </div>
        )}
      </main>
    </PageShell>
  );
};

export default Dashboard;
