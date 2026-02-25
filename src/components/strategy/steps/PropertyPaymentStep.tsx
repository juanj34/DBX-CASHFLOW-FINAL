import React, { useState } from 'react';
import { OIInputs, PaymentMilestone } from '@/components/roi/useOICalculations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Plus, Trash2, Upload } from 'lucide-react';

interface Props {
  inputs: OIInputs;
  updateField: <K extends keyof OIInputs>(field: K, value: OIInputs[K]) => void;
  updateFields: (partial: Partial<OIInputs>) => void;
}

const UNIT_TYPES = ['studio', '1br', '2br', '3br', '4br', 'penthouse', 'townhouse', 'villa'];
const PRESET_SPLITS = [
  { label: '20/80', down: 20, preHandover: 20 },
  { label: '30/70', down: 20, preHandover: 30 },
  { label: '40/60', down: 20, preHandover: 40 },
  { label: '50/50', down: 20, preHandover: 50 },
  { label: '60/40', down: 20, preHandover: 60 },
  { label: '80/20', down: 20, preHandover: 80 },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const PropertyPaymentStep: React.FC<Props> = ({ inputs, updateField, updateFields }) => {
  const [showAIExtractor, setShowAIExtractor] = useState(false);

  const handleSplitSelect = (split: typeof PRESET_SPLITS[0]) => {
    const remaining = split.preHandover - split.down;
    // Create evenly spaced milestones for the remaining pre-handover %
    const milestoneCount = Math.max(1, Math.floor(remaining / 10));
    const perMilestone = remaining / milestoneCount;
    const totalMonths = calculateTotalMonths();
    const milestones: PaymentMilestone[] = Array.from({ length: milestoneCount }, (_, i) => ({
      id: `auto-${i}`,
      type: 'time' as const,
      triggerValue: Math.round(((i + 1) / (milestoneCount + 1)) * totalMonths),
      paymentPercent: Math.round(perMilestone * 10) / 10,
      label: `Installment ${i + 1}`,
    }));

    updateFields({
      downpaymentPercent: split.down,
      preHandoverPercent: split.preHandover,
      additionalPayments: milestones,
    });
  };

  const calculateTotalMonths = () => {
    const booking = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
    const handover = new Date(inputs.handoverYear, inputs.handoverMonth - 1);
    return Math.max(1, Math.round((handover.getTime() - booking.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  };

  const addMilestone = () => {
    const newMilestone: PaymentMilestone = {
      id: `m-${Date.now()}`,
      type: 'time',
      triggerValue: Math.round(calculateTotalMonths() / 2),
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

  const removeMilestone = (index: number) => {
    updateField('additionalPayments', inputs.additionalPayments.filter((_, i) => i !== index));
  };

  const totalAllocated =
    inputs.downpaymentPercent +
    inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  const handoverPercent = 100 - totalAllocated;

  return (
    <div className="space-y-8">
      {/* Property Info */}
      <section>
        <h3 className="font-display text-lg text-theme-text mb-4">Property Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-theme-text-muted">Developer</Label>
            <Input
              placeholder="e.g., Emaar"
              className="bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/40"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-theme-text-muted">Project</Label>
            <Input
              placeholder="e.g., Creek Harbour"
              className="bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/40"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-theme-text-muted">Base Price (AED)</Label>
            <Input
              type="number"
              value={inputs.basePrice || ''}
              onChange={(e) => updateField('basePrice', Number(e.target.value))}
              placeholder="1,500,000"
              className="bg-theme-card border-theme-border text-theme-text font-mono placeholder:text-theme-text-muted/40"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-theme-text-muted">Unit Size (sqft)</Label>
            <Input
              type="number"
              value={inputs.unitSizeSqf || ''}
              onChange={(e) => updateField('unitSizeSqf', Number(e.target.value))}
              placeholder="750"
              className="bg-theme-card border-theme-border text-theme-text font-mono placeholder:text-theme-text-muted/40"
            />
          </div>
        </div>
      </section>

      {/* Dates */}
      <section>
        <h3 className="font-display text-lg text-theme-text mb-4">Timeline</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-theme-text-muted">Booking Date</Label>
            <div className="flex gap-2">
              <select
                value={inputs.bookingMonth}
                onChange={(e) => updateField('bookingMonth', Number(e.target.value))}
                className="flex-1 rounded-md border border-theme-border bg-theme-card text-theme-text text-sm py-2 px-3"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <Input
                type="number"
                value={inputs.bookingYear}
                onChange={(e) => updateField('bookingYear', Number(e.target.value))}
                className="w-24 bg-theme-card border-theme-border text-theme-text font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-theme-text-muted">Handover Date</Label>
            <div className="flex gap-2">
              <select
                value={inputs.handoverMonth}
                onChange={(e) => updateField('handoverMonth', Number(e.target.value))}
                className="flex-1 rounded-md border border-theme-border bg-theme-card text-theme-text text-sm py-2 px-3"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <Input
                type="number"
                value={inputs.handoverYear}
                onChange={(e) => updateField('handoverYear', Number(e.target.value))}
                className="w-24 bg-theme-card border-theme-border text-theme-text font-mono"
              />
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-theme-text-muted">
          Construction: <span className="font-mono text-theme-accent">{calculateTotalMonths()}</span> months
        </div>
      </section>

      {/* Entry Costs */}
      <section>
        <h3 className="font-display text-lg text-theme-text mb-4">Entry Costs</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-theme-text-muted">EOI Fee (AED)</Label>
            <Input
              type="number"
              value={inputs.eoiFee}
              onChange={(e) => updateField('eoiFee', Number(e.target.value))}
              className="bg-theme-card border-theme-border text-theme-text font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-theme-text-muted">Oqood Fee (AED)</Label>
            <Input
              type="number"
              value={inputs.oqoodFee}
              onChange={(e) => updateField('oqoodFee', Number(e.target.value))}
              className="bg-theme-card border-theme-border text-theme-text font-mono"
            />
          </div>
        </div>
        <p className="text-xs text-theme-text-muted mt-2">
          DLD fee: <span className="font-mono">4%</span> of purchase price (always applied)
        </p>
      </section>

      {/* Payment Plan */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-theme-text">Payment Plan</h3>
          <button
            onClick={() => setShowAIExtractor(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-accent/10 text-theme-accent border border-theme-accent/20 hover:bg-theme-accent/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Extract
          </button>
        </div>

        {/* Preset splits */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_SPLITS.map((split) => (
            <button
              key={split.label}
              onClick={() => handleSplitSelect(split)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                inputs.preHandoverPercent === split.preHandover
                  ? 'bg-theme-accent/10 text-theme-accent border-theme-accent/30'
                  : 'text-theme-text-muted border-theme-border hover:border-theme-accent/20 hover:text-theme-text'
              }`}
            >
              {split.label}
            </button>
          ))}
        </div>

        {/* Downpayment */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-theme-border bg-theme-card mb-3">
          <div className="flex-1">
            <span className="text-xs text-theme-text-muted">Downpayment</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={inputs.downpaymentPercent}
              onChange={(e) => updateField('downpaymentPercent', Number(e.target.value))}
              className="w-20 bg-theme-bg border-theme-border text-theme-text font-mono text-right text-sm"
            />
            <span className="text-xs text-theme-text-muted">%</span>
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-2">
          {inputs.additionalPayments.map((m, i) => (
            <div
              key={m.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-theme-border bg-theme-card"
            >
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={m.label || ''}
                  onChange={(e) => updateMilestone(i, { label: e.target.value })}
                  placeholder={`Payment ${i + 1}`}
                  className="bg-theme-bg border-theme-border text-theme-text text-sm flex-1"
                />
                <span className="text-xs text-theme-text-muted whitespace-nowrap">
                  Month
                </span>
                <Input
                  type="number"
                  value={m.triggerValue}
                  onChange={(e) => updateMilestone(i, { triggerValue: Number(e.target.value) })}
                  className="w-16 bg-theme-bg border-theme-border text-theme-text font-mono text-right text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={m.paymentPercent}
                  onChange={(e) => updateMilestone(i, { paymentPercent: Number(e.target.value) })}
                  className="w-20 bg-theme-bg border-theme-border text-theme-text font-mono text-right text-sm"
                />
                <span className="text-xs text-theme-text-muted">%</span>
                <button
                  onClick={() => removeMilestone(i)}
                  className="p-1 text-theme-text-muted hover:text-theme-negative transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addMilestone}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-theme-text-muted hover:text-theme-text border border-dashed border-theme-border hover:border-theme-accent/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Payment
        </button>

        {/* Summary bar */}
        <div className="mt-4 p-3 rounded-lg border border-theme-border bg-theme-bg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-theme-text-muted">Pre-handover</span>
            <span className="font-mono text-theme-text">{totalAllocated.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-theme-text-muted">Handover balance</span>
            <span className={`font-mono ${handoverPercent < 0 ? 'text-theme-negative' : 'text-theme-positive'}`}>
              {handoverPercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-theme-card rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-theme-accent rounded-full transition-all"
              style={{ width: `${Math.min(100, totalAllocated)}%` }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
