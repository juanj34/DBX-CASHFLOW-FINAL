
# Plan: Fix Snapshot Issues - Exit Toggle, Translations, Fee Breakdown & Overflow

## Issues Identified from Screenshot

1. **Exit Scenarios showing when not toggled** - The `CompactAllExitsCard` renders unconditionally, ignoring the `enabledSections.exitStrategy` toggle from the configurator
2. **Missing translations** - Multiple hardcoded English strings in snapshot components:
   - "Rental Income", "Gross", "Net/year", "Monthly" in `CompactRentCard`
   - "Mortgage", "Loan Amount", "Monthly Payment", "Rental Income", "Monthly Cash Flow" in `CompactMortgageCard`
   - "Exit Scenarios", "Capital Invested", etc. in `CompactAllExitsCard`
   - "Cash to Start", "Rental Income", "Breakeven", "Monthly Burn" in `SnapshotOverviewCards`
3. **Payment total lacks fee breakdown** - The "Total Investment" doesn't differentiate between property price and transactional fees (DLD + Oqood)
4. **Mortgage section cut off** - The right column uses `overflow-auto` but the parent container has `overflow-hidden`, causing content to be cut off

---

## Technical Changes

### File 1: `src/components/roi/snapshot/SnapshotContent.tsx`

**Change:** Conditionally render `CompactAllExitsCard` based on `enabledSections.exitStrategy` toggle

```typescript
// Line ~131: Add condition to check exitStrategy toggle
{inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0 && (
  <CompactAllExitsCard
    inputs={inputs}
    calculations={calculations}
    exitScenarios={exitScenarios}
    currency={currency}
    rate={rate}
    onClick={() => setExitModalOpen(true)}
  />
)}
```

**Change:** Fix overflow issue - remove `overflow-hidden` from parent container and keep `overflow-auto` on right column

```typescript
// Line 72: Change from overflow-hidden to allow content to scroll properly
<div className="h-screen flex flex-col bg-theme-bg">
  // ... content
  // Line 104: Remove min-h-0 constraint that causes cutting
  <div className="flex-1 px-4 pb-4 overflow-auto">
```

---

### File 2: `src/components/roi/snapshot/CompactRentCard.tsx`

**Change:** Add `useLanguage` hook and translate all hardcoded strings

Add translations needed:
- `rentalIncomeHeader` → "Rental Income" / "Ingreso por Alquiler"
- `longTermLabel` → "Long-Term" / "Largo Plazo"
- `shortTermLabel` → "Short-Term" / "Corto Plazo"
- `grossLabel` → "Gross" / "Bruto"
- `serviceLabel` → "Service" / "Servicio"
- `netYearLabel` → "Net/year" / "Neto/año"
- `monthlyLabel` → "Monthly" / "Mensual"

```typescript
import { useLanguage } from '@/contexts/LanguageContext';

// Inside component:
const { t } = useLanguage();

// Replace hardcoded strings:
<span className="text-xs font-semibold...">{t('rentalIncomeHeader')}</span>
<div className="text-[10px]...">{t('longTermLabel')}</div>
<DottedRow label={t('grossLabel')} ... />
<DottedRow label={`− ${t('serviceLabel')}`} ... />
<DottedRow label={`= ${t('netYearLabel')}`} ... />
<DottedRow label={t('monthlyLabel')} ... />
```

---

### File 3: `src/components/roi/snapshot/CompactMortgageCard.tsx`

**Change:** Add `useLanguage` hook and translate all hardcoded strings

Add translations needed:
- `mortgageHeader` → "Mortgage" / "Hipoteca"
- `loanAmountLabel` → "Loan Amount" / "Monto del Préstamo"
- `monthlyPaymentLabel` → "Monthly Payment" / "Pago Mensual"
- `rentalIncomeLabel` → "Rental Income" / "Ingreso por Alquiler"
- `monthlyCashFlowLabel` → "Monthly Cash Flow" / "Flujo Mensual"
- `interestLabel` → "Interest" / "Interés"
- `positiveLabel` → "Positive" / "Positivo"
- `negativeLabel` → "Negative" / "Negativo"

```typescript
import { useLanguage } from '@/contexts/LanguageContext';

// Inside component:
const { t } = useLanguage();

// Replace hardcoded strings
```

---

### File 4: `src/components/roi/snapshot/CompactAllExitsCard.tsx`

**Change:** Add `useLanguage` hook and translate hardcoded strings

Add translations needed:
- `exitScenariosHeader` → "Exit Scenarios" / "Escenarios de Salida"
- `handoverLabel` → "Handover" / "Entrega"
- `investedLabel` → "invested" / "invertido"
- `builtLabel` → "built" / "construido"
- `clickForDetails` → "Click for detailed breakdown" / "Clic para desglose detallado"

---

### File 5: `src/components/roi/snapshot/SnapshotOverviewCards.tsx`

**Change:** Add `useLanguage` hook and translate hardcoded strings

