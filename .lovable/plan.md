
# Plan: Client Portal Access & Configurator Improvements

## Current State Analysis

### 1. Client Portal Location
The client portal was created at `/portal/:portalToken` and the Clients Manager at `/clients`. However, there's **no navigation link** to `/clients` in the sidebar or dashboard. Brokers can only access it by manually typing the URL.

### 2. Configurator Issues Identified

| Issue | Current State |
|-------|---------------|
| "Balanced" Growth Not Preselected | `NEW_QUOTE_OI_INPUTS` has balanced values but `AppreciationSection` doesn't visually select it on load |
| Developer/Project Inline Creation | Currently requires clicking "Add manually" - no inline creation when typing a non-existent value |
| Booking Date Defaults | Already using `new Date().getMonth() + 1` and `new Date().getFullYear()` in `NEW_QUOTE_OI_INPUTS` - works correctly |
| Post-Handover Payment Plan | Current complex system with separate toggles - user wants simpler approach |
| Installment Dates | Shows "Month 6" instead of actual dates like "Jul 2025" |
| Handover Highlighting | No visual distinction for payments happening after handover |

---

## Technical Changes

### Phase 1: Add Clients Manager Access

**File: `src/components/roi/dashboard/DashboardSidebar.tsx`**
- Add "Clients" navigation link to the sidebar under a new "Management" section
- Link to `/clients` page

**File: `src/pages/Home.tsx` or Dashboard**
- Add card/link to access Clients Manager

---

### Phase 2: Preselect "Balanced" Growth Profile

**File: `src/components/roi/configurator/AppreciationSection.tsx`**

The `getSelectedProfile()` function already correctly identifies when "balanced" values are set. The issue is that new quotes don't trigger visual selection because the comparison needs to match exactly.

Update the `getSelectedProfile` function to handle the default case more robustly:

```typescript
const getSelectedProfile = (): ProfileKey | 'custom' => {
  const construction = inputs.constructionAppreciation ?? 12;
  const growth = inputs.growthAppreciation ?? 8;
  const mature = inputs.matureAppreciation ?? 4;
  const period = inputs.growthPeriodYears ?? 3; // Default to 3 for balanced

  // Check all profiles
  for (const [key, profile] of Object.entries(APPRECIATION_PROFILES)) {
    if (
      profile.constructionAppreciation === construction &&
      profile.growthAppreciation === growth &&
      profile.matureAppreciation === mature &&
      profile.growthPeriodYears === period
    ) {
      return key as ProfileKey;
    }
  }
  return 'custom';
};
```

The `APPRECIATION_PROFILES.balanced` has `growthPeriodYears: 3`, but `NEW_QUOTE_OI_INPUTS` also has `growthPeriodYears: 3` - so this should match. Verify the values align.

---

### Phase 3: Inline Developer/Project Creation

**File: `src/components/roi/configurator/DeveloperSelect.tsx`**

Current behavior: User types → sees "No developer found" → must click "Add manually"

New behavior: When user types a name that doesn't exist and presses Enter or loses focus, automatically create it

```typescript
// Add onInputChange handler to CommandInput
const [inputValue, setInputValue] = useState('');

const handleCreateNew = () => {
  if (inputValue.trim()) {
    // Switch to manual mode and pre-fill the value
    onValueChange(null, inputValue.trim());
    onManualMode();
    setOpen(false);
  }
};

// In CommandEmpty:
<CommandEmpty className="text-gray-400 py-2">
  {loading ? "Loading..." : (
    <div className="flex flex-col items-center gap-2">
      <span>No developer found</span>
      {inputValue && (
        <Button 
          size="sm" 
          onClick={handleCreateNew}
          className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
        >
          <Plus className="w-3 h-3 mr-1" />
          Create "{inputValue}"
        </Button>
      )}
    </div>
  )}
</CommandEmpty>
```

**File: `src/components/roi/configurator/ProjectSelect.tsx`**
- Same pattern as DeveloperSelect

---

### Phase 4: Simplify Post-Handover Payment Plan

**Current Complexity:**
- Toggle to enable post-handover plan
- Separate "On Handover %" slider
- Post-handover end date picker
- Post-handover installment generator
- Complex 4-part split display

**New Simplified Approach:**
Replace with a simple toggle that allows installments to extend past handover date, showing the actual payment dates.

**File: `src/components/roi/configurator/PaymentSection.tsx`**

Remove import of `PostHandoverSection` and add a simpler toggle:

