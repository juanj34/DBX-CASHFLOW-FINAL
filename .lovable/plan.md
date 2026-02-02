
# Plan: Redesign del Configurator + Armonización de Colores

## Resumen Ejecutivo
Tu feedback señala dos problemas principales:
1. **Configurador demasiado denso** - El wizard actual de 4 pasos comprime demasiada información en cada pantalla
2. **Colores inconsistentes** - Uso de colores hardcodeados (cyan-400, orange-400, purple-400, etc.) que lucen mal en el tema claro

Este plan expande el configurador a 6-8 pasos más focalizados y unifica el sistema de colores para que funcione perfectamente en ambos temas.

---

## Parte 1: Rediseño del Configurador

### Problema Actual
El configurador tiene 4 pasos densos:
```text
┌─────────────────────────────────────────────────────┐
│  1.Project │ 2.Investment │ 3.Returns │ 4.Extras   │
│     ↓            ↓             ↓            ↓      │
│  [Dense]    [Dense]       [Dense]      [Dense]     │
└─────────────────────────────────────────────────────┘
```

### Nueva Estructura: 6 Pasos Focalizados
```text
┌────────────────────────────────────────────────────────────────────┐
│  ① Location  ② Property  ③ Payment  ④ Appreciation  ⑤ Rental  ⑥ Exit │
└────────────────────────────────────────────────────────────────────┘
```

| Paso | Nombre | Contenido |
|------|--------|-----------|
| 1 | Location | Zone selector + project/developer names |
| 2 | Property | Base price + dates + entry costs |
| 3 | Payment | Payment split + installments + post-handover |
| 4 | Appreciation | Growth profile + zone maturity + differentiators |
| 5 | Rental | Yield + service charges + Airbnb comparison |
| 6 | Exit | Exit scenarios + mortgage (optional) |

### Nuevo Footer con Progreso Visual

```text
┌──────────────────────────────────────────────────────────────────┐
│  [← Back]    ① ② ③ ④ ⑤ ⑥    "Step 3 of 6: Payment"    [Next →] │
│              ═══════░░░░░                                        │
│              (progress bar)                                      │
└──────────────────────────────────────────────────────────────────┘
```

- **Indicadores numerados** (1-6) en el centro del footer
- **Barra de progreso** debajo de los números
- **Flechas de navegación** prominentes a los lados
- **Etiqueta del paso actual** visible ("Step 3: Payment")

### Cambios en Archivos

| Archivo | Cambios |
|---------|---------|
| `src/components/roi/configurator/types.ts` | Expandir `ConfiguratorSection` a 6 tipos |
| `src/components/roi/configurator/ConfiguratorLayout.tsx` | Nuevo footer con barra de progreso + flechas prominentes |
| `src/components/roi/configurator/LocationSection.tsx` | NUEVO - Solo zone + developer/project |
| `src/components/roi/configurator/PropertySection.tsx` | Simplificar - Solo precio + fechas + entry costs |
| `src/components/roi/configurator/PaymentSection.tsx` | Ya existe - mantener como step dedicado |
| `src/components/roi/configurator/AppreciationSection.tsx` | Ya existe - step dedicado |
| `src/components/roi/configurator/RentSection.tsx` | Ya existe - step dedicado |
| `src/components/roi/configurator/ExitSection.tsx` | NUEVO - Combina exits + mortgage opcional |

---

## Parte 2: Armonización del Sistema de Colores

### Problema Actual
El código usa colores hardcodeados que no se adaptan al tema:
```tsx
// ❌ Colores hardcodeados - se ven mal en tema claro
<Home className="text-cyan-400" />
<span className="bg-purple-500/10 text-purple-400">...</span>
<div className="text-orange-400">Construction</div>
```

### Solución: Tokens Semánticos por Función

Crear variables CSS que cambien según el tema:

```css
/* En index.css */
.theme-consultant {
  --theme-accent-info: 213 94% 35%;      /* Deep blue for info */
  --theme-accent-success: 160 84% 30%;   /* Forest green */
  --theme-accent-warning: 38 92% 45%;    /* Rich amber */
  --theme-accent-rental: 198 78% 35%;    /* Ocean teal */
  --theme-accent-exit: 280 68% 40%;      /* Deep purple */
}

.theme-tech-dark {
  --theme-accent-info: 187 100% 50%;     /* Bright cyan */
  --theme-accent-success: 142 71% 45%;   /* Lime green */
  --theme-accent-warning: 38 92% 50%;    /* Bright amber */
  --theme-accent-rental: 187 100% 50%;   /* Cyan */
  --theme-accent-exit: 280 100% 65%;     /* Neon purple */
}
```

