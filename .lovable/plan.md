

# Plan: Floating Edit Button + TopNavbar en Todos los Módulos

## Resumen

Este plan aborda dos solicitudes:

1. **Desbloquear el botón flotante de configuración** en las vistas de presentación para poder editar quotes directamente desde la presentación sin navegar a otra página
2. **Agregar la barra de navegación superior (TopNavbar)** a todos los módulos de la aplicación para navegación consistente entre herramientas

---

## Parte 1: Botón Flotante de Edición en Presentaciones

### Problema Actual
El botón flotante (Settings icon) solo aparece en `OICalculator.tsx`. En `PresentationView.tsx` y `PresentationPreview.tsx`, el botón está "bloqueado" porque:
- No se pasa la prop `onEditClick` a `SnapshotContent`
- No existe el `OIInputModal` en esas vistas
- Los quotes se cargan desde `cashflow_quotes_public` (vista pública)

### Solución

#### 1. Agregar Estado de Edición a PresentationView.tsx

| Archivo | Cambios |
|---------|---------|
| `src/pages/PresentationView.tsx` | Importar `OIInputModal`, agregar estado para quote seleccionado, handler de edición |

**Cambios principales:**
```typescript
// Nuevos imports
import { OIInputModal } from "@/components/roi/OIInputModal";

// Nuevos estados
const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
const [editModalOpen, setEditModalOpen] = useState(false);
const [editInputs, setEditInputs] = useState<OIInputs | null>(null);
const [editMortgageInputs, setEditMortgageInputs] = useState<MortgageInputs>(DEFAULT_MORTGAGE_INPUTS);

// Handler para abrir edición
const handleEditQuote = (quoteId: string) => {
  const quote = allQuotes.find(q => q.id === quoteId);
  if (quote) {
    setEditingQuoteId(quoteId);
    setEditInputs(quote.inputs);
    // Cargar mortgage inputs si existen
    const savedMortgage = (quote.inputs as any)?._mortgageInputs;
    setEditMortgageInputs(savedMortgage || DEFAULT_MORTGAGE_INPUTS);
    setEditModalOpen(true);
  }
};
```

#### 2. Modificar PresentationPreview.tsx

| Archivo | Cambios |
|---------|---------|
| `src/components/presentation/PresentationPreview.tsx` | Agregar prop `onEditQuote`, pasarla a `SnapshotContent` |

**Nueva prop en interfaz:**
```typescript
interface PresentationPreviewProps {
  // ... existentes
  onEditQuote?: (quoteId: string) => void; // NUEVO
}
```

**Pasar a QuotePreview:**
```typescript
<QuotePreview 
  quoteData={quoteData}
  viewMode={viewMode}
  currency={currency}
  language={language}
  rate={rate}
  onEditClick={onEditQuote ? () => onEditQuote(currentItem.id) : undefined} // NUEVO
/>
```

#### 3. Modificar QuotePreview en PresentationPreview.tsx

Agregar prop `onEditClick` y pasarla a `SnapshotContent`:

```typescript
const QuotePreview = ({ 
  quoteData, 
  viewMode,
  currency,
  language,
  rate,
  onEditClick, // NUEVO
}: { 
  // ... tipos existentes
  onEditClick?: () => void; // NUEVO
}) => {
  // ...
  
  if (viewMode === 'snapshot') {
    return (
      <SnapshotContent
        // ... props existentes
        onEditClick={onEditClick} // PASAR LA PROP
      />
    );
  }
  // ...
};
```

#### 4. Guardar Cambios Desde la Presentación

Cuando el usuario edite y guarde desde el modal en la presentación:

```typescript
// En PresentationView.tsx
const handleSaveEdit = async () => {
  if (!editingQuoteId || !editInputs) return;
  
  // Guardar en la base de datos
  const { error } = await supabase
    .from('cashflow_quotes')
    .update({ 
      inputs: {
        ...editInputs,
        _mortgageInputs: editMortgageInputs,
      }
    })
    .eq('id', editingQuoteId);
    
  if (!error) {
    // Actualizar el quote local
    setAllQuotes(prev => prev.map(q => 
      q.id === editingQuoteId 
        ? { ...q, inputs: editInputs }
        : q
    ));
    setEditModalOpen(false);
    toast.success('Quote updated');
  }
};
```

---

## Parte 2: TopNavbar en Todos los Módulos

### Situación Actual

| Página | Tiene TopNavbar | Tipo de Layout |
|--------|-----------------|----------------|
| `Home.tsx` | ✅ Sí | TopNavbar directo |
| `OffPlanVsSecondary.tsx` | ✅ Sí | TopNavbar directo |
| `QuotesDashboard.tsx` | ❌ No | PageHeader |
| `QuotesCompare.tsx` | ❌ No | PageHeader |
| `QuotesAnalytics.tsx` | ❌ No | PageHeader |
| `ClientsManager.tsx` | ❌ No | PageHeader |
| `PresentationsHub.tsx` | ❌ No | Custom header |
| `OICalculator.tsx` | ❌ No | DashboardLayout + sidebar |
| `CashflowDashboard.tsx` | ❌ No | DashboardLayout + sidebar |
| `PresentationView.tsx` | ❌ No | Custom sidebar |
| `PresentationBuilder.tsx` | ❌ No | Custom sidebar |

### Solución: Reemplazar PageHeader con TopNavbar

