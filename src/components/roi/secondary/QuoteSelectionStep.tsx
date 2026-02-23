import { useState, useMemo } from 'react';
import { Search, Building2, User, Calendar, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuotesList, CashflowQuote } from '@/hooks/useCashflowQuote';
import { formatCurrency } from '@/components/roi/currencyUtils';
import { OIInputs, monthName } from '@/components/roi/useOICalculations';

interface QuoteSelectionStepProps {
  selectedQuoteId?: string;
  onSelect: (quote: CashflowQuote) => void;
  language?: 'en' | 'es';
}

export const QuoteSelectionStep = ({
  selectedQuoteId,
  onSelect,
  language = 'es',
}: QuoteSelectionStepProps) => {
  const { quotes, loading } = useQuotesList();
  const [searchTerm, setSearchTerm] = useState('');

  const t = language === 'es' ? {
    description: 'Selecciona el quote off-plan que quieres comparar con una propiedad secundaria.',
    searchPlaceholder: 'Buscar por proyecto, desarrollador, cliente...',
    noQuotesFound: 'No se encontraron quotes',
    noQuotesCreate: 'No tienes quotes. Crea uno primero.',
    noTitle: 'Sin título',
    handover: 'Handover',
  } : {
    description: 'Select the off-plan quote you want to compare with a secondary property.',
    searchPlaceholder: 'Search by project, developer, client...',
    noQuotesFound: 'No quotes found',
    noQuotesCreate: "You don't have quotes. Create one first.",
    noTitle: 'Untitled',
    handover: 'Handover',
  };

  const filteredQuotes = useMemo(() => {
    if (!searchTerm.trim()) return quotes;
    const lower = searchTerm.toLowerCase();
    return quotes.filter(q =>
      q.title?.toLowerCase().includes(lower) ||
      q.project_name?.toLowerCase().includes(lower) ||
      q.developer?.toLowerCase().includes(lower) ||
      q.client_name?.toLowerCase().includes(lower)
    );
  }, [quotes, searchTerm]);

  const formatDate = (dateStr: string) => {
    const locale = language === 'es' ? 'es-ES' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
  };

  const getHandoverInfo = (inputs: OIInputs | undefined) => {
    if (!inputs) return null;
    return `${monthName(inputs.handoverMonth)} ${inputs.handoverYear}`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-theme-text-muted">
        {t.description}
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
        <Input
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted"
        />
      </div>

      {/* Quote List */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-10 h-10 mx-auto text-theme-text-muted mb-3" />
              <p className="text-theme-text-muted text-sm">
                {searchTerm ? t.noQuotesFound : t.noQuotesCreate}
              </p>
            </div>
          ) : (
            filteredQuotes.map((quote) => {
              const inputs = quote.inputs as OIInputs | undefined;
              const isSelected = selectedQuoteId === quote.id;
              const handover = getHandoverInfo(inputs);

              return (
                <Card
                  key={quote.id}
                  onClick={() => onSelect(quote)}
                  className={`p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-theme-accent bg-theme-accent/5 ring-1 ring-theme-accent'
                      : 'border-theme-border bg-theme-card hover:border-theme-accent/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-theme-text text-sm truncate">
                        {quote.title || quote.project_name || t.noTitle}
                      </h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-theme-text-muted">
                        {quote.developer && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {quote.developer}
                          </span>
                        )}
                        {quote.client_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {quote.client_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(quote.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-medium text-theme-accent">
                          {formatCurrency(inputs?.basePrice || 0, 'AED', 1)}
                        </span>
                        {handover && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {t.handover} {handover}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 mt-1 transition-colors ${
                      isSelected ? 'text-theme-accent' : 'text-theme-text-muted'
                    }`} />
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