### Mapeo de Colores por Concepto

| Concepto | Tema Claro | Tema Oscuro |
|----------|------------|-------------|
| **Primary/Investment** | Gold (#B8860B) | Lime (#CCFF00) |
| **Secondary/Info** | Navy (#1E3A5F) | Cyan (#00EAFF) |
| **Rental/Income** | Teal (#0F766E) | Cyan (#22D3EE) |
| **Exit/ROI** | Purple (#6D28D9) | Magenta (#FF00FF) |
| **Warning** | Amber (#D97706) | Amber (#F59E0B) |
| **Positive** | Emerald (#059669) | Green (#22C55E) |
| **Negative** | Red (#DC2626) | Red (#EF4444) |
| **Construction Phase** | Orange (#C2410C) | Orange (#F97316) |
| **Growth Phase** | Green (#15803D) | Green (#4ADE80) |
| **Mature Phase** | Blue (#1D4ED8) | Blue (#3B82F6) |

### Componentes a Actualizar

Archivos con colores hardcodeados a reemplazar:

| Archivo | Colores Problemáticos |
|---------|----------------------|
| `SnapshotOverviewCards.tsx` | `text-cyan-400`, `text-purple-400`, `text-orange-400` |
| `ExitScenariosCards.tsx` | `text-orange-400`, `bg-orange-400/10` |
| `WealthProjectionTable.tsx` | `bg-orange-400`, `bg-green-400`, `bg-blue-400` |
| `ValueDifferentiatorsBadges.tsx` | Multiple hardcoded badge colors |
| `PropertyPaymentCards.tsx` | `bg-emerald-500/20`, `bg-cyan-500/20` |
| `ProjectionDisclaimer.tsx` | `text-amber-400`, `bg-amber-500/10` |
| `ZoneAppreciationIndicator.tsx` | `text-orange-400`, `text-green-400` |
| `InvestmentSection.tsx` | `text-blue-400` |
| `RentSection.tsx` | `text-cyan-400`, `text-orange-400` |

### Estrategia de Migración

```tsx
// ANTES ❌
<Home className="text-cyan-400" />
<span className="bg-cyan-500/10 text-cyan-400">8.6% yield</span>

// DESPUÉS ✅
<Home className="text-theme-accent-secondary" />
<span className="bg-theme-accent-secondary/10 text-theme-accent-secondary">8.6% yield</span>
```

Para colores de fase (Construction/Growth/Mature), crear clases utilitarias:

```tsx
// ANTES ❌
<span className="text-orange-400">Construction</span>
<span className="text-green-400">Growth</span>
<span className="text-blue-400">Mature</span>

// DESPUÉS ✅
<span className="text-phase-construction">Construction</span>
<span className="text-phase-growth">Growth</span>
<span className="text-phase-mature">Mature</span>
```

---

## Implementación por Fases

### Fase 1: Variables CSS (index.css + tailwind.config.ts)
- Añadir nuevas variables de color semánticas
- Extender tailwind.config.ts con las nuevas clases

### Fase 2: Configurador - Nueva Estructura
- Actualizar `types.ts` con 6 secciones
- Crear `LocationSection.tsx`
- Crear `ExitSection.tsx`
- Actualizar `ConfiguratorLayout.tsx` con nuevo footer

### Fase 3: Migración de Colores
- Actualizar componentes de snapshot
- Actualizar componentes de export
- Actualizar componentes del configurador

### Fase 4: Testing Visual
- Verificar tema Tech Dark
- Verificar tema Consultant (claro)
- Verificar tema Consultant Dark

---

## Nuevo Footer Propuesto (Visual)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────┐                                                   ┌────────┐ │
│  │ ← Prev│   ①──②──●──④──⑤──⑥    Step 3 of 6: Payment     │ Next → │ │
│  └──────┘                                                   └────────┘ │
│               ════════════░░░░░░░░░░░░░                                │
│               (50% progress)                                           │
│                                                                        │
│  [1-6] Jump to step    [←→] Navigate    [Esc] Close                   │
│                                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

- Flechas grandes y prominentes
- Indicador de progreso visual con barra
- Step label descriptivo
- Hotkey hints en la parte inferior
