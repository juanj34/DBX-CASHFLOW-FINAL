
# Plan: Global Language Setting in TopNavbar

## Summary

Move language from a per-page/per-view setting to a **global app-wide setting** accessible from the TopNavbar. The language should:
1. Be persisted in the user's profile (database) and localStorage (for immediate access)
2. Be accessible via a toggle in the TopNavbar on ALL pages
3. Translate EVERYTHING across the app (all components, pages, modals)
4. Currency remains per-exercise/view (no change needed)

---

## Current State

| Aspect | Current Behavior |
|--------|------------------|
| LanguageContext | Exists, provides `language`, `setLanguage`, `t()` |
| Persistence | Not persisted - resets on page reload |
| TopNavbar | Language toggle only appears when `setLanguage` prop is passed |
| OffPlanVsSecondary | Has local `useState` for language (not using context) |
| Profile table | Has `theme_preference` but NO `language_preference` |

---

## Architecture Changes

### 1. Database: Add `language_preference` column to `profiles`

```sql
ALTER TABLE public.profiles 
ADD COLUMN language_preference TEXT DEFAULT 'en';
```

### 2. Update LanguageContext to Persist Language

The context will:
- Load from localStorage first (instant UI)
- Sync with profile from database when available
- Save to both localStorage and database when changed

```typescript
// src/contexts/LanguageContext.tsx
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from localStorage for instant load
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'en' || saved === 'es') ? saved : 'en';
  });

  // Sync with profile when it loads
  useEffect(() => {
    const loadFromProfile = async () => {
      const { data } = await supabase.from('profiles')
        .select('language_preference')
        .eq('id', userId)
        .single();
      if (data?.language_preference) {
        setLanguageState(data.language_preference as Language);
        localStorage.setItem('app_language', data.language_preference);
      }
    };
    loadFromProfile();
  }, []);

  // Persist to both localStorage and database
  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    await supabase.from('profiles')
      .update({ language_preference: lang })
      .eq('id', userId);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
```

### 3. Update TopNavbar to Always Show Language Toggle

Remove the conditional prop-based language toggle. The TopNavbar will always show the language toggle by consuming the context directly:

```typescript
// src/components/layout/TopNavbar.tsx
import { useLanguage } from '@/contexts/LanguageContext';

export const TopNavbar = ({ 
  showNewQuote = true,
  // REMOVE: language, setLanguage props (no longer needed)
  currency,
  setCurrency,
}: TopNavbarProps) => {
  const { language, setLanguage } = useLanguage(); // Always from context
  
  // ...

  {/* Language Toggle - Always visible */}
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8"
    onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
    title={language === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
  >
    <span className="text-base">{language === 'en' ? '🇬🇧' : '🇪🇸'}</span>
  </Button>
```

### 4. Update Pages to Use Global Language

Remove local language state from pages like `OffPlanVsSecondary`:

```typescript
// src/pages/OffPlanVsSecondary.tsx

// REMOVE these local states:
// const [language, setLanguage] = useState<'en' | 'es'>('es');

// USE context instead:
const { language, t } = useLanguage();

// Update TopNavbar call - no language/setLanguage props needed:
<TopNavbar currency={currency} setCurrency={setCurrency} />
```

### 5. Update Profile Interface and Hook

```typescript
// src/hooks/useProfile.ts
export interface Profile {
  // ... existing fields
  language_preference: string | null; // NEW
}

// Add to select query and updateProfile
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/xxx_add_language_preference.sql` | Add column to profiles |
| `src/contexts/LanguageContext.tsx` | Add persistence (localStorage + DB) |
| `src/hooks/useProfile.ts` | Add `language_preference` field |
| `src/components/layout/TopNavbar.tsx` | Remove language props, use context directly |
| `src/pages/OffPlanVsSecondary.tsx` | Remove local language state, use context |
| `src/pages/CashflowDashboard.tsx` | Remove language props from TopNavbar |
| `src/pages/OICalculator.tsx` | Remove language props from TopNavbar |
| Other pages calling TopNavbar with language props | Remove props |

---

## Implementation Flow

```text
┌────────────────────────────────────────────────────────────────┐
│                        App.tsx                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               LanguageProvider                            │  │
│  │  • Loads from localStorage (instant)                      │  │
│  │  • Syncs with profiles.language_preference               │  │
│  │  • Provides: language, setLanguage, t()                  │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │                   TopNavbar                         │  │  │
│  │  │  • Always shows 🇬🇧/🇪🇸 toggle                      │  │  │
│  │  │  • Uses useLanguage() from context                 │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              All Pages & Components                 │  │  │
│  │  │  • Use useLanguage() → get t() function            │  │  │
│  │  │  • All text translated via t('key')                │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Translation Coverage

The existing `translations` object in `LanguageContext.tsx` already has ~500+ translation keys covering:
- Navigation labels
- Dashboard metrics
- Quote/calculation terminology
- Modal and form labels
- Status badges
- Error messages
- All ROI calculator sections

Any hardcoded English strings in components will need to be migrated to use `t('key')`.

---

## Currency Behavior (No Changes Needed)

Currency remains a **per-exercise setting** because:
- Different quotes may be presented to clients from different countries
- Currency conversion is specific to the financial analysis context
- The `setCurrency` prop pattern works well for this use case

---

## Technical Considerations

1. **Instant Load**: Use localStorage as primary source for immediate language display
2. **Database Sync**: Background sync with profile for persistence across devices
3. **No Breaking Changes**: Public views (SnapshotView, PresentationView) can continue to use URL params or their own language handling for client-facing content
4. **Fallback**: Default to 'en' if no preference is set