#### Estrategia
1. **Páginas con PageHeader** → Reemplazar por `TopNavbar`
2. **Páginas con DashboardLayout** → Agregar `TopNavbar` arriba del layout
3. **Vistas de Presentación** → Agregar `TopNavbar` con modo "viewer" (sin opciones de perfil si es público)

#### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/QuotesDashboard.tsx` | Importar `TopNavbar`, reemplazar `PageHeader` |
| `src/pages/QuotesCompare.tsx` | Importar `TopNavbar`, reemplazar `PageHeader` |
| `src/pages/QuotesAnalytics.tsx` | Importar `TopNavbar`, reemplazar `PageHeader` |
| `src/pages/ClientsManager.tsx` | Importar `TopNavbar`, reemplazar `PageHeader` |
| `src/pages/PresentationsHub.tsx` | Importar `TopNavbar`, agregar al layout |
| `src/pages/OICalculator.tsx` | Agregar `TopNavbar` arriba de `DashboardLayout` |
| `src/pages/CashflowDashboard.tsx` | Agregar `TopNavbar` arriba de `DashboardLayout` |
| `src/pages/PresentationBuilder.tsx` | Agregar `TopNavbar` arriba del layout |
| `src/pages/PresentationView.tsx` | Agregar `TopNavbar` con props para modo público |
| `src/pages/Map.tsx` | Agregar `TopNavbar` |

#### Ejemplo de Migración (QuotesDashboard.tsx)

**Antes:**
```tsx
import { PageHeader, defaultShortcuts } from '@/components/layout/PageHeader';

// En el return:
<PageHeader 
  title="All Opportunities"
  shortcuts={defaultShortcuts}
  // ...
/>
```

**Después:**
```tsx
import { TopNavbar } from '@/components/layout/TopNavbar';

// En el return:
<div className="min-h-screen bg-theme-bg">
  <TopNavbar />
  <div className="container mx-auto px-4 py-6">
    {/* contenido existente */}
  </div>
</div>
```

#### TopNavbar para Vistas Públicas (PresentationView)

Agregar props opcionales para modo público:

```typescript
interface TopNavbarProps {
  showNewQuote?: boolean;
  currency?: Currency;
  setCurrency?: (currency: Currency) => void;
  isPublicView?: boolean; // NUEVO - oculta avatar y sign out
  showBackButton?: boolean; // NUEVO - para navegación contextual
}
```

---

## Archivos a Crear/Modificar

### Archivos a Modificar

| Archivo | Descripción del Cambio |
|---------|------------------------|
| `src/components/layout/TopNavbar.tsx` | Agregar `isPublicView` prop para vistas sin auth |
| `src/components/presentation/PresentationPreview.tsx` | Agregar `onEditQuote` prop, pasarla a SnapshotContent |
| `src/pages/PresentationView.tsx` | Agregar TopNavbar, OIInputModal, handler de edición |
| `src/pages/PresentationBuilder.tsx` | Agregar TopNavbar arriba del layout |
| `src/pages/OICalculator.tsx` | Envolver con TopNavbar |
| `src/pages/CashflowDashboard.tsx` | Envolver con TopNavbar |
| `src/pages/QuotesDashboard.tsx` | Reemplazar PageHeader con TopNavbar |
| `src/pages/QuotesCompare.tsx` | Reemplazar PageHeader con TopNavbar |
| `src/pages/QuotesAnalytics.tsx` | Reemplazar PageHeader con TopNavbar |
| `src/pages/ClientsManager.tsx` | Reemplazar PageHeader con TopNavbar |
| `src/pages/PresentationsHub.tsx` | Agregar TopNavbar |
| `src/pages/Map.tsx` | Agregar TopNavbar |

---

## Flujo de Edición desde Presentación

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                            PresentationView                             │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                          TopNavbar                                  ││
│  │  [Logo] [Generator] [Quotes] [Compare] [Presentations] [...]        ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌────────────────┐  ┌────────────────────────────────────────────────┐│
│  │   Sidebar      │  │              Quote Snapshot                    ││
│  │   - Quote 1    │  │                                                ││
│  │   - Quote 2    │  │                                                ││
│  │   - Compare    │  │                                  ┌─────────┐   ││
│  │                │  │                                  │⚙️ Edit  │   ││
│  │                │  │                                  └─────────┘   ││
│  └────────────────┘  └────────────────────────────────────────────────┘│
│                                         ↓ Click Edit                    │
│                            ┌─────────────────────────┐                 │
│                            │   OIInputModal (6-step) │                 │
│                            │   ┌─────────────────┐   │                 │
│                            │   │ Edit all params │   │                 │
│                            │   │ Save → DB update│   │                 │
│                            │   └─────────────────┘   │                 │
│                            └─────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Consideraciones de Seguridad

1. **Permisos de Edición**: Solo el propietario del quote o el broker de la presentación puede editar
2. **Verificación de Sesión**: Antes de mostrar el botón de editar, verificar que el usuario está autenticado
3. **Actualización en Tiempo Real**: Después de guardar, el snapshot se actualiza con los nuevos valores

---

## Testing

1. Abrir una presentación como broker autenticado
2. Verificar que aparece el botón flotante de edición en cada quote
3. Hacer clic → se abre el modal de configuración
4. Modificar valores y guardar
5. Verificar que el snapshot se actualiza con los nuevos valores
6. Verificar que la TopNavbar aparece en todas las páginas y funciona la navegación

