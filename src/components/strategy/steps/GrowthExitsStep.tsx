import React from 'react';
import { OIInputs } from '@/components/roi/useOICalculations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface Props {
  inputs: OIInputs;
  updateField: <K extends keyof OIInputs>(field: K, value: OIInputs[K]) => void;
  updateFields: (partial: Partial<OIInputs>) => void;
}

const COMMON_EXITS = [12, 18, 24, 30, 36, 48, 60, 72, 84, 96, 108, 120];

export const GrowthExitsStep: React.FC<Props> = ({ inputs, updateField, updateFields }) => {
  const totalMonths = (() => {
    const booking = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
    const handover = new Date(inputs.handoverYear, inputs.handoverMonth - 1);
    return Math.max(1, Math.round((handover.getTime() - booking.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  })();

  const exitScenarios = inputs._exitScenarios || [totalMonths, totalMonths + 24, totalMonths + 60];

  const toggleExit = (month: number) => {
    const current = [...exitScenarios];
    const idx = current.indexOf(month);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(month);
      current.sort((a, b) => a - b);
    }
    updateField('_exitScenarios', current);
  };

  const constructionAppreciation = inputs.constructionAppreciation ?? 12;
  const postConstructionAppreciation = inputs.postConstructionAppreciation ?? 6;

  return (
    <div className="space-y-8">
      {/* Appreciation Rates */}
      <section>
        <h3 className="font-display text-lg text-theme-text mb-2">Appreciation</h3>
        <p className="text-xs text-theme-text-muted mb-6">
          Annual property value growth rates for each phase. Monthly compounding applied.
        </p>

        <div className="space-y-6">
          {/* Construction */}
          <div className="p-4 rounded-xl border border-theme-border bg-theme-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="text-sm text-theme-text">During Construction</Label>
                <p className="text-xs text-theme-text-muted mt-0.5">Booking to handover</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-xl text-theme-accent font-semibold">
                  {constructionAppreciation}
                </span>
                <span className="text-sm text-theme-text-muted">%</span>
              </div>
            </div>
            <Slider
              value={[constructionAppreciation]}
              onValueChange={([v]) => updateField('constructionAppreciation', v)}
              min={0}
              max={25}
              step={0.5}
              className="roi-slider-lime"
            />
            <div className="flex justify-between text-[10px] text-theme-text-muted mt-1">
              <span>0%</span>
              <span>25%</span>
            </div>
          </div>

          {/* Post-construction */}
          <div className="p-4 rounded-xl border border-theme-border bg-theme-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="text-sm text-theme-text">After Handover</Label>
                <p className="text-xs text-theme-text-muted mt-0.5">Ongoing appreciation</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-xl text-theme-accent font-semibold">
                  {postConstructionAppreciation}
                </span>
                <span className="text-sm text-theme-text-muted">%</span>
              </div>
            </div>
            <Slider
              value={[postConstructionAppreciation]}
              onValueChange={([v]) => updateField('postConstructionAppreciation' as any, v)}
              min={0}
              max={20}
              step={0.5}
              className="roi-slider-lime"
            />
            <div className="flex justify-between text-[10px] text-theme-text-muted mt-1">
              <span>0%</span>
              <span>20%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Exit Scenarios */}
      <section>
        <h3 className="font-display text-lg text-theme-text mb-2">Exit Months</h3>
        <p className="text-xs text-theme-text-muted mb-4">
          Select months from booking to analyze. Handover is at month {totalMonths}.
        </p>

        <div className="flex flex-wrap gap-2">
          {COMMON_EXITS.map((month) => {
            const isSelected = exitScenarios.includes(month);
            const isHandover = Math.abs(month - totalMonths) <= 1;
            return (
              <button
                key={month}
                onClick={() => toggleExit(month)}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-medium border transition-all ${
                  isSelected
                    ? isHandover
                      ? 'bg-theme-positive/10 text-theme-positive border-theme-positive/30'
                      : 'bg-theme-accent/10 text-theme-accent border-theme-accent/30'
                    : 'text-theme-text-muted border-theme-border hover:border-theme-accent/20 hover:text-theme-text'
                }`}
              >
                {month}m
                {isHandover && <span className="ml-1 text-[9px] opacity-70">HO</span>}
              </button>
            );
          })}
        </div>

        {/* Custom exit input */}
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="number"
            placeholder="Custom month"
            className="w-32 bg-theme-card border-theme-border text-theme-text font-mono text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = Number((e.target as HTMLInputElement).value);
                if (val > 0 && !exitScenarios.includes(val)) {
                  toggleExit(val);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
          <span className="text-xs text-theme-text-muted">Press Enter to add</span>
        </div>
      </section>

      {/* Exit Costs */}
      <section>
        <h3 className="font-display text-lg text-theme-text mb-4">Exit Costs</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-theme-border bg-theme-card">
            <div>
              <Label className="text-sm text-theme-text">Agent Commission (2%)</Label>
              <p className="text-xs text-theme-text-muted">Applied to exit price</p>
            </div>
            <Switch
              checked={inputs.exitAgentCommissionEnabled}
              onCheckedChange={(v) => updateField('exitAgentCommissionEnabled', v)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-theme-border bg-theme-card">
            <div>
              <Label className="text-sm text-theme-text">NOC Fee (AED)</Label>
              <p className="text-xs text-theme-text-muted">Developer fee for resale</p>
            </div>
            <Input
              type="number"
              value={inputs.exitNocFee}
              onChange={(e) => updateField('exitNocFee', Number(e.target.value))}
              className="w-24 bg-theme-bg border-theme-border text-theme-text font-mono text-right text-sm"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-theme-border bg-theme-card">
            <div>
              <Label className="text-sm text-theme-text">Minimum Exit Threshold</Label>
              <p className="text-xs text-theme-text-muted">% of property paid before resale allowed</p>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={inputs.minimumExitThreshold}
                onChange={(e) => updateField('minimumExitThreshold', Number(e.target.value))}
                className="w-20 bg-theme-bg border-theme-border text-theme-text font-mono text-right text-sm"
              />
              <span className="text-xs text-theme-text-muted">%</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
