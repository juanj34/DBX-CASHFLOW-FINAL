import { Building2, BedDouble, Ruler, DollarSign } from "lucide-react";
import { ClientUnitData } from "@/components/roi/ClientUnitInfo";
import { Currency, formatCurrency } from "@/components/roi/currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";

interface OnionHeaderProps {
  clientInfo: ClientUnitData;
  basePrice: number;
  currency: Currency;
  rate: number;
  unitSizeSqf?: number;
}

export const OnionHeader = ({
  clientInfo,
  basePrice,
  currency,
  rate,
  unitSizeSqf,
}: OnionHeaderProps) => {
  const { t } = useLanguage();
  const size = unitSizeSqf || clientInfo.unitSizeSqf || 0;
  const pricePerSqf = size > 0 ? basePrice / size : 0;

  return (
    <div className="bg-theme-card rounded-xl border border-theme-border p-4 mb-2">
      {/* Developer + Project */}
      <div className="mb-3">
        {clientInfo.developer && (
          <p className="text-[10px] uppercase tracking-wider text-theme-text-muted font-medium">
            {clientInfo.developer}
          </p>
        )}
        <h2 className="text-base font-semibold text-theme-text leading-tight">
          {clientInfo.projectName || t('untitledProject')}
        </h2>
      </div>

      {/* Unit details row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-theme-text-muted">
        {clientInfo.unitType && (
          <div className="flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5" />
            <span>{clientInfo.unitType}</span>
          </div>
        )}
        {clientInfo.unit && (
          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>{clientInfo.unit}</span>
          </div>
        )}
        {size > 0 && (
          <div className="flex items-center gap-1">
            <Ruler className="w-3.5 h-3.5" />
            <span>{size.toLocaleString()} sqft</span>
          </div>
        )}
      </div>

      {/* Price */}
      {basePrice > 0 && (
        <div className="mt-3 pt-3 border-t border-theme-border flex items-baseline justify-between">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-theme-accent" />
            <span className="text-lg font-bold text-theme-text font-mono">
              {formatCurrency(basePrice, currency, rate)}
            </span>
          </div>
          {pricePerSqf > 0 && (
            <span className="text-xs text-theme-text-muted font-mono">
              {formatCurrency(pricePerSqf, currency, rate)}/sqft
            </span>
          )}
        </div>
      )}
    </div>
  );
};
