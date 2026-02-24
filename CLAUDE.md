# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Dubai Invest Pro** — AI-powered real estate investment platform for Dubai property analysis. Tools for brokers: cashflow/ROI calculators, quote generators, comparison tools, client portals, and presentation builders.

## Commands

```bash
npm install          # Install dependencies (no node_modules yet — run this first)
npm run dev          # Start dev server on http://localhost:8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint
npm run preview      # Preview production build
```

## Stack

- **Framework**: React 18 + TypeScript + Vite (SWC)
- **Styling**: Tailwind CSS 3 + shadcn/ui (default style, slate base, CSS variables)
- **State/Data**: TanStack React Query + Supabase JS client
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form + Zod validation
- **UI extras**: Framer Motion, Recharts, Lucide icons, cmdk, Sonner toasts
- **PDF**: jsPDF + pdf-lib + html2canvas
- **Backend**: Supabase (Auth, Postgres, Edge Functions in Deno)
- **i18n**: Custom LanguageContext (en/es)
- **Theming**: Custom ThemeContext with multiple themes (tech-dark, consultant, consultant-dark)

## Architecture

```
src/
  pages/              # Route-level components (one per route in App.tsx)
  components/
    ui/               # shadcn/ui primitives (50+ components) — do not edit manually
    auth/             # Login, Signup, ProtectedRoute, password reset
    dashboard/        # Admin: manage zones, appreciation presets
    roi/              # ROI/cashflow calculator, comparisons, client views
    presentation/     # Presentation builder and viewer
    portfolio/        # Client property portfolio tracking
    clients/          # Client CRM (cards, forms, selector)
    portal/           # Client-facing portal sections
    analytics/        # Quote/presentation view analytics
    layout/           # TopNavbar, PageHeader
    settings/         # Account settings components
  contexts/           # LanguageContext (en/es), ThemeContext (multi-theme)
  hooks/              # 35+ custom hooks — all data fetching goes through hooks using Supabase
  integrations/supabase/
    client.ts         # Supabase client init (auto-generated)
    types.ts          # Database types (auto-generated from Supabase schema)
  config/themes.ts    # Theme definitions and color tokens
  lib/                # Utilities: PDF generation, image utils, validation schemas
  data/               # Static data: countries, developers
  docs/DESIGN_SYSTEM.md  # Color/contrast guidelines
```

### Key Patterns

- **Path alias**: `@/` maps to `src/` (configured in vite.config.ts and tsconfig)
- **Supabase client**: Always import from `@/integrations/supabase/client`
- **Database types**: Auto-generated in `@/integrations/supabase/types.ts` — do not edit manually
- **Auth**: `useAuth()` hook wraps Supabase Auth; `ProtectedRoute` guards authenticated pages
- **Admin roles**: `useAdminRole()` checks via Supabase RPC `has_role`
- **Data fetching**: All via custom hooks in `src/hooks/` using Supabase client directly (no REST API layer)
- **Shared views**: Public routes like `/view/:shareToken`, `/present/:shareToken`, `/portal/:portalToken` — no auth required
- **Dual-View UI**: The Cashflow Generator (`OICalculatorContent.tsx`) acts as an orchestrator that toggles between `SnapshotContent` (Classic Tabbed View) and `InvestmentStoryDashboard` (Story View). **NEVER** attempt to aggressively merge or delete either component assuming one replaces the other.

### Database Tables (Supabase)

`acquired_properties`, `appreciation_presets`, `cashflow_images`, `cashflow_quotes`, `clients`, `contact_submissions`, `custom_differentiators`, `developers`, `exit_presets`, `favorites`, `presentation_views`, `presentations`, `profiles`, `projects`, `quote_versions`, `quote_views`, `saved_comparisons`, `secondary_comparisons`, `secondary_properties`, `user_roles`, `zones`

### Edge Functions (supabase/functions/)

`cleanup-empty-drafts`, `extract-payment-plan`, `extract-payment-plan-text`, `extract-payment-plan-voice`, `generate-comparison-pdf`, `generate-pdf`, `generate-snapshot-screenshot`, `process-pdf`, `send-quote-email`, `send-status-notification`, `send-welcome-email`, `track-presentation-view`, `track-quote-view`, `update-presentation-view-duration`, `update-quote-view-duration`

## Design System Rules

- **Use semantic theme classes** (`text-theme-text`, `text-theme-text-muted`, `text-theme-text-highlight`, `bg-theme-card`, `border-theme-border`) — never raw Tailwind grays
- Color tokens defined as CSS variables that adapt per theme; see `src/docs/DESIGN_SYSTEM.md`
- WCAG AA contrast minimum: 4.5:1 for normal text, 3:1 for large text
- Font: Inter (sans-serif)
- shadcn/ui components live in `src/components/ui/` — add new ones via shadcn CLI, don't create from scratch

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

Edge functions use server-side secrets (GEMINI_API_KEY, ELEVENLABS_API_KEY, RESEND_API_KEY, BROWSERLESS_TOKEN, etc.) configured in Supabase dashboard.

## Origin

Codebase was generated with [Lovable](https://lovable.dev). The `lovable-tagger` dev plugin tags components in development mode. The `.lovable/plan.md` file contains feature planning docs.
