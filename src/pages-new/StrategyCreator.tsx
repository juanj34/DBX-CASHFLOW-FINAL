import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '@/components/layout-new/PageShell';
import { Navbar } from '@/components/layout-new/Navbar';
import { Configurator } from '@/components/strategy/Configurator';
import { CashflowDocument } from '@/components/document/CashflowDocument';
import { CashflowDashboard } from '@/components/document/CashflowDashboard';
import { LoadQuoteModal } from '@/components/strategy/LoadQuoteModal';
import { OIInputs, useOICalculations } from '@/components/roi/useOICalculations';
import { Currency } from '@/components/roi/currencyUtils';
import { useCashflowQuote } from '@/hooks/useCashflowQuote';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useProfile } from '@/hooks/useProfile';
import { migrateInputs } from '@/components/roi/inputMigration';
import { DEFAULT_MORTGAGE_INPUTS, MortgageInputs } from '@/components/roi/useMortgageCalculations';
import { useClientExport } from '@/hooks/useClientExport';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Settings2, ChevronLeft, X, Plus, Download, FileImage, FileText, FolderOpen, LayoutDashboard, FileSpreadsheet } from 'lucide-react';

const StrategyCreator: React.FC = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFresh = searchParams.get('fresh') === 'true';
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
    createFreshDraft,
    promoteWorkingDraft,
  } = useCashflowQuote(quoteId);

  // Local inputs state
  const [inputs, setInputs] = useState<OIInputs>(() => migrateInputs(null));
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [currency, setCurrency] = useState<Currency>('AED');
  const [language, setLanguage] = useState('en');
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [hasConfigured, setHasConfigured] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'document'>('dashboard');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [draftId, setDraftId] = useState<string | undefined>(quoteId);
  const { profile } = useProfile();
  const brokerLogoUrl = profile?.avatar_url || undefined;

  // Exchange rate
  const { rate } = useExchangeRate(currency);

  // Track if we've initialized from DB
  const initializedRef = useRef(false);

  // Export refs and state
  const documentRef = useRef<HTMLDivElement>(null);
  const [exportMode, setExportMode] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { exporting, exportView } = useClientExport({
    contentRef: documentRef,
    projectName: (inputs as any)._clientInfo?.projectName || 'investment',
  });

  // Run calculations
  const calculations = useOICalculations(inputs);

  // Compute mortgage data for document
  const mortgageInputs: MortgageInputs = (inputs as any)._mortgageInputs || DEFAULT_MORTGAGE_INPUTS;
  const mortgageData = React.useMemo(() => {
    if (!mortgageInputs.enabled) return undefined;
    const loanAmount = inputs.basePrice * (mortgageInputs.financingPercent / 100);
    const monthlyRate = mortgageInputs.interestRate / 100 / 12;
    const numPayments = mortgageInputs.loanTermYears * 12;
    const monthlyPayment = monthlyRate > 0
      ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanAmount / numPayments;
    return {
      enabled: true,
      loanAmount,
      monthlyPayment,
      financingPercent: mortgageInputs.financingPercent,
      loanTermYears: mortgageInputs.loanTermYears,
      interestRate: mortgageInputs.interestRate,
    };
  }, [inputs.basePrice, mortgageInputs]);

  // For new strategies (no quoteId), get or create a working draft
  useEffect(() => {
    if (quoteId) {
      setDraftId(quoteId);
      return;
    }

    let cancelled = false;
    const init = async () => {
      // If ?fresh=true, atomically delete old draft + create new one
      const id = isFresh
        ? await createFreshDraft()
        : await getOrCreateWorkingDraft();
      if (!cancelled && id) {
        setDraftId(id);
        // Replace URL to remove ?fresh param and set the new draft ID
        if (isFresh) {
          navigate(`/strategy/${id}`, { replace: true });
        }
      }
    };
    init();
    return () => { cancelled = true; };
  }, [quoteId, getOrCreateWorkingDraft, createFreshDraft, isFresh, navigate]);

  // Sync inputs from loaded quote
  useEffect(() => {
    if (quote && !initializedRef.current) {
      setInputs(quote.inputs);
      if ((quote.inputs as any)._notes) {
        setNotes((quote.inputs as any)._notes);
      }
      initializedRef.current = true;
      // Only show document if quote has meaningful data (basePrice > 0)
      if (quoteId && quote.inputs.basePrice > 0) {
        setShowConfigurator(false);
        setHasConfigured(true);
      } else if (quoteId) {
        // Quote exists but has no data — open configurator automatically
        setShowConfigurator(true);
        setHasConfigured(false);
      }
    }
  }, [quote, quoteId]);

  // Reset initialized flag when quoteId changes
  useEffect(() => {
    initializedRef.current = false;
  }, [quoteId]);

  // Build clientInfo from inputs
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

  // Explicit save
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
      if (quote?.status === 'working_draft') {
        await promoteWorkingDraft(draftId);
      }
      toast({ title: 'Strategy saved', description: 'Your strategy has been saved successfully.' });
      setShowConfigurator(false);
      setHasConfigured(true);
      if (!quoteId && result.id) {
        navigate(`/strategy/${result.id}`, { replace: true });
      }
    }
  }, [draftId, inputs, notes, quote, quoteId, saveQuote, buildClientUnitData, promoteWorkingDraft, navigate, toast]);

  // Share link
  const handleShare = useCallback(async () => {
    if (!draftId) return;
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

  // Export document as PDF or PNG
  const handleExport = useCallback(async (format: 'pdf' | 'png', targetView?: 'dashboard' | 'document') => {
    setShowExportMenu(false);

    // If exporting a different view than currently shown, switch to it first
    const originalView = viewMode;
    if (targetView && targetView !== viewMode) {
      setViewMode(targetView);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setExportMode(true);
    // Wait for exportMode to apply (hides interactive controls)
    await new Promise(resolve => setTimeout(resolve, 200));

    const viewName = (targetView || viewMode) === 'dashboard' ? 'cashflow-dashboard' : 'cashflow-statement';
    const success = await exportView({ format, viewName });

    setExportMode(false);

    // Restore original view if we switched
    if (targetView && targetView !== originalView) {
      setViewMode(originalView);
    }

    if (success) {
      toast({ title: `${format.toUpperCase()} exported`, description: `Your ${viewName.replace('-', ' ')} has been downloaded.` });
    } else {
      toast({ title: 'Export failed', description: 'Could not generate the file. Please try again.' });
    }
  }, [exportView, toast, viewMode]);

  const isLoading = quoteLoading && !!quoteId;

  return (
    <PageShell>
      <Navbar />
      <main className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 ${viewMode === 'dashboard' ? 'max-w-full' : 'max-w-[1440px]'}`}>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
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
              <span className="text-[10px] text-theme-text-muted font-mono mr-1">
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {saving && (
              <span className="text-[10px] text-theme-accent font-mono animate-pulse mr-1">
                Saving...
              </span>
            )}

            {/* View Toggle */}
            <div className="flex items-center rounded-lg border border-theme-border overflow-hidden">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'dashboard'
                    ? 'bg-theme-accent text-white'
                    : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-bg'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </button>
              <button
                onClick={() => setViewMode('document')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-theme-border ${
                  viewMode === 'document'
                    ? 'bg-theme-accent text-white'
                    : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-bg'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Document
              </button>
            </div>

            {/* Load button */}
            <button
              onClick={() => setShowLoadModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-theme-border text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Load
            </button>

            {/* New Quote button */}
            <button
              onClick={() => navigate('/strategy/new?fresh=true')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-theme-border text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>

            {/* Export dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-theme-border text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-pulse' : ''}`} />
                {exporting ? 'Exporting...' : 'Export'}
              </button>
              {showExportMenu && !exporting && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-lg border border-theme-border bg-theme-card shadow-xl overflow-hidden">
                    <div className="px-3 py-1.5 text-[10px] text-theme-text-muted uppercase tracking-wide border-b border-theme-border/50">Dashboard View</div>
                    <button
                      onClick={() => handleExport('pdf', 'dashboard')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-theme-text hover:bg-theme-bg transition-colors"
                    >
                      <FileText className="w-4 h-4 text-theme-text-muted" />
                      PDF
                    </button>
                    <button
                      onClick={() => handleExport('png', 'dashboard')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-theme-text hover:bg-theme-bg transition-colors"
                    >
                      <FileImage className="w-4 h-4 text-theme-text-muted" />
                      PNG
                    </button>
                    <div className="px-3 py-1.5 text-[10px] text-theme-text-muted uppercase tracking-wide border-t border-b border-theme-border/50">Document View</div>
                    <button
                      onClick={() => handleExport('pdf', 'document')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-theme-text hover:bg-theme-bg transition-colors"
                    >
                      <FileText className="w-4 h-4 text-theme-text-muted" />
                      PDF
                    </button>
                    <button
                      onClick={() => handleExport('png', 'document')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-theme-text hover:bg-theme-bg transition-colors"
                    >
                      <FileImage className="w-4 h-4 text-theme-text-muted" />
                      PNG
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Configure button */}
            <button
              onClick={() => setShowConfigurator(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-theme-accent text-white hover:bg-theme-accent/90 transition-colors shadow-sm"
            >
              <Settings2 className="w-4 h-4" />
              Configure
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          /* Skeleton loading state — top bar stays visible */
          <div className="w-full animate-pulse space-y-0">
            {/* 3-column header skeleton */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-0 border border-theme-border/30 rounded-t">
              <div className="p-3 space-y-2">
                <div className="h-3 w-32 bg-theme-border/40 rounded" />
                <div className="h-2 w-24 bg-theme-border/20 rounded" />
                <div className="h-2 w-28 bg-theme-border/20 rounded" />
                <div className="h-2 w-20 bg-theme-border/20 rounded" />
                <div className="h-2 w-36 bg-theme-border/20 rounded" />
              </div>
              <div className="p-3 border-x border-theme-border/30 min-w-[240px]">
                <div className="h-4 w-40 bg-[#C9A04A]/20 rounded mx-auto mb-3" />
                <div className="space-y-2">
                  <div className="h-2 w-full bg-theme-border/20 rounded" />
                  <div className="h-2 w-full bg-theme-border/20 rounded" />
                  <div className="h-3 w-full bg-cyan-500/10 rounded" />
                </div>
              </div>
              <div className="p-3 space-y-2">
                <div className="h-3 w-24 bg-theme-border/40 rounded" />
                <div className="h-2 w-full bg-theme-border/20 rounded" />
                <div className="h-2 w-full bg-theme-border/20 rounded" />
              </div>
            </div>
            {/* Section bars skeleton */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-5 bg-[#C9A04A]/15 rounded-none" />
                <div className="border-x border-b border-theme-border/20 space-y-1 p-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-3 bg-theme-border/10 rounded w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : hasConfigured ? (
          <div ref={documentRef}>
            {viewMode === 'dashboard' ? (
              <CashflowDashboard
                inputs={inputs}
                calculations={calculations}
                clientInfo={clientInfo}
                exitScenarios={inputs._exitScenarios}
                currency={currency}
                rate={rate}
                language={language}
                exportMode={exportMode}
                mortgageData={mortgageData}
                brokerLogoUrl={brokerLogoUrl}
                setCurrency={setCurrency}
                setLanguage={setLanguage}
                advisorInfo={{
                  name: profile?.full_name || undefined,
                  email: profile?.business_email || undefined,
                  photoUrl: profile?.profile_photo_url || undefined,
                  phone: profile?.whatsapp_number
                    ? (profile.whatsapp_number.startsWith('+')
                      ? profile.whatsapp_number
                      : `${profile?.whatsapp_country_code || '+971'}${profile.whatsapp_number}`)
                    : undefined,
                }}
              />
            ) : (
              <CashflowDocument
                inputs={inputs}
                calculations={calculations}
                clientInfo={clientInfo}
                exitScenarios={inputs._exitScenarios}
                currency={currency}
                rate={rate}
                language={language}
                exportMode={exportMode}
                notes={notes}
                onNotesChange={setNotes}
                setCurrency={setCurrency}
                setLanguage={setLanguage}
                mortgageData={mortgageData}
                brokerLogoUrl={brokerLogoUrl}
                advisorInfo={{
                  name: profile?.full_name || undefined,
                  email: profile?.business_email || undefined,
                  photoUrl: profile?.profile_photo_url || undefined,
                  phone: profile?.whatsapp_number
                    ? (profile.whatsapp_number.startsWith('+')
                      ? profile.whatsapp_number
                      : `${profile?.whatsapp_country_code || '+971'}${profile.whatsapp_number}`)
                    : undefined,
                }}
              />
            )}
          </div>
        ) : (
          <div className="bg-theme-card rounded-xl border border-theme-border shadow-md flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C9A04A]/10 to-[#B3893A]/10 border border-[#C9A04A]/20 flex items-center justify-center mb-6">
              <FileText className="w-7 h-7 text-[#C9A04A]" />
            </div>
            <h2 className="font-display text-xl text-theme-text mb-2">No Strategy Configured</h2>
            <p className="text-sm text-theme-text-muted max-w-md mb-8">
              Configure your property details, payment plan, and growth assumptions to generate a cashflow statement.
            </p>
            <button
              onClick={() => setShowConfigurator(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-[#C9A04A] to-[#B3893A] text-white hover:opacity-90 transition-opacity shadow-lg shadow-[#B3893A]/20"
            >
              <Settings2 className="w-4 h-4" />
              Configure Strategy
            </button>
          </div>
        )}
      </main>

      {/* Configurator Modal */}
      <Dialog open={showConfigurator} onOpenChange={setShowConfigurator}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 border-theme-border bg-theme-card flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 border-b border-theme-border shrink-0">
            <h2 className="font-display text-base text-theme-text">Configure Strategy</h2>
            <button
              onClick={() => setShowConfigurator(false)}
              className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 px-6 py-4 overflow-hidden flex flex-col min-h-0">
            <Configurator
              inputs={inputs}
              onChange={handleInputsChange}
              onSave={handleSave}
              onShare={handleShare}
              isSaving={saving}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Quote Modal */}
      <LoadQuoteModal
        open={showLoadModal}
        onOpenChange={setShowLoadModal}
        onSelect={(id) => navigate(`/strategy/${id}`)}
      />
    </PageShell>
  );
};

export default StrategyCreator;
