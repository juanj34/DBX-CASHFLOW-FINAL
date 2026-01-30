import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { QuoteSelectionStep } from './QuoteSelectionStep';
import { SecondaryPropertyStep } from './SecondaryPropertyStep';
import { ExitScenariosStep } from './ExitScenariosStep';
import { SecondaryInputs, DEFAULT_SECONDARY_INPUTS } from './types';
import { CashflowQuote, useCashflowQuote } from '@/hooks/useCashflowQuote';
import { OIInputs } from '@/components/roi/useOICalculations';
import { Currency } from '@/components/roi/currencyUtils';

interface ComparisonConfiguratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompare: (quoteId: string, secondaryInputs: SecondaryInputs, exitMonths?: number[]) => void;
  initialQuoteId?: string;
  initialSecondaryInputs?: SecondaryInputs;
  initialExitMonths?: number[];
  handoverMonths?: number;
  currency?: Currency;
  rate?: number;
  language?: 'en' | 'es';
}

export const ComparisonConfiguratorModal = ({
  open,
  onOpenChange,
  onCompare,
  initialQuoteId,
  initialSecondaryInputs,
  initialExitMonths = [36, 60, 120],
  handoverMonths = 24,
  currency = 'AED',
  rate = 1,
  language = 'es',
}: ComparisonConfiguratorModalProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(initialQuoteId ? 2 : 1);
  const [selectedQuote, setSelectedQuote] = useState<CashflowQuote | null>(null);
  
  // Use a ref to store the "working" secondary inputs to prevent state loss
  const [secondaryInputs, setSecondaryInputs] = useState<SecondaryInputs>(
    initialSecondaryInputs || DEFAULT_SECONDARY_INPUTS
  );
  const [exitMonths, setExitMonths] = useState<number[]>(initialExitMonths);
  
  // Track if we've EVER initialized from quote (once true, never reset until modal closes AND reopens fresh)
  const [hasInitializedFromQuote, setHasInitializedFromQuote] = useState(!!initialSecondaryInputs);
  
  // Property name managed here to persist across modal opens
  const [propertyName, setPropertyName] = useState<string>(
    initialSecondaryInputs?.propertyName || ''
  );
  
  // Load initial quote when initialQuoteId is provided
  const { quote: initialQuote } = useCashflowQuote(initialQuoteId);
  
  // Set selectedQuote from initialQuote when it loads
  useEffect(() => {
    if (initialQuote && !selectedQuote && initialQuoteId) {
      setSelectedQuote(initialQuote);
    }
  }, [initialQuote, selectedQuote, initialQuoteId]);

  const t = language === 'es' ? {
    title: 'Off-Plan vs Secundaria',
    selectQuote: 'Seleccionar Quote',
    configureSecondary: 'Configurar Secundaria',
    exitPoints: 'Puntos de Salida',
    cancel: 'Cancelar',
    back: 'Atrás',
    next: 'Siguiente',
    compareNow: 'Comparar Ahora',
  } : {
    title: 'Off-Plan vs Secondary',
    selectQuote: 'Select Quote',
    configureSecondary: 'Configure Secondary',
    exitPoints: 'Exit Points',
    cancel: 'Cancel',
    back: 'Back',
    next: 'Next',
    compareNow: 'Compare Now',
  };

  const stepLabels = [t.selectQuote, t.configureSecondary, t.exitPoints];

  // Reset when modal opens - but ONLY reset if starting completely fresh (no initial data)
  useEffect(() => {
    if (open) {
      // Only reset to defaults if this is a completely new comparison (no initial quote, no initial inputs)
      if (!initialQuoteId && !initialSecondaryInputs) {
        setStep(1);
        setSelectedQuote(null);
        setSecondaryInputs(DEFAULT_SECONDARY_INPUTS);
        setPropertyName('');
        setHasInitializedFromQuote(false);
      }
      // If we have initial data, use it (this handles the "Reconfigure" case)
      else {
        if (initialSecondaryInputs) {
          setSecondaryInputs(initialSecondaryInputs);
          setPropertyName(initialSecondaryInputs.propertyName || '');
          setHasInitializedFromQuote(true); // Already have inputs, don't overwrite
        }
        if (initialExitMonths && initialExitMonths.length > 0) {
          setExitMonths(initialExitMonths);
        }
        // Start at step 2 if we have a quote
        if (initialQuoteId) {
          setStep(2);
        }
      }
    }
  }, [open]); // Only depend on `open` - initial values are read once
  
  // Reset initialization flag when modal closes completely
  // But DON'T reset if we're just temporarily closing
  useEffect(() => {
    if (!open) {
      // Only reset if there's no initial data (meaning this was a fresh comparison)
      if (!initialQuoteId && !initialSecondaryInputs) {
        setHasInitializedFromQuote(false);
      }
    }
  }, [open, initialQuoteId, initialSecondaryInputs]);

  // Initialize secondary inputs when a NEW quote is selected in step 1
  // This should ONLY run when user manually selects a different quote, not on re-renders
  useEffect(() => {
    // Only initialize if:
    // 1. We have a selected quote with inputs
    // 2. We haven't already initialized from a quote
    // 3. We don't have initial secondary inputs passed in (meaning this is a fresh selection)
    if (selectedQuote?.inputs && !hasInitializedFromQuote && !initialSecondaryInputs) {
      const inputs = selectedQuote.inputs as OIInputs;
      setSecondaryInputs(prev => ({
        ...prev,
        purchasePrice: inputs.basePrice || prev.purchasePrice,
        unitSizeSqf: inputs.unitSizeSqf || prev.unitSizeSqf,
        showAirbnbComparison: inputs.showAirbnbComparison ?? true,
        averageDailyRate: inputs.shortTermRental?.averageDailyRate || prev.averageDailyRate,
        occupancyPercent: inputs.shortTermRental?.occupancyPercent || prev.occupancyPercent,
        operatingExpensePercent: inputs.shortTermRental?.operatingExpensePercent || prev.operatingExpensePercent,
        managementFeePercent: inputs.shortTermRental?.managementFeePercent || prev.managementFeePercent,
      }));
      setHasInitializedFromQuote(true);
    }
  }, [selectedQuote?.id, hasInitializedFromQuote, initialSecondaryInputs]); // Use quote ID, not full object

  const handleQuoteSelect = (quote: CashflowQuote) => {
    setSelectedQuote(quote);
    setHasInitializedFromQuote(false); // Allow initialization for new quote selection
    setStep(2);
  };

  const handleCompare = () => {
    if (selectedQuote) {
      // Include property name in secondary inputs
      const finalInputs: SecondaryInputs = {
        ...secondaryInputs,
        propertyName: propertyName,
      };
      onCompare(selectedQuote.id, finalInputs, exitMonths);
      onOpenChange(false);
    }
  };

  const handleNext = () => {
    if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      handleCompare();
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onPointerDownOutside={() => onOpenChange(false)}
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <DialogHeader className="pb-4 border-b border-theme-border">
          <DialogTitle className="flex items-center gap-2 text-theme-text">
            <Sparkles className="w-5 h-5 text-theme-accent" />
            {t.title}
          </DialogTitle>
          
          {/* Step Indicator */}
          <div className="flex items-center gap-3 pt-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    s === step
                      ? 'bg-theme-accent text-theme-accent-foreground'
                      : s < step
                      ? 'bg-emerald-500/20 text-emerald-500'
                      : 'bg-theme-border text-theme-text-muted'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                <span className={`text-sm ${s === step ? 'text-theme-text font-medium' : 'text-theme-text-muted'} hidden sm:inline`}>
                  {stepLabels[s - 1]}
                </span>
                {s < 3 && <div className="w-6 h-px bg-theme-border hidden sm:block" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {step === 1 && (
            <QuoteSelectionStep
              selectedQuoteId={selectedQuote?.id}
              onSelect={handleQuoteSelect}
              language={language}
            />
          )}
          {step === 2 && (
            <SecondaryPropertyStep
              inputs={secondaryInputs}
              onChange={setSecondaryInputs}
              propertyName={propertyName}
              onPropertyNameChange={setPropertyName}
              offPlanPrice={selectedQuote?.inputs?.basePrice}
              currency={currency}
              rate={rate}
              language={language}
            />
          )}
          {step === 3 && (
            <ExitScenariosStep
              exitMonths={exitMonths}
              onChange={setExitMonths}
              handoverMonths={handoverMonths}
              language={language}
            />
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-theme-border flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-theme-text-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step === 1 ? t.cancel : t.back}
          </Button>

          {step >= 2 && (
            <Button
              onClick={handleNext}
              disabled={!selectedQuote}
              className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90"
            >
              {step === 3 ? t.compareNow : t.next}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
