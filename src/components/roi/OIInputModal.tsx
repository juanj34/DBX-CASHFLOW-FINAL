import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, AlertCircle, CheckCircle2, Plus, Trash2, Clock, Building2 } from "lucide-react";
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

// Preset payment plans
const presets = {
  '20/80': [
    { id: '1', type: 'construction' as const, triggerValue: 0, paymentPercent: 20, label: 'Booking' },
    { id: '2', type: 'construction' as const, triggerValue: 100, paymentPercent: 80, label: 'Handover' },
  ],
  '30/70': [
    { id: '1', type: 'construction' as const, triggerValue: 0, paymentPercent: 30, label: 'Booking' },
    { id: '2', type: 'construction' as const, triggerValue: 100, paymentPercent: 70, label: 'Handover' },
  ],
  '40/60': [
    { id: '1', type: 'construction' as const, triggerValue: 0, paymentPercent: 40, label: 'Booking' },
    { id: '2', type: 'construction' as const, triggerValue: 100, paymentPercent: 60, label: 'Handover' },
  ],
  '50/50': [
    { id: '1', type: 'construction' as const, triggerValue: 0, paymentPercent: 50, label: 'Booking' },
    { id: '2', type: 'construction' as const, triggerValue: 100, paymentPercent: 50, label: 'Handover' },
  ],
  '60/40': [
    { id: '1', type: 'construction' as const, triggerValue: 0, paymentPercent: 60, label: 'Booking' },
    { id: '2', type: 'construction' as const, triggerValue: 100, paymentPercent: 40, label: 'Handover' },
  ],
  '80/20': [
    { id: '1', type: 'construction' as const, triggerValue: 0, paymentPercent: 80, label: 'Booking' },
    { id: '2', type: 'construction' as const, triggerValue: 100, paymentPercent: 20, label: 'Handover' },
  ],
};

