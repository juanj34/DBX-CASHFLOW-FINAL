import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout-new/PageShell';
import { CashflowDocument } from '@/components/document/CashflowDocument';
import { OIInputs, useOICalculations } from '@/components/roi/useOICalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { migrateInputs } from '@/components/roi/inputMigration';
import { useClientExport } from '@/hooks/useClientExport';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download } from 'lucide-react';

const SharedView: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [inputs, setInputs] = useState<OIInputs | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>('AED');
  const [language, setLanguage] = useState('en');

  const { rate } = useExchangeRate(currency);
  const documentRef = useRef<HTMLDivElement>(null);
  const [exportMode, setExportMode] = useState(false);
  const { exporting, exportView } = useClientExport({
    contentRef: documentRef,
    projectName: clientInfo?.projectName || 'investment',
  });

  const handleExportPDF = useCallback(async () => {
    setExportMode(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    await exportView({ format: 'pdf', viewName: 'cashflow-statement' });
    setExportMode(false);
  }, [exportView]);

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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#C9A04A] to-[#B3893A] animate-pulse" />
            <div className="mt-4 h-1.5 w-32 bg-theme-border rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-gradient-to-r from-[#C9A04A] to-[#B3893A] rounded-full animate-shimmer" />
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-[#C9A04A] to-[#B3893A]" />
            <span className="font-display text-sm text-theme-text">Dubai Invest Pro</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-theme-text-muted font-mono">
              Shared Strategy
            </span>
            <button
              onClick={handleExportPDF}
              disabled={exporting || !inputs}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-theme-border text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors disabled:opacity-50"
            >
              <Download className={`w-3 h-3 ${exporting ? 'animate-pulse' : ''}`} />
              {exporting ? 'Exporting...' : 'PDF'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div ref={documentRef}>
          <CashflowDocument
            inputs={inputs}
            calculations={calculations}
            clientInfo={clientInfo}
            exitScenarios={inputs._exitScenarios}
            currency={currency}
            rate={rate}
            language={language}
            exportMode={exportMode}
            notes={(inputs as any)._notes || {}}
            setCurrency={setCurrency}
            setLanguage={setLanguage}
          />
        </div>
      </main>
    </PageShell>
  );
};

export default SharedView;
