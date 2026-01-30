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
import { CashflowQuote } from '@/hooks/useCashflowQuote';
import { OIInputs } from '@/components/roi/useOICalculations';

interface ComparisonConfiguratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompare: (quoteId: string, secondaryInputs: SecondaryInputs, exitMonths?: number[]) => void;
  initialQuoteId?: string;
  initialSecondaryInputs?: SecondaryInputs;
  initialExitMonths?: number[];
  handoverMonths?: number;
}

export const ComparisonConfiguratorModal = ({
  open,
  onOpenChange,
  onCompare,
  initialQuoteId,
  initialSecondaryInputs,
  initialExitMonths = [36, 60, 120],
  handoverMonths = 24,
}: ComparisonConfiguratorModalProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(initialQuoteId ? 2 : 1);
  const [selectedQuote, setSelectedQuote] = useState<CashflowQuote | null>(null);
  const [secondaryInputs, setSecondaryInputs] = useState<SecondaryInputs>(
    initialSecondaryInputs || DEFAULT_SECONDARY_INPUTS
  );
  const [exitMonths, setExitMonths] = useState<number[]>(initialExitMonths);

  // Reset when modal opens/closes
  useEffect(() => {
    if (open && !initialQuoteId) {
      setStep(1);
      setSelectedQuote(null);
    }
  }, [open, initialQuoteId]);

  // Initialize secondary inputs when quote is selected
  useEffect(() => {
    if (selectedQuote?.inputs) {
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
    }
  }, [selectedQuote]);

  const handleQuoteSelect = (quote: CashflowQuote) => {
    setSelectedQuote(quote);
    setStep(2);
  };

  const handleCompare = () => {
    if (selectedQuote) {
      onCompare(selectedQuote.id, secondaryInputs, exitMonths);
      onOpenChange(false);
    }
  };

  const stepLabels = ['Seleccionar Quote', 'Configurar Secundaria', 'Puntos de Salida'];

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-theme-border">
          <DialogTitle className="flex items-center gap-2 text-theme-text">
            <Sparkles className="w-5 h-5 text-theme-accent" />
            Off-Plan vs Secundaria
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
            />
          )}
          {step === 2 && (
            <SecondaryPropertyStep
              inputs={secondaryInputs}
              onChange={setSecondaryInputs}
              offPlanPrice={selectedQuote?.inputs?.basePrice}
            />
          )}
          {step === 3 && (
            <ExitScenariosStep
              exitMonths={exitMonths}
              onChange={setExitMonths}
              handoverMonths={handoverMonths}
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
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </Button>

          {step >= 2 && (
            <Button
              onClick={handleNext}
              disabled={!selectedQuote}
              className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90"
            >
              {step === 3 ? 'Comparar Ahora' : 'Siguiente'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
