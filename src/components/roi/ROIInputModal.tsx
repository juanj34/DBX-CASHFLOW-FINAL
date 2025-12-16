import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2 } from "lucide-react";
import { ROIInputs } from "./useROICalculations";
import { Currency, formatCurrency, DEFAULT_RATE } from "./currencyUtils";

interface ROIInputModalProps {
  inputs: ROIInputs;
  setInputs: React.Dispatch<React.SetStateAction<ROIInputs>>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: Currency;
}

const months = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
];

const years = Array.from({ length: 12 }, (_, i) => 2024 + i);

export const ROIInputModal = ({ inputs, setInputs, open, onOpenChange, currency }: ROIInputModalProps) => {
  // Local state for the base price input to allow free typing
  const [basePriceInput, setBasePriceInput] = useState(
    currency === 'USD' 
      ? Math.round(inputs.basePrice / DEFAULT_RATE).toString()
      : inputs.basePrice.toString()
  );

  const handleNumberChange = (field: keyof ROIInputs, value: string, min: number, max: number) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setInputs(prev => ({ ...prev, [field]: Math.min(Math.max(num, min), max) }));
    }
  };

  const handleBasePriceChange = (value: string) => {
    // Allow free typing - just update local state
    setBasePriceInput(value);
  };

  const handleBasePriceBlur = () => {
    // On blur, clamp the value and update
    const num = parseFloat(basePriceInput.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num) && num > 0) {
      // Convert to AED if needed
      const aedValue = currency === 'USD' ? num * DEFAULT_RATE : num;
      const clamped = Math.min(Math.max(aedValue, 500000), 10000000);
      setInputs(prev => ({ ...prev, basePrice: clamped }));
      // Update display value
      setBasePriceInput(
        currency === 'USD' 
          ? Math.round(clamped / DEFAULT_RATE).toString()
          : clamped.toString()
      );
    } else {
      // Reset to current valid value
      setBasePriceInput(
        currency === 'USD' 
          ? Math.round(inputs.basePrice / DEFAULT_RATE).toString()
          : inputs.basePrice.toString()
      );
    }
  };

  // Update local state when currency changes
  const displayBasePrice = currency === 'USD' 
    ? Math.round(inputs.basePrice / DEFAULT_RATE)
    : inputs.basePrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Configure Investment
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Investment Parameters</DialogTitle>
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
              max={10000000}
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

          {/* Handover Date */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Handover Date (HO Entry)</label>
            <div className="flex gap-3">
              <Select
                value={String(inputs.handoverMonth)}
                onValueChange={(value) => setInputs(prev => ({ ...prev, handoverMonth: parseInt(value) }))}
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

          {/* OI Holding Period */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">OI Holding Period (months)</label>
              <Input
                type="number"
                value={inputs.oiHoldingMonths}
                onChange={(e) => handleNumberChange('oiHoldingMonths', e.target.value, 6, 120)}
                className="w-24 h-8 text-right bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-sm"
              />
            </div>
            <Slider
              value={[inputs.oiHoldingMonths]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, oiHoldingMonths: value }))}
              min={6}
              max={120}
              step={3}
              className="roi-slider-lime"
            />
            <div className="text-xs text-gray-500 text-right">OI sells to SI after {inputs.oiHoldingMonths} months</div>
          </div>

          {/* Rental Yield Percent */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Rental Yield %</label>
              <Input
                type="number"
                value={inputs.rentalYieldPercent}
                onChange={(e) => handleNumberChange('rentalYieldPercent', e.target.value, 1, 20)}
                step={0.5}
                className="w-24 h-8 text-right bg-[#0d1117] border-[#2a3142] text-[#00EAFF] font-mono text-sm"
              />
            </div>
            <Slider
              value={[inputs.rentalYieldPercent]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, rentalYieldPercent: value }))}
              min={1}
              max={20}
              step={0.5}
              className="roi-slider-cyan"
            />
          </div>

          {/* Resale Threshold / OI Equity */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Resale Threshold % (OI Equity)</label>
              <Input
                type="number"
                value={inputs.resaleThresholdPercent}
                onChange={(e) => handleNumberChange('resaleThresholdPercent', e.target.value, 10, 100)}
                className="w-24 h-8 text-right bg-[#0d1117] border-[#2a3142] text-[#FF00FF] font-mono text-sm"
              />
            </div>
            <Slider
              value={[inputs.resaleThresholdPercent]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, resaleThresholdPercent: value }))}
              min={10}
              max={100}
              step={5}
              className="roi-slider-pink"
            />
            <div className="text-xs text-gray-500 text-right">
              OI deploys {formatCurrency(inputs.basePrice * (inputs.resaleThresholdPercent / 100), currency)} to resell
            </div>
          </div>

          {/* Appreciation Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Appreciation Rate (CAGR) %</label>
              <Input
                type="number"
                value={inputs.appreciationRate}
                onChange={(e) => handleNumberChange('appreciationRate', e.target.value, 1, 25)}
                step={0.5}
                className="w-24 h-8 text-right bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-sm"
              />
            </div>
            <Slider
              value={[inputs.appreciationRate]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, appreciationRate: value }))}
              min={1}
              max={25}
              step={0.5}
              className="roi-slider-lime"
            />
          </div>
        </div>

        <Button 
          onClick={() => onOpenChange(false)}
          className="w-full bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold"
        >
          Apply Parameters
        </Button>
      </DialogContent>
    </Dialog>
  );
};
