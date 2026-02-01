
# Performance Optimization + Real-time Quote Sync for Portal & Presentations

## Problems Identified

### Problem 1: Stale Quote Data in Presentations
**Root Cause**: When you edit a quote in tab A (Cashflow Generator) and switch to the Presentation Builder in tab B, the presentation still shows old values (e.g., breakeven 9.5 years instead of 11 years).

This happens because:
1. `PresentationBuilder.tsx` calls `useQuotesList()` which fetches quotes **once** on mount (line 207)
2. The hook has no auto-refresh mechanism - it fetches once and stores in local state
3. When you edit a quote in another tab, the `useQuotesList` state in the presentation tab is never updated
4. `PresentationPreview.tsx` uses the stale `quotes` array passed from the parent (line 45)

### Problem 2: Multiple Redundant API Calls in Portal
**Root Cause**: The Client Portal makes 4+ duplicate queries to resolve the same `portal_token`:
1. `useClientPortfolio(portalToken)` → queries `clients` table
2. `useClientComparisons({ portalToken })` → queries `clients` table again
3. `getClientByPortalToken(portalToken)` → queries `clients` table again
4. Sequential data fetching (not parallel)

---

## Solution Architecture

### Fix 1: Add Visibility-Based Refresh for Quote Data

When the browser tab regains focus, automatically refetch quote data to ensure the presentation always shows the latest values.

**Implementation Pattern:**
```typescript
// Add to useQuotesList hook
const [lastFetched, setLastFetched] = useState<Date | null>(null);

// Refetch when tab becomes visible
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Refetch if last fetch was more than 5 seconds ago
      if (!lastFetched || Date.now() - lastFetched.getTime() > 5000) {
        refetch();
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [lastFetched]);
```

### Fix 2: Add Manual Refresh Button to Presentation Builder

Add a visual indicator and refresh button so users can manually sync quote data.

### Fix 3: Create Unified Portal Data Hook

Consolidate all portal data fetching into a single hook that:
1. Resolves `portal_token` **once**
2. Fetches all data in **parallel** using `Promise.all`
3. Returns everything the portal needs in one call

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCashflowQuote.ts` | Add visibility-based auto-refresh + timestamp tracking to `useQuotesList` |
| `src/pages/PresentationBuilder.tsx` | Add refresh indicator + button, use refetch from hook |
| `src/pages/ClientPortal.tsx` | Consolidate data fetching, use parallel Promise.all |
| `src/hooks/usePortfolio.ts` | Accept optional `clientId` parameter to avoid duplicate resolution |
| `src/hooks/useClientComparisons.ts` | Accept optional `clientId` parameter to avoid duplicate resolution |

---

## Detailed Implementation

### 1. Update useQuotesList Hook

```typescript
export const useQuotesList = () => {
  const [quotes, setQuotes] = useState<CashflowQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchQuotes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('cashflow_quotes')
      .select(/* ... */)
      .eq('broker_id', user.id)
      .neq('status', 'working_draft')
      .or('is_archived.is.null,is_archived.eq.false')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setQuotes(data.map(q => ({ ...q, inputs: q.inputs as OIInputs })));
      setLastFetched(new Date());
    }
    setLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchQuotes();
  }, []);

  // Auto-refresh when tab regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lastFetched) {
        const timeSinceLastFetch = Date.now() - lastFetched.getTime();
        // Refresh if more than 3 seconds have passed
        if (timeSinceLastFetch > 3000) {
          fetchQuotes();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lastFetched, fetchQuotes]);

  // Also refresh on window focus (covers more cases)
  useEffect(() => {
    const handleFocus = () => {
      if (lastFetched) {
        const timeSinceLastFetch = Date.now() - lastFetched.getTime();
        if (timeSinceLastFetch > 3000) {
          fetchQuotes();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [lastFetched, fetchQuotes]);

  return { 
    quotes, 
    setQuotes, 
    loading, 
    lastFetched,
    refetch: fetchQuotes,
    deleteQuote, 
    archiveQuote, 
    duplicateQuote 
  };
};
```

### 2. Update PresentationBuilder.tsx

Add a refresh indicator in the header:

```typescript
const { quotes, loading: quotesLoading, refetch: refetchQuotes, lastFetched } = useQuotesList();

// Add refresh button in header
<Button
  variant="ghost"
  size="sm"
  onClick={refetchQuotes}
  disabled={quotesLoading}
  className="text-theme-text-muted hover:text-theme-text"
>
  <RefreshCw className={cn("w-4 h-4", quotesLoading && "animate-spin")} />
  {lastFetched && (
    <span className="ml-1 text-xs">
      {formatDistanceToNow(lastFetched, { addSuffix: true })}
    </span>
  )}
</Button>
```

### 3. Consolidate Portal Data Fetching

Update ClientPortal to fetch all data in parallel:

```typescript
useEffect(() => {
  const fetchData = async () => {
    if (!portalToken) {
      setError("Invalid portal link");
      setLoading(false);
      return;
    }

    try {
      // Step 1: Resolve client (single query)
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('portal_token', portalToken)
        .eq('portal_enabled', true)
        .single();

      if (clientError || !clientData) {
        setError("Portal not found or access disabled");
        setLoading(false);
        return;
      }

      setClient(clientData);

      // Step 2: Fetch ALL related data in PARALLEL
      const [
        advisorResult,
        quotesResult,
        presentationsResult,
        propertiesResult,
        savedCompResult,
        secondaryCompResult
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', clientData.broker_id).single(),
        supabase.from('cashflow_quotes').select('*').eq('client_id', clientData.id),
        supabase.from('presentations').select('*').eq('client_id', clientData.id),
        supabase.from('acquired_properties').select('*').eq('client_id', clientData.id),
        supabase.from('saved_comparisons').select('*').eq('client_id', clientData.id),
        supabase.from('secondary_comparisons').select('*').eq('client_id', clientData.id),
      ]);

      setAdvisor(advisorResult.data);
      setQuotes(quotesResult.data || []);
      setPresentations(presentationsResult.data || []);
      setPortfolioProperties(propertiesResult.data || []);
      setSavedComparisons(savedCompResult.data || []);
      setSecondaryComparisons(secondaryCompResult.data || []);

      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError("Failed to load portal");
      setLoading(false);
    }
  };

  fetchData();
}, [portalToken]);
```

### 4. Remove Duplicate Hook Calls

Currently the portal uses:
- `useClientPortfolio(portalToken)` - queries clients table
- `useClientComparisons({ portalToken })` - queries clients table again
- Manual `getClientByPortalToken()` - queries clients table a third time

After consolidation, we fetch everything in one place and pass data down, eliminating the need for these hooks to resolve the token separately.

---

## Expected Performance Improvement

| Metric | Before | After |
|--------|--------|-------|
| Client table queries per portal load | 4+ | 1 |
| Data fetch pattern | Sequential | Parallel |
| Quote sync between tabs | Never | On focus/visibility |
| User awareness of data freshness | None | Timestamp indicator |

---

## Testing Checklist

After implementation:
- [ ] Edit a quote in the Cashflow Generator, switch to Presentation Builder - values should update on tab focus
- [ ] Client Portal should load faster with consolidated queries
- [ ] Refresh button in Presentation Builder should manually sync quote data
- [ ] No more "stale breakeven" values between tabs
- [ ] Tab timestamp shows when data was last synced
