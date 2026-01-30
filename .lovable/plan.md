
# Plan: Complete Language Support for Off-Plan vs Secondary Tool

## Problem Identified

When you toggle the language (🇬🇧/🇪🇸), not all components update. Several components have **hardcoded Spanish text** without using the `language` prop.

## Components Missing Language Support

| Component | Issue | Status |
|-----------|-------|--------|
| `HeadToHeadTable.tsx` | All labels hardcoded in Spanish, **no language prop** | ❌ Missing |
| `WealthTrajectoryDualChart.tsx` | Chart labels hardcoded in Spanish, **no language prop** | ❌ Missing |
| `MortgageCoverageMatrix.tsx` | All labels hardcoded in Spanish, **no language prop** | ❌ Missing |
| `ComparisonConfiguratorModal.tsx` | Step labels, buttons hardcoded in Spanish, **no language prop** | ❌ Missing |
| `QuoteSelectionStep.tsx` | Labels hardcoded in Spanish, **no language prop** | ❌ Missing |
| `SecondaryPropertyStep.tsx` | Form labels hardcoded in Spanish, **no language prop** | ❌ Missing |
| `ExitScenariosStep.tsx` | Labels hardcoded in Spanish, **no language prop** | ❌ Missing |
| `DSCRExplanationCard.tsx` | Has language prop ✓ | ✅ Done |
| `ComparisonVerdict.tsx` | Has language prop ✓ | ✅ Done |
| `OutOfPocketCard.tsx` | Has language prop ✓ | ✅ Done |
| `ExitScenariosComparison.tsx` | Has language prop ✓ | ✅ Done |
| `YearByYearWealthTable.tsx` | Has language prop ✓ | ✅ Done |
| `ComparisonKeyInsights.tsx` | Has language prop ✓ | ✅ Done |

---

## Files to Modify

### 1. `src/components/roi/secondary/HeadToHeadTable.tsx`
- Add `language: 'en' | 'es'` prop
- Add translation object for all labels:
  - "Comparación Detallada" → "Detailed Comparison"
  - "Secundaria" → "Secondary"
  - "Ganador" → "Winner"
  - "Métrica" → "Metric"
  - Category names (CAPITAL, CASHFLOW, HIPOTECA, RIQUEZA, RETORNO, AIRBNB, ESTRATEGIA)
  - Row labels: "Capital Día 1", "Meses Sin Ingreso", "Riqueza Año 5/10", "ROE Anualizado", etc.

### 2. `src/components/roi/secondary/WealthTrajectoryDualChart.tsx`
- Add `language: 'en' | 'es'` prop
- Add translation object for:
  - "Trayectoria de Riqueza (10 Años)" → "Wealth Trajectory (10 Years)"
  - "Off-plan supera a secundaria en" → "Off-plan surpasses secondary in"
  - Legend labels: "Off-Plan: Mayor apreciación..." → "Off-Plan: Higher appreciation..."
  - Tooltip: "Año" → "Year"

### 3. `src/components/roi/secondary/MortgageCoverageMatrix.tsx`
- Add `language: 'en' | 'es'` prop
- Add translation object for:
  - "Análisis de Cobertura de Hipoteca" → "Mortgage Coverage Analysis"
  - "Ingreso:", "Hipoteca:", "Surplus:", "Gap:"
  - Status labels and legend text

### 4. `src/components/roi/secondary/ComparisonConfiguratorModal.tsx`
- Add `language: 'en' | 'es'` prop
- Add translation object for:
  - Step labels: "Seleccionar Quote" → "Select Quote"
  - "Configurar Secundaria" → "Configure Secondary"
  - "Puntos de Salida" → "Exit Points"
  - Buttons: "Cancelar", "Atrás", "Siguiente", "Comparar Ahora"
- Pass `language` to child steps

### 5. `src/components/roi/secondary/QuoteSelectionStep.tsx`
- Add `language: 'en' | 'es'` prop
- Add translations for search placeholder and empty state text

### 6. `src/components/roi/secondary/SecondaryPropertyStep.tsx`
- Add `language: 'en' | 'es'` prop
- Add translations for all form labels:
  - "Precio de Compra" → "Purchase Price"
  - "Área del Inmueble" → "Unit Size"
  - "Service Charges" / yield / rent fields

### 7. `src/components/roi/secondary/ExitScenariosStep.tsx`
- Add `language: 'en' | 'es'` prop
- Add translations for:
  - "Puntos de Salida" → "Exit Points"
  - "Agregar Rápido" → "Quick Add"
  - "Año X" → "Year X"

### 8. `src/pages/OffPlanVsSecondary.tsx`
- Pass `language` prop to ALL components that now accept it:
  - `HeadToHeadTable`
  - `WealthTrajectoryDualChart`
  - `ComparisonConfiguratorModal`

---

## Translation Pattern

Each component will follow this pattern:

```typescript
interface ComponentProps {
  // ... existing props
  language: 'en' | 'es';
}

export const Component = ({ language, ...props }) => {
  const t = language === 'es' ? {
    // Spanish translations
    title: 'Título en Español',
    ...
  } : {
    // English translations
    title: 'Title in English',
    ...
  };
  
  // Use t.title, t.label, etc. throughout
};
```

---

## Implementation Order

1. **Update HeadToHeadTable.tsx** - Add language prop + translations
2. **Update WealthTrajectoryDualChart.tsx** - Add language prop + translations  
3. **Update MortgageCoverageMatrix.tsx** - Add language prop + translations
4. **Update ComparisonConfiguratorModal.tsx** - Add language prop + pass to children
5. **Update QuoteSelectionStep.tsx** - Add language prop + translations
6. **Update SecondaryPropertyStep.tsx** - Add language prop + translations
7. **Update ExitScenariosStep.tsx** - Add language prop + translations
8. **Update OffPlanVsSecondary.tsx** - Pass language to all updated components

---

## Key Translations Needed

### Categories (HeadToHeadTable)
| Spanish | English |
|---------|---------|
| CAPITAL | CAPITAL |
| CASHFLOW | CASHFLOW |
| HIPOTECA | MORTGAGE |
| RIQUEZA | WEALTH |
| RETORNO | RETURN |
| ESTRATEGIA | STRATEGY |

### Common Labels
| Spanish | English |
|---------|---------|
| Capital Día 1 | Day 1 Capital |
| Meses Sin Ingreso | Months Without Income |
| Riqueza Año 5/10 | Year 5/10 Wealth |
| ROE Anualizado | Annualized ROE |
| Punto de Cruce | Crossover Point |
| Precio de Compra | Purchase Price |
| Área del Inmueble | Unit Size |
| Service Charges | Service Charges |
| Yield de Renta | Rental Yield |
| Renta Bruta | Gross Rent |
| Renta Neta | Net Rent |
| Puntos de Salida | Exit Points |
| Agregar Rápido | Quick Add |
| Comparar Ahora | Compare Now |
| Siguiente | Next |
| Atrás | Back |
| Cancelar | Cancel |

---

## After Implementation

When the user clicks the language toggle (🇬🇧/🇪🇸), **ALL** text in the tool will update:
- Header badges and buttons
- HeadToHeadTable rows and categories
- WealthTrajectoryDualChart labels and legend
- Configurator modal steps and buttons
- Form labels in configurator steps
- All cards and insights
