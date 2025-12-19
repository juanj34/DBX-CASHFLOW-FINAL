import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings2, AlertCircle, CheckCircle2, Plus, Trash2, Clock, Building2, CreditCard, Home, Target, Zap, Building, DollarSign } from "lucide-react";
import { OIInputs, PaymentMilestone } from "./useOICalculations";
import { Currency, formatCurrency, DEFAULT_RATE } from "./currencyUtils";

interface OIInputModalProps {
  inputs: OIInputs;
  setInputs: React.Dispatch<React.SetStateAction<OIInputs>>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: Currency;
}

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const quarters = [
  { value: 1, label: 'Q1' },
  { value: 2, label: 'Q2' },
  { value: 3, label: 'Q3' },
  { value: 4, label: 'Q4' },
];

const years = Array.from({ length: 12 }, (_, i) => 2024 + i);

// Presets only set the pre-handover/handover split
const presetSplits = ['20/80', '30/70', '40/60', '50/50', '60/40', '80/20'];

// Default values for short-term rental config
const DEFAULT_SHORT_TERM_RENTAL = {
  averageDailyRate: 800,
  occupancyPercent: 70,
  operatingExpensePercent: 25,
  managementFeePercent: 15,
};

export const OIInputModal = ({ inputs, setInputs, open, onOpenChange, currency }: OIInputModalProps) => {
  // Ensure shortTermRental has defaults if missing (for backward compatibility)
  const shortTermRental = inputs.shortTermRental || DEFAULT_SHORT_TERM_RENTAL;
  const rentalMode = inputs.rentalMode || 'long-term';
  
  const [basePriceInput, setBasePriceInput] = useState(
    currency === 'USD' 
      ? Math.round(inputs.basePrice / DEFAULT_RATE).toString()
      : inputs.basePrice.toString()
  );
  
  // Auto-generator state
  const [numPayments, setNumPayments] = useState(4);
  const [paymentInterval, setPaymentInterval] = useState(6);

  // Calculate totals for validation
  const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;
  const handoverPercent = 100 - inputs.preHandoverPercent;
  const remainingToDistribute = inputs.preHandoverPercent - inputs.downpaymentPercent - additionalPaymentsTotal;
  
  const isValidPreHandover = Math.abs(preHandoverTotal - inputs.preHandoverPercent) < 0.01;
  const totalPayment = preHandoverTotal + handoverPercent;
  const isValidTotal = Math.abs(totalPayment - 100) < 0.01;

  const handleNumberChange = (field: keyof OIInputs, value: string, min: number, max: number) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setInputs(prev => ({ ...prev, [field]: Math.min(Math.max(num, min), max) }));
    }
  };

  const handleBasePriceChange = (value: string) => {
    setBasePriceInput(value);
  };

  const handleBasePriceBlur = () => {
    const num = parseFloat(basePriceInput.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num) && num > 0) {
      const aedValue = currency === 'USD' ? num * DEFAULT_RATE : num;
      const clamped = Math.min(Math.max(aedValue, 500000), 50000000);
      setInputs(prev => ({ ...prev, basePrice: clamped }));
      setBasePriceInput(
        currency === 'USD' 
          ? Math.round(clamped / DEFAULT_RATE).toString()
          : clamped.toString()
      );
    } else {
      setBasePriceInput(
        currency === 'USD' 
          ? Math.round(inputs.basePrice / DEFAULT_RATE).toString()
          : inputs.basePrice.toString()
      );
    }
  };

  const handleFixedFeeChange = (field: 'oqoodFee' | 'eoiFee', value: string) => {
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num) && num >= 0) {
      const aedValue = currency === 'USD' ? num * DEFAULT_RATE : num;
      setInputs(prev => ({ ...prev, [field]: aedValue }));
    }
  };

  // Apply preset split (only changes preHandoverPercent, clears additional payments)
  const applyPreset = (split: string) => {
    const [preHandover] = split.split('/').map(Number);
    setInputs(prev => ({
      ...prev,
      preHandoverPercent: preHandover,
      additionalPayments: [] // Clear additional payments when changing preset
    }));
  };

  // Auto-generate payment plan
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
    
    setInputs(prev => ({
      ...prev,
      additionalPayments: newPayments
    }));
  };

  // Additional payments handlers
  const addAdditionalPayment = () => {
    const newId = `additional-${Date.now()}`;
    // Inherit paymentPercent from last payment, or default to 2.5% if none exist
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Configure
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">OI Investment Parameters</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Base Property Price */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Base Property Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  {currency === 'USD' ? '$' : 'AED'}
                </span>
                <Input
                  type="text"
                  value={basePriceInput}
                  onChange={(e) => handleBasePriceChange(e.target.value)}
                  onBlur={handleBasePriceBlur}
                  className="w-36 h-8 text-right bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-sm pl-12"
                />
              </div>
            </div>
            <Slider
              value={[inputs.basePrice]}
              onValueChange={([value]) => {
                setInputs(prev => ({ ...prev, basePrice: value }));
                setBasePriceInput(
                  currency === 'USD' 
                    ? Math.round(value / DEFAULT_RATE).toString()
                    : value.toString()
                );
              }}
              min={500000}
              max={50000000}
              step={50000}
              className="roi-slider-lime"
            />
            <div className="text-xs text-gray-500 text-right">{formatCurrency(inputs.basePrice, currency)}</div>
          </div>

          {/* Booking Date - Month/Year */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Booking Date (OI Entry)</label>
            <div className="flex gap-3">
              <Select
                value={String(inputs.bookingMonth)}
                onValueChange={(value) => setInputs(prev => ({ ...prev, bookingMonth: parseInt(value) }))}
              >
                <SelectTrigger className="flex-1 bg-[#0d1117] border-[#2a3142] text-white">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                  {months.map(m => (
                    <SelectItem key={m.value} value={String(m.value)} className="text-white hover:bg-[#2a3142]">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(inputs.bookingYear)}
                onValueChange={(value) => setInputs(prev => ({ ...prev, bookingYear: parseInt(value) }))}
              >
                <SelectTrigger className="flex-1 bg-[#0d1117] border-[#2a3142] text-white">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)} className="text-white hover:bg-[#2a3142]">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Handover Date - Quarter/Year */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Handover Date</label>
            <div className="flex gap-3">
              <Select
                value={String(inputs.handoverQuarter)}
                onValueChange={(value) => setInputs(prev => ({ ...prev, handoverQuarter: parseInt(value) }))}
              >
                <SelectTrigger className="flex-1 bg-[#0d1117] border-[#2a3142] text-white">
                  <SelectValue placeholder="Quarter" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                  {quarters.map(q => (
                    <SelectItem key={q.value} value={String(q.value)} className="text-white hover:bg-[#2a3142]">
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(inputs.handoverYear)}
                onValueChange={(value) => setInputs(prev => ({ ...prev, handoverYear: parseInt(value) }))}
              >
                <SelectTrigger className="flex-1 bg-[#0d1117] border-[#2a3142] text-white">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)} className="text-white hover:bg-[#2a3142]">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Entry Costs Section - Simplified */}
          <div className="space-y-3 p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
            <label className="text-sm text-gray-400 font-medium">Entry Costs (At Booking)</label>
            
            <div className="space-y-3">
              {/* EOI Fee */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">EOI / Booking Fee</span>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                    {currency === 'USD' ? '$' : 'AED'}
                  </span>
                  <Input
                    type="text"
                    value={currency === 'USD' ? Math.round(inputs.eoiFee / DEFAULT_RATE) : inputs.eoiFee}
                    onChange={(e) => handleFixedFeeChange('eoiFee', e.target.value)}
                    className="w-28 h-7 text-right bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-xs pl-10"
                  />
                </div>
              </div>

              {/* DLD Fee - Fixed at 4% */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">DLD Fee (fixed)</span>
                <span className="text-xs text-white font-mono">4% = {formatCurrency(inputs.basePrice * 0.04, currency)}</span>
              </div>
              
              {/* Oqood Fee */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Oqood Fee</span>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                    {currency === 'USD' ? '$' : 'AED'}
                  </span>
                  <Input
                    type="text"
                    value={currency === 'USD' ? Math.round(inputs.oqoodFee / DEFAULT_RATE) : inputs.oqoodFee}
                    onChange={(e) => handleFixedFeeChange('oqoodFee', e.target.value)}
                    className="w-28 h-7 text-right bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-xs pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PAYMENT PLAN SECTION - NEW STRUCTURE */}
          <div className="space-y-4 p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Plan
              </label>
            </div>
            
            {/* Preset Split Buttons */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Pre-Handover / Handover Split</label>
              <div className="flex flex-wrap gap-2">
                {presetSplits.map((split) => (
                  <Button
                    key={split}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(split)}
                    className={`h-7 text-xs border-[#2a3142] px-3 ${
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

            {/* DOWNPAYMENT - Fixed first payment */}
            <div className="space-y-2 p-3 bg-[#1a1f2e] rounded-lg border border-[#CCFF00]/30">
              <div className="flex items-center gap-2 text-[#CCFF00]">
                <div className="w-6 h-6 rounded-full bg-[#CCFF00]/20 flex items-center justify-center text-xs font-bold">1</div>
                <span className="text-sm font-medium">DOWNPAYMENT (Booking - Month 0)</span>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                💡 EOI ({formatCurrency(inputs.eoiFee, currency)}) is part of this
              </div>
              <div className="flex items-center justify-between gap-4">
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
                    className="w-16 h-7 text-center bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-sm"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
              {formatCurrency(inputs.basePrice * inputs.downpaymentPercent / 100, currency)}
            </div>
            </div>

            {/* AUTO-GENERATE PAYMENT PLAN */}
            <div className="space-y-3 p-3 bg-gradient-to-r from-[#CCFF00]/10 to-transparent rounded-lg border border-[#CCFF00]/30">
              <div className="flex items-center gap-2 text-[#CCFF00]">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Auto-Generate Payments</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Number of Payments</label>
                  <Input
                    type="number"
                    value={numPayments}
                    onChange={(e) => setNumPayments(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                    className="h-8 bg-[#0d1117] border-[#2a3142] text-white font-mono text-sm"
                    min={1}
                    max={12}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Interval (months)</label>
                  <Input
                    type="number"
                    value={paymentInterval}
                    onChange={(e) => setPaymentInterval(Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))}
                    className="h-8 bg-[#0d1117] border-[#2a3142] text-white font-mono text-sm"
                    min={1}
                    max={24}
                  />
                </div>
              </div>
              
              <div className="text-xs text-gray-400">
                Preview: <span className="text-white font-mono">{numPayments} payments × {calculateAutoPercentage().toFixed(1)}%</span> each = <span className={`font-mono ${Math.abs(numPayments * calculateAutoPercentage() - remainingToDistribute - additionalPaymentsTotal) < 0.1 ? 'text-green-400' : 'text-amber-400'}`}>{(numPayments * calculateAutoPercentage()).toFixed(1)}%</span>
              </div>
              
              <Button
                type="button"
                onClick={handleGeneratePayments}
                className="w-full h-8 bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold text-sm"
              >
                <Zap className="w-3.5 h-3.5 mr-1" />
                Generate Payments
              </Button>
            </div>

            {/* ADDITIONAL PAYMENTS */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-500">Additional Payments (Pre-Handover)</label>
                <div className={`text-xs ${remainingToDistribute > 0 ? 'text-amber-400' : remainingToDistribute < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {remainingToDistribute > 0 ? `${remainingToDistribute.toFixed(1)}% remaining` : 
                   remainingToDistribute < 0 ? `${Math.abs(remainingToDistribute).toFixed(1)}% exceeded` : 
                   '✓ Distributed'}
                </div>
              </div>
              
              <div className="text-xs text-gray-500 px-1 mb-2">
                💡 Time = absolute months from booking (e.g., 7 = month 7)
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {inputs.additionalPayments.map((payment, index) => (
                  <div key={payment.id} className="flex items-center gap-2 p-2 bg-[#1a1f2e] rounded-lg">
                    <div className="w-5 h-5 rounded-full bg-[#2a3142] flex items-center justify-center text-xs text-gray-400">
                      {index + 2}
                    </div>
                    
                    {/* Type Selector */}
                    <Select
                      value={payment.type}
                      onValueChange={(value: 'time' | 'construction') => updateAdditionalPayment(payment.id, 'type', value)}
                    >
                      <SelectTrigger className="w-[90px] h-7 text-xs bg-[#0d1117] border-[#2a3142]">
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

                    {/* Trigger Value */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 w-6">
                        {payment.type === 'time' ? 'Mo:' : 'At:'}
                      </span>
                      <Input
                        type="number"
                        value={payment.triggerValue}
                        onChange={(e) => updateAdditionalPayment(payment.id, 'triggerValue', Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-14 h-7 text-center bg-[#0d1117] border-[#2a3142] text-white font-mono text-xs"
                      />
                      {payment.type === 'construction' && <span className="text-xs text-gray-500">%</span>}
                    </div>

                    {/* Payment Percent */}
                    <div className="flex items-center gap-1">
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
                        className="w-14 h-7 text-center bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-xs"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>

                    {/* Remove Button */}
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

            {/* HANDOVER - Automatic */}
            <div className="space-y-2 p-3 bg-[#1a1f2e] rounded-lg border border-[#2a3142]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <Home className="w-4 h-4" />
                  <span className="text-sm">HANDOVER (100% Construction)</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">
                  {handoverPercent}%
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Automatic: {formatCurrency(inputs.basePrice * handoverPercent / 100, currency)}
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-[#2a3142] pt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Pre-Handover:</span>
                <span className={`font-mono ${isValidPreHandover ? 'text-green-400' : 'text-amber-400'}`}>
                  {preHandoverTotal.toFixed(1)}% / {inputs.preHandoverPercent}%
                  {isValidPreHandover && ' ✓'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Handover:</span>
                <span className="text-white font-mono">{handoverPercent}% (auto)</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#2a3142]">
                <span className="text-sm text-gray-300">TOTAL:</span>
                <div className={`flex items-center gap-1.5 ${isValidTotal ? 'text-green-400' : 'text-red-400'}`}>
                  {isValidTotal ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="font-mono font-bold">{totalPayment.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* MINIMUM EXIT THRESHOLD - Moved to bottom */}
          <div className="space-y-3 p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-[#CCFF00]" />
                Minimum Exit Threshold
              </label>
              <span className="text-lg font-bold text-[#CCFF00] font-mono">{inputs.minimumExitThreshold || 30}%</span>
            </div>
            <p className="text-xs text-gray-500">
              % of price developer requires paid before allowing resale
            </p>
            <Slider
              value={[inputs.minimumExitThreshold || 30]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, minimumExitThreshold: value }))}
              min={10}
              max={100}
              step={5}
              className="roi-slider-lime"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10%</span>
              <span>100%</span>
            </div>
          </div>

          {/* RENTAL STRATEGY SECTION - Long-term always visible + optional Airbnb comparison */}
          <div className="space-y-4 p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                <Building className="w-4 h-4 text-[#CCFF00]" />
                Rental Strategy
              </label>
            </div>
            
            {/* Long-term rental yield - ALWAYS VISIBLE */}
            <div className="space-y-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Building className="w-4 h-4" />
                <span className="text-sm font-medium">Long-Term Rental</span>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-400">Rental Yield %</label>
                <Input
                  type="number"
                  step="0.1"
                  value={inputs.rentalYieldPercent}
                  onChange={(e) => handleNumberChange('rentalYieldPercent', e.target.value, 0, 20)}
                  className="w-20 h-8 text-right bg-[#0d1117] border-[#2a3142] text-white font-mono text-sm"
                />
              </div>
              <Slider
                value={[inputs.rentalYieldPercent]}
                onValueChange={([value]) => setInputs(prev => ({ ...prev, rentalYieldPercent: value }))}
                min={0}
                max={20}
                step={0.5}
                className="roi-slider-lime"
              />
              <div className="text-xs text-gray-500">
                Est. Annual Rent: {formatCurrency(inputs.basePrice * inputs.rentalYieldPercent / 100, currency)}
              </div>
            </div>

            {/* Airbnb Comparison Toggle */}
            <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-400">Compare with Airbnb</span>
              </div>
              <Switch
                checked={inputs.showAirbnbComparison || false}
                onCheckedChange={(checked) => setInputs(prev => ({ 
                  ...prev, 
                  showAirbnbComparison: checked,
                  shortTermRental: prev.shortTermRental || DEFAULT_SHORT_TERM_RENTAL 
                }))}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
            
            {/* Airbnb Configuration - Only when comparison enabled */}
            {inputs.showAirbnbComparison && (
              <div className="space-y-3 p-3 bg-purple-500/5 rounded-lg border border-purple-500/20">
                {/* ADR */}
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-400">Average Daily Rate (ADR)</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                      {currency === 'USD' ? '$' : 'AED'}
                    </span>
                    <Input
                      type="number"
                      value={currency === 'USD' ? Math.round(shortTermRental.averageDailyRate / DEFAULT_RATE) : shortTermRental.averageDailyRate}
                      onChange={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) {
                          const aedValue = currency === 'USD' ? num * DEFAULT_RATE : num;
                          setInputs(prev => ({ 
                            ...prev, 
                            shortTermRental: { ...(prev.shortTermRental || DEFAULT_SHORT_TERM_RENTAL), averageDailyRate: aedValue } 
                          }));
                        }
                      }}
                      className="w-28 h-7 text-right bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-xs pl-10"
                    />
                  </div>
                </div>
                
                {/* Occupancy */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-400">Occupancy Rate</label>
                    <span className="text-xs text-purple-400 font-mono">{shortTermRental.occupancyPercent}%</span>
                  </div>
                  <Slider
                    value={[shortTermRental.occupancyPercent]}
                    onValueChange={([value]) => setInputs(prev => ({ 
                      ...prev, 
                      shortTermRental: { ...(prev.shortTermRental || DEFAULT_SHORT_TERM_RENTAL), occupancyPercent: value } 
                    }))}
                    min={30}
                    max={95}
                    step={5}
                    className="roi-slider-lime"
                  />
                </div>
                
                {/* Operating Expenses */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-400">Operating Expenses</label>
                    <span className="text-xs text-red-400 font-mono">{shortTermRental.operatingExpensePercent}%</span>
                  </div>
                  <Slider
                    value={[shortTermRental.operatingExpensePercent]}
                    onValueChange={([value]) => setInputs(prev => ({ 
                      ...prev, 
                      shortTermRental: { ...(prev.shortTermRental || DEFAULT_SHORT_TERM_RENTAL), operatingExpensePercent: value } 
                    }))}
                    min={10}
                    max={50}
                    step={5}
                    className="roi-slider-lime"
                  />
                  <div className="text-xs text-gray-500">Utilities, cleaning, supplies, etc.</div>
                </div>
                
                {/* Management Fee */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-400">Management Fee</label>
                    <span className="text-xs text-amber-400 font-mono">{shortTermRental.managementFeePercent}%</span>
                  </div>
                  <Slider
                    value={[shortTermRental.managementFeePercent]}
                    onValueChange={([value]) => setInputs(prev => ({ 
                      ...prev, 
                      shortTermRental: { ...(prev.shortTermRental || DEFAULT_SHORT_TERM_RENTAL), managementFeePercent: value } 
                    }))}
                    min={0}
                    max={30}
                    step={5}
                    className="roi-slider-lime"
                  />
                  <div className="text-xs text-gray-500">Property management / Airbnb host fee</div>
                </div>
                
                {/* Projected Income Summary */}
                <div className="p-3 bg-[#1a1f2e] rounded-lg border border-purple-500/30 space-y-2">
                  <div className="text-xs text-gray-400 font-medium">Projected Annual Income</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Gross Income</span>
                    <span className="text-white font-mono">
                      {formatCurrency(
                        shortTermRental.averageDailyRate * 365 * (shortTermRental.occupancyPercent / 100), 
                        currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">- Expenses ({shortTermRental.operatingExpensePercent + shortTermRental.managementFeePercent}%)</span>
                    <span className="text-red-400 font-mono">
                      -{formatCurrency(
                        shortTermRental.averageDailyRate * 365 * (shortTermRental.occupancyPercent / 100) * 
                        ((shortTermRental.operatingExpensePercent + shortTermRental.managementFeePercent) / 100), 
                        currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-[#2a3142]">
                    <span className="text-purple-400 font-medium">Net Income</span>
                    <span className="text-[#CCFF00] font-mono font-bold">
                      {formatCurrency(
                        shortTermRental.averageDailyRate * 365 * (shortTermRental.occupancyPercent / 100) * 
                        (1 - (shortTermRental.operatingExpensePercent + shortTermRental.managementFeePercent) / 100), 
                        currency
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Appreciation Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Appreciation Rate (CAGR %)</label>
              <Input
                type="number"
                step="0.5"
                value={inputs.appreciationRate}
                onChange={(e) => handleNumberChange('appreciationRate', e.target.value, 0, 30)}
                className="w-20 h-8 text-right bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-sm"
              />
            </div>
            <Slider
              value={[inputs.appreciationRate]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, appreciationRate: value }))}
              min={0}
              max={30}
              step={0.5}
              className="roi-slider-lime"
            />
          </div>

          {/* Apply Button */}
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold"
          >
            Apply Parameters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
