# Plan: Complete Language Support for Off-Plan vs Secondary Tool

## Status: ✅ COMPLETED

All components now support the `language` prop and update when the user toggles 🇬🇧/🇪🇸.

## Components Updated

| Component | Status |
|-----------|--------|
| `HeadToHeadTable.tsx` | ✅ Done |
| `WealthTrajectoryDualChart.tsx` | ✅ Done |
| `MortgageCoverageMatrix.tsx` | ✅ Done |
| `ComparisonConfiguratorModal.tsx` | ✅ Done |
| `QuoteSelectionStep.tsx` | ✅ Done |
| `SecondaryPropertyStep.tsx` | ✅ Done |
| `ExitScenariosStep.tsx` | ✅ Done |
| `DSCRExplanationCard.tsx` | ✅ Done |
| `ComparisonVerdict.tsx` | ✅ Done |
| `OutOfPocketCard.tsx` | ✅ Done |
| `ExitScenariosComparison.tsx` | ✅ Done |
| `YearByYearWealthTable.tsx` | ✅ Done |
| `ComparisonKeyInsights.tsx` | ✅ Done |
| `OffPlanVsSecondary.tsx` | ✅ Done - Passes language to all components |

---

## Implementation Pattern Used

Each component follows this pattern:

```typescript
interface ComponentProps {
  // ... existing props
  language?: 'en' | 'es';
}

export const Component = ({ language = 'es', ...props }) => {
  const t = language === 'es' ? {
    // Spanish translations
  } : {
    // English translations
  };
  
  // Use t.key throughout
};
```

---

## Result

When the user clicks the language toggle (🇬🇧/🇪🇸), **ALL** text in the tool updates:
- ✅ Header badges and buttons
- ✅ HeadToHeadTable rows and categories  
- ✅ WealthTrajectoryDualChart labels and legend
- ✅ MortgageCoverageMatrix labels
- ✅ Configurator modal steps and buttons
- ✅ Form labels in configurator steps (QuoteSelectionStep, SecondaryPropertyStep, ExitScenariosStep)
- ✅ All cards and insights
- ✅ DSCR explanation
- ✅ Comparison verdict
