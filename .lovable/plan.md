
# Plan: Comparador Off-Plan vs Secundaria - Versión Completa

## Resumen de Requerimientos Adicionales

El usuario ha añadido las siguientes especificaciones:

1. **Ambas propiedades pueden rentarse en Airbnb** - Necesitamos comparación Long-Term vs Short-Term para AMBAS
2. **Mostrar si la renta cubre la hipoteca** - Para ambos tipos y ambos modos de renta (LT y ST)
3. **Mostrar "out of pocket" del off-plan** - Capital requerido durante construcción antes de recibir ingresos
4. **Indicadores resumidos muy claros** - Tarjetas con KPIs que muestren rápidamente lo más importante
5. **Objetivo principal**: Demostrar lo beneficioso que es off-plan como inversión

---

## Arquitectura de la Solución

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OFF-PLAN vs SECONDARY ANALYZER                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐         │
│  │        OFF-PLAN             │    │        SECONDARY            │         │
│  │    (From Saved Quote)       │    │    (Simulator Input)        │         │
│  ├─────────────────────────────┤    ├─────────────────────────────┤         │
│  │ ✓ Payment plan distributed  │    │ ✗ Full capital upfront     │         │
│  │ ✓ 12-8-4% appreciation      │    │ ✗ 2-4% appreciation        │         │
│  │ ✗ Rent starts at handover   │    │ ✓ Rent from Day 1          │         │
│  │ ✓ Lower equity exposure     │    │ ✗ High capital at risk     │         │
│  │ ✓ Long-Term + Airbnb        │    │ ✓ Long-Term + Airbnb       │         │
│  │ ✓ Mortgage optional         │    │ ✓ Mortgage optional        │         │
│  └─────────────────────────────┘    └─────────────────────────────┘         │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    🏆 WINNER SUMMARY CARDS                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ Capital  │ │ Wealth   │ │ Cashflow │ │ Mortgage │ │ Risk     │   │   │
│  │  │ Deployed │ │ Year 10  │ │ Year 1   │ │ Coverage │ │ Profile  │   │   │
│  │  │ OFF-PLAN │ │ OFF-PLAN │ │ SECONDARY│ │ DEPENDS  │ │ OFF-PLAN │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sección 1: KPI Summary Cards (Lo Más Importante Rápido)

### Tarjetas de Resumen con Ganador Destacado

| Tarjeta | Métrica | Off-Plan Wins If... | Secondary Wins If... |
|---------|---------|--------------------|-----------------------|
| **💰 Capital Inicial** | Capital requerido Mes 0 | Menor (solo downpayment) | Mayor (100% o 40% equity) |
| **📈 Riqueza Año 10** | Equity + Apreciación | Mayor (alta apreciación) | Menor (baja apreciación) |
| **💸 Cashflow Año 1** | Ingreso neto anual | 0 (en construcción) | Positivo (desde Day 1) |
| **🏦 Cobertura Hipoteca LT** | Renta LT ÷ Pago Mensual | DSCR tras handover | DSCR inmediato |
| **🏠 Cobertura Hipoteca ST** | Renta Airbnb ÷ Pago | Mayor yield potencial | Mayor yield potencial |
| **⚠️ Out of Pocket OP** | Capital sin retorno durante construcción | Muestra monto exacto | N/A |

### Diseño Visual de Tarjeta
```text
┌─────────────────────────────────┐
│ 💰 Capital Inicial              │
│                                 │
│  OFF-PLAN        SECONDARY      │
│  AED 400K   vs   AED 1.2M       │
│  ▓▓▓▓░░░░░░     ▓▓▓▓▓▓▓▓▓▓     │
│                                 │
│  ✓ OFF-PLAN GANA               │
│  "3x menos capital inicial"     │
└─────────────────────────────────┘
```

---

## Sección 2: Rental Strategy Comparison (LT vs ST para Ambos)

### Para Cada Propiedad Mostrar:

**Long-Term Rental**
- Renta Mensual Neta
- Yield sobre Inversión
- ¿Cubre Hipoteca? (DSCR)
- Cashflow Mensual (post-mortgage)

