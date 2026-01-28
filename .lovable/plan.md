
# Plan: Add Post-Handover Coverage Card to Cashflow View

## Problem

The Cashflow View (`/cashflow/:shareToken`) currently shows the Mortgage Analysis section but is missing a similar card for **Post-Handover Payment Coverage** that compares:
- Monthly post-handover payments
- Monthly rental income from tenant
- Coverage percentage and gap/surplus

This card already exists in the Snapshot view (`CompactPostHandoverCard`) but needs to be added to the Cashflow View.

---

## Solution

Add a new collapsible section to the Cashflow View that shows the post-handover payment coverage analysis, similar to how the Mortgage Analysis section works. This will help clients understand how their rental income will cover the post-handover payments.

---

## Technical Changes

### File: `src/pages/CashflowView.tsx`

#### 1. Add Import for RefreshCw Icon (Line ~3)

Add the icon used for the post-handover section:

```tsx
import { Rocket, TrendingUp, Home, Globe, Coins, Mail, MessageCircle, User, CreditCard, Building2, RefreshCw } from 'lucide-react';
```

#### 2. Add Post-Handover Coverage Section (After Mortgage Analysis, ~Line 516)

Add a new collapsible section for post-handover coverage:

```tsx
{/* Post-Handover Coverage Analysis - Collapsible */}
{inputs.hasPostHandoverPlan && calculations && (
  <CollapsibleSection
    title={t('postHandoverCoverage') || "Post-Handover Coverage"}
    subtitle={t('postHandoverCoverageSubtitle') || "How rental income covers post-handover payments"}
    icon={<RefreshCw className="w-5 h-5 text-theme-accent" />}
    defaultOpen={false}
  >
    {(() => {
      // Calculate post-handover total
      const postHandoverTotal = (inputs.postHandoverPayments || []).reduce(
        (sum, p) => sum + (calculations.basePrice * p.paymentPercent / 100), 0
      );
      
      // Calculate duration in months
      const handoverMonth = (inputs.handoverQuarter - 1) * 3 + 1;
      const handoverDate = new Date(inputs.handoverYear, handoverMonth - 1);
      const endMonth = (inputs.postHandoverEndQuarter - 1) * 3 + 1;
      const endDate = new Date(inputs.postHandoverEndYear, endMonth - 1);
      const postHandoverMonths = Math.max(1, 
        (endDate.getFullYear() - handoverDate.getFullYear()) * 12 + 
        (endDate.getMonth() - handoverDate.getMonth())
      );
      
      // Monthly equivalent payment
      const monthlyEquivalent = postHandoverTotal / postHandoverMonths;
      
      // Monthly rent (net of service charges)
      const grossAnnualRent = calculations.basePrice * (inputs.rentalYieldPercent / 100);
      const annualServiceCharges = (clientInfo.unitSizeSqf || 0) * (inputs.serviceChargePerSqft || 18);
      const netAnnualRent = grossAnnualRent - annualServiceCharges;
      const monthlyRent = netAnnualRent / 12;
      
      // Cashflow calculation
      const monthlyCashflow = monthlyRent - monthlyEquivalent;
      const coveragePercent = monthlyEquivalent > 0 
        ? Math.round((monthlyRent / monthlyEquivalent) * 100) 
        : 0;
      const isFullyCovered = monthlyCashflow >= 0;
      const totalGap = Math.abs(monthlyCashflow) * postHandoverMonths;
      
      return (
        <PostHandoverCoverageBreakdown
          postHandoverTotal={postHandoverTotal}
          postHandoverMonths={postHandoverMonths}
          postHandoverPercent={inputs.postHandoverPercent || 0}
          monthlyEquivalent={monthlyEquivalent}
          monthlyRent={monthlyRent}
          monthlyCashflow={monthlyCashflow}
          coveragePercent={coveragePercent}
          isFullyCovered={isFullyCovered}
          totalGap={totalGap}
          endQuarter={inputs.postHandoverEndQuarter}
          endYear={inputs.postHandoverEndYear}
          currency={currency}
          rate={rate}
        />
      );
    })()}
  </CollapsibleSection>
)}
```

### New File: `src/components/roi/PostHandoverCoverageBreakdown.tsx`

