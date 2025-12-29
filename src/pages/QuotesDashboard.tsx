import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Share2, Edit, Calendar, DollarSign, MapPin, LayoutGrid, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuotesList, CashflowQuote } from '@/hooks/useCashflowQuote';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { formatCurrency } from '@/components/roi/currencyUtils';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';
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

const QuotesDashboard = () => {
  useDocumentTitle("My Cashflow Generators");
  const { quotes, loading, deleteQuote } = useQuotesList();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [deletingQuote, setDeletingQuote] = useState<CashflowQuote | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

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

  const handleShare = async (quote: CashflowQuote) => {
    if (quote.share_token) {
      const url = new URL(`${window.location.origin}/view/${quote.share_token}`);
      // Keep shared view theme consistent with broker's current theme
      url.searchParams.set('t', theme);
      await navigator.clipboard.writeText(url.toString());
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

  const toggleCompareSelection = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(prev => prev.filter(qId => qId !== id));
    } else if (selectedForCompare.length < 4) {
      setSelectedForCompare(prev => [...prev, id]);
    }
  };

  const handleCompare = () => {
    if (selectedForCompare.length >= 2) {
      navigate(`/compare?ids=${selectedForCompare.join(',')}`);
    }
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
              <h1 className="text-xl font-bold text-white">{t('quotesTitle')}</h1>
              <p className="text-sm text-gray-400">{quotes.length} {t('quotesSaved')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {quotes.length >= 2 && (
              <Button
                variant={compareMode ? "default" : "outline"}
                onClick={() => {
                  setCompareMode(!compareMode);
                  setSelectedForCompare([]);
                }}
                className={compareMode 
                  ? "bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 gap-2" 
                  : "border-[#2a3142] text-gray-300 hover:bg-[#2a3142] gap-2"
                }
              >
                <LayoutGrid className="w-4 h-4" />
                {compareMode ? 'Cancel' : 'Compare'}
              </Button>
            )}
            <Link to="/cashflow-generator">
              <Button className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 gap-2">
                <Plus className="w-4 h-4" />
                {t('quotesNewQuote')}
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Compare bar */}
        {compareMode && selectedForCompare.length > 0 && (
          <div className="container mx-auto px-6 pb-4">
            <div className="flex items-center justify-between bg-[#1a1f2e] border border-[#CCFF00]/30 rounded-lg px-4 py-3">
              <span className="text-gray-300 text-sm">
                {selectedForCompare.length} quotes selected (min 2, max 4)
              </span>
              <Button
                onClick={handleCompare}
                disabled={selectedForCompare.length < 2}
                className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
              >
                Compare Selected
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="container mx-auto px-6 py-8">
        {quotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1a1f2e] flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-theme-text-muted" />
            </div>
            <h2 className="text-xl text-white mb-2">{t('quotesNoQuotes')}</h2>
            <p className="text-gray-400 mb-6">{t('quotesNoQuotesDesc')}</p>
            <Link to="/cashflow-generator">
              <Button className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90">
                {t('quotesCreateQuote')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {quotes.map((quote) => {
              const isSelected = selectedForCompare.includes(quote.id);
              
              return (
              <div
                key={quote.id}
                onClick={() => compareMode && toggleCompareSelection(quote.id)}
                className={`bg-[#1a1f2e] border rounded-xl p-5 transition-colors ${
                  compareMode 
                    ? isSelected 
                      ? 'border-[#CCFF00] ring-1 ring-[#CCFF00]/30 cursor-pointer' 
                      : 'border-[#2a3142] hover:border-[#CCFF00]/50 cursor-pointer'
                    : 'border-[#2a3142] hover:border-[#CCFF00]/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {compareMode && (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                      isSelected ? 'bg-[#CCFF00] border-[#CCFF00]' : 'border-gray-500'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-black" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {quote.title || t('quotesUntitled')}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-400">
                      {quote.client_name && (
                        <span>{t('quotesClient')}: {quote.client_name}</span>
                      )}
                      {quote.project_name && (
                        <span>{t('quotesProject')}: {quote.project_name}</span>
                      )}
                      {quote.developer && (
                        <span>{t('quotesDeveloper')}: {quote.developer}</span>
                      )}
                      {(quote.inputs as any)?._clientInfo?.zoneName && (
                        <span className="flex items-center gap-1 text-cyan-400">
                          <MapPin className="w-3 h-3" />
                          {(quote.inputs as any)._clientInfo.zoneName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-theme-text-muted">
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
                  
                  {!compareMode && (
                  <div className="flex items-center gap-2">
                    {quote.share_token && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShare(quote)}
                        className="text-gray-400 hover:text-black hover:bg-[#CCFF00]"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/cashflow/${quote.id}`)}
                      className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(quote)}
                      className="text-gray-400 hover:text-white hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingQuote} onOpenChange={() => setDeletingQuote(null)}>
        <AlertDialogContent className="bg-[#1a1f2e] border-[#2a3142]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t('quotesDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {t('quotesDeleteDesc').replace('{title}', deletingQuote?.title || t('quotesUntitled'))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2a3142] text-gray-300 border-[#2a3142] hover:bg-[#3a4152] hover:text-white">
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
    </div>
  );
};

export default QuotesDashboard;
