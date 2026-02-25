import React, { useMemo, useCallback, useEffect } from 'react';
import { OIInputs } from '@/components/roi/useOICalculations';
import { calculateExitScenario } from '@/components/roi/constructionProgress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Minus } from 'lucide-react';

interface Props {
  inputs: OIInputs;
  updateField: <K extends keyof OIInputs>(field: K, value: OIInputs[K]) => void;
  updateFields: (partial: Partial<OIInputs>) => void;
}

const n2s = (n: number) => new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(n);

// Removed — replaced by structured presets below

export const GrowthExitsStep: React.FC<Props> = ({ inputs, updateField, updateFields }) => {
  const totalMonths = useMemo(() => {
    const booking = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
    const handover = new Date(inputs.handoverYear, inputs.handoverMonth - 1);
    return Math.max(1, Math.round((handover.getTime() - booking.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  }, [inputs.bookingYear, inputs.bookingMonth, inputs.handoverYear, inputs.handoverMonth]);

  // Persist default exits on first visit so the document doesn't fabricate them
  useEffect(() => {
    if (!inputs._exitScenarios) {
      updateField('_exitScenarios', [totalMonths, totalMonths + 24, totalMonths + 60]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exitScenarios = inputs._exitScenarios || [totalMonths, totalMonths + 24, totalMonths + 60];
  const constructionYears = Math.ceil(totalMonths / 12);
  const constructionAppreciation = inputs.constructionAppreciation ?? 12;
  const postConstructionAppreciation = inputs.postConstructionAppreciation ?? 6;
  const isYearByYear = !!inputs.constructionSchedule?.length;

  const dldFee = inputs.basePrice * 0.04;
  const totalEntryCosts = dldFee + (inputs.oqoodFee || 5000);

  // Flat preset exits — single compact row
  const presetExits = useMemo(() => [
    ...[
      { label: '6m', month: 6 },
      { label: '12m', month: 12 },
      { label: '18m', month: 18 },
      { label: '24m', month: 24 },
    ].filter(e => e.month < totalMonths),
    { label: 'Handover', month: totalMonths, isHandover: true as const },
    { label: '+6', month: totalMonths + 6 },
    { label: '+12', month: totalMonths + 12 },
    { label: '+18', month: totalMonths + 18 },
    { label: '+24', month: totalMonths + 24 },
  ], [totalMonths]);

  const toggleExit = useCallback((month: number) => {
    const current = [...exitScenarios];
    const idx = current.indexOf(month);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(month);
      current.sort((a, b) => a - b);
    }
    updateField('_exitScenarios', current);
  }, [exitScenarios, updateField]);

  // Compute exit metrics for selected exits
  const exitMetrics = useMemo(() => {
    if (inputs.basePrice <= 0) return {};
    const metrics: Record<number, { roe: string; price: string }> = {};
    exitScenarios.forEach(month => {
      try {
        const result = calculateExitScenario(month, inputs.basePrice, totalMonths, inputs, totalEntryCosts);
        const displayROE = result.exitCosts > 0 ? result.netROE : result.trueROE;
        metrics[month] = {
          roe: displayROE.toFixed(1),
          price: n2s(result.exitPrice),
        };
      } catch {
        // Skip
      }
    });
    return metrics;
  }, [exitScenarios, inputs, totalMonths, totalEntryCosts]);

  // Year-by-year schedule helpers
  const generateDecliningSchedule = useCallback((baseRate: number, years: number): number[] => {
    const schedule: number[] = [];
    for (let i = 0; i < years; i++) {
      schedule.push(Math.max(2, Math.round((baseRate - i * 2) * 2) / 2));
    }
    return schedule;
  }, []);

  const toggleYearByYear = useCallback((enabled: boolean) => {
    if (enabled) {
      const schedule = generateDecliningSchedule(constructionAppreciation, constructionYears);
      updateField('constructionSchedule' as any, schedule);
    } else {
      updateField('constructionSchedule' as any, undefined);
    }
  }, [constructionAppreciation, constructionYears, generateDecliningSchedule, updateField]);

  const updateScheduleYear = useCallback((yearIdx: number, value: number) => {
    const current = [...(inputs.constructionSchedule || [])];
    while (current.length < constructionYears) {
      current.push(constructionAppreciation);
    }
    current[yearIdx] = value;
    updateField('constructionSchedule' as any, current);
  }, [inputs.constructionSchedule, constructionYears, constructionAppreciation, updateField]);

  // Get semantic label for a month
  const getExitLabel = (month: number) => {
    if (month === totalMonths) return 'Handover';
    if (month === totalMonths - 1) return 'Pre-HO';
    if (month < totalMonths) return `${month}m`;
    const yearsAfter = Math.round((month - totalMonths) / 12);
    if (yearsAfter > 0) return `+${yearsAfter}yr`;
    return `+${month - totalMonths}m`;
  };

  return (
    <div className="space-y-8">
      {/* ─── PICK EXIT TIMES ─── */}
      <section>
        <h3 className="font-display text-lg text-theme-text mb-1">Pick Exit Times</h3>
        <p className="text-xs text-theme-text-muted mb-4">
          Choose when to analyze selling. Handover at month {totalMonths}.
        </p>

        {/* Preset exits — single row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {presetExits.map((exit) => {
            const isSelected = exitScenarios.includes(exit.month);
            const isHO = 'isHandover' in exit;
            return (
              <button
                key={exit.month}
                onClick={() => toggleExit(exit.month)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-theme-accent/10 text-theme-accent border-theme-accent/30 ring-1 ring-theme-accent/20'
                    : isHO
                    ? 'text-theme-accent/70 border-theme-accent/30 hover:bg-theme-accent/5'
                    : 'text-theme-text-muted border-theme-border hover:border-theme-accent/20 hover:text-theme-text'
                }`}
              >
                {exit.label}
              </button>
            );
          })}
        </div>

        {/* Custom exit input */}
        <div className="flex items-center gap-2">
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

        {/* Selected exits summary with metrics */}
        {exitScenarios.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-theme-bg border border-theme-border/50">
            <p className="text-[10px] font-medium text-theme-text-muted uppercase tracking-wide mb-2">
              {exitScenarios.length} exit{exitScenarios.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex flex-wrap gap-1.5">
              {exitScenarios.map((month) => {
                const metrics = exitMetrics[month];
                return (
                  <span
                    key={month}
                    className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-theme-card border border-theme-border text-[10px] font-mono text-theme-text"
                  >
                    {getExitLabel(month)}
                    <span className="opacity-50">{month}m</span>
                    {metrics && (
                      <span className="text-theme-positive ml-0.5">{metrics.roe}%</span>
                    )}
                    <button
                      onClick={() => toggleExit(month)}
                      className="ml-0.5 p-0.5 rounded hover:bg-theme-negative/10 text-theme-text-muted hover:text-theme-negative transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ─── APPRECIATION RATES ─── */}
      <section>
        <h3 className="font-display text-lg text-theme-text mb-1">Appreciation Rates</h3>
        <p className="text-xs text-theme-text-muted mb-4">
          Annual property value growth. Monthly compounding applied.
        </p>

        <div className="p-4 rounded-xl border border-theme-border bg-theme-card space-y-5">
          {/* Construction Appreciation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <Label className="text-sm text-theme-text">During Construction</Label>
                <p className="text-[10px] text-theme-text-muted">
                  {constructionYears} year{constructionYears !== 1 ? 's' : ''} to handover
                </p>
              </div>
              {!isYearByYear && (
                <span className="font-mono text-lg text-theme-accent font-semibold">
                  {constructionAppreciation}%
                </span>
              )}
            </div>

            {!isYearByYear && (
              <>
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
              </>
            )}

            {/* Year-by-year toggle */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-theme-border/50">
              <div>
                <span className="text-xs font-medium text-theme-text">Per-year rates</span>
                <p className="text-[10px] text-theme-text-muted">Set declining appreciation year by year</p>
              </div>
              <Switch
                checked={isYearByYear}
                onCheckedChange={toggleYearByYear}
              />
            </div>

            {isYearByYear && inputs.constructionSchedule && (
              <div className="mt-3 space-y-2">
                {Array.from({ length: constructionYears }, (_, i) => {
                  const rate = inputs.constructionSchedule?.[i] ?? constructionAppreciation;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-theme-text-muted w-10 shrink-0">
                        Yr {i + 1}
                      </span>
                      <Slider
                        value={[rate]}
                        onValueChange={([v]) => updateScheduleYear(i, v)}
                        min={0}
                        max={25}
                        step={0.5}
                        className="roi-slider-lime flex-1"
                      />
                      <span className="font-mono text-sm text-theme-accent font-semibold w-10 text-right">
                        {rate}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-theme-border/50" />

          {/* Post-construction */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <Label className="text-sm text-theme-text">After Handover</Label>
                <p className="text-[10px] text-theme-text-muted">Ongoing appreciation</p>
              </div>
              <span className="font-mono text-lg text-theme-accent font-semibold">
                {postConstructionAppreciation}%
              </span>
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

      {/* ─── EXIT COSTS ─── */}
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
