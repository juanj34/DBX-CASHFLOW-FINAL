import React, { useMemo, useCallback, useState } from 'react';
import { OIInputs } from '@/components/roi/useOICalculations';
import { calculateExitScenario } from '@/components/roi/constructionProgress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { MoneyInput } from '@/components/ui/money-input';
import { X, Plus } from 'lucide-react';

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

  const [customMonth, setCustomMonth] = useState('');

  const exitScenarios = inputs._exitScenarios || [];
  const constructionYears = Math.ceil(totalMonths / 12);
  const constructionAppreciation = inputs.constructionAppreciation ?? 12;
  const postConstructionAppreciation = inputs.postConstructionAppreciation ?? 6;
  const isYearByYear = !!inputs.constructionSchedule?.length;

  const dldFee = inputs.basePrice * 0.04;
  const totalEntryCosts = dldFee + (inputs.oqoodFee || 5000);

  // Preset exit options grouped by phase
  const preConstructionPresets = useMemo(() =>
    [6, 12, 18, 24, 36].filter(m => m < totalMonths).map(m => ({
      label: m < 12 ? `${m}m` : `${m / 12}yr`,
      month: m,
    })),
    [totalMonths]
  );

  const postConstructionPresets = useMemo(() => [
    { label: '+6m', month: totalMonths + 6 },
    { label: '+1yr', month: totalMonths + 12 },
    { label: '+2yr', month: totalMonths + 24 },
    { label: '+3yr', month: totalMonths + 36 },
    { label: '+5yr', month: totalMonths + 60 },
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

  // Descriptive label for exit chips
  const getExitLabel = (month: number) => {
    if (month === totalMonths) return 'Handover';
    if (month < totalMonths) {
      return month < 12 ? `Month ${month}` : `${(month / 12).toFixed(month % 12 === 0 ? 0 : 1)}yr`;
    }
    const after = month - totalMonths;
    if (after % 12 === 0) return `HO + ${after / 12}yr`;
    return `HO + ${after}m`;
  };

  const addCustomExit = useCallback(() => {
    const val = Number(customMonth);
    if (val > 0 && !exitScenarios.includes(val)) {
      toggleExit(val);
      setCustomMonth('');
    }
  }, [customMonth, exitScenarios, toggleExit]);

  // Shared button style
  const presetBtn = (month: number, label: string, accent = false) => {
    const isSelected = exitScenarios.includes(month);
    return (
      <button
        key={month}
        onClick={() => toggleExit(month)}
        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
          isSelected
            ? 'bg-theme-accent/10 text-theme-accent border-theme-accent/30 ring-1 ring-theme-accent/20'
            : accent
            ? 'text-[#C9A04A] border-[#C9A04A]/30 hover:bg-[#C9A04A]/10'
            : 'text-theme-text-muted border-theme-border hover:border-theme-accent/20 hover:text-theme-text'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-8">
      {/* ─── PICK EXIT TIMES ─── */}
      <section>
        <h3 className="font-display text-lg text-theme-text mb-1">Pick Exit Times</h3>
        <p className="text-xs text-theme-text-muted mb-4">
          Choose when to analyze selling. Handover at month <span className="font-mono text-theme-accent">{totalMonths}</span>.
        </p>

        {/* During Construction */}
        {preConstructionPresets.length > 0 && (
          <div className="mb-3">
            <span className="text-[10px] text-theme-text-muted uppercase tracking-wider font-medium block mb-1.5">During Construction</span>
            <div className="flex flex-wrap gap-1.5">
              {preConstructionPresets.map(p => presetBtn(p.month, p.label))}
            </div>
          </div>
        )}

        {/* Handover */}
        <div className="mb-3">
          {presetBtn(totalMonths, `Handover (M${totalMonths})`, true)}
        </div>

        {/* After Handover */}
        <div className="mb-3">
          <span className="text-[10px] text-theme-text-muted uppercase tracking-wider font-medium block mb-1.5">After Handover</span>
          <div className="flex flex-wrap gap-1.5">
            {postConstructionPresets.map(p => presetBtn(p.month, p.label))}
          </div>
        </div>

        {/* Custom exit — inline */}
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            value={customMonth}
            onChange={(e) => setCustomMonth(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomExit()}
            placeholder="Month #"
            className="w-20 h-7 text-xs bg-theme-card border-theme-border text-theme-text font-mono"
          />
          <button
            onClick={addCustomExit}
            disabled={!customMonth || Number(customMonth) <= 0}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-theme-accent border border-theme-accent/20 hover:bg-theme-accent/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>

        {/* Selected exits summary */}
        {exitScenarios.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-theme-bg border border-theme-border/50">
            <p className="text-[10px] font-medium text-theme-text-muted uppercase tracking-wide mb-2">
              {exitScenarios.length} exit{exitScenarios.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex flex-wrap gap-1.5">
              {exitScenarios.map((month) => {
                const metrics = exitMetrics[month];
                const isHO = month === totalMonths;
                return (
                  <span
                    key={month}
                    className={`inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg border text-[10px] font-mono ${
                      isHO
                        ? 'bg-[#C9A04A]/10 border-[#C9A04A]/30 text-[#C9A04A]'
                        : 'bg-theme-card border-theme-border text-theme-text'
                    }`}
                  >
                    <span className="font-medium">{getExitLabel(month)}</span>
                    <span className="opacity-40">M{month}</span>
                    {metrics && (
                      <>
                        <span className="text-theme-positive">{metrics.roe}%</span>
                        <span className="opacity-30">·</span>
                        <span className="opacity-60">{metrics.price}</span>
                      </>
                    )}
                    <button
                      onClick={() => toggleExit(month)}
                      className="ml-0.5 p-0.5 rounded hover:bg-theme-negative/10 text-theme-text-muted hover:text-theme-negative transition-colors"
                    >
                      <X className="w-3 h-3" />
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
            <MoneyInput
              value={inputs.exitNocFee}
              onChange={(v) => updateField('exitNocFee', v)}
              className="w-28 bg-theme-bg border-theme-border text-theme-text text-sm"
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
