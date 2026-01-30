
# Plan: Fix Wealth Calculations, Enhanced Tables, Full Language Support & Net Rent Display

## Summary of Changes

### Identified Issues & Fixes:

1. **CRITICAL BUG: Wealth Year 5 = 0**
   - Location: `OffPlanVsSecondary.tsx` line 249
   - `offPlanWealthYear5: 0` is hardcoded instead of calculated
   - Must calculate using same formula as Year 10

2. **Language not applied everywhere**
   - `DSCRExplanationCard.tsx` - All Spanish, no language prop
   - `ComparisonVerdict.tsx` - All Spanish, no language prop
   - `HeadToHeadTable.tsx` - All Spanish, no language prop

3. **Useless metrics to remove:**
   - "Meses Sin Ingreso" - Not actionable
   - "Cashflow Año 1" - Confusing without context
   - "Punto de Cruce" card and row

4. **Enhanced YearByYearWealthTable needed:**
   - Currently shows only Wealth columns
   - Need to show: Property Value + Rental Income + Wealth per side

5. **Service Charges & Net Rent:**
   - Already implemented correctly in `useSecondaryCalculations.ts`:
     ```typescript
     const serviceCharges = unitSizeSqf * serviceChargePerSqft;
     const netAnnualRentLT = grossAnnualRentLT - serviceCharges;
     ```
   - Already has input fields in configurator for Service Charge and Yield
   - Need to display the deduction clearly in the configurator

---

## Wealth Calculation Formula (Correct)

```text
Wealth = Property Value + Cumulative Rent - Capital Invested
```

### Off-Plan Year 5 Fix:
```typescript
// Calculate off-plan cumulative rent up to year 5
let offPlanCumulativeRent5 = 0;
for (let i = 0; i < 5; i++) {
  const proj = offPlanCalcs.yearlyProjections[i];
  if (proj && i >= handoverYearIndex - 1 && proj.netIncome) {
    offPlanCumulativeRent5 += proj.netIncome;
  }
}
const offPlanYear5 = offPlanCalcs.yearlyProjections[4];
const offPlanWealth5 = (offPlanYear5?.propertyValue || 0) + offPlanCumulativeRent5 - offPlanCapitalDay1;
```

---

## Files to Modify

### 1. `src/pages/OffPlanVsSecondary.tsx`
- **Line 249**: Fix `offPlanWealthYear5: 0` to calculate actual value
- **Line 255**: Add Year 1 cashflow calculation for off-plan

### 2. `src/components/roi/secondary/ComparisonKeyInsights.tsx`
- Remove Crossover Point card (4th card)
- Update grid to `grid-cols-3`

### 3. `src/components/roi/secondary/HeadToHeadTable.tsx`
- Add `language` prop
- Remove rows: "Meses Sin Ingreso", "Cashflow Año 1", "Punto de Cruce"
- Add translations for all labels

### 4. `src/components/roi/secondary/YearByYearWealthTable.tsx`
Expand columns to show:
| Year | OP Value | OP Rent | OP Wealth | SEC Value | SEC Rent | SEC Wealth | Delta |

### 5. `src/components/roi/secondary/DSCRExplanationCard.tsx`
- Add `language` prop
- Translate all text (threshold explanations, labels, etc.)

### 6. `src/components/roi/secondary/ComparisonVerdict.tsx`
- Add `language` prop
- Translate all recommendations and advantage texts

### 7. `src/components/roi/secondary/SecondaryPropertyStep.tsx`
- Add visual display showing net rent calculation:
  ```text
  Renta Bruta: AED 84,000
  - Service Charges: AED 14,300
  = Renta Neta: AED 69,700 ✓
  ```

---

## Updated YearByYearWealthTable Design

```text
┌─────┬─────────────────────────────────────────┬─────────────────────────────────────────┬──────────┐
│     │           OFF-PLAN 🏗️                   │           SECONDARY 🏠                  │          │
│ Año │ Valor       │ Renta     │ Riqueza       │ Valor       │ Renta     │ Riqueza       │ Delta    │
├─────┼─────────────┼───────────┼───────────────┼─────────────┼───────────┼───────────────┼──────────┤
│ 1   │ AED 1.53M   │ —         │ AED 180K      │ AED 1.24M   │ AED 70K   │ AED 95K       │ +85K 🟢  │
│ 2   │ AED 1.61M   │ —         │ AED 360K      │ AED 1.28M   │ AED 144K  │ AED 195K      │ +165K 🟢 │
│ 3🔑 │ AED 1.70M   │ AED 84K   │ AED 540K      │ AED 1.31M   │ AED 221K  │ AED 300K      │ +240K 🟢 │
│ 4   │ AED 1.79M   │ AED 175K  │ AED 730K      │ AED 1.35M   │ AED 302K  │ AED 410K      │ +320K 🟢 │
│ 5   │ AED 1.88M   │ AED 272K  │ AED 935K      │ AED 1.39M   │ AED 387K  │ AED 525K      │ +410K 🟢 │
│ ... │ ...         │ ...       │ ...           │ ...         │ ...       │ ...           │ ...      │
│ 10  │ AED 2.15M   │ AED 756K  │ AED 1.68M     │ AED 1.55M   │ AED 810K  │ AED 1.08M     │ +600K 🟢 │
└─────┴─────────────┴───────────┴───────────────┴─────────────┴───────────┴───────────────┴──────────┘

Legend: 🔑 = Handover Year   "—" = Under construction (no rent)
```

---

## Updated Key Insights (3 Cards)

