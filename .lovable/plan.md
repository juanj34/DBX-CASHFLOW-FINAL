
# Plan: Off-Plan vs Secondary Comparison Tool Redesign

## Overview

Redesign the comparison tool to follow the same pattern as the Cashflow Generator:
1. **Modal-first configurator** using Dialog component
2. **Two-step wizard**: Select off-plan quote, then configure/select secondary property
3. **Results view** after configuration is complete

---

## User Flow

```text
/offplan-vs-secondary
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  INITIAL STATE (No comparison configured)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│     [Icon: TrendingUp]                                          │
│                                                                  │
│     "Off-Plan vs Secondary Comparison"                          │
│                                                                  │
│     Compare your off-plan investment against a                  │
│     ready secondary property to see which                       │
│     strategy builds more wealth over 10 years.                  │
│                                                                  │
│              [Start Comparison]  ← Opens modal                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

         │ Click "Start Comparison"
         ▼

┌─────────────────────────────────────────────────────────────────┐
│  CONFIGURATOR MODAL (Similar to OIInputModal)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: SELECT OFF-PLAN QUOTE                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Search quotes...                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ Marina Shores - Unit 1204                              │     │
│  │ Emaar • AED 1,450,000 • Handover: Q4 2026              │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                  │
│  [← Back]                                          [Next →]     │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 2: CONFIGURE SECONDARY PROPERTY                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [+ Create New] [Load Saved ▼]                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Property Details:                                               │
│  - Purchase Price, Size, Closing Costs                          │
│  - Rental Yield, Appreciation Rate                              │
│  - Mortgage options (optional)                                  │
│  - Airbnb comparison (optional)                                 │
│                                                                  │
│  [Save Property for Later]                                      │
│                                                                  │
│  [← Back]                                     [Compare Now →]   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

         │ Click "Compare Now"
         ▼

┌─────────────────────────────────────────────────────────────────┐
│  RESULTS VIEW (Full page comparison)                            │
│  [Reconfigure] button in header to reopen modal                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Changes

### New Table: `secondary_properties`

Stores reusable secondary property configurations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| broker_id | uuid | Owner (FK to auth.users) |
| name | text | Property name/label |
| purchase_price | numeric | AED price |
| unit_size_sqf | numeric | Size in sqft |
| closing_costs_percent | numeric | Default 6% |
| rental_yield_percent | numeric | Default 7% |
| rent_growth_rate | numeric | Default 3% |
| appreciation_rate | numeric | Default 3% |
| service_charge_per_sqft | numeric | Default 22 |
| use_mortgage | boolean | Default true |
| mortgage_financing_percent | numeric | Default 60% |
| mortgage_interest_rate | numeric | Default 4.5% |
| mortgage_term_years | integer | Default 25 |
| show_airbnb | boolean | Default false |
| airbnb_adr | numeric | Average daily rate |
| airbnb_occupancy | numeric | Occupancy % |
| airbnb_operating_expense | numeric | Operating expense % |
| airbnb_management_fee | numeric | Management fee % |
| created_at | timestamptz | Timestamp |
| updated_at | timestamptz | Timestamp |

**RLS Policy**: Users can only manage their own properties.

---

## New Components

### 1. `ComparisonConfiguratorModal.tsx`
The main modal component (like OIInputModal) containing:
- Step indicator (1/2)
- Step 1: Quote selector with search
- Step 2: Secondary property form with save/load functionality
- Navigation buttons (Back, Next, Compare Now)

### 2. `QuoteSelectionStep.tsx`
- Searchable list of off-plan quotes
- Shows: Project, Developer, Price, Handover, Client
- Click to select

### 3. `SecondaryPropertyStep.tsx`
- Form for secondary property inputs
- "Save for Later" button to persist to database
- "Load Saved" dropdown to select existing properties
- All fields from SecondaryInputs type

### 4. `ComparisonKeyInsights.tsx`
4 key insight cards at top of results:
- **Capital Inicial**: Day 1 investment for each
- **Riqueza Año 10**: Total wealth at year 10
- **ROE Anualizado**: Annualized ROE over 10 years
- **Punto de Cruce**: Year when off-plan surpasses secondary

### 5. `YearByYearWealthTable.tsx`
Critical table showing wealth progression:

| Year | Off-Plan Wealth | Secondary Wealth | Delta |
|------|-----------------|------------------|-------|
| 1    | 150K            | 130K             | +20K  |
| 2    | 320K            | 260K             | +60K  |
| ...  | ...             | ...              | ...   |
| 10   | 1.8M            | 1.1M             | +700K |

### 6. `DSCRExplanationCard.tsx`
Explains DSCR in simple terms:
- What it measures
- Color-coded thresholds (green/yellow/red)
- Why it matters

### 7. `OutOfPocketCard.tsx`
Simplified replacement for OutOfPocketTimeline:
- Total capital during construction
- Months without rental income
- Appreciation gained while waiting

---

## Files to Create

| File | Description |
|------|-------------|
| `src/components/roi/secondary/ComparisonConfiguratorModal.tsx` | Main modal component |
| `src/components/roi/secondary/QuoteSelectionStep.tsx` | Step 1: Quote picker |
| `src/components/roi/secondary/SecondaryPropertyStep.tsx` | Step 2: Secondary config |
| `src/components/roi/secondary/ComparisonKeyInsights.tsx` | 4 insight cards |
| `src/components/roi/secondary/YearByYearWealthTable.tsx` | Wealth progression table |
| `src/components/roi/secondary/DSCRExplanationCard.tsx` | DSCR explanation |
| `src/components/roi/secondary/OutOfPocketCard.tsx` | Simplified OOP display |
| `src/hooks/useSecondaryProperties.ts` | CRUD for saved properties |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/OffPlanVsSecondary.tsx` | Complete rewrite with modal-first flow |
| `src/components/roi/secondary/WealthTrajectoryDualChart.tsx` | Fix overflow, improve formatting |
| `src/components/roi/secondary/index.ts` | Export new components |

