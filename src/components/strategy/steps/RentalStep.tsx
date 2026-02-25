import React from 'react';
import { OIInputs } from '@/components/roi/useOICalculations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface Props {
  inputs: OIInputs;
  updateField: <K extends keyof OIInputs>(field: K, value: OIInputs[K]) => void;
}

export const RentalStep: React.FC<Props> = ({ inputs, updateField }) => {
  const rentalYield = inputs.rentalYieldPercent ?? 7;
  const rentGrowthRate = inputs.rentGrowthRate ?? 4;
  const serviceCharge = inputs.serviceChargePerSqft ?? 18;

  // Calculated values
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
    <div className="space-y-8">
      {/* Rental Yield */}
      <section>
        <h3 className="font-display text-lg text-theme-text mb-2">Rental Income</h3>
        <p className="text-xs text-theme-text-muted mb-6">
          Expected annual rental yield on the purchase price. Rent starts at handover.
        </p>

        <div className="p-4 rounded-xl border border-theme-border bg-theme-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <Label className="text-sm text-theme-text">Annual Yield</Label>
              <p className="text-xs text-theme-text-muted mt-0.5">On purchase price</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xl text-theme-positive font-semibold">{rentalYield}</span>
              <span className="text-sm text-theme-text-muted">%</span>
            </div>
          </div>
          <Slider
            value={[rentalYield]}
            onValueChange={([v]) => updateField('rentalYieldPercent', v)}
            min={0}
            max={15}
            step={0.1}
            className="roi-slider-cyan"
          />
          <div className="flex justify-between text-[10px] text-theme-text-muted mt-1">
            <span>0%</span>
            <span>15%</span>
          </div>

          {/* Calculated summary */}
          {inputs.basePrice > 0 && (
            <div className="mt-4 pt-3 border-t border-theme-border space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-theme-text-muted">Annual Rent</span>
                <span className="font-mono text-theme-text">AED {formatAED(annualRent)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-theme-text-muted">Monthly Rent</span>
                <span className="font-mono text-theme-text">AED {formatAED(monthlyRent)}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Rent Growth */}
      <section>
        <div className="p-4 rounded-xl border border-theme-border bg-theme-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <Label className="text-sm text-theme-text">Annual Rent Growth</Label>
              <p className="text-xs text-theme-text-muted mt-0.5">Year-over-year increase</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xl text-theme-accent font-semibold">{rentGrowthRate}</span>
              <span className="text-sm text-theme-text-muted">%</span>
            </div>
          </div>
          <Slider
            value={[rentGrowthRate]}
            onValueChange={([v]) => updateField('rentGrowthRate', v)}
            min={0}
            max={10}
            step={0.5}
            className="roi-slider-lime"
          />
          <div className="flex justify-between text-[10px] text-theme-text-muted mt-1">
            <span>0%</span>
            <span>10%</span>
          </div>
        </div>
      </section>

      {/* Service Charges */}
      <section>
        <h3 className="font-display text-lg text-theme-text mb-4">Service Charges</h3>
        <div className="p-4 rounded-xl border border-theme-border bg-theme-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <Label className="text-sm text-theme-text">Per sqft / year</Label>
              <p className="text-xs text-theme-text-muted mt-0.5">Deducted from gross rent</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-theme-text-muted">AED</span>
              <Input
                type="number"
                value={serviceCharge}
                onChange={(e) => updateField('serviceChargePerSqft', Number(e.target.value))}
                className="w-20 bg-theme-bg border-theme-border text-theme-text font-mono text-right text-sm"
              />
            </div>
          </div>

          {inputs.unitSizeSqf && inputs.unitSizeSqf > 0 && (
            <div className="pt-3 border-t border-theme-border space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-theme-text-muted">Annual Service Charges</span>
                <span className="font-mono text-theme-negative">AED {formatAED(annualServiceCharge)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-theme-text-muted">Net Annual Rent</span>
                <span className={`font-mono ${netAnnualRent > 0 ? 'text-theme-positive' : 'text-theme-negative'}`}>
                  AED {formatAED(netAnnualRent)}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
