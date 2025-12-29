# Design System Guidelines

This document provides guidelines for maintaining consistent, accessible text colors across all themes in the application.

## Core Principle: Use Semantic Classes, Not Raw Colors

**NEVER** use raw Tailwind gray classes directly. Instead, use the semantic theme classes that adapt automatically to the current theme.

## Semantic Text Classes Reference

| Class | Purpose | Usage |
|-------|---------|-------|
| `text-theme-text` | Primary content | Headings, important labels, key values |
| `text-theme-text-muted` | Secondary content | Descriptions, hints, less important info |
| `text-theme-text-highlight` | Accent/emphasis | Key metrics, CTAs, highlighted values |
| `text-primary-content` | Alias for primary text | Same as `text-theme-text` |
| `text-secondary-content` | Alias for secondary text | Same as `text-theme-text-muted` |
| `text-tertiary-content` | Subtle/tertiary text | Footnotes, timestamps, minor details |
| `text-highlight-content` | Alias for highlight | Same as `text-theme-text-highlight` |

## Background/Text Pairing Quick Reference

### Dark Backgrounds (theme-bg, theme-card, #0f172a, #1a1f2e)

| Text Type | ✅ Safe Classes | ❌ Forbidden Classes |
|-----------|-----------------|---------------------|
| Primary | `text-theme-text`, `text-white` | `text-gray-700`, `text-gray-800` |
| Secondary | `text-theme-text-muted`, `text-gray-400`, `text-gray-300` | `text-gray-500`, `text-gray-600` |
| Tertiary | `text-gray-400` (minimum) | `text-gray-500` or darker |

### Light Backgrounds (theme-consultant, white, gray-50)

| Text Type | ✅ Safe Classes | ❌ Forbidden Classes |
|-----------|-----------------|---------------------|
| Primary | `text-theme-text`, `text-gray-900` | `text-gray-400`, `text-gray-300` |
| Secondary | `text-theme-text-muted`, `text-gray-600`, `text-gray-500` | `text-gray-400` or lighter |
| Tertiary | `text-gray-500` (minimum) | `text-gray-400` or lighter |

## ❌ Forbidden Patterns (Will Cause Contrast Issues)

```tsx
// ❌ NEVER DO THIS on dark backgrounds
<span className="text-gray-500">Secondary text</span>
<span className="text-gray-600">Muted text</span>
<span className="text-gray-700">Dark text</span>

// ❌ NEVER DO THIS on light backgrounds
<span className="text-gray-400">Light text</span>
<span className="text-gray-300">Lighter text</span>
```

## ✅ Correct Patterns

```tsx
// ✅ ALWAYS use semantic classes
<span className="text-theme-text">Primary text</span>
<span className="text-theme-text-muted">Secondary text</span>
<span className="text-theme-text-highlight">Highlighted text</span>

// ✅ Or use the utility aliases
<span className="text-primary-content">Primary text</span>
<span className="text-secondary-content">Secondary text</span>
<span className="text-tertiary-content">Tertiary text</span>
```

## Why Raw Gray Classes Fail

1. **Tailwind's gray scale is fixed**: `text-gray-500` is always the same luminosity regardless of background
2. **Themes need adaptation**: Dark themes need lighter text, light themes need darker text
3. **WCAG contrast requirements**: Normal text needs 4.5:1 contrast ratio minimum
4. **Semantic classes auto-adapt**: They reference CSS variables that change per theme

## WCAG Contrast Requirements

| Text Size | Minimum Ratio (AA) | Enhanced Ratio (AAA) |
|-----------|-------------------|---------------------|
| Normal (<18px) | 4.5:1 | 7:1 |
| Large (≥18px bold, ≥24px) | 3:1 | 4.5:1 |

## Gray Scale Reference (for understanding, NOT for direct use)

On dark backgrounds (#1a1f2e ≈ 10% luminance):
- `gray-300` (≈70% luminance) = ~12:1 contrast ✅ Excellent
- `gray-400` (≈55% luminance) = ~7:1 contrast ✅ Good
- `gray-500` (≈40% luminance) = ~4:1 contrast ⚠️ Borderline
- `gray-600` (≈30% luminance) = ~2.5:1 contrast ❌ Fails
- `gray-700` (≈20% luminance) = ~1.5:1 contrast ❌ Fails badly

## Checking Contrast in Development

The app includes a development-only contrast checker hook. When enabled, it scans for problematic color combinations and logs warnings to the console.

To use it, import and call in any component:

```tsx
import { useContrastChecker } from '@/hooks/useContrastChecker';

// In your component
useContrastChecker();
```

This will log warnings for elements using known problematic classes on dark backgrounds.
