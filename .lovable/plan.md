
# Plan: Fix Spanish Translations in PDF/PNG Export Components

## Overview
The PDF and PNG export system uses dedicated static `Export*` components that render off-screen and are captured via html2canvas. These components have **numerous hardcoded English strings** that are not being translated when the language is set to Spanish. This results in mixed-language exports that appear unprofessional.

## Current Architecture
The export system works as follows:
1. `useExportRenderer` hook creates an off-screen container
2. Renders `ExportSnapshotDOM` component with all props (including `language`)
3. Uses html2canvas to capture the rendered DOM
4. Converts to PDF or PNG

The `language` prop **is correctly passed** to all child components, but many components have hardcoded strings instead of using the translation system.

---

## Issues Identified

### 1. ExportPostHandoverCard.tsx
**Lines 310-315** - Status badge with hardcoded English:
```tsx
// Current (hardcoded)
Tenant fully covers! +{surplus} surplus
Tenant covers {percent}% • Net: {amount}

// Should be translated
```

### 2. ExportPaymentTable.tsx  
**Multiple lines** - Labels not using the `t` object:
- Line 217: `"EOI / Booking Fee"` → should use translation
- Line 223: `"Downpayment Balance"` / `"Downpayment (X%)"` → should use translation
- Line 229: `"Subtotal (X%)"` → should use translation
- Line 235: `"DLD Fee (4%)"` → should use translation  
- Line 239: `"Oqood/Admin"` → should use translation
- Lines 127-130: `"Month X"` and `"X% Built"` in `getPaymentLabel()` → should use translation

### 3. ExportHeader.tsx
**Multiple lines** - Labels not translated:
- Line 48: `"Investment Analysis"` fallback → should be `"Análisis de Inversión"`
- Line 55: `"by "` prefix → should be `"por "`
- Line 66: `"Unit "` prefix → should be `"Unidad "`
- Lines 87-88: `"/sqft"` and `"sqft"` → should be `"/pies²"` or keep as technical unit

### 4. ExportExitCards.tsx
**Line 23** - Month names hardcoded in English:
```tsx
const monthNames = ['Jan', 'Feb', ...];  // Always English
// Should use language parameter
```

### 5. ExportRentCard.tsx
**Line 107** - Badge text:
```tsx
"LT + ST"  // Always English
// Should be "LP + CP" in Spanish (Largo Plazo + Corto Plazo)
```

---

## Implementation Plan

### Task 1: Fix ExportPaymentTable.tsx
Add missing translation keys to the `t` object and replace all hardcoded strings:

```tsx
const t = {
  // Existing keys...
  eoiBookingFee: language === 'es' ? 'EOI / Cuota de Reserva' : 'EOI / Booking Fee',
  downpaymentBalance: language === 'es' ? 'Saldo de Enganche' : 'Downpayment Balance',
  downpayment: language === 'es' ? 'Enganche' : 'Downpayment',
  dldFee: language === 'es' ? 'Tarifa DLD' : 'DLD Fee',
  oqoodAdmin: language === 'es' ? 'Oqood/Admin' : 'Oqood/Admin',
  monthLabel: language === 'es' ? 'Mes' : 'Month',
  builtLabel: language === 'es' ? 'Construido' : 'Built',
  months: language === 'es' ? 'meses' : 'months',
};
```

Update `getPaymentLabel()` function to use translations.

### Task 2: Fix ExportPostHandoverCard.tsx
Add translation keys for the status badge:

```tsx
const translations = {
  // Existing keys...
  tenantFullyCovers: { en: 'Tenant fully covers!', es: '¡El inquilino cubre totalmente!' },
  surplus: { en: 'surplus', es: 'excedente' },
  netLabel: { en: 'Net', es: 'Neto' },
};
```

Replace hardcoded strings in status badge (lines 310-315).

### Task 3: Fix ExportHeader.tsx  
Add a local translations object:

```tsx
const t = {
  investmentAnalysis: language === 'es' ? 'Análisis de Inversión' : 'Investment Analysis',
  by: language === 'es' ? 'por' : 'by',
  unit: language === 'es' ? 'Unidad' : 'Unit',
  sqft: 'sqft', // Keep as technical unit
};
```

### Task 4: Fix ExportExitCards.tsx
Update `getDateFromMonths()` function to accept language parameter and use localized month names:

```tsx
const getDateFromMonths = (months: number, bookingMonth: number, bookingYear: number, language: 'en' | 'es'): string => {
  const monthNames = language === 'es'
    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // ...rest of function
};
```

### Task 5: Fix ExportRentCard.tsx
Add translation for comparison badge:

```tsx
const t = {
  // Existing keys...
  ltStBadge: language === 'es' ? 'LP + CP' : 'LT + ST',
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/export/ExportPaymentTable.tsx` | Add ~10 translation keys, update 6+ hardcoded strings, modify `getPaymentLabel()` |
| `src/components/roi/export/ExportPostHandoverCard.tsx` | Add 3 translation keys, update status badge text |
| `src/components/roi/export/ExportHeader.tsx` | Add 4 translation keys, update labels |
| `src/components/roi/export/ExportExitCards.tsx` | Update `getDateFromMonths()` to use language parameter |
| `src/components/roi/export/ExportRentCard.tsx` | Add 1 translation key for badge |

---

## Validation Steps

After implementation:
1. Open a quote in the Snapshot View
2. Set language to Spanish (ES)
3. Export as PDF - verify all text is in Spanish
4. Export as PNG - verify all text is in Spanish  
5. Compare with live Snapshot View to ensure consistency
6. Repeat for English to ensure no regressions

---

## Technical Notes

- Export components use **inline translation objects** (not LanguageContext) because they are rendered off-screen without access to React context
- This is the correct pattern - the `language` prop is passed directly to each component
- All translations should follow the existing pattern: `language === 'es' ? 'Spanish' : 'English'`
