import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Clock, Building2, Home, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Info, Key, Calendar, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfiguratorSectionProps, presetSplits } from "./types";
import { formatCurrency } from "../currencyUtils";
import { InfoTooltip } from "../InfoTooltip";
import { PaymentMilestone } from "../useOICalculations";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Helper to calculate actual payment date
const getPaymentDate = (monthsFromBooking: number, bookingMonth: number, bookingYear: number): Date => {
  const date = new Date(bookingYear, bookingMonth - 1);
  date.setMonth(date.getMonth() + monthsFromBooking);
  return date;
};

// Format date as "Jul 2025"
const formatPaymentDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

// Check if a payment is after handover
const isPaymentPostHandover = (monthsFromBooking: number, bookingMonth: number, bookingYear: number, handoverQuarter: number, handoverYear: number): boolean => {
  const paymentDate = getPaymentDate(monthsFromBooking, bookingMonth, bookingYear);
  const handoverMonth = (handoverQuarter - 1) * 3 + 1; // Q1=Jan, Q2=Apr, Q3=Jul, Q4=Oct
  const handoverDate = new Date(handoverYear, handoverMonth - 1);
  return paymentDate >= handoverDate;
};

// Check if payment falls in handover quarter
const isPaymentInHandoverQuarter = (monthsFromBooking: number, bookingMonth: number, bookingYear: number, handoverQuarter: number, handoverYear: number): boolean => {
  const paymentDate = getPaymentDate(monthsFromBooking, bookingMonth, bookingYear);
  const handoverQuarterStart = new Date(handoverYear, (handoverQuarter - 1) * 3);
  const handoverQuarterEnd = new Date(handoverYear, handoverQuarter * 3);
  return paymentDate >= handoverQuarterStart && paymentDate < handoverQuarterEnd;
};

