import { useState, useMemo } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Plus, Trash2, ArrowLeft, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AIPaymentPlanResult, AIExtractedMilestone } from "@/lib/aiExtractionTypes";

interface ExtractedDataPreviewProps {
  data: AIPaymentPlanResult;
  onDataChange: (data: AIPaymentPlanResult) => void;
  onApply: (data: AIPaymentPlanResult) => void;
  onBack: () => void;
}

const UNIT_TYPES = [
  { value: "studio", label: "Studio" },
  { value: "1br", label: "1 Bedroom" },
  { value: "2br", label: "2 Bedroom" },
  { value: "3br", label: "3 Bedroom" },
  { value: "4br", label: "4 Bedroom" },
  { value: "penthouse", label: "Penthouse" },
  { value: "townhouse", label: "Townhouse" },
  { value: "villa", label: "Villa" },
];

const MILESTONE_TYPES = [
  { value: "time", label: "Month #" },
  { value: "construction", label: "% Built" },
  { value: "post-handover", label: "Post-HO" },
];

const ConfidenceIcon = ({ confidence }: { confidence: number }) => {
  if (confidence >= 85) {
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  } else if (confidence >= 60) {
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  } else {
    return <XCircle className="w-4 h-4 text-red-500" />;
  }
};

const TriggerValueLabel = ({ milestone }: { milestone: AIExtractedMilestone }) => {
  if (milestone.type === 'construction') {
    return <span className="text-[9px] text-orange-400">@{milestone.triggerValue}% built</span>;
  }
  if (milestone.type === 'post-handover') {
    return <span className="text-[9px] text-purple-400">+{milestone.triggerValue}m after HO</span>;
  }
  if (milestone.isHandover) {
    return <span className="text-[9px] text-green-400">On Completion</span>;
  }
  return <span className="text-[9px] text-gray-400">M{milestone.triggerValue}</span>;
};

