
# Plan: Add Fixed Loan Amount Option + Complete Language Support

## Summary

Two requirements:
1. **Fixed Loan Amount Option**: Allow users to input a specific approved loan amount (e.g., AED 5,000,000) instead of only a financing percentage
2. **Complete Language Support**: Ensure ALL text in the configurator and comparison tool translates when toggling 🇬🇧/🇪🇸

---

## 1. Fixed Loan Amount for Secondary Mortgage

### Current Behavior
```
Mortgage Section:
├── Financing % (e.g., 60%)
├── Interest Rate % (e.g., 4.5%)
└── Term (years) (e.g., 25)
```

### New Behavior
```
Mortgage Section:
├── Financing Mode Toggle: [% | Fixed Amount]
├── IF %: Financing % (e.g., 60%)
├── IF Fixed: Loan Amount (e.g., 5,000,000)
├── Interest Rate %
└── Term (years)
```

### Files to Modify

#### `src/components/roi/secondary/types.ts`
Add new fields to `SecondaryInputs`:
```typescript
// Mortgage (Optional)
useMortgage: boolean;
mortgageMode: 'percent' | 'fixed';        // NEW
mortgageFinancingPercent: number;         
mortgageFixedAmount: number;              // NEW: e.g., 5000000
mortgageInterestRate: number;
mortgageLoanTermYears: number;
```

Update `DEFAULT_SECONDARY_INPUTS`:
```typescript
mortgageMode: 'percent',
mortgageFixedAmount: 0,
```

#### `src/components/roi/secondary/useSecondaryCalculations.ts`
Update loan amount calculation:
```typescript
// === CAPITAL CALCULATIONS ===
const loanAmount = useMortgage 
  ? (mortgageMode === 'fixed' 
      ? mortgageFixedAmount 
      : purchasePrice * mortgageFinancingPercent / 100)
  : 0;
```

#### `src/components/roi/secondary/SecondaryPropertyStep.tsx`
Add UI toggle for mortgage mode:
```typescript
// In translations:
mortgageMode: 'Modo de Financiamiento',
percentMode: 'Porcentaje',
fixedMode: 'Monto Fijo',
loanAmount: 'Monto del Préstamo',
approvedAmount: 'Monto Aprobado (AED)',

// New UI:
<div className="flex items-center gap-2 mb-3">
  <Button 
    variant={inputs.mortgageMode === 'percent' ? 'default' : 'outline'}
    size="sm"
    onClick={() => updateInput('mortgageMode', 'percent')}
  >
    {t.percentMode}
  </Button>
  <Button 
    variant={inputs.mortgageMode === 'fixed' ? 'default' : 'outline'}
    size="sm"
    onClick={() => updateInput('mortgageMode', 'fixed')}
  >
    {t.fixedMode}
  </Button>
</div>

{inputs.mortgageMode === 'percent' ? (
  // Show percentage input
) : (
  // Show fixed amount input
)}
```

---

## 2. Complete Language Support Verification

### Components Already Supporting Language ✅
- `ComparisonConfiguratorModal.tsx` - Passes language to all child steps ✅
- `QuoteSelectionStep.tsx` - Has language prop ✅
- `SecondaryPropertyStep.tsx` - Has language prop ✅
- `ExitScenariosStep.tsx` - Has language prop ✅
- `HeadToHeadTable.tsx` - Has language prop ✅
- `WealthTrajectoryDualChart.tsx` - Has language prop ✅
- `MortgageCoverageMatrix.tsx` - Has language prop ✅
- `ComparisonKeyInsights.tsx` - Has language prop ✅
- `YearByYearWealthTable.tsx` - Has language prop ✅
- `DSCRExplanationCard.tsx` - Has language prop ✅
- `ComparisonVerdict.tsx` - Has language prop ✅
- `OutOfPocketCard.tsx` - Has language prop ✅
- `ExitScenariosComparison.tsx` - Has language prop ✅

### Missing Translations to Add

#### `SecondaryPropertyStep.tsx`
Add new translations for mortgage mode:
```typescript
const t = language === 'es' ? {
  // ... existing
  mortgageMode: 'Modo de Financiamiento',
  percentMode: '% del Valor',
  fixedMode: 'Monto Fijo',
  approvedAmount: 'Monto Aprobado (AED)',
  loanAmountLabel: 'Monto del Préstamo',
} : {
  // ... existing
  mortgageMode: 'Financing Mode',
  percentMode: '% of Value',
  fixedMode: 'Fixed Amount',
  approvedAmount: 'Approved Amount (AED)',
  loanAmountLabel: 'Loan Amount',
};
```

---

## Updated UI Design: Mortgage Section

```
┌─────────────────────────────────────────────────────────────────┐
│ 💰 Mortgage                                            [Toggle] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Financing Mode:                                                 │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │ % del Valor  │  │ Monto Fijo  │   ← Toggle buttons           │
│  └──────────────┘  └──────────────┘                             │
│                                                                  │
│  IF % Mode:                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Financing % │  │ Interest %  │  │ Term (yrs)  │              │
│  │     60      │  │    4.5      │  │     25      │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  IF Fixed Mode:                                                  │
│  ┌────────────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Approved Amount    │  │ Interest %  │  │ Term (yrs)  │       │
│  │   5,000,000        │  │    4.5      │  │     25      │       │
│  └────────────────────┘  └─────────────┘  └─────────────┘       │
│                                                                  │
│  Calculated Loan: AED 5,000,000 (41.7% of property value)       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/secondary/types.ts` | Add `mortgageMode` and `mortgageFixedAmount` fields |
| `src/components/roi/secondary/useSecondaryCalculations.ts` | Handle both financing modes |
| `src/components/roi/secondary/SecondaryPropertyStep.tsx` | Add mortgage mode toggle UI + new translations |
| `src/hooks/useSecondaryProperties.ts` | Add new fields to saved properties (optional) |

---

## Implementation Order

1. **Update `types.ts`** - Add new type fields with defaults
2. **Update `useSecondaryCalculations.ts`** - Handle fixed amount calculation
3. **Update `SecondaryPropertyStep.tsx`** - Add UI toggle and translations
4. **Test** - Verify language toggle works everywhere

---

## Technical Details

### Loan Calculation Logic

```typescript
// In useSecondaryCalculations.ts
const {
  mortgageMode,
  mortgageFinancingPercent,
  mortgageFixedAmount,
  // ...
} = inputs;

// Calculate loan amount based on mode
const loanAmount = useMortgage 
  ? (mortgageMode === 'fixed' 
      ? Math.min(mortgageFixedAmount, purchasePrice * 0.80) // Cap at 80% LTV
      : purchasePrice * mortgageFinancingPercent / 100)
  : 0;

// Calculate effective financing percentage for display
const effectiveFinancingPercent = purchasePrice > 0 
  ? (loanAmount / purchasePrice) * 100 
  : 0;
```

### Show Calculated Percentage in Fixed Mode

When in fixed mode, display the calculated percentage:
```
Monto Aprobado: AED 5,000,000
= 41.7% del valor de la propiedad (AED 12,000,000)
```
