
# Quote System Reliability Overhaul

## Problem Summary

The quote creation system has multiple race conditions and inconsistent behaviors across different entry points that cause:
1. **Unnamed/empty quotes getting saved** to the database
2. **Old draft data appearing** when creating new quotes
3. **Different behaviors** from Dashboard, Generator, Quotes list, and Client pages
4. **Working drafts not being properly cleared** before new quote creation

---

## Root Causes Identified

### Issue 1: Multiple Entry Points with Different Logic

| Entry Point | File | Current Behavior | Problem |
|-------------|------|-----------------|---------|
| `/cashflow-dashboard` | `CashflowDashboard.tsx` | Auto-creates draft on mount (lines 101-119) | Creates empty quote immediately |
| `/cashflow-generator` | Uses same logic | Does NOT auto-create, uses lazy creation | Inconsistent with dashboard |
| `/cashflow/:quoteId` (OICalculator) | `OICalculator.tsx` | Relies on quoteId param, lazy creation | Works differently than dashboard |
| New Quote button | Various locations | Different implementations | No unified approach |
| Client preselection | OICalculator effect | Stores in localStorage, reads on mount | Race conditions |

### Issue 2: Draft Auto-Creation Race Condition

```tsx
// CashflowDashboard.tsx lines 101-119
useEffect(() => {
  const initDraft = async () => {
    if (quoteId || creatingDraft || quoteLoading || draftInitializedRef.current) return;
    
    draftInitializedRef.current = true;
    setCreatingDraft(true);
    
    const newId = await createDraft(); // ← Creates empty quote in DB immediately!
    if (newId) {
      navigate(`/cashflow-dashboard/${newId}`, { replace: true });
    }
  };
  initDraft();
}, [quoteId, creatingDraft, createDraft, quoteLoading, navigate]);
```

**Problem**: Dashboard creates an empty `working_draft` the moment you visit it, even before any configuration.

### Issue 3: Auto-Save Triggers with Empty Data

```tsx
// useCashflowQuote.ts lines 434-444
if (!existingQuoteId && isQuoteConfigured) {
  autoSaveTimeout.current = setTimeout(async () => {
    console.log('Creating new quote on first meaningful change...');
    const savedQuote = await saveQuote(...);
    // ...
  }, 500);
}
```

**Problem**: `isQuoteConfigured` is too permissive (line 88-95 in OICalculator):
```tsx
const isQuoteConfigured = useMemo(() => {
  return (
    !!quoteId ||  // ← Any quoteId counts as "configured"!
    !!clientInfo.developer ||
    !!clientInfo.projectName ||
    inputs.basePrice > 0
  );
}, [quoteId, clientInfo.developer, clientInfo.projectName, inputs.basePrice]);
```

### Issue 4: Title Generation Creates "Untitled Quote"

```tsx
// useCashflowQuote.ts lines 318-321
title: titleClientPart
  ? `${clientInfo.projectName || clientInfo.developer || 'Quote'} - ${titleClientPart}`
  : 'Untitled Quote',  // ← Saved even with no meaningful data!
```

### Issue 5: clearWorkingDraft Doesn't Reset Local State

```tsx
// useCashflowQuote.ts lines 211-235
const clearWorkingDraft = useCallback(async (): Promise<void> => {
  // Only clears database record...
  await supabase.from('cashflow_quotes').update({
    inputs: {} as any,
    client_name: null,
    // ...
  }).eq('broker_id', user.id).eq('status', 'working_draft');
  
  // Does NOT reset the local quote state or quoteImages!
}, []);
```

### Issue 6: "Ask Each Time" Dialog Not Implemented

User wants to be asked whether to resume or discard drafts, but current implementation only shows dialog when:
- Navigating away from a draft with content
- Not when initially opening the app with an existing working draft

---

## Proposed Solution Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                     UNIFIED ENTRY FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│  1. User opens any Cashflow page                                │
│  2. System checks: Does user have a working_draft with content? │
│     ├─ YES → Show "Resume Draft?" dialog                        │
│     │   ├─ Resume → Load existing draft                         │
│     │   └─ Start Fresh → Clear draft, open configurator empty   │
│     └─ NO → Proceed directly (no dialog)                        │
│  3. NO draft created until user actually enters data            │
│  4. Auto-save ONLY triggers when meaningful content exists      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Remove Eager Draft Creation

**File: `src/pages/CashflowDashboard.tsx`**

Remove the auto-draft creation on mount (lines 97-119). The system should NOT create a database record until the user actually configures something.

Replace with:
- Check for existing working_draft with content on mount
- If exists AND has content → Show "Resume or Start Fresh?" dialog
- If no content or user chooses fresh → Clear and show empty configurator

### Phase 2: Add "Ask Each Time" Dialog on App Open

**New Component: `src/components/roi/ResumeDraftDialog.tsx`**

```tsx
interface ResumeDraftDialogProps {
  open: boolean;
  draftInfo: {
    projectName?: string;
    developer?: string;
    lastUpdated?: Date;
  } | null;
  onResume: () => void;
  onStartFresh: () => void;
}

// Shows: "You have an unsaved draft from [date]"
// Project: [name] | Developer: [name]
// [Resume Draft] [Start Fresh]
```

**Integration**: Call `getOrCreateWorkingDraft()` to check (not create) on mount:
```tsx
const checkForExistingDraft = useCallback(async () => {
  const { data } = await supabase
    .from('cashflow_quotes')
    .select('id, project_name, developer, updated_at, inputs')
    .eq('broker_id', user.id)
    .eq('status', 'working_draft')
    .maybeSingle();
  
  if (data && hasWorkingDraftContent(data)) {
    setExistingDraft(data);
    setShowResumeDialog(true);
  } else {
    // No meaningful draft - proceed fresh
    setModalOpen(true);
  }
}, []);
```

