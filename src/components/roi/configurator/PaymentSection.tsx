import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Clock, Building2, Home, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Info, Key, Calendar, Zap, Sparkles } from "lucide-react";
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
import { PaymentPlanExtractor } from "./PaymentPlanExtractor";
import { ExtractedPaymentPlan } from "@/lib/paymentPlanTypes";

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
  const [showAIExtractor, setShowAIExtractor] = useState(false);

  // Calculate totals
  const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  
  // Simple toggle for allowing payments past handover
  const hasPostHandoverPlan = inputs.hasPostHandoverPlan ?? false;
  
  // Calculate pre-handover vs post-handover totals
  // CRITICAL FIX: For standard plans (no post-handover toggle), 
  // ALL installments are pre-handover by definition.
  // Only filter by date when hasPostHandoverPlan = true.
  const preHandoverPayments = hasPostHandoverPlan 
    ? inputs.additionalPayments.filter(p => {
        if (p.type !== 'time') return true; // construction milestones = pre-handover
        return !isPaymentPostHandover(p.triggerValue, inputs.bookingMonth, inputs.bookingYear, inputs.handoverQuarter, inputs.handoverYear);
      })
    : inputs.additionalPayments; // Standard mode: ALL are pre-handover

  const postHandoverPayments = hasPostHandoverPlan
    ? inputs.additionalPayments.filter(p => {
        if (p.type !== 'time') return false;
        return isPaymentPostHandover(p.triggerValue, inputs.bookingMonth, inputs.bookingYear, inputs.handoverQuarter, inputs.handoverYear);
      })
    : []; // Standard mode: NO post-handover payments
  
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
      // Find the index of the payment being updated
      const paymentIndex = prev.additionalPayments.findIndex(m => m.id === id);
      if (paymentIndex === -1) return prev;
      
      const oldPayment = prev.additionalPayments[paymentIndex];
      
      // If changing triggerValue (month), cascade shift to all subsequent payments
      if (field === 'triggerValue' && oldPayment.type === 'time') {
        const oldValue = oldPayment.triggerValue;
        const newValue = value as number;
        const delta = newValue - oldValue;
        
        // Only cascade if there's an actual change
        if (delta !== 0) {
          const updated = prev.additionalPayments.map((m, idx) => {
            if (idx === paymentIndex) {
              // Update the current payment
              return { ...m, triggerValue: newValue };
            } else if (idx > paymentIndex && m.type === 'time') {
              // Shift all subsequent time-based payments
              return { ...m, triggerValue: Math.max(1, m.triggerValue + delta) };
            }
            return m;
          });
          return { ...prev, additionalPayments: updated };
        }
      }
      
      // Standard single-field update for non-cascade cases
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

  // Handle AI extraction result - comprehensive mapping to configurator state
  const handleAIExtraction = (data: ExtractedPaymentPlan, bookingDate: { month: number; year: number }) => {
    // === STEP 0: Apply booking date from extractor ===
    const appliedBookingMonth = bookingDate.month;
    const appliedBookingYear = bookingDate.year;
    
    console.log('Applying booking date from extractor:', { appliedBookingMonth, appliedBookingYear });
    
    // === STEP 1: Find handover payment first to derive handover timing (most accurate source) ===
    const handoverPayment = data.installments.find(i => i.type === 'handover');
    
    let handoverMonth: number | undefined = undefined;
    let handoverYear = data.paymentStructure.handoverYear || inputs.handoverYear;
    let handoverQuarter = data.paymentStructure.handoverQuarter || inputs.handoverQuarter;
    
    // PRIORITY 1: Derive from handover payment's triggerValue (most accurate)
    if (handoverPayment && handoverPayment.triggerValue > 0) {
      const bookingDateObj = new Date(appliedBookingYear, appliedBookingMonth - 1);
      const handoverDateObj = new Date(bookingDateObj);
      handoverDateObj.setMonth(handoverDateObj.getMonth() + handoverPayment.triggerValue);
      
      handoverMonth = handoverDateObj.getMonth() + 1;
      handoverYear = handoverDateObj.getFullYear();
      handoverQuarter = (Math.ceil(handoverMonth / 3)) as 1 | 2 | 3 | 4;
      
      console.log('Handover derived from completion payment:', { 
        triggerValue: handoverPayment.triggerValue, 
        handoverMonth, 
        handoverYear, 
        handoverQuarter 
      });
    }
    // PRIORITY 2: Fall back to handoverMonthFromBooking
    else if (data.paymentStructure.handoverMonthFromBooking) {
      const handoverMonths = data.paymentStructure.handoverMonthFromBooking;
      const bookingDateObj = new Date(appliedBookingYear, appliedBookingMonth - 1);
      const handoverDateObj = new Date(bookingDateObj);
      handoverDateObj.setMonth(handoverDateObj.getMonth() + handoverMonths);
      
      handoverMonth = handoverDateObj.getMonth() + 1;
      handoverYear = handoverDateObj.getFullYear();
      handoverQuarter = (Math.ceil(handoverMonth / 3)) as 1 | 2 | 3 | 4;
    }
    // PRIORITY 3: Use explicit quarter/year if provided
    else if (data.paymentStructure.handoverQuarter || data.paymentStructure.handoverYear) {
      handoverQuarter = data.paymentStructure.handoverQuarter || inputs.handoverQuarter;
      handoverYear = data.paymentStructure.handoverYear || inputs.handoverYear;
      // Derive month from quarter start
      handoverMonth = (handoverQuarter - 1) * 3 + 1;
    }
    
    // === STEP 2: Find special installments ===
    // Downpayment (month 0)
    const downpayment = data.installments.find(
      i => i.type === 'time' && i.triggerValue === 0
    );
    const downpaymentPercent = downpayment?.paymentPercent || inputs.downpaymentPercent;
    
    // === STEP 3: Calculate totals for validation ===
    const postHandoverInstallments = data.installments.filter(i => 
      i.type === 'post-handover'
    );
    const postHandoverTotal = postHandoverInstallments.reduce((sum, i) => sum + i.paymentPercent, 0);
    
    // Determine if this is a post-handover plan BEFORE setting onHandoverPercent
    const hasPostHandover = data.paymentStructure.hasPostHandover || postHandoverTotal > 0;
    
    // CRITICAL FIX: Only set onHandoverPercent for post-handover plans
    // For standard plans, handover = 100 - preHandoverPercent (derived)
    const onHandoverPercent = hasPostHandover 
      ? (handoverPayment?.paymentPercent || data.paymentStructure.onHandoverPercent || 0)
      : 0;
    
    // === STEP 4: Determine pre-handover percent from split ===
    // Priority 1: Use AI-extracted paymentSplit
    let preHandoverPercent = inputs.preHandoverPercent;
    if (data.paymentStructure.paymentSplit) {
      const [pre] = data.paymentStructure.paymentSplit.split('/').map(Number);
      if (!isNaN(pre)) {
        preHandoverPercent = pre;
        console.log('Set preHandoverPercent from paymentSplit:', pre);
      }
    } else {
      // Priority 2: Calculate from downpayment + pre-HO installments
      // Only 'time' and 'construction' types are pre-handover (excludes 'handover' and 'post-handover')
      const preHOInstallments = data.installments.filter(i => 
        i.type === 'time' || i.type === 'construction'
      );
      const preHOTotal = preHOInstallments.reduce((sum, i) => sum + i.paymentPercent, 0);
      
      if (preHOTotal > 0 && preHOTotal <= 100) {
        preHandoverPercent = preHOTotal;
        console.log('Calculated preHandoverPercent from installments:', preHOTotal);
      }
    }
    
    // === STEP 5: Convert installments to configurator format ===
    // CRITICAL: Exclude handover payment - it's handled by preHandoverPercent/handoverPercent
    
    // Type-aware sorting helper: converts construction % to estimated months
    const sortingTotalMonths = data.paymentStructure.handoverMonthFromBooking || handoverPayment?.triggerValue || 36;
    const getEstimatedMonth = (inst: { type: string; triggerValue: number }, totalMonths: number): number => {
      if (inst.type === 'time') return inst.triggerValue;
      if (inst.type === 'construction') return Math.round((inst.triggerValue / 100) * totalMonths);
      if (inst.type === 'handover') return totalMonths;
      if (inst.type === 'post-handover') return totalMonths + inst.triggerValue;
      return inst.triggerValue;
    };
    
    const additionalPayments = data.installments
      .filter(i => {
        // Skip downpayment (Month 0) - handled by downpaymentPercent
        if (i.type === 'time' && i.triggerValue === 0) return false;
        
        // CRITICAL FIX: Skip handover payment - it's NOT an installment, it's the completion lump sum
        // This prevents the handover % from being double-counted
        if (i.type === 'handover') {
          console.log('Excluding handover payment from installments:', i.paymentPercent, '%');
          return false;
        }
        
        // Skip duplicate Month 1 if same as downpayment
        if (i.type === 'time' && i.triggerValue === 1 && 
            downpayment && i.paymentPercent === downpayment.paymentPercent) {
          console.warn('Skipping duplicate: Month 1 has same % as downpayment');
          return false;
        }
        
        return true;
      })
      .map((inst, idx) => ({
        id: inst.id || `ai-${Date.now()}-${idx}`,
        // Only keep construction type as-is, everything else becomes time
        type: inst.type === 'construction' 
          ? 'construction' as const 
          : 'time' as const,
        triggerValue: inst.triggerValue, // Already absolute from AI
        paymentPercent: inst.paymentPercent,
      }))
      .sort((a, b) => {
        // Type-aware sorting: convert construction % to estimated months
        const aMonth = getEstimatedMonth(a, sortingTotalMonths);
        const bMonth = getEstimatedMonth(b, sortingTotalMonths);
        return aMonth - bMonth;
      });
    
    // === STEP 6: Update inputs with complete structure (including booking date) ===
    setInputs(prev => ({
      ...prev,
      // Apply booking date from extractor
      bookingMonth: appliedBookingMonth,
      bookingYear: appliedBookingYear,
      // Payment structure
      downpaymentPercent,
      preHandoverPercent,
      onHandoverPercent,
      additionalPayments,
      hasPostHandoverPlan: data.paymentStructure.hasPostHandover || postHandoverTotal > 0,
      postHandoverPercent: postHandoverTotal || data.paymentStructure.postHandoverPercent || 0,
      handoverMonth, // Actual month (1-12) from completion payment
      handoverQuarter,
      handoverYear,
      // Update property fields if extracted
      ...(data.property?.basePrice && { basePrice: data.property.basePrice }),
      ...(data.property?.unitSizeSqft && { unitSizeSqf: data.property.unitSizeSqft }),
    }));
    
    setShowInstallments(additionalPayments.length > 0);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h3 className="text-lg font-semibold text-theme-text">Payment Plan</h3>
          <p className="text-sm text-theme-text-muted">Configure your payment schedule</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAIExtractor(true)}
          className="gap-1.5 h-8 text-xs border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Import
        </Button>
      </div>

      {/* AI Extractor Sheet */}
      <PaymentPlanExtractor
        open={showAIExtractor}
        onOpenChange={setShowAIExtractor}
        existingBookingMonth={inputs.bookingMonth}
        existingBookingYear={inputs.bookingYear}
        onApply={handleAIExtraction}
      />

      {/* Post-Handover Toggle - At the top for visibility */}
      <div className="flex items-center justify-between p-2 bg-theme-card rounded-lg border border-purple-500/30">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs text-theme-text">Allow Payments Past Handover</span>
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
      <div className="space-y-1.5 p-2 bg-theme-card rounded-lg border border-theme-border">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-theme-accent/20 flex items-center justify-center text-[10px] font-bold text-theme-accent">1</div>
          <label className="text-xs text-theme-text font-medium">Split</label>
          <InfoTooltip translationKey="tooltipPreHandover" />
        </div>
        <div className="flex flex-wrap gap-1 ml-5">
          {presetSplits.map((split) => (
            <Button
              key={split}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPaymentSplit(split)}
              className={`h-7 text-xs px-2.5 border-theme-border ${
                inputs.preHandoverPercent === parseInt(split.split('/')[0])
                  ? 'bg-theme-accent/20 border-theme-accent/50 text-theme-accent'
                  : 'text-theme-text-muted hover:bg-theme-card-alt hover:text-theme-text'
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
              className="h-6 text-[10px] px-2 border-dashed border-theme-border text-theme-text-muted hover:bg-theme-card-alt hover:text-theme-text"
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
                className="w-10 h-6 text-center bg-theme-bg-alt border-theme-border text-theme-text font-mono text-[10px]"
                autoFocus
              />
              <span className="text-[9px] text-theme-text-muted">/</span>
              <span className="text-[9px] text-theme-text-muted w-5">{100 - (parseInt(customPreHandover) || 0)}</span>
              <Button
                type="button"
                size="sm"
                onClick={applyCustomSplit}
                disabled={!customPreHandover || parseInt(customPreHandover) < 10 || parseInt(customPreHandover) > 90}
                className="h-5 px-1.5 bg-theme-accent text-black hover:bg-theme-accent/90 text-[9px]"
              >
                OK
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Downpayment - Only show after split is selected */}
      {hasSplitSelected && (
        <div className="space-y-1.5 p-2 bg-theme-card rounded-lg border border-theme-accent/30 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-theme-accent/20 flex items-center justify-center text-[10px] font-bold text-theme-accent">2</div>
            <span className="text-xs font-medium text-theme-accent">Down</span>
            <span className="text-[10px] text-theme-text-muted">(EOI {formatCurrency(inputs.eoiFee, currency)})</span>
            <InfoTooltip translationKey="tooltipDownpayment" />
          </div>
          <div className="flex items-center gap-2 ml-5">
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
                className="w-14 h-7 text-center bg-theme-bg-alt border-theme-border text-theme-accent font-mono text-sm"
              />
              <span className="text-xs text-theme-text-muted">%</span>
            </div>
            <span className="text-xs text-theme-text-muted font-mono">
              {formatCurrency(inputs.basePrice * inputs.downpaymentPercent / 100, currency)}
            </span>
          </div>
        </div>
      )}

      {/* Step 3: Installment Generator - Compact single row */}
      {hasSplitSelected && inputs.downpaymentPercent > 0 && (
        <div className="space-y-2 animate-fade-in">
          {/* Generator - Single row */}
          <div className="p-2 bg-theme-card rounded-lg border border-theme-accent/30">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-theme-accent/20 flex items-center justify-center text-[10px] font-bold text-theme-accent shrink-0">3</div>
              
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={numPayments}
                  onChange={(e) => setNumPayments(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-10 h-7 text-center bg-theme-bg-alt border-theme-border text-theme-text font-mono text-xs"
                />
                <span className="text-[10px] text-theme-text-muted">×</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={paymentPercent}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0.5 : parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      setPaymentPercent(Math.min(50, Math.max(0.1, val)));
                    }
                  }}
                  className="w-12 h-7 text-center bg-theme-bg-alt border-theme-border text-theme-accent font-mono text-xs"
                />
                <span className="text-[10px] text-theme-text-muted">%</span>
              </div>
              
              <span className="text-[10px] text-theme-text-muted">every</span>
              
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={paymentInterval}
                  onChange={(e) => setPaymentInterval(Math.min(24, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-10 h-7 text-center bg-theme-bg-alt border-theme-border text-theme-text font-mono text-xs"
                />
                <span className="text-[10px] text-theme-text-muted">mo</span>
              </div>
              
              <span className="text-[10px] text-theme-text-muted">=</span>
              <span className="text-xs text-theme-accent font-mono font-medium">{(numPayments * paymentPercent).toFixed(1)}%</span>
              
              <Button
                type="button"
                onClick={handleGeneratePayments}
                size="sm"
                className="h-7 px-3 bg-theme-accent text-black hover:bg-theme-accent/90 font-semibold text-xs ml-auto"
              >
                <Zap className="w-3 h-3 mr-1" />
                Generate
              </Button>
            </div>
          </div>

          {/* Installments List - Only show if there are payments */}
          {inputs.additionalPayments.length > 0 && (
            <div className="space-y-1.5 p-2 bg-theme-card rounded-lg border border-theme-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-theme-text font-medium">Installments</span>
                  <span className="text-[10px] text-theme-text-muted">({inputs.additionalPayments.length})</span>
                  <Button
                    type="button"
                    onClick={addAdditionalPayment}
                    size="sm"
                    className="h-5 px-1.5 bg-theme-accent text-black hover:bg-theme-accent/90 text-[9px]"
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
                    className="h-5 px-1 text-theme-text-muted"
                  >
                    {showInstallments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {showInstallments && (
                <>
                  <div className="space-y-1 max-h-[50vh] overflow-y-auto pt-1.5 border-t border-theme-border">
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
                      
                      // NEW: Explicit handover flag has priority over quarter-based detection
                      const isExplicitHandover = payment.isHandover === true;
                      const showHandoverBadge = isExplicitHandover || isHandoverQuarter;
                      
                      return (
                        <div 
                          key={payment.id} 
                          className={cn(
                            "flex items-center gap-1.5 p-1.5 rounded-lg",
                            isExplicitHandover ? "bg-green-500/15 border border-green-500/40" :
                            isHandoverQuarter ? "bg-green-500/10 border border-green-500/30" :
                            isPostHO ? "bg-purple-500/10 border border-purple-500/30" : 
                            "bg-theme-bg"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0",
                            isExplicitHandover ? "bg-green-500/40 text-green-300" :
                            isHandoverQuarter ? "bg-green-500/30 text-green-400" :
                            isPostHO ? "bg-purple-500/30 text-purple-400" :
                            "bg-theme-border text-theme-text-muted"
                          )}>
                            {index + 1}
                          </div>
                          
                          <Select
                            value={payment.type}
                            onValueChange={(value: 'time' | 'construction') => updateAdditionalPayment(payment.id, 'type', value)}
                          >
                            <SelectTrigger className="w-[60px] h-6 text-[10px] bg-theme-bg-alt border-theme-border text-theme-text px-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-theme-bg-alt border-theme-border z-50">
                              <SelectItem value="time" className="text-theme-text hover:bg-theme-border text-xs">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Time</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="construction" className="text-theme-text hover:bg-theme-border text-xs">
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  <span>Build</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {payment.type === 'time' ? (
                            // Date-based input for time payments
                            <div className="flex items-center gap-1">
                              <Select
                                value={paymentDate ? String(paymentDate.getMonth() + 1) : '1'}
                                onValueChange={(monthStr) => {
                                  const newMonth = parseInt(monthStr);
                                  const currentYear = paymentDate ? paymentDate.getFullYear() : inputs.bookingYear;
                                  // Calculate months from booking
                                  const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
                                  const targetDate = new Date(currentYear, newMonth - 1);
                                  const monthsDiff = (targetDate.getFullYear() - bookingDate.getFullYear()) * 12 
                                    + (targetDate.getMonth() - bookingDate.getMonth());
                                  updateAdditionalPayment(payment.id, 'triggerValue', Math.max(1, monthsDiff));
                                }}
                              >
                                <SelectTrigger className="w-[52px] h-6 text-[10px] bg-theme-bg-alt border-theme-border text-theme-text px-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-theme-bg-alt border-theme-border z-50 max-h-[200px]">
                                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                    <SelectItem key={i} value={String(i + 1)} className="text-theme-text hover:bg-theme-border text-xs">
                                      {m}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={paymentDate ? String(paymentDate.getFullYear()) : String(inputs.bookingYear)}
                                onValueChange={(yearStr) => {
                                  const newYear = parseInt(yearStr);
                                  const currentMonth = paymentDate ? paymentDate.getMonth() + 1 : 1;
                                  // Calculate months from booking
                                  const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
                                  const targetDate = new Date(newYear, currentMonth - 1);
                                  const monthsDiff = (targetDate.getFullYear() - bookingDate.getFullYear()) * 12 
                                    + (targetDate.getMonth() - bookingDate.getMonth());
                                  updateAdditionalPayment(payment.id, 'triggerValue', Math.max(1, monthsDiff));
                                }}
                              >
                                <SelectTrigger className="w-[58px] h-6 text-[10px] bg-theme-bg-alt border-theme-border text-theme-text px-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-theme-bg-alt border-theme-border z-50 max-h-[200px]">
                                  {Array.from({ length: 12 }, (_, i) => inputs.bookingYear + i).map((year) => (
                                    <SelectItem key={year} value={String(year)} className="text-theme-text hover:bg-theme-border text-xs">
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            // Construction percentage input
                            <div className="flex items-center gap-1">
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={payment.triggerValue || ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                  updateAdditionalPayment(payment.id, 'triggerValue', Math.max(0, val));
                                }}
                                className="w-10 h-6 text-center bg-theme-bg-alt border-theme-border text-theme-text font-mono text-[10px]"
                              />
                              <span className="text-[10px] text-theme-text-muted">%</span>
                            </div>
                          )}

                          {/* Show month count and status badges for time-based payments */}
                          {payment.type === 'time' && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-theme-text-muted font-mono">
                                M{payment.triggerValue}
                              </span>
                              {showHandoverBadge && (
                                <span className={cn(
                                  "text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5",
                                  isExplicitHandover 
                                    ? "bg-green-500/30 text-green-300 font-medium" 
                                    : "bg-green-500/20 text-green-400"
                                )}>
                                  <Key className="w-2.5 h-2.5" />
                                  {isExplicitHandover && "HO"}
                                </span>
                              )}
                              {isPostHO && !showHandoverBadge && (
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
                              className="w-12 h-6 text-center bg-theme-bg-alt border-theme-border text-theme-text font-bold font-mono text-[10px]"
                            />
                            <span className="text-[10px] text-theme-text-muted">%</span>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAdditionalPayment(payment.id)}
                            className="h-5 w-5 text-theme-text-muted hover:text-red-400 hover:bg-red-400/10 shrink-0"
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
                    className="w-full h-7 text-xs border-dashed border-theme-border text-theme-text-muted hover:bg-theme-card hover:text-theme-text mt-2"
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
      <div className="mt-4 p-3 bg-theme-card rounded-lg border border-theme-border">
        {/* Standard 3-column layout for non-post-handover */}
        {!hasPostHandoverPlan && (
          <div className="flex items-center gap-3">
            {/* Pre-Handover */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-theme-accent shrink-0" />
              <span className="text-[10px] text-theme-text-muted uppercase truncate">Pre-HO</span>
              <span className="text-sm font-mono text-theme-text font-semibold ml-auto">
                {preHandoverTotal.toFixed(0)}%
              </span>
            </div>
            
            <div className="h-6 w-px bg-theme-border" />
            
            {/* Handover */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
              <span className="text-[10px] text-theme-text-muted uppercase truncate">Handover</span>
              <span className="text-sm font-mono text-theme-text font-semibold ml-auto">
                {handoverPercent}%
              </span>
            </div>
            
            <div className="h-6 w-px bg-theme-border" />
            
            {/* Total */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              {isValidTotal ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="text-[10px] text-theme-text-muted uppercase truncate">Total</span>
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
              <div className="w-2 h-2 rounded-full bg-theme-accent shrink-0" />
              <span className="text-[10px] text-theme-text-muted uppercase truncate">Pre</span>
              <span className="text-xs font-mono text-theme-text ml-auto">{preHandoverTotal.toFixed(0)}%</span>
            </div>
            
            <div className="h-5 w-px bg-theme-border" />
            
            {/* On Handover (always 0 in post-handover mode) */}
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              <span className="text-[10px] text-theme-text-muted uppercase truncate">On-HO</span>
              <span className="text-xs font-mono text-theme-text-muted ml-auto">0%</span>
            </div>
            
            <div className="h-5 w-px bg-theme-border" />
            
            {/* Post-Handover */}
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              <span className="text-[10px] text-theme-text-muted uppercase truncate">Post</span>
              <span className="text-xs font-mono text-purple-400 ml-auto">{postHandoverTotal.toFixed(0)}%</span>
            </div>
            
            <div className="h-5 w-px bg-theme-border" />
            
            {/* Total */}
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              {isValidTotal ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              )}
              <span className="text-[10px] text-theme-text-muted uppercase">Tot</span>
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
