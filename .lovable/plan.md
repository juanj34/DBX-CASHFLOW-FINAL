
# Fix Quote Creation Flow - Database Constraint & UX Issues

## Root Cause Analysis

### Issue 1: "Failed to create draft" Error
**Found:** Database constraint violation in logs:
```
new row for relation "cashflow_quotes" violates check constraint "cashflow_quotes_status_check"
```

**Cause:** The code in `useCashflowQuote.ts` tries to insert quotes with `status: 'working_draft'`, but the database has a CHECK constraint that only allows:
```sql
CHECK ((status = ANY (ARRAY['draft'::text, 'presented'::text, 'negotiating'::text, 'sold'::text])))
```

The `working_draft` status was never added to the constraint!

### Issue 2: Page Refreshes on New Quote
**Cause:** When "Start Configuration" is clicked:
1. `createDraft()` is called which tries to insert a `working_draft` (fails silently)
2. Falls back to navigation with `navigate(`/cashflow/${newId}`)` - but `newId` is null
3. Auto-save kicks in and creates a new quote via `saveQuote()`, then calls `handleNewQuoteCreated`
4. This triggers another navigation to `/cashflow/${newId}` causing a page reload
5. Loading state flickers between navigations

### Issue 3: QuotesDropdown uses `window.location.reload()`
**Found in `QuotesDropdown.tsx`:**
```typescript
const handleNewQuote = () => {
  if (onNewQuote) {
    onNewQuote();
  } else {
    localStorage.removeItem('cashflow_quote_draft');
    navigate('/cashflow-generator');
    window.location.reload(); // <-- Forces full page reload!
  }
};
```

This is a fallback that causes a hard refresh.

## Solution

### Step 1: Update Database Constraint
Add `working_draft` to the allowed status values:

```sql
ALTER TABLE cashflow_quotes 
DROP CONSTRAINT cashflow_quotes_status_check;

ALTER TABLE cashflow_quotes 
ADD CONSTRAINT cashflow_quotes_status_check 
CHECK (status = ANY (ARRAY['draft', 'presented', 'negotiating', 'sold', 'working_draft']));
```

### Step 2: Simplify Quote Creation Flow
Instead of the complex working draft system, use a simpler approach:

1. **Remove immediate draft creation** - Don't create a database record until meaningful data exists
2. **Use navigation state** to pass `openConfigurator: true` flag
3. **Let auto-save create the quote** on first meaningful change

The current `handleNewQuote` in `OICalculator.tsx` already does this correctly - just navigate with state:
```typescript
navigate('/cashflow-generator', { replace: true, state: { openConfigurator: true } });
```

### Step 3: Remove `window.location.reload()` from QuotesDropdown
Update the fallback handler to use the proper navigation pattern without forcing a reload.

### Step 4: Prevent Race Conditions in Auto-Save
Add a small delay or debounce when navigating to a new quote to prevent:
1. State reset triggering auto-save check
2. Auto-save finding "isQuoteConfigured" true from stale data
3. Creating a quote and navigating again

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add `working_draft` to status check constraint |
| `src/components/roi/QuotesDropdown.tsx` | Remove `window.location.reload()` fallback |
| `src/hooks/useCashflowQuote.ts` | Ensure working draft creation handles constraint properly |

## Technical Details

### Database Migration
```sql
-- Drop existing constraint
ALTER TABLE cashflow_quotes DROP CONSTRAINT IF EXISTS cashflow_quotes_status_check;

-- Add updated constraint with working_draft
ALTER TABLE cashflow_quotes ADD CONSTRAINT cashflow_quotes_status_check 
CHECK (status = ANY (ARRAY['draft', 'presented', 'negotiating', 'sold', 'working_draft']));
```

### QuotesDropdown Fix
```typescript
const handleNewQuote = () => {
  if (onNewQuote) {
    onNewQuote();
  } else {
    // Clear local storage for fresh start
    localStorage.removeItem('cashflow_quote_draft');
    localStorage.removeItem('cashflow-configurator-state');
    // Navigate without reload - let React handle the state reset
    navigate('/cashflow-generator', { replace: true, state: { openConfigurator: true } });
  }
};
```

### Improve justResetRef timing
Increase the timeout from 150ms to 500ms to ensure state is fully settled before auto-save kicks in:
```typescript
setTimeout(() => { justResetRef.current = false; }, 500);
```

## Expected Result After Fix

1. No more "Failed to create draft" errors
2. Clicking "New Quote" immediately opens configurator without page reload
3. Quote is created in database only when user adds meaningful content
4. Smooth navigation without flicker or multiple loads
5. Working draft system functions correctly with database support

## Summary

| Before | After |
|--------|-------|
| Database rejects `working_draft` status | Constraint updated to allow it |
| New quote triggers page reload | Smooth React navigation |
| Multiple navigations cause flicker | Single navigation with state |
| 150ms delay too short for state reset | 500ms buffer prevents race condition |