**Short-Term Rental (Airbnb)**
- ADR × Ocupación → Bruto Anual
- − Gastos Operativos (25-30%)
- − Management Fee (15-20%)
- = Renta Neta Anual
- ¿Cubre Hipoteca? (DSCR)
- Cashflow Mensual (post-mortgage)

### Matriz de Cobertura de Hipoteca
```text
                    │ OFF-PLAN (post-HO) │ SECONDARY (Day 1)  │
────────────────────┼────────────────────┼────────────────────┤
Long-Term Rent      │ DSCR 0.85x ⚠️     │ DSCR 1.15x ✓      │
Airbnb (70% occ)    │ DSCR 1.20x ✓      │ DSCR 1.45x ✓✓     │
Airbnb (60% occ)    │ DSCR 1.03x ≈      │ DSCR 1.24x ✓      │
────────────────────┴────────────────────┴────────────────────┘
```

---

## Sección 3: Out-of-Pocket Analysis (Off-Plan Focus)

### Timeline de Pagos sin Retorno

```text
Capital "Muerto" (Sin Ingresos)
│
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░
│  │← Construcción (sin renta) →│← Renta Comienza →│
│
│  Mes 0    Mes 6    Mes 12   Mes 18   Mes 24  Mes 30
│  AED 400K  +50K    +50K     +50K     +450K   RENT!
│
│  Total "Out of Pocket" antes de ingresos: AED 1,000,000
│  Tiempo sin retorno: 24 meses
│  Pero... Propiedad ya vale: AED 1,250,000 (+25%)
└────────────────────────────────────────────────────────►
```

### Métricas Clave:
- **Capital Expuesto Máximo**: Total pagado antes de handover
- **Meses Sin Ingreso**: Desde booking hasta primera renta
- **Apreciación "Invisible"**: Valor ganado durante espera
- **Equity Trabajando**: La propiedad aprecia aunque no genere cash

---

## Sección 4: Wealth Trajectory Chart (10 Años)

### Gráfico Principal: Valor Total Acumulado

```text
Total Wealth (Property Value + Cumulative Rent - Capital Invested)

  AED 4M │                                    ●───── OFF-PLAN
         │                                ●
         │                            ●         ●── SECONDARY
         │                        ●         ●
  AED 2M │                    ●       ●         
         │                ●       ●               ← Crossover Point
         │            ●   ●                         (Year 4-5)
         │        ●   ●                           
         │    ●   ●                               
  AED 0  │──●───●─────────────────────────────────────────────
         0   1   2   3   4   5   6   7   8   9   10  Years
              ↑
         Handover (Off-Plan comienza a generar renta)
```

### Leyenda del Gráfico:
- **OFF-PLAN**: Línea principal (verde/lima)
- **SECONDARY**: Línea secundaria (cyan)
- **CROSSOVER POINT**: Donde off-plan supera a secondary
- **Área Sombreada**: Período de construcción sin ingresos

---

## Sección 5: Mortgage Stress Test (Ambos Escenarios)

