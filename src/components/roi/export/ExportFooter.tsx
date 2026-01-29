import { format } from 'date-fns';

interface ExportFooterProps {
  generatedAt: Date;
  language: 'en' | 'es';
}

/**
 * ExportFooter - Static footer for PDF/PNG exports
 * No animations, fixed dimensions for html2canvas capture
 */
export const ExportFooter = ({ generatedAt, language }: ExportFooterProps) => {
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
          Powered by
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
          maxWidth: '400px',
          textAlign: 'center',
        }}
      >
        {language === 'es' 
          ? 'Proyecciones basadas en rendimiento histórico. Los resultados reales pueden variar.'
          : 'Projections based on historical performance. Actual results may vary.'}
      </div>

      {/* Generation timestamp */}
      <div 
        style={{
          fontSize: '11px',
          color: 'hsl(var(--theme-text-muted))',
        }}
      >
        {format(generatedAt, 'MMM d, yyyy HH:mm')}
      </div>
    </div>
  );
};
