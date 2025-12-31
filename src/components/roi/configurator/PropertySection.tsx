import { useState, useEffect } from "react";
import { AlertCircle, Image } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfiguratorSectionProps, months, quarters, years } from "./types";
import { formatCurrency, DEFAULT_RATE } from "../currencyUtils";
import { InfoTooltip } from "../InfoTooltip";
import { ImageUploadCard } from "./ImageUploadCard";

interface PropertySectionProps extends ConfiguratorSectionProps {
  floorPlanUrl?: string | null;
  buildingRenderUrl?: string | null;
  heroImageUrl?: string | null;
  onFloorPlanChange?: (file: File | null) => void;
  onBuildingRenderChange?: (file: File | null) => void;
  onHeroImageChange?: (file: File | null) => void;
  showLogoOverlay?: boolean;
  onShowLogoOverlayChange?: (show: boolean) => void;
}

export const PropertySection = ({ 
  inputs, 
  setInputs, 
  currency,
  floorPlanUrl,
  buildingRenderUrl,
  heroImageUrl,
  onFloorPlanChange,
  onBuildingRenderChange,
  onHeroImageChange,
  showLogoOverlay = true,
  onShowLogoOverlayChange,
}: PropertySectionProps) => {
  const [basePriceInput, setBasePriceInput] = useState(
    currency === 'USD' 
      ? Math.round(inputs.basePrice / DEFAULT_RATE).toString()
      : inputs.basePrice.toString()
  );

  useEffect(() => {
    setBasePriceInput(
      currency === 'USD' 
        ? Math.round(inputs.basePrice / DEFAULT_RATE).toString()
        : inputs.basePrice.toString()
    );
  }, [inputs.basePrice, currency]);

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
    }
  };

  const handleFixedFeeChange = (field: 'oqoodFee' | 'eoiFee', value: string) => {
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num) && num >= 0) {
      const aedValue = currency === 'USD' ? num * DEFAULT_RATE : num;
      setInputs(prev => ({ ...prev, [field]: aedValue }));
    }
  };

  // Date validation
  const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
  const handoverQuarterMonth = (inputs.handoverQuarter - 1) * 3 + 1;
  const handoverDate = new Date(inputs.handoverYear, handoverQuarterMonth - 1);
  const isHandoverBeforeBooking = handoverDate <= bookingDate;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Property Details</h3>
        <p className="text-sm text-theme-text-muted">Set the base price and key dates for your investment</p>
      </div>

      {/* Base Property Price */}
      <div className="space-y-3 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <label className="text-sm text-gray-300 font-medium">Base Property Price</label>
            <InfoTooltip translationKey="tooltipBasePrice" />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              {currency === 'USD' ? '$' : 'AED'}
            </span>
            <Input
              type="text"
              value={basePriceInput}
              onChange={(e) => setBasePriceInput(e.target.value)}
              onBlur={handleBasePriceBlur}
              className="w-40 h-9 text-right bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-base pl-12"
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
        <div className="text-xs text-theme-text-muted text-right">
          {formatCurrency(inputs.basePrice, currency)}
          {inputs.unitSizeSqf && inputs.unitSizeSqf > 0 && (
            <span className="ml-2 text-[10px] text-theme-text-muted">
              ({formatCurrency(inputs.basePrice / inputs.unitSizeSqf, currency)}/sqft)
            </span>
          )}
        </div>
      </div>

      {/* Dates Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Booking Date */}
        <div className="space-y-3 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
          <div className="flex items-center gap-1">
            <label className="text-sm text-gray-300 font-medium">Booking Date</label>
            <InfoTooltip translationKey="tooltipBookingDate" />
          </div>
          <div className="flex gap-2">
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
              <SelectTrigger className="w-24 bg-[#0d1117] border-[#2a3142] text-white">
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
        <div className="space-y-3 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
          <div className="flex items-center gap-1">
            <label className="text-sm text-gray-300 font-medium">Handover Date</label>
            <InfoTooltip translationKey="tooltipHandoverDate" />
          </div>
          <div className="flex gap-2">
            <Select
              value={String(inputs.handoverQuarter)}
              onValueChange={(value) => setInputs(prev => ({ ...prev, handoverQuarter: parseInt(value) }))}
            >
              <SelectTrigger className="w-24 bg-[#0d1117] border-[#2a3142] text-white">
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
        </div>
      </div>

      {/* Date validation warning */}
      {isHandoverBeforeBooking && (
        <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 px-4 py-3 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Handover date must be after booking date</span>
        </div>
      )}

      {/* Entry Costs */}
      <div className="space-y-4 p-4 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
        <label className="text-sm text-gray-300 font-medium">Entry Costs (At Booking)</label>
        
        <div className="grid grid-cols-3 gap-4">
          {/* EOI Fee */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">EOI / Booking</span>
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
                className="w-full h-8 text-right bg-[#0d1117] border-[#2a3142] text-white font-mono text-sm pl-10"
              />
            </div>
          </div>

          {/* DLD Fee */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">DLD (fixed 4%)</span>
              <InfoTooltip translationKey="tooltipDldFee" />
            </div>
            <div className="h-8 px-3 bg-[#0d1117] border border-[#2a3142] rounded-md flex items-center justify-end">
              <span className="text-sm text-white font-mono">{formatCurrency(inputs.basePrice * 0.04, currency)}</span>
            </div>
          </div>
          
          {/* Oqood Fee */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Oqood</span>
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
                className="w-full h-8 text-right bg-[#0d1117] border-[#2a3142] text-white font-mono text-sm pl-10"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#2a3142] flex justify-between items-center">
          <span className="text-sm text-gray-400">Total Entry Cost</span>
          <span className="text-lg font-mono text-[#CCFF00] font-bold">
            {formatCurrency(inputs.eoiFee + (inputs.basePrice * 0.04) + inputs.oqoodFee, currency)}
          </span>
        </div>
      </div>

      {/* Property Images Section */}
      {onFloorPlanChange && onBuildingRenderChange && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Image className="w-4 h-4 text-purple-400" />
            Property Images
          </h3>
          
          {/* Hero Image - Full Width */}
          {onHeroImageChange && (
            <ImageUploadCard
              label="Project Hero"
              sublabel="16:9 showcase background"
              imageUrl={heroImageUrl || null}
              onImageChange={onHeroImageChange}
              onRemove={() => onHeroImageChange(null)}
              aspectRatio="16/9"
              placeholder="Drag, paste (Ctrl+V), or click"
            />
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {/* Floor Plan */}
            <ImageUploadCard
              label="Floor Plan"
              sublabel="Upload unit floor plan"
              imageUrl={floorPlanUrl || null}
              onImageChange={onFloorPlanChange}
              onRemove={() => onFloorPlanChange(null)}
              aspectRatio="4/3"
              placeholder="Drag, paste (Ctrl+V), or click"
            />

            {/* Building Render */}
            <ImageUploadCard
              label="Building Render"
              sublabel="Upload project render"
              imageUrl={buildingRenderUrl || null}
              onImageChange={onBuildingRenderChange}
              onRemove={() => onBuildingRenderChange(null)}
              aspectRatio="16/9"
              placeholder="Drag, paste (Ctrl+V), or click"
            />
          </div>

          {/* Logo Overlay Toggle */}
          {buildingRenderUrl && onShowLogoOverlayChange && (
            <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#2a3142]">
              <div>
                <p className="text-sm font-medium text-white">Show Developer Logo</p>
                <p className="text-xs text-gray-500">Overlay developer logo on render</p>
              </div>
              <Switch
                checked={showLogoOverlay}
                onCheckedChange={onShowLogoOverlayChange}
                className="data-[state=checked]:bg-[#CCFF00]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
