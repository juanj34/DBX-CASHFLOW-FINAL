
# Plan: Show ALL Payments Including During Handover

## Root Cause Identified

Looking at the screenshot, payments jump from Month 9 (Oct 2026) to Month 18 (Jul 2027) - **Months 10-17 are missing!**

The problem is twofold:
1. **ScrollArea limiting visibility** - The `max-h-[180px]` constraint is cutting off payments
2. **Filtering logic** - For post-handover plans, the code splits payments into "pre-handover" and "post-handover" but payments that fall DURING the handover quarter might be in limbo

## Solution

Remove ALL scroll limits and show every single payment in a continuous list. The page will be long but complete.

---

## Technical Changes

### File: `src/components/roi/snapshot/CompactPaymentTable.tsx`

### Change 1: Remove ScrollArea from The Journey Section (Lines 277-320)

**Current:**
```tsx
<ScrollArea className="max-h-[180px]">
  <div className="space-y-1 pr-2">
    {preHandoverPayments.map((payment, index) => {
      // ...
    })}
  </div>
</ScrollArea>
```

**New:**
```tsx
<div className="space-y-1">
  {preHandoverPayments.map((payment, index) => {
    // ...
  })}
</div>
```

### Change 2: Remove ScrollArea from Post-Handover Section (Lines 349-369)

**Current:**
```tsx
<ScrollArea className="max-h-[150px]">
  <div className="space-y-1 pr-2">
    {derivedPostHandoverPayments.map((payment, index) => {
      // ...
    })}
  </div>
</ScrollArea>
```

**New:**
```tsx
<div className="space-y-1">
  {derivedPostHandoverPayments.map((payment, index) => {
    // ...
  })}
</div>
```

### Change 3: Remove unused ScrollArea import (Line 10)

Remove the import since we're no longer using it.

### Change 4: Restore descriptive summary label (Lines 402-414)

**Current:**
```tsx
<div className="flex items-center justify-between bg-theme-accent/5 border border-theme-accent/20 rounded-md px-2 py-1.5">
  <span className="text-[10px] text-theme-accent font-medium flex items-center gap-1">
    <Wallet className="w-3 h-3" />
    Cash Until Handover
  </span>
  ...
</div>
```

**New:**
```tsx
<div className="bg-theme-accent/10 border border-theme-accent/30 rounded-lg p-2">
  <div className="text-[10px] uppercase tracking-wide text-theme-accent font-semibold mb-1 flex items-center gap-1">
    <Wallet className="w-3 h-3" />
    Total Cash Until Handover
  </div>
  <DottedRow 
    label="Entry + Journey + Handover"
    value={getDualValue(totalUntilHandover).primary}
    secondaryValue={getDualValue(totalUntilHandover).secondary}
    bold
    valueClassName="text-theme-accent"
  />
  <p className="text-[10px] text-theme-text-muted mt-1">
    Cash required before rental income starts
  </p>
</div>
```

---

## Visual Result

### Before (broken - missing payments):
```
THE JOURNEY (19MO)
Month 1 (Feb 2026)         AED 12,284 (2,886 €)
...
Month 9 (Oct 2026)         AED 12,284 (2,886 €)
                           ← Cut off! Months 10-17 MISSING!

POST-HANDOVER (34%)
Month 18 (Jul 2027)        AED 12,284 (2,886 €)
...
Month 25 (Feb 2028)        AED 12,284 (2,886 €)
                           ← Also cut off!
```

### After (fixed - ALL payments visible):
```
THE JOURNEY (19MO)
Month 1 (Feb 2026)         AED 12,284 (2,886 €)
Month 2 (Mar 2026)         AED 12,284 (2,886 €)
...
Month 10 (Nov 2026)        AED 12,284 (2,886 €)
Month 11 (Dec 2026)        AED 12,284 (2,886 €)  🔑 Handover
Month 12 (Jan 2027)        AED 12,284 (2,886 €)  🔑 Handover
...
Month 17 (Jun 2027)        AED 12,284 (2,886 €)
                           ← ALL pre-handover payments shown!

ON HANDOVER (0%)
Handover Payment           AED 0

POST-HANDOVER (34%)
Month 18 (Jul 2027)        AED 12,284 (2,886 €)
Month 19 (Aug 2027)        AED 12,284 (2,886 €)
...
Month 51 (Dec 2029)        AED 12,284 (2,886 €)
                           ← ALL post-handover payments shown!

┌─ 💰 TOTAL CASH UNTIL HANDOVER ──────────────────┐
│ Entry + Journey + Handover   AED 1,208,400      │
│ Cash required before rental income starts       │
└──────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|--------|
| `src/components/roi/snapshot/CompactPaymentTable.tsx` | 1. Remove ScrollArea from The Journey section<br>2. Remove ScrollArea from Post-Handover section<br>3. Remove unused ScrollArea import<br>4. Restore descriptive "Entry + Journey + Handover" summary label |

---

## Benefits

1. **All payments visible** - No more cut-off or missing payments
2. **Complete picture** - User sees the entire payment schedule from start to finish
3. **Clearer summary** - "Entry + Journey + Handover" explicitly shows what's included
4. **Long page is OK** - The snapshot view can scroll vertically; PDF export uses separate component
