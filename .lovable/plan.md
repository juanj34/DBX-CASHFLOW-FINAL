
# Plan: Improve Rental Yield & Rent Growth Controls

## Problem Summary

The user reports three issues in the RentSection configurator:
1. **Annual Yield input box too small** - doesn't show decimals properly (`w-14` = 56px)
2. **Drag bars (sliders) are very small** - currently `w-20` (80px)
3. **Rent Growth lacks decimal support and looks different** - has no input box like Annual Yield

## Current State Analysis

**Annual Yield (lines 88-107):**
```tsx
<Slider ... step={0.1} className="w-20 roi-slider-lime" />
<Input ... className="w-14 h-7 ..." />  // 56px - too small
<span>%</span>
```

**Rent Growth (lines 117-127):**
```tsx
<Slider ... step={0.5} className="w-20 roi-slider-lime" />
<span className="w-12 ...">{inputs.rentGrowthRate ?? 4}%</span>  // Just text, no input
```

## Solution

Make both controls consistent with:
- Wider sliders (`w-24` = 96px instead of `w-20` = 80px)
- Wider input boxes (`w-16` = 64px instead of `w-14` = 56px)
- Add input box to Rent Growth for decimal entry (matching Annual Yield pattern)
- Step of 0.1 for both to support decimals
- Display with 1 decimal place

## Implementation Details

### File: `src/components/roi/configurator/RentSection.tsx`

**1. Add handler for rent growth decimal input:**
```tsx
const handleRentGrowthChange = (value: string) => {
  const num = parseFloat(value);
  if (!isNaN(num) && num >= 0 && num <= 15) {
    setInputs(prev => ({ ...prev, rentGrowthRate: Math.round(num * 10) / 10 }));
  }
};
```

**2. Update Annual Yield controls:**
- Slider: `w-20` to `w-24`
- Input: `w-14` to `w-16`
- Step: keep at 0.1

**3. Update Rent Growth controls:**
- Add Input component matching Annual Yield style
- Slider: `w-20` to `w-24` 
- Step: 0.5 to 0.1 for finer decimal control
- Remove the plain span display

### Before vs After

**Annual Yield:**
```
Before: [====slider(80px)====] [14px box] %
After:  [======slider(96px)======] [16px box] %
```

**Rent Growth:**
```
Before: [====slider(80px)====] 4.0%
After:  [======slider(96px)======] [16px box] %
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/configurator/RentSection.tsx` | Update slider widths, input widths, add input box for rent growth |
