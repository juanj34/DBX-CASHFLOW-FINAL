import { useState } from "react";
import { Plus, Trash2, Clock, Calendar, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfiguratorSectionProps, quarters, years } from "./types";
import { formatCurrency } from "../currencyUtils";
import { InfoTooltip } from "../InfoTooltip";
import { PaymentMilestone } from "../useOICalculations";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";

export const PostHandoverSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const [showPostHandoverInstallments, setShowPostHandoverInstallments] = useState(
    (inputs.postHandoverPayments?.length || 0) > 0
  );
  const [numPostPayments, setNumPostPayments] = useState(4);
  const [postPaymentInterval, setPostPaymentInterval] = useState(6);

  const hasPostHandoverPlan = inputs.hasPostHandoverPlan ?? false;
  
  // Calculate totals for post-handover plan
  const preHandoverInstallmentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  const preHandoverTotal = inputs.downpaymentPercent + preHandoverInstallmentsTotal;
  const postHandoverInstallmentsTotal = (inputs.postHandoverPayments || []).reduce((sum, m) => sum + m.paymentPercent, 0);
  
  // Calculate remaining for post-handover (what's left after pre-handover, on-handover)
  const totalAllocated = preHandoverTotal + (inputs.onHandoverPercent || 0) + postHandoverInstallmentsTotal;
  const remainingPostHandover = 100 - totalAllocated;
  
  // Validate total
  const isValidTotal = Math.abs(totalAllocated - 100) < 0.5 || remainingPostHandover >= 0;

  const handleToggle = (enabled: boolean) => {
    setInputs(prev => ({
      ...prev,
      hasPostHandoverPlan: enabled,
      // Reset on-handover to 0 when disabling, set defaults when enabling
      onHandoverPercent: enabled ? 1 : 0,
      postHandoverPercent: enabled ? Math.max(0, 100 - preHandoverTotal - 1) : 0,
      postHandoverPayments: enabled ? prev.postHandoverPayments || [] : [],
    }));
  };

  const addPostHandoverPayment = () => {
    const newId = `post-${Date.now()}`;
    const lastMonth = inputs.postHandoverPayments && inputs.postHandoverPayments.length > 0 
      ? Math.max(...inputs.postHandoverPayments.map(p => p.triggerValue))
      : 0;
    const newPayment: PaymentMilestone = {
      id: newId, 
      type: 'post-handover',
      triggerValue: lastMonth + 6, // 6 months after previous
      paymentPercent: 5
    };
    setInputs(prev => ({
      ...prev,
      postHandoverPayments: [
        ...(prev.postHandoverPayments || []),
        newPayment
      ].sort((a, b) => a.triggerValue - b.triggerValue)
    }));
  };

  const removePostHandoverPayment = (id: string) => {
    setInputs(prev => ({
      ...prev,
      postHandoverPayments: (prev.postHandoverPayments || []).filter(m => m.id !== id)
    }));
  };

  const updatePostHandoverPayment = (id: string, field: keyof PaymentMilestone, value: any) => {
    setInputs(prev => {
      const updated = (prev.postHandoverPayments || []).map(m =>
        m.id === id ? { ...m, [field]: value } : m
      );
      if (field === 'triggerValue') {
        return { ...prev, postHandoverPayments: updated.sort((a, b) => a.triggerValue - b.triggerValue) };
      }
      return { ...prev, postHandoverPayments: updated };
    });
  };

  const handleGeneratePostPayments = () => {
    const remaining = 100 - preHandoverTotal - (inputs.onHandoverPercent || 0);
    const percentPerPayment = numPostPayments > 0 ? remaining / numPostPayments : 0;
    const newPayments: PaymentMilestone[] = [];
    
    for (let i = 0; i < numPostPayments; i++) {
      newPayments.push({
        id: `post-auto-${Date.now()}-${i}`,
        type: 'post-handover',
        triggerValue: postPaymentInterval * (i + 1), // months after handover
        paymentPercent: parseFloat(percentPerPayment.toFixed(2))
      });
    }
    
    setInputs(prev => ({ ...prev, postHandoverPayments: newPayments }));
    setShowPostHandoverInstallments(true);
  };

  const handleNumberInputChange = (
    value: string, 
    setter: (val: number) => void, 
    min: number = 0, 
    max: number = 100
  ) => {
    if (value === '') {
      setter(0);
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setter(Math.min(Math.max(num, min), max));
    }
  };

  return (
    <div className="space-y-4">
      {/* Post-Handover Toggle */}
      <div className="flex items-center justify-between p-3 bg-theme-card rounded-xl border border-theme-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-sm text-theme-text font-medium">Post-Handover Plan</span>
          <InfoTooltip translationKey="tooltipPostHandover" />
        </div>
        <Switch 
          checked={hasPostHandoverPlan} 
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-purple-500"
        />
      </div>

      {hasPostHandoverPlan && (
        <>
          {/* On Handover Payment */}
          <div className="space-y-2 p-3 bg-theme-card rounded-xl border border-green-500/30 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-[10px] font-bold text-green-400">H</div>
              <span className="text-sm font-medium text-green-400">On Handover Payment</span>
              <InfoTooltip translationKey="tooltipOnHandover" />
            </div>
            <div className="flex items-center gap-3 ml-7">
              <Slider
                value={[inputs.onHandoverPercent || 0]}
                onValueChange={([value]) => setInputs(prev => ({ ...prev, onHandoverPercent: value }))}
                min={0}
                max={20}
                step={1}
                className="flex-1"
              />
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={inputs.onHandoverPercent || ''}
                  onChange={(e) => handleNumberInputChange(
                    e.target.value, 
                    (val) => setInputs(prev => ({ ...prev, onHandoverPercent: val })),
                    0,
                    20
                  )}
                  className="w-14 h-7 text-center bg-theme-input border-theme-border text-green-400 font-mono text-sm"
                />
                <span className="text-xs text-theme-text-muted">%</span>
              </div>
            </div>
            <div className="text-[10px] text-theme-text-muted font-mono ml-7">
              {formatCurrency(inputs.basePrice * (inputs.onHandoverPercent || 0) / 100, currency)}
            </div>
          </div>

          {/* Post-Handover End Date */}
          <div className="space-y-2 p-3 bg-theme-card rounded-xl border border-purple-500/30">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Post-Handover Ends</span>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <Select
                value={String(inputs.postHandoverEndQuarter)}
                onValueChange={(v) => setInputs(prev => ({ ...prev, postHandoverEndQuarter: Number(v) }))}
              >
                <SelectTrigger className="w-20 h-8 bg-theme-input border-theme-border text-theme-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-theme-card border-theme-border">
                  {quarters.map((q) => (
                    <SelectItem key={q.value} value={String(q.value)} className="text-theme-text hover:bg-theme-hover">
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(inputs.postHandoverEndYear)}
                onValueChange={(v) => setInputs(prev => ({ ...prev, postHandoverEndYear: Number(v) }))}
              >
                <SelectTrigger className="w-24 h-8 bg-theme-input border-theme-border text-theme-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-theme-card border-theme-border">
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-theme-text hover:bg-theme-hover">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Auto-Generate Post-Handover Payments */}
          <div className="space-y-2 p-3 bg-theme-card rounded-xl border border-purple-500/30">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400">P</div>
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Post-Handover Installments</span>
            </div>
            
            <div className="flex items-center gap-2 ml-7">
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={numPostPayments || ''}
                  onChange={(e) => handleNumberInputChange(e.target.value, setNumPostPayments, 1, 100)}
                  className="w-14 h-7 bg-theme-input border-theme-border text-theme-text font-mono text-center text-xs"
                />
                <span className="text-[10px] text-theme-text-muted">payments</span>
              </div>
              <span className="text-theme-text-muted">×</span>
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={postPaymentInterval || ''}
                  onChange={(e) => handleNumberInputChange(e.target.value, setPostPaymentInterval, 1, 24)}
                  className="w-10 h-7 bg-theme-input border-theme-border text-theme-text font-mono text-center text-xs"
                />
                <span className="text-[10px] text-theme-text-muted">mo</span>
              </div>
              <Button
                type="button"
                onClick={handleGeneratePostPayments}
                size="sm"
                className="h-7 px-3 bg-purple-500 text-white hover:bg-purple-600 font-semibold text-xs ml-auto"
              >
                <Zap className="w-3 h-3 mr-1" />
                Generate
              </Button>
            </div>
          </div>

          {/* Post-Handover Installments List */}
          <Collapsible open={showPostHandoverInstallments} onOpenChange={setShowPostHandoverInstallments}>
            <div className="space-y-2 p-3 bg-theme-card rounded-xl border border-theme-border">
              <CollapsibleTrigger asChild>
                <div className="flex justify-between items-center cursor-pointer hover:opacity-80">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-theme-text-muted font-medium">Post-Handover Payments</label>
                    <span className="text-[10px] text-theme-text-muted">({(inputs.postHandoverPayments || []).length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-[10px] px-1.5 py-0.5 rounded ${
                      remainingPostHandover > 0.5 ? 'bg-amber-500/20 text-amber-400' : 
                      remainingPostHandover < -0.5 ? 'bg-red-500/20 text-red-400' : 
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {remainingPostHandover > 0.5 ? `${remainingPostHandover.toFixed(1)}% left` : 
                      remainingPostHandover < -0.5 ? `${Math.abs(remainingPostHandover).toFixed(1)}% over` : 
                      '✓'}
                    </div>
                    {showPostHandoverInstallments ? <ChevronUp className="w-4 h-4 text-theme-text-muted" /> : <ChevronDown className="w-4 h-4 text-theme-text-muted" />}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pt-2 border-t border-theme-border">
                  {(inputs.postHandoverPayments || []).map((payment, index) => (
                    <div key={payment.id} className="flex items-center gap-1.5 p-1.5 bg-theme-input rounded-lg">
                      <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 shrink-0">
                        {index + 1}
                      </div>
                      
                      <div className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-theme-text-muted" />
                        <span className="text-[10px] text-theme-text-muted">+</span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={payment.triggerValue || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                            updatePostHandoverPayment(payment.id, 'triggerValue', Math.max(0, val));
                          }}
                          className="w-10 h-6 text-center bg-theme-card border-theme-border text-theme-text font-mono text-[10px]"
                        />
                        <span className="text-[10px] text-theme-text-muted">mo</span>
                      </div>

                      <div className="flex items-center gap-0.5 ml-auto">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={payment.paymentPercent || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                            updatePostHandoverPayment(payment.id, 'paymentPercent', Math.min(100, Math.max(0, val)));
                          }}
                          className="w-12 h-6 text-center bg-theme-card border-theme-border text-purple-400 font-mono text-[10px]"
                        />
                        <span className="text-[10px] text-theme-text-muted">%</span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePostHandoverPayment(payment.id)}
                        className="h-6 w-6 text-theme-text-muted hover:text-red-400 hover:bg-red-400/10 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPostHandoverPayment}
                  className="w-full h-7 text-[10px] border-dashed border-theme-border text-theme-text-muted hover:bg-theme-hover hover:text-theme-text mt-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Post-Handover Payment
                </Button>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Post-Handover Summary */}
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-[10px] text-theme-text-muted uppercase">Pre-Handover</div>
                <div className="text-sm font-mono font-semibold text-theme-accent">{preHandoverTotal.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-[10px] text-theme-text-muted uppercase">On Handover</div>
                <div className="text-sm font-mono font-semibold text-green-400">{(inputs.onHandoverPercent || 0).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-[10px] text-theme-text-muted uppercase">Post-Handover</div>
                <div className="text-sm font-mono font-semibold text-purple-400">{postHandoverInstallmentsTotal.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-[10px] text-theme-text-muted uppercase">Total</div>
                <div className={`text-sm font-mono font-bold ${Math.abs(totalAllocated - 100) < 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalAllocated.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
