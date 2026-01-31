
# Single Working Draft System

## Concept

Each user has exactly **ONE** "working draft" row in the database. This draft:
- Is reused across sessions until explicitly saved as a proper quote
- Gets overwritten each time the user starts a new quote
- Transitions from `status: 'working_draft'` to `status: 'draft'` when promoted

## How It Works

```text
User opens /cashflow-generator (no quoteId)
        ↓
Load user's working draft from DB (or create one if none exists)
        ↓
Auto-save updates THIS SAME ROW
        ↓
User clicks "Save" or names the quote
        ↓
Status changes: working_draft → draft (promoted to real quote)
New working draft slot is created for next time
```

## Key States

| Status | Meaning | Visible in Quote List? |
|--------|---------|------------------------|
| `working_draft` | Active session work, not yet saved | **No** - Hidden from list |
| `draft` | Saved draft, intentionally kept | Yes |
| `presented` | Shared with client | Yes |
| `negotiating` | In discussion | Yes |
| `sold` | Closed deal | Yes |

## User Experience

1. **Opening Generator Without Quote ID**:
   - System loads user's existing `working_draft` (if any)
   - If no working draft exists, creates one
   - User continues where they left off

2. **Navigating to Another Quote**:
   - Show dialog: "You have unsaved work. Save as draft or discard?"
   - **Save**: Promotes current working_draft → draft, then loads selected quote
   - **Discard**: Clears working_draft content, loads selected quote
   - **Cancel**: Stay on current page

3. **Clicking "New Quote"**:
   - Same dialog if working_draft has content
   - After handling, clears working_draft for fresh start

4. **Explicit Save Action**:
   - Promotes working_draft → draft with proper title
   - Creates new empty working_draft for next session

## Database Changes

Add new status value `working_draft` for internal use:

```sql
-- Update existing quotes to ensure clean state
-- No migration needed - just start using new status value
```

The `status` column is already `text` type, so no schema change required.

## Implementation Details

### 1. Update `useCashflowQuote.ts`

**New Function: `getOrCreateWorkingDraft`**
```typescript
const getOrCreateWorkingDraft = async (userId: string): Promise<string> => {
  // Try to find existing working draft
  const { data: existing } = await supabase
    .from('cashflow_quotes')
    .select('id')
    .eq('broker_id', userId)
    .eq('status', 'working_draft')
    .maybeSingle();
  
  if (existing) {
    return existing.id;
  }
  
  // Create new working draft
  const { data: newDraft } = await supabase
    .from('cashflow_quotes')
    .insert({
      broker_id: userId,
      inputs: {},
      status: 'working_draft',
      title: null,
    })
    .select('id')
    .single();
  
  return newDraft.id;
};
```

**New Function: `promoteWorkingDraft`**
```typescript
const promoteWorkingDraft = async (quoteId: string): Promise<void> => {
  // Change status from working_draft to draft
  await supabase
    .from('cashflow_quotes')
    .update({ status: 'draft' })
    .eq('id', quoteId)
    .eq('status', 'working_draft');
};
```

**New Function: `clearWorkingDraft`**
```typescript
const clearWorkingDraft = async (userId: string): Promise<void> => {
  // Reset working draft to empty state
  await supabase
    .from('cashflow_quotes')
    .update({
      inputs: {},
      client_name: null,
      project_name: null,
      developer: null,
      unit: null,
      title: null,
    })
    .eq('broker_id', userId)
    .eq('status', 'working_draft');
};
```

**New Function: `hasWorkingDraftContent`**
```typescript
const hasWorkingDraftContent = (quote: CashflowQuote | null): boolean => {
  if (!quote) return false;
  return Boolean(
    quote.client_name ||
    quote.project_name ||
    quote.developer ||
    quote.inputs?.basePrice > 0
  );
};
```

### 2. Create `UnsavedDraftDialog.tsx`

Dialog shown when user tries to navigate away from working draft with content:

```typescript
interface UnsavedDraftDialogProps {
  open: boolean;
  onSave: () => Promise<void>;
  onDiscard: () => void;
  onCancel: () => void;
}
```

Options:
- **Save as Draft**: Promotes working draft, then proceeds
- **Discard**: Clears working draft content, proceeds
- **Cancel**: Stays on page

### 3. Update `useQuotesList.ts`

Filter out `working_draft` from the quotes list:

```typescript
// Exclude working_draft from visible quotes
.neq('status', 'working_draft')
```

### 4. Update Navigation Logic

**In `OICalculator.tsx` and `CashflowDashboard.tsx`**:

When user clicks "New Quote" or "Load Quote":
1. Check if current quote is a `working_draft` with content
2. If yes, show `UnsavedDraftDialog`
3. Handle user's choice before proceeding

### 5. Update Cleanup Edge Function

Modify `cleanup-empty-drafts` to:
- Skip `working_draft` status (keep one per user)
- Only clean `draft` status quotes that are empty and old

### 6. Translation Keys

| Key | EN | ES |
|-----|----|----|
| `unsavedDraft` | Unsaved Draft | Borrador sin Guardar |
| `unsavedDraftMessage` | You have unsaved work. What would you like to do? | Tienes trabajo sin guardar. ¿Qué te gustaría hacer? |
| `saveAsDraft` | Save as Draft | Guardar como Borrador |
| `discardDraft` | Discard | Descartar |
| `keepEditing` | Keep Editing | Seguir Editando |

## Files to Modify

| File | Action |
|------|--------|
| `src/hooks/useCashflowQuote.ts` | Add working draft functions, update createDraft logic |
| `src/components/roi/UnsavedDraftDialog.tsx` | **CREATE** - Dialog for save/discard prompt |
| `src/pages/OICalculator.tsx` | Integrate working draft loading, add dialog |
| `src/pages/CashflowDashboard.tsx` | Same integration as OICalculator |
| `src/pages/Home.tsx` | Filter out working_draft from quotes list |
| `src/pages/QuotesDashboard.tsx` | Filter out working_draft from quotes list |
| `supabase/functions/cleanup-empty-drafts/index.ts` | Skip working_draft in cleanup |
| `src/contexts/LanguageContext.tsx` | Add translation keys |

## Benefits

1. **One Draft Per User**: No more empty quote clutter
2. **Session Persistence**: Work-in-progress survives browser close
3. **Clear Intent**: Users explicitly choose to save or discard
4. **Hidden From List**: Working drafts don't appear in quote management
5. **Clean Promotion**: Clear transition from draft work → saved quote
6. **Reduced Cleanup**: Less need for background cleanup jobs
