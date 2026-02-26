import React, { useMemo, useCallback } from 'react';
import { OIInputs, PaymentMilestone } from '@/components/roi/useOICalculations';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Key, Wand2 } from 'lucide-react';

interface Props {
  inputs: OIInputs;
  updateField: <K extends keyof OIInputs>(field: K, value: OIInputs[K]) => void;
  updateFields: (partial: Partial<OIInputs>) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const n2s = (n: number) => new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(n);

// Compute months between two dates
const monthsBetween = (fromMonth: number, fromYear: number, toMonth: number, toYear: number) =>
  (toYear - fromYear) * 12 + (toMonth - fromMonth);

// Get calendar date from triggerValue (months from booking)
const triggerToDate = (trigger: number, bookingMonth: number, bookingYear: number) => {
  const d = new Date(bookingYear, bookingMonth - 1 + trigger);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
};

export const PaymentPlanStep: React.FC<Props> = ({ inputs, updateField, updateFields }) => {
  const handoverMonths = useMemo(() =>
    monthsBetween(inputs.bookingMonth, inputs.bookingYear, inputs.handoverMonth, inputs.handoverYear),
    [inputs.bookingMonth, inputs.bookingYear, inputs.handoverMonth, inputs.handoverYear]
  );

  // ── Merge all installments into one flat list ──
  const allInstallments = useMemo(() => {
    const pre: PaymentMilestone[] = (inputs.additionalPayments || []).map(m => ({ ...m }));
    const post: PaymentMilestone[] = ((inputs as any).postHandoverPayments || []).map((m: PaymentMilestone) => ({
      ...m,
      // Convert post-handover triggerValue (months after HO) to absolute months from booking
      triggerValue: m.type === 'post-handover' ? handoverMonths + m.triggerValue : m.triggerValue,
      type: 'time' as const,
    }));

    // Add completion installment if onHandoverPercent > 0 and not already in list
    const onHO = (inputs as any).onHandoverPercent || 0;
    const hasCompletionInList = pre.some(m => m.isHandover) || post.some(m => m.isHandover);
    const completion: PaymentMilestone[] = (onHO > 0 && !hasCompletionInList) ? [{
      id: 'completion-auto',
      type: 'time' as const,
      triggerValue: handoverMonths,
      paymentPercent: onHO,
      label: 'Completion',
      isHandover: true,
    }] : [];

    return [...pre, ...completion, ...post].sort((a, b) => a.triggerValue - b.triggerValue);
  }, [inputs.additionalPayments, (inputs as any).postHandoverPayments, (inputs as any).onHandoverPercent, handoverMonths]);

  // ── Sync flat list back to engine format ──
  const syncToEngine = useCallback((installments: PaymentMilestone[]) => {
    const sorted = [...installments].sort((a, b) => a.triggerValue - b.triggerValue);

    const completion = sorted.find(m => m.isHandover);
    const preHandover = sorted.filter(m => !m.isHandover && m.triggerValue < handoverMonths);
    const postHandover = sorted.filter(m => !m.isHandover && m.triggerValue >= handoverMonths);

    // Convert post-handover back to relative months
    const postHandoverPayments = postHandover.map(m => ({
      ...m,
      type: 'post-handover' as const,
      triggerValue: m.triggerValue - handoverMonths,
    }));

    const preTotal = preHandover.reduce((s, m) => s + m.paymentPercent, 0);

    updateFields({
      additionalPayments: preHandover,
      hasPostHandoverPlan: postHandoverPayments.length > 0,
      onHandoverPercent: completion?.paymentPercent || 0,
      postHandoverPayments,
      preHandoverPercent: inputs.downpaymentPercent + preTotal,
    } as any);
  }, [handoverMonths, inputs.downpaymentPercent, updateFields]);

  // ── Installment operations ──
  const updateInstallment = useCallback((id: string, update: Partial<PaymentMilestone>) => {
    const updated = allInstallments.map(m => m.id === id ? { ...m, ...update } : m);
    syncToEngine(updated);
  }, [allInstallments, syncToEngine]);

  const removeInstallment = useCallback((id: string) => {
    syncToEngine(allInstallments.filter(m => m.id !== id));
  }, [allInstallments, syncToEngine]);

  const addInstallment = useCallback(() => {
    const last = allInstallments[allInstallments.length - 1];
    const newTrigger = last ? last.triggerValue + 1 : 1;
    const newPercent = last ? last.paymentPercent : 5;
    const newInstallment: PaymentMilestone = {
      id: `inst-${Date.now()}`,
      type: 'time',
      triggerValue: newTrigger,
      paymentPercent: newPercent,
      label: `Installment ${allInstallments.length + 1}`,
    };
    syncToEngine([...allInstallments, newInstallment]);
  }, [allInstallments, syncToEngine]);

  const toggleCompletion = useCallback((id: string) => {
    const updated = allInstallments.map(m => ({
      ...m,
      isHandover: m.id === id ? !m.isHandover : false,
    }));
    syncToEngine(updated);
  }, [allInstallments, syncToEngine]);

  const autoDistribute = useCallback(() => {
    if (allInstallments.length === 0) return;
    const totalAvailable = 100 - inputs.downpaymentPercent;
    const perInstallment = Math.round((totalAvailable / allInstallments.length) * 100) / 100;
    const updated = allInstallments.map((m, i) => ({
      ...m,
      paymentPercent: i === allInstallments.length - 1
        ? Math.round((totalAvailable - perInstallment * (allInstallments.length - 1)) * 100) / 100
        : perInstallment,
    }));
    syncToEngine(updated);
  }, [allInstallments, inputs.downpaymentPercent, syncToEngine]);

  const clearAll = useCallback(() => {
    syncToEngine([]);
  }, [syncToEngine]);

  // Update date via month/year selects → compute new triggerValue
  const updateInstallmentDate = useCallback((id: string, newMonth: number, newYear: number) => {
    const trigger = monthsBetween(inputs.bookingMonth, inputs.bookingYear, newMonth, newYear);
    updateInstallment(id, { triggerValue: Math.max(1, trigger) });
  }, [inputs.bookingMonth, inputs.bookingYear, updateInstallment]);

  // ── Totals ──
  const installmentsTotal = allInstallments.reduce((s, m) => s + m.paymentPercent, 0);
  const totalAllocated = inputs.downpaymentPercent + installmentsTotal;
  const remaining = 100 - totalAllocated;
  // Plan has explicit completion if any installment is marked isHandover or post-handover payments exist
  const hasExplicitCompletion = allInstallments.some(m => m.isHandover) || (inputs as any).hasPostHandoverPlan;
  // For standard plans: remaining is the implicit handover balance (valid as long as ≤100%)
  // For explicit plans: everything must sum to ~100%
  const isBalanced = hasExplicitCompletion ? Math.abs(remaining) < 0.5 : remaining >= -0.5;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <h3 className="font-display text-lg text-theme-text mb-1">Installment Plan</h3>
        <p className="text-xs text-theme-text-muted">
          Define how the purchase price is distributed across installments. All installments are ordered by date automatically.
        </p>
      </div>

      {/* ── Downpayment ── */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-theme-border bg-theme-card">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-theme-text">Downpayment</span>
          <span className="text-[10px] text-theme-text-muted ml-2">
            {MONTHS[inputs.bookingMonth - 1]} {inputs.bookingYear}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            value={inputs.downpaymentPercent}
            onChange={(e) => {
              const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
              updateField('downpaymentPercent', val);
            }}
            className="w-20 h-8 bg-theme-bg border-theme-border text-theme-text font-mono text-right text-sm"
          />
          <span className="text-xs text-theme-text-muted">%</span>
          {inputs.basePrice > 0 && (
            <span className="text-[10px] text-theme-text-muted font-mono ml-1">
              AED {n2s(inputs.basePrice * inputs.downpaymentPercent / 100)}
            </span>
          )}
        </div>
      </div>

      {/* ── Installments Header ── */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-theme-text-muted uppercase tracking-wider font-medium">
          Installments ({allInstallments.length})
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={addInstallment}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-theme-accent border border-theme-accent/20 hover:bg-theme-accent/10 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
          {allInstallments.length > 1 && (
            <button
              onClick={autoDistribute}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-theme-text-muted hover:text-theme-accent hover:bg-theme-accent/10 transition-colors"
              title="Evenly distribute remaining %"
            >
              <Wand2 className="w-3 h-3" />
              Auto
            </button>
          )}
          {allInstallments.length > 0 && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-theme-negative/60 hover:text-theme-negative hover:bg-theme-negative/10 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Installments List ── */}
      {allInstallments.length > 0 && (
        <div className="max-h-[45vh] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {allInstallments.map((m, i) => {
            const date = triggerToDate(m.triggerValue, inputs.bookingMonth, inputs.bookingYear);
            const isPostHandover = m.triggerValue >= handoverMonths;
            const isCompletion = m.isHandover === true;

            return (
              <div
                key={m.id}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border transition-colors ${
                  isCompletion
                    ? 'bg-[#C9A04A]/10 border-[#C9A04A]/30'
                    : isPostHandover
                    ? 'bg-purple-500/5 border-purple-500/20'
                    : 'bg-theme-card border-theme-border'
                }`}
              >
                {/* Index */}
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${
                  isCompletion
                    ? 'bg-[#C9A04A]/20 text-[#C9A04A]'
                    : isPostHandover
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-theme-border text-theme-text-muted'
                }`}>
                  {i + 1}
                </span>

                {/* Label */}
                <Input
                  value={m.label || ''}
                  onChange={(e) => updateInstallment(m.id, { label: e.target.value })}
                  placeholder={`Installment ${i + 1}`}
                  className="h-7 text-xs bg-transparent border-theme-border/50 text-theme-text flex-1 min-w-0 focus:border-theme-accent/30"
                />

                {/* Month select */}
                <Select
                  value={String(date.month)}
                  onValueChange={(val) => updateInstallmentDate(m.id, parseInt(val), date.year)}
                >
                  <SelectTrigger className="w-[62px] h-7 text-[10px] bg-theme-bg border-theme-border text-theme-text px-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-theme-card border-theme-border z-50 max-h-[200px]">
                    {MONTHS.map((month, idx) => (
                      <SelectItem key={idx} value={String(idx + 1)} className="text-theme-text hover:bg-theme-border text-xs">
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Year select */}
                <Select
                  value={String(date.year)}
                  onValueChange={(val) => updateInstallmentDate(m.id, date.month, parseInt(val))}
                >
                  <SelectTrigger className="w-[66px] h-7 text-[10px] bg-theme-bg border-theme-border text-theme-text px-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-theme-card border-theme-border z-50 max-h-[200px]">
                    {Array.from({ length: 15 }, (_, j) => inputs.bookingYear + j).map((year) => (
                      <SelectItem key={year} value={String(year)} className="text-theme-text hover:bg-theme-border text-xs">
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Month badge */}
                <span className="text-[9px] text-theme-text-muted font-mono w-7 text-center shrink-0">
                  M{m.triggerValue}
                </span>

                {/* Percentage */}
                <Input
                  type="number"
                  step="0.1"
                  value={m.paymentPercent}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                    updateInstallment(m.id, { paymentPercent: val });
                  }}
                  className="w-20 h-7 bg-theme-bg border-theme-border text-theme-text font-mono text-right text-xs"
                />
                <span className="text-[9px] text-theme-text-muted shrink-0">%</span>

                {/* AED amount */}
                {inputs.basePrice > 0 && (
                  <span className="text-[9px] text-theme-text-muted font-mono shrink-0 hidden sm:inline w-16 text-right">
                    {n2s(inputs.basePrice * m.paymentPercent / 100)}
                  </span>
                )}

                {/* Completion key */}
                <button
                  onClick={() => toggleCompletion(m.id)}
                  className={`p-1 rounded transition-colors shrink-0 ${
                    isCompletion
                      ? 'text-[#C9A04A] bg-[#C9A04A]/20 hover:bg-[#C9A04A]/30'
                      : 'text-theme-text-muted/40 hover:text-[#C9A04A] hover:bg-[#C9A04A]/10'
                  }`}
                  title="Mark as completion/handover installment"
                >
                  <Key className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => removeInstallment(m.id)}
                  className="p-1 text-theme-text-muted/40 hover:text-theme-negative transition-colors shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add button when empty */}
      {allInstallments.length === 0 && (
        <button
          onClick={addInstallment}
          className="w-full py-4 rounded-xl border-2 border-dashed border-theme-border hover:border-theme-accent/30 text-theme-text-muted hover:text-theme-accent transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add First Installment
        </button>
      )}

      {/* ── Visual Summary ── */}
      <div className="p-3 rounded-xl border border-theme-border bg-theme-bg">
        {/* Stacked bar */}
        <div className="flex h-3 rounded-full overflow-hidden bg-theme-card mb-3">
          {inputs.downpaymentPercent > 0 && (
            <div
              className="bg-[#C9A04A]/80 transition-all"
              style={{ width: `${Math.min(100, inputs.downpaymentPercent)}%` }}
              title={`Downpayment: ${inputs.downpaymentPercent}%`}
            />
          )}
          {allInstallments.map((m) => (
            <div
              key={m.id}
              className={`border-l border-theme-bg/50 transition-all ${
                m.isHandover ? 'bg-[#C9A04A]/60' : m.triggerValue >= handoverMonths ? 'bg-purple-500/40' : 'bg-[#C9A04A]/30'
              }`}
              style={{ width: `${Math.min(100, m.paymentPercent)}%` }}
              title={`${m.label || 'Installment'}: ${m.paymentPercent}%`}
            />
          ))}
          {remaining > 0.5 && (
            <div
              className="bg-theme-border/50 transition-all"
              style={{ width: `${remaining}%` }}
              title={`Unallocated: ${remaining.toFixed(1)}%`}
            />
          )}
        </div>

        {/* Totals row */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#C9A04A]/80" />
            <span className="text-theme-text-muted">Down</span>
            <span className="font-mono text-theme-text ml-auto">{inputs.downpaymentPercent}%</span>
          </div>
          <div className="h-4 w-px bg-theme-border/50" />
          <div className="flex items-center gap-1.5 flex-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#C9A04A]/30" />
            <span className="text-theme-text-muted">Installments</span>
            <span className="font-mono text-theme-text ml-auto">{installmentsTotal.toFixed(1)}%</span>
          </div>
          <div className="h-4 w-px bg-theme-border/50" />
          <div className="flex items-center gap-1.5 flex-1">
            <div className={`w-2.5 h-2.5 rounded-sm ${remaining < -0.5 ? 'bg-theme-negative/40' : remaining > 0.5 && !hasExplicitCompletion ? 'bg-blue-400/40' : 'bg-theme-positive/40'}`} />
            <span className="text-theme-text-muted">{hasExplicitCompletion ? 'Remaining' : 'Completion'}</span>
            <span className={`font-mono ml-auto ${remaining < -0.5 ? 'text-theme-negative' : !hasExplicitCompletion && remaining > 0.5 ? 'text-blue-400' : 'text-theme-text'}`}>
              {remaining.toFixed(1)}%
            </span>
          </div>
          <div className="h-4 w-px bg-theme-border/50" />
          <span className={`font-mono font-semibold ${isBalanced ? 'text-theme-positive' : 'text-theme-negative'}`}>
            {remaining < -0.5 ? `${totalAllocated.toFixed(1)}%` : '✓ 100%'}
          </span>
        </div>
      </div>
    </div>
  );
};
