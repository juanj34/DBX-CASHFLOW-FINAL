import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout-new/PageShell';
import { CashflowDocument } from '@/components/document/CashflowDocument';
import { OIInputs, useOICalculations } from '@/components/roi/useOICalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { migrateInputs } from '@/components/roi/inputMigration';
import { supabase } from '@/integrations/supabase/client';
import { FileText } from 'lucide-react';

const SharedView: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [inputs, setInputs] = useState<OIInputs | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>('AED');
  const [language, setLanguage] = useState('en');

  const { rate } = useExchangeRate(currency);

  // Fetch shared quote
  useEffect(() => {
    if (!shareToken) {
      setError('No share token provided');
      setLoading(false);
      return;
    }

    const fetchQuote = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('cashflow_quotes')
          .select(`
            id, inputs, client_name, client_country, project_name, developer,
            unit, unit_type, unit_size_sqf
          `)
          .eq('share_token', shareToken)
          .maybeSingle();

        if (fetchError || !data) {
          setError('Strategy not found or link expired');
          setLoading(false);
          return;
        }

        const migrated = migrateInputs(data.inputs as any);
        setInputs(migrated);
        setClientInfo({
          developer: (migrated as any)._clientInfo?.developer || data.developer || '',
          projectName: (migrated as any)._clientInfo?.projectName || data.project_name || '',
          clientName: (migrated as any)._clients?.[0]?.name || data.client_name || '',
          clientCountry: data.client_country || '',
          unitType: (migrated as any)._clientInfo?.unitType || data.unit_type || '',
          unitSize: migrated.unitSizeSqf || data.unit_size_sqf || 0,
        });

        // Track view
        try {
          await supabase.functions.invoke('track-quote-view', {
            body: { quoteId: data.id, shareToken },
          });
        } catch {
          // View tracking is non-critical
        }
      } catch {
        setError('Failed to load strategy');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [shareToken]);

  // Calculate (uses a stable inputs object)
  const calculations = useOICalculations(inputs || migrateInputs(null));

  if (loading) {
    return (
      <PageShell>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-400 to-amber-600 animate-pulse" />
            <div className="mt-4 h-1.5 w-32 bg-theme-border rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full animate-shimmer" />
            </div>
            <p className="text-sm text-theme-text-muted mt-4">Loading strategy...</p>
          </div>
        </main>
      </PageShell>
    );
  }

  if (error || !inputs) {
    return (
      <PageShell>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-xl bg-theme-card border border-theme-border flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-theme-text-muted" />
            </div>
            <h2 className="font-display text-xl text-theme-text mb-2">Strategy Not Found</h2>
            <p className="text-sm text-theme-text-muted max-w-md">
              {error || 'This link may have expired or the strategy has been removed.'}
            </p>
          </div>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Minimal header for shared view */}
      <header className="sticky top-0 z-40 border-b border-theme-border bg-theme-bg/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-400 to-amber-600" />
            <span className="font-display text-sm text-theme-text">Dubai Invest Pro</span>
          </div>
          <span className="text-[10px] text-theme-text-muted font-mono">
            Shared Strategy
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CashflowDocument
          inputs={inputs}
          calculations={calculations}
          clientInfo={clientInfo}
          exitScenarios={inputs._exitScenarios}
          currency={currency}
          rate={rate}
          language={language}
          exportMode={false}
          notes={(inputs as any)._notes || {}}
          setCurrency={setCurrency}
          setLanguage={setLanguage}
        />
      </main>
    </PageShell>
  );
};

export default SharedView;
