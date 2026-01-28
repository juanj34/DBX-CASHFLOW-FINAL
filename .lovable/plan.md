
# Plan: Export DOM Estable para PNG/PDF

## Objetivo
Eliminar definitivamente el problema del "text baseline drift" creando un **Export DOM dedicado** (una versión del dashboard optimizada exclusivamente para exportación) que no tenga animaciones, transforms, ni responsive - solo tamaño fijo A3 horizontal.

---

## Por qué la solución actual falla

El enfoque actual intenta capturar el DOM interactivo "vivo" con html2canvas:
- **Animaciones activas**: framer-motion en PropertyTabContent, OIGrowthCurve tiene `useEffect` con timers, PaymentHorizontalTimeline tiene `transition-all` y `animationDelay`
- **Transforms CSS**: hover effects con `scale-125`, `scale-110`, múltiples componentes con `transition-all`
- **Responsive**: uso de `isDesktop` hooks, breakpoints que cambian el layout según viewport

html2canvas renderiza el DOM en un momento específico, pero si hay transforms micro-animados o texto con baseline calculado durante una transición, el texto se desplaza respecto a sus contenedores.

---

## Solución: Export DOM Dedicado

Crear componentes específicos para exportación que:
1. **Tamaño fijo**: 1587 × 1123 px (A3 landscape @ 96dpi, sin márgenes de impresión)
2. **Sin animaciones**: ningún `transition`, `animation`, `framer-motion`
3. **Sin responsive**: no hay `isDesktop` checks, todo es grid fijo
4. **Sin interactividad**: no hay hover states, botones deshabilitados, sliders ocultos

---

## Arquitectura

