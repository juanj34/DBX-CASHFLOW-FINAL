
# Plan: Improve Growth Phase Terminology for Client Clarity

## Overview

The current phase names "Construction", "Growth", and "Mature" are technical and confusing for clients. The proposed new terminology is more descriptive and investor-friendly:

| Current | New (English) | New (Spanish) |
|---------|--------------|---------------|
| Construction | Under Construction | En Construccion |
| Growth | Post Handover | Post Entrega |
| Mature | Zone Maturity | Madurez de Zona |

---

## Files Requiring Updates

Based on analysis, the phase labels appear in **13 files**:

### 1. Configurator Section (User-facing controls)
**File: `src/components/roi/configurator/AppreciationSection.tsx`**

| Location | Line | Current | New |
|----------|------|---------|-----|
| Phase legend | 386 | "Construction" | "Under Construction" |
| Phase legend | 390 | "Growth ({years}y)" | "Post Handover ({years}y)" |
| Phase legend | 394 | "Mature" | "Zone Maturity" |
| Slider label | 439 | "Construction" | "Under Construction" |
| Slider label | 458 | "Growth ({years}y)" | "Post Handover ({years}y)" |
| Slider label | 477 | "Growth Duration" | "Post Handover Duration" |
| Slider label | 496 | "Mature" | "Zone Maturity" |

### 2. Zone Appreciation Indicator (Zone info display)
**File: `src/components/roi/ZoneAppreciationIndicator.tsx`**

| Location | Line | Current | New |
|----------|------|---------|-----|
| Phase card | 86 | "Construction" | "Under Construction" |
| Phase card | 91 | "Growth ({years}y)" | "Post Handover ({years}y)" |
| Phase card | 96 | "Mature" | "Zone Maturity" |

### 3. OI Growth Curve (Chart labels)
**File: `src/components/roi/OIGrowthCurve.tsx`**

| Location | Line | Current | New |
|----------|------|---------|-----|
| Phase labels | 165 | "Construction" | "Under Construction" |
| Phase labels | 169 | "Growth" | "Post Handover" |
| Phase labels | 173 | "Mature" | "Zone Maturity" |

### 4. Wealth Projection Timeline (Snapshot view)
**File: `src/components/roi/snapshot/WealthProjectionTimeline.tsx`**

| Location | Line | Current | New |
|----------|------|---------|-----|
| getPhaseLabel function | 151 | "Constr" | "Constr" (keep short for space) |
| getPhaseLabel function | 152 | "Growth" | "Post-HO" |
| getPhaseLabel function | 153 | "Mature" | "Mature" (keep for space) |
| Legend items | ~245 | "Construction" | "Under Construction" |
| Legend items | ~252 | "Growth" | "Post Handover" |
| Legend items | ~257 | "Mature" | "Zone Maturity" |

### 5. Export Wealth Timeline (PDF export)
**File: `src/components/roi/export/ExportWealthTimeline.tsx`**

| Location | Line | Current | New |
|----------|------|---------|-----|
| getPhaseLabel (en) | 149 | "Constr" | "Constr" |
| getPhaseLabel (en) | 150 | "Growth" | "Post-HO" |
| getPhaseLabel (en) | 151 | "Mature" | "Mature" |
| getPhaseLabel (es) | 142 | "Constr" | "Constr" |
| getPhaseLabel (es) | 143 | "Crec" | "Post-E" |
| getPhaseLabel (es) | 144 | "Maduro" | "Maduro" |
| Legend (en) | 159 | "Construction" | "Under Construction" |
| Legend (en) | 161 | "Growth" | "Post Handover" |
| Legend (en) | 162 | "Mature" | "Zone Maturity" |
| Legend (es) | 159 | "Construccion" | "En Construccion" |
| Legend (es) | 161 | "Crecimiento" | "Post Entrega" |
| Legend (es) | 162 | "Maduro" | "Madurez de Zona" |

### 6. OI Yearly Projection Table
**File: `src/components/roi/OIYearlyProjectionTable.tsx`**

| Location | Line | Current | New |
|----------|------|---------|-----|
| Footer legend | 174 | "{t('build')}" | Keep (using translation key) |
| Footer legend | 175 | "{t('growth')}" | Update translation key |
| Footer legend | 176 | "{t('mature')}" | Update translation key |
| Status badge | 332 | "{t('growth')}" | Update translation key |
| Status badge | 332 | "{t('mature')}" | Update translation key |

### 7. Value Differentiators Section
**File: `src/components/roi/ValueDifferentiatorsSection.tsx`**

| Location | Line | Current | New |
|----------|------|---------|-----|
| Tooltip text (en) | 176 | "construction, growth, mature" | "under construction, post handover, zone maturity" |
| Tooltip text (es) | 175 | "construccion, crecimiento, madurez" | "en construccion, post entrega, madurez de zona" |

---

## Translation Keys to Add/Update

**File: Translation system (LanguageContext or i18n files)**

```typescript
// English
phaseUnderConstruction: "Under Construction",
phasePostHandover: "Post Handover", 
phaseZoneMaturity: "Zone Maturity",

// Spanish
phaseUnderConstruction: "En Construccion",
phasePostHandover: "Post Entrega",
phaseZoneMaturity: "Madurez de Zona",
```

---

## Abbreviated Labels (for space-constrained areas)

For timelines, charts, and compact views, use abbreviated versions:

| Phase | Full Label | Abbreviated |
|-------|-----------|-------------|
| Under Construction | Under Construction | Constr |
| Post Handover | Post Handover | Post-HO |
| Zone Maturity | Zone Maturity | Maturity |

---

## Implementation Approach

1. **Create centralized phase label constants** - Add a utility file or extend existing constants to have a single source of truth for all phase labels (full and abbreviated, English and Spanish)

2. **Update components** - Replace hardcoded strings with the new terminology

3. **Keep internal variable names** - The TypeScript types (`'construction' | 'growth' | 'mature'`) and variable names (`constructionAppreciation`, etc.) remain unchanged to avoid breaking changes

4. **Consistent colors preserved** - Orange for construction, Green for post-handover, Blue for maturity

---

## Visual Example

**Current:**
```
Construction → Growth → Mature
    12%     →   8%   →   4%
```

**New:**
```
Under Construction → Post Handover → Zone Maturity
        12%        →      8%       →      4%
```

---

## Technical Notes

- Only display labels change; no calculation logic is affected
- Database column names (`construction_appreciation`, etc.) remain unchanged
- Variable names in code remain unchanged for backward compatibility
- Tooltips and info icons will use the new terminology