export const OIInputModal = ({ inputs, setInputs, open, onOpenChange, currency }: OIInputModalProps) => {
  const [basePriceInput, setBasePriceInput] = useState(
    currency === 'USD' 
      ? Math.round(inputs.basePrice / AED_TO_USD).toString()
      : inputs.basePrice.toString()
  );

  // Calculate total payment percentage
  const totalPayment = inputs.paymentMilestones.reduce((sum, m) => sum + m.paymentPercent, 0);
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

  const handleFixedFeeChange = (field: 'oqoodFee' | 'nocFee', value: string) => {
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num) && num >= 0) {
      const aedValue = currency === 'USD' ? num * AED_TO_USD : num;
      setInputs(prev => ({ ...prev, [field]: aedValue }));
    }
  };

  // Payment milestone handlers
  const applyPreset = (presetKey: keyof typeof presets) => {
    setInputs(prev => ({
      ...prev,
      paymentMilestones: presets[presetKey].map((p, i) => ({ ...p, id: `preset-${i}` }))
    }));
  };

  const addMilestone = () => {
    const newId = `milestone-${Date.now()}`;
    setInputs(prev => ({
      ...prev,
      paymentMilestones: [
        ...prev.paymentMilestones,
        { id: newId, type: 'construction', triggerValue: 0, paymentPercent: 0 }
      ]
    }));
  };

  const removeMilestone = (id: string) => {
    setInputs(prev => ({
      ...prev,
      paymentMilestones: prev.paymentMilestones.filter(m => m.id !== id)
    }));
  };

  const updateMilestone = (id: string, field: keyof PaymentMilestone, value: any) => {
    setInputs(prev => ({
      ...prev,
      paymentMilestones: prev.paymentMilestones.map(m =>
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

          {/* Entry Costs Section (Simplified) */}
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

          {/* Exit Costs Section (Simplified) */}
          <div className="space-y-3 p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
            <label className="text-sm text-gray-400 font-medium">Exit Costs (When Selling)</label>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">NOC Fee</span>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                  {currency === 'USD' ? '$' : 'AED'}
                </span>
                <Input
                  type="text"
                  value={currency === 'USD' ? Math.round(inputs.nocFee / AED_TO_USD) : inputs.nocFee}
                  onChange={(e) => handleFixedFeeChange('nocFee', e.target.value)}
                  className="w-28 h-7 text-right bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-xs pl-10"
                />
              </div>
            </div>
          </div>

          {/* Minimum Exit Threshold */}
          <div className="space-y-2 p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Minimum Exit Threshold</label>
              <Input
                type="number"
                value={inputs.minimumExitThreshold}
                onChange={(e) => handleNumberChange('minimumExitThreshold', e.target.value, 10, 100)}
                className="w-20 h-8 text-right bg-[#1a1f2e] border-[#2a3142] text-[#CCFF00] font-mono text-sm"
              />
            </div>
            <Slider
              value={[inputs.minimumExitThreshold]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, minimumExitThreshold: value }))}
              min={10}
              max={100}
              step={10}
              className="roi-slider-lime"
            />
            <div className="text-xs text-gray-500">
              Developer allows resale at {inputs.minimumExitThreshold}% construction
            </div>
          </div>

          {/* Payment Plan Section */}
          <div className="space-y-3 p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400 font-medium">Payment Plan</label>
              <div className={`flex items-center gap-1.5 text-xs ${isValidTotal ? 'text-green-400' : 'text-amber-400'}`}>
                {isValidTotal ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                Total: {totalPayment}%
              </div>
            </div>
            
            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-2">
              {Object.keys(presets).map((key) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(key as keyof typeof presets)}
                  className="h-7 text-xs border-[#2a3142] text-gray-300 hover:bg-[#2a3142] hover:text-white px-3"
                >
                  {key}
                </Button>
              ))}
            </div>

            {/* Helper text */}
            <div className="text-xs text-gray-500 px-1">
              💡 Time-based: absolute months from booking (e.g., 7 = month 7, not +7)
            </div>

            {/* Dynamic Payment List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {inputs.paymentMilestones.map((milestone, index) => (
                <div key={milestone.id} className="flex items-center gap-2 p-2 bg-[#1a1f2e] rounded-lg">
                  {/* Type Selector */}
                  <Select
                    value={milestone.type}
                    onValueChange={(value: 'time' | 'construction') => updateMilestone(milestone.id, 'type', value)}
                  >
                    <SelectTrigger className="w-[100px] h-7 text-xs bg-[#0d1117] border-[#2a3142]">
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
                    <span className="text-xs text-gray-500" title={milestone.type === 'time' ? 'Months from booking date' : 'Construction %'}>
                      {milestone.type === 'time' ? 'Mo:' : 'At:'}
                    </span>
                    <Input
                      type="number"
                      value={milestone.triggerValue}
                      onChange={(e) => updateMilestone(milestone.id, 'triggerValue', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-14 h-7 text-right bg-[#0d1117] border-[#2a3142] text-white font-mono text-xs"
                      min={0}
                      max={milestone.type === 'construction' ? 100 : 120}
                    />
                    <span className="text-xs text-gray-500">
                      {milestone.type === 'construction' ? '%' : ''}
                    </span>
                  </div>

                  {/* Payment Percent */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Pay:</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={milestone.paymentPercent}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          updateMilestone(milestone.id, 'paymentPercent', Math.min(100, Math.max(0, value)));
                        } else if (e.target.value === '' || e.target.value === '.') {
                          updateMilestone(milestone.id, 'paymentPercent', 0);
                        }
                      }}
                      className="w-16 h-7 text-right bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-xs"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>

                  {/* Delete Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMilestone(milestone.id)}
                    className="h-7 w-7 text-gray-500 hover:text-red-400 hover:bg-red-400/10"
                    disabled={inputs.paymentMilestones.length <= 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add Payment Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMilestone}
              className="w-full h-8 text-xs border-dashed border-[#2a3142] text-gray-400 hover:bg-[#2a3142] hover:text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Payment
            </Button>

            {!isValidTotal && (
              <div className="text-xs text-amber-400">
                ⚠️ Total must equal 100% (currently {totalPayment}%)
              </div>
            )}
          </div>

          {/* Rental Yield Percent */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Rental Yield %</label>
              <Input
                type="number"
                value={inputs.rentalYieldPercent}
                onChange={(e) => handleNumberChange('rentalYieldPercent', e.target.value, 0, 20)}
                className="w-20 h-8 text-right bg-[#0d1117] border-[#2a3142] text-white font-mono text-sm"
                step={0.5}
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
              <label className="text-sm text-gray-400">Appreciation Rate (CAGR) %</label>
              <Input
                type="number"
                value={inputs.appreciationRate}
                onChange={(e) => handleNumberChange('appreciationRate', e.target.value, 0, 30)}
                className="w-20 h-8 text-right bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-sm"
                step={0.5}
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
