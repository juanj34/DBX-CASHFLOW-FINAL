import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, AlertCircle, CheckCircle2 } from "lucide-react";
import { OIInputs, PaymentMilestone } from "./useOICalculations";
import { Currency, formatCurrency, AED_TO_USD } from "./currencyUtils";

interface OIInputModalProps {
  inputs: OIInputs;
  setInputs: React.Dispatch<React.SetStateAction<OIInputs>>;
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

const milestoneLabels: Record<number, string> = {
  0: 'At Booking (0%)',
  10: 'At 10% Construction',
  20: 'At 20% Construction',
  30: 'At 30% Construction',
  40: 'At 40% Construction',
  50: 'At 50% Construction',
  60: 'At 60% Construction',
  70: 'At 70% Construction',
  80: 'At 80% Construction',
  90: 'At 90% Construction',
  100: 'On Handover (100%)',
};

export const OIInputModal = ({ inputs, setInputs, open, onOpenChange, currency }: OIInputModalProps) => {
  const [basePriceInput, setBasePriceInput] = useState(
    currency === 'USD' 
      ? Math.round(inputs.basePrice / AED_TO_USD).toString()
      : inputs.basePrice.toString()
  );

  // Calculate total payment percentage
  const totalPayment = inputs.paymentMilestones.reduce((sum, m) => sum + m.paymentPercent, 0);
  const isValidTotal = totalPayment === 100;

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

  const handleMilestoneChange = (constructionPercent: number, value: string) => {
    const num = parseInt(value) || 0;
    const clamped = Math.min(Math.max(num, 0), 100);
    
    setInputs(prev => ({
      ...prev,
      paymentMilestones: prev.paymentMilestones.map(m =>
        m.constructionPercent === constructionPercent
          ? { ...m, paymentPercent: clamped }
          : m
      )
    }));
  };

  const handleFixedFeeChange = (field: 'adminFee' | 'nocFee', value: string) => {
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num) && num >= 0) {
      const aedValue = currency === 'USD' ? num * AED_TO_USD : num;
      setInputs(prev => ({ ...prev, [field]: aedValue }));
    }
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
            <label className="text-sm text-gray-400">Handover Date</label>
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
                <span className="text-xs text-gray-500">Oqood Fee %</span>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[inputs.oqoodFeePercent]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, oqoodFeePercent: value }))}
                    min={0}
                    max={10}
                    step={0.5}
                    className="w-24 roi-slider-lime"
                  />
                  <span className="text-xs text-white font-mono w-12 text-right">{inputs.oqoodFeePercent}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Admin Fee</span>
                <Input
                  type="text"
                  value={currency === 'USD' ? Math.round(inputs.adminFee / AED_TO_USD) : inputs.adminFee}
                  onChange={(e) => handleFixedFeeChange('adminFee', e.target.value)}
                  className="w-24 h-7 text-right bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-xs"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Buyer Agent %</span>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[inputs.buyerAgentPercent]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, buyerAgentPercent: value }))}
                    min={0}
                    max={5}
                    step={0.5}
                    className="w-24 roi-slider-lime"
                  />
                  <span className="text-xs text-white font-mono w-12 text-right">{inputs.buyerAgentPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Exit Costs Section */}
          <div className="space-y-3 p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
            <label className="text-sm text-gray-400 font-medium">Exit Costs (When Selling)</label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">NOC Fee</span>
                <Input
                  type="text"
                  value={currency === 'USD' ? Math.round(inputs.nocFee / AED_TO_USD) : inputs.nocFee}
                  onChange={(e) => handleFixedFeeChange('nocFee', e.target.value)}
                  className="w-24 h-7 text-right bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-xs"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Transfer Fee %</span>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[inputs.transferFeePercent]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, transferFeePercent: value }))}
                    min={0}
                    max={5}
                    step={0.5}
                    className="w-24 roi-slider-lime"
                  />
                  <span className="text-xs text-white font-mono w-12 text-right">{inputs.transferFeePercent}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Seller Agent %</span>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[inputs.sellerAgentPercent]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, sellerAgentPercent: value }))}
                    min={0}
                    max={5}
                    step={0.5}
                    className="w-24 roi-slider-lime"
                  />
                  <span className="text-xs text-white font-mono w-12 text-right">{inputs.sellerAgentPercent}%</span>
                </div>
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

          {/* Payment Milestones */}
          <div className="space-y-3 p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400 font-medium">Payment Milestones</label>
              <div className={`flex items-center gap-1.5 text-xs ${isValidTotal ? 'text-green-400' : 'text-amber-400'}`}>
                {isValidTotal ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                Total: {totalPayment}%
              </div>
            </div>
            
            <div className="space-y-2">
              {inputs.paymentMilestones.map((milestone) => (
                <div key={milestone.constructionPercent} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-500 flex-1">
                    {milestoneLabels[milestone.constructionPercent]}
                  </span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={milestone.paymentPercent}
                      onChange={(e) => handleMilestoneChange(milestone.constructionPercent, e.target.value)}
                      className="w-16 h-7 text-right bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-xs"
                      min={0}
                      max={100}
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                </div>
              ))}
            </div>
            
            {!isValidTotal && (
              <div className="text-xs text-amber-400 mt-2">
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
                onChange={(e) => handleNumberChange('rentalYieldPercent', e.target.value, 1, 20)}
                step={0.5}
                className="w-24 h-8 text-right bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-sm"
              />
            </div>
            <Slider
              value={[inputs.rentalYieldPercent]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, rentalYieldPercent: value }))}
              min={1}
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