```typescript
// New state for allowing payments past handover
const allowPastHandover = inputs.hasPostHandoverPlan ?? false;

// Toggle in the UI
<div className="flex items-center justify-between p-3 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
  <div className="flex items-center gap-2">
    <Calendar className="w-4 h-4 text-purple-400" />
    <span className="text-sm text-gray-300">Allow Payments Past Handover</span>
    <InfoTooltip translationKey="tooltipAllowPastHandover" />
  </div>
  <Switch 
    checked={allowPastHandover} 
    onCheckedChange={(checked) => setInputs(prev => ({ 
      ...prev, 
      hasPostHandoverPlan: checked 
    }))}
  />
</div>
```

**Update installment display to show actual dates:**

In the installment rows, instead of just showing "Mo 6", show the actual date:

```typescript
// Calculate the actual date for each payment
const getPaymentDate = (monthsFromBooking: number): string => {
  const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);
  return paymentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const isPostHandover = (monthsFromBooking: number): boolean => {
  const handoverMonth = ((inputs.handoverQuarter - 1) * 3) + 1;
  const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
  const handoverDate = new Date(inputs.handoverYear, handoverMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);
  return paymentDate >= handoverDate;
};

// In the installment row display:
<div className="flex items-center gap-0.5">
  <span className="text-[10px] text-gray-400">
    {getPaymentDate(payment.triggerValue)}
  </span>
  {isPostHandover(payment.triggerValue) && allowPastHandover && (
    <span className="text-[8px] px-1 py-0.5 bg-green-500/20 text-green-400 rounded">
      Post-HO
    </span>
  )}
</div>
```

---

### Phase 5: Highlight Post-Handover Payments in Views

**File: `src/components/roi/snapshot/CompactPaymentTable.tsx`**

Add visual indicator for payments in the handover quarter and beyond:

```typescript
// Calculate handover date
const handoverMonth = ((handoverQuarter - 1) * 3) + 1;
const handoverDate = new Date(handoverYear, handoverMonth - 1);

// Check if a payment is in handover quarter
const isHandoverQuarter = (payment: PaymentMilestone): boolean => {
  const paymentDate = new Date(bookingYear, bookingMonth - 1);
  paymentDate.setMonth(paymentDate.getMonth() + payment.triggerValue);
  
  const handoverQuarterStart = new Date(handoverYear, (handoverQuarter - 1) * 3);
  const handoverQuarterEnd = new Date(handoverYear, handoverQuarter * 3);
  
  return paymentDate >= handoverQuarterStart && paymentDate < handoverQuarterEnd;
};

// In the payment row:
{isHandoverQuarter(payment) && (
  <span className="text-[8px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 whitespace-nowrap">
    🔑 Handover
  </span>
)}
```

**File: `src/components/roi/PaymentBreakdown.tsx`**
- Add same handover highlighting
- Show actual dates for each installment

**File: `src/components/roi/snapshot/MilestoneTable.tsx`**
- Already shows some milestone info, enhance with handover badges

---

### Phase 6: Delete PostHandoverSection (Optional)

**File: `src/components/roi/configurator/PostHandoverSection.tsx`**
- Can be removed entirely if we're simplifying to just the toggle

**File: `src/components/roi/configurator/PaymentSection.tsx`**
- Remove the `import { PostHandoverSection }` and the `<PostHandoverSection />` component

---

## Summary of Changes

| File | Changes |
|------|---------|
| `DashboardSidebar.tsx` | Add "Clients" link under Management section |
| `AppreciationSection.tsx` | Ensure balanced profile is correctly detected and selected |
| `DeveloperSelect.tsx` | Add inline creation when typing non-existent developer |
| `ProjectSelect.tsx` | Add inline creation when typing non-existent project |
| `PaymentSection.tsx` | Remove PostHandoverSection, add simple toggle, show actual dates, add post-handover badge |
| `CompactPaymentTable.tsx` | Add handover quarter highlighting with badge |
| `PaymentBreakdown.tsx` | Add actual dates and handover highlighting |
| `types.ts` | Verify `NEW_QUOTE_OI_INPUTS` has correct balanced values |

---

## Visual Changes Preview

### Installment Row (Before → After)
```
Before: [Mo 6] [10%] [X]
After:  [Jul 2025] [10%] [Post-HO badge] [X]
```

### Snapshot Payment Table (Before → After)
```
Before:
├ Month 12  ─────────── 10% ─── AED 100,000

After:
├ Nov 2026 [🔑 Handover] ── 10% ─── AED 100,000
```

---

## Implementation Order

1. Add Clients link to sidebar (quick win)
2. Fix balanced growth preselection 
3. Add inline developer/project creation
4. Simplify payment section with toggle + dates
5. Add handover badges to payment displays
6. Remove PostHandoverSection component

