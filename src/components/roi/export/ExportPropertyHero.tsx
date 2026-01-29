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
 * 
 * Mirrors PropertyHeroCard.tsx layout exactly:
 * - Background image with gradient overlay
 * - Row 1: Project Name + Zone
 * - Row 2: Developer • Unit • Type • Size • Clients
 * - Row 3: Price info with dual currency
 * 
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

  const t = {
    unnamedProject: language === 'es' ? 'Proyecto Sin Nombre' : 'Unnamed Project',
  };

  return (
    <div 
      style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        minHeight: '180px',
        marginBottom: '16px',
      }}
    >
      {/* Background Image Layer */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
        }}
      >
        {heroImageUrl ? (
          <>
            <img 
              src={heroImageUrl} 
              alt="Property"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Gradient overlay - matches PropertyHeroCard */}
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(13, 17, 23, 0.9), rgba(13, 17, 23, 0.5), rgba(13, 17, 23, 0.3))',
              }}
            />
          </>
        ) : (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, #1a1f2e, #0d1117, #1a1f2e)',
            }}
          />
        )}
      </div>

      {/* Content - 3 Rows like PropertyHeroCard */}
      <div 
        style={{
          position: 'relative',
          padding: '24px 20px',
          minHeight: '180px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        {/* Row 1: Project Name + Zone */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <h1 
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'white',
              margin: 0,
            }}
          >
            {clientInfo.projectName || t.unnamedProject}
          </h1>
          
          {clientInfo.zoneName && (
            <span 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
              }}
            >
              <span style={{ color: '#CCFF00' }}>📍</span>
              {clientInfo.zoneName}
            </span>
          )}
        </div>

        {/* Row 2: Developer • Unit • Type • Size • Clients */}
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
          {/* Developer */}
          {clientInfo.developer && (
            <>
              <span style={{ fontWeight: 500, color: 'white' }}>
                {clientInfo.developer}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            </>
          )}
          
          {/* Unit */}
          {clientInfo.unit && (
            <>
              <span style={{ color: 'white' }}>{clientInfo.unit}</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            </>
          )}
          
          {/* Type + Bedrooms */}
          {unitTypeLabel && (
            <>
              <span style={{ color: 'white' }}>
                {unitTypeLabel}
                {clientInfo.bedrooms && ` ${clientInfo.bedrooms}BR`}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            </>
          )}
          
          {/* Size */}
          {clientInfo.unitSizeSqf > 0 && (
            <>
              <span style={{ color: 'white' }}>
                {clientInfo.unitSizeSqf.toLocaleString()} sqf
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            </>
          )}
          
          {/* Clients */}
          {clients.length > 0 && (
            <span style={{ color: 'white' }}>
              {clients.map(c => c.name).join(', ')}
            </span>
          )}
        </div>

        {/* Row 3: Price Info with dual currency */}
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
              <span style={{ color: 'white', fontWeight: 600, fontSize: '16px' }}>
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
