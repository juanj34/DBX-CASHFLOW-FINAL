import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings2, AlertCircle, CheckCircle2, Plus, Trash2, Clock, Building2, CreditCard, Home, Target, Zap, Building, DollarSign, TrendingUp, MapPin, Save, FolderOpen } from "lucide-react";
import { OIInputs, PaymentMilestone, getZoneAppreciationProfile } from "./useOICalculations";
import { Currency, formatCurrency, DEFAULT_RATE } from "./currencyUtils";
import { ZoneAppreciationIndicator } from "./ZoneAppreciationIndicator";
import { InfoTooltip } from "./InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAppreciationPresets } from "@/hooks/useAppreciationPresets";
import { useLanguage } from "@/contexts/LanguageContext";
import { ZoneSelect } from "@/components/ui/zone-select";
import { ValueDifferentiatorsSection } from "./ValueDifferentiatorsSection";

interface OIInputModalProps {
  inputs: OIInputs;
  setInputs: React.Dispatch<React.SetStateAction<OIInputs>>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: Currency;
  showTrigger?: boolean;
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

interface Zone {
  id: string;
  name: string;
  maturity_level: number | null;
  maturity_label: string | null;
}

export const OIInputModal = ({ inputs, setInputs, open, onOpenChange, currency, showTrigger = false }: OIInputModalProps) => {
  const { t } = useLanguage();
  
  // Ensure shortTermRental has defaults if missing (for backward compatibility)
  const shortTermRental = inputs.shortTermRental || DEFAULT_SHORT_TERM_RENTAL;
  const rentalMode = inputs.rentalMode || 'long-term';
  
  // Zone selector state
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  
  // Appreciation presets
  const { presets, loading: loadingPresets, saving: savingPreset, savePreset, deletePreset, applyPreset } = useAppreciationPresets();
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);
  
  const [basePriceInput, setBasePriceInput] = useState(
    currency === 'USD' 
      ? Math.round(inputs.basePrice / DEFAULT_RATE).toString()
      : inputs.basePrice.toString()
  );
  
  // Sync basePriceInput when inputs.basePrice changes (e.g., when quote loads)
  useEffect(() => {
    setBasePriceInput(
      currency === 'USD' 
        ? Math.round(inputs.basePrice / DEFAULT_RATE).toString()
        : inputs.basePrice.toString()
    );
  }, [inputs.basePrice, currency]);
  
  // Auto-generator state
  const [numPayments, setNumPayments] = useState(4);
  const [paymentInterval, setPaymentInterval] = useState(6);
  
  // Fetch zones from database
  useEffect(() => {
    const fetchZones = async () => {
      setLoadingZones(true);
      const { data, error } = await supabase
        .from('zones')
        .select('id, name, maturity_level, maturity_label')
        .not('maturity_level', 'is', null)
        .order('name');
      
      if (!error && data) {
        setZones(data);
      }
      setLoadingZones(false);
    };
    
    if (open) {
      fetchZones();
    }
  }, [open]);
  
