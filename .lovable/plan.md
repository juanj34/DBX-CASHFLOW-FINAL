
# Plan: Streamline LocationSection UX - Remove Visual Clutter

## Problem Analysis

The LocationSection feels "clunky" because it uses a **heavy card-per-group pattern** that other sections don't follow:

```text
Current Layout (Cluttered):
┌─────────────────────────────────────────┐
│ 📍 Investment Zone                      │  ← Separate card with icon header
│    Select where the property is located │
│    [Zone Dropdown]                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🏢 Developer & Project                  │  ← Another card with icon header
│    Who is building the property         │
│    Developer: [Dropdown]                │
│    Project Name: [Dropdown]             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🏗️ Unit Details                         │  ← Third card with icon header
│    Specific unit information            │
│    [Unit] [Type]                        │
│    [Size sqf] [Size m²]                 │
└─────────────────────────────────────────┘
```

**Issues:**
1. **3 bordered cards** create excessive visual separation
2. **Icon header blocks** (icon + title + subtitle) repeat and take ~40px height each
3. **Redundant subtitles** - "Select where the property is located" is obvious
4. **Inconsistent with PropertySection** which uses compact inline rows

---

## Solution: Flatten to Compact Inline Rows

Adopt the same pattern used in PropertySection and RentSection:
- Single container or minimal grouping
- Inline label + control pairs
- Remove icon boxes (or use inline icons)
- Remove redundant subtitles

```text
Target Layout (Streamlined):
┌─────────────────────────────────────────┐
│ Location & Property                     │
│ Select the zone and enter property info │
│                                         │
│ [AI Import Banner - compact]            │
│                                         │
│ Zone    [Al Barari ▼]                   │  ← Inline row
│                                         │
│ Developer [NYX Properties ▼]            │  ← Inline row
│ Project   [Xenia Residence ▼]           │  ← Inline row
│                                         │
│ ┌──────────────┐ ┌──────────────┐       │
│ │ Unit: 202    │ │ Type: Studio │       │  ← 2-column grid
│ └──────────────┘ └──────────────┘       │
│ ┌──────────────┐ ┌──────────────┐       │
│ │ Size: 560.69 │ │ Size: 52.1   │       │
│ │     sqft     │ │     m²       │       │
│ └──────────────┘ └──────────────┘       │
└─────────────────────────────────────────┘
```

---

## Detailed Changes

### File: `src/components/roi/configurator/LocationSection.tsx`

#### 1. Remove Icon Header Blocks
Replace this pattern:
```tsx
<div className="p-4 rounded-xl border border-theme-border bg-theme-card">
  <div className="flex items-center gap-2 mb-3">
    <div className="p-2 rounded-lg bg-theme-accent/10">
      <MapPin className="w-4 h-4 text-theme-accent" />
    </div>
    <div>
      <h4 className="text-sm font-semibold text-theme-text">Investment Zone</h4>
      <p className="text-xs text-theme-text-muted">Select where...</p>
    </div>
  </div>
  <ZoneSelect ... />
</div>
```

With simple inline rows:
```tsx
<div className="flex items-center justify-between gap-3 p-2.5 bg-theme-bg/50 rounded-lg border border-theme-border/50">
  <span className="text-xs text-theme-text-muted">Zone</span>
  <div className="flex-1 max-w-[280px]">
    <ZoneSelect ... />
  </div>
</div>
```

#### 2. Combine Developer & Project into Inline Rows
```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between gap-3 p-2.5 bg-theme-bg/50 rounded-lg border border-theme-border/50">
    <span className="text-xs text-theme-text-muted">Developer</span>
    <div className="flex-1 max-w-[280px]">
      <DeveloperSelect ... />
    </div>
  </div>
  <div className="flex items-center justify-between gap-3 p-2.5 bg-theme-bg/50 rounded-lg border border-theme-border/50">
    <span className="text-xs text-theme-text-muted">Project</span>
    <div className="flex-1 max-w-[280px]">
      <ProjectSelect ... />
    </div>
  </div>
</div>
```

#### 3. Simplify Unit Details Grid
Keep the 2x2 grid but remove the card wrapper and icon header:
```tsx
<div className="grid grid-cols-2 gap-2">
  <div className="p-2.5 bg-theme-bg/50 rounded-lg border border-theme-border/50">
    <label className="text-xs text-theme-text-muted mb-1 block">Unit</label>
    <Input ... />
  </div>
  <div className="p-2.5 bg-theme-bg/50 rounded-lg border border-theme-border/50">
    <label className="text-xs text-theme-text-muted mb-1 block">Type</label>
    <Select ... />
  </div>
  ...
</div>
```

#### 4. Make AI Import Banner More Compact
Reduce padding and make it single-line:
```tsx
<div className="flex items-center justify-between p-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10">
  <div className="flex items-center gap-2">
    <Sparkles className="w-4 h-4 text-purple-400" />
    <span className="text-xs text-theme-text-muted">
      Upload a brochure to auto-fill details
    </span>
  </div>
  <Button size="sm" variant="ghost" className="text-purple-400 h-7 px-2">
    <Sparkles className="w-3.5 h-3.5 mr-1" />
    Import
  </Button>
</div>
```

---

## Visual Comparison

**Before (3 heavy cards, ~320px tall):**
```text
┌──────────────────────────────────────────────┐
│ [Sparkles] AI Auto-Fill                      │
│ Upload a brochure or payment plan to...      │  [Import]
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ [📍] Investment Zone                         │
│     Select where the property is located     │
│     ┌──────────────────────────────────┐     │
│     │ Al Barari                      ▼ │     │
│     └──────────────────────────────────┘     │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ [🏢] Developer & Project                     │
│     Who is building the property             │
│     Developer: [NYX Properties ▼]            │
│     Project:   [Xenia Residence ▼]           │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ [🏗️] Unit Details                            │
│     Specific unit information                │
│     ┌────────────┐  ┌────────────┐           │
│     │ 202        │  │ Studio   ▼ │           │
│     └────────────┘  └────────────┘           │
│     ┌────────────┐  ┌────────────┐           │
│     │ 560.69     │  │ 52.1       │           │
│     └────────────┘  └────────────┘           │
└──────────────────────────────────────────────┘
```

**After (compact inline rows, ~200px tall):**
```text
┌─ [Sparkles] Upload brochure to auto-fill ── [Import] ─┐

Zone       │ Al Barari                              ▼ │
Developer  │ NYX Properties                         ▼ │
Project    │ Xenia Residence                        ▼ │

┌──────────────┐  ┌──────────────┐
│ Unit: 202    │  │ Type: Studio │
└──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐
│ 560.69 sqft  │  │ 52.1 m²      │
└──────────────┘  └──────────────┘
```

**Space savings:** ~40% reduction in vertical space

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/configurator/LocationSection.tsx` | Remove 3 card wrappers, remove icon header blocks, use inline label-control rows, compact AI banner |

---

## Design Principles Applied

1. **Consistency** - Match PropertySection's inline row pattern
2. **Density** - Real estate pros want data-dense UIs
3. **Less boxing** - One section boundary, not 3 nested cards
4. **Inline labels** - Left-aligned labels with right-aligned controls
5. **Visual hierarchy** - Section header → AI feature → Fields
