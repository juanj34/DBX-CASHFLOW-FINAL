import React from 'react';
import { Home, Calendar, Ruler, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../currencyUtils';
import { Currency } from '../currencyUtils';

interface AssetUnitCardProps {
  unitNumber?: string;
  unitType?: string;
  unitSizeSqf?: number;
  basePrice: number;
  pricePerSqft?: number;
  handoverQuarter?: string;
  handoverYear?: number;
  currency: Currency;
  rate: number;
  className?: string;
}

export const AssetUnitCard: React.FC<AssetUnitCardProps> = ({
  unitNumber,
  unitType,
  unitSizeSqf,
  basePrice,
  pricePerSqft,
  handoverQuarter,
  handoverYear,
  currency,
  rate,
  className,
}) => {
  const unitSizeM2 = unitSizeSqf ? Math.round(unitSizeSqf * 0.092903) : null;
  const calculatedPricePerSqft = pricePerSqft || (unitSizeSqf ? basePrice / unitSizeSqf : null);

  return (
    <div className={cn(
      "bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-5",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/10 flex items-center justify-center">
            <Home className="w-5 h-5 text-[#CCFF00]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Unit</p>
            <p className="text-lg font-bold text-white">
              {unitNumber || 'TBD'}
            </p>
          </div>
        </div>
        {unitType && (
          <span className="px-3 py-1 bg-[#CCFF00]/10 text-[#CCFF00] text-xs font-medium rounded-full">
            {unitType}
          </span>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Size */}
        {unitSizeSqf && (
          <div className="flex items-start gap-2">
            <Ruler className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Size</p>
              <p className="text-sm font-semibold text-white">
                {unitSizeSqf.toLocaleString()} sqft
              </p>
              {unitSizeM2 && (
                <p className="text-xs text-gray-500">{unitSizeM2} m²</p>
              )}
            </div>
          </div>
        )}

        {/* Handover */}
        {(handoverQuarter || handoverYear) && (
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Handover</p>
              <p className="text-sm font-semibold text-white">
                {handoverQuarter && `${handoverQuarter} `}{handoverYear || 'TBD'}
              </p>
            </div>
          </div>
        )}

        {/* Price */}
        <div className="flex items-start gap-2">
          <DollarSign className="w-4 h-4 text-gray-500 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Price</p>
            <p className="text-sm font-semibold text-[#CCFF00]">
              {formatCurrency(basePrice, currency, rate)}
            </p>
          </div>
        </div>

        {/* Price per sqft */}
        {calculatedPricePerSqft && (
          <div className="flex items-start gap-2">
            <Ruler className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Price/sqft</p>
              <p className="text-sm font-semibold text-white">
                {formatCurrency(calculatedPricePerSqft, currency, rate)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetUnitCard;