Create a new full-width breakdown component (similar to `MortgageBreakdown`) that shows the post-handover coverage analysis in detail:

```tsx
import { RefreshCw, TrendingUp, TrendingDown, CheckCircle, AlertCircle, XCircle, Calendar, Wallet, ArrowRight } from 'lucide-react';
import { Currency, formatCurrency, formatDualCurrency } from './currencyUtils';
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
  endQuarter: number;
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
  endQuarter,
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
    ? { icon: XCircle, label: t('noCoverage'), color: 'red' }
    : isFullyCovered 
      ? { icon: CheckCircle, label: t('fullCoverage'), color: 'green' }
      : { icon: AlertCircle, label: t('partialCoverage'), color: 'yellow' };

  const StatusIcon = status.icon;

  return (
    <div className="bg-theme-card rounded-xl border border-theme-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-theme-border bg-theme-bg/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <RefreshCw className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-theme-text">
                {t('postHandoverCoverage')}
              </h3>
              <p className="text-xs text-theme-text-muted">
                {postHandoverMonths} {t('months')} • Q{endQuarter} {endYear}
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
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
            {t('postHandoverPayments')}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-theme-text-muted">{t('totalAmount')} ({postHandoverPercent}%)</span>
              <div className="text-right">
                <span className="font-medium text-theme-text">{getDualValue(postHandoverTotal).primary}</span>
                {getDualValue(postHandoverTotal).secondary && (
                  <div className="text-xs text-theme-text-muted">{getDualValue(postHandoverTotal).secondary}</div>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-text-muted">{t('duration')}</span>
              <span className="font-medium text-theme-text">{postHandoverMonths} {t('months')}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-theme-border">
              <span className="text-theme-text-muted font-medium">{t('monthlyEquivalent')}</span>
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
            {t('rentalIncome')}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-theme-text-muted">{t('monthlyRent')}</span>
              <div className="text-right">
                <span className="font-medium text-cyan-400">+{getDualValue(monthlyRent).primary}/mo</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-text-muted">{t('coverageRatio')}</span>
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
            {isFullyCovered ? t('monthlySurplus') : t('monthlyGap')}
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
                ? t('tenantCoversFully')
                : `${getDualValue(totalGap).primary} ${t('totalGapOver')} ${postHandoverMonths}${t('monthsShort')}`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## Visual Result

### In Cashflow View (after Payment Breakdown, near Mortgage):

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔄 POST-HANDOVER COVERAGE                           ✓ Full Coverage │
│    36 months • Q4 2030                                              │
├────────────────────┬────────────────────┬──────────────────────────┤
│ POST-HANDOVER      │ RENTAL INCOME      │ MONTHLY SURPLUS          │
│ PAYMENTS           │                    │                          │
│                    │                    │ ┌──────────────────────┐ │
│ Total (34%)        │ Monthly Rent       │ │   +AED 1,234/mo      │ │
│ AED 863,600        │ +AED 8,333/mo      │ │                      │ │
│                    │                    │ │ Tenant covers fully  │ │
│ Duration           │ Coverage Ratio     │ └──────────────────────┘ │
│ 36 months          │ 112%               │                          │
│                    │                    │                          │
│ Monthly Equivalent │                    │                          │
│ AED 23,989/mo      │                    │                          │
└────────────────────┴────────────────────┴──────────────────────────┘
```

---

## Files to Create/Modify

| File | Changes |
|------|--------|
| `src/components/roi/PostHandoverCoverageBreakdown.tsx` | **NEW** - Full-width breakdown component matching MortgageBreakdown style |
| `src/pages/CashflowView.tsx` | Add import for RefreshCw icon, add import for new component, add CollapsibleSection for post-handover coverage after Mortgage Analysis |

---

## Benefits

1. **Consistent with mortgage card** - Same visual structure, same collapsible pattern
2. **Clear coverage analysis** - Shows monthly equivalent, rental income, and gap/surplus
3. **Color-coded status** - Green for fully covered, yellow for partial, red for no coverage
4. **Dual currency support** - Shows both AED and reference currency
5. **Only shows when relevant** - Conditionally renders only when `hasPostHandoverPlan` is true
