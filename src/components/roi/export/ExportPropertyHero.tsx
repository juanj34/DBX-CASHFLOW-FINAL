import { ClientUnitData } from '../ClientUnitInfo';
import { Currency, formatDualCurrency } from '../currencyUtils';
import { UNIT_TYPES } from '../ClientUnitModal';

interface ExportPropertyHeroProps {
  clientInfo: ClientUnitData;
  heroImageUrl: string | null;
  basePrice: number;
  pricePerSqft: number;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}

/**
 * ExportPropertyHero - Static property hero card for PDF/PNG exports
 * No animations, fixed dimensions for html2canvas capture
 */
export const ExportPropertyHero = ({
  clientInfo,
  heroImageUrl,
  basePrice,
  pricePerSqft,
  currency,
  rate,
  language,
}: ExportPropertyHeroProps) => {
  const unitType = UNIT_TYPES.find(u => u.value === clientInfo.unitType);
  const unitTypeLabel = unitType 
    ? (language === 'es' ? unitType.labelEs : unitType.labelEn)
    : '';

  const clients = clientInfo.clients?.length > 0 
    ? clientInfo.clients 
    : clientInfo.clientName 
      ? [{ id: '1', name: clientInfo.clientName, country: clientInfo.clientCountry || '' }]
      : [];

  return (
    <div 
      style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        minHeight: '160px',
        marginBottom: '16px',
      }}
    >
      {/* Background */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: heroImageUrl 
            ? `linear-gradient(to top, rgba(13, 17, 23, 0.9), rgba(13, 17, 23, 0.5), rgba(13, 17, 23, 0.3)), url(${heroImageUrl})`
            : 'linear-gradient(to right, #1a1f2e, #0d1117, #1a1f2e)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Content */}
      <div 
        style={{
          position: 'relative',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          minHeight: '160px',
        }}
      >
        {/* Project Name */}
        <h1 
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'white',
            marginBottom: '12px',
          }}
        >
          {clientInfo.projectName || 'Investment Property'}
        </h1>

        {/* Details Row */}
        <div 
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '16px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          {clientInfo.developer && (
            <>
              <span style={{ fontWeight: 500, color: 'white' }}>
                {clientInfo.developer}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            </>
          )}
          {clientInfo.unit && (
            <>
              <span style={{ color: 'white' }}>{clientInfo.unit}</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            </>
          )}
          {unitTypeLabel && (
            <>
              <span style={{ color: 'white' }}>
                {unitTypeLabel}
                {clientInfo.bedrooms && ` ${clientInfo.bedrooms}BR`}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            </>
          )}
          {clientInfo.unitSizeSqf > 0 && (
            <>
              <span style={{ color: 'white' }}>
                {clientInfo.unitSizeSqf.toLocaleString()} sqf
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            </>
          )}
          {clients.length > 0 && (
            <span style={{ color: 'white' }}>
              {clients.map(c => c.name).join(', ')}
            </span>
          )}
        </div>

        {/* Price Row */}
        {basePrice > 0 && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'white', fontWeight: 600 }}>
                {formatDualCurrency(basePrice, currency, rate).primary}
              </span>
              {formatDualCurrency(basePrice, currency, rate).secondary && (
                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                  ({formatDualCurrency(basePrice, currency, rate).secondary})
                </span>
              )}
            </div>
            {pricePerSqft > 0 && (
              <>
                <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                  {formatDualCurrency(pricePerSqft, currency, rate).primary}/sqft
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