### Phase 3: Stricter `isQuoteConfigured` Logic

**File: `src/pages/OICalculator.tsx` and `src/pages/CashflowDashboard.tsx`**

Change the validation to require MEANINGFUL content before auto-saving:

```tsx
// Old (too permissive):
const isQuoteConfigured = !!quoteId || !!clientInfo.developer || !!clientInfo.projectName || inputs.basePrice > 0;

// New (stricter):
const hasMeaningfulContent = useMemo(() => {
  return (
    (inputs.basePrice > 0) ||
    (!!clientInfo.projectName && clientInfo.projectName.trim().length > 0) ||
    (!!clientInfo.developer && clientInfo.developer.trim().length > 0)
  );
}, [inputs.basePrice, clientInfo.projectName, clientInfo.developer]);
```

### Phase 4: Block "Untitled Quote" Creation

**File: `src/hooks/useCashflowQuote.ts`**

Add guard before saving:

```tsx
const saveQuote = useCallback(async (...) => {
  // Guard: Don't save completely empty quotes
  const hasMinimumContent = 
    (inputs.basePrice > 0) ||
    (clientInfo.projectName?.trim()) ||
    (clientInfo.developer?.trim()) ||
    (clientInfo.clients?.some(c => c.name?.trim()));
  
  if (!hasMinimumContent) {
    console.log('Skipping save - no meaningful content');
    return null;
  }
  
  // ... rest of save logic
}, []);
```

Also update title generation:
```tsx
// If no meaningful title can be generated, keep as null (for working_draft only)
const generatedTitle = titleClientPart
  ? `${clientInfo.projectName || clientInfo.developer || 'Quote'} - ${titleClientPart}`
  : clientInfo.projectName || clientInfo.developer || null;

// Only set "Untitled Quote" when promoting to draft
title: generatedTitle || (quote?.status === 'working_draft' ? null : 'Untitled Quote'),
```

### Phase 5: Unify "New Quote" Handler Across Entry Points

**Create: `src/hooks/useNewQuote.ts`**

```tsx
export const useNewQuote = () => {
  const navigate = useNavigate();
  const { clearWorkingDraft, getOrCreateWorkingDraft } = useCashflowQuote();
  
  const startNewQuote = useCallback(async (options?: {
    preselectedClient?: { id: string; name: string };
    openConfigurator?: boolean;
    targetRoute?: 'generator' | 'dashboard';
  }) => {
    // 1. Clear localStorage state
    localStorage.removeItem('cashflow-configurator-state');
    localStorage.removeItem('cashflow-configurator-state-v2');
    localStorage.removeItem('cashflow_configurator_open');
    
    // 2. Clear working draft in DB
    await clearWorkingDraft();
    
    // 3. Store preselected client if provided
    if (options?.preselectedClient) {
      localStorage.setItem('preselected_client', JSON.stringify(options.preselectedClient));
    }
    
    // 4. Navigate with clean state
    const route = options?.targetRoute === 'dashboard' 
      ? '/cashflow-dashboard' 
      : '/cashflow-generator';
    
    navigate(route, { 
      replace: true, 
      state: { 
        openConfigurator: options?.openConfigurator ?? true,
        freshStart: true 
      } 
    });
  }, [navigate, clearWorkingDraft]);
  
  return { startNewQuote };
};
```

**Update all New Quote buttons** to use this unified hook:
- `QuotesDropdown.tsx`
- `OICalculator.tsx`
- `CashflowDashboard.tsx`
- Client pages (ClientCard, etc.)

### Phase 6: Clear Local State When Clearing Draft

**File: `src/hooks/useCashflowQuote.ts`**

Enhance `clearWorkingDraft` to also reset the local state:

```tsx
const clearWorkingDraft = useCallback(async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Clear database record
  await supabase.from('cashflow_quotes').update({
    inputs: {} as any,
    client_name: null,
    client_id: null,
    // ... all fields
  })
  .eq('broker_id', user.id)
  .eq('status', 'working_draft');
  
  // ALSO reset local state
  setQuote(null);
  setQuoteImages({
    floorPlanUrl: null,
    buildingRenderUrl: null,
    heroImageUrl: null,
    showLogoOverlay: true,
  });
  setLastSaved(null);
  
  console.log('Cleared working draft content and local state');
}, []);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CashflowDashboard.tsx` | Remove eager draft creation, add resume dialog check |
| `src/pages/OICalculator.tsx` | Add resume dialog check, use stricter validation |
| `src/hooks/useCashflowQuote.ts` | Block empty saves, reset local state on clear, improve title logic |
| `src/components/roi/QuotesDropdown.tsx` | Use unified `useNewQuote` hook |
| `src/components/roi/ResumeDraftDialog.tsx` | **NEW** - "Resume or Start Fresh" dialog |
| `src/hooks/useNewQuote.ts` | **NEW** - Unified new quote creation logic |

---

## Expected Behavior After Fix

1. **Opening `/cashflow-dashboard` fresh** → Check for draft → If exists with content, ask resume/fresh → If fresh, open empty configurator
2. **Opening `/cashflow-generator` fresh** → Same behavior as dashboard
3. **"New Quote" from anywhere** → Clear existing draft, navigate, open configurator empty
4. **Auto-save** → Only triggers when basePrice > 0 OR project/developer/client name exists
5. **No more "Untitled Quote"** entries appearing in quote lists from empty configurations
6. **Preselected clients** → Work consistently across all entry points

---

## Technical Notes

- The working_draft system remains (single row per user)
- `hasWorkingDraftContent()` already exists and works correctly
- All entry points will use the same logic via `useNewQuote` hook
- The resume dialog respects user preference ("Ask each time")
- Backward compatible - existing quotes unaffected
