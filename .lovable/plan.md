
# Plan: Modo de Generación Libre para Pagos Post-Handover

## Problema Actual

El generador de pagos post-handover calcula automáticamente el porcentaje dividiendo lo que queda después del pre-handover:

```typescript
const remaining = 100 - preHandoverTotal - (inputs.onHandoverPercent || 0);
const percentPerPayment = remaining / numPostPayments;  // ← Esto da 0.4% en vez de 1%
```

Esto no funciona para planes donde **todos los pagos son post-handover** (ejemplo: 51 pagos de 1%).

---

## Solución Propuesta

### 1. Agregar Campo "% Per Payment" al Generador

Agregar un nuevo input al generador que permite especificar el porcentaje **exacto** por pago:

```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ Post-Handover Installments                              │
│                                                             │
│  [51] payments × [1] mo @ [1] % each      [⚡ Generate]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Modificar Lógica de Generación

**Cambiar de:**
```typescript
const remaining = 100 - preHandoverTotal - (inputs.onHandoverPercent || 0);
const percentPerPayment = numPostPayments > 0 ? remaining / numPostPayments : 0;
```

**A:**
```typescript
// percentPerPayment comes directly from user input (e.g., 1%)
// No calculation based on remaining - user defines the exact percentage
```

### 3. Hacer el Footer Informativo (No Restrictivo)

El footer actual muestra PRE-HANDOVER / ON HANDOVER / POST / TOTAL. Mantenerlo pero hacerlo informativo:
- Si total > 100%: Mostrar en **amarillo** con mensaje "X% over - adjust manually"
- Si total < 100%: Mostrar en **amarillo** con mensaje "X% remaining"
- Si total = 100%: Mostrar **verde** con checkmark

---

## Cambios Técnicos

### Archivo: `src/components/roi/configurator/PostHandoverSection.tsx`

#### 1. Agregar estado para porcentaje por pago (línea ~19)
```typescript
const [percentPerPayment, setPercentPerPayment] = useState(1); // Default 1%
```

#### 2. Modificar generador (línea 85-101)
```typescript
const handleGeneratePostPayments = () => {
  const newPayments: PaymentMilestone[] = [];
  
  for (let i = 0; i < numPostPayments; i++) {
    newPayments.push({
      id: `post-auto-${Date.now()}-${i}`,
      type: 'post-handover',
      triggerValue: postPaymentInterval * (i + 1),
      paymentPercent: percentPerPayment  // ← Usar valor directo del input
    });
  }
  
  setInputs(prev => ({ ...prev, postHandoverPayments: newPayments }));
  setShowPostHandoverInstallments(true);
};
```

#### 3. Agregar input de "% per payment" en UI (línea ~233)
Agregar un tercer input al generador:

```tsx
<div className="flex items-center gap-2 ml-7">
  <div className="flex items-center gap-1">
    <Input
      type="text"
      inputMode="numeric"
      value={numPostPayments || ''}
      onChange={(e) => handleNumberInputChange(e.target.value, setNumPostPayments, 1, 100)}
      className="w-14 h-7 bg-theme-input border-theme-border text-theme-text font-mono text-center text-xs"
    />
    <span className="text-[10px] text-theme-text-muted">payments</span>
  </div>
  <span className="text-theme-text-muted">×</span>
  <div className="flex items-center gap-1">
    <Input
      type="text"
      inputMode="numeric"
      value={postPaymentInterval || ''}
      onChange={(e) => handleNumberInputChange(e.target.value, setPostPaymentInterval, 1, 24)}
      className="w-10 h-7 bg-theme-input border-theme-border text-theme-text font-mono text-center text-xs"
    />
    <span className="text-[10px] text-theme-text-muted">mo</span>
  </div>
  {/* NEW: Percent per payment */}
  <span className="text-theme-text-muted">@</span>
  <div className="flex items-center gap-1">
    <Input
      type="text"
      inputMode="decimal"
      value={percentPerPayment || ''}
      onChange={(e) => handleNumberInputChange(e.target.value, setPercentPerPayment, 0.1, 50)}
      className="w-12 h-7 bg-theme-input border-theme-border text-purple-400 font-mono text-center text-xs"
    />
    <span className="text-[10px] text-theme-text-muted">%</span>
  </div>
  <Button ... >Generate</Button>
</div>
```

#### 4. Actualizar summary para mostrar proyección (línea ~347)
Agregar info del total generado:

```tsx
{/* Quick projection */}
<div className="text-[10px] text-theme-text-muted ml-7 mt-1">
  {numPostPayments} × {percentPerPayment}% = {(numPostPayments * percentPerPayment).toFixed(1)}% 
  {numPostPayments * percentPerPayment !== 100 && (
    <span className="text-amber-400 ml-1">
      (adjust one payment to reach 100%)
    </span>
  )}
</div>
```

---

## Resultado Esperado

Con estos cambios:

1. **Usuario escribe:** 51 payments × 1 mo @ 1% each
2. **Hace clic en Generate**
3. **Sistema crea:** 51 pagos de exactamente 1% cada uno (51% total)
4. **Footer muestra:** "Post-Handover: 51% • Total: 51% (49% remaining)"
5. **Usuario ajusta manualmente** uno de los pagos a 50% para llegar a 100%

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/roi/configurator/PostHandoverSection.tsx` | Agregar estado `percentPerPayment`, modificar `handleGeneratePostPayments`, agregar input UI, actualizar preview |

---

## UX Preview

```
┌─────────────────────────────────────────────────────────────┐
│  P ⚡ Post-Handover Installments                            │
│                                                             │
│  ┌────┐         ┌───┐        ┌────┐                        │
│  │ 51 │payments × │ 1│ mo  @  │ 1 │ %      [⚡ Generate]   │
│  └────┘         └───┘        └────┘                        │
│                                                             │
│  51 × 1% = 51% (adjust one payment to reach 100%)          │
└─────────────────────────────────────────────────────────────┘
```

Después de generar:
```
┌────────────────────────────────────────────────────────────┐
│  Pre-Handover  │  On Handover  │  Post-Handover  │  Total  │
│      0%        │      0%       │      51%        │   51%   │
│                                                  │ (49% ⚠) │
└────────────────────────────────────────────────────────────┘
```
