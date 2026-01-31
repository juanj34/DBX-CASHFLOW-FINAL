
# Simplify Developer & Project Selection to Manual Mode

## Overview

This plan removes database dependencies for developers and projects, replacing them with:
1. **Static Developer List** - 200+ Dubai developers with searchable autocomplete
2. **Manual Project Entry** - Text input with localStorage-based recent projects
3. **Simplified Showcase Cards** - Display name only without database lookups
4. **Hidden Admin Tabs** - Remove developers/projects tabs from Dashboard config

## Architecture Change

```text
BEFORE (Database-Driven)
─────────────────────────────────────────────────────────
DeveloperSelect   → supabase.from('developers')
ProjectSelect     → supabase.from('projects')  
ShowcaseDeveloperCard → DB lookup for logo, metrics
ShowcaseProjectCard   → DB lookup for status, logo
DeveloperInfoModal    → Trust scores, radar charts
DashboardLayout       → Projects + Developers tabs

AFTER (Static + LocalStorage)
─────────────────────────────────────────────────────────
DeveloperSelect   → Static DEVELOPERS array (searchable)
ProjectSelect     → Text input + localStorage recents
ShowcaseDeveloperCard → Display name + icon (no DB)
ShowcaseProjectCard   → Display name + icon (no DB)
DeveloperInfoModal    → DISABLED (no metrics)
DashboardLayout       → Remove Projects + Developers tabs
```

## Files to Create

### 1. `src/data/developers.ts` - Static Developer List

Comprehensive list of 200+ Dubai developers alphabetically sorted:

```typescript
export const DEVELOPERS = [
  "A&A Real Estate",
  "Aark Developers",
  "Abyaar",
  "AG Properties",
  "Al Barari",
  "Al Futtaim Properties",
  "Al Ghurair Properties",
  "Al Habtoor Group",
  "Al Khail Ventures",
  "Al Seeb Real Estate",
  // ... (207 total developers listed in previous research)
].sort();
```

### 2. `src/hooks/useRecentProjects.ts` - Recent Projects Hook

Manages localStorage for recently used project names:

```typescript
interface RecentProject {
  name: string;
  developer: string;
  usedAt: string;  // ISO date
}

export const useRecentProjects = () => {
  const [recents, setRecents] = useState<RecentProject[]>([]);
  
  const addRecent = (name: string, developer?: string) => { ... };
  const getRecents = (filterByDeveloper?: string) => { ... };
  const clearRecents = () => { ... };
  
  return { recents, addRecent, getRecents, clearRecents };
};
```

- Max 10 projects stored
- Filters by developer when provided
- Auto-removes duplicates (updates timestamp instead)

## Files to Modify

### 3. `src/components/roi/configurator/DeveloperSelect.tsx` - REWRITE

Remove all Supabase imports and use static list:

**Key Changes:**
- Remove `useEffect` fetching from database
- Import `DEVELOPERS` from static data file
- Remove `Developer` interface (no more IDs/logos)
- Simplify `onValueChange` to just pass string name
- Keep search/filter functionality
- Keep ability to type custom developer name

**New Interface:**
```typescript
interface DeveloperSelectProps {
  value: string;  // Just the name now
  onValueChange: (name: string) => void;
  className?: string;
}
```

### 4. `src/components/roi/configurator/ProjectSelect.tsx` - REWRITE

Convert to manual text input with recent projects dropdown:

**Key Changes:**
- Remove all Supabase imports
- Use `useRecentProjects` hook
- Replace Command/Popover with Input + recent dropdown
- Developer prop becomes optional (for filtering recents)

**New Interface:**
```typescript
interface ProjectSelectProps {
  value: string;
  developer?: string;  // For filtering recents
  onValueChange: (name: string) => void;
  onAddRecent?: (name: string) => void;
  className?: string;
}
```

### 5. `src/components/roi/configurator/ClientSection.tsx` - UPDATE

Simplify the developer/project selection integration:

**Key Changes (around lines 360-490):**
- Remove `selectedDeveloperId` and `selectedProjectId` state
- Remove `manualDeveloper` and `manualProject` toggle logic
- Simplify `handleDeveloperSelect` to just update `clientInfo.developer`
- Simplify `handleProjectSelect` to just update `clientInfo.projectName`
- Remove the "Add new developer" admin buttons
- Remove zone auto-population from project selection

### 6. `src/components/dashboard/DashboardLayout.tsx` - UPDATE

Remove developers and projects tabs from admin navigation:

