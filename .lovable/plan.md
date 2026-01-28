
# Plan: Corregir Exportación PDF - Sincronizar con Vista Original del Snapshot

## Problema Principal

El snapshot exportado (PNG/PDF) se ve muy diferente al snapshot original porque:

1. **ExportExitCards.tsx** busca escenarios en `calculations.scenarios` pero no los encuentra (devuelve valores 0)
   - El snapshot original usa `calculateExitScenario()` dinámicamente
   - El export NO calcula dinámicamente, solo busca en un arreglo pre-calculado

2. **ExportPostHandoverCard.tsx** tiene lógica incompleta:
   - Solo verifica `inputs.postHandoverPayments?.length`
   - El original también deriva pagos de `additionalPayments` si `postHandoverPayments` está vacío
   - La lógica de duración usa campos que pueden no existir (`postHandoverEndQuarter`, `postHandoverEndYear`)

3. **Falta de información visual**:
   - El export usa un header simple (`ExportHeader`) en lugar del `PropertyHeroCard` completo
   - El `WealthProjectionTimeline` ya existe pero podría verse diferente

---

## Archivos a Modificar

### 1. `src/components/roi/export/ExportExitCards.tsx`

**Problema:** Usa `calculations.scenarios.find()` que retorna undefined y muestra 0 en todo.

**Solución:** Calcular los escenarios dinámicamente como hace `CompactAllExitsCard`:

```tsx
// Importar calculateExitScenario
import { monthToConstruction, calculateExitScenario } from '../constructionProgress';

// En el componente, cambiar de:
const preCalcScenario = calculations.scenarios.find(s => s.exitMonths === exitMonths);

// A:
const scenarioResult = calculateExitScenario(
  exitMonths,
  inputs.basePrice || calculations.basePrice,
  calculations.totalMonths,
  inputs,
  calculations.totalEntryCosts
);

return {
  exitMonths,
  exitPrice: scenarioResult.exitPrice,
  totalCapitalDeployed: scenarioResult.totalCapital,
  trueProfit: scenarioResult.trueProfit,
  trueROE: scenarioResult.trueROE,
  annualizedROE: scenarioResult.annualizedROE,
  // ... resto igual
};
```

### 2. `src/components/roi/export/ExportPostHandoverCard.tsx`

**Problema:** La lógica no deriva pagos de `additionalPayments` cuando `postHandoverPayments` está vacío.

**Solución:** Sincronizar con la lógica de `CompactPostHandoverCard`:

```tsx
// Añadir helper para detectar pagos post-handover
const isPaymentAfterHandoverQuarter = (
  monthsFromBooking: number,
  bookingMonth: number,
  bookingYear: number,
  handoverQuarter: number,
  handoverYear: number
): boolean => {
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);
  
  const handoverQuarterEndMonth = handoverQuarter * 3;
  const handoverQuarterEnd = new Date(handoverYear, handoverQuarterEndMonth - 1, 28);
  
  return paymentDate > handoverQuarterEnd;
};

// Derivar pagos post-handover
let postHandoverPaymentsToUse = inputs.postHandoverPayments || [];
if (postHandoverPaymentsToUse.length === 0 && inputs.additionalPayments?.length > 0) {
  postHandoverPaymentsToUse = inputs.additionalPayments.filter(p => {
    if (p.type !== 'time') return false;
    return isPaymentAfterHandoverQuarter(
      p.triggerValue, inputs.bookingMonth, inputs.bookingYear,
      inputs.handoverQuarter, inputs.handoverYear
    );
  });
}

// Calcular duración desde los pagos reales, no desde campos opcionales
const paymentMonths = postHandoverPaymentsToUse.map(p => p.triggerValue);
const actualDurationMonths = Math.max(...paymentMonths) - Math.min(...paymentMonths) + 1;
```

### 3. `src/components/roi/export/ExportPaymentTable.tsx`

**Problema:** No separa pre-handover de post-handover correctamente, sin resaltar handover.

**Solución:** Sincronizar con la lógica de `CompactPaymentTable`:

- Añadir lógica para detectar pagos en el trimestre de handover
- Separar pre-handover de post-handover usando `isPaymentAfterHandoverQuarter`
- Añadir sección visual "Post-Handover" cuando aplique

---

## Resumen de Cambios Técnicos

| Archivo | Cambio Principal |
|---------|------------------|
| `ExportExitCards.tsx` | Calcular escenarios con `calculateExitScenario()` en lugar de buscar en array |
| `ExportPostHandoverCard.tsx` | Derivar pagos de `additionalPayments`, calcular duración desde pagos reales |
| `ExportPaymentTable.tsx` | Separar pre/post-handover, mostrar handover highlights |

---

## Lógica de Visibilidad (ya funciona correctamente)

El `ExportSnapshotDOM.tsx` ya tiene las condiciones correctas:
- ✅ `inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0` para exits
- ✅ `inputs.hasPostHandoverPlan` para post-handover
- ✅ `mortgageInputs.enabled` para mortgage

El problema es que los componentes hijos no calculan bien los datos.

---

## Resultado Esperado

| Antes | Después |
|-------|---------|
| Exit cards muestran 0 en todo | Exit cards muestran valores calculados correctamente |
| Post-handover card no aparece | Post-handover card aparece cuando hay plan post-entrega |
| Moneda siempre en AED | Moneda respeta la configuración con formato dual |
| Idioma ignorado en algunos labels | Todos los labels traducidos según idioma seleccionado |
| El export se ve diferente al snapshot | El export se ve idéntico al snapshot original |
