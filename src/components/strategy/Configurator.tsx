import React, { useState } from 'react';
import { OIInputs } from '@/components/roi/useOICalculations';
import { PropertyPaymentStep } from './steps/PropertyPaymentStep';
import { GrowthExitsStep } from './steps/GrowthExitsStep';
import { RentalStep } from './steps/RentalStep';
import { ReviewStep } from './steps/ReviewStep';
import { Check } from 'lucide-react';

interface ConfiguratorProps {
  inputs: OIInputs;
  onChange: (inputs: OIInputs) => void;
  onSave: () => void;
  onShare: () => void;
  isSaving?: boolean;
}

const STEPS = [
  { id: 1, label: 'Property & Payment' },
  { id: 2, label: 'Growth & Exits' },
  { id: 3, label: 'Rental' },
  { id: 4, label: 'Review' },
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

  const canProceed = () => {
    if (step === 1) return inputs.basePrice > 0;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            {i > 0 && <div className="flex-1 h-px bg-theme-border" />}
            <button
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <PropertyPaymentStep
            inputs={inputs}
            updateField={updateField}
            updateFields={updateFields}
          />
        )}
        {step === 2 && (
          <GrowthExitsStep
            inputs={inputs}
            updateField={updateField}
            updateFields={updateFields}
          />
        )}
        {step === 3 && (
          <RentalStep
            inputs={inputs}
            updateField={updateField}
          />
        )}
        {step === 4 && (
          <ReviewStep
            inputs={inputs}
            onSave={onSave}
            onShare={onShare}
            isSaving={isSaving}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-theme-border">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-4 py-2 rounded-lg text-sm font-medium text-theme-text-muted hover:text-theme-text disabled:opacity-30 transition-colors"
        >
          Back
        </button>
        {step < 4 ? (
          <button
            onClick={() => setStep(Math.min(4, step + 1))}
            disabled={!canProceed()}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-theme-accent text-theme-bg hover:bg-theme-accent/90 disabled:opacity-30 transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
          >
            {isSaving ? 'Saving...' : 'Save Strategy'}
          </button>
        )}
      </div>
    </div>
  );
};
