
# Plan: Move Currency Selector to In-App Controls and Add Dual Currency in Configurator

## Problem Summary

1. **Symbol clarification**: The 🌴 (palm tree) icon represents "Airbnb/Short-term rental" mode in the toggle (🏠 = Long-term, 🌴 = Airbnb)

2. **Currency in wrong place**: Currently in the TopNavbar, but user wants it inside the page (like CashflowView does)

3. **Missing dual currency in configurator**: When currency changes, all monetary values in the configurator modal should show dual format (AED + converted value)

---

## Solution Overview

### 1. Move Currency & Language Controls to Page Header

Remove currency/language props from TopNavbar calls and add a dedicated controls bar in the OffPlanVsSecondary page header (similar to CashflowView pattern at lines 330-346):

```text
┌─────────────────────────────────────────────────────────────────┐
│  Header: "Off-Plan vs Secundaria"                               │
│  [← Reconfigurar]  [🏠/🌴 Toggle]  [🇬🇧 EN] [🇦🇪 AED ▼]           │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Update Configurator Modal with Dual Currency

Pass `currency` and `rate` to the `ComparisonConfiguratorModal` and then to `SecondaryPropertyStep` so all monetary inputs show dual values.

### 3. Add Dual Currency Display to SecondaryPropertyStep

When displaying prices in the configurator:
- Show main AED value in input
- Show converted value below each monetary field (like CashflowView does)
- Update labels to show both currencies

---

## Technical Implementation

### A. OffPlanVsSecondary.tsx Changes

1. **Remove language/currency props from TopNavbar** - Use TopNavbar without these props
2. **Add in-page header controls** - Create a control bar below navbar with:
   - Reconfigure button
   - Rental mode toggle (with clear labels: "Renta Larga" / "Airbnb")
   - Language button (🇬🇧/🇪🇸)
   - Currency dropdown (🇦🇪 AED, 🇺🇸 USD, etc.)

### B. ComparisonConfiguratorModal.tsx Changes

Add new props:
```typescript
interface ComparisonConfiguratorModalProps {
  // ... existing props
  currency?: Currency;
  rate?: number;
  language?: 'en' | 'es';
}
```

Pass to `SecondaryPropertyStep`.

### C. SecondaryPropertyStep.tsx Changes

1. Add `currency` and `rate` props
2. For each monetary input field, show dual currency helper text:
   ```tsx
   <div className="space-y-1.5">
     <Label>Precio de Compra (AED)</Label>
     <Input value={inputs.purchasePrice} ... />
     {currency !== 'AED' && (
       <p className="text-[10px] text-theme-text-muted">
         ≈ {formatCurrency(inputs.purchasePrice, currency, rate)}
       </p>
     )}
   </div>
   ```

3. Update the saved properties display to show dual currency

### D. HeadToHeadTable.tsx Changes

Add `currency` and `rate` props to display dual currency in the comparison table.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/OffPlanVsSecondary.tsx` | Remove navbar currency/lang props, add in-page header controls |
| `src/components/roi/secondary/ComparisonConfiguratorModal.tsx` | Add currency/rate/language props, pass to children |
| `src/components/roi/secondary/SecondaryPropertyStep.tsx` | Add dual currency display for all monetary fields |
| `src/components/roi/secondary/HeadToHeadTable.tsx` | Add currency/rate props, dual currency formatting |

---

## UI Changes

### Before (Current)
```text
[TopNavbar with currency/language toggles]
│
├── Header with toggle only
│
└── Content
```

### After (Proposed)
```text
[TopNavbar - no currency/language]
│
├── Page Header with ALL controls:
│   ┌────────────────────────────────────────────────────────────┐
│   │ [Off-Plan] vs [Secundaria]                                 │
│   │                                                            │
│   │ [⚙️ Reconfigurar]  [🏠 Renta Larga | 🌴 Airbnb]            │
│   │                    [🇪🇸 ES]  [🇦🇪 AED ▼]                   │
│   └────────────────────────────────────────────────────────────┘
│
└── Content with dual currency everywhere
```

### Configurator Modal - Dual Currency Display
```text
┌─────────────────────────────────────────────────────────────────┐
│  Detalles de Propiedad                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Precio de Compra (AED)                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1,200,000                                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ≈ $326,700 USD                                                 │
│  Off-Plan: AED 1,450,000 ($395,100)                             │
│                                                                  │
│  Área (sqft)                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 750                                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Order

1. **Update OffPlanVsSecondary.tsx** - Remove navbar props, add in-page controls
2. **Update ComparisonConfiguratorModal.tsx** - Add and pass currency/rate/language props
3. **Update SecondaryPropertyStep.tsx** - Add dual currency display to all monetary fields
4. **Update HeadToHeadTable.tsx** - Add dual currency support

---

## Technical Notes

### Rental Mode Toggle Icons Explanation
The toggle uses:
- `Home` icon (🏠) = Long-term rental
- `Palmtree` icon (🌴) = Airbnb/Short-term rental (palm tree represents vacation/holiday rentals)

### Currency Formatting Pattern
Follow the same pattern as CashflowView (lines 336-346):
```tsx
<Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
  <SelectTrigger className="w-[140px] border-theme-border bg-theme-card text-theme-text">
    <Coins className="w-3.5 h-3.5 mr-1 text-theme-accent" />
    <SelectValue />
  </SelectTrigger>
  <SelectContent className="bg-theme-card border-theme-border">
    {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
      <SelectItem key={key} value={key}>{config.flag} {key}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Dual Currency Helper Text Pattern
```tsx
{currency !== 'AED' && rate && (
  <p className="text-[10px] text-theme-text-muted">
    ≈ {formatCurrency(value, currency, rate)}
  </p>
)}
```
