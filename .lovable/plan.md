

## Plan: Fix New Quote Creation, Page Refresh, and Progress Bar Issues

### Issues Identified

1. **No "New Quote" option in the Cashflow view sidebar** - The `DashboardSidebar` has a "Generator" link but no explicit "New Quote" action to start fresh
2. **Weird refresh when clicking Configure** - When loading a cashflow page and clicking configure, the page briefly refreshes because:
   - `createDraft()` is called when clicking "Start Configuration" without a `quoteId`
   - This creates a new draft and navigates to `/cashflow/${newId}` with `replace: true`
   - The localStorage flag `cashflow_configurator_open` is set, then the new page loads and opens the configurator
   - This causes a visible navigation/refresh cycle
3. **Progress bar shows already created on new quotes** - The `ConfiguratorLayout` loads saved state from localStorage (`CONFIGURATOR_STATE_KEY`) and pre-populates `visitedSections`, making it appear sections are already completed

---

### Root Cause Analysis

**Issue 1: Missing New Quote button**
- The sidebar has navigation to `/cashflow-generator` but no quick action to start a truly fresh quote
- Users need an explicit "New Quote" option that clears state and starts from scratch

**Issue 2: Page refresh on Configure click**
- In `OICalculator.tsx` (lines 362-372), clicking "Start Configuration" calls `createDraft()` which:
  1. Creates a DB draft
  2. Sets localStorage flag
  3. Navigates to new URL
  4. New page loads, detects flag, opens modal
- This causes a full navigation cycle that feels like a "refresh"

**Issue 3: Progress bar state persistence**
- `ConfiguratorLayout.tsx` (lines 81-99, 120-160) loads saved state from localStorage:
  ```typescript
  const savedState = quoteId ? loadConfiguratorState() : null;
  ```
- The issue: When a new quote is created via `createDraft()`, it gets a `quoteId` immediately
- When the configurator opens with that `quoteId`, it loads the OLD saved state from localStorage
- The fix at line 156-159 clears state when `!quoteId`, but since we now always have a `quoteId` after `createDraft()`, the old state persists

---

### Technical Changes

#### File 1: `src/components/roi/dashboard/DashboardSidebar.tsx`

**Change:** Add "New Quote" action button in the Quote section

```typescript
// Add new prop to interface
onNewQuote?: () => void;

// In the Quote section (around line 335), add New Quote button:
<ActionButton 
  icon={FilePlus} 
  label="New Quote" 
  onClick={onNewQuote} 
  collapsed={collapsed}
/>
```

Add import for `FilePlus` from lucide-react.

---

#### File 2: `src/components/roi/dashboard/DashboardLayout.tsx`

**Change:** Add `onNewQuote` prop and pass it to sidebar

```typescript
// Add to interface:
onNewQuote?: () => void;

// Pass to DashboardSidebar:
<DashboardSidebar
  {...sidebarProps}
  onNewQuote={onNewQuote}
/>
```

---

#### File 3: `src/pages/OICalculator.tsx`

**Change 1:** Create `handleNewQuote` function that properly resets state

```typescript
const handleNewQuote = useCallback(async () => {
  // Clear configurator localStorage state BEFORE creating draft
  localStorage.removeItem('cashflow-configurator-state');
  localStorage.removeItem('cashflow_configurator_open');
  
  // Navigate to generator without a quoteId first
  navigate('/cashflow-generator', { replace: true });
}, [navigate]);
```

**Change 2:** Fix the "Start Configuration" button to not cause a refresh cycle

```typescript
onClick={async () => {
  // Clear configurator state for fresh start
  localStorage.removeItem('cashflow-configurator-state');
  
  if (!quoteId) {
    const newId = await createDraft();
    if (newId) {
      // Don't use localStorage flag - open modal directly after navigation
      navigate(`/cashflow/${newId}`, { replace: true, state: { openConfigurator: true } });
      return;
    }
  }
  setModalOpen(true);
}}
```

**Change 3:** Use navigation state instead of localStorage for configurator open

```typescript
// Replace the localStorage-based effect with navigation state:
import { useLocation } from 'react-router-dom';

const location = useLocation();

useEffect(() => {
  if (dataLoaded && location.state?.openConfigurator) {
    setModalOpen(true);
    // Clear the state to prevent reopening on refresh
    navigate(location.pathname, { replace: true, state: {} });
  }
}, [dataLoaded, location.state?.openConfigurator, navigate, location.pathname]);
```

**Change 4:** Pass `onNewQuote` to DashboardLayout

```typescript
<DashboardLayout
  {...existingProps}
  onNewQuote={handleNewQuote}
>
```

---

#### File 4: `src/components/roi/configurator/ConfiguratorLayout.tsx`

**Change:** Clear localStorage state when opening for a NEW quote (detect by checking if quote has real data)

The current logic checks `quoteId ? loadConfiguratorState() : null` but new drafts get a `quoteId` immediately. We need to also check if the quote has actual content.

```typescript
// Lines 120-122: Update the condition to also clear for empty drafts
// Pass a new prop to indicate this is a fresh quote
interface ConfiguratorLayoutProps {
  // ... existing props
  isNewQuote?: boolean;  // Add this prop
}

// Line 122: Update logic
const savedState = (quoteId && !isNewQuote) ? loadConfiguratorState() : null;

// Line 156-159: Already handles clearing - keep as is
```

Then in `OICalculator.tsx`, pass `isNewQuote` based on whether the quote has real data:

```typescript
const isNewQuote = !!(quoteId && !quote?.project_name && !quote?.developer && inputs.basePrice === 0);

// In the ConfiguratorLayout modal:
<ConfiguratorLayout
  {...existingProps}
  isNewQuote={isNewQuote}
/>
```

---

### Summary of Changes

| File | Change |
|------|--------|
| `DashboardSidebar.tsx` | Add "New Quote" action button with `FilePlus` icon |
| `DashboardLayout.tsx` | Add `onNewQuote` prop and pass to sidebar |
| `OICalculator.tsx` | 1. Add `handleNewQuote` function that clears state and navigates fresh |
|  | 2. Use navigation state instead of localStorage for configurator open |
|  | 3. Clear configurator localStorage before creating draft |
|  | 4. Pass `isNewQuote` prop to ConfiguratorLayout |
| `ConfiguratorLayout.tsx` | Add `isNewQuote` prop to skip loading saved state for new/empty quotes |

---

### Expected Results

1. **New Quote button** in sidebar allows users to start a completely fresh quote at any time
2. **No page refresh** when clicking Configure - the modal opens smoothly without navigation flicker
3. **Progress bar starts at 0%** for new quotes - no stale visited sections from previous configurations
4. **Smooth UX flow** - creating a new quote feels instant and clean

