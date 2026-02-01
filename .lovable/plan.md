
# Show Rent Growth & Service Charges Next to Rental Yield

## Current State

In the configurator's **RentSection.tsx**:
- **Rental Yield** slider is visible (primary control)
- **Rent Growth Rate** is hidden inside an "Advanced" collapsible section

In **PropertySection.tsx**:
- **Service Charge per sqft** is shown in the top metrics row

## Proposed Changes

Move both **Rent Growth Rate** and **Service Charge** to be displayed inline with Rental Yield in the Long-Term Rental section, creating a compact "triplet" of related rental inputs.

### New Layout for Long-Term Rental Section

```
┌──────────────────────────────────────────────────────────────┐
│  🏠 Long-Term Rental                              [toggle]   │
├──────────────────────────────────────────────────────────────┤
│  Annual Rental Yield                              8%         │
│  [═══════════════════════●══════════]                        │
│                                                              │
│  ┌─────────────────────┐ ┌─────────────────────┐             │
│  │ Rent Growth   4%/yr │ │ Service    18 AED   │             │
│  │ [══●═══]            │ │ Charge  [__18__]sqft│             │
│  └─────────────────────┘ └─────────────────────┘             │
│                                                              │
│  Year 1 Rent                            AED 64,000           │
│  AED 5,333/month                                             │
└──────────────────────────────────────────────────────────────┘
```

### Benefits
1. All rental-related inputs grouped together logically
2. No hidden controls - important parameters visible at a glance
3. Service charges move from PropertySection header to where they contextually belong (affecting net rent)
4. Removes the "Advanced" collapsible for Long-Term rental (since there's only one item in it)

---

## Technical Implementation

### File: `src/components/roi/configurator/RentSection.tsx`

**Changes:**
1. Remove the `Collapsible` wrapper for Long-Term Advanced settings
2. Add Rent Growth slider inline (compact inline style with small slider + value)
3. Add Service Charge input inline next to Rent Growth
4. Create a compact 2-column grid for these secondary inputs

**Code structure (simplified):**
```tsx
{longTermEnabled && (
  <div className="space-y-3 pt-2 border-t border-theme-border">
    {/* Rental Yield - Primary */}
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label>Annual Rental Yield</label>
        <span>{inputs.rentalYieldPercent}%</span>
      </div>
      <Slider value={[inputs.rentalYieldPercent]} ... />
    </div>

    {/* NEW: Rent Growth + Service Charge - Secondary Row */}
    <div className="grid grid-cols-2 gap-3">
      {/* Rent Growth */}
      <div className="flex items-center justify-between p-2 bg-theme-bg-alt rounded-lg">
        <div className="flex items-center gap-1">
          <ArrowUp className="w-3 h-3 text-green-400" />
          <span className="text-xs text-theme-text-muted">Growth</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Slider value={[inputs.rentGrowthRate ?? 4]} min={0} max={10} ... />
          <span className="text-xs text-green-400 font-mono">{inputs.rentGrowthRate ?? 4}%</span>
        </div>
      </div>

      {/* Service Charge */}
      <div className="flex items-center justify-between p-2 bg-theme-bg-alt rounded-lg">
        <div className="flex items-center gap-1">
          <span className="text-xs text-theme-text-muted">Svc Charge</span>
        </div>
        <div className="flex items-center gap-1">
          <Input 
            value={inputs.serviceChargePerSqft || ''} 
            onChange={...}
            className="w-12 h-6 text-right"
          />
          <span className="text-[10px] text-theme-text-muted">/sqft</span>
        </div>
      </div>
    </div>

    {/* Year 1 Rent Display */}
    <div className="p-2.5 bg-theme-bg-alt rounded-lg border border-theme-accent/20">
      ...
    </div>
  </div>
)}
```

### File: `src/components/roi/configurator/PropertySection.tsx`

**Changes:**
1. Remove the service charge input from the header metrics row (lines 106-131)
2. Keep only price/sqft in the metrics row (if unit size is set)

---

## Summary of Changes

| File | Action |
|------|--------|
| `RentSection.tsx` | Add Rent Growth + Service Charge inline with Rental Yield, remove Advanced collapsible |
| `PropertySection.tsx` | Remove service charge from header metrics row |

This creates a cleaner UX where all rental income factors (yield, growth, service charges) are visible together in one section.
