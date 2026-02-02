
# Plan: Mejoras de Claridad en Payment Breakdown, Rental Income y Exit Scenarios

## Resumen de Problemas Identificados

Basándome en tus imágenes y feedback:

1. **Payment Breakdown - Falta de porcentajes claros**
   - La entrada debería mostrar "20% + 4% DLD = 24%"
   - Subtotal del journey con porcentaje
   - Pago final con porcentaje
   - Todo debe sumar 100% del precio base

2. **Exit Scenarios - Handover muestra 100% Complete**
   - Cuando es handover, se ha pagado el 100% del plan
   - El card ya muestra "100% Complete" correctamente (según tu imagen)

3. **Rental Income Card - Falta indicador de promedio 7 años**
   - Actualmente muestra "Year 1" pero debería indicar que el breakeven usa el promedio de 7 años
   - El cálculo de breakeven YA usa `rentGrowthRate` (verificado en `calculateYearsWithGrowth`)

4. **Completion Payment Badge**
   - Para planes post-handover, el pago de "completion" necesita un badge distintivo
   - No confundir handover (la entrega) con el pago final

---

## Parte 1: Payment Breakdown - Porcentajes Claros

### Archivo: `src/components/roi/snapshot/CompactPaymentTable.tsx`

| Sección | Cambio |
|---------|--------|
| **The Entry** | Mostrar `{downpaymentPercent}% + 4% DLD` en el label del total |
| **Subtotal Entry** | Calcular porcentaje total = `downpaymentPercent + 4` (DLD) |
| **The Journey** | Ya muestra `({journeyPercent}%)` - mantener |
| **Final Payment** | Ya muestra `({handoverPercent}%)` - mantener |
| **Grand Total** | Añadir validación visual que suma = 100% |

### Cambios Específicos

**1. Total Entry Label (línea ~456-463):**
```typescript
// ANTES:
<DottedRow 
  label={t('totalEntryLabel')}
  ...
/>

// DESPUÉS:
const entryPercent = downpaymentPercent + 4; // downpayment + DLD
<DottedRow 
  label={`${t('totalEntryLabel')} (${downpaymentPercent}% + 4% DLD)`}
  ...
/>
```

**2. Añadir subtotal con porcentaje después de downpayment:**
Actualmente existe un subtotal cuando hay EOI, pero no muestra que la entrada completa (con DLD+Oqood) es más que el downpayment %.

### Estructura Final del Payment Table

```text
┌──────────────────────────────────────────────────────┐
│ LA ENTRADA                                           │
│   EOI / Cuota de Reserva ..................... 50,000│
│   Saldo de Enganche .......................... 87,600│
│   ─────────────────────────────────────────────────  │
│   Subtotal (20%) ............................ 137,600│
│   Tarifa DLD (4%) ............................ 27,520│
│   Oqood / Tarifa Admin ....................... 3,250 │
│   ─────────────────────────────────────────────────  │
│   Total Entrada (20% + 4% DLD) .............. 168,370│  ← NUEVO label
├──────────────────────────────────────────────────────┤
│ EL CAMINO (24 MES)                                   │
│   2.5% @ Month 2 (Abr 2026) .................. 17,200│
│   2.5% @ Month 5 (Jul 2026) .................. 17,200│
│   ...                                                │
│   ─────────────────────────────────────────────────  │
│   Subtotal (10%) ............................. 68,800│
│   Total Pagado (Entrada + Camino) ........... 237,170│  ← Ya existe
├──────────────────────────────────────────────────────┤
│ ENTREGA (70%)                                        │
│   Pago Final ................................ 481,600│
├──────────────────────────────────────────────────────┤
│ Precio Base de Propiedad .................... 688,000│
│ Tarifas (DLD + Oqood) ........................ 30,770│
│ ═══════════════════════════════════════════════════  │
│ Inversión Total ............................. 718,770│
└──────────────────────────────────────────────────────┘
```

---

## Parte 2: Exit Scenario - Efectivo Invertido en Handover

### Archivo: `src/components/roi/snapshot/SnapshotExitCards.tsx`

El card de handover ya muestra "100% Complete" (según tu imagen). El "Efectivo Invertido" de AED 237,170 es **correcto** - esto es el capital desplegado antes del handover (Entry + Journey), no incluye el pago final porque ese se paga AL momento del handover.

**Clarificación en UI:**
- Añadir tooltip o nota que explique: "Capital deployed = payments made before this exit point"
- El pago de handover (70%) se hace en el momento de la entrega, por lo que no cuenta como "capital desplegado" hasta ese punto

### Posible Mejora (Opcional)

En el card de handover, mostrar:
- "Cash Invested Until Handover: XXX" (lo que se ha pagado)
- "+ Final Payment at Handover: XXX" (lo que se paga en el momento)

---

## Parte 3: Rental Income - Indicador de 7-Year Average

### Archivo: `src/components/roi/snapshot/SnapshotOverviewCards.tsx`

