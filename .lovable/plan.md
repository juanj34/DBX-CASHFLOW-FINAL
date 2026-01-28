

# Plan: Simplify Post-Handover Coverage Card

## User's Feedback

The current card is too complex with nested sections. User wants:
1. **Monthly gap comparison** - Show if there's a monthly shortfall they need to cover
2. **Simple totals** - "Tenant pays X, You pay Y" - clean and done

## Simplified Layout

```
┌─────────────────────────────────────────────────────┐
│ ◐ POST-HANDOVER COVERAGE           [22mo (8 payments)]│
├─────────────────────────────────────────────────────┤
│ Post-HO Payments (55%)              AED 596,985     │
│ Per Installment (8x)                AED 74,623      │
│─────────────────────────────────────────────────────│
│ Monthly: Payment                    AED 27,135/mo   │
│ Monthly: Rent                      +AED 6,882/mo    │
│ Monthly Gap                        -AED 20,253/mo   │ ← Shows shortfall
│─────────────────────────────────────────────────────│
│ Tenant Covers (22mo rent)          +AED 151,411     │
│ You Pay                             AED 445,574     │
├─────────────────────────────────────────────────────┤
│  ⚠ Tenant covers 25% • Your net: AED 445,574       │
└─────────────────────────────────────────────────────┘
```

## Technical Changes

### File: `src/components/roi/snapshot/CompactPostHandoverCard.tsx`

**Restructure content to show:**

1. **Header section** (keep as-is)
2. **Post-HO totals** 
   - Post-HO Payments total
   - Per Installment amount
3. **Monthly cashflow analysis** (NEW section)
   - Monthly Payment (burn rate)
   - Monthly Rent income
   - Monthly Gap/Surplus
4. **Simple summary**
   - Tenant Covers (total)
   - You Pay (total)
5. **Status badge** (keep)

**Key Logic (already calculated, just need to display):**
```tsx
// Monthly burn rate
const monthlyEquivalent = postHandoverTotal / actualDurationMonths;

// Monthly gap (negative = shortfall)
const monthlyCashflow = monthlyRent - monthlyEquivalent;
const monthlyGap = Math.abs(monthlyCashflow);
const hasMonthlyShortfall = monthlyCashflow < 0;
```

**Simplified Content Section:**
```tsx
<div className="p-3 space-y-1.5">
  {/* Post-HO Total */}
  <DottedRow label="Post-HO Payments (55%)" value="AED 596,985" />
  <DottedRow label="Per Installment (8x)" value="AED 74,623" valueClassName="text-purple-400" />
  
  {/* Monthly Cashflow - Only show if there's a gap */}
  <div className="pt-2 mt-1 border-t border-dashed border-theme-border/50 space-y-1">
    <DottedRow label="Monthly: Payment" value="AED 27,135/mo" />
    <DottedRow label="Monthly: Rent" value="+AED 6,882/mo" valueClassName="text-cyan-400" />
    <DottedRow 
      label="Monthly Gap" 
      value="-AED 20,253/mo" 
      valueClassName="text-red-400"
      bold 
    />
  </div>
  
  {/* Simple Summary - WHO PAYS WHAT */}
  <div className="pt-2 mt-1 border-t border-theme-border space-y-1">
    <DottedRow 
      label="Tenant Covers (22mo rent)" 
      value="+AED 151,411" 
      valueClassName="text-cyan-400" 
    />
    <DottedRow 
      label="You Pay" 
      value="AED 445,574" 
      bold 
      valueClassName="text-red-400" 
    />
  </div>
  
  {/* Status Badge */}
  <div className="...status badge...">
    Tenant covers 25% • Your net: AED 445,574
  </div>
</div>
```

## Summary

| What | Change |
|------|--------|
| Remove | "Who Pays What" header label (unnecessary) |
| Add | Monthly cashflow section showing payment vs rent vs gap |
| Keep | Simple "Tenant Covers" + "You Pay" totals |
| Keep | Status badge at bottom |

This gives the user:
1. Month-to-month gap visibility (they can see they need to cover AED 20,253/mo)
2. Clean totals showing exactly what tenant pays vs what they pay

