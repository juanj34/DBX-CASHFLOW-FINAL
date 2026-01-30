

# Comprehensive Plan: Fix HeadToHeadTable, Payment Total, and Exit Scenarios

## Overview

This plan addresses three separate issues:
1. **Remove HeadToHeadTable** - Redundant comparison table 
2. **Fix "Total to this point"** - Shows incorrect amount including handover
3. **Improve Exit Scenarios Card** - Make it understandable with clear labels and dual currency

---

## Part 1: Remove HeadToHeadTable Component

### Current Problem
The "Detailed Comparison" table shows metrics already displayed in Key Insights cards and Year-by-Year table, adding visual noise.

### Solution
Remove the component from the OffPlanVsSecondary page.

### File: `src/pages/OffPlanVsSecondary.tsx`

**Line 32 - Update import:**
```typescript
// Remove HeadToHeadTable from import
import {
  SecondaryInputs,
  DEFAULT_SECONDARY_INPUTS,
  ComparisonMetrics,
  useSecondaryCalculations,
  ComparisonConfiguratorModal,
  ComparisonKeyInsights,
  YearByYearWealthTable,
  WealthTrajectoryDualChart,
  OutOfPocketCard,
  // HeadToHeadTable, ← REMOVE
  ComparisonVerdict,
  ExitScenariosComparison,
  SaveSecondaryComparisonModal,
  LoadSecondaryComparisonModal,
} from '@/components/roi/secondary';
```

**Lines 537-545 - Remove component:**
```typescript
// DELETE this entire block:
{/* 2. Detailed Comparison Table */}
<HeadToHeadTable
  metrics={comparisonMetrics}
  offPlanLabel={projectName}
  showAirbnb={rentalMode === 'airbnb'}
  currency={currency}
  rate={rate}
  language={language}
/>
```

---

## Part 2: Fix "Total to this point" Calculation

### Current Problem
"Total to this point" shows AED 2,885,000 when it should show AED 1,085,000.

**Current Formula (line 217):**
- `totalUntilHandover = entryTotal + journeyTotal + handoverAmount`
- = 485K + 600K + 1.8M = **2,885,000** (WRONG)

**Expected:**
- Total up to last journey payment = 485K + 600K = **1,085,000** (CORRECT)

### Solution
Create a new variable `totalToHandoverQuarter` that excludes the handover payment.

### File: `src/components/roi/snapshot/CompactPaymentTable.tsx`

**Line ~217 - Add new calculation:**
```typescript
// Total Cash Until Handover = Entry + Journey + On Handover (for grand total)
const totalUntilHandover = entryTotal + journeyTotal + handoverAmount;

// NEW: "Total to this point" = entry + journey payments only
// Handover payment is shown AFTER this total in the UI
const totalToHandoverQuarter = entryTotal + journeyTotal;
```

**Lines 442-445 - Use new variable:**
```typescript
// BEFORE:
{getDualValue(totalUntilHandover).primary}
{currency !== 'AED' && (
  <span className="text-theme-text-muted ml-1">({getDualValue(totalUntilHandover).secondary})</span>
)}

// AFTER:
{getDualValue(totalToHandoverQuarter).primary}
{currency !== 'AED' && (
  <span className="text-theme-text-muted ml-1">({getDualValue(totalToHandoverQuarter).secondary})</span>
)}
```

---

## Part 3: Revamp Exit Scenarios Card

### Current Problems
1. Numbers are cryptic - no labels explaining what each value means
2. Capital is always in AED even when EUR/USD is toggled
3. Tooltip also only shows AED
4. No comparison showing initial vs current property value

### Current Display:
```text
#1  ⏱ 18m  Jul'27                    38% built
$  AED 785,000  +AED 222,379              28%
```

**Problems:**
- What is AED 785,000? Capital? Property value?
- What is +AED 222,379? Profit? 
- What is 28%? ROE? Yield?

### New Design:
```text
#1  ⏱ 18m  Jul'27                    38% built
Capital: AED 785,000 (€182K)
Value: AED 3,222K → AED 3,445K  ← Shows initial + appreciated
Profit: +AED 222,379 (€51K)   ROE: 28%
```

