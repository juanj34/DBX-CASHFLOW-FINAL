import { useState } from "react";
import { Plus, Trash2, Clock, Building2, Zap, Home, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfiguratorSectionProps, presetSplits } from "./types";
import { formatCurrency } from "../currencyUtils";
import { InfoTooltip } from "../InfoTooltip";
import { PaymentMilestone } from "../useOICalculations";

export const PaymentSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const [numPayments, setNumPayments] = useState(4);
  const [paymentInterval, setPaymentInterval] = useState(6);

  // Calculate totals
  const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;
  const handoverPercent = 100 - inputs.preHandoverPercent;
  const remainingToDistribute = inputs.preHandoverPercent - inputs.downpaymentPercent - additionalPaymentsTotal;
  
  const isValidPreHandover = Math.abs(preHandoverTotal - inputs.preHandoverPercent) < 0.01;
  const totalPayment = preHandoverTotal + handoverPercent;
  const isValidTotal = Math.abs(totalPayment - 100) < 0.01;

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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Payment Plan</h3>
        <p className="text-sm text-gray-500">Configure your payment schedule and milestones</p>
      </div>

      {/* Preset Split Buttons */}
      <div className="space-y-3 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
        <div className="flex items-center gap-1">
          <label className="text-sm text-gray-300 font-medium">Pre-Handover / Handover Split</label>
          <InfoTooltip translationKey="tooltipPreHandover" />
        </div>
        <div className="flex flex-wrap gap-2">
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
                  : 'text-gray-300 hover:bg-[#2a3142] hover:text-white'
              }`}
            >
              {split}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Downpayment */}
        <div className="space-y-3 p-4 bg-[#1a1f2e] rounded-xl border border-[#CCFF00]/30">
          <div className="flex items-center gap-2 text-[#CCFF00]">
            <div className="w-6 h-6 rounded-full bg-[#CCFF00]/20 flex items-center justify-center text-xs font-bold">1</div>
            <span className="text-sm font-medium">DOWNPAYMENT</span>
            <InfoTooltip translationKey="tooltipDownpayment" />
          </div>
          <div className="text-xs text-gray-500">
            EOI ({formatCurrency(inputs.eoiFee, currency)}) is part of this
          </div>
          <div className="flex items-center gap-4">
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
                value={inputs.downpaymentPercent}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    setInputs(prev => ({ 
                      ...prev, 
                      downpaymentPercent: Math.min(Math.max(value, 5), prev.preHandoverPercent) 
                    }));
                  }
                }}
                className="w-16 h-8 text-center bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-mono">
            {formatCurrency(inputs.basePrice * inputs.downpaymentPercent / 100, currency)}
          </div>
        </div>

        {/* Auto-Generate */}
        <div className="space-y-3 p-4 bg-gradient-to-br from-[#CCFF00]/10 to-transparent rounded-xl border border-[#CCFF00]/30">
          <div className="flex items-center gap-2 text-[#CCFF00]">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Auto-Generate</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500"># Payments</label>
              <Input
                type="number"
                value={numPayments}
                onChange={(e) => setNumPayments(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                className="h-8 bg-[#0d1117] border-[#2a3142] text-white font-mono"
                min={1}
                max={12}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Interval (mo)</label>
              <Input
                type="number"
                value={paymentInterval}
                onChange={(e) => setPaymentInterval(Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))}
                className="h-8 bg-[#0d1117] border-[#2a3142] text-white font-mono"
                min={1}
                max={24}
              />
            </div>
          </div>
          
          <Button
            type="button"
            onClick={handleGeneratePayments}
            className="w-full h-8 bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold text-sm"
          >
            <Zap className="w-3.5 h-3.5 mr-1" />
            Generate
          </Button>
        </div>
      </div>

      {/* Additional Payments */}
      <div className="space-y-3 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
        <div className="flex justify-between items-center">
          <label className="text-sm text-gray-300 font-medium">Additional Payments</label>
          <div className={`text-xs px-2 py-1 rounded ${
            remainingToDistribute > 0 ? 'bg-amber-500/20 text-amber-400' : 
            remainingToDistribute < 0 ? 'bg-red-500/20 text-red-400' : 
            'bg-green-500/20 text-green-400'
          }`}>
            {remainingToDistribute > 0 ? `${remainingToDistribute.toFixed(1)}% remaining` : 
             remainingToDistribute < 0 ? `${Math.abs(remainingToDistribute).toFixed(1)}% exceeded` : 
             '✓ Distributed'}
          </div>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto">
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
                <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
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
                  type="number"
                  value={payment.triggerValue}
                  onChange={(e) => updateAdditionalPayment(payment.id, 'triggerValue', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-14 h-7 text-center bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-xs"
                />
                {payment.type === 'construction' && <span className="text-xs text-gray-500">%</span>}
              </div>

              <div className="flex items-center gap-1 ml-auto">
                <Input
                  type="text"
                  inputMode="decimal"
                  defaultValue={payment.paymentPercent}
                  key={`${payment.id}-${payment.paymentPercent}`}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      updateAdditionalPayment(payment.id, 'paymentPercent', Math.min(100, Math.max(0, value)));
                    }
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
          className="w-full h-8 text-xs border-dashed border-[#2a3142] text-gray-400 hover:bg-[#2a3142] hover:text-white"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Payment
        </Button>
      </div>

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