### Panel de Cobertura
```text
┌─────────────────────────────────────────────────────────────────┐
│                    MORTGAGE COVERAGE ANALYSIS                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OFF-PLAN (Post-Handover)          SECONDARY (Immediate)        │
│  ─────────────────────────         ─────────────────────        │
│  Loan: AED 720,000 (60%)           Loan: AED 720,000 (60%)      │
│  Monthly: AED 3,850                Monthly: AED 3,850           │
│                                                                  │
│  Long-Term Rent:                   Long-Term Rent:               │
│  ├─ Income: AED 3,280              ├─ Income: AED 5,600         │
│  ├─ Gap: -AED 570 ⚠️               ├─ Surplus: +AED 1,750 ✓     │
│  └─ DSCR: 0.85x                    └─ DSCR: 1.45x               │
│                                                                  │
│  Airbnb (70% occ):                 Airbnb (70% occ):            │
│  ├─ Income: AED 4,620              ├─ Income: AED 7,200         │
│  ├─ Surplus: +AED 770 ✓            ├─ Surplus: +AED 3,350 ✓✓    │
│  └─ DSCR: 1.20x                    └─ DSCR: 1.87x               │
│                                                                  │
│  📊 CONCLUSION:                                                  │
│  "Secondary cubre mejor la hipoteca, pero Off-Plan genera       │
│   3x más riqueza en 10 años por mayor apreciación"              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sección 6: Head-to-Head Metrics Table

### Tabla Comparativa Detallada

| Métrica | OFF-PLAN | SECONDARY | Ganador |
|---------|----------|-----------|---------|
| **CAPITAL** ||||
| Capital Día 1 | AED 400,000 | AED 1,200,000 | 🏆 OFF-PLAN |
| Capital Total (5 años) | AED 1,050,000 | AED 1,200,000 | 🏆 OFF-PLAN |
| **APRECIACIÓN** ||||
| Tasa Construcción | 12% CAGR | N/A | 🏆 OFF-PLAN |
| Tasa Post-Handover | 8% → 4% | 3% | 🏆 OFF-PLAN |
| Valor Año 5 | AED 1,800,000 | AED 1,390,000 | 🏆 OFF-PLAN |
| Valor Año 10 | AED 2,500,000 | AED 1,610,000 | 🏆 OFF-PLAN |
| **CASHFLOW** ||||
| Renta Año 1 (LT) | AED 0 | AED 67,200 | 🏆 SECONDARY |
| Renta Año 1 (Airbnb) | AED 0 | AED 86,400 | 🏆 SECONDARY |
| Renta Año 5 (LT) | AED 95,000 | AED 78,000 | 🏆 OFF-PLAN |
| Renta Acumulada 10Y | AED 850,000 | AED 750,000 | 🏆 OFF-PLAN |
| **HIPOTECA** ||||
| DSCR Long-Term | 0.85x | 1.45x | 🏆 SECONDARY |
| DSCR Airbnb | 1.20x | 1.87x | 🏆 SECONDARY |
| Cobertura LT | 85% | 145% | 🏆 SECONDARY |
| **RIQUEZA TOTAL** ||||
| Wealth Año 5 | AED 950,000 | AED 490,000 | 🏆 OFF-PLAN |
| Wealth Año 10 | AED 2,300,000 | AED 1,160,000 | 🏆 OFF-PLAN |
| ROE Anualizado | 32% | 8% | 🏆 OFF-PLAN |

---

## Modelo de Datos

### SecondaryInputs (Simulador Ligero)
```typescript
interface SecondaryInputs {
  // Property
  purchasePrice: number;           // AED
  unitSizeSqf: number;             // For service charges
  closingCostsPercent: number;     // Default 6% (DLD 4% + Agent 2%)
  
  // Rental (Long-Term)
  rentalYieldPercent: number;      // Default 7% for secondary
  rentGrowthRate: number;          // Default 3%
  
  // Rental (Short-Term/Airbnb)
  showAirbnbComparison: boolean;
  averageDailyRate: number;        // ADR
  occupancyPercent: number;        // Default 70%
  operatingExpensePercent: number; // Default 25%
  managementFeePercent: number;    // Default 15%
  adrGrowthRate: number;           // Default 3%
  
  // Appreciation (Conservative for secondary)
  appreciationRate: number;        // Default 3%
  
  // Mortgage (Optional)
  useMortgage: boolean;
  mortgageFinancingPercent: number; // Default 60%
  mortgageInterestRate: number;     // Default 4.5%
  mortgageLoanTermYears: number;    // Default 25
  
  // Operating Costs
  serviceChargePerSqft: number;    // Default 22 (secondary usually higher)
}
```

### SecondaryCalculations
```typescript
interface SecondaryCalculations {
  // Capital
  closingCosts: number;
  equityRequired: number;          // Price × (100 - financing%) + closing
  totalCapitalDay1: number;        // Equity + Closing (or full price + closing)
  
  // Long-Term Rental
  grossAnnualRentLT: number;
  serviceCharges: number;
  netAnnualRentLT: number;
  monthlyRentLT: number;
  
  // Short-Term Rental
  grossAnnualRentST: number;
  operatingExpenses: number;
  managementFees: number;
  netAnnualRentST: number;
  monthlyRentST: number;
  
  // Mortgage Analysis
  loanAmount: number;
  monthlyMortgagePayment: number;
  
  // DSCR (Debt Service Coverage Ratio)
  dscrLongTerm: number;            // monthlyRentLT / monthlyMortgagePayment
  dscrAirbnb: number;              // monthlyRentST / monthlyMortgagePayment
  
