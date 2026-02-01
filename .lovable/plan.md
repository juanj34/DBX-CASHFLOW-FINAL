
# Add Quote-to-Portfolio Conversion Flow

## Problem

When a broker marks a quote as "Sold", nothing happens to create an acquired property in the client's portfolio. The broker has to manually go to the client's portfolio and re-enter all the property data - which is redundant since all the information already exists in the quote.

## Solution: Auto-Convert on "Sold" Status

When a quote is marked as "Sold", show a confirmation dialog that:
1. Pre-fills all property data from the quote (project, developer, unit, price, etc.)
2. Asks for purchase date (defaults to today)
3. Allows optional mortgage details
4. Creates the acquired property linked to the original quote

## User Flow

```text
Broker marks quote as "Sold" (from status dropdown)
         ↓
    Dialog appears:
    ┌─────────────────────────────────────────┐
    │  🎉 Deal Closed!                        │
    │                                         │
    │  Add to [Client Name]'s Portfolio?      │
    │                                         │
    │  Project: The Valley (pre-filled)       │
    │  Unit: A-1205 (pre-filled)              │
    │  Price: AED 1,950,000 (pre-filled)      │
    │  Purchase Date: [Today - editable]      │
    │                                         │
    │  [ ] Has Mortgage (optional details)    │
    │                                         │
    │  [Skip]        [Add to Portfolio]       │
    └─────────────────────────────────────────┘
         ↓
Property appears in client's portfolio with:
- source_quote_id linked to original analysis
- Projected rent auto-calculated from quote's rental yield
- Full audit trail back to the original opportunity
```

## Implementation Details

### 1. Create ConvertToPropertyModal Component

New component: `src/components/portfolio/ConvertToPropertyModal.tsx`

| Field | Source | Editable? |
|-------|--------|-----------|
| project_name | quote.project_name | No |
| developer | quote.developer | No |
| unit | quote.unit | No |
| unit_type | quote.unit_type | No |
| unit_size_sqf | quote.inputs.unitSizeSqf | No |
| purchase_price | quote.inputs.basePrice | No |
| purchase_date | Today (default) | Yes |
| client_id | quote.client_id | No (auto) |
| source_quote_id | quote.id | No (auto) |
| has_mortgage | false | Yes |
| mortgage_* fields | - | Yes (if toggle on) |

### 2. Update Status Change Logic

Files: `src/pages/QuotesDashboard.tsx` and `src/pages/Home.tsx`

When `status === 'sold'`:
1. First update the quote status (existing logic)
2. Then open the ConvertToPropertyModal with the quote data
3. On submit, create the acquired_property entry

### 3. Handle Edge Cases

| Scenario | Behavior |
|----------|----------|
| Quote has no client_id | Prompt to select/create client first |
| Quote already converted | Show "Already in portfolio" message, link to view |
| User clicks "Skip" | Just mark as sold, no portfolio entry |

### 4. Track Conversion in Database

Add to `cashflow_quotes` table:
- `converted_to_property_id` - Links to the created acquired_property (optional)

This allows showing "Already converted" and linking to the portfolio entry.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/portfolio/ConvertToPropertyModal.tsx` | Create - conversion dialog |
| `src/pages/QuotesDashboard.tsx` | Modify - trigger modal on "sold" |
| `src/pages/Home.tsx` | Modify - trigger modal on "sold" (pipeline view) |
| Database migration | Add `converted_to_property_id` column |

## Visual Result

After implementing:
1. Broker selects "Sold" from status dropdown
2. Success toast + conversion modal appears
3. One click adds property to portfolio with all data pre-filled
4. Property shows "Est. Rent: ~AED X/mo" auto-calculated from quote
5. "Original Analysis" button links back to the quote

This creates a seamless, zero-redundancy workflow from opportunity to acquired asset.
