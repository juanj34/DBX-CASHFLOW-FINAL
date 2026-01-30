

# Fix Theme Color Issues Across Components

## Problem Summary

Multiple components throughout the application use hardcoded hex colors (e.g., `#0f172a`, `#1a1f2e`, `#2a3142`, `text-gray-400`, `text-white`) instead of semantic theme tokens. This causes:

1. **Poor contrast** in light themes (Consultant) - dark text on dark backgrounds or vice versa
2. **Inconsistent appearance** - components don't adapt to theme changes
3. **Maintenance burden** - each theme change requires updating multiple files

## Files to Fix

### 1. ROICalculator.tsx (Full Refactor Needed)
**Current Issues:**
- Line 35: `bg-[#0f172a]` → hardcoded dark background
- Line 37: `border-[#2a3142] bg-[#0f172a]/80` → hardcoded header styling
- Line 41: `text-gray-400 hover:text-white hover:bg-[#1a1f2e]` → hardcoded button colors
- Line 46: `bg-[#CCFF00]/20` → hardcoded accent (should use `bg-theme-accent/20`)
- Line 47: `text-[#CCFF00]` → should use `text-theme-accent`
- Line 50: `text-white` → should use `text-theme-text`
- Line 51: `text-gray-400` → should use `text-theme-text-muted`
- Line 64: `text-gray-400 hover:text-white hover:bg-[#1a1f2e]`
- Line 95-109: Table with `bg-[#1a1f2e]`, `border-[#2a3142]`, `bg-[#0d1117]`, `text-gray-400`, `text-white`

**Changes:**
| From | To |
|------|-----|
| `bg-[#0f172a]` | `bg-theme-bg` |
| `bg-[#1a1f2e]` | `bg-theme-card` |
| `bg-[#0d1117]` | `bg-theme-bg-alt` |
| `border-[#2a3142]` | `border-theme-border` |
| `text-white` | `text-theme-text` |
| `text-gray-400` | `text-theme-text-muted` |
| `text-[#CCFF00]` | `text-theme-accent` |
| `text-[#00EAFF]` | `text-theme-accent-secondary` |
| `bg-[#CCFF00]/20` | `bg-theme-accent/20` |
| `divide-[#2a3142]` | `divide-theme-border` |

---

### 2. OIYearlyProjectionTable.tsx (Already Theme-Aware - No Changes)
This file already uses theme tokens correctly (`bg-theme-card`, `text-theme-text`, etc.). No changes needed.

---

### 3. LandmarkInfoCard.tsx
**Current Issues:**
- Line 21: `bg-[#1a1f2e] border border-[#2a3142]` → hardcoded modal background
- Line 45: `text-white` → should use `text-theme-text`
- Line 47: `text-gray-400` → should use `text-theme-text-muted`

**Changes:**
| Line | From | To |
|------|------|-----|
| 21 | `bg-[#1a1f2e] border border-[#2a3142]` | `bg-theme-card border border-theme-border` |
| 45 | `text-white` | `text-theme-text` |
| 47 | `text-gray-400` | `text-theme-text-muted` |

---

### 4. ZoneInfoCard.tsx (Already Theme-Aware - No Changes)
This file already uses theme tokens correctly. No changes needed.

---

### 5. LayerToggle.tsx (Already Theme-Aware - No Changes)
This file already uses theme tokens correctly. No changes needed.

---

### 6. MobileConfiguratorSheet.tsx (Already Theme-Aware - Minor Cleanup)
Most of this file is theme-aware. Minor review for any overlooked hardcoded values - appears clean.

---

### 7. PaymentSection.tsx (Already Theme-Aware - No Changes)
Already uses theme tokens correctly (`text-theme-text`, `bg-theme-card`, etc.).

---

### 8. AppreciationSection.tsx (Hardcoded Chart Colors)
**Current Issues:**
- Lines 351-355: Hardcoded chart gradient colors `#CCFF00`
- Line 417: Hardcoded stroke color `#CCFF00`

The chart colors need to remain as specific values for the gradient to work, but the component's structural styling is already theme-aware. The accent color `#CCFF00` is acceptable for the "Tech Dark" theme's lime accent, but ideally should use CSS custom properties. However, Recharts doesn't support CSS variables directly in SVG gradients. **This is acceptable as-is** since chart accents are intentionally consistent.

---

## Implementation Summary

