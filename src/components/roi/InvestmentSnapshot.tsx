import { OIInputs, OIHoldAnalysis } from "./useOICalculations";
import { Currency, formatCurrency } from "./currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingUp, Calendar, CreditCard, Home, Banknote } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";
import { useBreakpoint } from "@/hooks/use-breakpoint";

interface InvestmentSnapshotProps {
  inputs: OIInputs;
  currency: Currency;
  totalMonths: number;
  totalEntryCosts: number;
  rate: number;
  holdAnalysis?: OIHoldAnalysis;
  unitSizeSqf?: number;
}

export const InvestmentSnapshot = ({ inputs, currency, totalMonths, totalEntryCosts, rate, unitSizeSqf = 0 }: InvestmentSnapshotProps) => {
  const { t } = useLanguage();
  const { isDesktop } = useBreakpoint();
  
  // Calculate price per sqft
  const pricePerSqft = unitSizeSqf > 0 ? inputs.basePrice / unitSizeSqf : 0;
  
  const { basePrice, downpaymentPercent, preHandoverPercent, additionalPayments, bookingMonth, bookingYear, handoverQuarter, handoverYear, oqoodFee } = inputs;
  
  // DLD is 4%
  const dldFee = basePrice * 0.04;
  
  // Calculate amounts
  const downpaymentAmount = basePrice * downpaymentPercent / 100;
  const amountUntilSPA = downpaymentAmount + dldFee + oqoodFee; // What's paid at booking
  
  // Additional payments during construction
  const additionalTotal = additionalPayments.reduce((sum, p) => sum + (basePrice * p.paymentPercent / 100), 0);
  
  // Handover amount
  const handoverPercent = 100 - preHandoverPercent;
  const handoverAmount = basePrice * handoverPercent / 100;
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden h-fit">
      <div className="p-4 border-b border-theme-border flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-theme-accent" />
        <h3 className="font-semibold text-theme-text">{t('investmentSnapshot')}</h3>
      </div>

      <div className="p-4 space-y-3">
        {/* Top Section - Grid on desktop for key metrics */}
        <div className={isDesktop ? "grid grid-cols-2 gap-x-8 gap-y-3" : "space-y-3"}>
          {/* Property Price */}
          <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-theme-text-muted" />
              <span className="text-sm text-theme-text-muted">{t('basePropertyPrice')}</span>
              <InfoTooltip translationKey="tooltipBasePrice" />
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-theme-text font-mono">{formatCurrency(basePrice, currency, rate)}</span>
              {pricePerSqft > 0 && (
                <p className="text-xs text-theme-text-muted font-mono">
                  {formatCurrency(pricePerSqft, currency, rate)}/sqft
                </p>
              )}
            </div>
          </div>

          {/* Payment Plan */}
          <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-theme-text-muted" />
              <span className="text-sm text-theme-text-muted">{t('paymentPlan')}</span>
              <InfoTooltip translationKey="tooltipPaymentPlan" />
            </div>
            <span className="text-sm font-bold text-theme-accent font-mono">{preHandoverPercent}/{handoverPercent}</span>
          </div>

          {/* Construction Period */}
          <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-theme-text-muted" />
              <span className="text-sm text-theme-text-muted">{t('constructionPeriod')}</span>
              <InfoTooltip translationKey="tooltipConstructionPeriod" />
            </div>
            <span className="text-sm font-bold text-theme-text font-mono">{totalMonths} {t('months')}</span>
          </div>

          {/* Timeline - only on desktop grid */}
          {isDesktop && (
            <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-theme-text-muted" />
                <span className="text-sm text-theme-text-muted">Timeline</span>
              </div>
              <span className="text-sm font-bold text-theme-text font-mono">
                {monthNames[bookingMonth - 1]} {bookingYear} → Q{handoverQuarter} {handoverYear}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-theme-border my-2" />

        {/* Payment Breakdown Section - Grid on desktop */}
        <div className={isDesktop ? "grid grid-cols-2 gap-x-8 gap-y-3" : "space-y-3"}>
          {/* Amount Until SPA (at booking) */}
          <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
            <span className="text-sm text-theme-text-muted">{t('amountUntilSPA')}</span>
            <span className="text-sm font-bold text-theme-accent font-mono">{formatCurrency(amountUntilSPA, currency, rate)}</span>
          </div>

          {/* Amount During Construction */}
          <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
            <span className="text-sm text-theme-text-muted">{t('amountDuringConstruction')}</span>
            <span className="text-sm font-bold text-theme-text font-mono">{formatCurrency(additionalTotal, currency, rate)}</span>
          </div>

          {/* Amount at Handover */}
          <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-theme-accent-secondary" />
              <span className="text-sm text-theme-text-muted">{t('amountAtHandover')}</span>
            </div>
            <span className="text-sm font-bold text-theme-accent-secondary font-mono">{formatCurrency(handoverAmount, currency, rate)}</span>
          </div>

          {/* Total Entry Costs */}
          <div className="flex items-center justify-between gap-4 max-w-xl xl:max-w-none">
            <div className="flex items-center gap-1">
              <span className="text-xs text-theme-text-muted">{t('totalEntryCosts')}</span>
              <InfoTooltip translationKey="tooltipEntryCosts" />
            </div>
            <span className="text-xs text-theme-negative font-mono">-{formatCurrency(totalEntryCosts, currency, rate)}</span>
          </div>
        </div>

        {/* Timeline - only on mobile/tablet */}
        {!isDesktop && (
          <>
            <div className="border-t border-theme-border my-2" />
            <div className="pt-2 text-xs text-theme-text-muted text-center">
              {monthNames[bookingMonth - 1]} {bookingYear} → Q{handoverQuarter} {handoverYear}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
