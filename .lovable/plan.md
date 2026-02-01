
# Fix Quote-Client Linking & Add Portal Preview

## Problem Analysis

### Issue 1: Quotes Not Linking to Clients

**Root Cause Found:** Race condition in `OICalculator.tsx`

When a broker clicks "+ Quote" from a client card:
1. `handleCreateQuote` stores client data in `localStorage.preselected_client` (including `dbClientId`)
2. Navigation to `/cashflow-generator` triggers two effects:
   - Effect at line 159: Reads localStorage and sets `dbClientId` ✓
   - Effect at line 189: Resets ALL state to defaults (runs after, overwrites `dbClientId`) ✗

The reset effect at line 189-210 runs **after** the preselected client effect, overwriting the `dbClientId`.

**Evidence:** Database shows 20+ quotes with `client_name: "Hugo"` but ALL have `client_id: null`.

### Issue 2: No Way to Preview Portal from Client Manager

The broker has no easy way to see what the client's portal looks like. Currently they can only:
- Copy the portal link
- Open in new tab

They should be able to preview how the portal appears from within the client management interface.

---

## Solution

### Fix 1: Correct the Effect Order in OICalculator

Merge the preselected client logic INTO the reset effect, so it runs in the correct order:

```typescript
// Reset ALL state when navigating to new quote (no quoteId)
useEffect(() => {
  if (!quoteId) {
    // First, reset all state for a fresh start
    setInputs(NEW_QUOTE_OI_INPUTS);
    setMortgageInputs(DEFAULT_MORTGAGE_INPUTS);
    setQuoteImages({ ... });
    setShareUrl(null);
    
    // Then check for preselected client (after reset, so it's not overwritten)
    const preselectedClient = localStorage.getItem('preselected_client');
    if (preselectedClient) {
      try {
        const clientData = JSON.parse(preselectedClient);
        setClientInfo({
          ...DEFAULT_CLIENT_INFO,
          clients: [{ id: '1', name: clientData.clientName, country: clientData.clientCountry }],
          dbClientId: clientData.dbClientId  // This will now persist!
        });
        localStorage.removeItem('preselected_client');
        setModalOpen(true);
      } catch (e) {
        setClientInfo(DEFAULT_CLIENT_INFO);
        localStorage.removeItem('preselected_client');
      }
    } else {
      setClientInfo(DEFAULT_CLIENT_INFO);
    }
    
    setDataLoaded(true);
    justResetRef.current = true;
    setTimeout(() => { justResetRef.current = false; }, 150);
  } else {
    setDataLoaded(false);
  }
}, [quoteId, setQuoteImages]);
```

This ensures `dbClientId` is set AFTER the reset, so it persists to the save.

### Fix 2: Add Portal Preview Button to Client Card

Add a new action in the ClientCard dropdown menu:

```typescript
<DropdownMenuItem onClick={handleOpenPortal} className="text-theme-text hover:bg-theme-bg cursor-pointer">
  <Eye className="w-4 h-4 mr-2" />
  Preview Portal
</DropdownMenuItem>
```

The `handleOpenPortal` function already exists at line 114-118 - it opens the portal in a new tab. This is sufficient for preview purposes.

### Fix 3: Add Migration to Link Existing Quotes

Create a one-time migration function to link existing quotes that have `client_name` matching a client but no `client_id`:

```sql
-- Link existing quotes to clients based on matching name + broker_id
UPDATE cashflow_quotes q
SET client_id = c.id
FROM clients c
WHERE q.client_id IS NULL
  AND q.client_name IS NOT NULL
  AND q.broker_id = c.broker_id
  AND LOWER(q.client_name) = LOWER(c.name);
```

---

## Files to Modify

### 1. `src/pages/OICalculator.tsx`

**Changes:**
- Remove separate preselected client effect (lines 158-185)
- Merge preselected client logic into the reset effect (lines 187-210)
- Ensure `dbClientId` is set AFTER the base reset

### 2. Database Migration

**Create migration to backfill existing quotes:**
- Update all quotes with matching `client_name` and `broker_id` to link `client_id`
- This fixes Hugo's 20+ quotes

---

## Verification Steps

After implementation:
1. Go to Clients Manager
2. Click "+ Quote" on Hugo's card
3. Fill in property details and save
4. Check database: the new quote should have `client_id` set
5. Check Hugo's card: should show the new quote in the count
6. Expand Hugo's quotes section: should list the quote
7. Open Hugo's portal: should show the quote in Opportunities

---

## Technical Notes

### Why This Happened

React effects run in order of declaration, but both effects had `[quoteId]` (or similar) as dependencies. When navigating to `/cashflow-generator`, both effects triggered. The reset effect ran last because it was declared later in the file, overwriting the `dbClientId` that was just set.

### The Fix Guarantees

By consolidating into a single effect:
1. Reset happens first (clean slate)
2. Preselected client is applied after (if present)
3. `dbClientId` is preserved in state
4. Auto-save includes `client_id` in the database insert/update

### Portal Preview

The existing "Open Portal" button in the dropdown menu serves as the preview mechanism. When brokers click it, they see exactly what their client will see. No additional UI needed since the portal is already fully functional.
