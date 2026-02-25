import { useState } from "react";
import { Plus, Trash2, Clock, Building2, Key, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfiguratorSectionProps, presetSplits } from "./types";
import { formatCurrency } from "../currencyUtils";
import { InfoTooltip } from "../InfoTooltip";
import { PaymentMilestone } from "../useOICalculations";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Helper to calculate actual payment date
const getPaymentDate = (monthsFromBooking: number, bookingMonth: number, bookingYear: number): Date => {
  const date = new Date(bookingYear, bookingMonth - 1);
  date.setMonth(date.getMonth() + monthsFromBooking);
  return date;
};

// Check if a payment is after handover
const isPaymentPostHandover = (monthsFromBooking: number, bookingMonth: number, bookingYear: number, handoverMonth: number, handoverYear: number): boolean => {
  const paymentDate = getPaymentDate(monthsFromBooking, bookingMonth, bookingYear);
  const handoverDate = new Date(handoverYear, handoverMonth - 1);
  return paymentDate >= handoverDate;
};

// Check if payment falls in handover month
const isPaymentInHandoverMonth = (monthsFromBooking: number, bookingMonth: number, bookingYear: number, handoverMonth: number, handoverYear: number): boolean => {
  const paymentDate = getPaymentDate(monthsFromBooking, bookingMonth, bookingYear);
  const handoverStart = new Date(handoverYear, handoverMonth - 1);
  const handoverEnd = new Date(handoverYear, handoverMonth);
  return paymentDate >= handoverStart && paymentDate < handoverEnd;
};

