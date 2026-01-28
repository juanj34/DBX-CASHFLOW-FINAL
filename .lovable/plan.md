
# Plan: Conectar ExportModal con el Export DOM

## Estado Actual
El sistema de Export DOM (componentes estáticos + hook de render offscreen) **ya está implementado**. Sin embargo, el `ExportModal` en `OICalculator.tsx` no está recibiendo los datos necesarios para usar este nuevo sistema.

Actualmente el modal recibe:
- `quoteId`, `projectName`, `mainContentRef`, `onViewChange` (props legacy)

Pero necesita recibir:
- `inputs`, `calculations`, `clientInfo`, `mortgageInputs`, `mortgageAnalysis`, `exitScenarios`, `currency`, `rate`, `language`

---

## Cambio Requerido

### Archivo: `src/pages/OICalculator.tsx`

Actualizar el `<ExportModal>` para pasar todos los datos necesarios:

**Líneas 674-683 - Cambiar de:**
```tsx
<ExportModal
  open={exportModalOpen}
  onOpenChange={setExportModalOpen}
  quoteId={quote?.id}
  projectName={clientInfo.projectName}
  activeView={viewMode}
  mainContentRef={mainContentRef}
  onViewChange={setViewMode}
/>
```

**A:**
```tsx
<ExportModal
  open={exportModalOpen}
  onOpenChange={setExportModalOpen}
  projectName={clientInfo.projectName}
  activeView={viewMode}
  // New Export DOM props
  inputs={inputs}
  calculations={calculations}
  clientInfo={clientInfo}
  mortgageInputs={mortgageInputs}
  mortgageAnalysis={mortgageAnalysis}
  exitScenarios={exitYears}
  currency={currency}
  rate={rate}
  language={language as 'en' | 'es'}
/>
```

---

## Variables a Verificar en OICalculator

Necesitamos confirmar que estas variables existen en el scope del componente:
- `inputs` - ✓ State de OIInputs
- `calculations` - ✓ Resultado de useOICalculations
- `clientInfo` - ✓ State de ClientUnitData
- `mortgageInputs` - ✓ State de MortgageInputs
- `mortgageAnalysis` - ✓ Resultado de useMortgageCalculations
- `exitYears` - ✓ Array de años de exit (o derivarlo de `inputs.exitScenarioYears`)
- `currency` - ✓ State
- `rate` - ✓ De useExchangeRate
- `language` - ✓ De useLanguage

---

## Resultado Esperado

Una vez conectados los props, al hacer clic en "Export":
1. El modal detecta `hasExportData = true`
2. Llama a `exportSnapshot()` con todos los datos
3. El hook `useExportRenderer` monta `ExportSnapshotDOM` offscreen
4. Espera fonts + layout
5. Captura con html2canvas
6. Genera PNG o PDF
7. Descarga el archivo

---

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/OICalculator.tsx` | Pasar props de datos al ExportModal |

---

## Consideración: Variables de Exit

Necesito verificar cómo se definen los `exitScenarios` en OICalculator para pasarlos correctamente. Probablemente es un array derivado de `inputs.exitScenarioYears` o similar.
