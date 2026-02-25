import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout-new/PageShell';
import { Navbar } from '@/components/layout-new/Navbar';
import { Configurator } from '@/components/strategy/Configurator';
import { CashflowDocument } from '@/components/document/CashflowDocument';
import { OIInputs, useOICalculations } from '@/components/roi/useOICalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { useCashflowQuote } from '@/hooks/useCashflowQuote';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { migrateInputs } from '@/components/roi/inputMigration';
import { useToast } from '@/hooks/use-toast';
import { FileText, Settings2, ChevronLeft } from 'lucide-react';

const StrategyCreator: React.FC = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data persistence
  const {
    quote,
    loading: quoteLoading,
    saving,
    lastSaved,
    saveQuote,
    scheduleAutoSave,
    generateShareToken,
    getOrCreateWorkingDraft,
    promoteWorkingDraft,
  } = useCashflowQuote(quoteId);

  // Local inputs state
  const [inputs, setInputs] = useState<OIInputs>(() => migrateInputs(null));
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [currency, setCurrency] = useState<Currency>('AED');
  const [language, setLanguage] = useState('en');
  const [activePanel, setActivePanel] = useState<'config' | 'document'>('config');
  const [draftId, setDraftId] = useState<string | undefined>(quoteId);

  // Exchange rate
  const { rate } = useExchangeRate(currency);

  // Track if we've initialized from DB
  const initializedRef = useRef(false);

  // Run calculations
  const calculations = useOICalculations(inputs);

  // For new strategies (no quoteId), get or create a working draft
  useEffect(() => {
    if (quoteId) {
      setDraftId(quoteId);
      return;
    }

    let cancelled = false;
    const init = async () => {
      const id = await getOrCreateWorkingDraft();
      if (!cancelled && id) {
        setDraftId(id);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [quoteId, getOrCreateWorkingDraft]);

  // Sync inputs from loaded quote
  useEffect(() => {
    if (quote && !initializedRef.current) {
      setInputs(quote.inputs);
      // Restore notes from inputs if saved
      if ((quote.inputs as any)._notes) {
        setNotes((quote.inputs as any)._notes);
      }
      initializedRef.current = true;
    }
  }, [quote]);

  // Reset initialized flag when quoteId changes
  useEffect(() => {
    initializedRef.current = false;
  }, [quoteId]);

  // Build clientInfo from inputs (stored inside inputs as _clientInfo)
  const clientInfo = {
    developer: (inputs as any)._clientInfo?.developer || '',
    projectName: (inputs as any)._clientInfo?.projectName || '',
    clientName: (inputs as any)._clients?.[0]?.name || '',
    clientCountry: (inputs as any)._clients?.[0]?.country || '',
    brokerName: (inputs as any)._clientInfo?.brokerName || '',
    unitType: (inputs as any)._clientInfo?.unitType || '',
    unitSize: inputs.unitSizeSqf || 0,
  };

  // Build ClientUnitData for save hook
  const buildClientUnitData = useCallback(() => ({
    developer: (inputs as any)._clientInfo?.developer || '',
    projectName: (inputs as any)._clientInfo?.projectName || '',
    clientName: (inputs as any)._clients?.[0]?.name || '',
    clientCountry: (inputs as any)._clients?.[0]?.country || '',
    clients: (inputs as any)._clients || [],
    unit: (inputs as any)._clientInfo?.unit || '',
    unitType: (inputs as any)._clientInfo?.unitType || '',
    unitSizeSqf: inputs.unitSizeSqf || 0,
    unitSizeM2: 0,
    brokerName: (inputs as any)._clientInfo?.brokerName || '',
  }), [inputs]);

  // Auto-save on input changes (debounced)
  const handleInputsChange = useCallback((newInputs: OIInputs) => {
    setInputs(newInputs);

    // Store notes alongside inputs for auto-save
    const inputsWithNotes = { ...newInputs, _notes: notes };
    if (draftId) {
      scheduleAutoSave(
        inputsWithNotes,
        {
          developer: (newInputs as any)._clientInfo?.developer || '',
          projectName: (newInputs as any)._clientInfo?.projectName || '',
          clientName: (newInputs as any)._clients?.[0]?.name || '',
          clientCountry: (newInputs as any)._clients?.[0]?.country || '',
          clients: (newInputs as any)._clients || [],
          unit: (newInputs as any)._clientInfo?.unit || '',
          unitType: (newInputs as any)._clientInfo?.unitType || '',
          unitSizeSqf: newInputs.unitSizeSqf || 0,
          unitSizeM2: 0,
          brokerName: (newInputs as any)._clientInfo?.brokerName || '',
        },
        draftId,
      );
    }
  }, [draftId, notes, scheduleAutoSave]);

  // Explicit save (promotes working draft → draft)
  const handleSave = useCallback(async () => {
    if (!draftId) return;

    const inputsToSave = { ...inputs, _notes: notes };
    const result = await saveQuote(
      inputsToSave,
      buildClientUnitData(),
      draftId,
      inputs._exitScenarios || [],
    );

    if (result) {
      // Promote if it's a working draft
      if (quote?.status === 'working_draft') {
        await promoteWorkingDraft(draftId);
      }
      toast({ title: 'Strategy saved', description: 'Your strategy has been saved successfully.' });
      // Navigate to the saved quote's URL if we were on /strategy/new
      if (!quoteId && result.id) {
        navigate(`/strategy/${result.id}`, { replace: true });
      }
    }
  }, [draftId, inputs, notes, quote, quoteId, saveQuote, buildClientUnitData, promoteWorkingDraft, navigate, toast]);

  // Share link
  const handleShare = useCallback(async () => {
    if (!draftId) return;

    // Save first
    await handleSave();

    const token = await generateShareToken(draftId);
    if (token) {
      const shareUrl = `${window.location.origin}/view/${token}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Share link copied!', description: shareUrl });
      } catch {
        toast({ title: 'Share link generated', description: shareUrl });
      }
    }
  }, [draftId, handleSave, generateShareToken, toast]);

  // Loading state
  if (quoteLoading && quoteId) {
    return (
      <PageShell>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

  return (
    <PageShell>
      <Navbar />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1 text-sm text-theme-text-muted hover:text-theme-text transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Dashboard
            </button>
            <div className="w-px h-5 bg-theme-border" />
            <h1 className="font-display text-lg text-theme-text">
              {clientInfo.projectName || 'New Strategy'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Save status */}
            {lastSaved && (
              <span className="text-[10px] text-theme-text-muted font-mono">
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {saving && (
              <span className="text-[10px] text-theme-accent font-mono animate-pulse">
                Saving...
              </span>
            )}

            {/* Mobile panel toggle */}
            <div className="flex lg:hidden border border-theme-border rounded-lg overflow-hidden">
              <button
                onClick={() => setActivePanel('config')}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activePanel === 'config'
                    ? 'bg-theme-accent/10 text-theme-accent'
                    : 'text-theme-text-muted hover:text-theme-text'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                Configure
              </button>
              <button
                onClick={() => setActivePanel('document')}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activePanel === 'document'
                    ? 'bg-theme-accent/10 text-theme-accent'
                    : 'text-theme-text-muted hover:text-theme-text'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Document
              </button>
            </div>
          </div>
        </div>

        {/* Split layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Configurator */}
          <div
            className={`w-full lg:w-[420px] xl:w-[480px] lg:flex-shrink-0 ${
              activePanel !== 'config' ? 'hidden lg:block' : ''
            }`}
          >
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2 scrollbar-thin">
              <Configurator
                inputs={inputs}
                onChange={handleInputsChange}
                onSave={handleSave}
                onShare={handleShare}
                isSaving={saving}
              />
            </div>
          </div>

          {/* Right: Live Document Preview */}
          <div
            className={`flex-1 min-w-0 ${
              activePanel !== 'document' ? 'hidden lg:block' : ''
            }`}
          >
            <div className="sticky top-20">
              <CashflowDocument
                inputs={inputs}
                calculations={calculations}
                clientInfo={clientInfo}
                exitScenarios={inputs._exitScenarios}
                currency={currency}
                rate={rate}
                language={language}
                exportMode={false}
                notes={notes}
                onNotesChange={setNotes}
                setCurrency={setCurrency}
                setLanguage={setLanguage}
              />
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
};

export default StrategyCreator;