  // Monthly Cashflow (after mortgage)
  monthlyCashflowLT: number;       // Can be negative
  monthlyCashflowST: number;
  
  // Coverage Status
  coversLongTerm: boolean;         // dscrLT >= 1
  coversAirbnb: boolean;           // dscrST >= 1
  
  // 10-Year Projections
  yearlyProjections: SecondaryYearlyProjection[];
  wealthYear5: number;
  wealthYear10: number;
  cumulativeRentLT: number;
  cumulativeRentST: number;
}
```

---

## Estructura de Archivos

### Nuevos Archivos
```text
src/
├── pages/
│   └── OffPlanVsSecondary.tsx                 # Página principal
├── components/roi/secondary/
│   ├── SecondarySimulatorForm.tsx             # Form de inputs
│   ├── useSecondaryCalculations.ts            # Hook de cálculos
│   ├── ComparisonSummaryCards.tsx             # Tarjetas KPI con ganador
│   ├── RentalStrategyComparison.tsx           # LT vs ST para ambos
│   ├── MortgageCoverageMatrix.tsx             # Matriz DSCR
│   ├── OutOfPocketTimeline.tsx                # Timeline de capital muerto
│   ├── WealthTrajectoryDualChart.tsx          # Gráfico 10 años
│   ├── HeadToHeadTable.tsx                    # Tabla comparativa
│   └── ComparisonVerdict.tsx                  # Conclusión final
└── hooks/
    └── useOffPlanVsSecondaryComparison.ts     # Hook maestro
```

### Modificaciones
- `src/App.tsx` - Nueva ruta `/offplan-vs-secondary/:quoteId?`
- `src/components/layout/PageHeader.tsx` - Shortcut opcional

---

## Flujo de Usuario

1. **Navegación**: Desde un quote guardado, click "Compare vs Secondary"
2. **Carga**: El off-plan se carga automáticamente del quote
3. **Configuración**: Usuario ajusta parámetros del secundario hipotético
   - Precio similar o diferente
   - Yield típico de secundarias (6-8%)
   - Apreciación conservadora (2-4%)
   - Opción Airbnb para ambos
   - Mortgage opcional para ambos
4. **Análisis**: Dashboard muestra comparación completa
5. **Conclusión**: Panel de veredicto destaca el ganador según perfil

---

## Veredicto Final Panel

```text
┌─────────────────────────────────────────────────────────────────┐
│ 🏆 CONCLUSIÓN DEL ANÁLISIS                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  "OFF-PLAN es la mejor opción para construcción de              │
│   riqueza a largo plazo"                                         │
│                                                                  │
│  ✓ 2x más riqueza en 10 años (AED 2.3M vs AED 1.2M)             │
│  ✓ 70% menos capital inicial requerido                          │
│  ✓ 32% ROE anualizado vs 8%                                      │
│                                                                  │
│  ⚠️ Trade-off: 24 meses sin cashflow durante construcción        │
│                                                                  │
│  💡 RECOMENDACIÓN:                                               │
│  Si puedes cubrir el período de construcción sin depender       │
│  de ingresos inmediatos, OFF-PLAN ofrece retornos               │
│  significativamente superiores.                                  │
│                                                                  │
│  Si necesitas cashflow inmediato para cubrir gastos o           │
│  hipoteca, SECONDARY proporciona ingresos desde el día 1.       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementación por Fases

**Fase 1 - Core (Esta Iteración)**
- Página básica con inputs de secundaria
- Cálculos LT + ST para secundaria
- Tarjetas KPI de resumen
- Tabla comparativa básica

**Fase 2 - Visualizaciones**
- Gráfico de trayectoria de riqueza
- Timeline de out-of-pocket
- Matriz de cobertura de hipoteca

**Fase 3 - Polish**
- Veredicto con IA
- Exportación PDF
- Guardado de escenarios

---

## Reutilización de Código

El comparador aprovechará:
- `useOICalculations` - Para off-plan (ya existente)
- `useMortgageCalculations` - Para ambos (ya existente)
- `formatDualCurrency` - Para valores monetarios
- `CompactRentCard` logic - Para cálculos de Airbnb
- `SafetyBufferPanel` - Para visualización de DSCR
- Theming existente - Consistencia visual
- Traducciones EN/ES - Internacionalización

