
# Plan: Global Currency/Language Propagation in Presentation and Client Views

## Issues Identified

### Issue 1: PropertyHeroCard Shows Non-Functional Selectors
In `PresentationPreview.tsx`, when passing to `SnapshotContent`:
```tsx
setCurrency={() => {}}  // Empty function - truthy, so selectors show but don't work
setLanguage={() => {}}
```
This causes PropertyHeroCard to display currency/language selectors that do nothing when clicked.

### Issue 2: SnapshotView Ignores URL Parameters
`ClientPortal.tsx` line 380 opens snapshots with URL params:
```tsx
window.open(`/snapshot/${quote.share_token}?currency=${currency}&lang=${language}`, '_blank')
```
But `SnapshotView.tsx` doesn't read these params - it just initializes with default `'AED'` and `'en'`.

### Issue 3: Duplicate Control Points
Both the sidebar (PresentationView) and the PropertyHeroCard have currency/language selectors, causing confusion about which one controls the display.

---

## Solution Architecture

**Single Source of Truth**: Currency and language are controlled ONLY from:
- **Presentation View**: Sidebar selectors (already implemented)
- **Snapshot View**: PropertyHeroCard selectors (for direct snapshot links)
- **Client Portal**: Header selectors (for the portal page itself)

**Propagation Flow**:
```
PresentationView (sidebar)
    │
    └─► PresentationPreview
            │
            └─► SnapshotContent (receives values, NO selectors)
                    │
                    └─► PropertyHeroCard (NO selectors in presentation)
                    └─► SnapshotOverviewCards (uses currency/rate)
                    └─► CompactPaymentTable (uses currency/rate)
                    └─► etc.
```

---

## File Changes

### 1. `src/components/presentation/PresentationPreview.tsx`

**Hide PropertyHeroCard selectors when embedded in presentation** (lines 124-144):

Change:
```tsx
<SnapshotContent
  ...
  setCurrency={() => {}}
  setLanguage={() => {}}
  ...
/>
```

To:
```tsx
<SnapshotContent
  ...
  setCurrency={undefined}  // Pass undefined to hide selectors
  setLanguage={undefined}
  ...
/>
```

This will cause PropertyHeroCard's condition `showPriceInfo && setCurrency && setLanguage` to be false, hiding the redundant selectors.

### 2. `src/components/roi/snapshot/SnapshotContent.tsx`

**Make setCurrency/setLanguage optional** - Update interface to allow undefined:

```tsx
interface SnapshotContentProps {
  ...
  setCurrency?: (currency: Currency) => void;  // Make optional
  setLanguage?: (language: 'en' | 'es') => void;  // Make optional
  ...
}
```

Pass through to PropertyHeroCard only if defined:
```tsx
<PropertyHeroCard
  ...
  setCurrency={setCurrency}  // Will be undefined in presentation mode
  setLanguage={setLanguage}
  ...
/>
```

### 3. `src/pages/SnapshotView.tsx`

**Read currency/language from URL params**:

```tsx
import { useParams, useSearchParams } from 'react-router-dom';

const SnapshotView = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [searchParams] = useSearchParams();
  
  // Initialize from URL params or defaults
  const [currency, setCurrency] = useState<Currency>(() => {
    const urlCurrency = searchParams.get('currency');
    if (urlCurrency && ['AED', 'USD', 'EUR', 'GBP', 'COP'].includes(urlCurrency)) {
      return urlCurrency as Currency;
    }
    return 'AED';
  });
  
  const [language, setLanguage] = useState<'en' | 'es'>(() => {
    const urlLang = searchParams.get('lang');
    return urlLang === 'es' ? 'es' : 'en';
  });
  ...
```

### 4. Verify All Snapshot Sub-Components Use Currency Props

The following components already receive `currency` and `rate` props - verify they're being used for formatting:

| Component | Currency Prop Used? |
|-----------|---------------------|
| `SnapshotOverviewCards` | Yes - passed and used |
| `CompactPaymentTable` | Yes - passed and used |
| `CompactRentCard` | Yes - passed and used |
| `CompactMortgageCard` | Yes - passed and used |
| `CompactPostHandoverCard` | Yes - passed and used |
| `CompactAllExitsCard` | Yes - passed and used |

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/presentation/PresentationPreview.tsx` | Pass `undefined` for setCurrency/setLanguage to hide PropertyHeroCard selectors |
| `src/components/roi/snapshot/SnapshotContent.tsx` | Make setCurrency/setLanguage props optional |
| `src/pages/SnapshotView.tsx` | Read currency/language from URL search params |

---

## Expected Results

| Scenario | Before | After |
|----------|--------|-------|
| Presentation sidebar currency change | Only sidebar shows selection, prices don't update | Prices update across all snapshots |
| PropertyHeroCard in presentation | Shows non-functional selectors | Selectors hidden (sidebar controls only) |
| ClientPortal "View" button | Opens snapshot with default AED/EN | Opens snapshot with selected currency/language |
| Direct snapshot link | Always AED/EN | Can specify `?currency=USD&lang=es` |

---

## Technical Notes

**Why pass `undefined` instead of empty functions?**
- PropertyHeroCard condition: `showPriceInfo && setCurrency && setLanguage`
- Empty function `() => {}` is truthy, so condition passes
- `undefined` is falsy, so condition fails and selectors are hidden

**URL param approach for ClientPortal**
- ClientPortal opens quotes in new tabs via snapshot links
- Passing state via URL params is the correct approach for cross-tab communication
- SnapshotView just needs to read these params on load