export const ExtractedDataPreview = ({
  data,
  onDataChange,
  onApply,
  onBack,
}: ExtractedDataPreviewProps) => {
  const [showPropertyInfo, setShowPropertyInfo] = useState(
    !!data.developer || !!data.projectName || !!data.purchasePrice || !!data.unitNumber
  );

  // Total: downpayment + onHandover + all milestones
  const totalPercent = useMemo(() => {
    const milestoneTotal = data.milestones.reduce((sum, m) => sum + m.paymentPercent, 0);
    return (data.downpaymentPercent || 0) + (data.onHandoverPercent || 0) + milestoneTotal;
  }, [data.downpaymentPercent, data.onHandoverPercent, data.milestones]);

  const isValidTotal = Math.abs(totalPercent - 100) < 0.5;

  const updateField = (field: string, value: any) => {
    onDataChange({ ...data, [field]: value });
  };

  const updateMilestone = (index: number, field: keyof AIExtractedMilestone, value: any) => {
    const updated = data.milestones.map((m, i) => i === index ? { ...m, [field]: value } : m);
    onDataChange({ ...data, milestones: updated });
  };

  const addMilestone = () => {
    const last = data.milestones[data.milestones.length - 1];
    const newMilestone: AIExtractedMilestone = {
      type: 'time',
      triggerValue: last ? last.triggerValue + 3 : 1,
      paymentPercent: 5,
      label: '',
    };
    onDataChange({
      ...data,
      milestones: [...data.milestones, newMilestone].sort((a, b) => {
        const typeOrder = { time: 0, construction: 1, 'post-handover': 2 };
        const tc = (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
        if (tc !== 0) return tc;
        return a.triggerValue - b.triggerValue;
      }),
    });
  };

  const removeMilestone = (index: number) => {
    onDataChange({ ...data, milestones: data.milestones.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Upload
      </Button>

      {/* Confidence */}
      <div className="p-3 rounded-lg bg-muted/50 border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall Confidence</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  data.confidence >= 85 ? "bg-green-500" :
                  data.confidence >= 60 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${data.confidence}%` }}
              />
            </div>
            <span className="text-sm font-mono">{data.confidence}%</span>
          </div>
        </div>
        {data.warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {data.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-xs text-yellow-600">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Property Info */}
      <Collapsible open={showPropertyInfo} onOpenChange={setShowPropertyInfo}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between">
            <span>Property Info (Optional)</span>
            {showPropertyInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Developer</Label>
              <Input value={data.developer || ''} onChange={(e) => updateField('developer', e.target.value)} placeholder="e.g., Emaar" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Project</Label>
              <Input value={data.projectName || ''} onChange={(e) => updateField('projectName', e.target.value)} placeholder="e.g., Creek Harbour" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Unit Number</Label>
              <Input value={data.unitNumber || ''} onChange={(e) => updateField('unitNumber', e.target.value)} placeholder="e.g., T1-2304" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Unit Type</Label>
              <Select value={data.unitType || ''} onValueChange={(v) => updateField('unitType', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Size (sqft)</Label>
              <Input type="number" value={data.sizeSqFt || ''} onChange={(e) => updateField('sizeSqFt', parseFloat(e.target.value) || 0)} placeholder="e.g., 1250" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Price (AED)</Label>
              <Input type="number" value={data.purchasePrice || ''} onChange={(e) => updateField('purchasePrice', parseFloat(e.target.value) || 0)} placeholder="e.g., 2500000" className="h-8 text-sm" />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Payment Structure */}
      <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
        <Label className="text-sm font-medium">Payment Structure</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Downpayment %</Label>
            <Input
              type="number"
              value={data.downpaymentPercent}
              onChange={(e) => updateField('downpaymentPercent', parseFloat(e.target.value) || 0)}
              className="h-8 text-sm font-mono"
            />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <Switch checked={data.hasPostHandover} onCheckedChange={(v) => updateField('hasPostHandover', v)} />
            <Label className="text-xs">Post-Handover Plan</Label>
          </div>
          {data.hasPostHandover && (
            <div>
              <Label className="text-xs">On Handover %</Label>
              <Input
                type="number"
                value={data.onHandoverPercent || 0}
                onChange={(e) => updateField('onHandoverPercent', parseFloat(e.target.value) || 0)}
                className="h-8 text-sm font-mono"
              />
            </div>
          )}
          <div className={data.hasPostHandover ? '' : 'col-span-2'}>
            <Label className="text-xs flex items-center gap-1">
              Handover Month (from booking)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="text-xs">Auto-detected from last pre-handover payment. Handover date calculated from your booking date.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              value={data.handoverMonthFromBooking || ''}
              onChange={(e) => updateField('handoverMonthFromBooking', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 27"
              className="h-8 text-sm font-mono"
            />
          </div>
        </div>
      </div>

      {/* Milestones Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Payment Milestones</Label>
          <Button variant="outline" size="sm" onClick={addMilestone} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Add Row
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_70px_70px_auto] gap-2 p-2 bg-muted text-xs font-medium border-b">
            <span>Type</span>
            <span>Trigger</span>
            <span>%</span>
            <span>Label</span>
            <span className="w-8"></span>
          </div>

          <div className="max-h-[40vh] overflow-y-auto">
            {data.milestones.map((m, idx) => (
              <div
                key={idx}
                className={cn(
                  "grid grid-cols-[1fr_80px_70px_70px_auto] gap-2 p-2 items-center text-xs border-b last:border-b-0",
                  m.isHandover && "bg-green-500/10",
                  m.type === 'post-handover' && "bg-purple-500/10",
                  m.type === 'construction' && "bg-orange-500/10"
                )}
              >
                <Select value={m.type} onValueChange={(v) => updateMilestone(idx, 'type', v)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MILESTONE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="space-y-0.5">
                  <Input
                    type="number"
                    value={m.triggerValue}
                    onChange={(e) => updateMilestone(idx, 'triggerValue', parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs font-mono"
                  />
                  <TriggerValueLabel milestone={m} />
                </div>

                <div className="flex items-center gap-0.5">
                  <Input
                    type="number"
                    step="0.01"
                    value={m.paymentPercent.toString()}
                    onChange={(e) => updateMilestone(idx, 'paymentPercent', parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs font-mono w-[70px]"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>

                <Input
                  value={m.label || ''}
                  onChange={(e) => updateMilestone(idx, 'label', e.target.value)}
                  placeholder="Label"
                  className="h-7 text-xs"
                />

                <Button variant="ghost" size="sm" onClick={() => removeMilestone(idx)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className={cn(
          "flex items-center justify-between p-2 rounded-lg text-sm font-medium",
          isValidTotal ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"
        )}>
          <span>Total (Downpayment + Milestones{data.hasPostHandover ? ' + On Handover' : ''})</span>
          <span className="font-mono">{totalPercent.toFixed(1)}%</span>
        </div>

        {!isValidTotal && (
          <p className="text-xs text-red-600">
            Total must equal 100%. Currently {totalPercent > 100 ? 'over' : 'under'} by {Math.abs(100 - totalPercent).toFixed(1)}%
          </p>
        )}
      </div>

      <Button onClick={() => onApply(data)} disabled={!isValidTotal} className="w-full" size="lg">
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Apply to Configurator
      </Button>
    </div>
  );
};
