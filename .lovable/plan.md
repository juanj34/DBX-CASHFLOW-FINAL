
# Fix: Configurator Opens with "0/4" Instead of "1/4"

## Root Cause Analysis

There are **two bugs** causing this issue:

### Bug 1: Stale localStorage with Old Section Names
- The old configurator had 9 sections: `['client', 'property', 'images', 'payment', 'value', 'appreciation', 'exits', 'rent', 'mortgage']`
- The new configurator has 4 sections: `['project', 'investment', 'returns', 'extras']`
- `localStorage` may contain `savedState.activeSection = 'client'` from the old implementation
- `SECTIONS.indexOf('client')` returns `-1` because `'client'` doesn't exist in the new array
- `currentIndex = -1` causes the display to show `0/4` instead of `1/4`

### Bug 2: First Section Not Auto-Added to Visited Set
- When opening fresh (no localStorage), `visitedSections` is initialized as empty `Set()`
- The first section `'project'` should be automatically marked as visited on mount

---

## Solution

### Fix 1: Validate Saved Section Before Using It

**File: `src/components/roi/configurator/ConfiguratorLayout.tsx`**

Update the `loadConfiguratorState` function to validate that the saved section exists in the current `SECTIONS` array:

```typescript
const loadConfiguratorState = (): ConfiguratorState | null => {
  try {
    const saved = localStorage.getItem(CONFIGURATOR_STATE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      // Validate that saved section exists in current SECTIONS array
      if (state.activeSection && !SECTIONS.includes(state.activeSection)) {
        // Old section name from previous implementation - clear and start fresh
        localStorage.removeItem(CONFIGURATOR_STATE_KEY);
        return null;
      }
      // Filter visitedSections to only include valid sections
      if (state.visitedSections) {
        state.visitedSections = state.visitedSections.filter(
          (s: string) => SECTIONS.includes(s as ConfiguratorSection)
        );
      }
      return state;
    }
  } catch (e) {
    console.error('Error loading configurator state:', e);
  }
  return null;
};
```

### Fix 2: Auto-Add First Section to Visited Set on Mount

**File: `src/components/roi/configurator/ConfiguratorLayout.tsx`**

Update the `visitedSections` initialization to always include the starting section:

```typescript
const [visitedSections, setVisitedSections] = useState<Set<ConfiguratorSection>>(() => {
  const saved = savedState?.visitedSections || [];
  // Always include the starting section in visited
  const startSection = savedState?.activeSection || 'project';
  return new Set([...saved, startSection]);
});
```

### Fix 3: Same Fixes for Mobile Configurator

**File: `src/components/roi/configurator/MobileConfiguratorSheet.tsx`**

Update `visitedSections` initialization:

```typescript
const [visitedSections, setVisitedSections] = useState<Set<ConfiguratorSection>>(
  new Set(['project']) // Always start with first section visited
);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/configurator/ConfiguratorLayout.tsx` | Validate saved section against current SECTIONS array; auto-add starting section to visitedSections |
| `src/components/roi/configurator/MobileConfiguratorSheet.tsx` | Auto-add 'project' to initial visitedSections |

---

## Expected Result

| Scenario | Before | After |
|----------|--------|-------|
| First open (no localStorage) | "0/4", no highlighting | "1/4", step 1 highlighted |
| Open with old localStorage (`'client'`) | "0/4", broken | "1/4", localStorage cleared, starts fresh |
| Open with valid localStorage (`'investment'`) | Works | Works (no change) |

---

## Technical Details

The `currentIndex` calculation on line 259:
```typescript
const currentIndex = SECTIONS.indexOf(activeSection);
```

When `activeSection = 'client'` (from old localStorage):
- `SECTIONS.indexOf('client')` returns `-1`
- `currentIndex + 1` = `0`
- Display shows "0/4"

After fix:
- Invalid sections are filtered out
- Falls back to `'project'`
- `currentIndex = 0`
- Display shows "1/4"