```text
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Capital Inicial│  │ Riqueza Año 10 │  │ ROE Anualizado │
│                │  │                │  │                │
│ Off-Plan       │  │ Off-Plan       │  │ Off-Plan       │
│ AED 350K       │  │ AED 1.68M      │  │ 12.5%          │
│                │  │                │  │                │
│ Secundaria     │  │ Secundaria     │  │ Secundaria     │
│ AED 520K       │  │ AED 1.08M      │  │ 8.2%           │
│                │  │                │  │                │
│ 🏆 Off-Plan    │  │ 🏆 Off-Plan    │  │ 🏆 Off-Plan    │
└────────────────┘  └────────────────┘  └────────────────┘
```

---

## Updated HeadToHeadTable Rows

**Keep:**
- Capital Día 1
- Capital Total (Handover)
- DSCR Largo Plazo / DSCR Airbnb
- Riqueza Año 5 (LT/ST)
- Riqueza Año 10 (LT/ST)
- ROE Anualizado

**Remove:**
- Meses Sin Ingreso ❌
- Cashflow Año 1 ❌
- Punto de Cruce ❌

---

## Net Rent Display in Configurator

Add a summary card showing the calculation:

```text
┌─────────────────────────────────────────────────────────────────┐
│  📊 Resumen de Renta Neta                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Renta Bruta Anual:           AED 84,000                        │
│  - Service Charges (650 sqft × 22):   - AED 14,300              │
│  ─────────────────────────────────────────────                  │
│  = Renta Neta Anual:          AED 69,700 ✓                      │
│                                                                  │
│  Yield Neto:                  5.81% (vs 7% bruto)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Translation Structure

### DSCRExplanationCard Translations:
```typescript
const t = language === 'es' ? {
  title: '¿Qué es DSCR?',
  subtitle: 'Debt Service Coverage Ratio',
  explanation: 'El DSCR mide si tu ingreso de renta cubre el pago de la hipoteca:',
  formula: 'DSCR = Ingreso Mensual Neto / Pago Mensual Hipoteca',
  excellent: 'Excelente',
  tight: 'Ajustado',
  deficit: 'Déficit',
  noMortgage: 'Sin Hipoteca',
  coversWithMargin: 'La renta cubre hipoteca con margen',
  barelyCovers: 'La renta apenas cubre',
  outOfPocket: 'Necesitas aportar de bolsillo',
  longTerm: 'Renta Larga',
  airbnb: 'Airbnb',
} : {
  title: 'What is DSCR?',
  subtitle: 'Debt Service Coverage Ratio',
  explanation: 'DSCR measures if your rental income covers the mortgage payment:',
  formula: 'DSCR = Net Monthly Income / Monthly Mortgage Payment',
  excellent: 'Excellent',
  tight: 'Tight',
  deficit: 'Deficit',
  noMortgage: 'No Mortgage',
  coversWithMargin: 'Rent covers mortgage with margin',
  barelyCovers: 'Rent barely covers',
  outOfPocket: 'Need to contribute out of pocket',
  longTerm: 'Long-Term',
  airbnb: 'Airbnb',
};
```

### ComparisonVerdict Translations:
```typescript
const t = language === 'es' ? {
  recommendation: 'RECOMENDACIÓN',
  offPlanWinner: 'Off-Plan es la mejor opción para construcción de riqueza',
  secondaryWinner: 'Secundaria es mejor si necesitas cashflow inmediato',
  advantages: 'Ventajas',
  tradeoffs: 'Trade-offs',
  disadvantages: 'Desventajas',
  lessCapital: 'menos capital inicial',
  moreWealth: 'más riqueza en 10 años',
  moreROE: 'más ROE anualizado',
  surpassesYear: 'Supera secundaria en Año',
  monthsNoIncome: 'meses sin ingresos',
  constructionRisk: 'Riesgo de construcción',
  incomeFromDay1: 'Ingresos desde día 1',
  coversHipoteca: 'cubre hipoteca',
  readyProperty: 'Propiedad lista, sin espera',
  capitalRequired: 'capital requerido',
  appreciationOnly: 'apreciación anual',
  lowROE: '(bajo)',
  tip: 'Recomendación',
  recommended: 'Recomendado',
} : {
  recommendation: 'RECOMMENDATION',
  offPlanWinner: 'Off-Plan is the best option for wealth building',
  secondaryWinner: 'Secondary is better if you need immediate cashflow',
  advantages: 'Advantages',
  tradeoffs: 'Trade-offs',
  disadvantages: 'Disadvantages',
  lessCapital: 'less initial capital',
  moreWealth: 'more wealth in 10 years',
  moreROE: 'more annualized ROE',
  surpassesYear: 'Surpasses secondary in Year',
  monthsNoIncome: 'months without income',
  constructionRisk: 'Construction risk',
  incomeFromDay1: 'Income from day 1',
  coversHipoteca: 'covers mortgage',
  readyProperty: 'Ready property, no wait',
  capitalRequired: 'capital required',
  appreciationOnly: 'annual appreciation',
  lowROE: '(low)',
  tip: 'Recommendation',
  recommended: 'Recommended',
};
```

---

## Implementation Order

1. **Fix OffPlanVsSecondary.tsx** - Calculate offPlanWealthYear5 correctly
2. **Update ComparisonKeyInsights.tsx** - Remove crossover card, grid-cols-3
3. **Update HeadToHeadTable.tsx** - Add language prop, remove useless rows
4. **Enhance YearByYearWealthTable.tsx** - Add Value + Rent columns
5. **Update DSCRExplanationCard.tsx** - Add language prop + translations
6. **Update ComparisonVerdict.tsx** - Add language prop + translations
7. **Update SecondaryPropertyStep.tsx** - Add net rent summary display
8. **Update OffPlanVsSecondary.tsx** - Pass language to all components
