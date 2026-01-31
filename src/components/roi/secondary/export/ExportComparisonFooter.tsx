import { format } from 'date-fns';

interface ExportComparisonFooterProps {
  language: 'en' | 'es';
}

/**
 * ExportComparisonFooter - Static footer for comparison PDF/PNG exports
 * No animations, fixed dimensions for html2canvas capture
 */
export const ExportComparisonFooter = ({ language }: ExportComparisonFooterProps) => {
  const t = language === 'es' ? {
    disclaimer: 'Proyecciones basadas en rendimiento histórico. Los resultados reales pueden variar. Consulte con un asesor financiero.',
    poweredBy: 'Powered by',
  } : {
    disclaimer: 'Projections based on historical performance. Actual results may vary. Consult with a financial advisor.',
    poweredBy: 'Powered by',
  };

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid hsl(var(--theme-border))',
      }}
    >
      {/* Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span 
          style={{
            fontSize: '12px',
            color: 'hsl(var(--theme-text-muted))',
          }}
        >
          {t.poweredBy}
        </span>
        <span 
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'hsl(var(--theme-accent))',
          }}
        >
          DBX Prime
        </span>
      </div>

      {/* Disclaimer */}
      <div 
        style={{
          fontSize: '10px',
          color: 'hsl(var(--theme-text-muted))',
          maxWidth: '500px',
          textAlign: 'center',
        }}
      >
        {t.disclaimer}
      </div>

      {/* Generation timestamp */}
      <div 
        style={{
          fontSize: '11px',
          color: 'hsl(var(--theme-text-muted))',
        }}
      >
        {format(new Date(), 'MMM d, yyyy HH:mm')}
      </div>
    </div>
  );
};
