
# Plan: Enhanced Off-Plan vs Secondary Comparison - Meaningful Metrics

## Problems Identified

### 1. "NaNK/mo" Bug in Monthly Cashflow Card
**Screenshot shows**: Secondary Monthly Cashflow = "NaNK/mo"

**Root cause**: The `formatValue()` function receives a NaN value when:
- The secondary calculations haven't completed yet
- There's an edge case in the mortgage calculation

**Fix**: Add NaN check in `ComparisonKeyInsights.tsx`:
```typescript
const formattedCashflow = isNaN(secondaryMonthlyCashflow) 
  ? 'N/A' 
  : `${secondaryMonthlyCashflow >= 0 ? '+' : ''}${formatValue(secondaryMonthlyCashflow)}${t.perMonth}`;
```

### 2. Replace "Monthly Cashflow During Construction" with Total Income
**Current**: Shows useless monthly value during a period when comparison should be cumulative
**New**: Show **total rent earned by Secondary** during the construction phase (e.g., 48 months × monthly rent)

### 3. Missing: Tenant Mortgage Paydown (Principal Paid)
The user wants to see how much of the mortgage principal is paid by the tenant over time. This is hidden wealth building!

### 4. Missing: Rental Comparison at Handover
At handover, both properties can be rented. Show side-by-side comparison:
- Off-Plan: Expected Monthly Rent
- Secondary: Monthly Rent (at that time, with growth applied)

---

## Technical Changes

### File 1: `src/components/roi/secondary/ComparisonKeyInsights.tsx`

#### Change "Monthly Cashflow" card to "Income During Build"

| Before | After |
|--------|-------|
| Monthly Cashflow | Income During Build |
| AED X/mo | Total: AED X.XM |
| Shows monthly rate | Shows cumulative rent earned during construction |

**New props needed**:
```typescript
interface ComparisonKeyInsightsProps {
  // ... existing
  constructionMonths: number;  // NEW: Duration of construction
  secondaryTotalIncomeAtHandover: number; // NEW: Net rent × months
}
```

**New card definition**:
```typescript
{
  key: 'income',
  title: t.incomeBuildup,
  subtitle: t.duringConstruction,
  icon: Coins,
  showComparison: true,
  offPlanValue: 'AED 0',
  secondaryValue: formatValue(secondaryTotalIncomeAtHandover),
  badge: `${constructionMonths} ${t.months}`,
  badgeColor: 'cyan',
  winner: 'secondary',
}
```

---

### File 2: `src/components/roi/secondary/MortgageCoverageCard.tsx`

#### Add Principal Paydown Section

Enhance the existing card to show tenant's contribution to mortgage principal:

```text
┌────────────────────────────────────────┐
│ 🏠 Tenant Pays Your Mortgage           │
│                                        │
│ Monthly Rent:        AED 57,722        │
│ Mortgage Payment:    AED 45,000        │
│ [████████████████████] 128% Coverage   │
│                                        │
│ Net Cashflow: +AED 12,722/mo           │
│                                        │
│ ─── HIDDEN WEALTH ───                  │ ← NEW SECTION
│ Principal Paid by Tenant (10Y):        │
│ AED 2.4M of your AED 5.9M loan         │
│ [████████▓▓▓▓▓▓▓▓▓▓▓▓] 41%            │
└────────────────────────────────────────┘
```

**New props needed**:
```typescript
interface MortgageCoverageCardProps {
  // ... existing
  loanAmount: number;
  principalPaidYear10: number;
}
```

---

### File 3: Create `src/components/roi/secondary/RentalComparisonAtHandover.tsx`

New component showing side-by-side rental at handover:

```text
┌────────────────────────────────────────┐
│ 🏠 Monthly Rent at Handover            │
│                                        │
│  Off-Plan           Secondary          │
│  ─────────          ──────────         │
│  AED 56,000/mo      AED 59,400/mo      │
│  (7% yield on       (After 4yr rent    │
│   9.6M property)     growth at 3%/yr)  │
│                                        │
│  🏆 Secondary: +6% higher rent         │
└────────────────────────────────────────┘
```

---

### File 4: `src/pages/OffPlanVsSecondary.tsx`

#### Calculate new metrics and pass to components

