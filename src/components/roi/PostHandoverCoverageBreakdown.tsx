import { RefreshCw, TrendingUp, TrendingDown, CheckCircle, AlertCircle, XCircle, Wallet } from 'lucide-react';
import { Currency, formatDualCurrency } from './currencyUtils';
import { monthName } from './useOICalculations';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PostHandoverCoverageBreakdownProps {
  postHandoverTotal: number;
  postHandoverMonths: number;
  postHandoverPercent: number;
  monthlyEquivalent: number;
  monthlyRent: number;
  monthlyCashflow: number;
  coveragePercent: number;
  isFullyCovered: boolean;
  totalGap: number;
  endMonth: number;
  endYear: number;
  currency: Currency;
  rate: number;
}

export const PostHandoverCoverageBreakdown = ({
  postHandoverTotal,
  postHandoverMonths,
  postHandoverPercent,
  monthlyEquivalent,
  monthlyRent,
  monthlyCashflow,
  coveragePercent,
  isFullyCovered,
  totalGap,
  endMonth,
  endYear,
  currency,
  rate,
}: PostHandoverCoverageBreakdownProps) => {
  const { t } = useLanguage();
  
  // Dual currency formatter
  const getDualValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return { primary: dual.primary, secondary: dual.secondary };
  };

  // Coverage status
  const isNotCovered = monthlyRent === 0;
  const status = isNotCovered 
    ? { icon: XCircle, label: t('noCoverage') || 'No Coverage', color: 'red' as const }
    : isFullyCovered 
      ? { icon: CheckCircle, label: t('fullCoverage') || 'Full Coverage', color: 'green' as const }
      : { icon: AlertCircle, label: t('partialCoverage') || 'Partial Coverage', color: 'yellow' as const };

  const StatusIcon = status.icon;

  return (
    <div className="bg-theme-card rounded-xl border border-theme-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-theme-border bg-theme-bg/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <RefreshCw className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-theme-text">
                {t('postHandoverCoverage') || 'Post-Handover Coverage'}
              </h3>
              <p className="text-xs text-theme-text-muted">
                {postHandoverMonths} {t('months') || 'months'} • {monthName(endMonth)} {endYear}
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap",
            status.color === 'green' && "bg-green-500/10 text-green-400 border border-green-500/30",
            status.color === 'yellow' && "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
            status.color === 'red' && "bg-red-500/10 text-red-400 border border-red-500/30"
          )}>
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-3 gap-4 p-4">
        {/* Column 1: Post-Handover Payments */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-theme-text mb-2">
            <Wallet className="w-4 h-4 text-purple-400" />
            {t('postHandoverPayments') || 'Post-Handover Payments'}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-theme-text-muted whitespace-nowrap">{t('totalAmount') || 'Total'} ({postHandoverPercent}%)</span>
              <div className="text-right">
                <span className="font-medium text-theme-text">{getDualValue(postHandoverTotal).primary}</span>
                {getDualValue(postHandoverTotal).secondary && (
                  <div className="text-xs text-theme-text-muted">{getDualValue(postHandoverTotal).secondary}</div>
                )}
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-theme-text-muted">{t('duration') || 'Duration'}</span>
              <span className="font-medium text-theme-text">{postHandoverMonths} {t('months') || 'months'}</span>
            </div>
            <div className="flex justify-between gap-2 pt-2 border-t border-theme-border">
              <span className="text-theme-text-muted font-medium">{t('monthlyEquivalent') || 'Monthly Equivalent'}</span>
              <div className="text-right">
                <span className="font-semibold text-purple-400">{getDualValue(monthlyEquivalent).primary}/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Rental Income */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-theme-text mb-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            {t('rentalIncome') || 'Rental Income'}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-theme-text-muted">{t('monthlyRent') || 'Monthly Rent'}</span>
              <div className="text-right">
                <span className="font-medium text-cyan-400">+{getDualValue(monthlyRent).primary}/mo</span>
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-theme-text-muted">{t('coverageRatio') || 'Coverage Ratio'}</span>
              <span className={cn(
                "font-medium",
                coveragePercent >= 100 ? "text-green-400" : "text-yellow-400"
              )}>
                {coveragePercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Cashflow Summary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-theme-text mb-2">
            {isFullyCovered ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            {isFullyCovered ? (t('monthlySurplus') || 'Monthly Surplus') : (t('monthlyGap') || 'Monthly Gap')}
          </div>
          
          <div className={cn(
            "p-3 rounded-lg text-center",
            isFullyCovered 
              ? "bg-green-500/10 border border-green-500/30" 
              : "bg-red-500/10 border border-red-500/30"
          )}>
            <div className={cn(
              "text-xl font-bold",
              isFullyCovered ? "text-green-400" : "text-red-400"
            )}>
              {isFullyCovered ? '+' : '-'}{getDualValue(Math.abs(monthlyCashflow)).primary}/mo
            </div>
            <p className="text-xs text-theme-text-muted mt-1">
              {isFullyCovered 
                ? (t('tenantCoversFully') || 'Tenant covers fully')
                : `${getDualValue(totalGap).primary} ${t('totalGapOver') || 'total gap over'} ${postHandoverMonths}${t('monthsShort') || 'mo'}`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