  // Handle zone selection
  const handleZoneSelect = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (zone && zone.maturity_level !== null) {
      const profile = getZoneAppreciationProfile(zone.maturity_level);
      setInputs(prev => ({
        ...prev,
        zoneId,
        zoneMaturityLevel: zone.maturity_level!,
        ...(prev.useZoneDefaults ? {
          constructionAppreciation: profile.constructionAppreciation,
          growthAppreciation: profile.growthAppreciation,
          matureAppreciation: profile.matureAppreciation,
          growthPeriodYears: profile.growthPeriodYears,
        } : {})
      }));
    }
  };

  // Calculate totals for validation
  const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;
  const handoverPercent = 100 - inputs.preHandoverPercent;
  const remainingToDistribute = inputs.preHandoverPercent - inputs.downpaymentPercent - additionalPaymentsTotal;
  
  const isValidPreHandover = Math.abs(preHandoverTotal - inputs.preHandoverPercent) < 0.01;
  const totalPayment = preHandoverTotal + handoverPercent;
  const isValidTotal = Math.abs(totalPayment - 100) < 0.01;

  // Date validation: Handover must be after Booking
  const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
  const handoverQuarterMonth = (inputs.handoverQuarter - 1) * 3 + 1; // Q1=Jan, Q2=Apr, Q3=Jul, Q4=Oct
  const handoverDate = new Date(inputs.handoverYear, handoverQuarterMonth - 1);
  const isHandoverBeforeBooking = handoverDate <= bookingDate;

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

  // Apply payment split preset (only changes preHandoverPercent, clears additional payments)
  const applyPaymentSplit = (split: string) => {
    const [preHandover] = split.split('/').map(Number);
    setInputs(prev => ({
      ...prev,
      preHandoverPercent: preHandover,
      additionalPayments: [] // Clear additional payments when changing preset
    }));
  };
  
  // Handle applying an appreciation preset
  const handleApplyAppreciationPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      const values = applyPreset(preset);
      setInputs(prev => ({
        ...prev,
        useZoneDefaults: false,
        constructionAppreciation: values.constructionAppreciation,
        growthAppreciation: values.growthAppreciation,
        matureAppreciation: values.matureAppreciation,
        growthPeriodYears: values.growthPeriodYears,
        ...(values.rentGrowthRate !== undefined ? { rentGrowthRate: values.rentGrowthRate } : {}),
      }));
    }
  };
  
  // Handle saving current values as preset
  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    const success = await savePreset(presetName.trim(), {
      constructionAppreciation: inputs.constructionAppreciation ?? 12,
      growthAppreciation: inputs.growthAppreciation ?? 8,
      matureAppreciation: inputs.matureAppreciation ?? 4,
      growthPeriodYears: inputs.growthPeriodYears ?? 5,
      rentGrowthRate: inputs.rentGrowthRate,
    });
    if (success) {
      setPresetName('');
      setShowSavePreset(false);
    }
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
      {showTrigger && (
        <DialogTrigger asChild>
          <Button 
            className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold"
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold text-white">OI Investment Parameters</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setInputs({
                basePrice: 800000,
                rentalYieldPercent: 8.5,
                appreciationRate: 10,
                bookingMonth: 1,
                bookingYear: 2025,
                handoverQuarter: 4,
                handoverYear: 2027,
                downpaymentPercent: 20,
                preHandoverPercent: 20,
                additionalPayments: [],
                eoiFee: 50000,
                oqoodFee: 5000,
                minimumExitThreshold: 30,
                showAirbnbComparison: false,
                shortTermRental: {
                  averageDailyRate: 800,
                  occupancyPercent: 70,
                  operatingExpensePercent: 25,
                  managementFeePercent: 15,
                },
                zoneMaturityLevel: 60,
                useZoneDefaults: true,
                constructionAppreciation: 12,
                growthAppreciation: 8,
                matureAppreciation: 4,
                growthPeriodYears: 5,
                rentGrowthRate: 4,
                serviceChargePerSqft: 18,
                adrGrowthRate: 3,
                valueDifferentiators: [],
              });
              setBasePriceInput(currency === 'USD' ? Math.round(800000 / DEFAULT_RATE).toString() : '800000');
            }}
            className="text-xs text-gray-400 hover:text-white hover:bg-[#2a3142]"
          >
            Reset to Defaults
          </Button>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Base Property Price */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <label className="text-sm text-gray-400">Base Property Price</label>
                <InfoTooltip translationKey="tooltipBasePrice" />
              </div>
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
            <div className="text-xs text-gray-500 text-right">
              {formatCurrency(inputs.basePrice, currency)}
              {inputs.unitSizeSqf && inputs.unitSizeSqf > 0 && (
                <span className="ml-2 text-[10px] text-gray-600">
                  ({formatCurrency(inputs.basePrice / inputs.unitSizeSqf, currency)}/sqft)
                </span>
              )}
            </div>
          </div>

          {/* Booking Date - Month/Year */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <label className="text-sm text-gray-400">Booking Date (OI Entry)</label>
              <InfoTooltip translationKey="tooltipBookingDate" />
            </div>
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
            <div className="flex items-center gap-1">
              <label className="text-sm text-gray-400">Handover Date</label>
              <InfoTooltip translationKey="tooltipHandoverDate" />
            </div>
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
            {/* Date validation warning */}
            {isHandoverBeforeBooking && (
              <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Handover date must be after booking date</span>
              </div>
            )}
          </div>

          {/* Entry Costs Section - Simplified */}
          <div className="space-y-3 p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
            <label className="text-sm text-gray-400 font-medium">Entry Costs (At Booking)</label>
            
            <div className="space-y-3">
              {/* EOI Fee */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">EOI / Booking Fee</span>
                  <InfoTooltip translationKey="tooltipEoiFee" />
                </div>
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
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">DLD Fee (fixed)</span>
                  <InfoTooltip translationKey="tooltipDldFee" />
                </div>
                <span className="text-xs text-white font-mono">4% = {formatCurrency(inputs.basePrice * 0.04, currency)}</span>
              </div>
              
              {/* Oqood Fee */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Oqood Fee</span>
                  <InfoTooltip translationKey="tooltipOqoodFee" />
                </div>
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
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500">Pre-Handover / Handover Split</label>
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
                <InfoTooltip translationKey="tooltipDownpayment" />
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
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#CCFF00]" />
                  Minimum Exit Threshold
                </label>
                <InfoTooltip translationKey="tooltipMinExitThreshold" />
              </div>
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

          {/* VALUE DIFFERENTIATORS SECTION */}
          <div className="space-y-3 p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
            <ValueDifferentiatorsSection
              selectedDifferentiators={inputs.valueDifferentiators || []}
              onSelectionChange={(selected) => setInputs(prev => ({ ...prev, valueDifferentiators: selected }))}
            />
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
                <div className="flex items-center gap-1">
                  <label className="text-sm text-gray-400">Rental Yield %</label>
                  <InfoTooltip translationKey="tooltipRentalYield" />
                </div>
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

          {/* ZONE & APPRECIATION SECTION */}
          <div className="space-y-4 p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#CCFF00]" />
                {(inputs.useZoneDefaults ?? true) ? 'Zone & Appreciation' : 'Custom Appreciation'}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Use Zone Defaults</span>
                <Switch
                  checked={inputs.useZoneDefaults ?? true}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const profile = getZoneAppreciationProfile(inputs.zoneMaturityLevel ?? 60);
                      setInputs(prev => ({
                        ...prev,
                        useZoneDefaults: true,
                        constructionAppreciation: profile.constructionAppreciation,
                        growthAppreciation: profile.growthAppreciation,
                        matureAppreciation: profile.matureAppreciation,
                        growthPeriodYears: profile.growthPeriodYears,
                      }));
                    } else {
                      setInputs(prev => ({ ...prev, useZoneDefaults: false }));
                    }
                  }}
                  className="data-[state=checked]:bg-[#CCFF00]"
                />
              </div>
            </div>

            {/* Zone Selector and Maturity Slider - Only show when using zone defaults */}
            {(inputs.useZoneDefaults ?? true) && (
              <>
                {/* Zone Selector from Database */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">{t('selectZone') || 'Select Project Zone'}</label>
                  <ZoneSelect
                    value={inputs.zoneId || ''}
                    onValueChange={(zoneId, zone) => {
                      if (zone && zone.maturity_level !== null) {
                        const profile = getZoneAppreciationProfile(zone.maturity_level);
                        setInputs(prev => ({
                          ...prev,
                          zoneId,
                          zoneMaturityLevel: zone.maturity_level!,
                          ...(prev.useZoneDefaults ? {
                            constructionAppreciation: profile.constructionAppreciation,
                            growthAppreciation: profile.growthAppreciation,
                            matureAppreciation: profile.matureAppreciation,
                            growthPeriodYears: profile.growthPeriodYears,
                          } : {})
                        }));
                      }
                    }}
                    className="w-full"
                  />
                </div>

                {/* Manual Zone Maturity Slider (when no zone selected) */}
                {!inputs.zoneId && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-gray-400">Or set maturity manually</label>
                      <span className="text-sm font-bold text-[#CCFF00] font-mono">{inputs.zoneMaturityLevel ?? 60}%</span>
                    </div>
                    <Slider
                      value={[inputs.zoneMaturityLevel ?? 60]}
                      onValueChange={([value]) => {
                        const profile = getZoneAppreciationProfile(value);
                        if (inputs.useZoneDefaults ?? true) {
                          setInputs(prev => ({
                            ...prev,
                            zoneMaturityLevel: value,
                            constructionAppreciation: profile.constructionAppreciation,
                            growthAppreciation: profile.growthAppreciation,
                            matureAppreciation: profile.matureAppreciation,
                            growthPeriodYears: profile.growthPeriodYears,
                          }));
                        } else {
                          setInputs(prev => ({ ...prev, zoneMaturityLevel: value }));
                        }
                      }}
                      min={0}
                      max={100}
                      step={5}
                      className="roi-slider-lime"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Emerging (0%)</span>
                      <span>Established (100%)</span>
                    </div>
                  </div>
                )}

                {/* Zone Appreciation Indicator */}
                <ZoneAppreciationIndicator maturityLevel={inputs.zoneMaturityLevel ?? 60} compact={false} />
              </>
            )}


            {/* Manual Appreciation Sliders - Only when not using zone defaults */}
            {!(inputs.useZoneDefaults ?? true) && (
              <div className="space-y-3 p-3 bg-[#1a1f2e] rounded-lg border border-[#2a3142]">
                {/* Preset Selector */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#2a3142]">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">{t('loadPreset')}</span>
                  </div>
                  <Select onValueChange={handleApplyAppreciationPreset}>
                    <SelectTrigger className="w-40 h-7 text-xs bg-[#0d1117] border-[#2a3142] text-white">
                      <SelectValue placeholder={loadingPresets ? "Loading..." : t('selectPreset')} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                      {presets.length === 0 ? (
                        <div className="px-2 py-1.5 text-xs text-gray-500">{t('noPresets')}</div>
                      ) : (
                        presets.map(preset => (
                          <SelectItem key={preset.id} value={preset.id} className="text-white hover:bg-[#2a3142] text-xs">
                            <div className="flex items-center justify-between w-full gap-2">
                              <span>{preset.name}</span>
                              <span className="text-[10px] text-gray-500">{preset.construction_appreciation}/{preset.growth_appreciation}/{preset.mature_appreciation}%</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-xs text-gray-400 font-medium">Custom Appreciation Rates</div>
                
                {/* Construction */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-500">Construction Phase</label>
                    <span className="text-xs text-orange-400 font-mono">{inputs.constructionAppreciation ?? 12}%</span>
                  </div>
                  <Slider
                    value={[inputs.constructionAppreciation ?? 12]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, constructionAppreciation: value }))}
                    min={5}
                    max={20}
                    step={1}
                    className="roi-slider-lime"
                  />
                </div>

                {/* Growth */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-500">Growth Phase ({inputs.growthPeriodYears ?? 5}y)</label>
                    <span className="text-xs text-green-400 font-mono">{inputs.growthAppreciation ?? 8}%</span>
                  </div>
                  <Slider
                    value={[inputs.growthAppreciation ?? 8]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, growthAppreciation: value }))}
                    min={3}
                    max={15}
                    step={1}
                    className="roi-slider-lime"
                  />
                </div>

                {/* Growth Period */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-500">Growth Period (years)</label>
                    <span className="text-xs text-white font-mono">{inputs.growthPeriodYears ?? 5}y</span>
                  </div>
                  <Slider
                    value={[inputs.growthPeriodYears ?? 5]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, growthPeriodYears: value }))}
                    min={2}
                    max={10}
                    step={1}
                    className="roi-slider-lime"
                  />
                </div>

                {/* Mature */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-500">Mature Phase</label>
                    <span className="text-xs text-blue-400 font-mono">{inputs.matureAppreciation ?? 4}%</span>
                  </div>
                  <Slider
                    value={[inputs.matureAppreciation ?? 4]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, matureAppreciation: value }))}
                    min={1}
                    max={8}
                    step={1}
                    className="roi-slider-lime"
                  />
                </div>
                
                {/* Save as Preset */}
                <div className="pt-2 border-t border-[#2a3142]">
                  {!showSavePreset ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSavePreset(true)}
                      className="w-full h-7 text-xs bg-[#0d1117] border-[#CCFF00]/30 text-[#CCFF00] hover:bg-[#CCFF00]/20"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      {t('saveAsPreset')}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder={t('presetName')}
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        className="flex-1 h-7 text-xs bg-[#0d1117] border-[#2a3142] text-white"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSavePreset}
                        disabled={!presetName.trim() || savingPreset}
                        className="h-7 text-xs bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
                      >
                        {savingPreset ? '...' : t('save')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SERVICE CHARGES & RENT GROWTH */}
          <div className="space-y-4 p-4 bg-[#0d1117] rounded-xl border border-[#2a3142]">
            <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#CCFF00]" />
              Expenses & Growth Rates
            </label>

            {/* Service Charges */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400">Service Charge (AED/sqft/year)</label>
                <Input
                  type="number"
                  value={inputs.serviceChargePerSqft ?? 18}
                  onChange={(e) => handleNumberChange('serviceChargePerSqft', e.target.value, 0, 100)}
                  className="w-20 h-7 text-right bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-sm"
                />
              </div>
              <Slider
                value={[inputs.serviceChargePerSqft ?? 18]}
                onValueChange={([value]) => setInputs(prev => ({ ...prev, serviceChargePerSqft: value }))}
                min={5}
                max={50}
                step={1}
                className="roi-slider-lime"
              />
            </div>

            {/* Rent Growth Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400">Annual Rent Growth Rate</label>
                <span className="text-xs text-green-400 font-mono">{inputs.rentGrowthRate ?? 4}%</span>
              </div>
              <Slider
                value={[inputs.rentGrowthRate ?? 4]}
                onValueChange={([value]) => setInputs(prev => ({ ...prev, rentGrowthRate: value }))}
                min={0}
                max={10}
                step={0.5}
                className="roi-slider-lime"
              />
            </div>

            {/* ADR Growth Rate (only when Airbnb enabled) */}
            {inputs.showAirbnbComparison && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-400">Annual ADR Growth Rate</label>
                  <span className="text-xs text-purple-400 font-mono">{inputs.adrGrowthRate ?? 3}%</span>
                </div>
                <Slider
                  value={[inputs.adrGrowthRate ?? 3]}
                  onValueChange={([value]) => setInputs(prev => ({ ...prev, adrGrowthRate: value }))}
                  min={0}
                  max={10}
                  step={0.5}
                  className="roi-slider-lime"
                />
              </div>
            )}
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
