
# Plan: Fix SnapshotViewSidebar UI & Mobile Responsiveness

## Issues Identified

From the screenshot and code analysis:

1. **Currency/Language dropdowns appear empty** - The `SelectTrigger` uses `bg-theme-bg` which blends with the dark page background, and the `SelectValue` custom children don't render properly
2. **Dropdown items not visible** - The dropdown content styling needs better contrast and proper z-index
3. **No mobile layout** - The sidebar is fixed at 72px width with no responsive behavior
4. **Language toggle needs to update context** - Currently only updates local state, not the LanguageProvider

---

## Part 1: Fix Select Dropdowns Styling

### File: `src/components/roi/snapshot/SnapshotViewSidebar.tsx`

**Current Issue:**
```tsx
<SelectTrigger className="w-full h-9 bg-theme-bg border-theme-border">
  <SelectValue>
    <span className="flex items-center gap-2">
      <span>{CURRENCY_CONFIG[currency].flag}</span>
      <span>{currency}</span>
    </span>
  </SelectValue>
</SelectTrigger>
```

**Problem:** 
- `bg-theme-bg` is the same as page background, making the trigger invisible
- Custom children inside `SelectValue` may not display correctly

**Solution:**
- Change to `bg-theme-card-alt` for better contrast
- Add explicit text color class
- Use `placeholder` prop and let SelectValue auto-render
- Add proper `text-theme-text` to ensure visibility
- Add higher z-index to `SelectContent`

**Changes:**
```tsx
// Currency Select
<Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
  <SelectTrigger className="w-full h-9 bg-theme-card-alt border-theme-border text-theme-text">
    <SelectValue placeholder="Select currency">
      {CURRENCY_CONFIG[currency].flag} {currency}
    </SelectValue>
  </SelectTrigger>
  <SelectContent className="bg-theme-card border-theme-border z-[100]">
    {(Object.keys(CURRENCY_CONFIG) as Currency[]).map((c) => (
      <SelectItem key={c} value={c} className="text-theme-text">
        {CURRENCY_CONFIG[c].flag} {c}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// Language Select
<Select value={language} onValueChange={(v) => setLanguage(v as 'en' | 'es')}>
  <SelectTrigger className="w-full h-9 bg-theme-card-alt border-theme-border text-theme-text">
    <SelectValue placeholder="Select language">
      {language === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}
    </SelectValue>
  </SelectTrigger>
  <SelectContent className="bg-theme-card border-theme-border z-[100]">
    <SelectItem value="en" className="text-theme-text">🇬🇧 English</SelectItem>
    <SelectItem value="es" className="text-theme-text">🇪🇸 Español</SelectItem>
  </SelectContent>
</Select>
```

---

## Part 2: Add Mobile Responsiveness

The sidebar should:
- **Desktop (lg+)**: Show as fixed sidebar
- **Mobile**: Hide sidebar, show a header bar with hamburger menu that opens a Sheet/Drawer

### File: `src/components/roi/snapshot/SnapshotViewSidebar.tsx`

**Changes:**
1. Add responsive classes to hide sidebar on mobile
2. Create a mobile header with essential controls
3. Use Sheet component for mobile menu

**New Structure:**
```tsx
export const SnapshotViewSidebar = ({ ... }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <>
      {/* Mobile Header - visible on small screens */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-theme-card border-b border-theme-border">
        <div className="flex items-center justify-between p-3">
          <AppLogo />
          <div className="flex items-center gap-2">
            {/* Quick currency/language toggles */}
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 bg-theme-card border-theme-border p-0">
          {/* Same content as desktop sidebar */}
          <SidebarContent ... />
        </SheetContent>
      </Sheet>
      
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden lg:flex w-72 h-screen bg-theme-card border-r border-theme-border flex-col shrink-0">
        <SidebarContent ... />
      </aside>
    </>
  );
};

// Extract sidebar content to reuse between desktop and mobile
const SidebarContent = ({ ... }) => (
  <>
    <div className="p-4 border-b border-theme-border">
      <AppLogo />
    </div>
    {/* ... rest of sidebar sections */}
  </>
);
```

---

## Part 3: Update SnapshotView Layout for Mobile

### File: `src/pages/SnapshotView.tsx`

**Changes:**
- Add top padding on mobile to account for the fixed header
- Ensure main content area handles mobile layout

```tsx
return (
  <div className="min-h-screen bg-theme-bg flex flex-col lg:flex-row">
    {/* Sidebar handles its own mobile/desktop display */}
    <SnapshotViewSidebar ... />
    
    {/* Main Content - add top padding on mobile for fixed header */}
    <main className="flex-1 overflow-auto pt-14 lg:pt-0">
      <SnapshotContent ... />
    </main>
  </div>
);
```

---

## Part 4: Sync Language with Context

### File: `src/pages/SnapshotView.tsx`

The language changes in the sidebar should also update the LanguageContext so all translated components update.

**Changes:**
```tsx
const SnapshotViewContent = () => {
  const { setLanguage: setContextLanguage } = useLanguage();
  
  // When local language changes, also update context
  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLanguage(lang);
    setContextLanguage(lang);
  };
  
  // Pass handleLanguageChange to sidebar
  <SnapshotViewSidebar
    ...
    setLanguage={handleLanguageChange}
  />
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/snapshot/SnapshotViewSidebar.tsx` | Fix dropdown styling, add mobile header, use Sheet for mobile menu |
| `src/pages/SnapshotView.tsx` | Add mobile padding, sync language with context |

---

## Visual Summary

### Desktop (Current → Fixed)
```
┌─────────┬──────────────────────────────┐
│ Sidebar │       Main Content           │
│ w-72    │       (scrollable)           │
│         │                              │
│ [Logo]  │                              │
│ [Broker]│                              │
│ [Info]  │                              │
│ [AED ▼] │  ← Fixed: visible dropdown   │
│ [EN ▼]  │  ← Fixed: visible dropdown   │
│ [PDF]   │                              │
│ [PNG]   │                              │
└─────────┴──────────────────────────────┘
```

### Mobile (New)
```
┌───────────────────────────────────┐
│ [Logo]           [AED] [EN] [☰]  │ ← Fixed header
├───────────────────────────────────┤
│                                   │
│         Main Content              │
│         (full width)              │
│                                   │
└───────────────────────────────────┘

[☰] Opens Sheet with full sidebar content
```

---

## Technical Notes

- Use `Sheet` component from `@/components/ui/sheet` for mobile menu
- Add `z-[100]` to SelectContent for proper stacking
- Use `bg-theme-card-alt` for input backgrounds to contrast against `bg-theme-card` sidebar
- Mobile header height is `h-14` (56px), so main content needs `pt-14` on mobile
- Currency/Language flags use emoji flags for visual clarity
