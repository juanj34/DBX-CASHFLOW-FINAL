

# Plan: Fix Cashflow View Layout & Payment Display Issues

## Issues Identified

1. **Currency Display Below Instead of Right** - When converting to a secondary currency, the value appears below the primary currency, making the list very long vertically
2. **Summary Card Too Large** - The "Total Cash Until Handover" summary card takes too much space
3. **Scroll Not Working** - Users can't scroll to see all payments in the cashflow view
4. **"Total Cash Until Handover" Position** - Should be at the bottom, not in the middle of the payment breakdown
5. **Handover Quarter Highlighting** - Need to highlight payments that fall within the handover quarter months

---

## Solution Overview

### 1. Currency Display: Side-by-Side Instead of Stacked

**Current (stacked - takes too much vertical space):**
```
Month 1 (Feb'25)           AED 25,400
                           $6,920
```

**New (inline - same row):**
```
Month 1 (Feb'25)           AED 25,400 ($6,920)
```

### 2. Summary Card: Make Compact

Reduce the "Total Cash Until Handover" summary to a simpler single-line format that doesn't dominate the view.

### 3. Fix Scroll: Ensure ScrollArea Works

The ScrollArea components are there but may not be working due to container constraints. Need to ensure the parent container allows scrolling.

### 4. Move Summary to Bottom

Move the "Total Cash Until Handover" summary from its current position (after Handover section) to the very bottom of the payment breakdown.

### 5. Highlight Handover Quarter

Payments in the handover quarter are already highlighted with `bg-green-500/10`, but we should ensure only the specific months within the handover quarter are highlighted, not all months after.

---

## Technical Changes

### File: `src/components/roi/snapshot/CompactPaymentTable.tsx`

#### Change 1: Inline Currency Display for Payment Rows (Lines 310-315, 376-380)

**Current:**
```tsx
<div className="text-right flex-shrink-0">
  <div className="text-xs font-mono text-theme-text">{getDualValue(amount).primary}</div>
  {currency !== 'AED' && (
    <div className="text-[10px] text-theme-text-muted">{getDualValue(amount).secondary}</div>
  )}
</div>
```

**New:**
```tsx
<span className="text-xs font-mono text-theme-text whitespace-nowrap">
  {getDualValue(amount).primary}
  {currency !== 'AED' && getDualValue(amount).secondary && (
    <span className="text-theme-text-muted ml-1">({getDualValue(amount).secondary})</span>
  )}
</span>
```

#### Change 2: Compact Summary Card (Lines 342-358)

**Current (large card):**
```tsx
<div className="bg-theme-accent/10 border border-theme-accent/30 rounded-lg p-2">
  <div className="text-[10px] uppercase tracking-wide text-theme-accent font-semibold mb-1 flex items-center gap-1">
    <Wallet className="w-3 h-3" />
    Total Cash Until Handover
  </div>
  <DottedRow ... />
  <p className="text-[10px] text-theme-text-muted mt-1">
    Cash required before rental income starts
  </p>
</div>
```

**New (compact inline):**
```tsx
<div className="flex items-center justify-between bg-theme-accent/5 border border-theme-accent/20 rounded-md px-2 py-1.5">
  <span className="text-[10px] text-theme-accent font-medium flex items-center gap-1">
    <Wallet className="w-3 h-3" />
    Cash Until Handover
  </span>
  <span className="text-xs font-mono font-semibold text-theme-accent">
    {getDualValue(totalUntilHandover).primary}
    {currency !== 'AED' && getDualValue(totalUntilHandover).secondary && (
      <span className="text-theme-text-muted ml-1">({getDualValue(totalUntilHandover).secondary})</span>
    )}
  </span>
</div>
```

#### Change 3: Move Summary to Bottom

Move the summary from after the Handover section (line 342) to after the Grand Total section (before Value Differentiators, around line 417).

#### Change 4: Fix ScrollArea Height Constraints

Ensure the ScrollArea components have proper height constraints that work within the card:

```tsx
<ScrollArea className="max-h-[200px] overflow-y-auto">
```

Also, the parent card should not restrict overflow. Remove `overflow-hidden` from the card container if present and ensure proper flex layout.

#### Change 5: Ensure Only Handover Quarter Months are Highlighted

The current `isPaymentInHandoverQuarter` function already checks for payments within the quarter. Verify it only highlights months 1-3 of the handover quarter, not post-handover payments.

---

## Visual Comparison

### Before:
```
┌─────────────────────────────────────────────────┐
│ THE JOURNEY (23mo)                              │
│ • Month 1 (Feb'25)             AED 25,400       │
│                                $6,920           │  ← Stacked = tall
│ • Month 2 (Mar'25)             AED 25,400       │
│                                $6,920           │
│ ... (can't scroll to see more)                  │
├─────────────────────────────────────────────────┤
│ ON HANDOVER (0%)                                │
├─────────────────────────────────────────────────┤
│ ┌─ 💰 TOTAL CASH UNTIL HANDOVER ────────────┐   │  ← Big card, wrong position
│ │ Entry + Journey + Handover  AED 1,208,400 │   │
│ │ Cash required before rental income starts │   │
│ └────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│ POST-HANDOVER                                   │
└─────────────────────────────────────────────────┘
```

### After:
```
┌─────────────────────────────────────────────────┐
│ THE JOURNEY (23mo)                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ • Month 1 (Feb'25)    AED 25,400 ($6,920)   │ │  ← Inline = compact
│ │ • Month 2 (Mar'25)    AED 25,400 ($6,920)   │▒│  ← Scrollable!
│ │ • Month 3 (Apr'25)    AED 25,400 ($6,920)   │▒│
│ │ • Month 22 🔑         AED 25,400 ($6,920)   │▒│  ← Handover Q highlighted
│ │ • Month 23 🔑         AED 25,400 ($6,920)   │▒│
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ ON HANDOVER (0%)                                │
├─────────────────────────────────────────────────┤
│ POST-HANDOVER (29%)                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ • Month 24 (Jan'27)   AED 25,400 ($6,920)   │▒│
│ │ ... (scrollable)                            │▒│
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Base Price              AED 2,540,000           │
│ Transaction Fees        AED 141,600             │
│ TOTAL INVESTMENT        AED 2,681,600           │
├─────────────────────────────────────────────────┤
│ 💰 Cash Until Handover  AED 1,208,400 ($329K)   │  ← Compact, at bottom
└─────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|--------|
| `src/components/roi/snapshot/CompactPaymentTable.tsx` | 1. Inline currency display for payment rows<br>2. Make summary card compact<br>3. Move summary to bottom<br>4. Ensure ScrollArea works properly |

---

## Benefits

1. **Compact vertical layout** - Currency values inline = less scrolling needed
2. **Smaller summary** - Single line summary doesn't dominate
3. **Working scroll** - All payments visible via scroll
4. **Logical order** - Summary at bottom after all payments shown
5. **Clear handover highlight** - Only handover quarter months highlighted

