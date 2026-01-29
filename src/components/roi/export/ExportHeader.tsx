import { Currency, formatCurrency } from '../currencyUtils';
import { ClientUnitData } from '../ClientUnitInfo';

interface ExportHeaderProps {
  clientInfo: ClientUnitData;
  basePrice: number;
  pricePerSqft: number;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

export const ExportHeader = ({
  clientInfo,
  basePrice,
  pricePerSqft,
  currency,
  rate,
  language,
}: ExportHeaderProps) => {
  const today = new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const t = {
    investmentAnalysis: language === 'es' ? 'Análisis de Inversión' : 'Investment Analysis',
    by: language === 'es' ? 'por' : 'by',
    unit: language === 'es' ? 'Unidad' : 'Unit',
    client: language === 'es' ? 'Cliente' : 'Client',
  };

  const formatValue = (value: number) => {
    const aed = formatCurrency(value, 'AED', 1);
    if (currency === 'AED') return aed;
    const converted = formatCurrency(value, currency, rate);
    return `${aed} (${converted})`;
  };

  return (
    <div 
      className="flex items-center justify-between pb-4 mb-4 border-b-2"
      style={{ borderColor: 'hsl(var(--theme-border))' }}
    >
      {/* Left: Project Info */}
      <div className="flex flex-col gap-1">
        <h1 
          className="text-xl font-bold"
          style={{ 
            color: 'hsl(var(--theme-text))',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          {clientInfo.projectName || t.investmentAnalysis}
        </h1>
        <div 
          className="flex items-center gap-3 text-sm"
          style={{ color: 'hsl(var(--theme-text-muted))' }}
        >
          {clientInfo.developer && (
            <span>{t.by} {clientInfo.developer}</span>
          )}
          {clientInfo.unitType && (
            <>
              <span>•</span>
              <span>{clientInfo.unitType}</span>
            </>
          )}
          {clientInfo.unit && (
            <>
              <span>•</span>
              <span>{t.unit} {clientInfo.unit}</span>
            </>
          )}
        </div>
      </div>

      {/* Center: Price */}
      <div className="flex flex-col items-center gap-0.5">
        <span 
          className="text-2xl font-bold font-mono"
          style={{ 
            color: 'hsl(var(--primary))',
            fontFeatureSettings: '"tnum"'
          }}
        >
          {formatValue(basePrice)}
        </span>
        <span 
          className="text-xs"
          style={{ color: 'hsl(var(--theme-text-muted))' }}
        >
          {formatCurrency(pricePerSqft, 'AED', 1)}/sqft
          {clientInfo.unitSizeSqf ? ` • ${clientInfo.unitSizeSqf.toLocaleString()} sqft` : ''}
        </span>
      </div>

      {/* Right: Client + Date */}
      <div className="flex flex-col items-end gap-1">
        {clientInfo.clientName && (
          <span 
            className="text-sm font-medium"
            style={{ color: 'hsl(var(--theme-text))' }}
          >
            {t.client}: {clientInfo.clientName}
          </span>
        )}
        <span 
          className="text-xs"
          style={{ color: 'hsl(var(--theme-text-muted))' }}
        >
          {today}
        </span>
      </div>
    </div>
  );
};
