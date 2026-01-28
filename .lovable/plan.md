

# Plan: Enhance Tenant Summary with Handover Payment + Total

## Current State

The "Simple Summary" section shows:
```
Tenant Covers (22mo rent)    +AED 151,411
You Pay                       AED 445,574
```

## Desired State

Show the tenant's full picture:
```
On Handover (tenant pays)     AED 0         ← What's due on handover day
Tenant Covers (22mo rent)    +AED 151,411   ← Rent collected over period
You Pay                       AED 445,574   ← Your net out-of-pocket
```

**Note:** The "On Handover" row would show the on-handover installment amount (if any). This helps the user understand what cash is needed on day 1 vs. what gets covered by rent over time.

---

## Technical Changes

### File: `src/components/roi/snapshot/CompactPostHandoverCard.tsx`

**Step 1: Calculate on-handover payment amount**

Add logic to extract the on-handover payment from inputs:

```tsx
// On-handover payment (what's due at handover, separate from post-HO installments)
const onHandoverPercent = inputs.onHandoverPercent || 0;
const onHandoverAmount = basePrice * (onHandoverPercent / 100);
```

**Step 2: Update the Simple Summary section (lines 169-184)**

Add the on-handover row before "Tenant Covers":

```tsx
{/* Simple Summary */}
<div className="pt-2 mt-1 border-t border-theme-border space-y-1">
  {/* On Handover Payment - what's due on handover day */}
  {onHandoverAmount > 0 && (
    <DottedRow 
      label="On Handover"
      value={getDualValue(onHandoverAmount).primary}
      secondaryValue={getDualValue(onHandoverAmount).secondary}
      valueClassName="text-yellow-400"
    />
  )}
  
  {/* Tenant Covers */}
  <DottedRow 
    label={`Tenant Covers (${actualDurationMonths}mo rent)`}
    value={`+${getDualValue(totalTenantContribution).primary}`}
    secondaryValue={getDualValue(totalTenantContribution).secondary}
    valueClassName="text-cyan-400"
  />
  
  {/* You Pay */}
  <DottedRow 
    label="You Pay"
    value={getDualValue(netOutOfPocket).primary}
    secondaryValue={getDualValue(netOutOfPocket).secondary}
    bold
    valueClassName={netOutOfPocket > 0 ? "text-red-400" : "text-green-400"}
  />
</div>
```

---

## Summary

| Row | Description | Color |
|-----|-------------|-------|
| On Handover | Amount due at handover day (if > 0) | Yellow |
| Tenant Covers | Total rent over post-HO period | Cyan |
| You Pay | Net out-of-pocket after tenant covers | Red/Green |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/roi/snapshot/CompactPostHandoverCard.tsx` | Add on-handover payment row to the summary section |

