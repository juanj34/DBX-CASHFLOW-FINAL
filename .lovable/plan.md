
# Redesign Insight Cards 3 & 4

## Current State (What's Stupid)

| Card | Current Content | Problem |
|------|-----------------|---------|
| **Card 3: Monthly Cashflow** | Off-Plan: AED 0 vs Secondary: monthly cashflow during construction | Obviously Off-Plan earns nothing during construction - trivial comparison |
| **Card 4: Construction Bonus** | Single value: "+X appreciation during build" | Doesn't compare, just shows off-plan benefit in isolation |

---

## New Design

### Card 3: "Monthly Rent (Year 5)"
Compare monthly rental income at Year 5 for both properties - a meaningful comparison point after handover when both are generating income.

**Visual:**
- 🏆 Off-Plan: AED 48K/mo
- Secondary: AED 42K/mo

**Subtitle:** "Rental income at maturity"

---

### Card 4: "Construction Trade-off"
Compare what each strategy gains DURING the construction period:
- **Off-Plan gains:** Appreciation while you pay in installments ("Free equity")
- **Secondary gains:** Actual rental cashflow from Day 1

**Visual:**
- 🏠 Off-Plan: +AED 2.4M (value growth)
- 💰 Secondary: +AED 1.8M (rent earned)
- Winner gets 🏆

**Subtitle:** "What you gain during construction"

---

## Technical Implementation

### 1. Calculate Year 5 Monthly Rent in Parent (`OffPlanVsSecondary.tsx`)

```typescript
// Off-Plan Year 5 monthly rent (if after handover, otherwise 0)
const offPlanMonthlyRent5Y = useMemo(() => {
  if (5 <= handoverYearIndex) return 0; // Still in construction
  return (offPlanCalcs.yearlyProjections[4]?.netIncome || 0) / 12;
}, [offPlanCalcs.yearlyProjections, handoverYearIndex]);

// Secondary Year 5 monthly rent
const secondaryMonthlyRent5Y = useMemo(() => {
  const proj = secondaryCalcs.yearlyProjections[4]; // Index 4 = Year 5
  return rentalMode === 'airbnb'
    ? (proj?.netRentST || 0) / 12
    : (proj?.netRentLT || 0) / 12;
}, [secondaryCalcs.yearlyProjections, rentalMode]);
```

### 2. Calculate Secondary Cumulative Rent During Construction

```typescript
// Total rent Secondary earns during off-plan construction period
const secondaryRentDuringConstruction = useMemo(() => {
  let total = 0;
  for (let i = 0; i < handoverYearIndex; i++) {
    const proj = secondaryCalcs.yearlyProjections[i];
    if (proj) {
      total += rentalMode === 'airbnb' ? proj.netRentST : proj.netRentLT;
    }
  }
  return total;
}, [secondaryCalcs.yearlyProjections, handoverYearIndex, rentalMode]);
```

### 3. Update Props Passed to `ComparisonKeyInsights`

```tsx
<ComparisonKeyInsights
  // ... existing props ...
  
  // NEW: Year 5 monthly rent
  offPlanMonthlyRent5Y={offPlanMonthlyRent5Y}
  secondaryMonthlyRent5Y={secondaryMonthlyRent5Y}
  
  // NEW: Construction period comparison
  secondaryRentDuringConstruction={secondaryRentDuringConstruction}
/>
```

### 4. Update `ComparisonKeyInsights.tsx` Interface

```typescript
interface ComparisonKeyInsightsProps {
  // ... existing props ...
  
  // Year 5 monthly rent for both
  offPlanMonthlyRent5Y: number;
  secondaryMonthlyRent5Y: number;
  
  // Secondary's rent earned during construction
  secondaryRentDuringConstruction: number;
}
```

### 5. Redesign Card Definitions

**Card 3 - Monthly Rent at Year 5:**
```typescript
{
  key: 'rent5y',
  title: t.monthlyRent5Y,
  subtitle: t.monthlyRent5YSubtitle,
  icon: Coins,
  showComparison: true,
  offPlanValue: formatValue(offPlanMonthlyRent5Y),
  secondaryValue: formatValue(secondaryMonthlyRent5Y),
  winner: offPlanMonthlyRent5Y > secondaryMonthlyRent5Y ? 'offplan' : 'secondary',
}
```

**Card 4 - Construction Trade-off:**
```typescript
{
  key: 'tradeoff',
  title: t.constructionTradeoff,
  subtitle: t.constructionTradeoffSubtitle,
  icon: Building2,
  showComparison: true, // Now a comparison card!
  offPlanValue: formatValue(appreciationDuringConstruction),
  offPlanSubValue: '📈 Value growth',
  secondaryValue: formatValue(secondaryRentDuringConstruction),
  secondarySubValue: '💰 Rent earned',
  winner: appreciationDuringConstruction > secondaryRentDuringConstruction ? 'offplan' : 'secondary',
}
```

### 6. Update Translations

```typescript
const t = language === 'es' ? {
  // ... existing ...
  monthlyRent5Y: 'Renta Mensual (Año 5)',
  monthlyRent5YSubtitle: 'Ingreso a madurez',
  constructionTradeoff: 'Período Construcción',
  constructionTradeoffSubtitle: 'Qué ganas mientras esperas',
} : {
  // ... existing ...
  monthlyRent5Y: 'Monthly Rent (Year 5)',
  monthlyRent5YSubtitle: 'Rental at maturity',
  constructionTradeoff: 'Construction Period',
  constructionTradeoffSubtitle: 'What you gain while waiting',
};
```

---

## Expected Visual Result

| Card | Off-Plan | Secondary | Winner |
|------|----------|-----------|--------|
| **Total Wealth (10Y)** | AED 20.0M | AED 26.1M | Secondary 🏆 |
| **Value Multiplier** | 2.1x → 16.8M | 1.9x → 12.2M | Off-Plan 🏆 |
| **Monthly Rent (Y5)** | AED 48K/mo | AED 42K/mo | Off-Plan 🏆 |
| **Construction Period** | +2.4M value | +1.8M rent | Off-Plan 🏆 |

Both cards now show **meaningful comparisons** instead of trivial "0 vs something" or single isolated values.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/OffPlanVsSecondary.tsx` | Add Year 5 rent calculations + construction period rent for secondary |
| `src/components/roi/secondary/ComparisonKeyInsights.tsx` | Update interface, card definitions, translations, and remove old cashflow card logic |
