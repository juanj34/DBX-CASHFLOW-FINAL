import { OIInputs, OIHoldAnalysis } from "../useOICalculations";
import { Currency, formatCurrency } from "../currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingUp } from "lucide-react";

interface CompactInvestmentSnapshotProps {
  inputs: OIInputs;
  currency: Currency;
  totalMonths: number;
  totalEntryCosts: number;
  rate: number;
  unitSizeSqf?: number;
}

export const CompactInvestmentSnapshot = ({ 
  inputs, 
  currency, 
  totalMonths, 
  totalEntryCosts, 
  rate, 
  unitSizeSqf = 0 
}: CompactInvestmentSnapshotProps) => {
  const { t } = useLanguage();
  
  const pricePerSqft = unitSizeSqf > 0 ? inputs.basePrice / unitSizeSqf : 0;
  
  const { basePrice, downpaymentPercent, preHandoverPercent, additionalPayments, bookingMonth, bookingYear, handoverQuarter, handoverYear, oqoodFee } = inputs;
  
  const dldFee = basePrice * 0.04;
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const amountUntilSPA = downpaymentAmount + dldFee + oqoodFee;
  const additionalTotal = additionalPayments.reduce((sum, p) => sum + (basePrice * p.paymentPercent / 100), 0);
  const handoverPercent = 100 - preHandoverPercent;
  const handoverAmount = basePrice * handoverPercent / 100;
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Calculate percentages for visual bar
  const totalPreHandover = amountUntilSPA + additionalTotal;
  const bookingPercent = (amountUntilSPA / basePrice) * 100;
  const constructionPercent = (additionalTotal / basePrice) * 100;
  const handoverBarPercent = (handoverAmount / basePrice) * 100;

  return (
    <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden h-fit">
      <div className="p-3 border-b border-theme-border flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-theme-accent" />
        <h3 className="font-semibold text-theme-text text-sm">{t('investmentSnapshot')}</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Top metrics grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-theme-text-muted mb-1">{t('basePropertyPrice')}</p>
            <p className="text-sm font-bold text-theme-text font-mono">{formatCurrency(basePrice, currency, rate)}</p>
            {pricePerSqft > 0 && (
              <p className="text-[10px] text-theme-text-muted font-mono">{formatCurrency(pricePerSqft, currency, rate)}/sqft</p>
            )}
          </div>
          
          <div>
            <p className="text-[10px] uppercase tracking-wide text-theme-text-muted mb-1">{t('paymentPlan')}</p>
            <p className="text-sm font-bold text-theme-accent font-mono">{preHandoverPercent}/{handoverPercent}</p>
          </div>
          
          <div>
            <p className="text-[10px] uppercase tracking-wide text-theme-text-muted mb-1">{t('constructionPeriod')}</p>
            <p className="text-sm font-bold text-theme-text font-mono">{totalMonths} {t('months')}</p>
          </div>
          
          <div>
            <p className="text-[10px] uppercase tracking-wide text-theme-text-muted mb-1">Timeline</p>
            <p className="text-sm font-bold text-theme-text font-mono">
              {monthNames[bookingMonth - 1]} {bookingYear} → Q{handoverQuarter} {handoverYear}
            </p>
          </div>
        </div>

        {/* Payment breakdown visual bar */}
        <div className="space-y-2">
          <div className="flex items-center h-6 rounded-lg overflow-hidden bg-theme-bg">
            <div 
              className="h-full bg-theme-accent flex items-center justify-center"
              style={{ width: `${bookingPercent}%` }}
            >
              {bookingPercent > 10 && <span className="text-[9px] font-bold text-theme-bg">{Math.round(bookingPercent)}%</span>}
            </div>
            <div 
              className="h-full bg-theme-accent/50 flex items-center justify-center"
              style={{ width: `${constructionPercent}%` }}
            >
              {constructionPercent > 10 && <span className="text-[9px] font-bold text-theme-bg">{Math.round(constructionPercent)}%</span>}
            </div>
            <div 
              className="h-full bg-cyan-500 flex items-center justify-center"
              style={{ width: `${handoverBarPercent}%` }}
            >
              {handoverBarPercent > 10 && <span className="text-[9px] font-bold text-theme-bg">{Math.round(handoverBarPercent)}%</span>}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-theme-accent" />
                <p className="text-[10px] text-theme-text-muted">{t('amountUntilSPA')}</p>
              </div>
              <p className="text-xs font-bold text-theme-accent font-mono">{formatCurrency(amountUntilSPA, currency, rate)}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-theme-accent/50" />
                <p className="text-[10px] text-theme-text-muted">{t('amountDuringConstruction')}</p>
              </div>
              <p className="text-xs font-bold text-theme-text font-mono">{formatCurrency(additionalTotal, currency, rate)}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <p className="text-[10px] text-theme-text-muted">{t('amountAtHandover')}</p>
              </div>
              <p className="text-xs font-bold text-cyan-400 font-mono">{formatCurrency(handoverAmount, currency, rate)}</p>
            </div>
          </div>
        </div>

        {/* Entry costs */}
        <div className="flex items-center justify-between pt-2 border-t border-theme-border">
          <span className="text-xs text-theme-text-muted">{t('totalEntryCosts')}</span>
          <span className="text-xs text-red-400 font-mono font-medium">-{formatCurrency(totalEntryCosts, currency, rate)}</span>
        </div>
      </div>
    </div>
  );
};