export const PaymentSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const [showInstallments, setShowInstallments] = useState(inputs.additionalPayments.length > 0);
  const [showCustomSplit, setShowCustomSplit] = useState(false);
  const [customPreHandover, setCustomPreHandover] = useState('');
  const [numPayments, setNumPayments] = useState(4);
  const [paymentInterval, setPaymentInterval] = useState(3);
  const [paymentPercent, setPaymentPercent] = useState(5);

  // Calculate totals
  const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  
  // Simple toggle for allowing payments past handover
  const hasPostHandoverPlan = inputs.hasPostHandoverPlan ?? false;
  
  // Calculate pre-handover vs post-handover totals
  const preHandoverPayments = inputs.additionalPayments.filter(p => {
    if (p.type !== 'time') return true; // construction milestones go to pre-handover
    return !isPaymentPostHandover(p.triggerValue, inputs.bookingMonth, inputs.bookingYear, inputs.handoverQuarter, inputs.handoverYear);
  });
  const postHandoverPayments = inputs.additionalPayments.filter(p => {
    if (p.type !== 'time') return false;
    return isPaymentPostHandover(p.triggerValue, inputs.bookingMonth, inputs.bookingYear, inputs.handoverQuarter, inputs.handoverYear);
  });
  
  const preHandoverInstallmentsTotal = preHandoverPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  const postHandoverTotal = postHandoverPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  const preHandoverTotal = inputs.downpaymentPercent + preHandoverInstallmentsTotal;
  
  // Calculate remaining and handover percent based on mode
  let handoverPercent: number;
  let totalPayment: number;
  
  if (hasPostHandoverPlan) {
    // Post-handover mode: pre + post should equal 100%, handover is 0
    handoverPercent = 0;
    totalPayment = preHandoverTotal + postHandoverTotal;
  } else {
    // Standard mode: remaining goes to handover lump sum
    handoverPercent = 100 - inputs.preHandoverPercent;
    totalPayment = preHandoverTotal + handoverPercent;
  }
  
  // For post-handover: all installments + downpayment should equal 100%
  // For standard: pre-handover installments + downpayment should equal preHandoverPercent
  let remainingToDistribute: number;
  if (hasPostHandoverPlan) {
    remainingToDistribute = 100 - inputs.downpaymentPercent - additionalPaymentsTotal;
  } else {
    remainingToDistribute = inputs.preHandoverPercent - inputs.downpaymentPercent - additionalPaymentsTotal;
  }
  const isValidTotal = Math.abs(totalPayment - 100) < 0.5;
  
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

  const handleResetPayments = () => {
    setInputs(prev => ({ ...prev, additionalPayments: [] }));
    setShowInstallments(false);
  };

  const addAdditionalPayment = () => {
    const newId = `additional-${Date.now()}`;
    const lastPaymentPercent = inputs.additionalPayments.length > 0 
      ? inputs.additionalPayments[inputs.additionalPayments.length - 1].paymentPercent 
      : 2.5;
    // Find next available month
    const lastMonth = inputs.additionalPayments.length > 0 
      ? Math.max(...inputs.additionalPayments.filter(p => p.type === 'time').map(p => p.triggerValue))
      : 0;
    const newPayment: PaymentMilestone = {
      id: newId, 
      type: 'time' as const, 
      triggerValue: lastMonth + 3, 
      paymentPercent: lastPaymentPercent
    };
    setInputs(prev => ({
      ...prev,
      additionalPayments: [
        ...prev.additionalPayments,
        newPayment
      ].sort((a, b) => a.triggerValue - b.triggerValue)
    }));
  };

  const removeAdditionalPayment = (id: string) => {
    setInputs(prev => ({
      ...prev,
      additionalPayments: prev.additionalPayments.filter(m => m.id !== id)
    }));
  };

  const updateAdditionalPayment = (id: string, field: keyof PaymentMilestone, value: any) => {
    setInputs(prev => {
      const updated = prev.additionalPayments.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      );
      // Sort by triggerValue when month changes
      if (field === 'triggerValue') {
        return { ...prev, additionalPayments: updated.sort((a, b) => a.triggerValue - b.triggerValue) };
      }
      return { ...prev, additionalPayments: updated };
    });
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

  // Format number with commas
  const formatWithCommas = (num: number) => num.toLocaleString();

  const handleGeneratePayments = () => {
    const newPayments: PaymentMilestone[] = [];
    
    for (let i = 0; i < numPayments; i++) {
      newPayments.push({
        id: `auto-${Date.now()}-${i}`,
        type: 'time',
        triggerValue: paymentInterval * (i + 1),
        paymentPercent: paymentPercent
      });
    }
    
    setInputs(prev => ({
      ...prev,
      additionalPayments: newPayments
    }));
    setShowInstallments(true);
  };

  return (
    <div className="space-y-3">
      <div className="pb-1">
        <h3 className="text-lg font-semibold text-white">Payment Plan</h3>
        <p className="text-sm text-gray-500">Configure your payment schedule</p>
      </div>

      {/* Post-Handover Toggle - At the top for visibility */}
      <div className="flex items-center justify-between p-2 bg-[#1a1f2e] rounded-lg border border-purple-500/30">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs text-gray-300">Allow Payments Past Handover</span>
          <InfoTooltip translationKey="tooltipAllowPastHandover" />
        </div>
        <Switch 
          checked={inputs.hasPostHandoverPlan ?? false} 
          onCheckedChange={(checked) => setInputs(prev => ({ 
            ...prev, 
            hasPostHandoverPlan: checked 
          }))}
        />
      </div>

      {/* Step 1: Preset Split Buttons */}
      <div className="space-y-2 p-3 bg-[#1a1f2e] rounded-lg border border-[#2a3142]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#CCFF00]/20 flex items-center justify-center text-xs font-bold text-[#CCFF00]">1</div>
          <label className="text-sm text-gray-300 font-medium">Split</label>
          <InfoTooltip translationKey="tooltipPreHandover" />
        </div>
        <div className="flex flex-wrap gap-1.5 ml-7">
          {presetSplits.map((split) => (
            <Button
              key={split}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPaymentSplit(split)}
              className={`h-7 text-xs px-2.5 border-[#2a3142] ${
                inputs.preHandoverPercent === parseInt(split.split('/')[0])
                  ? 'bg-[#CCFF00]/20 border-[#CCFF00]/50 text-[#CCFF00]'
                  : 'text-gray-600 hover:bg-[#2a3142] hover:text-white'
              }`}
            >
              {split}
            </Button>
          ))}
          {!showCustomSplit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCustomSplit(true)}
              className="h-6 text-[10px] px-2 border-dashed border-[#2a3142] text-gray-500 hover:bg-[#2a3142] hover:text-white"
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
                placeholder="35"
                className="w-10 h-6 text-center bg-[#0d1117] border-[#2a3142] text-white font-mono text-[10px]"
                autoFocus
              />
              <span className="text-[9px] text-gray-500">/</span>
              <span className="text-[9px] text-gray-400 w-5">{100 - (parseInt(customPreHandover) || 0)}</span>
              <Button
                type="button"
                size="sm"
                onClick={applyCustomSplit}
                disabled={!customPreHandover || parseInt(customPreHandover) < 10 || parseInt(customPreHandover) > 90}
                className="h-5 px-1.5 bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 text-[9px]"
              >
                OK
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Downpayment - Only show after split is selected */}
      {hasSplitSelected && (
        <div className="space-y-2 p-3 bg-[#1a1f2e] rounded-lg border border-[#CCFF00]/30 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#CCFF00]/20 flex items-center justify-center text-xs font-bold text-[#CCFF00]">2</div>
            <span className="text-sm font-medium text-[#CCFF00]">Down</span>
            <span className="text-xs text-gray-500">(EOI {formatCurrency(inputs.eoiFee, currency)})</span>
            <InfoTooltip translationKey="tooltipDownpayment" />
          </div>
          <div className="flex items-center gap-2 ml-7">
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
                className="w-14 h-7 text-center bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-sm"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
            <span className="text-xs text-gray-500 font-mono">
              {formatCurrency(inputs.basePrice * inputs.downpaymentPercent / 100, currency)}
            </span>
          </div>
        </div>
      )}

      {/* Step 3: Installment Generator - Compact single row */}
      {hasSplitSelected && inputs.downpaymentPercent > 0 && (
        <div className="space-y-3 animate-fade-in">
          {/* Generator - Single row */}
          <div className="p-2 bg-[#1a1f2e] rounded-lg border border-[#CCFF00]/30">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#CCFF00]/20 flex items-center justify-center text-[10px] font-bold text-[#CCFF00] shrink-0">3</div>
              
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={numPayments}
                  onChange={(e) => setNumPayments(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-10 h-7 text-center bg-[#0d1117] border-[#2a3142] text-white font-mono text-xs"
                />
                <span className="text-[10px] text-gray-500">×</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={paymentPercent}
                  onChange={(e) => setPaymentPercent(Math.min(50, Math.max(0.5, parseFloat(e.target.value) || 0.5)))}
                  className="w-12 h-7 text-center bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-xs"
                />
                <span className="text-[10px] text-gray-500">%</span>
              </div>
              
              <span className="text-[10px] text-gray-500">every</span>
              
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={paymentInterval}
                  onChange={(e) => setPaymentInterval(Math.min(24, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-10 h-7 text-center bg-[#0d1117] border-[#2a3142] text-white font-mono text-xs"
                />
                <span className="text-[10px] text-gray-500">mo</span>
              </div>
              
              <span className="text-[10px] text-gray-400">=</span>
              <span className="text-xs text-[#CCFF00] font-mono font-medium">{(numPayments * paymentPercent).toFixed(0)}%</span>
              
              <Button
                type="button"
                onClick={handleGeneratePayments}
                size="sm"
                className="h-7 px-3 bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold text-xs ml-auto"
              >
                <Zap className="w-3 h-3 mr-1" />
                Generate
              </Button>
            </div>
          </div>

          {/* Installments List - Only show if there are payments */}
          {inputs.additionalPayments.length > 0 && (
            <div className="space-y-2 p-3 bg-[#1a1f2e] rounded-lg border border-[#2a3142]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300 font-medium">Installments</label>
                  <span className="text-xs text-gray-500">({inputs.additionalPayments.length})</span>
                  <Button
                    type="button"
                    onClick={addAdditionalPayment}
                    size="sm"
                    className="h-5 px-1.5 bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 text-[9px]"
                  >
                    <Plus className="w-2.5 h-2.5 mr-0.5" /> Add
                  </Button>
                  <Button
                    type="button"
                    onClick={handleResetPayments}
                    size="sm"
                    variant="outline"
                    className="h-5 px-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10 text-[9px]"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-xs px-1.5 py-0.5 rounded ${
                    remainingToDistribute > 0.5 ? 'bg-amber-500/20 text-amber-400' : 
                    remainingToDistribute < -0.5 ? 'bg-red-500/20 text-red-400' : 
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {remainingToDistribute > 0.5 ? `${remainingToDistribute.toFixed(1)}% left` : 
                    remainingToDistribute < -0.5 ? `${Math.abs(remainingToDistribute).toFixed(1)}% over` : 
                    '✓'}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInstallments(!showInstallments)}
                    className="h-5 px-1 text-gray-400"
                  >
                    {showInstallments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {showInstallments && (
                <>
                  <div className="space-y-1 max-h-[50vh] overflow-y-auto pt-1.5 border-t border-[#2a3142]">
                    {inputs.additionalPayments.map((payment, index) => {
                      const paymentDate = payment.type === 'time' 
                        ? getPaymentDate(payment.triggerValue, inputs.bookingMonth, inputs.bookingYear)
                        : null;
                      const isPostHO = payment.type === 'time' && isPaymentPostHandover(
                        payment.triggerValue, 
                        inputs.bookingMonth, 
                        inputs.bookingYear, 
                        inputs.handoverQuarter, 
                        inputs.handoverYear
                      );
                      const isHandoverQuarter = payment.type === 'time' && isPaymentInHandoverQuarter(
                        payment.triggerValue, 
                        inputs.bookingMonth, 
                        inputs.bookingYear, 
                        inputs.handoverQuarter, 
                        inputs.handoverYear
                      );
                      
                      return (
                        <div 
                          key={payment.id} 
                          className={cn(
                            "flex items-center gap-1.5 p-1.5 rounded-lg",
                            isHandoverQuarter ? "bg-green-500/10 border border-green-500/30" :
                            isPostHO ? "bg-purple-500/10 border border-purple-500/30" : 
                            "bg-[#0d1117]"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0",
                            isHandoverQuarter ? "bg-green-500/30 text-green-400" :
                            isPostHO ? "bg-purple-500/30 text-purple-400" :
                            "bg-[#2a3142] text-gray-400"
                          )}>
                            {index + 1}
                          </div>
                          
                          <Select
                            value={payment.type}
                            onValueChange={(value: 'time' | 'construction') => updateAdditionalPayment(payment.id, 'type', value)}
                          >
                            <SelectTrigger className="w-[60px] h-6 text-[10px] bg-[#1a1f2e] border-[#2a3142] px-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1f2e] border-[#2a3142] z-50">
                              <SelectItem value="time" className="text-white hover:bg-[#2a3142] text-xs">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Time</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="construction" className="text-white hover:bg-[#2a3142] text-xs">
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  <span>Build</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="flex items-center gap-1">
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={payment.triggerValue || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                updateAdditionalPayment(payment.id, 'triggerValue', Math.max(0, val));
                              }}
                              className="w-10 h-6 text-center bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-[10px]"
                            />
                            {payment.type === 'construction' && <span className="text-[10px] text-gray-500">%</span>}
                          </div>

                          {/* Show actual date for time-based payments */}
                          {paymentDate && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-400 font-mono">
                                {formatPaymentDate(paymentDate)}
                              </span>
                              {isHandoverQuarter && (
                                <span className="text-[9px] px-1 py-0.5 bg-green-500/20 text-green-400 rounded flex items-center gap-0.5">
                                  <Key className="w-2.5 h-2.5" />
                                </span>
                              )}
                              {isPostHO && !isHandoverQuarter && (
                                <span className="text-[9px] px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                                  PH
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-1 ml-auto">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={payment.paymentPercent || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                updateAdditionalPayment(payment.id, 'paymentPercent', Math.min(100, Math.max(0, val)));
                              }}
                              className="w-12 h-6 text-center bg-[#1a1f2e] border-[#2a3142] text-[#CCFF00] font-mono text-[10px]"
                            />
                            <span className="text-[10px] text-gray-400">%</span>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAdditionalPayment(payment.id)}
                            className="h-5 w-5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 shrink-0"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAdditionalPayment}
                    className="w-full h-7 text-xs border-dashed border-[#2a3142] text-gray-400 hover:bg-[#2a3142] hover:text-white mt-2"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}


      {/* Footer - Total Summary (Static, not sticky) */}
      <div className="mt-4 p-3 bg-[#1a1f2e] rounded-lg border border-[#2a3142]">
        {/* Standard 3-column layout for non-post-handover */}
        {!hasPostHandoverPlan && (
          <div className="flex items-center gap-3">
            {/* Pre-Handover */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] shrink-0" />
              <span className="text-[10px] text-gray-500 uppercase truncate">Pre-HO</span>
              <span className="text-sm font-mono text-white font-semibold ml-auto">
                {preHandoverTotal.toFixed(0)}%
              </span>
            </div>
            
            <div className="h-6 w-px bg-[#2a3142]" />
            
            {/* Handover */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
              <span className="text-[10px] text-gray-500 uppercase truncate">Handover</span>
              <span className="text-sm font-mono text-white font-semibold ml-auto">
                {handoverPercent}%
              </span>
            </div>
            
            <div className="h-6 w-px bg-[#2a3142]" />
            
            {/* Total */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              {isValidTotal ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="text-[10px] text-gray-500 uppercase truncate">Total</span>
              <span className={`text-sm font-mono font-bold ml-auto ${isValidTotal ? 'text-green-400' : 'text-red-400'}`}>
                {totalPayment.toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* 4-column layout for post-handover plan */}
        {hasPostHandoverPlan && (
          <div className="flex items-center gap-2">
            {/* Pre-HO */}
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-[#CCFF00] shrink-0" />
              <span className="text-[10px] text-gray-500 uppercase truncate">Pre</span>
              <span className="text-xs font-mono text-white ml-auto">{preHandoverTotal.toFixed(0)}%</span>
            </div>
            
            <div className="h-5 w-px bg-[#2a3142]" />
            
            {/* On Handover (always 0 in post-handover mode) */}
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              <span className="text-[10px] text-gray-500 uppercase truncate">On-HO</span>
              <span className="text-xs font-mono text-gray-400 ml-auto">0%</span>
            </div>
            
            <div className="h-5 w-px bg-[#2a3142]" />
            
            {/* Post-Handover */}
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              <span className="text-[10px] text-gray-500 uppercase truncate">Post</span>
              <span className="text-xs font-mono text-purple-400 ml-auto">{postHandoverTotal.toFixed(0)}%</span>
            </div>
            
            <div className="h-5 w-px bg-[#2a3142]" />
            
            {/* Total */}
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              {isValidTotal ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              )}
              <span className="text-[10px] text-gray-500 uppercase">Tot</span>
              <span className={`text-xs font-mono font-bold ml-auto ${isValidTotal ? 'text-green-400' : 'text-red-400'}`}>
                {totalPayment.toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
