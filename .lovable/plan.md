
# Plan: Fix Exit Scenarios + Remove DSCR + Add Persistence

## Summary

Three requirements to address:
1. **Fix Exit ROE** - Use actual payment plan capital for off-plan, not Day 1 capital
2. **Remove DSCR** - Remove DSCR components from the comparison view  
3. **Add Persistence** - Save/load comparisons so users can return to previous analyses

---

## 1. Exit Scenarios ROE Fix

### Current (Buggy) Code in ExitScenariosComparison.tsx

```typescript
// Lines 84-95 - WRONG!
const opProfit = opPropertyValue + opCumulativeRent - offPlanCapitalInvested - opExitCosts;
const opTotalROE = offPlanCapitalInvested > 0 ? (opProfit / offPlanCapitalInvested) * 100 : 0;
```

**Problems:**
1. Uses `offPlanCapitalInvested` = Day 1 capital (~280K) instead of capital at exit month
2. Includes `opCumulativeRent` in exit profit (exit = sell, not hold)
3. Results in 469% ROE which is impossible

### Correct Logic

**Off-Plan Exit:**
- Use `calculateEquityAtExitWithDetails()` from `constructionProgress.ts` to get capital paid according to payment schedule
- Profit = Exit Price - Base Price (pure appreciation)
- ROE = Profit / Capital at Exit Month

**Secondary Exit:**
- Capital = `totalCapitalDay1` (always, since all paid upfront)
- Profit = Exit Price - Purchase Price (pure appreciation)
- ROE = Profit / Capital

### New Props for ExitScenariosComparison

```typescript
interface ExitScenariosComparisonProps {
  exitMonths: number[];
  // Off-Plan data
  offPlanInputs: OIInputs;            // NEW: Full inputs for payment plan
  offPlanBasePrice: number;           // NEW: Base purchase price
  offPlanTotalMonths: number;         // NEW: Construction duration
  offPlanEntryCosts: number;          // NEW: Entry costs
  // Secondary data  
  secondaryPurchasePrice: number;     // NEW: Purchase price
  secondaryCapitalInvested: number;   // Total capital day 1
  secondaryAppreciationRate: number;  // NEW: Annual appreciation rate
  // Display
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}
```

### Updated Calculation Logic

```typescript
import { calculateEquityAtExitWithDetails, calculateExitPrice } from '@/components/roi/constructionProgress';

const exitData = useMemo((): ExitComparisonPoint[] => {
  return exitMonths.map((months) => {
    const years = months / 12;
    
    // === OFF-PLAN: Use canonical functions ===
    // Capital from payment plan (NOT day 1)
    const equityResult = calculateEquityAtExitWithDetails(
      months, 
      offPlanInputs, 
      offPlanTotalMonths, 
      offPlanBasePrice
    );
    const opCapitalAtExit = equityResult.finalEquity + offPlanEntryCosts;
    
    // Exit price using phased appreciation
    const opExitPrice = calculateExitPrice(months, offPlanBasePrice, offPlanTotalMonths, offPlanInputs);
    const opAppreciation = opExitPrice - offPlanBasePrice;
    
    // Pure ROE = Appreciation / Capital at exit
    const opROE = opCapitalAtExit > 0 ? (opAppreciation / opCapitalAtExit) * 100 : 0;
    const opAnnualizedROE = years > 0 ? opROE / years : 0;
    
    // === SECONDARY: All capital paid day 1 ===
    const secExitPrice = secondaryPurchasePrice * Math.pow(1 + secondaryAppreciationRate / 100, years);
    const secAppreciation = secExitPrice - secondaryPurchasePrice;
    
    const secROE = secondaryCapitalInvested > 0 ? (secAppreciation / secondaryCapitalInvested) * 100 : 0;
    const secAnnualizedROE = years > 0 ? secROE / years : 0;
    
    return {
      months,
      offPlan: {
        propertyValue: opExitPrice,
        capitalInvested: opCapitalAtExit,  // Actual capital at exit!
        profit: opAppreciation,            // Pure appreciation
        totalROE: opROE,
        annualizedROE: opAnnualizedROE,
      },
      secondary: {
        propertyValue: secExitPrice,
        capitalInvested: secondaryCapitalInvested,
        profit: secAppreciation,           // Pure appreciation
        totalROE: secROE,
        annualizedROE: secAnnualizedROE,
      },
    };
  });
}, [exitMonths, offPlanInputs, offPlanBasePrice, offPlanTotalMonths, offPlanEntryCosts, 
    secondaryPurchasePrice, secondaryCapitalInvested, secondaryAppreciationRate]);
```

---

## 2. Remove DSCR Components

### Files to Modify

| File | Action |
|------|--------|
| `src/pages/OffPlanVsSecondary.tsx` | Remove DSCRExplanationCard import and JSX |
| `src/components/roi/secondary/HeadToHeadTable.tsx` | Remove MORTGAGE/HIPOTECA category rows |

