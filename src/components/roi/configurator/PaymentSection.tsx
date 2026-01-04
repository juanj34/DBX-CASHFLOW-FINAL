import { useState } from "react";
import { Plus, Trash2, Clock, Building2, Zap, Home, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfiguratorSectionProps, presetSplits } from "./types";
import { formatCurrency } from "../currencyUtils";
import { InfoTooltip } from "../InfoTooltip";
import { PaymentMilestone } from "../useOICalculations";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const PaymentSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const [numPayments, setNumPayments] = useState(4);
  const [paymentInterval, setPaymentInterval] = useState(6);
  const [showInstallments, setShowInstallments] = useState(inputs.additionalPayments.length > 0);
  const [showCustomSplit, setShowCustomSplit] = useState(false);
  const [customPreHandover, setCustomPreHandover] = useState('');

  // Calculate totals
  const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;
  const handoverPercent = 100 - inputs.preHandoverPercent;
  const remainingToDistribute = inputs.preHandoverPercent - inputs.downpaymentPercent - additionalPaymentsTotal;
  
  const isValidPreHandover = Math.abs(preHandoverTotal - inputs.preHandoverPercent) < 0.01;
  const totalPayment = preHandoverTotal + handoverPercent;
  const isValidTotal = Math.abs(totalPayment - 100) < 0.01;
  
  // Check if payments have been added
  const hasPayments = inputs.additionalPayments.length > 0;
  const hasSplitSelected = inputs.preHandoverPercent > 0;

  const applyPaymentSplit = (split: string) => {
    const [preHandover] = split.split('/').map(Number);
    setInputs(prev => ({
      ...prev,
      preHandoverPercent: preHandover,
      additionalPayments: []
    }));
  };

  const calculateAutoPercentage = () => {
    const remaining = inputs.preHandoverPercent - inputs.downpaymentPercent;
    return numPayments > 0 ? remaining / numPayments : 0;
  };

  const handleGeneratePayments = () => {
    const percentPerPayment = calculateAutoPercentage();
    const newPayments: PaymentMilestone[] = [];
    
    for (let i = 0; i < numPayments; i++) {
      newPayments.push({
        id: `auto-${Date.now()}-${i}`,
        type: 'time',
        triggerValue: paymentInterval * (i + 1),
        paymentPercent: parseFloat(percentPerPayment.toFixed(2))
      });
    }
    
    setInputs(prev => ({ ...prev, additionalPayments: newPayments }));
    setShowInstallments(true);
  };

  const addAdditionalPayment = () => {
    const newId = `additional-${Date.now()}`;
    const lastPaymentPercent = inputs.additionalPayments.length > 0 
      ? inputs.additionalPayments[inputs.additionalPayments.length - 1].paymentPercent 
      : 2.5;
    setInputs(prev => ({
      ...prev,
      additionalPayments: [
        ...prev.additionalPayments,
        { id: newId, type: 'time', triggerValue: 6, paymentPercent: lastPaymentPercent }
      ]
    }));
  };

  const removeAdditionalPayment = (id: string) => {
    setInputs(prev => ({
      ...prev,
      additionalPayments: prev.additionalPayments.filter(m => m.id !== id)
    }));
  };

  const updateAdditionalPayment = (id: string, field: keyof PaymentMilestone, value: any) => {
    setInputs(prev => ({
      ...prev,
      additionalPayments: prev.additionalPayments.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      )
    }));
  };

  // Handle number input that allows empty/deletion
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

  const applyCustomSplit = () => {
    const val = parseInt(customPreHandover);
    if (!isNaN(val) && val >= 10 && val <= 90) {
      setInputs(prev => ({
        ...prev,
        preHandoverPercent: val,
        additionalPayments: []
      }));
      setShowCustomSplit(false);
      setCustomPreHandover('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Payment Plan</h3>
        <p className="text-sm text-gray-500">Configure your payment schedule and milestones</p>
      </div>

      {/* Step 1: Preset Split Buttons */}
      <div className="space-y-3 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#CCFF00]/20 flex items-center justify-center text-xs font-bold text-[#CCFF00]">1</div>
          <label className="text-sm text-gray-300 font-medium">Payment Split</label>
          <InfoTooltip translationKey="tooltipPreHandover" />
        </div>
        <p className="text-xs text-gray-500 ml-8">Choose how much you pay before vs. at handover</p>
        <div className="flex flex-wrap gap-2 ml-8">
          {presetSplits.map((split) => (
            <Button
              key={split}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPaymentSplit(split)}
              className={`h-8 text-sm px-4 border-[#2a3142] ${
                inputs.preHandoverPercent === parseInt(split.split('/')[0])
                  ? 'bg-[#CCFF00]/20 border-[#CCFF00]/50 text-[#CCFF00]'
                  : 'text-gray-600 hover:bg-[#2a3142] hover:text-white'
              }`}
            >
              {split}
            </Button>
          ))}
          {/* Custom split button */}
          {!showCustomSplit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCustomSplit(true)}
              className="h-8 text-sm px-3 border-dashed border-[#2a3142] text-gray-500 hover:bg-[#2a3142] hover:text-white"
            >
              Custom
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Input
                type="text"
                inputMode="numeric"
                value={customPreHandover}
                onChange={(e) => setCustomPreHandover(e.target.value)}
                placeholder="e.g. 35"
                className="w-16 h-8 text-center bg-[#0d1117] border-[#2a3142] text-white font-mono text-sm"
                autoFocus
              />
              <span className="text-xs text-gray-500">/</span>
              <span className="text-xs text-gray-400 w-8">{100 - (parseInt(customPreHandover) || 0)}</span>
              <Button
                type="button"
                size="sm"
                onClick={applyCustomSplit}
                disabled={!customPreHandover || parseInt(customPreHandover) < 10 || parseInt(customPreHandover) > 90}
                className="h-7 px-2 bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 text-xs"
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Downpayment - Only show after split is selected */}
      {hasSplitSelected && (
        <div className="space-y-3 p-4 bg-[#1a1f2e] rounded-xl border border-[#CCFF00]/30 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#CCFF00]/20 flex items-center justify-center text-xs font-bold text-[#CCFF00]">2</div>
            <span className="text-sm font-medium text-[#CCFF00]">Downpayment</span>
            <InfoTooltip translationKey="tooltipDownpayment" />
          </div>
          <div className="text-xs text-gray-500 ml-8">
            EOI ({formatCurrency(inputs.eoiFee, currency)}) is included in this amount
          </div>
          <div className="flex items-center gap-4 ml-8">
            <Slider
              value={[inputs.downpaymentPercent]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, downpaymentPercent: value }))}
              min={5}
              max={Math.min(50, inputs.preHandoverPercent)}
              step={1}
              className="flex-1 roi-slider-lime"
            />
            <div className="flex items-center gap-1">
              <Input
                type="text"
                inputMode="decimal"
                value={inputs.downpaymentPercent || ''}
                onChange={(e) => handleNumberInputChange(
                  e.target.value, 
                  (val) => setInputs(prev => ({ ...prev, downpaymentPercent: val })),
                  5,
                  inputs.preHandoverPercent
                )}
                className="w-16 h-8 text-center bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-mono ml-8">
            {formatCurrency(inputs.basePrice * inputs.downpaymentPercent / 100, currency)}
          </div>
        </div>
      )}

      {/* Step 3: Installments Section - Only show after downpayment is set */}
      {hasSplitSelected && inputs.downpaymentPercent > 0 && (
        <div className="space-y-4 animate-fade-in">
          {/* Auto-Generate Card */}
          <div className="space-y-3 p-4 bg-gradient-to-br from-[#CCFF00]/10 to-transparent rounded-xl border border-[#CCFF00]/30">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#CCFF00]/20 flex items-center justify-center text-xs font-bold text-[#CCFF00]">3</div>
              <Zap className="w-4 h-4 text-[#CCFF00]" />
              <span className="text-sm font-medium text-[#CCFF00]">Generate Installments</span>
            </div>
            <p className="text-xs text-gray-500 ml-8">Auto-create evenly distributed payments</p>
            
            <div className="grid grid-cols-2 gap-3 ml-8">
              <div className="space-y-1">
                <label className="text-xs text-gray-500"># Payments</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={numPayments || ''}
                  onChange={(e) => handleNumberInputChange(e.target.value, setNumPayments, 1, 12)}
                  className="h-8 bg-[#0d1117] border-[#2a3142] text-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Interval (months)</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={paymentInterval || ''}
                  onChange={(e) => handleNumberInputChange(e.target.value, setPaymentInterval, 1, 24)}
                  className="h-8 bg-[#0d1117] border-[#2a3142] text-white font-mono"
                />
              </div>
            </div>
            
            <Button
              type="button"
              onClick={handleGeneratePayments}
              className="w-full h-8 bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold text-sm ml-8 max-w-[calc(100%-2rem)]"
            >
              <Zap className="w-3.5 h-3.5 mr-1" />
              Generate {numPayments} Installments
            </Button>
            
            <p className="text-[10px] text-gray-500 ml-8 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              <span>You can modify individual installment amounts afterwards if they vary in value</span>
            </p>
          </div>

          {/* Installments List */}
          <Collapsible open={showInstallments} onOpenChange={setShowInstallments}>
            <div className="space-y-3 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
              <CollapsibleTrigger asChild>
                <div className="flex justify-between items-center cursor-pointer hover:opacity-80">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-300 font-medium">Installments</label>
                    <span className="text-xs text-gray-500">({inputs.additionalPayments.length} added)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasPayments ? (
                      <div className={`text-xs px-2 py-1 rounded ${
                        remainingToDistribute > 0.5 ? 'bg-amber-500/20 text-amber-400' : 
                        remainingToDistribute < -0.5 ? 'bg-red-500/20 text-red-400' : 
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {remainingToDistribute > 0.5 ? `${remainingToDistribute.toFixed(1)}% remaining` : 
                        remainingToDistribute < -0.5 ? `${Math.abs(remainingToDistribute).toFixed(1)}% exceeded` : 
                        '✓ Distributed'}
                      </div>
                    ) : (
                      <div className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400">
                        Add installments to continue
                      </div>
                    )}
                    {showInstallments ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="space-y-2 max-h-48 overflow-y-auto pt-3 border-t border-[#2a3142]">
                  {inputs.additionalPayments.map((payment, index) => (
                    <div key={payment.id} className="flex items-center gap-2 p-2 bg-[#0d1117] rounded-lg">
                      <div className="w-5 h-5 rounded-full bg-[#2a3142] flex items-center justify-center text-xs text-gray-400">
                        {index + 2}
                      </div>
                      
                      <Select
                        value={payment.type}
                        onValueChange={(value: 'time' | 'construction') => updateAdditionalPayment(payment.id, 'type', value)}
                      >
                        <SelectTrigger className="w-[90px] h-7 text-xs bg-[#1a1f2e] border-[#2a3142]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1f2e] border-[#2a3142] z-50">
                          <SelectItem value="time" className="text-white hover:bg-[#2a3142]">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Time</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="construction" className="text-white hover:bg-[#2a3142]">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span>Const.</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500 w-6">
                          {payment.type === 'time' ? 'Mo:' : 'At:'}
                        </span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={payment.triggerValue || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                            updateAdditionalPayment(payment.id, 'triggerValue', Math.max(0, val));
                          }}
                          className="w-14 h-7 text-center bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-xs"
                        />
                        {payment.type === 'construction' && <span className="text-xs text-gray-500">%</span>}
                      </div>

                      <div className="flex items-center gap-1 ml-auto">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={payment.paymentPercent || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                            updateAdditionalPayment(payment.id, 'paymentPercent', Math.min(100, Math.max(0, val)));
                          }}
                          className="w-14 h-7 text-center bg-[#1a1f2e] border-[#2a3142] text-[#CCFF00] font-mono text-xs"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAdditionalPayment(payment.id)}
                        className="h-7 w-7 text-gray-500 hover:text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAdditionalPayment}
                  className="w-full h-8 text-xs border-dashed border-[#2a3142] text-gray-400 hover:bg-[#2a3142] hover:text-white mt-2"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Installment
                </Button>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      )}

      {/* Handover & Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Home className="w-4 h-4" />
              <span className="text-sm">HANDOVER</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {handoverPercent}%
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatCurrency(inputs.basePrice * handoverPercent / 100, currency)}
          </div>
        </div>

        <div className="p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">TOTAL</span>
            <div className={`flex items-center gap-1.5 ${isValidTotal ? 'text-green-400' : 'text-red-400'}`}>
              {isValidTotal ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="font-mono font-bold text-xl">{totalPayment.toFixed(0)}%</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Pre: {preHandoverTotal.toFixed(0)}% + Handover: {handoverPercent}%
          </div>
        </div>
      </div>
    </div>
  );
};