**Problema:** El card muestra "Year 1" pero el breakeven usa crecimiento compuesto.

**Solución:** 
1. Calcular el promedio de 7 años de renta neta
2. Mostrar ambos: Year 1 y 7-Year Average
3. Indicar claramente que el breakeven usa el crecimiento

### Cálculo del Promedio 7 Años

```typescript
// Calcular 7-year average rent con growth
const calculate7YearAverageRent = (yearOneRent: number, growthRate: number): number => {
  let totalRent = 0;
  let currentRent = yearOneRent;
  for (let year = 1; year <= 7; year++) {
    totalRent += currentRent;
    currentRent *= (1 + growthRate / 100);
  }
  return totalRent / 7;
};

const averageAnnualRent = calculate7YearAverageRent(netAnnualRent, inputs.rentGrowthRate);
```

### Nuevo Label

```text
┌────────────────────────────────────────────────┐
│ 🏠 RENTAL INCOME             8.2% net yield    │
│                                                │
│   AED 56,208/yr                                │
│   AED 4,684/mo • Year 1                        │
│                                                │
│   📈 7-Year Average: AED 62,340/yr             │  ← NUEVO
│   (includes 4% annual growth)                  │  ← NUEVO
└────────────────────────────────────────────────┘
```

### Archivo: `src/components/roi/snapshot/CompactRentCard.tsx`

Añadir sección de promedio 7 años:

```typescript
// Después de Monthly row
<div className="mt-2 pt-2 border-t border-theme-border/50">
  <DottedRow 
    label={t('sevenYearAverageLabel')}
    value={getDualValue(averageAnnualRent).primary}
    valueClassName="text-green-400"
  />
  <span className="text-[9px] text-theme-text-muted">
    ({t('includesGrowthLabel')} {inputs.rentGrowthRate}%/yr)
  </span>
</div>
```

---

## Parte 4: Completion Payment Badge

### Archivo: `src/components/roi/snapshot/CompactPaymentTable.tsx`

Para planes con pagos post-handover, el pago que cae en el mes de completion necesita un badge:

**Lógica de Detección:**

```typescript
// Check if this payment is the completion/handover payment
const isCompletionPayment = (payment: PaymentMilestone): boolean => {
  if (payment.type !== 'time') return false;
  
  // Calculate payment date
  const paymentDate = new Date(bookingYear, bookingMonth - 1);
  paymentDate.setMonth(paymentDate.getMonth() + payment.triggerValue);
  
  // Calculate handover date
  const handoverDate = handoverMonth 
    ? new Date(handoverYear, handoverMonth - 1)
    : new Date(handoverYear, (handoverQuarter - 1) * 3 + 1);
  
  // Check if payment falls in the same month as handover
  return paymentDate.getFullYear() === handoverDate.getFullYear() && 
         paymentDate.getMonth() === handoverDate.getMonth();
};
```

**Badge Visual:**

```tsx
{isCompletionPayment(payment) && (
  <span className="text-[8px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30">
    🔑 Completion
  </span>
)}
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/roi/snapshot/CompactPaymentTable.tsx` | Entry label con porcentajes, completion badge |
| `src/components/roi/snapshot/SnapshotOverviewCards.tsx` | Añadir 7-year average rent indicator |
| `src/components/roi/snapshot/CompactRentCard.tsx` | Añadir sección de promedio 7 años |
| `src/contexts/translations.ts` | Nuevas traducciones para labels |

---

## Traducciones Nuevas

```typescript
// EN
sevenYearAverageLabel: '7-Year Average',
includesGrowthLabel: 'includes',
completionBadge: 'Completion',

// ES
sevenYearAverageLabel: 'Promedio 7 Años',
includesGrowthLabel: 'incluye',
completionBadge: 'Entrega',
```

---

## Verificación de Break-Even

El cálculo de break-even **YA está correcto** en `useOICalculations.ts`:

```typescript
const calculateYearsWithGrowth = (principal: number, annualRent: number, growthRate: number): number => {
  if (annualRent <= 0) return 999;
  if (growthRate <= 0) return principal / annualRent;
  
  const g = growthRate / 100;
  // Using geometric series: Years = ln(1 + (P × g) / R) / ln(1 + g)
  const yearsNeeded = Math.log(1 + (principal * g) / annualRent) / Math.log(1 + g);
  return yearsNeeded;
};
```

Esta fórmula de serie geométrica **correctamente incluye** el crecimiento compuesto de la renta en todos los años. No requiere cambios.

---

## Resultado Esperado

1. **Payment Table:** Porcentajes claros que suman 100%
   - Entry: "20% + 4% DLD"
   - Journey: "10%"
   - Handover: "70%"
   - Total: 100% ✓

2. **Exit Cards:** Handover muestra "100% Complete" (ya funciona)

3. **Rental Income:** Muestra Year 1 + "7-Year Average" con nota de crecimiento

4. **Completion Badge:** Pagos en el mes de completion tienen badge distintivo