```text
┌─────────────────────────────────────────────────────────────────┐
│  ExportModal (usuario elige qué exportar)                      │
│  - Cashflow / Snapshot / Ambos                                 │
│  - Formato: PNG / PDF                                          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  useExportRenderer (nuevo hook)                                │
│  1. Monta <ExportCashflowDOM> o <ExportSnapshotDOM>            │
│     en un contenedor oculto (position: absolute, left: -9999px)│
│  2. await document.fonts.ready                                 │
│  3. await delay(100ms) para layout estable                     │
│  4. html2canvas con opciones simples (sin onclone hack)        │
│  5. Devuelve canvas para PNG o PDF                             │
│  6. Desmonta el contenedor                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cambios Técnicos

### 1. Nuevos Componentes de Exportación

**Archivos nuevos:**
- `src/components/roi/export/ExportCashflowDOM.tsx`
- `src/components/roi/export/ExportSnapshotDOM.tsx`
- `src/components/roi/export/ExportHeader.tsx`
- `src/components/roi/export/ExportPaymentTable.tsx`
- `src/components/roi/export/ExportExitCards.tsx`
- `src/components/roi/export/ExportRentCard.tsx`
- `src/components/roi/export/ExportMortgageCard.tsx`
- `src/components/roi/export/ExportGrowthCurve.tsx` (SVG estático, sin animación)
- `src/components/roi/export/ExportWealthTimeline.tsx`
- `src/components/roi/export/index.ts`

**Características:**
- Ancho fijo `1587px`, alto automático (basado en contenido)
- Todos los estilos inline o clases estáticas
- Colores tema-aware usando CSS variables
- Sin `useState`, sin `useEffect` con timers
- Sin `motion.div`, sin `transition-*`, sin `animate-*`
- Fuentes con `tabular-nums` para números alineados

### 2. Nuevo Hook de Exportación

**Archivo nuevo:** `src/hooks/useExportRenderer.ts`

```text
Responsabilidades:
- Crear contenedor offscreen en el body
- Renderizar el Export DOM dentro con ReactDOM.createRoot
- Esperar fonts.ready + pequeño delay
- Capturar con html2canvas (config simplificada)
- Limpiar contenedor
- Retornar canvas
```

### 3. Actualizar useClientExport.ts

- Usar `useExportRenderer` en lugar de capturar el DOM visible
- Mantener la lógica de descarga PNG/PDF existente
- Simplificar la configuración de html2canvas (ya no necesita `onclone` con hacks de transforms)

### 4. ExportModal Mejorado

- El usuario selecciona qué exportar: "Vista actual" / "Cashflow" / "Snapshot" / "Ambos"
- El usuario selecciona formato: PNG / PDF
- Botón "Exportar" dispara `useExportRenderer`

---

## Flujo de Exportación

```text
1. Usuario hace clic en "Export" desde el modal
2. Modal cierra y muestra toast "Preparando exportación..."
3. Hook monta ExportDOM offscreen
4. Espera fonts.ready
5. Pequeño delay (100ms) para render completo
6. html2canvas captura el elemento
7. Si PNG: canvas.toBlob → descargar
8. Si PDF: canvas.toDataURL → jsPDF → descargar
9. Hook desmonta ExportDOM
10. Toast "Exportación completada"
```

---

## Diseño del Export DOM (A3 Horizontal)

```text
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER (logo + título + cliente + fecha)              │ 1587px ancho │
├────────────────────────────────────────────────────────────────────────┤
│  HERO CARD (imagen propiedad + datos clave)                            │
├────────────────────────────────────────────────────────────────────────┤
│  OVERVIEW CARDS (4-5 KPIs horizontales)                                │
├─────────────────────────────────────┬──────────────────────────────────┤
│  PAYMENT BREAKDOWN (tabla)         │  RENT + EXITS + MORTGAGE (stack) │
│  + Value Differentiators           │                                  │
├─────────────────────────────────────┴──────────────────────────────────┤
│  WEALTH PROJECTION TIMELINE (ancho completo)                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `src/components/roi/export/ExportCashflowDOM.tsx` | Layout completo para Cashflow |
| `src/components/roi/export/ExportSnapshotDOM.tsx` | Layout completo para Snapshot |
| `src/components/roi/export/ExportHeader.tsx` | Cabecera con logo/título |
| `src/components/roi/export/ExportPaymentTable.tsx` | Tabla de pagos sin animaciones |
| `src/components/roi/export/ExportExitCards.tsx` | Cards de exit estáticos |
| `src/components/roi/export/ExportRentCard.tsx` | Rent info estático |
| `src/components/roi/export/ExportMortgageCard.tsx` | Mortgage info estático |
| `src/components/roi/export/ExportGrowthCurve.tsx` | SVG curve sin animation |
| `src/components/roi/export/ExportWealthTimeline.tsx` | Timeline sin animation |
| `src/components/roi/export/ExportOverviewCards.tsx` | KPIs horizontales |
| `src/components/roi/export/index.ts` | Barrel exports |
| `src/hooks/useExportRenderer.ts` | Hook para render offscreen + captura |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useClientExport.ts` | Usar `useExportRenderer` en lugar de captura directa |
| `src/index.css` | Eliminar reglas export-mode que ya no se necesitan |

---

## Beneficios de Esta Solución

1. **Aislamiento total**: El DOM de exportación nunca se ve afectado por estados de animación del DOM visible
2. **Determinismo**: Sin `useEffect` timers, sin transiciones, sin hover - el render es idéntico siempre
3. **Mantenibilidad**: Componentes de export separados, fáciles de actualizar independientemente
4. **Calidad**: A3 horizontal a alta resolución, perfecto para presentaciones profesionales
5. **Flexibilidad**: El modal permite al usuario elegir exactamente qué exportar

---

## Notas de Implementación

- Los componentes de Export usarán los mismos cálculos (`useOICalculations`, `calculateExitScenario`, etc.) pero sin hooks de animación
- Se reutilizarán las utilidades de formato (`formatCurrency`, etc.)
- El tema se respetará via CSS variables (`hsl(var(--theme-*))`)
- Se usará `pixelRatio: 2` en html2canvas para alta resolución