export const PaymentSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  const [showInstallments, setShowInstallments] = useState(inputs.additionalPayments.length > 0);
  const [showCustomSplit, setShowCustomSplit] = useState(false);
  const [customPreHandover, setCustomPreHandover] = useState('');

  // Calculate totals
  const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  const hasPostHandoverPlan = inputs.hasPostHandoverPlan ?? false;
  
  const preHandoverPayments = hasPostHandoverPlan 
    ? inputs.additionalPayments.filter(p => {
        if (p.type !== 'time') return true;
        return !isPaymentPostHandover(p.triggerValue, inputs.bookingMonth, inputs.bookingYear, inputs.handoverMonth, inputs.handoverYear);
      })
    : inputs.additionalPayments;

  const postHandoverPayments = hasPostHandoverPlan
    ? inputs.additionalPayments.filter(p => {
        if (p.type !== 'time') return false;
        return isPaymentPostHandover(p.triggerValue, inputs.bookingMonth, inputs.bookingYear, inputs.handoverMonth, inputs.handoverYear);
      })
    : [];
  
  const preHandoverInstallmentsTotal = preHandoverPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  const postHandoverTotal = postHandoverPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
  const preHandoverTotal = inputs.downpaymentPercent + preHandoverInstallmentsTotal;
  
  let handoverPercent: number;
  let totalPayment: number;
  
  if (hasPostHandoverPlan) {
    handoverPercent = 0;
    totalPayment = preHandoverTotal + postHandoverTotal;
  } else {
    handoverPercent = 100 - inputs.preHandoverPercent;
    totalPayment = preHandoverTotal + handoverPercent;
  }
  
  let remainingToDistribute: number;
  if (hasPostHandoverPlan) {
    remainingToDistribute = 100 - inputs.downpaymentPercent - additionalPaymentsTotal;
  } else {
    remainingToDistribute = inputs.preHandoverPercent - inputs.downpaymentPercent - additionalPaymentsTotal;
  }
  const isValidTotal = Math.abs(totalPayment - 100) < 0.5;
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
    const lastMonth = inputs.additionalPayments.length > 0 
      ? Math.max(...inputs.additionalPayments.filter(p => p.type === 'time').map(p => p.triggerValue))
      : 0;
    const installmentNum = inputs.additionalPayments.length + 1;
    const newPayment: PaymentMilestone = {
      id: newId,
      type: 'time' as const,
      triggerValue: lastMonth + 1,
      paymentPercent: lastPaymentPercent,
      label: `Installment ${installmentNum}`,
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
      const paymentIndex = prev.additionalPayments.findIndex(m => m.id === id);
      if (paymentIndex === -1) return prev;
      
      const oldPayment = prev.additionalPayments[paymentIndex];
      
      if (field === 'triggerValue' && oldPayment.type === 'time') {
        const oldValue = oldPayment.triggerValue;
        const newValue = value as number;
        const delta = newValue - oldValue;
        
        if (delta !== 0) {
          const updated = prev.additionalPayments.map((m, idx) => {
            if (idx === paymentIndex) {
              return { ...m, triggerValue: newValue };
            } else if (idx > paymentIndex && m.type === 'time') {
              return { ...m, triggerValue: Math.max(1, m.triggerValue + delta) };
            }
            return m;
          });
          return { ...prev, additionalPayments: updated };
        }
      }
      
      const updated = prev.additionalPayments.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      );
      
      if (field === 'triggerValue') {
        return { ...prev, additionalPayments: updated.sort((a, b) => a.triggerValue - b.triggerValue) };
      }
      return { ...prev, additionalPayments: updated };
    });
  };

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

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-semibold text-theme-text">Payment Plan</h3>
      </div>

      {/* Post-Handover Toggle */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs text-theme-text">Post-Handover Payments</span>
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

      {/* Divider */}
      <div className="border-t border-theme-border/30" />

      {/* Step 1: Split Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-theme-accent/20 flex items-center justify-center text-[10px] font-bold text-theme-accent">1</div>
          <label className="text-xs font-medium text-theme-text">Payment Split</label>
          <InfoTooltip translationKey="tooltipPreHandover" />
        </div>
        <div className="flex flex-wrap gap-1.5 pl-5">
          {presetSplits.map((split) => (
            <Button
              key={split}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPaymentSplit(split)}
              className={cn(
                "h-7 text-xs px-2.5 border-theme-border",
                inputs.preHandoverPercent === parseInt(split.split('/')[0])
                  ? 'bg-theme-accent/20 border-theme-accent/50 text-theme-accent'
                  : 'text-theme-text-muted hover:bg-theme-card-alt hover:text-theme-text'
              )}
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
              className="h-7 text-xs px-2 border-dashed border-theme-border text-theme-text-muted"
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
                className="w-10 h-7 text-center bg-theme-bg-alt border-theme-border text-theme-text font-mono text-xs"
                autoFocus
              />
              <span className="text-[9px] text-theme-text-muted">/</span>
              <span className="text-[9px] text-theme-text-muted w-5">{100 - (parseInt(customPreHandover) || 0)}</span>
              <Button
                type="button"
                size="sm"
                onClick={applyCustomSplit}
                disabled={!customPreHandover || parseInt(customPreHandover) < 10 || parseInt(customPreHandover) > 90}
                className="h-6 px-1.5 bg-theme-accent text-white hover:bg-theme-accent/90 text-[9px]"
              >
                OK
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Downpayment */}
      {hasSplitSelected && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-theme-accent/20 flex items-center justify-center text-[10px] font-bold text-theme-accent">2</div>
            <span className="text-xs font-medium text-theme-accent">Downpayment</span>
            <span className="text-[10px] text-theme-text-muted">(EOI: {formatCurrency(inputs.eoiFee, currency)})</span>
            <InfoTooltip translationKey="tooltipDownpayment" />
          </div>
          <div className="flex items-center gap-2 pl-5">
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
                className="w-12 h-7 text-center bg-theme-bg-alt border-theme-border text-theme-accent font-mono text-sm"
              />
              <span className="text-xs text-theme-text-muted">%</span>
            </div>
            <span className="text-xs text-theme-text-muted font-mono">
              {formatCurrency(inputs.basePrice * inputs.downpaymentPercent / 100, currency)}
            </span>
          </div>
        </div>
      )}

      {/* Step 3: Installments */}
      {hasSplitSelected && inputs.downpaymentPercent > 0 && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-theme-accent/20 flex items-center justify-center text-[10px] font-bold text-theme-accent">3</div>
            <span className="text-xs font-medium text-theme-text">Installments</span>
          </div>

          {/* Add Payment + Summary Row */}
          <div className="pl-5">
            <div className="flex justify-between items-center py-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  addAdditionalPayment();
                  setShowInstallments(true);
                }}
                className="h-7 text-xs px-3 border-dashed border-theme-border text-theme-text-muted hover:bg-theme-card hover:text-theme-text"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Installment
              </Button>
              {inputs.additionalPayments.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-theme-text-muted">{inputs.additionalPayments.length} installments</span>
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded font-mono",
                    remainingToDistribute > 0.5 ? 'bg-amber-500/20 text-amber-400' :
                    remainingToDistribute < -0.5 ? 'bg-red-500/20 text-red-400' :
                    'bg-green-500/20 text-green-400'
                  )}>
                    {remainingToDistribute > 0.5 ? `${remainingToDistribute.toFixed(1)}% left` :
                    remainingToDistribute < -0.5 ? `${Math.abs(remainingToDistribute).toFixed(1)}% over` :
                    '✓ balanced'}
                  </span>
                  <Button
                    type="button"
                    onClick={handleResetPayments}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-[10px]"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear All
                  </Button>
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
              )}
            </div>
          </div>

          {/* Installments List */}
          {inputs.additionalPayments.length > 0 && showInstallments && (
            <div className="pl-5 space-y-1.5">
              <div className="space-y-1 max-h-[40vh] overflow-y-auto border-t border-theme-border/30 pt-2">
                  {inputs.additionalPayments.map((payment, index) => {
                    const paymentDate = payment.type === 'time' 
                      ? getPaymentDate(payment.triggerValue, inputs.bookingMonth, inputs.bookingYear)
                      : null;
                    const isPostHO = payment.type === 'time' && isPaymentPostHandover(
                      payment.triggerValue,
                      inputs.bookingMonth,
                      inputs.bookingYear,
                      inputs.handoverMonth,
                      inputs.handoverYear
                    );
                    const isInHandoverMonth = payment.type === 'time' && isPaymentInHandoverMonth(
                      payment.triggerValue,
                      inputs.bookingMonth,
                      inputs.bookingYear,
                      inputs.handoverMonth,
                      inputs.handoverYear
                    );
                    const isExplicitHandover = payment.isHandover === true;
                    const showHandoverBadge = isExplicitHandover || isInHandoverMonth;
                    
                    return (
                      <div 
                        key={payment.id} 
                        className={cn(
                          "flex items-center gap-1.5 py-1.5 px-2 rounded-lg",
                          isExplicitHandover ? "bg-green-500/15 border border-green-500/40" :
                          isInHandoverMonth ? "bg-green-500/10" :
                          isPostHO ? "bg-purple-500/10" : 
                          "bg-theme-bg/50"
                        )}
                      >
                        <span className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0",
                          isPostHO ? "bg-purple-500/30 text-purple-400" :
                          isInHandoverMonth ? "bg-green-500/30 text-green-400" :
                          "bg-theme-border text-theme-text-muted"
                        )}>
                          {index + 1}
                        </span>
                        
                        <Select
                          value={payment.type}
                          onValueChange={(value: 'time' | 'construction') => updateAdditionalPayment(payment.id, 'type', value)}
                        >
                          <SelectTrigger className="w-[55px] h-6 text-[10px] bg-theme-bg-alt border-theme-border text-theme-text px-1.5">
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
                          <div className="flex items-center gap-1">
                            <Select
                              value={paymentDate ? String(paymentDate.getMonth() + 1) : '1'}
                              onValueChange={(monthStr) => {
                                const newMonth = parseInt(monthStr);
                                const currentYear = paymentDate ? paymentDate.getFullYear() : inputs.bookingYear;
                                const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
                                const targetDate = new Date(currentYear, newMonth - 1);
                                const monthsDiff = (targetDate.getFullYear() - bookingDate.getFullYear()) * 12 
                                  + (targetDate.getMonth() - bookingDate.getMonth());
                                updateAdditionalPayment(payment.id, 'triggerValue', Math.max(1, monthsDiff));
                              }}
                            >
                              <SelectTrigger className="w-[50px] h-6 text-[10px] bg-theme-bg-alt border-theme-border text-theme-text px-1">
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
                                const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
                                const targetDate = new Date(newYear, currentMonth - 1);
                                const monthsDiff = (targetDate.getFullYear() - bookingDate.getFullYear()) * 12 
                                  + (targetDate.getMonth() - bookingDate.getMonth());
                                updateAdditionalPayment(payment.id, 'triggerValue', Math.max(1, monthsDiff));
                              }}
                            >
                              <SelectTrigger className="w-[55px] h-6 text-[10px] bg-theme-bg-alt border-theme-border text-theme-text px-1">
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

                        {/* Status badges */}
                        {payment.type === 'time' && (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-theme-text-muted font-mono">M{payment.triggerValue}</span>
                            {isPostHO && !isExplicitHandover && (
                              <span className="text-[9px] px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded">PH</span>
                            )}
                          </div>
                        )}

                        {/* Mark as Completion button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Toggle isHandover flag for this payment
                            // First, remove isHandover from all other payments
                            setInputs(prev => ({
                              ...prev,
                              additionalPayments: prev.additionalPayments.map(p => ({
                                ...p,
                                isHandover: p.id === payment.id ? !p.isHandover : false
                              }))
                            }));
                          }}
                          className={cn(
                            "h-5 px-1.5 text-[9px]",
                            isExplicitHandover 
                              ? "bg-green-500/30 text-green-300 hover:bg-green-500/20" 
                              : "text-theme-text-muted hover:bg-green-500/10 hover:text-green-400"
                          )}
                          title="Mark as completion/handover payment"
                        >
                          <Key className="w-3 h-3" />
                          {isExplicitHandover && <span className="ml-0.5">🔑</span>}
                        </Button>

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
            </div>
          )}
        </div>
      )}

      {/* Step 4: Eligibility Milestones */}
      {hasSplitSelected && inputs.downpaymentPercent > 0 && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-theme-accent/20 flex items-center justify-center text-[10px] font-bold text-theme-accent">4</div>
            <span className="text-xs font-medium text-theme-text">Eligibility Milestones</span>
            <InfoTooltip translationKey="tooltipEligibility" />
          </div>
          <p className="text-[10px] text-theme-text-muted pl-5">Developer allows resale/mortgage after a % of the price is paid</p>

          {/* Resale Eligible */}
          <div className="pl-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-theme-text-muted">Resale Eligible at</span>
              <span className="text-xs font-mono text-theme-accent">{inputs.resellEligiblePercent ?? 30}%</span>
            </div>
            <Slider
              value={[inputs.resellEligiblePercent ?? 30]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, resellEligiblePercent: value }))}
              min={10}
              max={60}
              step={5}
              className="roi-slider-lime"
            />
          </div>

          {/* Mortgage Eligible */}
          <div className="pl-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-theme-text-muted">Mortgage Eligible at</span>
              <span className="text-xs font-mono text-theme-accent">{inputs.mortgageEligiblePercent ?? 50}%</span>
            </div>
            <Slider
              value={[inputs.mortgageEligiblePercent ?? 50]}
              onValueChange={([value]) => setInputs(prev => ({ ...prev, mortgageEligiblePercent: value }))}
              min={20}
              max={80}
              step={5}
              className="roi-slider-lime"
            />
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-theme-border/30" />

      {/* Total Summary - Flat row */}
      <div className="flex items-center gap-3 py-2">
        {!hasPostHandoverPlan ? (
          <>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-theme-accent shrink-0" />
              <span className="text-[10px] text-theme-text-muted uppercase">Pre-HO</span>
              <span className="text-sm font-mono text-theme-text ml-auto">{preHandoverTotal.toFixed(0)}%</span>
            </div>
            <div className="h-5 w-px bg-theme-border/50" />
            <div className="flex-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
              <span className="text-[10px] text-theme-text-muted uppercase">Handover</span>
              <span className="text-sm font-mono text-theme-text ml-auto">{handoverPercent}%</span>
            </div>
            <div className="h-5 w-px bg-theme-border/50" />
            <div className="flex-1 flex items-center gap-2">
              {isValidTotal ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="text-[10px] text-theme-text-muted uppercase">Total</span>
              <span className={cn("text-sm font-mono font-bold ml-auto", isValidTotal ? 'text-green-400' : 'text-red-400')}>
                {totalPayment.toFixed(0)}%
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-theme-accent shrink-0" />
              <span className="text-[9px] text-theme-text-muted">Pre</span>
              <span className="text-xs font-mono text-theme-text ml-auto">{preHandoverTotal.toFixed(0)}%</span>
            </div>
            <div className="h-4 w-px bg-theme-border/50" />
            <div className="flex-1 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              <span className="text-[9px] text-theme-text-muted">On-HO</span>
              <span className="text-xs font-mono text-theme-text-muted ml-auto">0%</span>
            </div>
            <div className="h-4 w-px bg-theme-border/50" />
            <div className="flex-1 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              <span className="text-[9px] text-theme-text-muted">Post</span>
              <span className="text-xs font-mono text-purple-400 ml-auto">{postHandoverTotal.toFixed(0)}%</span>
            </div>
            <div className="h-4 w-px bg-theme-border/50" />
            <div className="flex-1 flex items-center gap-1.5">
              {isValidTotal ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              )}
              <span className="text-[9px] text-theme-text-muted">Tot</span>
              <span className={cn("text-xs font-mono font-bold ml-auto", isValidTotal ? 'text-green-400' : 'text-red-400')}>
                {totalPayment.toFixed(0)}%
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