**Key Changes:**
- Remove `"projects"` and `"developers"` from `ActiveTab` type
- Remove NavButton components for Projects and Developers
- Remove content rendering for these tabs
- Keep imports but don't use (for potential future re-enablement)

**Lines to modify:**
- Line 23: Remove from `ActiveTab` type
- Lines 101-102: Remove NavButton calls
- Lines 164-165: Remove content rendering

### 7. `src/components/roi/showcase/ShowcaseDeveloperCard.tsx` - SIMPLIFY

Remove database lookup, just display name:

**Key Changes:**
- Remove Supabase import and useEffect fetch
- Remove `Developer` type import from developerTrustScore
- Remove `TrustScoreRing` component usage
- Just display developer name with Building icon
- Keep styling for consistency

### 8. `src/components/roi/showcase/ShowcaseProjectCard.tsx` - SIMPLIFY

Remove database lookup, just display name:

**Key Changes:**
- Remove Supabase import and useEffect fetch
- Remove construction status badge (no data source)
- Just display project name with Building2 icon
- Keep styling for consistency

### 9. Additional Components to Update

These components currently fetch developer/project data for display. Update them to:
- Remove database lookups
- Display only the name provided via props
- Skip any metrics/ratings display

| Component | Current Behavior | New Behavior |
|-----------|------------------|--------------|
| `PropertyShowcase.tsx` | Fetches dev/project data | Display names only |
| `PropertyHeroCard.tsx` | Fetches dev/project data | Display names only |
| `PropertyTabContent.tsx` | React Query for dev/project | Skip queries, use props |
| `ClientUnitInfo.tsx` | Fetches dev/project data | Display names only |
| `DeveloperCard.tsx` | Fetches dev data | Display name + icon |
| `ProjectCard.tsx` | Fetches project data | Display name + icon |
| `BuildingRenderCard.tsx` | Fetches dev logo | Display name + icon |
| `DeveloperInfoModal.tsx` | Full modal with metrics | Disable/don't render |

## Developer List (207 Developers)

```text
A&A Real Estate, Aark Developers, Abyaar, AG Properties, Al Barari,
Al Futtaim Properties, Al Ghurair Properties, Al Habtoor Group,
Al Khail Ventures, Al Seeb Real Estate, Al Shirawi, Al Waleed,
Alef Group, Almal Real Estate, Aman Developments, Arada, ARY Properties,
Azizi Developments, Banke International, Bermuda, Binghatti,
Bloom Properties, Brix Developments, Buroj Oasis, Cayan Group,
Condor Developers, Conqueror, Crescent Bay, Damas, DAMAC Properties,
Danube Properties, Dar Al Arkan, Devmark Real Estate, Deyaar,
District One, Dubai Asset Group, Dubai Creek Harbour, Dubai Holding,
Dubai Properties, Dutco, Ellington Properties, Emaar Properties,
Empire Properties, Enso Group, ER Properties, Esnaad, Exclusive Links,
F&M Properties, Fam Properties, First Group, Five Holdings, G&Co,
Gemini Property Developers, GGICO Properties, Global Developers,
Golden Sands, Green Valley, Gulf Land, Huawei Real Estate, Hussain Sajwani,
IGO, Iman Developers, Imtiaz Developments, Inspired Living, Investcorp,
IrithM, ISG, Jade Property Development, Jebel Ali, JRP Group, Just Cavalli,
Kaloti Real Estate, Kleindienst Group, KOA Canvas, L&H Real Estate,
Leos Developments, Limitless, Living Legends, London Gate, Luxhabitat,
Luxurious Properties, LWK Partners, MAG Property Development, Majid Al Futtaim,
Majan Real Estate, MARM, Master Baker Developers, Maysan Properties,
Meerane, Meraas, Meydan Group, Miami Properties, MJM Real Estate,
Monsoon, Movenpick, MRE Development, Murano, Nakheel, Najibi Property,
Naturel, Nesuto, New York Developers, Next Level, Niche Solutions,
Nikki Beach Residences, Northacre, Object 1, Octa Properties, Okeanos,
Omniyat, One Developments, Orion Real Estate, Palace Developers,
Palma Development, Palm Investments, Paramount, Peninsula, Piedmont,
Pinnacle, PNRR, Power of 3, Prescott, Prime Development, Prime Living,
Prime Residential, Primo Capital, Prism, Provident, Pure Gold Living,
Purvanchal, Q Properties, Qube, R&F Properties, Rad Developments,
RAK Properties, Ranjit Developers, RDK, Re/Max, Regal, Regent Properties,
Reliance Group, Remix Investments, Renaissance, Reportage Properties,
Rethink Real Estate, Rixos, Rohan, Royal Park, RSG, S&S Properties,
Saadiyat, Sabeel, Samana Developers, Sanctuary Falls, Sansara, Sata,
Savills, Schon Properties, SCS Developers, Sean Property, Select Group,
Seven Tides, Shaikhani, Shapoorji Pallonji, Sillage, Siniya Island,
Sky View Properties, Smart Development, Sobha Realty, Soho Properties,
Sorouh Real Estate, South City, SPF Realty, Stella Maris, Subscribe,
Sukh, Sun and Sand, Sun Developments, Sunrise Bay, Swank Developments,
Synergy Real Estate, Taaleem Properties, Tasweek, TDIC, The First Group,
The One, Tiger Properties, Time Oak, Top Homes, TownX, Trident,
Trilith, True Living, Trump Organization, UNA, Union Properties,
Unique Properties, Urbana, URC Holdings, Viceroy, Villanova,
VincentHRD, Vincitore, Wasl Properties, Westar Properties, Whitbread,
WHK Properties, Woods & Waller, Wyndham, XS Real Estate, Zabeel,
Zaya, ZED Developments
```

