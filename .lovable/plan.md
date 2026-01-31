

# Simplify Payment Structure Preview - Remove Unused Fields

## Problem

The "Handover Quarter" and "Handover Year" fields in the ExtractedDataPreview are:
1. **Never filled by AI** - The edge function only extracts `handoverMonthFromBooking`
2. **Completely redundant** - The configurator calculates Q/Y from `handoverMonthFromBooking + bookingDate` when you click "Apply to Configurator"
3. **Confusing to users** - Empty dropdowns make it look like extraction failed

## Solution

Remove these useless fields from the preview. The only field needed is `handoverMonthFromBooking` since the configurator derives Q/Y automatically.

## Changes

### File: `src/components/roi/configurator/ExtractedDataPreview.tsx`

**Remove lines 323-349** (the Handover Quarter and Handover Year fields):

```diff
  <div>
    <Label className="text-xs flex items-center gap-1">
      Handover Month (from booking)
      ...
    </Label>
    <Input
      type="number"
      value={data.paymentStructure.handoverMonthFromBooking || ''}
      ...
    />
    <p className="text-[10px] text-muted-foreground mt-0.5">
-     Auto-calculated from last pre-HO payment
+     Handover Q/Y auto-calculated when applied
    </p>
  </div>
- <div>
-   <Label className="text-xs">Handover Quarter</Label>
-   <Select
-     value={data.paymentStructure.handoverQuarter?.toString() || ''}
-     ...
-   </Select>
- </div>
- <div>
-   <Label className="text-xs">Handover Year</Label>
-   <Input
-     type="number"
-     value={data.paymentStructure.handoverYear || ''}
-     ...
-   />
- </div>
```

**Update grid layout** from `grid-cols-2` to single column for the handover month field, or keep 2 columns with the toggle taking half:

```tsx
<div className="grid grid-cols-2 gap-3">
  <div>
    <Label className="text-xs">Split</Label>
    <Input ... />
  </div>
  <div className="flex items-center gap-2 pt-4">
    <Switch ... />
    <Label className="text-xs">Post-Handover Plan</Label>
  </div>
  <div className="col-span-2">
    <Label className="text-xs flex items-center gap-1">
      Handover Month (from booking)
      <Tooltip>...</Tooltip>
    </Label>
    <Input ... />
    <p className="text-[10px] text-muted-foreground mt-0.5">
      Handover quarter & year will be calculated from your booking date
    </p>
  </div>
</div>
```

## Resulting UI

**Before:**
```
| Split       | 🔘 Post-Handover Plan |
| HO Month: 27| Handover Quarter: ▼   |
| (empty help)| Handover Year: ___    |
```

**After:**
```
| Split       | 🔘 Post-Handover Plan |
| Handover Month (from booking): 27    |
| (Q/Y auto-calculated from booking)   |
```

## Why This Works

When user clicks "Apply to Configurator", the mapping logic in `PaymentSection.tsx` and `ClientSection.tsx` already does:

```typescript
if (data.paymentStructure.handoverMonthFromBooking) {
  const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
  const handoverDate = new Date(bookingDate);
  handoverDate.setMonth(handoverDate.getMonth() + handoverMonths);
  
  handoverMonth = handoverDate.getMonth() + 1;
  handoverYear = handoverDate.getFullYear();
  handoverQuarter = Math.ceil(handoverMonth / 3);
}
```

So the Quarter/Year fields in the preview serve no purpose.