### File: `src/components/roi/snapshot/CompactAllExitsCard.tsx`

**Update imports to use dual currency:**
```typescript
import { Currency, formatCurrency, formatDualCurrency } from '../currencyUtils';
```

**Add helper for dual currency display:**
```typescript
// Dual currency helper
const getDualValue = (value: number) => {
  const dual = formatDualCurrency(value, currency, rate);
  return { primary: dual.primary, secondary: dual.secondary };
};

// Format with inline secondary
const formatWithSecondary = (value: number, showSign = false) => {
  const prefix = showSign && value >= 0 ? '+' : '';
  const aed = formatCurrency(Math.abs(value), 'AED', 1);
  const aedWithSign = `${prefix}${value < 0 ? '-' : ''}${aed}`;
  
  if (currency === 'AED') return aedWithSign;
  
  const secondary = formatCurrency(Math.abs(value), currency, rate);
  return `${aedWithSign} (${secondary})`;
};
```

**Add basePrice to scenario for "Initial Value" display (line ~63-74):**
```typescript
return {
  exitMonths,
  exitPrice: scenarioResult.exitPrice,
  totalCapitalDeployed: scenarioResult.totalCapital,
  trueProfit: scenarioResult.trueProfit,
  trueROE: scenarioResult.trueROE,
  annualizedROE: scenarioResult.annualizedROE,
  isHandover,
  dateStr,
  constructionPct,
  exitNumber: index + 1,
  initialValue: basePrice,  // NEW: Original property price
};
```

**Revamp card display (lines 108-154):**
```typescript
<div 
  className="p-2.5 rounded-lg transition-colors bg-theme-bg/50 hover:bg-theme-border/30 border border-theme-border/30"
>
  {/* Top Row: Exit Number, Months, Date, Construction % */}
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-theme-accent bg-theme-accent/10 px-1.5 py-0.5 rounded">
        #{scenario.exitNumber}
      </span>
      <Clock className="w-3 h-3 text-theme-text-muted" />
      <span className="text-sm font-medium text-theme-text">
        {scenario.exitMonths}m
      </span>
      <span className="text-xs text-theme-text-muted">
        {scenario.dateStr}
      </span>
    </div>
    <div className="flex items-center gap-1">
      <Hammer className="w-3 h-3 text-orange-400" />
      <span className="text-xs text-orange-400 font-medium">
        {scenario.constructionPct.toFixed(0)}% {t('builtLabel')}
      </span>
    </div>
  </div>
  
  {/* NEW: Clear labeled metrics */}
  <div className="space-y-1 text-xs">
    {/* Row 1: Capital Invested */}
    <div className="flex items-center justify-between">
      <span className="text-theme-text-muted">{t('cashInvestedLabel')}:</span>
      <span className="text-theme-text font-mono">
        {getDualValue(scenario.totalCapitalDeployed).primary}
        {currency !== 'AED' && getDualValue(scenario.totalCapitalDeployed).secondary && (
          <span className="text-theme-text-muted ml-1">({getDualValue(scenario.totalCapitalDeployed).secondary})</span>
        )}
      </span>
    </div>
    
    {/* Row 2: Property Value (Initial → Current) */}
    <div className="flex items-center justify-between">
      <span className="text-theme-text-muted">{t('propertyValueLabel')}:</span>
      <span className="text-theme-text font-mono">
        <span className="text-theme-text-muted">{formatCurrency(scenario.initialValue, 'AED', 1)}</span>
        <span className="text-theme-text-muted mx-1">→</span>
        <span className="text-theme-text">{formatCurrency(scenario.exitPrice, 'AED', 1)}</span>
        {currency !== 'AED' && (
          <span className="text-theme-text-muted ml-1">({formatCurrency(scenario.exitPrice, currency, rate)})</span>
        )}
      </span>
    </div>
    
    {/* Row 3: Profit + ROE */}
    <div className="flex items-center justify-between">
      <span className="text-theme-text-muted">{t('profit')}:</span>
      <div className="flex items-center gap-2">
        <span className={cn(
          "font-mono font-medium",
          scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400"
        )}>
          {scenario.trueProfit >= 0 ? '+' : ''}{getDualValue(scenario.trueProfit).primary}
          {currency !== 'AED' && getDualValue(scenario.trueProfit).secondary && (
            <span className="opacity-70 ml-1">({getDualValue(scenario.trueProfit).secondary})</span>
          )}
        </span>
        <span className={cn(
          "font-bold font-mono px-1.5 py-0.5 rounded text-[10px]",
          scenario.trueROE >= 0 ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
        )}>
          {scenario.trueROE?.toFixed(0) ?? 0}% ROE
        </span>
      </div>
    </div>
  </div>
</div>
```

