import { User } from 'lucide-react';
import { format } from 'date-fns';

interface BrokerInfo {
  fullName: string | null;
  avatarUrl: string | null;
  businessEmail: string | null;
}

interface ExportBrokerHeaderProps {
  brokerInfo: BrokerInfo;
  language: 'en' | 'es';
}

/**
 * ExportBrokerHeader - Static broker header for PDF/PNG exports
 * No animations, fixed dimensions for html2canvas capture
 */
export const ExportBrokerHeader = ({ brokerInfo, language }: ExportBrokerHeaderProps) => {
  const initials = brokerInfo.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'IA';

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid hsl(var(--theme-border))',
      }}
    >
      {/* Left: Broker Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {brokerInfo.avatarUrl ? (
          <img 
            src={brokerInfo.avatarUrl} 
            alt={brokerInfo.fullName || 'Advisor'}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'hsl(var(--theme-accent) / 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--theme-accent))',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {initials}
          </div>
        )}
        <div>
          <p style={{ 
            fontWeight: 600, 
            color: 'hsl(var(--theme-text))',
            margin: 0,
            fontSize: '14px',
          }}>
            {brokerInfo.fullName || 'Investment Advisor'}
          </p>
          {brokerInfo.businessEmail && (
            <p style={{ 
              fontSize: '12px', 
              color: 'hsl(var(--theme-text-muted))',
              margin: 0,
            }}>
              {brokerInfo.businessEmail}
            </p>
          )}
        </div>
      </div>

      {/* Right: Generation Date */}
      <div style={{ textAlign: 'right' }}>
        <p style={{ 
          fontSize: '11px', 
          color: 'hsl(var(--theme-text-muted))',
          margin: 0,
        }}>
          {language === 'es' ? 'Generado' : 'Generated'}
        </p>
        <p style={{ 
          fontSize: '13px', 
          color: 'hsl(var(--theme-text))',
          margin: 0,
          fontWeight: 500,
        }}>
          {format(new Date(), 'MMM d, yyyy')}
        </p>
      </div>
    </div>
  );
};
