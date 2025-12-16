import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
      <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Investment Parameters</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Base Property Price */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Base Property Price</label>
              <span className="text-[#CCFF00] font-mono font-semibold">{formatAED(inputs.basePrice)}</span>
            </div>
            <Slider
              value={[inputs.basePrice]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, basePrice: value }))}
              min={500000}
              max={10000000}
              step={50000}
              className="roi-slider-lime"
            />
          </div>

          {/* Annual Rent */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Annual Rent</label>
              <span className="text-[#00EAFF] font-mono font-semibold">{formatAED(inputs.annualRent)}</span>
            </div>
            <Slider
              value={[inputs.annualRent]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, annualRent: value }))}
              min={20000}
              max={500000}
              step={5000}
              className="roi-slider-cyan"
            />
          </div>

          {/* Equity Percent */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Payment Plan / Equity</label>
              <span className="text-[#FF00FF] font-mono font-semibold">{inputs.equityPercent}%</span>
            </div>
            <Slider
              value={[inputs.equityPercent]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, equityPercent: value }))}
              min={10}
              max={100}
              step={5}
              className="roi-slider-pink"
            />
          </div>

          {/* Appreciation Rate */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Appreciation Rate (CAGR)</label>
              <span className="text-[#CCFF00] font-mono font-semibold">{inputs.appreciationRate}%</span>
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

          {/* Holding Period */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Holding Period</label>
              <span className="text-[#00EAFF] font-mono font-semibold">{inputs.holdingPeriodMonths} months</span>
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
