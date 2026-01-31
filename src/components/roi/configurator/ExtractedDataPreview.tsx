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
import { ExtractedPaymentPlan, ExtractedInstallment } from "@/lib/paymentPlanTypes";

interface ExtractedDataPreviewProps {
  data: ExtractedPaymentPlan;
  onDataChange: (data: ExtractedPaymentPlan) => void;
  onApply: (data: ExtractedPaymentPlan) => void;
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

const INSTALLMENT_TYPES = [
  { value: "time", label: "Month #" },
  { value: "construction", label: "% Built" },
  { value: "handover", label: "Completion" },
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

// Helper to display trigger value context
const TriggerValueLabel = ({ 
  inst, 
  handoverMonth 
}: { 
  inst: ExtractedInstallment; 
  handoverMonth?: number;
}) => {
  if (inst.type === 'construction') {
    return (
      <span className="text-[9px] text-orange-400">@{inst.triggerValue}% built</span>
    );
  }
  if (inst.type === 'post-handover' && handoverMonth) {
    const relativeMonths = inst.triggerValue - handoverMonth;
    return (
      <span className="text-[9px] text-purple-400">+{relativeMonths} after HO</span>
    );
  }
  if (inst.type === 'handover') {
    return (
      <span className="text-[9px] text-green-400">On Completion</span>
    );
  }
  return (
    <span className="text-[9px] text-gray-400">M{inst.triggerValue}</span>
  );
};

export const ExtractedDataPreview = ({
  data,
  onDataChange,
  onApply,
  onBack,
}: ExtractedDataPreviewProps) => {
  // Open property section by default if any property data was extracted
  const [showPropertyInfo, setShowPropertyInfo] = useState(
    !!data.property?.developer || 
    !!data.property?.projectName ||
    !!data.property?.basePrice ||
    !!data.property?.unitNumber
  );

  // Calculate totals
  const totalPercent = useMemo(() => {
    return data.installments.reduce((sum, inst) => sum + inst.paymentPercent, 0);
  }, [data.installments]);

  const isValidTotal = Math.abs(totalPercent - 100) < 0.5;

  // Update property field
  const updateProperty = (field: string, value: any) => {
    onDataChange({
      ...data,
      property: {
        ...data.property,
        [field]: value,
      },
    });
  };

  // Update payment structure field
  const updateStructure = (field: string, value: any) => {
    onDataChange({
      ...data,
      paymentStructure: {
        ...data.paymentStructure,
        [field]: value,
      },
    });
  };

  // Update installment
  const updateInstallment = (id: string, field: keyof ExtractedInstallment, value: any) => {
    onDataChange({
      ...data,
      installments: data.installments.map(inst =>
        inst.id === id ? { ...inst, [field]: value } : inst
      ),
    });
  };

  // Add new installment
  const addInstallment = () => {
    const lastInst = data.installments[data.installments.length - 1];
    const newInst: ExtractedInstallment = {
      id: `manual-${Date.now()}`,
      type: 'time',
      triggerValue: lastInst ? lastInst.triggerValue + 3 : 0,
      paymentPercent: 5,
      label: '',
      confidence: 100,
    };
    onDataChange({
      ...data,
      installments: [...data.installments, newInst].sort((a, b) => {
        // Sort by type priority, then by trigger value
        const typeOrder = { time: 0, construction: 1, handover: 2, 'post-handover': 3 };
        const typeComp = typeOrder[a.type] - typeOrder[b.type];
        if (typeComp !== 0) return typeComp;
        return a.triggerValue - b.triggerValue;
      }),
    });
  };

  // Remove installment
  const removeInstallment = (id: string) => {
    onDataChange({
      ...data,
      installments: data.installments.filter(inst => inst.id !== id),
    });
  };

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Upload
      </Button>

      {/* Confidence Summary */}
      <div className="p-3 rounded-lg bg-muted/50 border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall Confidence</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  data.overallConfidence >= 85 ? "bg-green-500" :
                  data.overallConfidence >= 60 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${data.overallConfidence}%` }}
              />
            </div>
            <span className="text-sm font-mono">{data.overallConfidence}%</span>
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

      {/* Property Info (Collapsible) */}
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
              <Input
                value={data.property?.developer || ''}
                onChange={(e) => updateProperty('developer', e.target.value)}
                placeholder="e.g., Emaar"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Project</Label>
              <Input
                value={data.property?.projectName || ''}
                onChange={(e) => updateProperty('projectName', e.target.value)}
                placeholder="e.g., Creek Harbour"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Unit Number</Label>
              <Input
                value={data.property?.unitNumber || ''}
                onChange={(e) => updateProperty('unitNumber', e.target.value)}
                placeholder="e.g., T1-2304"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Unit Type</Label>
              <Select
                value={data.property?.unitType || ''}
                onValueChange={(v) => updateProperty('unitType', v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Size (sqft)</Label>
              <Input
                type="number"
                value={data.property?.unitSizeSqft || ''}
                onChange={(e) => updateProperty('unitSizeSqft', parseFloat(e.target.value) || 0)}
                placeholder="e.g., 1250"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Price (AED)</Label>
              <Input
                type="number"
                value={data.property?.basePrice || ''}
                onChange={(e) => updateProperty('basePrice', parseFloat(e.target.value) || 0)}
                placeholder="e.g., 2500000"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Payment Structure */}
      <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
        <Label className="text-sm font-medium">Payment Structure</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Split</Label>
            <Input
              value={data.paymentStructure.paymentSplit || ''}
              onChange={(e) => updateStructure('paymentSplit', e.target.value)}
              placeholder="e.g., 40/60"
              className="h-8 text-sm font-mono"
            />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <Switch
              checked={data.paymentStructure.hasPostHandover}
              onCheckedChange={(v) => updateStructure('hasPostHandover', v)}
            />
            <Label className="text-xs">Post-Handover Plan</Label>
          </div>
          <div className="col-span-2">
            <Label className="text-xs flex items-center gap-1">
              Handover Month (from booking)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="text-xs">Auto-detected from last pre-handover payment. Handover Q/Y will be calculated from your booking date when applied.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              value={data.paymentStructure.handoverMonthFromBooking || ''}
              onChange={(e) => updateStructure('handoverMonthFromBooking', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 27"
              className="h-8 text-sm font-mono"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Handover quarter & year will be calculated from your booking date
            </p>
          </div>
        </div>
      </div>

      {/* Installments Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Payment Installments</Label>
          <Button variant="outline" size="sm" onClick={addInstallment} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" />
            Add Row
          </Button>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_80px_70px_70px_auto] gap-2 p-2 bg-muted text-xs font-medium border-b">
            <span className="w-6">#</span>
            <span>Type</span>
            <span>Trigger</span>
            <span>%</span>
            <span>Label</span>
            <span className="w-8"></span>
          </div>
          
          {/* Rows */}
          <div className="max-h-[40vh] overflow-y-auto">
            {data.installments.map((inst, idx) => (
              <div 
                key={inst.id}
                className={cn(
                  "grid grid-cols-[auto_1fr_80px_70px_70px_auto] gap-2 p-2 items-center text-xs border-b last:border-b-0",
                  inst.type === 'handover' && "bg-green-500/10",
                  inst.type === 'post-handover' && "bg-purple-500/10",
                  inst.type === 'construction' && "bg-orange-500/10"
                )}
              >
                <div className="w-6 flex items-center gap-1">
                  <ConfidenceIcon confidence={inst.confidence} />
                </div>
                
                <Select
                  value={inst.type}
                  onValueChange={(v) => updateInstallment(inst.id, 'type', v)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTALLMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="space-y-0.5">
                  <Input
                    type="number"
                    value={inst.triggerValue}
                    onChange={(e) => updateInstallment(inst.id, 'triggerValue', parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs font-mono"
                    disabled={inst.type === 'handover'}
                  />
                  <TriggerValueLabel 
                    inst={inst} 
                    handoverMonth={data.paymentStructure.handoverMonthFromBooking} 
                  />
                </div>
                
                <div className="flex items-center gap-0.5">
                  <Input
                    type="number"
                    step="0.01"
                    value={inst.paymentPercent.toString()}
                    onChange={(e) => updateInstallment(inst.id, 'paymentPercent', parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs font-mono w-[70px]"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                
                <Input
                  value={inst.label || ''}
                  onChange={(e) => updateInstallment(inst.id, 'label', e.target.value)}
                  placeholder="Label"
                  className="h-7 text-xs"
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeInstallment(inst.id)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
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
          <span>Total</span>
          <span className="font-mono">{totalPercent.toFixed(1)}%</span>
        </div>
        
        {!isValidTotal && (
          <p className="text-xs text-red-600">
            Total must equal 100%. Currently {totalPercent > 100 ? 'over' : 'under'} by {Math.abs(100 - totalPercent).toFixed(1)}%
          </p>
        )}
      </div>

      {/* Apply Button */}
      <Button
        onClick={() => onApply(data)}
        disabled={!isValidTotal}
        className="w-full"
        size="lg"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Apply to Configurator
      </Button>
    </div>
  );
};
