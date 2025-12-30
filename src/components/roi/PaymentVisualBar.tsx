import { OIInputs } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";

interface PaymentVisualBarProps {
  inputs: OIInputs;
  currency: Currency;
  rate: number;
  accentColor?: string;
}

export const PaymentVisualBar = ({ inputs, currency, rate, accentColor = '#CCFF00' }: PaymentVisualBarProps) => {
  const { t } = useLanguage();
  const { basePrice, downpaymentPercent, preHandoverPercent } = inputs;

  // Calculate percentages
  const installmentsPercent = preHandoverPercent - downpaymentPercent;
  const handoverPercent = 100 - preHandoverPercent;

  // Calculate amounts
  const downpaymentAmount = basePrice * (downpaymentPercent / 100);
  const installmentsAmount = basePrice * (installmentsPercent / 100);
  const handoverAmount = basePrice * (handoverPercent / 100);

  // Payment plan label (e.g., "30/70", "50/50")
  const paymentPlanLabel = `${Math.round(preHandoverPercent)}/${Math.round(handoverPercent)}`;

  return (
    <div className="space-y-3">
      {/* Header with payment plan label */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-theme-text-muted uppercase tracking-wide">
          {t('paymentStructureLabel') || 'Payment Structure'}
        </span>
        <span 
          className="text-xs px-2 py-0.5 rounded-full font-bold"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {paymentPlanLabel}
        </span>
      </div>

      {/* Visual bar */}
      <div className="h-12 rounded-xl overflow-hidden flex shadow-inner">
        {/* Downpayment segment */}
        <div 
          className="flex items-center justify-center text-xs font-semibold transition-all"
          style={{ 
            width: `${downpaymentPercent}%`,
            backgroundColor: accentColor,
            color: '#000',
            minWidth: downpaymentPercent > 5 ? 'auto' : '24px',
            borderRight: '2px solid rgba(255,255,255,0.3)',
          }}
        >
          {downpaymentPercent > 8 ? `${downpaymentPercent}%` : ''}
        </div>
        
        {/* Installments segment - using distinct slate color for contrast */}
        {installmentsPercent > 0 && (
          <div 
            className="flex items-center justify-center text-xs font-semibold transition-all bg-slate-500"
            style={{ 
              width: `${installmentsPercent}%`,
              color: '#fff',
              minWidth: installmentsPercent > 5 ? 'auto' : '24px',
              borderRight: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            {installmentsPercent > 8 ? `${installmentsPercent}%` : ''}
          </div>
        )}
        
        {/* Handover segment */}
        <div 
          className="flex items-center justify-center text-xs font-semibold bg-theme-bg text-theme-text-muted border-l border-theme-border/30 transition-all"
          style={{ width: `${handoverPercent}%` }}
        >
          {handoverPercent > 8 ? `${handoverPercent}%` : ''}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span 
              className="w-3 h-3 rounded-sm flex-shrink-0" 
              style={{ backgroundColor: accentColor }} 
            />
            <span className="text-theme-text-muted truncate">{t('entryLabel') || 'Entry'}</span>
          </div>
          <span className="text-theme-text font-mono font-medium pl-4">
            {formatCurrency(downpaymentAmount, currency, rate)}
          </span>
        </div>
        
        {installmentsPercent > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm flex-shrink-0 bg-slate-500" />
              <span className="text-theme-text-muted truncate">{t('journeyLabel') || 'Journey'}</span>
            </div>
            <span className="text-theme-text font-mono font-medium pl-4">
              {formatCurrency(installmentsAmount, currency, rate)}
            </span>
          </div>
        )}
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-theme-bg border border-theme-border flex-shrink-0" />
            <span className="text-theme-text-muted truncate">{t('completionLabel') || 'Completion'}</span>
          </div>
          <span className="text-theme-text font-mono font-medium pl-4">
            {formatCurrency(handoverAmount, currency, rate)}
          </span>
        </div>
      </div>
    </div>
  );
};