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
import { MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from "./useMortgageCalculations";
import { ZoneAppreciationIndicator } from "./ZoneAppreciationIndicator";
import { InfoTooltip } from "./InfoTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAppreciationPresets } from "@/hooks/useAppreciationPresets";
import { useLanguage } from "@/contexts/LanguageContext";
import { ZoneSelect } from "@/components/ui/zone-select";
import { ValueDifferentiatorsSection } from "./ValueDifferentiatorsSection";
import { calculateAppreciationBonus, APPRECIATION_BONUS_CAP } from "./valueDifferentiators";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConfiguratorLayout } from "./configurator/ConfiguratorLayout";
import { MobileConfiguratorSheet } from "./configurator/MobileConfiguratorSheet";

import { ClientUnitData } from "./ClientUnitInfo";

interface OIInputModalProps {
  inputs: OIInputs;
  setInputs: React.Dispatch<React.SetStateAction<OIInputs>>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: Currency;
  showTrigger?: boolean;
  mortgageInputs: MortgageInputs;
  setMortgageInputs: React.Dispatch<React.SetStateAction<MortgageInputs>>;
  clientInfo?: ClientUnitData;
  setClientInfo?: React.Dispatch<React.SetStateAction<ClientUnitData>>;
  quoteId?: string;
  isNewQuote?: boolean; // Flag to indicate this is a fresh quote
  // Image props
  floorPlanUrl?: string | null;
  buildingRenderUrl?: string | null;
  heroImageUrl?: string | null;
  showLogoOverlay?: boolean;
  onFloorPlanChange?: (url: string | null) => void;
  onBuildingRenderChange?: (url: string | null) => void;
  onHeroImageChange?: (url: string | null) => void;
  onShowLogoOverlayChange?: (show: boolean) => void;
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

export const OIInputModal = ({ 
  inputs, 
  setInputs, 
  open, 
  onOpenChange, 
  currency, 
  showTrigger = false, 
  mortgageInputs, 
  setMortgageInputs, 
  clientInfo, 
  setClientInfo, 
  quoteId,
  isNewQuote,
  floorPlanUrl,
  buildingRenderUrl,
  heroImageUrl,
  showLogoOverlay,
  onFloorPlanChange,
  onBuildingRenderChange,
  onHeroImageChange,
  onShowLogoOverlayChange,
}: OIInputModalProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
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

  // Desktop: Use fullscreen configurator layout
  if (!isMobile) {
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
        <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden">
          <ConfiguratorLayout
            inputs={inputs}
            setInputs={setInputs}
            currency={currency}
            onClose={() => onOpenChange(false)}
            mortgageInputs={mortgageInputs}
            setMortgageInputs={setMortgageInputs}
            clientInfo={clientInfo}
            setClientInfo={setClientInfo}
            quoteId={quoteId}
            isNewQuote={isNewQuote}
            floorPlanUrl={floorPlanUrl}
            buildingRenderUrl={buildingRenderUrl}
            heroImageUrl={heroImageUrl}
            showLogoOverlay={showLogoOverlay}
            onFloorPlanChange={onFloorPlanChange}
            onBuildingRenderChange={onBuildingRenderChange}
            onHeroImageChange={onHeroImageChange}
            onShowLogoOverlayChange={onShowLogoOverlayChange}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Use bottom sheet configurator
  return (
    <>
      {showTrigger && (
        <Button 
          onClick={() => onOpenChange(true)}
          className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Configure
        </Button>
      )}
      <MobileConfiguratorSheet
        open={open}
        onOpenChange={onOpenChange}
        inputs={inputs}
        setInputs={setInputs}
        currency={currency}
        mortgageInputs={mortgageInputs}
        setMortgageInputs={setMortgageInputs}
      />
    </>
  );
};
