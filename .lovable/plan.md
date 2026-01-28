
# Plan: Aumentar Límite de Pagos Post-Handover a 100

## Justificación
Algunos planes de pago tienen cuotas de **0.5% mensual**, lo que requiere hasta **100 pagos** para cubrir un 50% post-handover.

## Cambio Requerido

### Archivo: `src/components/roi/configurator/PostHandoverSection.tsx`

**Línea 228 - Cambiar de:**
```tsx
onChange={(e) => handleNumberInputChange(e.target.value, setNumPostPayments, 1, 60)}
```

**A:**
```tsx
onChange={(e) => handleNumberInputChange(e.target.value, setNumPostPayments, 1, 100)}
```

## Nota
El input ya tiene `w-14` que es suficiente para mostrar "100" (3 dígitos).

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/roi/configurator/PostHandoverSection.tsx` | Cambiar max 60→100 |
