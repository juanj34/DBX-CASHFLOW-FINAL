

# Plan: Aumentar Límite de Pagos en el Configurador

## Problema Identificado

El configurador está limitando el número de pagos que se pueden generar automáticamente a **12 máximo**, pero el usuario necesita crear hasta **51 pagos** (ej: 51 pagos de 1% cada uno).

### Ubicación de los Límites

| Archivo | Línea | Límite Actual | Descripción |
|---------|-------|---------------|-------------|
| `PaymentSection.tsx` | 304 | `max: 12` | Generador de installments pre-handover |
| `PostHandoverSection.tsx` | 228 | `max: 12` | Generador de installments post-handover |

**Nota**: El botón "Add Installment" no tiene límite - los usuarios pueden agregar pagos manualmente sin restricciones. El problema está solo en el auto-generador.

---

## Solución Propuesta

### 1. Aumentar Límite del Auto-Generador

Cambiar el límite máximo de 12 a **60** pagos para ambas secciones:

**PaymentSection.tsx línea 304:**
```tsx
// Antes:
onChange={(e) => handleNumberInputChange(e.target.value, setNumPayments, 1, 12)}

// Después:
onChange={(e) => handleNumberInputChange(e.target.value, setNumPayments, 1, 60)}
```

**PostHandoverSection.tsx línea 228:**
```tsx
// Antes:
onChange={(e) => handleNumberInputChange(e.target.value, setNumPostPayments, 1, 12)}

// Después:
onChange={(e) => handleNumberInputChange(e.target.value, setNumPostPayments, 1, 60)}
```

### 2. Ajustar Ancho del Input

Con 2 dígitos ahora el input necesita un poco más de espacio:

**PaymentSection.tsx línea 305:**
```tsx
// Antes:
className="w-12 h-7 ..."

// Después:
className="w-14 h-7 ..."  // Ligeramente más ancho para 2 dígitos
```

**PostHandoverSection.tsx línea 229:**
```tsx
// Antes:
className="w-12 h-7 ..."

// Después:
className="w-14 h-7 ..."
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/roi/configurator/PaymentSection.tsx` | Cambiar max 12→60, ajustar ancho input |
| `src/components/roi/configurator/PostHandoverSection.tsx` | Cambiar max 12→60, ajustar ancho input |

---

## Consideraciones Adicionales

### Rendimiento
- 60 pagos es razonable para el DOM - el listado ya tiene `overflow-y-auto` con `max-h-72` para manejar listas largas
- Los cálculos en `useOICalculations` son simples sumas, no hay impacto de performance significativo

### UX
- Con 51 pagos de 1%, el usuario necesitaría 51 meses (4+ años) de plazo
- El campo de intervalo ya permite hasta 24 meses entre pagos
- Podría ser útil agregar un hint cuando se generan muchos pagos

### Validación Existente
- El sistema ya valida que el total sea 100%
- Cada pago individual puede tener cualquier porcentaje entre 0-100%
- No hay restricciones en el modelo de datos

---

## Resultado Esperado

Después de estos cambios, el usuario podrá:
1. Escribir "51" en el campo de número de pagos
2. Escribir "1" en el campo de intervalo (para pagos mensuales)
3. Hacer clic en "Generate" 
4. El sistema creará 51 pagos automáticamente
5. La lista mostrará todos los pagos con scroll