| File | Status | Changes Needed |
|------|--------|----------------|
| `ROICalculator.tsx` | ❌ Needs Fix | Full theme token migration |
| `OIYearlyProjectionTable.tsx` | ✅ Already Fixed | None |
| `LandmarkInfoCard.tsx` | ❌ Needs Fix | 3 line changes |
| `ZoneInfoCard.tsx` | ✅ Already Fixed | None |
| `LayerToggle.tsx` | ✅ Already Fixed | None |
| `MobileConfiguratorSheet.tsx` | ✅ Already Fixed | None |
| `PaymentSection.tsx` | ✅ Already Fixed | None |
| `AppreciationSection.tsx` | ⚠️ Chart colors | Acceptable as-is |

---

## Technical Implementation

### ROICalculator.tsx - Full Changes

```tsx
// Line 35
// Before: <div className="min-h-screen bg-[#0f172a]">
// After:
<div className="min-h-screen bg-theme-bg">

// Line 37
// Before: <header className="border-b border-[#2a3142] bg-[#0f172a]/80 ...">
// After:
<header className="border-b border-theme-border bg-theme-bg/80 backdrop-blur-xl sticky top-0 z-50">

// Line 41
// Before: className="text-gray-400 hover:text-white hover:bg-[#1a1f2e]"
// After:
className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card"

// Lines 46-47
// Before: <div className="p-2 bg-[#CCFF00]/20 rounded-xl">
//         <TrendingUp className="w-6 h-6 text-[#CCFF00]" />
// After:
<div className="p-2 bg-theme-accent/20 rounded-xl">
  <TrendingUp className="w-6 h-6 text-theme-accent" />

// Lines 50-51
// Before: <h1 className="text-xl font-bold text-white">
//         <p className="text-sm text-gray-400">
// After:
<h1 className="text-xl font-bold text-theme-text">
<p className="text-sm text-theme-text-muted">

// Line 64
// Before: className="text-gray-400 hover:text-white hover:bg-[#1a1f2e]"
// After:
className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card"

// Lines 95-109 - Comparison Table
// Before: <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl ...">
// After:
<div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden">

// Before: <div className="p-4 border-b border-[#2a3142]">
// After:
<div className="p-4 border-b border-theme-border">

// Before: <h3 className="font-semibold text-white">
// After:
<h3 className="font-semibold text-theme-text">

// Before: <thead className="bg-[#0d1117]">
// After:
<thead className="bg-theme-bg-alt">

// Table header colors - keep investor type colors
// text-[#CCFF00] → text-theme-accent
// text-[#00EAFF] → text-theme-accent-secondary  
// text-[#FF00FF] → text-purple-400 (keep as-is, no theme token for tertiary)

// Before: <th className="... text-gray-400 ...">
// After:
<th className="... text-theme-text-muted ...">

// Before: <tbody className="divide-y divide-[#2a3142]">
// After:
<tbody className="divide-y divide-theme-border">

// Before: <td className="... text-gray-400">
// After:
<td className="... text-theme-text-muted">

// Before: <td className="... text-white ...">
// After:
<td className="... text-theme-text ...">

// Keep accent colors for OI/SI values:
// text-[#CCFF00] → text-theme-accent
// text-[#00EAFF] → text-theme-accent-secondary

// Before: text-gray-500 (for "—" placeholder)
// After: text-theme-text-muted
```

### LandmarkInfoCard.tsx - Changes

```tsx
// Line 21
// Before: className="relative max-w-4xl ... bg-[#1a1f2e] border border-[#2a3142] ..."
// After:
className="relative max-w-4xl w-[calc(100vw-2rem)] sm:w-[90vw] max-h-[85vh] bg-theme-card border border-theme-border rounded-xl shadow-2xl overflow-hidden mx-4 sm:mx-0"

// Line 45
// Before: <h2 className="text-2xl font-bold text-white">
// After:
<h2 className="text-2xl font-bold text-theme-text">

// Line 47
// Before: <p className="text-gray-400">
// After:
<p className="text-theme-text-muted">
```

---

## Testing Checklist

After implementation:
- [ ] ROICalculator displays correctly in Tech Dark theme
- [ ] ROICalculator displays correctly in Consultant (light) theme  
- [ ] ROICalculator displays correctly in Consultant Dark theme
- [ ] LandmarkInfoCard modal has proper contrast in all themes
- [ ] Table text is readable on all theme backgrounds
- [ ] Accent colors (lime, cyan) are consistent with theme
- [ ] No yellow/broken color artifacts appear

