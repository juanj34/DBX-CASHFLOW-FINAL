import React, { useState, useCallback, useRef } from 'react';
import { OIInputs } from '@/components/roi/useOICalculations';
import { PropertyPaymentStep } from './steps/PropertyPaymentStep';
import { PaymentPlanStep } from './steps/PaymentPlanStep';
import { GrowthExitsStep } from './steps/GrowthExitsStep';
import { RentalStep } from './steps/RentalStep';
import { MortgageStep } from './steps/MortgageStep';
import { ReviewStep } from './steps/ReviewStep';
import { Check } from 'lucide-react';
import { PaymentPlanDropZone } from '@/components/roi/configurator/PaymentPlanDropZone';
import { ExtractionConfirmModal } from '@/components/roi/configurator/ExtractionConfirmModal';
import type { AIPaymentPlanResult, AIUploadResponse } from '@/lib/aiExtractionTypes';
import { applyExtractedPlan } from '@/lib/applyExtractedPlan';
import { toast } from 'sonner';

interface ConfiguratorProps {
  inputs: OIInputs;
  onChange: (inputs: OIInputs) => void;
  onSave: () => void;
  onShare: () => void;
  isSaving?: boolean;
}

const STEPS = [
  { id: 1, label: 'AI & Property' },
  { id: 2, label: 'Payment Plan' },
  { id: 3, label: 'Growth & Exits' },
  { id: 4, label: 'Rental' },
  { id: 5, label: 'Mortgage' },
  { id: 6, label: 'Review' },
];

export const Configurator: React.FC<ConfiguratorProps> = ({
  inputs,
  onChange,
  onSave,
  onShare,
  isSaving,
}) => {
  const [step, setStep] = useState(1);

  const updateField = <K extends keyof OIInputs>(field: K, value: OIInputs[K]) => {
    onChange({ ...inputs, [field]: value });
  };

  const updateFields = (partial: Partial<OIInputs>) => {
    onChange({ ...inputs, ...partial });
  };

  // ── AI Extraction state ──────────────────────────────────────────
  const [extractedData, setExtractedData] = useState<AIPaymentPlanResult | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const extractAbortRef = useRef<AbortController | null>(null);

  const handleExtract = useCallback(async (dataUrls: string[]) => {
    setExtractedData(null);
    setExtractionError(null);
    setShowExtractionModal(true);
    setIsExtracting(true);

    const abortController = new AbortController();
    extractAbortRef.current = abortController;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/extract-payment-plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
          },
          body: JSON.stringify({
            images: dataUrls,
            bookingDate: {
              month: new Date().getMonth() + 1,
              year: new Date().getFullYear(),
            },
          }),
          signal: abortController.signal,
        }
      );

      const result = (await response.json()) as AIUploadResponse;

      if (!response.ok) {
        throw new Error(
          result?.error || `Edge function error (HTTP ${response.status})`
        );
      }

      if (!result?.success || !result?.data) {
        throw new Error(result?.error || 'Extraction failed — no data returned');
      }

      setExtractedData(result.data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const message =
        err instanceof Error ? err.message : 'Unknown extraction error';
      setExtractionError(message);
      console.error('AI extraction error:', err);
    } finally {
      setIsExtracting(false);
      extractAbortRef.current = null;
    }
  }, []);

  const handleApplyExtraction = useCallback(
    (data: AIPaymentPlanResult, bookingDate: { month: number; year: number }) => {
      const { inputs: newInputs, clientInfo } = applyExtractedPlan(
        data,
        bookingDate,
        inputs
      );

      // Merge extracted inputs + client info into OIInputs via updateFields
      updateFields({
        ...newInputs,
        _clientInfo: {
          ...(inputs as any)._clientInfo,
          ...clientInfo,
        },
      } as any);

      setShowExtractionModal(false);
      setExtractedData(null);
      toast.success('Payment plan imported successfully!');
    },
    [inputs, updateFields]
  );

  const handleCancelExtraction = useCallback(() => {
    extractAbortRef.current?.abort();
    setShowExtractionModal(false);
    setExtractedData(null);
    setExtractionError(null);
    setIsExtracting(false);
  }, []);

  const canProceed = () => {
    if (step === 1) return inputs.basePrice > 0;
    return true;
  };

  const totalSteps = STEPS.length;

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator — pinned at top */}
      <div className="flex items-center gap-2 pb-4 border-b border-theme-border/50 shrink-0">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            {i > 0 && <div className="flex-1 h-px bg-theme-border" />}
            <button
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                step === s.id
                  ? 'bg-theme-accent/10 text-theme-accent border border-theme-accent/20'
                  : s.id < step
                  ? 'text-theme-positive bg-theme-positive/10 border border-theme-positive/20'
                  : 'text-theme-text-muted hover:text-theme-text border border-transparent'
              }`}
            >
              {s.id < step ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                  {s.id}
                </span>
              )}
              {s.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Scrollable step content */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
        {/* AI Import Drop Zone — only on step 1 */}
        {step === 1 && (
          <PaymentPlanDropZone
            onExtract={handleExtract}
            extracting={isExtracting}
          />
        )}

        {step === 1 && (
          <PropertyPaymentStep
            inputs={inputs}
            updateField={updateField}
            updateFields={updateFields}
          />
        )}
        {step === 2 && (
          <PaymentPlanStep
            inputs={inputs}
            updateField={updateField}
            updateFields={updateFields}
          />
        )}
        {step === 3 && (
          <GrowthExitsStep
            inputs={inputs}
            updateField={updateField}
            updateFields={updateFields}
          />
        )}
        {step === 4 && (
          <RentalStep
            inputs={inputs}
            updateField={updateField}
          />
        )}
        {step === 5 && (
          <MortgageStep
            inputs={inputs}
            updateField={updateField}
            updateFields={updateFields}
          />
        )}
        {step === 6 && (
          <ReviewStep
            inputs={inputs}
            onSave={onSave}
            onShare={onShare}
            isSaving={isSaving}
          />
        )}
      </div>

      {/* Navigation — pinned at bottom */}
      <div className="flex items-center justify-between pt-4 border-t border-theme-border shrink-0">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-4 py-2 rounded-lg text-sm font-medium text-theme-text-muted hover:text-theme-text disabled:opacity-30 transition-colors"
        >
          Back
        </button>
        {step < totalSteps ? (
          <button
            onClick={() => setStep(Math.min(totalSteps, step + 1))}
            disabled={!canProceed()}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-theme-accent text-white hover:bg-theme-accent/90 disabled:opacity-30 transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#C9A04A] to-[#B3893A] text-white hover:from-[#D4AA55] hover:to-[#C9A04A] shadow-lg shadow-[#B3893A]/20 disabled:opacity-50 transition-all"
          >
            {isSaving ? 'Saving...' : 'Save Strategy'}
          </button>
        )}
      </div>

      {/* AI Extraction Confirmation Modal */}
      <ExtractionConfirmModal
        open={showExtractionModal}
        onOpenChange={setShowExtractionModal}
        data={extractedData}
        error={extractionError}
        onApply={handleApplyExtraction}
        onCancel={handleCancelExtraction}
        existingBookingMonth={inputs.bookingMonth}
        existingBookingYear={inputs.bookingYear}
      />
    </div>
  );
};
