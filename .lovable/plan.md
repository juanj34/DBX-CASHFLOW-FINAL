
# Plan: Fix Off-Plan vs Secondary Comparison Calculations & UI

## Problems Identified

### 1. Exit Scenarios Table - Unnecessary "Capital" Column
The current Exit Scenarios table shows Value, Capital, Profit, ROE for each investment type. The user correctly identifies:
- For **Secondary**, capital is always 100% of purchase price (confusing to show repeatedly)
- For **Off-Plan**, capital varies by payment plan stage

**Solution**: Simplify the table to show only what matters:
- Property Value (exit price)
- Profit (appreciation)
- ROE (%)
- Remove the "Capital" column entirely

### 2. Multiplier Calculation for Secondary is Wrong
Current logic in `ComparisonKeyInsights.tsx`:
```typescript
// Current: Uses "cash capital" (equity + closing costs)
const secondaryGrossWealth = secondaryWealth10 + metrics.secondaryCashCapital;
const secondaryMultiplier = metrics.secondaryCashCapital > 0
  ? secondaryGrossWealth / metrics.secondaryCashCapital
  : 0;
```

This is misleading because:
- If buyer puts 40% down (4M on 10M property), `secondaryCashCapital` = 4M + closing
- But they OWE the full 10M - the multiplier should reflect total commitment, not just cash

**Solution**: For fair comparison, use `secondaryCapitalDay1` (full price + closing costs) as the denominator for both "Entry Ticket" and "Multiplier" cards. This shows:
- What total asset value you control
- What your total commitment became

### 3. Year 0 Shows Wrong Value in Table
The `YearByYearWealthTable` uses `offPlanProjections[0]` for Year 0, but that's already Year 1's appreciated value.

**Root cause**: The projections array starts at index 0 = Year 1, not Year 0.

**Solution**: Pass the base prices as separate props:
- `offPlanBasePrice` - the purchase price at Day 0
- `secondaryBasePrice` - the purchase price at Day 0

Year 0 row should use these base values, not projections.

### 4. Missing Key Contrast: Cashflow vs Appreciation
The user wants to highlight the core trade-off:
- **Off-Plan**: No cashflow during construction, but appreciation happens "for free"
- **Secondary**: Cashflow from Day 1, but appreciation is slower

This needs to be surfaced prominently.

---

## Technical Changes

### File: `src/components/roi/secondary/ExitScenariosComparison.tsx`

1. **Remove "Capital" column** from both Off-Plan and Secondary sections
2. **Simplify header** to: Exit | Off-Plan (Value, Profit, ROE) | Secondary (Value, Profit, ROE) | Winner
3. Keep tooltips for detailed explanations

### File: `src/components/roi/secondary/ComparisonKeyInsights.tsx`

1. **Fix Multiplier calculation** for Secondary:
   - Change from using `secondaryCashCapital` to `secondaryCapitalDay1`
   - This gives a realistic "your X became Y" comparison
   
2. **Current (wrong)**:
   ```typescript
   const secondaryMultiplier = metrics.secondaryCashCapital > 0
     ? secondaryGrossWealth / metrics.secondaryCashCapital
     : 0;
   ```

3. **Fixed**:
   ```typescript
   // Use full property commitment, not just cash down payment
   const secondaryMultiplier = metrics.secondaryCapitalDay1 > 0
     ? (secondaryWealth10 + metrics.secondaryCapitalDay1) / metrics.secondaryCapitalDay1
     : 0;
   ```

### File: `src/components/roi/secondary/YearByYearWealthTable.tsx`

1. **Add new props** for base prices:
   ```typescript
   offPlanBasePrice: number;
   secondaryBasePrice: number;
   ```

2. **Fix Year 0 row** to use base prices:
   ```typescript
   // Year 0 = Entry point (base purchase prices, no appreciation yet)
   data.push({
     year: 0,
     offPlanValue: offPlanBasePrice,       // Not projections[0]!
     secondaryValue: secondaryBasePrice,   // Not projections[0]!
     // ... rest
   });
   ```

### File: `src/pages/OffPlanVsSecondary.tsx`

1. **Pass base prices** to YearByYearWealthTable:
   ```typescript
   <YearByYearWealthTable
     offPlanBasePrice={offPlanInputs.basePrice}
     secondaryBasePrice={secondaryInputs.purchasePrice}
     // ... existing props
   />
   ```

---

## Visual Changes Summary

### Exit Scenarios Table (Before → After)

**Before (10 columns):**
| Exit | OP Value | OP Capital | OP Profit | OP ROE | SEC Value | SEC Capital | SEC Profit | SEC ROE | Winner |

**After (7 columns):**
| Exit | OP Value | OP Profit | OP ROE | SEC Value | SEC Profit | SEC ROE | Winner |

### Multiplier Card (Before → After)

**Before:**
- Off-Plan: 20.7x (based on day-1 downpayment only) ← Wrong
- Secondary: 4.4x (based on cash down payment) ← Misleading

**After:**
- Off-Plan: ~4.1x (based on total capital at handover)
- Secondary: ~1.5x (based on full property commitment)

### Year 0 in Table (Before → After)

**Before:**
| Year 0 | AED 10.87M | AED 10.18M | ← Already appreciated!

**After:**
| Year 0 | AED 9.68M | AED 9.89M | ← Base purchase prices

---

## Expected Result

1. **Exit Scenarios**: Cleaner table without redundant capital column
2. **Multiplier**: Realistic comparison showing true asset multiplication
3. **Year 0**: Correctly shows entry point (base prices) before any appreciation
4. **Trade-off Clarity**: The numbers now tell the real story of Cashflow vs Appreciation