**Update Tooltip with dual currency and property comparison (lines 156-177):**
```typescript
<TooltipContent side="left" className="max-w-xs bg-theme-card border-theme-border">
  <div className="space-y-2 text-xs">
    <p className="font-semibold text-theme-text">
      {t('exitAtLabel')} {scenario.exitMonths}m ({scenario.dateStr})
    </p>
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      <span className="text-theme-text-muted">{t('constructionTime')}:</span>
      <span className="text-theme-text">{scenario.constructionPct.toFixed(0)}% {t('completeLabel')}</span>
      
      <span className="text-theme-text-muted">{t('cashInvestedLabel')}:</span>
      <span className="text-theme-text">
        {getDualValue(scenario.totalCapitalDeployed).primary}
        {currency !== 'AED' && getDualValue(scenario.totalCapitalDeployed).secondary && (
          <span className="opacity-70 ml-1">({getDualValue(scenario.totalCapitalDeployed).secondary})</span>
        )}
      </span>
      
      {/* NEW: Initial Value */}
      <span className="text-theme-text-muted">{t('initialValueLabel') || 'Initial Value'}:</span>
      <span className="text-theme-text">
        {getDualValue(scenario.initialValue).primary}
        {currency !== 'AED' && getDualValue(scenario.initialValue).secondary && (
          <span className="opacity-70 ml-1">({getDualValue(scenario.initialValue).secondary})</span>
        )}
      </span>
      
      <span className="text-theme-text-muted">{t('propertyValueLabel')}:</span>
      <span className="text-theme-text">
        {getDualValue(scenario.exitPrice).primary}
        {currency !== 'AED' && getDualValue(scenario.exitPrice).secondary && (
          <span className="opacity-70 ml-1">({getDualValue(scenario.exitPrice).secondary})</span>
        )}
      </span>
      
      <span className="text-theme-text-muted">{t('profit')}:</span>
      <span className={scenario.trueProfit >= 0 ? "text-green-400" : "text-red-400"}>
        {getDualValue(scenario.trueProfit).primary}
        {currency !== 'AED' && getDualValue(scenario.trueProfit).secondary && (
          <span className="opacity-70 ml-1">({getDualValue(scenario.trueProfit).secondary})</span>
        )}
      </span>
      
      <span className="text-theme-text-muted">{t('totalROELabel')}:</span>
      <span className="font-bold text-theme-text">{scenario.trueROE?.toFixed(2) ?? 0}%</span>
    </div>
  </div>
</TooltipContent>
```

### Add translation key:

**File: `src/contexts/LanguageContext.tsx`**
```typescript
initialValueLabel: { en: 'Initial Value', es: 'Valor Inicial' },
```

---

## Summary of All Changes

| File | Change |
|------|--------|
| `OffPlanVsSecondary.tsx` | Remove HeadToHeadTable import and component |
| `CompactPaymentTable.tsx` | Add `totalToHandoverQuarter`, use for "Total to this point" |
| `CompactAllExitsCard.tsx` | Complete revamp with labeled metrics, dual currency, value comparison |
| `LanguageContext.tsx` | Add `initialValueLabel` translation |

---

## Expected Results

### Exit Scenarios Card (After):
```text
#1  ⏱ 18m  Jul'27                         38% built
Cash Invested: AED 785,000 (€182K)
Value: AED 3,000,000 → AED 3,222,379 (€747K)
Profit: +AED 222,379 (€52K)          28% ROE
```

### "Total to this point" (After):
- Entry Total: AED 485,000
- Journey Total: AED 600,000
- **Total to this point: AED 1,085,000** (was 2,885,000)

### Comparison Page:
- HeadToHeadTable removed
- 6 focused sections instead of 7

