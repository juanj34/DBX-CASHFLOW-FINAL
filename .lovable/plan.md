
# Plan: Corregir la Exportación para Respetar Moneda y Lenguaje

## Problema Identificado

La exportación (PNG/PDF) no muestra la moneda ni el idioma configurados porque:

1. **`ExportExitCards.tsx`** tiene valores hardcodeados:
   - Línea 135: `formatCurrency(scenario.totalCapitalDeployed, 'AED', 1)` ❌
   - Línea 144: `formatCurrency(scenario.trueProfit, 'AED', 1)` ❌

2. **`ExportWealthTimeline.tsx`** tiene valores hardcodeados:
   - Línea 139: `formatCurrencyShort(proj.value, 'AED', 1)` ❌

3. Los componentes de exportación tienen sus propias traducciones inline (`t = { ... }`) que ya funcionan correctamente con el prop `language`

---

## Archivos a Modificar

### 1. `src/components/roi/export/ExportExitCards.tsx`

**Cambiar hardcoded AED a usar currency/rate props:**

```tsx
// Línea 135: Cambiar de
💰 {formatCurrency(scenario.totalCapitalDeployed, 'AED', 1)}
// A
💰 {formatCurrency(scenario.totalCapitalDeployed, currency, rate)}

// Línea 144: Cambiar de  
{formatCurrency(scenario.trueProfit, 'AED', 1)}
// A
{formatCurrency(scenario.trueProfit, currency, rate)}
```

**Añadir formato dual para mostrar AED + moneda convertida:**
```tsx
// Añadir helper
const getDualValue = (value: number) => {
  const dual = formatDualCurrency(value, currency, rate);
  return { primary: dual.primary, secondary: dual.secondary };
};

// Usar en capital y profit
<span>💰 {getDualValue(scenario.totalCapitalDeployed).primary}</span>
<span>{scenario.trueProfit >= 0 ? '+' : ''}{getDualValue(scenario.trueProfit).primary}</span>
```

### 2. `src/components/roi/export/ExportWealthTimeline.tsx`

**Cambiar el valor primario de hardcoded AED a formato dual:**

```tsx
// Línea 139: Cambiar de
{formatCurrencyShort(proj.value, 'AED', 1)}

// A - mostrar AED primario siempre para consistencia, con conversión secundaria
const aedValue = formatCurrencyShort(proj.value, 'AED', 1);
const convertedValue = currency !== 'AED' ? formatCurrencyShort(proj.value, currency, rate) : null;

// En el render
<div>{aedValue}</div>
{convertedValue && <div>{convertedValue}</div>}
```

---

## Cambios Detallados

### ExportExitCards.tsx

| Línea | Antes | Después |
|-------|-------|---------|
| 2 | `import { Currency, formatCurrency }` | `import { Currency, formatDualCurrency }` |
| 135 | `formatCurrency(scenario.totalCapitalDeployed, 'AED', 1)` | `getDualValue(scenario.totalCapitalDeployed).primary` |
| 144 | `formatCurrency(scenario.trueProfit, 'AED', 1)` | `getDualValue(scenario.trueProfit).primary` |

Añadir helper function:
```tsx
const getDualValue = (value: number) => {
  const dual = formatDualCurrency(value, currency, rate);
  return { primary: dual.primary, secondary: dual.secondary };
};
```

### ExportWealthTimeline.tsx

| Línea | Antes | Después |
|-------|-------|---------|
| 139 | `formatCurrencyShort(proj.value, 'AED', 1)` | Usar el formato AED principal con conversión opcional (ya está en líneas 141-145) |

La lógica ya existe en líneas 141-145 para mostrar conversión. Solo necesitamos verificar que el valor primario siempre muestre AED pero permitir que `formatCurrencyShort` use el currency correcto cuando se necesite.

---

## Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| `src/components/roi/export/ExportExitCards.tsx` | Cambiar formatCurrency hardcoded a usar currency/rate props con formato dual |
| `src/components/roi/export/ExportWealthTimeline.tsx` | Verificar que el formato dual funcione correctamente (el código ya existe parcialmente) |

---

## Resultado Esperado

Después de estos cambios:

| Antes | Después |
|-------|---------|
| Exportación siempre muestra AED | Exportación muestra la moneda seleccionada (USD, EUR, etc.) |
| Idioma no afecta la exportación | Idioma se aplica a todos los labels en la exportación |
| Exit cards solo muestran AED | Exit cards muestran formato dual (AED + conversión) |
| Timeline solo muestra AED | Timeline muestra formato dual (AED + conversión) |
