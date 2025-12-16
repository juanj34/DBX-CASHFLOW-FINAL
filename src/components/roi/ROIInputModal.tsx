import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Settings2 } from "lucide-react";
import { ROIInputs } from "./useROICalculations";

interface ROIInputModalProps {
  inputs: ROIInputs;
  setInputs: React.Dispatch<React.SetStateAction<ROIInputs>>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatAED = (value: number) => {
  return new Intl.NumberFormat('en-AE', { 
    style: 'currency', 
    currency: 'AED',
    maximumFractionDigits: 0 
  }).format(value);
};

export const ROIInputModal = ({ inputs, setInputs, open, onOpenChange }: ROIInputModalProps) => {
  const handleNumberChange = (field: keyof ROIInputs, value: string, min: number, max: number) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setInputs(prev => ({ ...prev, [field]: Math.min(Math.max(num, min), max) }));
    }
  };

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
              <Input
                type="number"
                value={inputs.basePrice}
                onChange={(e) => handleNumberChange('basePrice', e.target.value, 500000, 10000000)}
                className="w-32 h-8 text-right bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-sm"
              />
            </div>
            <Slider
              value={[inputs.basePrice]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, basePrice: value }))}
              min={500000}
              max={10000000}
              step={50000}
              className="roi-slider-lime"
            />
            <div className="text-xs text-gray-500 text-right">{formatAED(inputs.basePrice)}</div>
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
            <div className="text-xs text-gray-500 text-right">
              Year 1 Rent: {formatAED(inputs.basePrice * (inputs.rentalYieldPercent / 100))}
            </div>
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
              OI deploys {formatAED(inputs.basePrice * (inputs.resaleThresholdPercent / 100))} to resell
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

          {/* OI Holding Period */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">OI Holding Period (months)</label>
              <Input
                type="number"
                value={inputs.holdingPeriodMonths}
                onChange={(e) => handleNumberChange('holdingPeriodMonths', e.target.value, 6, 60)}
                className="w-24 h-8 text-right bg-[#0d1117] border-[#2a3142] text-[#00EAFF] font-mono text-sm"
              />
            </div>
            <Slider
              value={[inputs.holdingPeriodMonths]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, holdingPeriodMonths: value }))}
              min={6}
              max={60}
              step={3}
              className="roi-slider-cyan"
            />
          </div>

          {/* SI Holding Period */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">SI Holding Period (months)</label>
              <Input
                type="number"
                value={inputs.siHoldingMonths}
                onChange={(e) => handleNumberChange('siHoldingMonths', e.target.value, 6, 120)}
                className="w-24 h-8 text-right bg-[#0d1117] border-[#2a3142] text-[#00EAFF] font-mono text-sm"
              />
            </div>
            <Slider
              value={[inputs.siHoldingMonths]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, siHoldingMonths: value }))}
              min={6}
              max={120}
              step={6}
              className="roi-slider-cyan"
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