Add translations needed:
- `cashToStartLabel` → "Cash to Start" / "Efectivo Inicial"
- `rentalIncomeLabel` → "Rental Income" / "Ingreso por Alquiler"
- `breakevenLabel` → "Breakeven" / "Punto de Equilibrio"
- `monthlyBurnLabel` → "Monthly Burn" / "Gasto Mensual"
- `fromRentalIncomeLabel` → "From rental income" / "Por ingreso de alquiler"
- `untilHandoverLabel` → "Until handover" / "Hasta entrega"
- `yearsLabel` → "years" / "años"

---

### File 6: `src/components/roi/snapshot/CompactPaymentTable.tsx`

**Change:** Add breakdown of property price vs. fees in the grand total section

```typescript
// After line 275 (Grand Total section), update to show breakdown:
<div className="pt-2 border-t border-theme-border space-y-1">
  {/* Property Price */}
  <DottedRow 
    label={t('basePropertyPrice')}
    value={getDualValue(basePrice).primary}
    secondaryValue={getDualValue(basePrice).secondary}
    className="text-xs"
  />
  {/* Transaction Fees */}
  <DottedRow 
    label={t('transactionFees')}
    value={getDualValue(dldFee + oqoodFee).primary}
    secondaryValue={getDualValue(dldFee + oqoodFee).secondary}
    className="text-xs text-theme-text-muted"
  />
  {/* Total Investment */}
  <DottedRow 
    label={t('totalInvestmentLabel')}
    value={getDualValue(grandTotal).primary}
    secondaryValue={getDualValue(grandTotal).secondary}
    bold
    className="text-sm"
  />
</div>
```

Add translation:
- `transactionFees` → "Fees (DLD + Oqood)" / "Tarifas (DLD + Oqood)"
- `totalInvestmentLabel` → "Total Investment" / "Inversión Total"

---

### File 7: `src/contexts/LanguageContext.tsx`

**Change:** Add new translation keys for snapshot components

```typescript
// Add to translations object:

// Snapshot Overview Cards
cashToStartLabel: { en: 'Cash to Start', es: 'Efectivo Inicial' },
monthlyBurnLabel: { en: 'Monthly Burn', es: 'Gasto Mensual' },
untilHandoverLabel: { en: 'Until handover', es: 'Hasta entrega' },
fromRentalIncomeLabel: { en: 'From rental income', es: 'Por ingreso de alquiler' },
yearsLabel: { en: 'years', es: 'años' },

// Rent Card
longTermLabel: { en: 'Long-Term', es: 'Largo Plazo' },
shortTermLabel: { en: 'Short-Term', es: 'Corto Plazo' },
grossLabel: { en: 'Gross', es: 'Bruto' },
serviceLabel: { en: 'Service', es: 'Servicio' },
netYearLabel: { en: 'Net/year', es: 'Neto/año' },
monthlyLabel: { en: 'Monthly', es: 'Mensual' },

// Mortgage Card
mortgageHeader: { en: 'Mortgage', es: 'Hipoteca' },
loanAmountLabel: { en: 'Loan Amount', es: 'Monto del Préstamo' },
monthlyPaymentLabel: { en: 'Monthly Payment', es: 'Pago Mensual' },
monthlyCashFlowLabel: { en: 'Monthly Cash Flow', es: 'Flujo Mensual' },
positiveLabel: { en: 'Positive', es: 'Positivo' },
negativeLabel: { en: 'Negative', es: 'Negativo' },

// Exit Card
exitScenariosHeader: { en: 'Exit Scenarios', es: 'Escenarios de Salida' },
handoverLabel: { en: 'Handover', es: 'Entrega' },
investedLabel: { en: 'invested', es: 'invertido' },
builtLabel: { en: 'built', es: 'construido' },
clickForDetails: { en: 'Click for detailed breakdown', es: 'Clic para desglose detallado' },

// Payment Table
transactionFees: { en: 'Fees (DLD + Oqood)', es: 'Tarifas (DLD + Oqood)' },
totalInvestmentLabel: { en: 'Total Investment', es: 'Inversión Total' },
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `SnapshotContent.tsx` | Hide exit card when `exitStrategy` toggle is off; fix overflow issue |
| `CompactRentCard.tsx` | Add translations for all hardcoded strings |
| `CompactMortgageCard.tsx` | Add translations for all hardcoded strings |
| `CompactAllExitsCard.tsx` | Add translations for all hardcoded strings |
| `SnapshotOverviewCards.tsx` | Add translations for all hardcoded strings |
| `CompactPaymentTable.tsx` | Add property price vs. fees breakdown in total section |
| `LanguageContext.tsx` | Add ~20 new translation keys |

## Expected Result

1. **Exit Scenarios** will only appear when toggled ON in the configurator
2. **All text** in the snapshot will translate to Spanish when language is switched
3. **Total section** in Payment Breakdown will show:
   - Base Property Price: AED X
   - Fees (DLD + Oqood): AED Y
   - **Total Investment: AED Z**
4. **Mortgage section** will be fully visible without getting cut off