---

## Rental Mode Toggle

Add a prominent toggle between:
- **Renta Larga** (Long-term rental) - default
- **Airbnb** (Short-term rental)

This toggle affects:
- Wealth Year 10 calculations
- ROE calculations  
- Year-by-year table values
- DSCR coverage display

---

## Key Metrics Explanations

### DSCR (Debt Service Coverage Ratio)
"Mide si la renta cubre la hipoteca. DSCR de 120% = la renta es 20% mayor que el pago mensual."

### Riqueza Total
"Valor de propiedad + Rentas acumuladas - Capital invertido = Lo que realmente tienes."

### Punto de Cruce
"El año cuando off-plan supera a secundaria en riqueza total."

### ROE Anualizado
"Retorno anualizado sobre tu capital invertido durante 10 años."

---

## UI Improvements

1. **No number overflow**: All charts and tables use proper formatting (K for thousands, M for millions)
2. **Theme-aware colors**: All components use theme tokens
3. **Clear hierarchy**: 4 key cards → Detailed table → Charts → Explanations → Verdict
4. **Better spacing**: Proper gaps between sections
5. **Tooltips**: Every metric has an explanation tooltip

---

## Implementation Order

1. Create database migration for `secondary_properties` table
2. Create `useSecondaryProperties` hook for CRUD operations
3. Build `ComparisonConfiguratorModal` with two steps
4. Build `QuoteSelectionStep` component
5. Build `SecondaryPropertyStep` component with save/load
6. Rewrite `OffPlanVsSecondary.tsx` with modal-first approach
7. Create `ComparisonKeyInsights` (4 cards)
8. Create `YearByYearWealthTable`
9. Create `DSCRExplanationCard` and `OutOfPocketCard`
10. Fix `WealthTrajectoryDualChart` overflow issues
11. Update exports and test flow
