
# Fix AI Payment Plan Extractor & Move to First Configurator Step

## Problem Summary

1. **Edge Function 400 Error**: The AI gateway returns "Invalid content" because PDFs are being sent in an unsupported format (`type: "file"`)
2. **Wrong Position**: The AI extractor is currently in the Payment section (step 4), but should be in the Client section (step 1) to auto-fill ALL fields early
3. **Missing Currency Detection**: The AI doesn't extract currency information (usually AED)

---

## Root Cause Analysis

### Error: "Invalid content"

Looking at the edge function code (lines 243-258):

```typescript
// Check if it's a PDF
if (mediaType === "application/pdf") {
  contentParts.push({
    type: "file",  // ❌ NOT SUPPORTED by Lovable AI Gateway
    file: {
      filename: `page_${i + 1}.pdf`,
      file_data: base64Data,
    }
  });
}
```

The Lovable AI Gateway only supports `image_url` content type for vision models, not `file`. PDFs need to be either:
- Converted to images first (render each page as PNG)
- OR sent as inline PDF using the proper format

**Solution**: For PDFs, we need to use `image_url` with the data URL format since Gemini models can process inline PDFs via the vision API.

---

## Changes Required

### 1. Fix Edge Function (`supabase/functions/extract-payment-plan/index.ts`)

**Fix PDF handling to use proper format:**
```typescript
// For ALL files (images AND PDFs), use image_url format
contentParts.push({
  type: "image_url",
  image_url: {
    url: imageData.startsWith("data:") ? imageData : `data:${mediaType};base64,${base64Data}`
  }
});
```

**Add currency extraction to the tool schema:**
```typescript
// In property extraction
currency: { 
  type: "string", 
  enum: ["AED", "USD", "EUR", "GBP"],
  description: "Currency detected in the document (default: AED)" 
}
```

**Update system prompt to prioritize property info extraction:**
```
EXTRACTION PRIORITIES (in order):
1. Property info (developer, project name, unit details, price, currency)
2. Payment percentages (MUST sum to 100%)
3. Payment triggers (month number or construction milestone)
4. Dates (handover quarter/year)
```

---

### 2. Update Types (`src/lib/paymentPlanTypes.ts`)

Add currency to `ExtractedProperty`:
```typescript
export interface ExtractedProperty {
  developer?: string;
  projectName?: string;
  unitNumber?: string;
  unitType?: string;
  unitSizeSqft?: number;
  basePrice?: number;
  currency?: 'AED' | 'USD' | 'EUR' | 'GBP';  // NEW
}
```

---

### 3. Move AI Extractor to Client Section

**Current flow:**
```
Client → Property → Images → Payment (AI Extractor here) → ...
```

**New flow:**
```
Client (AI Extractor at top) → Property → Images → Payment → ...
```

**Files to modify:**

#### `src/components/roi/configurator/ClientSection.tsx`
- Add AI Import button at the top
- Import `PaymentPlanExtractor`
- Handle extraction results to populate:
  - Developer name
  - Project name
  - Unit number
  - Unit type
  - Unit size
  - Base price
  - Payment plan
  - Handover dates
  - Currency

#### `src/components/roi/configurator/PaymentSection.tsx`
- Keep the AI Import button as a secondary option
- But primary use case will be from Client section

---

### 4. Update Extraction Handler

Create a comprehensive handler that populates ALL fields from extraction:

```typescript
const handleAIExtraction = (data: ExtractedPaymentPlan) => {
  // Update client info
  if (setClientInfo) {
    setClientInfo(prev => ({
      ...prev,
      developer: data.property?.developer || prev.developer,
      projectName: data.property?.projectName || prev.projectName,
      unit: data.property?.unitNumber || prev.unit,
      unitType: data.property?.unitType || prev.unitType,
      unitSizeSqf: data.property?.unitSizeSqft || prev.unitSizeSqf,
      unitSizeM2: data.property?.unitSizeSqft ? Math.round(data.property.unitSizeSqft * 0.0929) : prev.unitSizeM2,
    }));
  }
  
  // Update inputs (property, payment, dates)
  setInputs(prev => ({
    ...prev,
    basePrice: data.property?.basePrice || prev.basePrice,
    downpaymentPercent: /* extracted */,
    preHandoverPercent: /* from split */,
    additionalPayments: /* converted installments */,
    handoverQuarter: data.paymentStructure.handoverQuarter || prev.handoverQuarter,
    handoverYear: data.paymentStructure.handoverYear || prev.handoverYear,
    hasPostHandoverPlan: data.paymentStructure.hasPostHandover,
  }));
  
  // Navigate to next section or show success
};
```

---

### 5. Update ExtractedDataPreview

The preview already allows editing property info, but ensure it's prominently displayed when detected.

Make Property Info section **open by default** when data is detected:
```typescript
const [showPropertyInfo, setShowPropertyInfo] = useState(
  !!data.property?.developer || 
  !!data.property?.projectName ||
  !!data.property?.basePrice  // NEW: Also open if price detected
);
```

---

## File Summary

| File | Changes |
|------|---------|
| `supabase/functions/extract-payment-plan/index.ts` | Fix PDF format, add currency extraction, improve prompts |
| `src/lib/paymentPlanTypes.ts` | Add `currency` to `ExtractedProperty` |
| `src/components/roi/configurator/ClientSection.tsx` | Add AI Import button and handler |
| `src/components/roi/configurator/ConfiguratorLayout.tsx` | Pass `setClientInfo` to ClientSection for AI updates |
| `src/components/roi/configurator/ExtractedDataPreview.tsx` | Open property section by default when data exists |

---

## Visual Layout Change

**Client Section (NEW):**
```
┌──────────────────────────────────────────────────────────┐
│ Client Details                          [🪄 AI Import]   │
├──────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐  │
│ │ Upload a brochure or payment plan to auto-fill all  │  │
│ │ quote details including developer, unit info, and   │  │
│ │ payment schedule.                                   │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ Developer:  [                    ]                       │
│ Project:    [                    ]                       │
│ Unit Type:  [Select...]     Zone: [Select...]           │
│ ...                                                      │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Order

1. Fix edge function PDF handling (critical - currently broken)
2. Add currency to types and extraction schema
3. Update extraction system prompt
4. Move AI Import button to ClientSection
5. Update ConfiguratorLayout to pass setClientInfo
6. Test with PDF upload
