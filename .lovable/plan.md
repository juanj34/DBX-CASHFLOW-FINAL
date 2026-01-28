

# Plan: Remove "Total to this point" from Standard Payment Plans

## Issue

The "Total to this point" cumulative row is currently showing in the Handover section for standard (non-post-handover) payment plans. The user wants this to only appear on post-handover payment plans.

## Current Behavior

For standard plans, the UI shows:
```
HANDOVER (60%)
Final Payment           AED 702,600
───────────────────────────────────
Total to this point     AED 1,222,848  ← Should NOT appear
```

## Desired Behavior

For standard plans:
```
HANDOVER (60%)
Final Payment           AED 702,600
```

The "Total to this point" cumulative should **only** appear when `hasPostHandoverPlan` is true.

---

## Technical Changes

### File: `src/components/roi/snapshot/CompactPaymentTable.tsx`

**Remove the "Total to this point" section from the standard plan's Handover block (lines 370-384)**

Delete the cumulative display inside the standard handover section:

```tsx
{/* For standard plans - remove this block completely */}
{!hasPostHandoverPlan && (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-green-400 font-semibold mb-2">
      Handover ({handoverPercent}%)
    </div>
    <div className="space-y-1">
      <DottedRow 
        label="Final Payment"
        value={getDualValue(handoverAmount).primary}
        secondaryValue={getDualValue(handoverAmount).secondary}
        bold
        valueClassName="text-green-400"
      />
    </div>
    {/* DELETE THIS ENTIRE BLOCK (lines 370-384) */}
    {/* <div className="mt-2 pt-1.5 border-t border-dashed border-theme-border/50">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-theme-text-muted flex items-center gap-1">
          <Wallet className="w-2.5 h-2.5" />
          Total to this point
        </span>
        ...
      </div>
    </div> */}
  </div>
)}
```

---

## Summary

| Scenario | "Total to this point" |
|----------|----------------------|
| Standard payment plan | ❌ Not shown |
| Post-handover plan (inline after handover quarter) | ✅ Shown |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/roi/snapshot/CompactPaymentTable.tsx` | Remove cumulative "Total to this point" display from standard payment plan Handover section (lines 370-384) |

