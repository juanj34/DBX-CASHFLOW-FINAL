import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, AlertCircle, CheckCircle2, Plus, Trash2, Clock, Building2, CreditCard, Home } from "lucide-react";
import { OIInputs, PaymentMilestone } from "./useOICalculations";
import { Currency, formatCurrency, AED_TO_USD } from "./currencyUtils";

interface OIInputModalProps {
  inputs: OIInputs;
  setInputs: React.Dispatch<React.SetStateAction<OIInputs>>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: Currency;
}

const quarters = [
  { value: 1, label: 'Q1 (Jan-Mar)' },
  { value: 2, label: 'Q2 (Apr-Jun)' },
  { value: 3, label: 'Q3 (Jul-Sep)' },
  { value: 4, label: 'Q4 (Oct-Dec)' },
];

const years = Array.from({ length: 12 }, (_, i) => 2024 + i);

// Presets only set the pre-handover/handover split
const presetSplits = ['20/80', '30/70', '40/60', '50/50', '60/40', '80/20'];

export const OIInputModal = ({ inputs, setInputs, open, onOpenChange, currency }: OIInputModalProps) => {
  const [basePriceInput, setBasePriceInput] = useState(
    currency === 'USD' 
      ? Math.round(inputs.basePrice / AED_TO_USD).toString()
      : inputs.basePrice.toString()
  );

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
      const aedValue = currency === 'USD' ? num * AED_TO_USD : num;
      const clamped = Math.min(Math.max(aedValue, 500000), 50000000);
      setInputs(prev => ({ ...prev, basePrice: clamped }));
      setBasePriceInput(
        currency === 'USD' 
          ? Math.round(clamped / AED_TO_USD).toString()
          : clamped.toString()
      );
    } else {
      setBasePriceInput(
        currency === 'USD' 
          ? Math.round(inputs.basePrice / AED_TO_USD).toString()
          : inputs.basePrice.toString()
      );
    }
  };

  const handleFixedFeeChange = (field: 'oqoodFee', value: string) => {
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num) && num >= 0) {
      const aedValue = currency === 'USD' ? num * AED_TO_USD : num;
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

  // Additional payments handlers
  const addAdditionalPayment = () => {
    const newId = `additional-${Date.now()}`;
    setInputs(prev => ({
      ...prev,
      additionalPayments: [
        ...prev.additionalPayments,
        { id: newId, type: 'time', triggerValue: 6, paymentPercent: 0 }
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
                    ? Math.round(value / AED_TO_USD).toString()
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

          {/* Booking Date */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Booking Date (OI Entry)</label>
            <div className="flex gap-3">
              <Select
                value={String(inputs.bookingQuarter)}
                onValueChange={(value) => setInputs(prev => ({ ...prev, bookingQuarter: parseInt(value) }))}
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

          {/* Handover Date */}
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

          {/* Entry Costs Section */}
          <div className="space-y-3 p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
            <label className="text-sm text-gray-400 font-medium">Entry Costs (At Booking)</label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">DLD Fee %</span>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[inputs.dldFeePercent]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, dldFeePercent: value }))}
                    min={0}
                    max={10}
                    step={0.5}
                    className="w-24 roi-slider-lime"
                  />
                  <span className="text-xs text-white font-mono w-12 text-right">{inputs.dldFeePercent}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Oqood Fee</span>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                    {currency === 'USD' ? '$' : 'AED'}
                  </span>
                  <Input
                    type="text"
                    value={currency === 'USD' ? Math.round(inputs.oqoodFee / AED_TO_USD) : inputs.oqoodFee}
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

          {/* Rental Yield */}
          <div className="space-y-2">
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