## UI Changes Summary

### DeveloperSelect (Before → After)

```text
BEFORE:
┌─────────────────────────────────────────────┐
│ 🏢 [Logo] Emaar Properties            ▼    │  ← DB logo
│ Loading developers from database...         │  ← Network request
└─────────────────────────────────────────────┘

AFTER:
┌─────────────────────────────────────────────┐
│ 🏢 Emaar Properties                   ▼    │  ← No logo
│ 207 developers • Instant search             │  ← Static list
└─────────────────────────────────────────────┘
```

### ProjectSelect (Before → After)

```text
BEFORE:
┌─────────────────────────────────────────────┐
│ 🏠 [Logo] Dubai Creek Harbour         ▼    │  ← DB lookup
│ ZONE: Dubai Creek                           │  ← Zone data
└─────────────────────────────────────────────┘

AFTER:
┌─────────────────────────────────────────────┐
│ 🏠 Type project name...               ▼    │  ← Manual input
│ RECENT: The Valley, Lagoons Phase 2...      │  ← localStorage
└─────────────────────────────────────────────┘
```

### Dashboard Config (Before → After)

```text
BEFORE:                          AFTER:
├── Zones                        ├── Zones
├── Appreciation Presets         ├── Appreciation Presets
├── Hotspots                     ├── Hotspots
├── Projects  ← REMOVE           ├── Landmarks
├── Developers ← REMOVE
├── Landmarks
```

## Technical Summary

| File | Action | Lines Changed (approx) |
|------|--------|------------------------|
| `src/data/developers.ts` | CREATE | ~220 lines |
| `src/hooks/useRecentProjects.ts` | CREATE | ~60 lines |
| `DeveloperSelect.tsx` | REWRITE | ~100 lines |
| `ProjectSelect.tsx` | REWRITE | ~120 lines |
| `ClientSection.tsx` | UPDATE | ~80 lines changed |
| `DashboardLayout.tsx` | UPDATE | ~15 lines removed |
| `ShowcaseDeveloperCard.tsx` | SIMPLIFY | ~30 lines |
| `ShowcaseProjectCard.tsx` | SIMPLIFY | ~30 lines |
| `PropertyShowcase.tsx` | UPDATE | ~40 lines |
| `PropertyHeroCard.tsx` | UPDATE | ~40 lines |
| `PropertyTabContent.tsx` | UPDATE | ~30 lines |
| `ClientUnitInfo.tsx` | UPDATE | ~40 lines |
| `DeveloperCard.tsx` | SIMPLIFY | ~50 lines |
| `ProjectCard.tsx` | SIMPLIFY | ~40 lines |
| `BuildingRenderCard.tsx` | UPDATE | ~20 lines |
| `DeveloperInfoModal.tsx` | DISABLE | Return null |

## Benefits

1. **No Database Dependency** - Instant, offline-capable developer selection
2. **Faster UX** - No loading states, immediate search results
3. **Simpler Code** - Remove complex DB integration
4. **Easy Updates** - Add developers by editing static array
5. **Recent Projects** - Quick access to frequently used entries
6. **Future-Proof** - Can re-add database integration when ready

## Note on Existing Data

Existing quotes already store `developer` and `projectName` as string fields in `clientInfo` / `inputs`. No database migration needed - the static list just provides convenient selection without changing how data is stored.
