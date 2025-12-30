import { useLanguage } from "@/contexts/LanguageContext";
import { CreditCard } from "lucide-react";

interface PaymentPlanBadgeProps {
  preHandoverPercent: number;
  handoverPercent: number;
  constructionMonths: number;
  accentColor?: string;
}

export const PaymentPlanBadge = ({ 
  preHandoverPercent, 
  handoverPercent, 
  constructionMonths,
  accentColor = '#CCFF00' 
}: PaymentPlanBadgeProps) => {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-theme-border bg-gradient-to-br from-theme-card to-theme-bg p-4">
      {/* Background decoration */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
        style={{ backgroundColor: accentColor }}
      />
      
      <div className="relative flex items-center justify-between gap-4">
        {/* Left: Icon and label */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <CreditCard className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-theme-text uppercase tracking-wide">
              {t('paymentPlanLabel')}
            </h3>
            <p className="text-xs text-theme-text-muted">
              {constructionMonths} {t('monthsLabel')} {t('constructionPeriod').toLowerCase()}
            </p>
          </div>
        </div>
        
        {/* Right: Large split numbers */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div 
              className="text-3xl font-bold tracking-tight"
              style={{ color: accentColor }}
            >
              {Math.round(preHandoverPercent)}
            </div>
            <div className="text-[10px] text-theme-text-muted uppercase tracking-wider">
              {t('preHandoverLabel')}
            </div>
          </div>
          
          <div className="text-2xl font-light text-theme-text-muted">/</div>
          
          <div className="text-left">
            <div className="text-3xl font-bold text-theme-text tracking-tight">
              {Math.round(handoverPercent)}
            </div>
            <div className="text-[10px] text-theme-text-muted uppercase tracking-wider">
              {t('atHandoverTimelineLabel')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};