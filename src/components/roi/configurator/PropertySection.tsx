import { useState, useEffect, useRef } from "react";
import { AlertCircle, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfiguratorSectionProps, months, quarters, years } from "./types";
import { formatCurrency, DEFAULT_RATE } from "../currencyUtils";
import { InfoTooltip } from "../InfoTooltip";

export const PropertySection = ({ 
  inputs, 
  setInputs, 
  currency,
}: ConfiguratorSectionProps) => {
  const isEditingRef = useRef(false);
  
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
  const handoverQuarterMonth = (inputs.handoverQuarter - 1) * 3 + 1;
  const handoverDate = new Date(inputs.handoverYear, handoverQuarterMonth - 1);
  const isHandoverBeforeBooking = handoverDate <= bookingDate;

  return (
    <div className="space-y-3">
      {/* Key Metrics Row - Price, Price/sqft, Service Charge/sqft */}
      <div className="flex items-center justify-between gap-2 p-2 bg-theme-bg/30 rounded-lg border border-theme-border/30">
        <div className="flex items-center gap-3 text-[10px]">
          {inputs.unitSizeSqf && inputs.unitSizeSqf > 0 && (
            <div className="flex items-center gap-1 text-theme-text-muted">
              <span className="text-theme-text font-mono font-medium">{formatCurrency(inputs.basePrice / inputs.unitSizeSqf, currency)}</span>
              <span>/sqft</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-theme-text-muted">
            <DollarSign className="w-3 h-3" />
            <span className="text-cyan-400 font-mono font-medium">{inputs.serviceChargePerSqft || 18}</span>
            <span>AED/sqft</span>
            <InfoTooltip translationKey="tooltipServiceCharges" />
          </div>
        </div>
        <Input
          type="text"
          inputMode="numeric"
          value={inputs.serviceChargePerSqft || ''}
          onChange={(e) => {
            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
            setInputs(prev => ({ ...prev, serviceChargePerSqft: Math.min(Math.max(val, 0), 100) }));
          }}
          placeholder="18"
          className="w-12 h-6 text-right bg-theme-bg border-theme-border text-cyan-400 font-mono text-xs"
        />
      </div>

      {/* Base Price - Inline */}
      <div className="flex items-center justify-between gap-3 p-2.5 bg-theme-bg/50 rounded-lg border border-theme-border/50">
        <div className="flex items-center gap-1">
          <span className="text-xs text-theme-text-muted">Base Property Price</span>
          <InfoTooltip translationKey="tooltipBasePrice" />
        </div>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-text-muted text-xs">
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
            className="w-36 h-8 text-right bg-theme-bg border-theme-border text-theme-accent font-mono text-sm pl-10"
          />
        </div>
      </div>

      {/* Dates - Compact Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Booking Date */}
        <div className="p-2.5 bg-theme-bg/50 rounded-lg border border-theme-border/50">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-xs text-theme-text-muted">Booking Date</span>
            <InfoTooltip translationKey="tooltipBookingDate" />
          </div>
          <div className="flex gap-1.5">
            <Select
              value={String(inputs.bookingMonth)}
              onValueChange={(value) => setInputs(prev => ({ ...prev, bookingMonth: parseInt(value) }))}
            >
              <SelectTrigger className="flex-1 h-7 text-xs bg-theme-bg border-theme-border text-theme-text">
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
              <SelectTrigger className="w-[72px] h-7 text-xs bg-theme-bg border-theme-border text-theme-text">
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
        <div className="p-2.5 bg-theme-bg/50 rounded-lg border border-theme-border/50">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-xs text-theme-text-muted">Handover Date</span>
            <InfoTooltip translationKey="tooltipHandoverDate" />
          </div>
          <div className="flex gap-1.5">
            <Select
              value={String(inputs.handoverQuarter)}
              onValueChange={(value) => setInputs(prev => ({ ...prev, handoverQuarter: parseInt(value) }))}
            >
              <SelectTrigger className="w-16 h-7 text-xs bg-theme-bg border-theme-border text-theme-text">
                <SelectValue placeholder="Q" />
              </SelectTrigger>
              <SelectContent className="bg-theme-card border-theme-border">
                {quarters.map(q => (
                  <SelectItem key={q.value} value={String(q.value)} className="text-xs text-theme-text hover:bg-theme-border">
                    {q.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(inputs.handoverYear)}
              onValueChange={(value) => setInputs(prev => ({ ...prev, handoverYear: parseInt(value) }))}
            >
              <SelectTrigger className="flex-1 h-7 text-xs bg-theme-bg border-theme-border text-theme-text">
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
      </div>

      {/* Date validation warning */}
      {isHandoverBeforeBooking && (
        <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 px-3 py-2 rounded-md">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Handover must be after booking</span>
        </div>
      )}

      {/* Entry Costs - Compact */}
      <div className="p-2.5 bg-theme-bg/50 rounded-lg border border-theme-border/50">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs text-theme-text-muted font-medium">Entry Costs (At Booking)</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {/* EOI Fee */}
          <div>
            <div className="flex items-center gap-0.5 mb-1">
              <span className="text-[10px] text-theme-text-muted">EOI / Booking</span>
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
                className="w-full h-7 text-right bg-theme-bg border-theme-border text-theme-text font-mono text-xs pl-8"
              />
            </div>
          </div>

          {/* DLD Fee */}
          <div>
            <div className="flex items-center gap-0.5 mb-1">
              <span className="text-[10px] text-theme-text-muted">DLD (4%)</span>
              <InfoTooltip translationKey="tooltipDldFee" />
            </div>
            <div className="h-7 px-2 bg-theme-bg border border-theme-border rounded-md flex items-center justify-end">
              <span className="text-xs text-theme-text font-mono">{formatCurrency(inputs.basePrice * 0.04, currency)}</span>
            </div>
          </div>
          
          {/* Oqood Fee */}
          <div>
            <div className="flex items-center gap-0.5 mb-1">
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
                className="w-full h-7 text-right bg-theme-bg border-theme-border text-theme-text font-mono text-xs pl-8"
              />
            </div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-theme-border/50 flex justify-between items-center">
          <span className="text-[10px] text-theme-text-muted">Total Entry Cost</span>
          <span className="text-sm font-mono text-theme-accent font-semibold">
            {formatCurrency(inputs.eoiFee + (inputs.basePrice * 0.04) + inputs.oqoodFee, currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
