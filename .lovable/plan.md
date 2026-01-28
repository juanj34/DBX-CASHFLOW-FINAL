
# Plan: Post-Handover Coverage Analysis Card

## Objetivo
Crear una funcionalidad similar al recuadro de hipoteca que muestre al cliente cómo la renta mensual puede cubrir los pagos del plan post-handover. Esto ayuda a visualizar que el cliente puede "financiar" los pagos restantes con el ingreso que genera la propiedad una vez entregada.

---

## Lógica de Cálculo

### Datos de Entrada
1. **Post-Handover Payments**: Array de `PaymentMilestone[]` con `type: 'post-handover'`
2. **Post-Handover Duration**: Período desde handover hasta `postHandoverEndQuarter/Year`
3. **Monthly Rent**: `(basePrice * rentalYieldPercent / 100 - serviceCharges) / 12`

### Cálculo del "Pago Mensual Equivalente"

Aunque los pagos post-handover no son mensuales (ej: 5% cada 6 meses), los convertimos a un equivalente mensual para comparar con la renta:

```
postHandoverTotal = suma de todos los pagos post-handover (en AED)
postHandoverMonths = meses desde handover hasta postHandoverEndDate
monthlyEquivalent = postHandoverTotal / postHandoverMonths
```

### Métricas a Mostrar

| Métrica | Cálculo | Color |
|---------|---------|-------|
| Monthly Payment Equivalent | postHandoverTotal / postHandoverMonths | Purple |
| Monthly Net Rent | monthlyRent | Cyan |
| Monthly Cashflow | monthlyRent - monthlyEquivalent | Green/Red |
| Coverage % | (monthlyRent / monthlyEquivalent) × 100 | Badge |
| Months to Complete | postHandoverMonths | Info |

---

## Diseño Visual (Similar a Mortgage Card)

```
┌─────────────────────────────────────────────────────────┐
│  🔁 Post-Handover Coverage          ┌─────────────────┐ │
│                                     │ 24mo @ Q4 2029  │ │
├─────────────────────────────────────┴─────────────────┤ │
│                                                        │ │
│  Post-HO Payments ............ AED 340,000 (43%)     │ │
│  Monthly Equivalent ............ AED 14,167 /mo      │ │
│  ─────────────────────────────────────────────────── │ │
│  Monthly Rent ..................... +AED 4,583 /mo   │ │
│  ─────────────────────────────────────────────────── │ │
│  Monthly Gap ...................... -AED 9,584 /mo   │ │
│                                                        │ │
│  ┌──────────────────────────────────────────────────┐ │
│  │   Rent covers 32% of post-handover payments      │ │
│  │   Gap: AED 230,000 over 24 months                │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │ │
│  ┌─────────┐ ┌─────────────────────────────────────┐   │
│  │ Partial │ │ 32% covered • AED 9.6K/mo out-of-pocket│
│  └─────────┘ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `src/components/roi/snapshot/CompactPostHandoverCard.tsx` | Versión compacta para Snapshot view |
| `src/components/roi/PostHandoverCoverageCard.tsx` | Versión completa para Cashflow view |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/roi/snapshot/SnapshotContent.tsx` | Agregar CompactPostHandoverCard debajo de CompactMortgageCard |
| `src/components/roi/snapshot/CompactPaymentTable.tsx` | Agregar sección "Post-Handover" al payment breakdown (ya tiene lógica parcial) |
| `src/pages/CashflowView.tsx` | Agregar PostHandoverCoverageCard en la vista de cliente |
| `src/pages/OICalculator.tsx` | Agregar PostHandoverCoverageCard en la vista de broker |
| `src/components/roi/export/ExportSnapshotDOM.tsx` | Agregar versión export del componente |
| `src/components/roi/export/ExportPostHandoverCard.tsx` | Nuevo componente para export |

---

## Componente: CompactPostHandoverCard

### Props

```typescript
interface CompactPostHandoverCardProps {
  inputs: OIInputs;
  monthlyRent: number;
  currency: Currency;
  rate: number;
}
```

### Lógica Interna

```typescript
// Solo mostrar si hay plan post-handover
if (!inputs.hasPostHandoverPlan) return null;
if (!inputs.postHandoverPayments?.length) return null;

// Calcular total de pagos post-handover
const postHandoverTotal = inputs.postHandoverPayments.reduce(
  (sum, p) => sum + (inputs.basePrice * p.paymentPercent / 100), 0
);

// Calcular duración en meses (desde handover hasta postHandoverEnd)
const handoverDate = new Date(inputs.handoverYear, (inputs.handoverQuarter - 1) * 3);
const endDate = new Date(inputs.postHandoverEndYear, (inputs.postHandoverEndQuarter - 1) * 3);
const postHandoverMonths = Math.max(1, 
  (endDate.getFullYear() - handoverDate.getFullYear()) * 12 + 
  (endDate.getMonth() - handoverDate.getMonth())
);

// Pago mensual equivalente
const monthlyEquivalent = postHandoverTotal / postHandoverMonths;

// Cashflow
const monthlyCashflow = monthlyRent - monthlyEquivalent;
const coveragePercent = monthlyEquivalent > 0 
  ? Math.round((monthlyRent / monthlyEquivalent) * 100) 
  : 0;
const isFullyCovered = monthlyCashflow >= 0;
```