**Add calculations**:
```typescript
// Total income earned by Secondary during construction
const secondaryTotalIncomeAtHandover = useMemo(() => {
  const monthlyRent = rentalMode === 'long-term' 
    ? secondaryCalcs.monthlyRentLT 
    : secondaryCalcs.monthlyRentST;
  const months = handoverYearIndex * 12;
  // Simple calculation: average monthly rent × months (ignoring growth for simplicity)
  return monthlyRent * months;
}, [secondaryCalcs, handoverYearIndex, rentalMode]);

// Principal paid at Year 10 (from secondary projections)
const secondaryPrincipalPaid10Y = useMemo(() => {
  return secondaryCalcs.yearlyProjections[9]?.principalPaid || 0;
}, [secondaryCalcs]);

// Off-Plan rental at handover (from off-plan calcs)
const offPlanMonthlyRentAtHandover = useMemo(() => {
  return offPlanCalcs.holdAnalysis?.netAnnualRent / 12 || 0;
}, [offPlanCalcs]);

// Secondary rental at handover (with growth applied)
const secondaryMonthlyRentAtHandover = useMemo(() => {
  const baseRent = rentalMode === 'long-term' 
    ? secondaryCalcs.monthlyRentLT 
    : secondaryCalcs.monthlyRentST;
  const growthFactor = Math.pow(1 + secondaryInputs.rentGrowthRate / 100, handoverYearIndex);
  return baseRent * growthFactor;
}, [secondaryCalcs, secondaryInputs, handoverYearIndex, rentalMode]);
```

**Update component props**:
```tsx
<ComparisonKeyInsights
  // ... existing
  constructionMonths={handoverYearIndex * 12}
  secondaryTotalIncomeAtHandover={secondaryTotalIncomeAtHandover}
/>

<MortgageCoverageCard
  // ... existing
  loanAmount={secondaryCalcs.loanAmount}
  principalPaidYear10={secondaryPrincipalPaid10Y}
/>

{/* Add new rental comparison card */}
<RentalComparisonAtHandover
  offPlanMonthlyRent={offPlanMonthlyRentAtHandover}
  secondaryMonthlyRent={secondaryMonthlyRentAtHandover}
  handoverYear={handoverYearIndex}
  currency={currency}
  rate={rate}
  language={language}
/>
```

---

### File 5: `src/components/roi/secondary/index.ts`

Export new component:
```typescript
export { RentalComparisonAtHandover } from './RentalComparisonAtHandover';
```

---

## Expected Results

### Key Insights Cards (After Fix)

| Card | Before | After |
|------|--------|-------|
| 1. Entry Ticket | ✓ Keep | ✓ Keep |
| 2. Multiplier | ✓ Keep | ✓ Keep |
| 3. Monthly Cashflow | "NaNK/mo" | **Income During Build: +AED 2.8M** |
| 4. Construction Bonus | ✓ Keep | ✓ Keep |

### Mortgage Coverage Card (Enhanced)

```text
🏠 Tenant Pays Your Mortgage

Monthly Rent:        AED 57,722
Mortgage Payment:    AED 45,000
[████████████████████] 128%

Net Cashflow: +AED 12,722/mo

── Principal Paydown (10Y) ──    ← NEW
Tenant pays off: AED 2.4M        
Remaining: AED 3.5M              
[████████▓▓▓▓▓▓▓▓▓▓▓▓] 41%      
```

### New: Rental Comparison at Handover

```text
🏠 Rent at Handover (Year 4)

Off-Plan         Secondary
AED 56,000/mo    AED 59,400/mo
(7% on 9.6M)     (7% on 9.9M + growth)

Secondary: +6% higher at handover
```

---

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/roi/secondary/ComparisonKeyInsights.tsx` | Modify | Change Monthly Cashflow → Income During Build, add NaN fix |
| `src/components/roi/secondary/MortgageCoverageCard.tsx` | Modify | Add Principal Paydown section |
| `src/components/roi/secondary/RentalComparisonAtHandover.tsx` | **Create** | New card comparing rent at handover |
| `src/pages/OffPlanVsSecondary.tsx` | Modify | Calculate new metrics, pass props |
| `src/components/roi/secondary/index.ts` | Modify | Export new component |
