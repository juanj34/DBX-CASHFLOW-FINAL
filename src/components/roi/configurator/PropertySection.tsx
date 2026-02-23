import { useState, useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfiguratorSectionProps, months, years } from "./types";
import { formatCurrency, formatDualCurrency, DEFAULT_RATE } from "../currencyUtils";
import { InfoTooltip } from "../InfoTooltip";

// Helper to display dual currency inline
const DualDisplay = ({ value, currency, rate }: { value: number; currency: string; rate: number }) => {
  if (currency === 'AED') {
    return <span className="text-theme-accent font-mono">{formatCurrency(value, 'AED' as any)}</span>;
  }
  const dual = formatDualCurrency(value, currency as any, rate);
  return (
    <span className="text-theme-accent font-mono">
      {dual.primary}
      {dual.secondary && <span className="text-theme-text-muted text-xs ml-1">({dual.secondary})</span>}
    </span>
  );
};

export const PropertySection = ({ 
  inputs, 
  setInputs, 
  currency,
}: ConfiguratorSectionProps) => {
  const isEditingRef = useRef(false);
  const rate = DEFAULT_RATE; // Would come from context in full implementation
  
  const [basePriceInput, setBasePriceInput] = useState(
    currency === 'USD' 
      ? Math.round(inputs.basePrice / DEFAULT_RATE).toLocaleString()
      : inputs.basePrice.toLocaleString()
  );

  const [eoiInput, setEoiInput] = useState(
    (currency === 'USD' 
      ? Math.round(inputs.eoiFee / DEFAULT_RATE) 
      : inputs.eoiFee
    ).toLocaleString()
  );

  const [oqoodInput, setOqoodInput] = useState(
    (currency === 'USD' 
      ? Math.round(inputs.oqoodFee / DEFAULT_RATE) 
      : inputs.oqoodFee
    ).toLocaleString()
  );

  useEffect(() => {
    if (isEditingRef.current) return;
    
    setBasePriceInput(
      currency === 'USD' 
        ? Math.round(inputs.basePrice / DEFAULT_RATE).toLocaleString()
        : inputs.basePrice.toLocaleString()
    );
  }, [inputs.basePrice, currency]);

  useEffect(() => {
    setEoiInput(
      (currency === 'USD' 
        ? Math.round(inputs.eoiFee / DEFAULT_RATE) 
        : inputs.eoiFee
      ).toLocaleString()
    );
  }, [inputs.eoiFee, currency]);

  useEffect(() => {
    setOqoodInput(
      (currency === 'USD' 
        ? Math.round(inputs.oqoodFee / DEFAULT_RATE) 
        : inputs.oqoodFee
      ).toLocaleString()
    );
  }, [inputs.oqoodFee, currency]);

  const handleBasePriceBlur = () => {
    const cleanedValue = basePriceInput.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleanedValue);
    
    if (!cleanedValue || isNaN(num) || num <= 0) {
      setBasePriceInput(
        currency === 'USD' 
          ? Math.round(inputs.basePrice / DEFAULT_RATE).toLocaleString()
          : inputs.basePrice.toLocaleString()
      );
      return;
    }
    
    const aedValue = currency === 'USD' ? num * DEFAULT_RATE : num;
    const clamped = Math.min(Math.max(aedValue, 500000), 50000000);
    setInputs(prev => ({ ...prev, basePrice: clamped }));
    setBasePriceInput(
      currency === 'USD' 
        ? Math.round(clamped / DEFAULT_RATE).toLocaleString()
        : clamped.toLocaleString()
    );
  };

  const handleFixedFeeChange = (field: 'oqoodFee' | 'eoiFee', value: string) => {
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num) && num >= 0) {
      const aedValue = currency === 'USD' ? num * DEFAULT_RATE : num;
      setInputs(prev => ({ ...prev, [field]: aedValue }));
      const formatted = (currency === 'USD' ? Math.round(num) : num).toLocaleString();
      if (field === 'eoiFee') setEoiInput(formatted);
      if (field === 'oqoodFee') setOqoodInput(formatted);
    }
  };

  const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
  const handoverDate = new Date(inputs.handoverYear, inputs.handoverMonth - 1);
  const isHandoverBeforeBooking = handoverDate <= bookingDate;

  const totalEntry = inputs.eoiFee + (inputs.basePrice * 0.04) + inputs.oqoodFee;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-semibold text-theme-text">Property Details</h3>
      </div>
      
      {/* Base Price - Grouped */}
      <div className="p-3 bg-theme-bg/50 rounded-lg space-y-2">
        <div className="flex items-center gap-1">
          <label className="text-xs font-medium text-theme-text-muted uppercase tracking-wide">
            Base Price
          </label>
          <InfoTooltip translationKey="tooltipBasePrice" />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted text-sm">
              {currency === 'USD' ? '$' : 'AED'}
            </span>
            <Input
              type="text"
              value={basePriceInput}
              onChange={(e) => {
                isEditingRef.current = true;
                setBasePriceInput(e.target.value.replace(/,/g, ''));
              }}
              onBlur={() => {
                isEditingRef.current = false;
                handleBasePriceBlur();
              }}
              className="h-10 text-right bg-theme-bg border-theme-border text-theme-accent font-mono text-lg pl-14 pr-3"
            />
          </div>
        </div>
        {/* Price per sqft + dual currency */}
        <div className="flex items-center justify-between text-xs">
          {inputs.unitSizeSqf && inputs.unitSizeSqf > 0 && (
            <span className="text-theme-text-muted">
              <DualDisplay value={inputs.basePrice / inputs.unitSizeSqf} currency={currency} rate={rate} />
              <span className="ml-1">/sqft</span>
            </span>
          )}
          {currency !== 'AED' && (
            <span className="text-theme-text-muted">
              ≈ {formatCurrency(inputs.basePrice, currency as any, rate)}
            </span>
          )}
        </div>
      </div>

      {/* Dates - Compact Grid */}
      <div className="p-3 bg-theme-bg/50 rounded-lg space-y-3">
        {/* Booking Date */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 w-20 shrink-0">
            <label className="text-xs font-medium text-theme-text-muted uppercase tracking-wide">
              Booking
            </label>
            <InfoTooltip translationKey="tooltipBookingDate" />
          </div>
          <div className="flex gap-2 flex-1">
            <Select
              value={String(inputs.bookingMonth)}
              onValueChange={(value) => setInputs(prev => ({ ...prev, bookingMonth: parseInt(value) }))}
            >
              <SelectTrigger className="flex-1 h-8 text-xs bg-theme-bg border-theme-border text-theme-text">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border">
                {months.map(m => (
                  <SelectItem key={m.value} value={String(m.value)} className="text-xs text-theme-text hover:bg-theme-border">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(inputs.bookingYear)}
              onValueChange={(value) => setInputs(prev => ({ ...prev, bookingYear: parseInt(value) }))}
            >
              <SelectTrigger className="w-20 h-8 text-xs bg-theme-bg border-theme-border text-theme-text">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border">
                {years.map(y => (
                  <SelectItem key={y} value={String(y)} className="text-xs text-theme-text hover:bg-theme-border">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Handover Date */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 w-20 shrink-0">
            <label className="text-xs font-medium text-theme-text-muted uppercase tracking-wide">
              Handover
            </label>
            <InfoTooltip translationKey="tooltipHandoverDate" />
          </div>
          <div className="flex gap-2 flex-1">
            <Select
              value={String(inputs.handoverMonth)}
              onValueChange={(value) => setInputs(prev => ({ ...prev, handoverMonth: parseInt(value) }))}
            >
              <SelectTrigger className="flex-1 h-8 text-xs bg-theme-bg border-theme-border text-theme-text">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border">
                {months.map(m => (
                  <SelectItem key={m.value} value={String(m.value)} className="text-xs text-theme-text hover:bg-theme-border">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(inputs.handoverYear)}
              onValueChange={(value) => setInputs(prev => ({ ...prev, handoverYear: parseInt(value) }))}
            >
              <SelectTrigger className="flex-1 h-8 text-xs bg-theme-bg border-theme-border text-theme-text">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border">
                {years.map(y => (
                  <SelectItem key={y} value={String(y)} className="text-xs text-theme-text hover:bg-theme-border">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date validation warning */}
        {isHandoverBeforeBooking && (
          <div className="flex items-center gap-2 text-amber-500 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Handover must be after booking</span>
          </div>
        )}
      </div>

      {/* Entry Costs - Compact Grid */}
      <div className="p-3 bg-theme-bg/50 rounded-lg space-y-3">
        <label className="text-xs font-medium text-theme-text-muted uppercase tracking-wide">
          Entry Costs
        </label>
        
        <div className="grid grid-cols-3 gap-2">
          {/* EOI Fee */}
          <div className="space-y-1">
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-theme-text-muted">EOI</span>
              <InfoTooltip translationKey="tooltipEoiFee" />
            </div>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-theme-text-muted text-[10px]">
                {currency === 'USD' ? '$' : 'AED'}
              </span>
              <Input
                type="text"
                value={eoiInput}
                onChange={(e) => setEoiInput(e.target.value.replace(/,/g, ''))}
                onBlur={() => handleFixedFeeChange('eoiFee', eoiInput)}
                className="w-full h-8 text-right bg-theme-bg border-theme-border text-theme-text font-mono text-xs pl-8"
              />
            </div>
          </div>

          {/* DLD Fee */}
          <div className="space-y-1">
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-theme-text-muted">DLD 4%</span>
              <InfoTooltip translationKey="tooltipDldFee" />
            </div>
            <div className="h-8 px-2 bg-theme-bg/50 border border-theme-border/50 rounded-md flex items-center justify-end">
              <span className="text-xs text-theme-text font-mono">{formatCurrency(inputs.basePrice * 0.04, currency as any)}</span>
            </div>
          </div>
          
          {/* Oqood Fee */}
          <div className="space-y-1">
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-theme-text-muted">Oqood</span>
              <InfoTooltip translationKey="tooltipOqoodFee" />
            </div>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-theme-text-muted text-[10px]">
                {currency === 'USD' ? '$' : 'AED'}
              </span>
              <Input
                type="text"
                value={oqoodInput}
                onChange={(e) => setOqoodInput(e.target.value.replace(/,/g, ''))}
                onBlur={() => handleFixedFeeChange('oqoodFee', oqoodInput)}
                className="w-full h-8 text-right bg-theme-bg border-theme-border text-theme-text font-mono text-xs pl-8"
              />
            </div>
          </div>
        </div>

        {/* Total Entry Cost with dual currency */}
        <div className="flex justify-between items-center pt-2 border-t border-theme-border/20">
          <span className="text-xs text-theme-text-muted">Total Entry</span>
          <DualDisplay value={totalEntry} currency={currency} rate={rate} />
        </div>
      </div>
    </div>
  );
};
