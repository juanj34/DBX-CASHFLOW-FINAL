import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Share2, Edit, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuotesList, CashflowQuote } from '@/hooks/useCashflowQuote';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/components/roi/currencyUtils';

const QuotesDashboard = () => {
  const { quotes, loading, deleteQuote } = useQuotesList();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;
    const { error } = await deleteQuote(id);
    if (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    } else {
      toast({ title: 'Quote deleted' });
    }
  };

  const handleShare = async (quote: CashflowQuote) => {
    if (quote.share_token) {
      const url = `${window.location.origin}/view/${quote.share_token}`;
      await navigator.clipboard.writeText(url);
      toast({ title: 'Share link copied!' });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CCFF00]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <header className="border-b border-[#2a3142] bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/home">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1f2e]">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">My Cashflow Statements</h1>
              <p className="text-sm text-gray-400">{quotes.length} quotes saved</p>
            </div>
          </div>
          <Link to="/cash-statement">
            <Button className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 gap-2">
              <Plus className="w-4 h-4" />
              New Quote
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {quotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1a1f2e] flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-xl text-white mb-2">No quotes yet</h2>
            <p className="text-gray-400 mb-6">Create your first cashflow statement to get started</p>
            <Link to="/cash-statement">
              <Button className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90">
                Create Quote
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-[#1a1f2e] border border-[#2a3142] rounded-xl p-5 hover:border-[#CCFF00]/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {quote.title || 'Untitled Quote'}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-400">
                      {quote.client_name && (
                        <span>Client: {quote.client_name}</span>
                      )}
                      {quote.project_name && (
                        <span>Project: {quote.project_name}</span>
                      )}
                      {quote.developer && (
                        <span>Developer: {quote.developer}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(quote.updated_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(quote.inputs.basePrice, 'AED', 1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {quote.share_token && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShare(quote)}
                        className="text-gray-400 hover:text-[#CCFF00]"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/cashflow/${quote.id}`)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(quote.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default QuotesDashboard;