### Specific Changes in OffPlanVsSecondary.tsx

Remove lines 505-512:
```tsx
// REMOVE THIS ENTIRE BLOCK
<div className="grid lg:grid-cols-2 gap-6">
  <DSCRExplanationCard ... />
  <OutOfPocketCard ... />
</div>
```

Replace with:
```tsx
{/* Out of Pocket - Full Width */}
<OutOfPocketCard ... />
```

### Rows to Remove from HeadToHeadTable

The HIPOTECA/MORTGAGE category with:
- DSCR Largo Plazo / DSCR Long-Term
- DSCR Airbnb
- Any DSCR-related metrics

---

## 3. Add Persistence (Database Table + Hook + Modals)

### New Database Table: `secondary_comparisons`

```sql
CREATE TABLE public.secondary_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  quote_id UUID REFERENCES cashflow_quotes(id),
  secondary_inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  exit_months JSONB NOT NULL DEFAULT '[]'::jsonb,
  rental_mode TEXT DEFAULT 'long-term',
  share_token TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.secondary_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own comparisons"
ON public.secondary_comparisons FOR ALL
USING (auth.uid() = broker_id)
WITH CHECK (auth.uid() = broker_id);

CREATE POLICY "Public can view shared comparisons"
ON public.secondary_comparisons FOR SELECT
USING (is_public = true AND share_token IS NOT NULL);
```

### New Hook: `src/hooks/useSecondaryComparisons.ts`

```typescript
export interface SecondaryComparison {
  id: string;
  broker_id: string;
  title: string;
  quote_id: string | null;
  secondary_inputs: SecondaryInputs;
  exit_months: number[];
  rental_mode: 'long-term' | 'airbnb';
  share_token: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const useSecondaryComparisons = () => {
  const [comparisons, setComparisons] = useState<SecondaryComparison[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all user's comparisons
  // Save new comparison
  // Update existing comparison
  // Delete comparison
  // Generate share token
  
  return {
    comparisons,
    loading,
    saveComparison,
    updateComparison,
    deleteComparison,
    generateShareToken,
  };
};
```

### New Components

1. **`SaveSecondaryComparisonModal.tsx`** - Save dialog with title input
2. **`LoadSecondaryComparisonModal.tsx`** - List and load saved comparisons

### Updated UI Flow in OffPlanVsSecondary.tsx

**Initial View (no comparison loaded):**
```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│     🏗️ Off-Plan vs Secondary                                   │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │  📂 Load Saved       │  │  ✨ Create New       │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                  │
│  📋 Recent Comparisons (last 5)                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Marina Heights vs Secondary 1.5M          2 days ago    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Header with Save Button (when comparison loaded):**
```tsx
<Button onClick={() => setSaveModalOpen(true)}>
  <Save className="w-4 h-4 mr-2" />
  {currentComparisonId ? t.update : t.save}
</Button>
```

---

## Expected Exit ROE After Fix

**Year 3 Exit (Month 36):**

| Metric | Off-Plan | Secondary |
|--------|----------|-----------|
| Base Price | AED 1,300,000 | AED 1,200,000 |
| Exit Price | AED 1,500,000 | AED 1,315,000 |
| Appreciation | +AED 200,000 (15.4%) | +AED 115,000 (9.6%) |
| Capital at Exit | AED 470,000 (from payment plan) | AED 520,000 (all day 1) |
| ROE | 42.5% total (14.2%/yr) | 22.1% total (7.4%/yr) |

These numbers are realistic because they use:
- **Actual capital deployed** at the exit point
- **Pure appreciation** without rental income

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase migration` | CREATE TABLE secondary_comparisons |
| `src/hooks/useSecondaryComparisons.ts` | NEW: CRUD hook |
| `src/components/roi/secondary/SaveSecondaryComparisonModal.tsx` | NEW |
| `src/components/roi/secondary/LoadSecondaryComparisonModal.tsx` | NEW |
| `src/components/roi/secondary/ExitScenariosComparison.tsx` | FIX: Use payment plan capital |
| `src/components/roi/secondary/HeadToHeadTable.tsx` | Remove DSCR rows |
| `src/components/roi/secondary/index.ts` | Add new exports |
| `src/pages/OffPlanVsSecondary.tsx` | Remove DSCR, add save/load, pass new props |

---

## Implementation Order

1. **Database**: Create `secondary_comparisons` table
2. **Hook**: Create `useSecondaryComparisons.ts`
3. **Fix Exit Calculation**: Update `ExitScenariosComparison.tsx` with correct capital logic
4. **Remove DSCR**: Clean up HeadToHeadTable and OffPlanVsSecondary page
5. **Add Modals**: Create save/load modals
6. **Update Page**: Add save/load buttons and picker screen
7. **Translations**: Ensure all new text has EN/ES versions
