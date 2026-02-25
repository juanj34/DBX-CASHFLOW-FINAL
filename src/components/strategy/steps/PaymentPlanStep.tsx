import React, { useMemo, useState, useCallback } from 'react';
import { OIInputs, PaymentMilestone } from '@/components/roi/useOICalculations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Building2, Clock, Wand2, Calendar } from 'lucide-react';

interface Props {
  inputs: OIInputs;
  updateField: <K extends keyof OIInputs>(field: K, value: OIInputs[K]) => void;
  updateFields: (partial: Partial<OIInputs>) => void;
}

const PRESET_SPLITS = [
  { label: '20/80', pre: 20 },
  { label: '25/75', pre: 25 },
  { label: '30/70', pre: 30 },
  { label: '35/65', pre: 35 },
  { label: '40/60', pre: 40 },
  { label: '50/50', pre: 50 },
  { label: '60/40', pre: 60 },
  { label: '70/30', pre: 70 },
  { label: '80/20', pre: 80 },
];

const n2s = (n: number) => new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(n);

export const PaymentPlanStep: React.FC<Props> = ({ inputs, updateField, updateFields }) => {
  const [customSplitValue, setCustomSplitValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const totalMonths = useMemo(() => {
    const booking = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
    const handover = new Date(inputs.handoverYear, inputs.handoverMonth - 1);
    return Math.max(1, Math.round((handover.getTime() - booking.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  }, [inputs.bookingYear, inputs.bookingMonth, inputs.handoverYear, inputs.handoverMonth]);

  // Apply a preset or custom split
  const applySplit = useCallback((preHandover: number) => {
    const down = Math.min(preHandover, inputs.downpaymentPercent || 20);
    const remaining = preHandover - down;
    const milestoneCount = Math.max(1, Math.floor(remaining / 5));
    const perMilestone = Math.round((remaining / milestoneCount) * 10) / 10;

    const milestones: PaymentMilestone[] = Array.from({ length: milestoneCount }, (_, i) => ({
      id: `auto-${i}`,
      type: 'time' as const,
      triggerValue: Math.round(((i + 1) / (milestoneCount + 1)) * totalMonths),
      paymentPercent: i === milestoneCount - 1 ? Math.round((remaining - perMilestone * (milestoneCount - 1)) * 10) / 10 : perMilestone,
      label: `Installment ${i + 1}`,
    }));

    updateFields({
      downpaymentPercent: down,
      preHandoverPercent: preHandover,
      additionalPayments: milestones,
    });
    setShowCustomInput(false);
    setCustomSplitValue('');
  }, [inputs.downpaymentPercent, totalMonths, updateFields]);

  const handleCustomApply = () => {
    const val = parseInt(customSplitValue);
    if (!isNaN(val) && val >= 10 && val <= 90) {
      applySplit(val);
    }
  };

  // Auto-distribute: spread remaining % evenly across existing milestones
  const autoDistribute = useCallback(() => {
    const payments = [...inputs.additionalPayments];
    if (payments.length === 0) return;
    const remaining = inputs.preHandoverPercent - inputs.downpaymentPercent;
    const perPayment = Math.round((remaining / payments.length) * 10) / 10;
    const interval = Math.round(totalMonths / (payments.length + 1));

    const updated = payments.map((m, i) => ({
      ...m,
      paymentPercent: i === payments.length - 1
        ? Math.round((remaining - perPayment * (payments.length - 1)) * 10) / 10
        : perPayment,
      triggerValue: m.type === 'time'
        ? interval * (i + 1)
        : Math.round(((i + 1) / (payments.length + 1)) * 100),
    }));
    updateField('additionalPayments', updated);
  }, [inputs.additionalPayments, inputs.preHandoverPercent, inputs.downpaymentPercent, totalMonths, updateField]);

  const addMilestone = () => {
    const lastType = inputs.additionalPayments.length > 0
      ? inputs.additionalPayments[inputs.additionalPayments.length - 1].type as 'time' | 'construction'
      : 'time';
    const newMilestone: PaymentMilestone = {
      id: `m-${Date.now()}`,
      type: lastType,
      triggerValue: lastType === 'construction' ? 50 : Math.round(totalMonths / 2),
      paymentPercent: 5,
      label: `Payment ${inputs.additionalPayments.length + 1}`,
    };
    updateField('additionalPayments', [...inputs.additionalPayments, newMilestone]);
  };

  const updateMilestone = (index: number, update: Partial<PaymentMilestone>) => {
    const updated = inputs.additionalPayments.map((m, i) =>
      i === index ? { ...m, ...update } : m
    );
    updateField('additionalPayments', updated);
  };

  const toggleMilestoneType = (index: number) => {
    const m = inputs.additionalPayments[index];
    const newType = m.type === 'construction' ? 'time' : 'construction';
    updateMilestone(index, { type: newType });
  };

  const removeMilestone = (index: number) => {
    updateField('additionalPayments', inputs.additionalPayments.filter((_, i) => i !== index));
  };

  // Totals
  const milestonesTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  const totalAllocated = inputs.downpaymentPercent + milestonesTotal;
  const handoverPercent = 100 - totalAllocated;
  const isBalanced = Math.abs(handoverPercent + totalAllocated - 100) < 0.5 && handoverPercent >= 0;

  // Post-handover mode
  const hasPostHandover = inputs.hasPostHandoverPlan ?? false;

  // Get payment date string for a time-based milestone
  const getMilestoneDate = (monthsFromBooking: number) => {
    const date = new Date(inputs.bookingYear, inputs.bookingMonth - 1 + monthsFromBooking);
    return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  };

  // Is a preset currently selected?
  const activePreset = PRESET_SPLITS.find(s => s.pre === inputs.preHandoverPercent);
  const isCustomSplit = inputs.preHandoverPercent > 0 && !activePreset;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="font-display text-lg text-theme-text mb-1">Payment Plan</h3>
        <p className="text-xs text-theme-text-muted">
          Define how the purchase price is split. Select a preset or enter a custom split.
        </p>
      </div>

      {/* ─── SPLIT SELECTOR ─── */}
      <section>
        <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider mb-2 block">
          Pre-Handover / Handover Split
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SPLITS.map((split) => (
            <button
              key={split.label}
              onClick={() => applySplit(split.pre)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                inputs.preHandoverPercent === split.pre
                  ? 'bg-theme-accent/10 text-theme-accent border-theme-accent/30 ring-1 ring-theme-accent/20'
                  : 'text-theme-text-muted border-theme-border hover:border-theme-accent/20 hover:text-theme-text'
              }`}
            >
              {split.label}
            </button>
          ))}
          {/* Custom button */}
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed transition-all ${
                isCustomSplit
                  ? 'bg-theme-accent/10 text-theme-accent border-theme-accent/30'
                  : 'text-theme-text-muted border-theme-border hover:border-theme-accent/20 hover:text-theme-text'
              }`}
            >
              {isCustomSplit ? `${inputs.preHandoverPercent}/${100 - inputs.preHandoverPercent}` : 'Custom'}
            </button>
          ) : (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-theme-accent/30 bg-theme-card">
              <Input
                type="number"
                value={customSplitValue}
                onChange={(e) => setCustomSplitValue(e.target.value)}
                placeholder="35"
                className="w-12 h-6 text-center bg-theme-bg border-theme-border text-theme-text font-mono text-xs p-0"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCustomApply()}
              />
              <span className="text-[10px] text-theme-text-muted">/</span>
              <span className="text-[10px] text-theme-text-muted font-mono w-5">
                {100 - (parseInt(customSplitValue) || 0)}
              </span>
              <button
                onClick={handleCustomApply}
                disabled={!customSplitValue || parseInt(customSplitValue) < 10 || parseInt(customSplitValue) > 90}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-theme-accent text-white disabled:opacity-30"
              >
                OK
              </button>
              <button
                onClick={() => { setShowCustomInput(false); setCustomSplitValue(''); }}
                className="text-[10px] text-theme-text-muted hover:text-theme-text px-1"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─── DOWNPAYMENT ─── */}
      <section className="flex items-center gap-3 p-3 rounded-lg border border-theme-border bg-theme-card">
        <div className="flex-1">
          <span className="text-xs font-medium text-theme-text">Downpayment</span>
          <span className="text-[10px] text-theme-text-muted ml-2">at booking</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            value={inputs.downpaymentPercent}
            onChange={(e) => updateField('downpaymentPercent', Math.max(0, Math.min(inputs.preHandoverPercent || 100, Number(e.target.value))))}
            className="w-16 h-7 bg-theme-bg border-theme-border text-theme-text font-mono text-right text-sm"
          />
          <span className="text-xs text-theme-text-muted">%</span>
          {inputs.basePrice > 0 && (
            <span className="text-[10px] text-theme-text-muted font-mono ml-1">
              AED {n2s(inputs.basePrice * inputs.downpaymentPercent / 100)}
            </span>
          )}
        </div>
      </section>

      {/* ─── POST-HANDOVER TOGGLE ─── */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-theme-border/50 bg-theme-card/50">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs text-theme-text">Post-handover payments</span>
        </div>
        <Switch
          checked={hasPostHandover}
          onCheckedChange={(checked) => updateField('hasPostHandoverPlan' as any, checked)}
        />
      </div>

      {/* ─── MILESTONES ─── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">
            Installments ({inputs.additionalPayments.length})
          </Label>
          <div className="flex items-center gap-1.5">
            {inputs.additionalPayments.length > 1 && (
              <button
                onClick={autoDistribute}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-theme-accent hover:bg-theme-accent/10 transition-colors"
                title="Evenly distribute remaining % across installments"
              >
                <Wand2 className="w-3 h-3" />
                Auto
              </button>
            )}
            {inputs.additionalPayments.length > 0 && (
              <button
                onClick={() => updateField('additionalPayments', [])}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-theme-negative/70 hover:text-theme-negative hover:bg-theme-negative/10 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          {inputs.additionalPayments.map((m, i) => (
            <div
              key={m.id}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-theme-border bg-theme-card"
            >
              {/* Index */}
              <span className="w-5 h-5 rounded-full bg-theme-border flex items-center justify-center text-[10px] font-medium text-theme-text-muted shrink-0">
                {i + 1}
              </span>

              {/* Label */}
              <Input
                value={m.label || ''}
                onChange={(e) => updateMilestone(i, { label: e.target.value })}
                placeholder={`Payment ${i + 1}`}
                className="h-7 text-xs bg-theme-bg border-theme-border text-theme-text flex-1 min-w-0"
              />

              {/* Type toggle */}
              <button
                onClick={() => toggleMilestoneType(i)}
                title={m.type === 'construction' ? 'Construction %. Click for month.' : 'Month. Click for construction %.'}
                className={`p-1.5 rounded-md border transition-colors shrink-0 ${
                  m.type === 'construction'
                    ? 'bg-theme-accent/10 border-theme-accent/30 text-theme-accent'
                    : 'border-theme-border text-theme-text-muted hover:border-theme-accent/20'
                }`}
              >
                {m.type === 'construction' ? (
                  <Building2 className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
              </button>

              {/* Trigger value */}
              <Input
                type="number"
                value={m.triggerValue}
                onChange={(e) => updateMilestone(i, { triggerValue: Number(e.target.value) })}
                className="w-14 h-7 bg-theme-bg border-theme-border text-theme-text font-mono text-right text-xs"
              />
              <span className="text-[9px] text-theme-text-muted w-6 shrink-0">
                {m.type === 'construction' ? '% blt' : 'mo'}
              </span>

              {/* Date hint for time-based */}
              {m.type === 'time' && (
                <span className="text-[9px] text-theme-text-muted font-mono shrink-0">
                  {getMilestoneDate(m.triggerValue)}
                </span>
              )}

              {/* Payment percent */}
              <Input
                type="number"
                value={m.paymentPercent}
                onChange={(e) => updateMilestone(i, { paymentPercent: Number(e.target.value) })}
                className="w-14 h-7 bg-theme-bg border-theme-border text-theme-text font-mono text-right text-xs"
              />
              <span className="text-[9px] text-theme-text-muted">%</span>

              {/* Amount */}
              {inputs.basePrice > 0 && (
                <span className="text-[9px] text-theme-text-muted font-mono shrink-0 hidden sm:inline">
                  {n2s(inputs.basePrice * m.paymentPercent / 100)}
                </span>
              )}

              {/* Remove */}
              <button
                onClick={() => removeMilestone(i)}
                className="p-1 text-theme-text-muted hover:text-theme-negative transition-colors shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addMilestone}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 rounded-lg text-xs font-medium text-theme-text-muted hover:text-theme-text border border-dashed border-theme-border hover:border-theme-accent/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Payment
        </button>
      </section>

      {/* ─── VISUAL SUMMARY ─── */}
      <section className="p-3 rounded-lg border border-theme-border bg-theme-bg">
        {/* Stacked bar */}
        <div className="flex h-3 rounded-full overflow-hidden bg-theme-card mb-3">
          {/* Downpayment */}
          <div
            className="bg-theme-accent/80 transition-all"
            style={{ width: `${inputs.downpaymentPercent}%` }}
            title={`Downpayment: ${inputs.downpaymentPercent}%`}
          />
          {/* Milestones */}
          {inputs.additionalPayments.map((m) => (
            <div
              key={m.id}
              className="bg-theme-accent/40 border-l border-theme-bg/50 transition-all"
              style={{ width: `${m.paymentPercent}%` }}
              title={`${m.label}: ${m.paymentPercent}%`}
            />
          ))}
          {/* Handover */}
          {handoverPercent > 0 && (
            <div
              className="bg-blue-500/40 transition-all"
              style={{ width: `${handoverPercent}%` }}
              title={`On Handover: ${handoverPercent}%`}
            />
          )}
        </div>

        {/* Numbers row */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-theme-accent/80" />
            <span className="text-theme-text-muted">Down</span>
            <span className="font-mono text-theme-text ml-auto">{inputs.downpaymentPercent}%</span>
          </div>
          <div className="h-4 w-px bg-theme-border/50" />
          <div className="flex items-center gap-1.5 flex-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-theme-accent/40" />
            <span className="text-theme-text-muted">Installments</span>
            <span className="font-mono text-theme-text ml-auto">{milestonesTotal.toFixed(1)}%</span>
          </div>
          <div className="h-4 w-px bg-theme-border/50" />
          <div className="flex items-center gap-1.5 flex-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/40" />
            <span className="text-theme-text-muted">Handover</span>
            <span className={`font-mono ml-auto ${handoverPercent < 0 ? 'text-theme-negative' : 'text-theme-positive'}`}>
              {handoverPercent.toFixed(1)}%
            </span>
          </div>
          <div className="h-4 w-px bg-theme-border/50" />
          <div className="flex items-center gap-1.5">
            <span className={`font-mono font-semibold ${isBalanced ? 'text-theme-positive' : 'text-theme-negative'}`}>
              {isBalanced ? '✓ 100%' : `${(totalAllocated + Math.max(0, handoverPercent)).toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* Eligibility section */}
        <div className="mt-3 pt-3 border-t border-theme-border/50 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-theme-text-muted">Resale eligible at</span>
              <span className="text-xs font-mono text-theme-accent">{inputs.resellEligiblePercent ?? 30}%</span>
            </div>
            <Input
              type="range"
              min={10}
              max={60}
              step={5}
              value={inputs.resellEligiblePercent ?? 30}
              onChange={(e) => updateField('resellEligiblePercent' as any, Number(e.target.value))}
              className="w-full h-1 accent-theme-accent"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-theme-text-muted">Mortgage eligible at</span>
              <span className="text-xs font-mono text-theme-accent">{inputs.mortgageEligiblePercent ?? 50}%</span>
            </div>
            <Input
              type="range"
              min={20}
              max={80}
              step={5}
              value={inputs.mortgageEligiblePercent ?? 50}
              onChange={(e) => updateField('mortgageEligiblePercent' as any, Number(e.target.value))}
              className="w-full h-1 accent-theme-accent"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
