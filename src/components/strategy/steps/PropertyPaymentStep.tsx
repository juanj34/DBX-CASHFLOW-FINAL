import React from 'react';
import { OIInputs } from '@/components/roi/useOICalculations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  inputs: OIInputs;
  updateField: <K extends keyof OIInputs>(field: K, value: OIInputs[K]) => void;
  updateFields: (partial: Partial<OIInputs>) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const UNIT_TYPES = [
  { value: 'studio', label: 'Studio' },
  { value: '1br', label: '1 Bedroom' },
  { value: '2br', label: '2 Bedrooms' },
  { value: '3br', label: '3 Bedrooms' },
  { value: '4br', label: '4 Bedrooms' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'villa', label: 'Villa' },
  { value: 'commercial', label: 'Commercial' },
];

export const PropertyPaymentStep: React.FC<Props> = ({ inputs, updateField, updateFields }) => {
  const calculateTotalMonths = () => {
    const booking = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
    const handover = new Date(inputs.handoverYear, inputs.handoverMonth - 1);
    return Math.max(1, Math.round((handover.getTime() - booking.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  };

  return (
    <div className="space-y-4">
      {/* Property Info */}
      <section>
        <h3 className="text-sm font-semibold text-theme-text mb-2">Property Details</h3>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="space-y-1">
            <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Developer</Label>
            <Input
              value={(inputs as any)._clientInfo?.developer || ''}
              onChange={(e) => updateField('_clientInfo' as any, { ...(inputs as any)._clientInfo, developer: e.target.value })}
              placeholder="Emaar"
              className="h-8 text-xs bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/40"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Project</Label>
            <Input
              value={(inputs as any)._clientInfo?.projectName || ''}
              onChange={(e) => updateField('_clientInfo' as any, { ...(inputs as any)._clientInfo, projectName: e.target.value })}
              placeholder="Creek Harbour"
              className="h-8 text-xs bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/40"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Unit #</Label>
            <Input
              value={(inputs as any)._clientInfo?.unit || ''}
              onChange={(e) => updateField('_clientInfo' as any, { ...(inputs as any)._clientInfo, unit: e.target.value })}
              placeholder="1204"
              className="h-8 text-xs bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/40"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Purchase Price</Label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-theme-text-muted font-mono">AED</span>
              <Input
                type="number"
                value={inputs.basePrice || ''}
                onChange={(e) => updateField('basePrice', Number(e.target.value))}
                placeholder="1,500,000"
                className="h-8 text-xs bg-theme-card border-theme-border text-theme-text font-mono pl-9 placeholder:text-theme-text-muted/40"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Size (sqft)</Label>
            <Input
              type="number"
              value={inputs.unitSizeSqf || ''}
              onChange={(e) => updateField('unitSizeSqf', Number(e.target.value))}
              placeholder="750"
              className="h-8 text-xs bg-theme-card border-theme-border text-theme-text font-mono placeholder:text-theme-text-muted/40"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Unit Type</Label>
            <Select
              value={(inputs as any)._clientInfo?.unitType || ''}
              onValueChange={(v) => updateField('_clientInfo' as any, { ...(inputs as any)._clientInfo, unitType: v })}
            >
              <SelectTrigger className="h-8 text-xs bg-theme-card border-theme-border text-theme-text">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border">
                {UNIT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs text-theme-text">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Client Info */}
      <section>
        <h3 className="text-sm font-semibold text-theme-text mb-2">Client Details</h3>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="space-y-1">
            <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Client Name</Label>
            <Input
              value={(inputs as any)._clients?.[0]?.name || ''}
              onChange={(e) => updateField('_clients' as any, [{ ...(inputs as any)._clients?.[0], name: e.target.value }])}
              placeholder="Full name"
              className="h-8 text-xs bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/40"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Country</Label>
            <Input
              value={(inputs as any)._clients?.[0]?.country || ''}
              onChange={(e) => updateField('_clients' as any, [{ ...(inputs as any)._clients?.[0], country: e.target.value }])}
              placeholder="UAE"
              className="h-8 text-xs bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/40"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Broker Name</Label>
            <Input
              value={(inputs as any)._clientInfo?.brokerName || ''}
              onChange={(e) => updateField('_clientInfo' as any, { ...(inputs as any)._clientInfo, brokerName: e.target.value })}
              placeholder="Your name"
              className="h-8 text-xs bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted/40"
            />
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section>
        <h3 className="text-sm font-semibold text-theme-text mb-2">Timeline</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Booking Date</Label>
            <div className="flex gap-1.5">
              <select
                value={inputs.bookingMonth}
                onChange={(e) => updateField('bookingMonth', Number(e.target.value))}
                className="flex-1 rounded-md border border-theme-border bg-theme-card text-theme-text text-xs h-8 px-2"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <Input
                type="number"
                value={inputs.bookingYear}
                onChange={(e) => updateField('bookingYear', Number(e.target.value))}
                className="w-20 h-8 text-xs bg-theme-card border-theme-border text-theme-text font-mono"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Handover Date</Label>
            <div className="flex gap-1.5">
              <select
                value={inputs.handoverMonth}
                onChange={(e) => updateField('handoverMonth', Number(e.target.value))}
                className="flex-1 rounded-md border border-theme-border bg-theme-card text-theme-text text-xs h-8 px-2"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <Input
                type="number"
                value={inputs.handoverYear}
                onChange={(e) => updateField('handoverYear', Number(e.target.value))}
                className="w-20 h-8 text-xs bg-theme-card border-theme-border text-theme-text font-mono"
              />
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-[10px] text-theme-text-muted">
          Construction: <span className="font-mono text-theme-accent">{calculateTotalMonths()}</span> months
        </div>
      </section>

      {/* Entry Costs */}
      <section>
        <h3 className="text-sm font-semibold text-theme-text mb-2">Entry Costs</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">EOI Fee</Label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-theme-text-muted font-mono">AED</span>
              <Input
                type="number"
                value={inputs.eoiFee}
                onChange={(e) => updateField('eoiFee', Number(e.target.value))}
                className="h-8 text-xs bg-theme-card border-theme-border text-theme-text font-mono pl-9"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-theme-text-muted uppercase tracking-wider">Oqood Fee</Label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-theme-text-muted font-mono">AED</span>
              <Input
                type="number"
                value={inputs.oqoodFee}
                onChange={(e) => updateField('oqoodFee', Number(e.target.value))}
                className="h-8 text-xs bg-theme-card border-theme-border text-theme-text font-mono pl-9"
              />
            </div>
          </div>
        </div>
        <p className="text-[10px] text-theme-text-muted mt-1.5">
          DLD fee: <span className="font-mono">4%</span> of purchase price (always applied)
        </p>
      </section>
    </div>
  );
};