---

## Actualización de CompactPaymentTable

Agregar sección "Post-Handover" cuando `hasPostHandoverPlan === true`:

```tsx
{/* Section: Post-Handover */}
{hasPostHandoverPlan && (inputs.postHandoverPayments || []).length > 0 && (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-purple-400 font-semibold mb-2">
      Post-Handover ({postHandoverMonths}mo)
    </div>
    <div className="space-y-1">
      {(inputs.postHandoverPayments || []).map((payment, index) => (
        <DottedRow 
          key={index}
          label={`+${payment.triggerValue}mo after handover`}
          value={getDualValue(basePrice * payment.paymentPercent / 100).primary}
          secondaryValue={getDualValue(basePrice * payment.paymentPercent / 100).secondary}
        />
      ))}
      <div className="pt-1 border-t border-theme-border mt-1">
        <DottedRow 
          label="Subtotal"
          value={getDualValue(postHandoverTotal).primary}
          secondaryValue={getDualValue(postHandoverTotal).secondary}
          bold
          valueClassName="text-purple-400"
        />
      </div>
    </div>
  </div>
)}
```

---

## Estados de Cobertura

| Estado | Condición | Visual |
|--------|-----------|--------|
| Fully Covered | `monthlyRent >= monthlyEquivalent` | Badge verde + "Rent covers 100%+" |
| Partially Covered | `monthlyRent > 0 && monthlyRent < monthlyEquivalent` | Badge amarillo + "Rent covers X%" |
| Not Covered | `monthlyRent === 0` | Badge rojo + "No rental income configured" |

---

## Integración con Export System

Crear `ExportPostHandoverCard.tsx` siguiendo el patrón de `ExportMortgageCard.tsx`:
- Sin animaciones
- Estilos inline
- Colores de tema via CSS variables
- Layout fijo

---

## Orden en las Vistas

### Snapshot (columna derecha)
1. Compact Rent Card
2. Compact All Exits Card (if enabled)
3. **Compact Post-Handover Card** (NEW - si hasPostHandoverPlan)
4. Compact Mortgage Card (if enabled)

### Cashflow View
Agregar en una nueva sección colapsable "Post-Handover Analysis" debajo de "Mortgage Analysis"

---

## Traducciones Requeridas

| Key | EN | ES |
|-----|----|----|
| postHandoverHeader | Post-Handover Coverage | Cobertura Post-Handover |
| postHandoverPayments | Post-Handover Payments | Pagos Post-Handover |
| monthlyEquivalent | Monthly Equivalent | Equivalente Mensual |
| coverageLabel | Coverage | Cobertura |
| rentCoversPercent | Rent covers {X}% | La renta cubre {X}% |
| monthlyGap | Monthly Gap | Diferencia Mensual |
| afterHandover | after handover | después del handover |

---

## Flujo de Datos

```
OIInputs
  ├── hasPostHandoverPlan: boolean
  ├── postHandoverPayments: PaymentMilestone[]
  ├── postHandoverEndQuarter: number
  ├── postHandoverEndYear: number
  └── rentalYieldPercent: number
          │
          ▼
┌─────────────────────────────────┐
│  CompactPostHandoverCard        │
│  - Calcula postHandoverTotal    │
│  - Calcula postHandoverMonths   │
│  - Calcula monthlyEquivalent    │
│  - Compara con monthlyRent      │
│  - Muestra coverage status      │
└─────────────────────────────────┘
```

---

## Archivos Completos a Crear/Modificar

### Nuevos Archivos
1. `src/components/roi/snapshot/CompactPostHandoverCard.tsx`
2. `src/components/roi/PostHandoverCoverageCard.tsx`
3. `src/components/roi/export/ExportPostHandoverCard.tsx`

### Modificaciones
1. `src/components/roi/snapshot/SnapshotContent.tsx` - Agregar componente
2. `src/components/roi/snapshot/CompactPaymentTable.tsx` - Agregar sección Post-Handover
3. `src/pages/CashflowView.tsx` - Agregar componente (si visibility permite)
4. `src/pages/OICalculator.tsx` - Agregar componente al tabbed view
5. `src/contexts/LanguageContext.tsx` - Agregar traducciones
6. `src/components/roi/export/ExportSnapshotDOM.tsx` - Agregar versión export
7. `src/components/roi/export/index.ts` - Export nuevo componente
