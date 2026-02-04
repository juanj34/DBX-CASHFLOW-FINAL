
# Plan: Fix Configurator UX/UI - Remove Duplicate Headers and Improve Consistency

## Problem Analysis

The configurator wizard has **multiple UX issues** where headers are duplicated and inconsistent across sections:

### Issue 1: Duplicate "Payment Plan" Headers
The `ConfiguratorLayout.tsx` wraps `PaymentSection` with its own header:
```tsx
// ConfiguratorLayout.tsx (lines 446-455)
case 'payment':
  return (
    <div className="space-y-4">
      <div>
        <h3>Payment Plan</h3>               // <-- Header #1
        <p>Configure payment split and installments</p>
      </div>
      <PaymentSection />
    </div>
  );
```

But `PaymentSection.tsx` also has its own header inside:
```tsx
// PaymentSection.tsx (lines 422-426)
<div>
  <h3>Payment Plan</h3>                    // <-- Header #2 (DUPLICATE!)
  <p>Configure your payment schedule</p>
</div>
```

**Result:** User sees "Payment Plan" TWICE as shown in the screenshot.

### Issue 2: Similar Duplicate in Rental Section
`RentalSection.tsx` adds a header wrapper:
```tsx
<h3>Rental Strategy</h3>
<p>Configure yield, service charges...</p>
```

Then `RentSection.tsx` inside also has:
```tsx
<h3>Rental Strategy</h3>
<p>Configure rental income projections</p>
```

### Issue 3: Inconsistent Section Header Patterns
Some sections have their OWN headers (internal), while the layout ALSO adds headers:

| Section | Layout Header | Internal Header | Result |
|---------|---------------|-----------------|--------|
| Location | None | Yes | OK |
| Property | Yes | None | OK |
| Payment | Yes | Yes | DUPLICATE |
| Appreciation | Yes | Yes | DUPLICATE (Different text) |
| Rental | Yes (wrapper) | Yes (RentSection) | DUPLICATE |
| Exit | None | Yes | OK |

---

## Solution

Adopt a **single source of truth** pattern: Let each section component own its header internally, and remove the wrapper headers from `ConfiguratorLayout.tsx`.

### Changes Required

#### 1. `ConfiguratorLayout.tsx` - Remove Wrapper Headers (lines 430-478)
**Before:**
```tsx
case 'property':
  return (
    <div className="space-y-4">
      <div>
        <h3>Property Details</h3>
        <p>Base price, booking date, and entry costs</p>
      </div>
      <PropertySection />
    </div>
  );
case 'payment':
  return (
    <div className="space-y-4">
      <div>
        <h3>Payment Plan</h3>
        <p>Configure payment split and installments</p>
      </div>
      <PaymentSection />
    </div>
  );
case 'appreciation':
  return (
    <div className="space-y-4">
      <div>
        <h3>Appreciation Profile</h3>
        <p>Configure growth rates...</p>
      </div>
      <AppreciationSection />
    </div>
  );
```

**After:**
```tsx
case 'property':
  return <PropertySection />;
case 'payment':
  return <PaymentSection />;
case 'appreciation':
  return <AppreciationSection />;
```

#### 2. `PropertySection.tsx` - Add Internal Header
Currently missing a header. Add one for consistency:
```tsx
return (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold text-theme-text mb-1">Property Details</h3>
      <p className="text-sm text-theme-text-muted">Base price, booking date, and entry costs</p>
    </div>
    {/* ...existing content... */}
  </div>
);
```

#### 3. `RentalSection.tsx` - Remove Duplicate Wrapping
**Before:**
```tsx
return (
  <div className="space-y-4">
    <div>
      <h3>Rental Strategy</h3>  // Wrapper header
      <p>Configure yield, service charges...</p>
    </div>
    <div className="border...">
      <div className="flex items-center...">
        <h4>Long-Term & Short-Term Rental</h4>  // Sub-header
        <p>Configure rental income projections</p>
      </div>
      <RentSection />
    </div>
  </div>
);
```

**After:** Remove the outer header since `RentSection` has its own, OR remove the header from `RentSection` and keep only the wrapper.

#### 4. `RentSection.tsx` - Remove Internal Header
Since it's embedded inside `RentalSection`, remove its own header:
```tsx
// Remove lines 63-67
<div>
  <h3 className="text-lg font-semibold text-theme-text mb-1">Rental Strategy</h3>
  <p className="text-sm text-theme-text-muted">Configure rental income projections</p>
</div>
```

#### 5. `MobileConfiguratorSheet.tsx` - Apply Same Fixes (lines 274-320)
The mobile version has the same duplicate header issue. Apply identical fixes.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/roi/configurator/ConfiguratorLayout.tsx` | Remove wrapper headers for property, payment, appreciation sections |
| `src/components/roi/configurator/PropertySection.tsx` | Add internal section header |
| `src/components/roi/configurator/RentalSection.tsx` | Simplify to just render `RentSection` without duplicate header wrapper |
| `src/components/roi/configurator/RentSection.tsx` | Remove internal header (let parent handle it) |
| `src/components/roi/configurator/MobileConfiguratorSheet.tsx` | Apply same fixes for mobile view |

---

## Visual Result After Fix

**Before (current broken state):**
```
┌─────────────────────────────────────┐
│ Payment Plan                        │  <-- Header #1 (from Layout)
│ Configure payment split and...      │
│                                     │
│ Payment Plan                        │  <-- Header #2 (from Component) ❌
│ Configure your payment schedule     │
│ [AI Import button]                  │
└─────────────────────────────────────┘
```

**After (fixed):**
```
┌─────────────────────────────────────┐
│ Payment Plan           [AI Import]  │  <-- Single unified header ✓
│ Configure your payment schedule     │
│                                     │
│ [Allow Payments Past Handover]      │
│ [Split buttons: 20/80 30/70...]     │
└─────────────────────────────────────┘
```

---

## Summary

This fix establishes a consistent pattern:
- Each section component is self-contained with its own header
- `ConfiguratorLayout.renderSection()` simply returns the component without wrappers
- No more duplicate text, cleaner UX
