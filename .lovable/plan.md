
# Plan: Handover Exit Card + Floating Edit Button

## Overview
This plan covers two related features:
1. **Handover Exit Scenario** - A specialized exit point at the handover date that displays property completion value and total appreciation earned, with distinct styling from regular "flip" exits
2. **Floating Edit Button** - A bottom-right floating button on the SnapshotContent (configured state) that opens the configurator for quick edits

---

## Feature 1: Handover Exit Scenario

### What Makes Handover Different
| Aspect | Regular Exit | Handover |
|--------|-------------|----------|
| Label | Exit #1, #2... | 🔑 Handover |
| Capital | Partial (per payment plan) | 100% (all pre-handover paid) |
| Icon | TrendingUp/Calendar | Key (🔑) |
| Color | Theme accent/green | Cyan/white |
| Context | "Flip opportunity" | "Completion milestone" |

### Technical Changes

#### 1. Helper Function in `constructionProgress.ts`
Add a utility to detect if an exit is at handover:
```typescript
export const isHandoverExit = (
  exitMonths: number, 
  totalMonths: number
): boolean => {
  // Within 1 month tolerance for handover
  return Math.abs(exitMonths - totalMonths) <= 1;
};
```

#### 2. ExitsSection.tsx (Configurator)
When an exit is at `totalMonths`:
- Label changes from "Exit N" to "🔑 Handover"
- Show "100% built" badge instead of construction percentage
- Border color changes to cyan instead of theme accent
- Slider is fixed at handover month (read-only)
- Metrics focus on "Total Invested" and "Property Value at Completion"

#### 3. CompactAllExitsCard.tsx (Snapshot Card)
For handover scenarios:
- Badge shows "🔑" instead of "#N"
- Row has cyan accent instead of theme accent
- Label shows "Handover" instead of exit number
- Shows "Completion" tag

#### 4. SnapshotExitCards.tsx
For handover tabs:
- Tab icon shows 🔑 instead of number
- Card header shows "Handover Delivery" label
- Different color scheme (cyan tones)

---

## Feature 2: Floating Edit Button

### Visual Design
A circular floating button in the bottom-right corner of the SnapshotContent view (when configured). Clicking it opens the configurator modal.

```
                                         ┌──────────────┐
                                         │              │
                                         │   [Edit ✎]   │
                                         │   (FAB)      │
                                         └──────────────┘
                                              ↑
                                     Fixed position, 
                                     bottom-right corner
```

### Technical Changes

#### 1. SnapshotContent.tsx
Add new optional prop `onEditClick` to trigger opening the configurator:
```typescript
interface SnapshotContentProps {
  // ... existing props
  onEditClick?: () => void; // NEW: Opens configurator
}
```

Add floating button at the end of the component (only when `onEditClick` is provided):
```typescript
{onEditClick && (
  <div className="fixed bottom-6 right-6 z-50" data-export-hide="true">
    <Button
      size="icon"
      onClick={onEditClick}
      className="h-12 w-12 rounded-full bg-theme-accent text-theme-bg shadow-lg hover:bg-theme-accent/90"
    >
      <Settings className="w-5 h-5" />
    </Button>
  </div>
)}
```

Key considerations:
- `data-export-hide="true"` ensures the button is hidden during PDF/PNG exports
- Uses `fixed` positioning to stay in place while scrolling
- Matches the existing mobile menu button styling for consistency

#### 2. OICalculator.tsx
Pass the `onEditClick` handler to SnapshotContent:
```typescript
<SnapshotContent
  // ... existing props
  onEditClick={() => setModalOpen(true)}
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/constructionProgress.ts` | Add `isHandoverExit()` helper |
| `src/components/roi/configurator/ExitsSection.tsx` | Special handover card styling |
| `src/components/roi/snapshot/CompactAllExitsCard.tsx` | Handover row styling |
| `src/components/roi/snapshot/SnapshotExitCards.tsx` | Handover tab/card styling |
| `src/components/roi/snapshot/SnapshotContent.tsx` | Add floating edit button |
| `src/pages/OICalculator.tsx` | Pass `onEditClick` to SnapshotContent |

---

## Localization Keys to Add
| Key | English | Spanish |
|-----|---------|---------|
| `handoverLabel` | Handover | Entrega |
| `completionValueLabel` | Completion Value | Valor al Completar |
| `totalInvestedLabel` | Total Invested | Total Invertido |
| `appreciationEarnedLabel` | Appreciation Earned | Valorización Ganada |

---

## Visual Summary

### Handover Card in Configurator
```
┌──────────────────────────────────────────────┐
│  🔑 HANDOVER                     Q4 2027     │
│  ─────────────────────────────────────────── │
│  📅 Month 36 • Completion • 100% built       │
│                                              │
│  Property Value at Delivery                  │
│  AED 2,450,000 (+22.5% appreciation)        │
│                                              │
│  ┌────────────────┬───────────────────────┐ │
│  │ Total Invested │ Appreciation Earned    │ │
│  │ AED 2,160,000  │ +AED 450,000           │ │
│  └────────────────┴───────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Floating Edit Button
Positioned at `bottom: 24px, right: 24px`, matches the existing mobile menu FAB style but uses the Settings icon.
