import React from 'react';
import { OIInputs } from '@/components/roi/useOICalculations';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MoneyInput } from '@/components/ui/money-input';

interface Props {
  inputs: OIInputs;
  updateField: <K extends keyof OIInputs>(field: K, value: OIInputs[K]) => void;
}

export const RentalStep: React.FC<Props> = ({ inputs, updateField }) => {
  const rentalYield = inputs.rentalYieldPercent ?? 7;
  const rentGrowthRate = inputs.rentGrowthRate ?? 4;
  const serviceCharge = inputs.serviceChargePerSqft ?? 18;

  const annualRent = inputs.basePrice * (rentalYield / 100);
  const monthlyRent = annualRent / 12;
  const annualServiceCharge = (inputs.unitSizeSqf || 0) * serviceCharge;
  const netAnnualRent = annualRent - annualServiceCharge;

  const formatAED = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toFixed(0);
  };

  return (
    <div className="space-y-3">
      {/* Rental Yield */}
      <div className="p-3 rounded-xl border border-theme-border bg-theme-card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <Label className="text-xs text-theme-text">Annual Yield</Label>
            <p className="text-[10px] text-theme-text-muted">On purchase price</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-lg text-theme-positive font-semibold">{rentalYield}</span>
            <span className="text-xs text-theme-text-muted">%</span>
          </div>
        </div>
        <Slider
          value={[rentalYield]}
          onValueChange={([v]) => updateField('rentalYieldPercent', v)}
          min={0} max={15} step={0.1}
          className="roi-slider-cyan"
        />
        <div className="flex justify-between text-[10px] text-theme-text-muted mt-1">
          <span>0%</span><span>15%</span>
        </div>
        {inputs.basePrice > 0 && (
          <div className="mt-2 pt-2 border-t border-theme-border/50 flex gap-4 text-[11px]">
            <span className="text-theme-text-muted">Annual: <span className="font-mono text-theme-text">AED {formatAED(annualRent)}</span></span>
            <span className="text-theme-text-muted">Monthly: <span className="font-mono text-theme-text">AED {formatAED(monthlyRent)}</span></span>
          </div>
        )}
      </div>

      {/* Rent Growth */}
      <div className="p-3 rounded-xl border border-theme-border bg-theme-card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <Label className="text-xs text-theme-text">Annual Rent Growth</Label>
            <p className="text-[10px] text-theme-text-muted">Year-over-year increase</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-lg text-theme-accent font-semibold">{rentGrowthRate}</span>
            <span className="text-xs text-theme-text-muted">%</span>
          </div>
        </div>
        <Slider
          value={[rentGrowthRate]}
          onValueChange={([v]) => updateField('rentGrowthRate', v)}
          min={0} max={10} step={0.5}
          className="roi-slider-lime"
        />
        <div className="flex justify-between text-[10px] text-theme-text-muted mt-1">
          <span>0%</span><span>10%</span>
        </div>
      </div>

      {/* Service Charges */}
      <div className="p-3 rounded-xl border border-theme-border bg-theme-card">
        <div className="flex items-center justify-between mb-1">
          <div>
            <Label className="text-xs text-theme-text">Service Charge (per sqft/yr)</Label>
          </div>
          <MoneyInput
            value={serviceCharge}
            onChange={(v) => updateField('serviceChargePerSqft', v)}
            className="w-24 h-7 bg-theme-bg border-theme-border text-theme-text text-xs"
          />
        </div>
        {inputs.unitSizeSqf > 0 && (
          <div className="pt-2 border-t border-theme-border/50 flex gap-4 text-[11px]">
            <span className="text-theme-text-muted">Annual: <span className="font-mono text-theme-negative">AED {formatAED(annualServiceCharge)}</span></span>
            <span className="text-theme-text-muted">Net Rent: <span className={`font-mono ${netAnnualRent > 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>AED {formatAED(netAnnualRent)}</span></span>
          </div>
        )}
      </div>
    </div>
  );
};
