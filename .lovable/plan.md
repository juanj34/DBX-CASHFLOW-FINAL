
# Simplify Portfolio Data: Auto-Calculate Rental Projections

## Problem Summary

The current portfolio system requires brokers to manually enter rental amounts for each property, which is:
1. Time-consuming (requires follow-up with each client)
2. Impractical at scale
3. Often inaccurate or never filled in
4. Redundant - the original quote analysis already has rental yield projections!

## Solution: Hands-Off Portfolio with Projected Data

Instead of asking brokers to manually track actual rental income, we'll:
1. **Remove the manual "Is Rented" toggle and rental entry** for tracking actual rental status
2. **Auto-calculate projected monthly rent** from the original quote's rental yield
3. **Display projected rental income** as the default metric
4. **Keep mortgage tracking optional** since that data is more likely known at purchase

## Implementation Details

### 1. Simplify PropertyForm (Remove Rental Section)

| Field | Action |
|-------|--------|
| `is_rented` toggle | Remove |
| `monthly_rent` input | Remove |
| `rental_start_date` input | Remove |

The form will focus on what brokers actually know:
- Property details (project, developer, unit)
- Purchase info (price, date, fees)
- Mortgage (optional - if client mentions it)
- Notes

### 2. Auto-Calculate Rental from Quote

When a property is linked to a source quote (`source_quote_id`), automatically derive:

```text
Projected Monthly Rent = (Purchase Price × Rental Yield %) / 12
```

Example:
- Purchase: AED 1,950,000
- Rental Yield (from quote): 7%
- Projected Monthly Rent = (1,950,000 × 0.07) / 12 = AED 11,375/mo
```

### 3. Update PortfolioSection Display

| Current | New |
|---------|-----|
| "Rented: AED X/mo" (manual, often empty) | "Est. Rent: AED X/mo" (auto-calculated) |

Show the projected rental as a helpful metric, not a tracking field.

### 4. Update Metrics Calculation

Change `usePortfolio.ts` metrics to use:
- **Projected rent** = purchase_price × (quote's rental yield / 100) / 12
- Fall back to database `monthly_rent` if manually overridden

### 5. Allow Optional Manual Override

Keep `monthly_rent` in the database for cases where:
- The broker DOES know actual rent
- The client provides this info voluntarily

But make it an "advanced" or notes-style field, not required.

## Visual Changes

### Current Property Card
```text
[Property Name]
Current Value: AED 1,950,000  +270,000 (+16.1%)
[Rented: AED 9,500/mo]  <-- Manual, often missing
```

### New Property Card
```text
[Property Name]
Current Value: AED 1,950,000  +270,000 (+16.1%)
[Est. Rent: ~AED 11,375/mo]  <-- Auto-calculated, always present
[Actual: AED 9,500/mo]  <-- Only if manually overridden
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/portfolio/PropertyForm.tsx` | Simplify: remove rental section, make it optional/collapsed |
| `src/components/portal/PortfolioSection.tsx` | Calculate estimated rent from quote data, update badge display |
| `src/hooks/usePortfolio.ts` | Update metrics to use projected rent when actual isn't available |
| `src/pages/ClientPortfolioView.tsx` | Pass quote inputs to PortfolioSection for rental yield calculation |

## Technical: Getting Rental Yield from Linked Quote

When property has `source_quote_id`:
1. Fetch the quote's inputs
2. Extract `rentalYieldPercent`
3. Calculate: `projectedRent = (purchase_price * rentalYieldPercent / 100) / 12`

For properties without a linked quote:
- Use a market default (e.g., 7% - from broker's profile `market_dubai_yield`)
- Or show "Add analysis to see projections"

## Summary

| Before | After |
|--------|-------|
| Manual rental tracking | Auto-projected from quote analysis |
| Brokers ask clients for rent info | Hands-off, data already in system |
| Often empty badges | Always shows projected income |
| "Rented: AED X" | "Est. Rent: ~AED X" |

This makes the portfolio a **projection tool** rather than an **accounting tool** - which aligns better with a broker's workflow.
