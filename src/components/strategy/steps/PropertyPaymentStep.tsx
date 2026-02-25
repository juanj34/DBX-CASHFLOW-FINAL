import React, { useState } from 'react';
import { OIInputs } from '@/components/roi/useOICalculations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Upload, MessageSquare, FileImage, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentPlanExtractor } from '@/components/roi/configurator/PaymentPlanExtractor';
import type { AIPaymentPlanResult } from '@/lib/aiExtractionTypes';
import { applyExtractedPlan } from '@/lib/applyExtractedPlan';

interface Props {
  inputs: OIInputs;
  updateField: <K extends keyof OIInputs>(field: K, value: OIInputs[K]) => void;
  updateFields: (partial: Partial<OIInputs>) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const PropertyPaymentStep: React.FC<Props> = ({ inputs, updateField, updateFields }) => {
  const [showAIExtractor, setShowAIExtractor] = useState(false);

  const calculateTotalMonths = () => {
    const booking = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
    const handover = new Date(inputs.handoverYear, inputs.handoverMonth - 1);
    return Math.max(1, Math.round((handover.getTime() - booking.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  };

  const handleAIExtraction = (plan: AIPaymentPlanResult, bookingDate: { month: number; year: number }) => {
    const { inputs: newInputs, clientInfo } = applyExtractedPlan(plan, bookingDate, inputs);

    updateFields({
      ...newInputs,
      _clientInfo: {
        ...(inputs as any)._clientInfo,
        ...clientInfo,
      },
    } as any);

    setShowAIExtractor(false);
  };

  return (
    <div className="space-y-8">
      {/* AI Extraction — Primary Action */}
      <div className="rounded-xl border-2 border-dashed border-theme-accent/40 bg-gradient-to-br from-theme-accent/8 to-theme-accent/3 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-theme-accent/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-theme-accent" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-theme-text">AI Payment Plan Import</h4>
            <p className="text-xs text-theme-text-muted mt-0.5">
              Upload a brochure, payment plan PDF, or screenshot — AI extracts developer, unit details, price, timeline, and the full payment schedule automatically.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setShowAIExtractor(true)}
            className="bg-theme-accent hover:bg-theme-accent/90 text-white gap-2 h-9 px-4 font-medium"
          >
            <Upload className="w-4 h-4" />
            Upload PDF / Image
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAIExtractor(true)}
            className="border-theme-accent/40 text-theme-accent hover:bg-theme-accent/10 gap-2 h-9 px-4"
          >
            <MessageSquare className="w-4 h-4" />
            Describe by Voice
          </Button>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-theme-text-muted">
          <span className="flex items-center gap-1"><FileImage className="w-3 h-3" /> PNG, JPG, PDF</span>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI-powered extraction</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Auto-fills all fields</span>
        </div>
      </div>

      {/* AI Extractor Sheet */}
      <PaymentPlanExtractor
        open={showAIExtractor}
        onOpenChange={setShowAIExtractor}
        existingBookingMonth={inputs.bookingMonth}
        existingBookingYear={inputs.bookingYear}
        onApply={handleAIExtraction}
      />

      {/* Property Info */}
      <section>
        <h3 className="font-display text-lg text-theme-text mb-4">Property Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-theme-text-muted">Developer</Label>
            <Input
              value={(inputs as any)._clientInfo?.developer || ''}
              onChange={(e) => updateField('_clientInfo' as any, { ...(inputs as any)._clientInfo, developer: e.target.value })}
              placeholder="e.g., Emaar"
              className="bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/40"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-theme-text-muted">Project</Label>
            <Input
              value={(inputs as any)._clientInfo?.projectName || ''}
              onChange={(e) => updateField('_clientInfo' as any, { ...(inputs as any)._clientInfo, projectName: e.target.value })}
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
            {inputs.unitSizeSqf > 0 && (
              <span className="text-[10px] text-theme-text-muted font-mono">
                = {(inputs.unitSizeSqf * 0.092903).toFixed(1)} m²
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-theme-text-muted">Unit Number</Label>
            <Input
              value={(inputs as any)._clientInfo?.unit || ''}
              onChange={(e) => updateField('_clientInfo' as any, { ...(inputs as any)._clientInfo, unit: e.target.value })}
              placeholder="e.g., 1204"
              className="bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/40"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-theme-text-muted">Unit Type</Label>
            <Input
              value={(inputs as any)._clientInfo?.unitType || ''}
              onChange={(e) => updateField('_clientInfo' as any, { ...(inputs as any)._clientInfo, unitType: e.target.value })}
              placeholder="e.g., 2BR"
              className="bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/40"
            />
          </div>
        </div>
      </section>

      {/* Client Info */}
      <section>
        <h3 className="font-display text-lg text-theme-text mb-4">Client Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-theme-text-muted">Client Name</Label>
            <Input
              value={(inputs as any)._clients?.[0]?.name || ''}
              onChange={(e) => updateField('_clients' as any, [{ ...(inputs as any)._clients?.[0], name: e.target.value }])}
              placeholder="Full name"
              className="bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/40"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-theme-text-muted">Client Country</Label>
            <Input
              value={(inputs as any)._clients?.[0]?.country || ''}
              onChange={(e) => updateField('_clients' as any, [{ ...(inputs as any)._clients?.[0], country: e.target.value }])}
              placeholder="e.g., UAE"
              className="bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/40"
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs text-theme-text-muted">Broker Name</Label>
            <Input
              value={(inputs as any)._clientInfo?.brokerName || ''}
              onChange={(e) => updateField('_clientInfo' as any, { ...(inputs as any)._clientInfo, brokerName: e.target.value })}
              placeholder="Your name"
              className="bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/40"
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
    </div>
  );
};
