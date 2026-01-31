

# AI Payment Plan Extractor - Complete Implementation Plan

## Overview

Build an advanced AI-powered tool that extracts payment plan data from marketing materials (brochures, screenshots, PDFs - including multi-page documents) and automatically populates the cashflow configurator. The tool will intelligently handle different payment formats (monthly vs installment-based) and provide full customization before applying.

## User Experience Flow

```text
┌─────────────────────────────────────────────────────────────┐
│  PaymentSection.tsx                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✨ AI Import  │ (button in header)                  │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PaymentPlanExtractor Modal (Sheet)                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. UPLOAD ZONE                                      │   │
│  │  ┌─────────────────────────────────────────────┐     │   │
│  │  │  Drag & drop, paste (Ctrl+V), or click      │     │   │
│  │  │  to upload payment plan images/PDFs         │     │   │
│  │  │  (Supports multiple pages)                   │     │   │
│  │  └─────────────────────────────────────────────┘     │   │
│  │  [image1.png] [image2.png] [brochure.pdf]            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  2. BOOKING DATE (for calculating payment dates)    │   │
│  │  ○ Use today's date                                  │   │
│  │  ○ Use existing configurator date                   │   │
│  │  ○ Specify custom date: [Month ▼] [Year ▼]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ Extract Payment Plan ]                                   │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼ (AI Processing 3-8 seconds)
┌─────────────────────────────────────────────────────────────┐
│  ExtractedDataPreview (Editable)                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PROPERTY INFO (Optional - extracted if visible)     │   │
│  │  Developer: [Emaar ▼]   Project: [Creek Harbour]     │   │
│  │  Unit: [T1-2304]        Size: [1,250 sqft]           │   │
│  │  Type: [2BR ▼]          Price: [AED 2,500,000]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PAYMENT STRUCTURE                                   │   │
│  │  Split detected: [40/60 ▼] ✓ High confidence         │   │
│  │  Post-handover: [Yes/No ▼]                           │   │
│  │  Handover: [Q4 ▼] [2027 ▼]                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  EXTRACTED INSTALLMENTS                              │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │ # │ Type │ Trigger  │ %    │ Label         │    │   │
│  │  │ 1 │ Time │ 0 mo     │ 20%  │ Booking       │ ✓  │   │
│  │  │ 2 │ Cons │ 30%      │ 10%  │ 30% Complete  │ ✓  │   │
│  │  │ 3 │ Time │ 6 mo     │ 5%   │ Month 6       │ ⚠  │   │
│  │  │ 4 │ Time │ 12 mo    │ 5%   │ Month 12      │ ✓  │   │
│  │  │ 5 │ Hand │ Handover │ 60%  │ On Handover   │ ✓  │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  │  Total: 100% ✓                                       │   │
│  │  [+ Add Row] [Remove Selected]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CONFIDENCE SUMMARY                                  │   │
│  │  Overall: 87% ●●●●●●●●○○                             │   │
│  │  ⚠ Month 6 payment: uncertain trigger (edit above)  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ Cancel ]                    [ Apply to Configurator ]    │
└───────────────────────────────────────────────────────────────┘
```

## Technical Architecture

### 1. New Edge Function: `extract-payment-plan`

**Location:** `supabase/functions/extract-payment-plan/index.ts`

**Capabilities:**
- Accept multiple base64-encoded images/PDFs (handles 2+ page payment plans)
- Use Lovable AI Gateway with `google/gemini-3-flash-preview` (best for vision + complex reasoning)
- Structured output via tool calling for reliable JSON extraction
- Detect payment format: monthly-based vs installment-based vs construction milestone
- Identify post-handover payments by keywords and structure

**AI Prompt Strategy:**
```text
SYSTEM PROMPT:
You are a Dubai real estate payment plan analyzer. Extract structured payment data from 
marketing materials with high precision.

PAYMENT FORMATS TO RECOGNIZE:
1. TIME-BASED: "Month 1", "Month 6", "12 months", "6 months post-booking"
2. CONSTRUCTION-BASED: "On completion of 30%", "At 50% construction", "Ground floor"
3. HANDOVER-BASED: "On handover", "At completion", "Key handover"
4. POST-HANDOVER: "48 months post-handover", "2 years after completion", "5 years post-delivery"

MULTI-PAGE HANDLING:
- When given multiple images, treat them as pages of the same document
- Look for continuation patterns ("continued...", page numbers)
- Combine information from all pages into single coherent output

SPLIT DETECTION:
- Look for patterns: "40/60", "50:50", "30-70"
- Calculate from downpayment + installments if not explicit
- During Construction / On Handover patterns

POST-HANDOVER DETECTION:
- Keywords: "post-handover", "after completion", "after delivery", "post-possession"
- Payment plans extending beyond handover date
- Multiple years of payments after key handover

EXTRACTION PRIORITIES:
1. Payment percentages (highest priority - must sum to 100%)
2. Payment triggers (month/milestone)
3. Property info (if visible)
4. Dates (handover quarter/year)
```

**Tool Schema for Structured Output:**
```typescript
{
  type: "function",
  function: {
    name: "extract_payment_plan",
    description: "Extract structured payment plan from analyzed images",
    parameters: {
      type: "object",
      properties: {
        // Property Info (optional)
        property: {
          type: "object",
          properties: {
            developer: { type: "string" },
            projectName: { type: "string" },
            unitNumber: { type: "string" },
            unitType: { type: "string", enum: ["studio", "1br", "2br", "3br", "4br", "penthouse", "townhouse", "villa"] },
            unitSizeSqft: { type: "number" },
            basePrice: { type: "number" }
          }
        },
        // Payment Structure
        paymentStructure: {
          type: "object",
          properties: {
            paymentSplit: { type: "string", description: "e.g., '40/60', '50/50'" },
            hasPostHandover: { type: "boolean" },
            handoverQuarter: { type: "number", enum: [1, 2, 3, 4] },
            handoverYear: { type: "number" }
          }
        },
        // Installments
        installments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["time", "construction", "handover", "post-handover"] },
              triggerValue: { type: "number", description: "Months or construction %" },
              paymentPercent: { type: "number" },
              label: { type: "string" },
              confidence: { type: "number", description: "0-100 confidence score" }
            }
          }
        },
        // Confidence
        overallConfidence: { type: "number" },
        warnings: { type: "array", items: { type: "string" } }
      },
      required: ["installments", "overallConfidence"]
    }
  }
}
```

### 2. New UI Components

#### a) `PaymentPlanExtractor.tsx`
**Location:** `src/components/roi/configurator/PaymentPlanExtractor.tsx`

**Features:**
- Reuse existing `FileUploadZone` component for multi-file upload
- Booking date selector (today / existing / custom)
- Processing state with animated AI indicator
- Error handling with retry option

#### b) `ExtractedDataPreview.tsx`
**Location:** `src/components/roi/configurator/ExtractedDataPreview.tsx`

**Features:**
- Editable property info section
- Payment structure configuration (split, post-handover toggle)
- Sortable installment table with inline editing
- Confidence indicators (✓ green, ⚠ yellow, ✗ red)
- Running total validation (must equal 100%)
- Add/remove installment rows

#### c) Type Definitions
**Location:** `src/lib/paymentPlanTypes.ts`

```typescript
export interface ExtractedPaymentPlan {
  property?: {
    developer?: string;
    projectName?: string;
    unitNumber?: string;
    unitType?: string;
    unitSizeSqft?: number;
    basePrice?: number;
  };
  paymentStructure: {
    paymentSplit?: string;
    hasPostHandover: boolean;
    handoverQuarter?: number;
    handoverYear?: number;
  };
  installments: ExtractedInstallment[];
  overallConfidence: number;
  warnings: string[];
}

export interface ExtractedInstallment {
  id: string;
  type: 'time' | 'construction' | 'handover' | 'post-handover';
  triggerValue: number;
  paymentPercent: number;
  label?: string;
  confidence: number;
  isPostHandover?: boolean;
}
```

### 3. Integration Points

#### a) PaymentSection.tsx Modifications
- Add "✨ AI Import" button in header area
- Open `PaymentPlanExtractor` as a Sheet/Modal on click
- Handle extracted data callback to populate:
  - `downpaymentPercent`
  - `preHandoverPercent`
  - `additionalPayments[]`
  - `hasPostHandoverPlan`
  - Date fields (if extracted)

#### b) ConfiguratorLayout.tsx Modifications
- Pass `setClientInfo` callback to PaymentSection for property auto-fill
- Handle cross-section updates from AI extraction

#### c) ClientSection.tsx / PropertySection.tsx
- Accept optional pre-fill data from extraction
- Auto-select developer/project if matched in database

### 4. Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/extract-payment-plan/index.ts` | AI extraction edge function |
| `src/components/roi/configurator/PaymentPlanExtractor.tsx` | Upload + extraction UI |
| `src/components/roi/configurator/ExtractedDataPreview.tsx` | Editable preview component |
| `src/lib/paymentPlanTypes.ts` | Shared TypeScript types |

### 5. Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add `extract-payment-plan` function config |
| `src/components/roi/configurator/PaymentSection.tsx` | Add AI Import button, handle extraction callback |
| `src/components/roi/configurator/ConfiguratorLayout.tsx` | Pass callbacks for cross-section updates |

## Edge Cases Handled

| Scenario | Solution |
|----------|----------|
| Multiple pages | Combine all images in single AI request, AI treats as one document |
| Monthly vs installment formats | AI detects format and converts to consistent `additionalPayments[]` |
| No explicit dates shown | Use booking date option + handover defaults |
| Arabic + English mixed | Gemini handles multilingual content |
| Post-handover detection | Keywords + structural analysis (payments after handover date) |
| Construction milestones | Converted to `type: 'construction'` with percentage trigger |
| Partial data | Show warnings, let user fill gaps before applying |
| Low confidence | Yellow/red indicators, require user confirmation |
| Total ≠ 100% | Validation error, prevent apply until corrected |

## Implementation Steps

### Phase 1: Edge Function
1. Create `extract-payment-plan` edge function
2. Implement multi-image handling
3. Configure AI prompt with tool calling
4. Add error handling and logging
5. Test with sample payment plan images

### Phase 2: Core UI
1. Create type definitions
2. Build `PaymentPlanExtractor` component with file upload
3. Build `ExtractedDataPreview` with editable table
4. Integrate booking date selector

### Phase 3: Integration
1. Add AI Import button to PaymentSection
2. Wire up extraction callback
3. Implement cross-section updates (property info → ClientSection)
4. Add success/error toasts

### Phase 4: Polish
1. Confidence score visualization
2. Keyboard shortcuts
3. Loading animations
4. Mobile responsiveness

## Security Considerations

- Images processed via Lovable AI Gateway (secure, no external storage)
- No image data persisted in database
- Only extracted structured data saved with quote
- User confirmation required before applying

## Success Metrics

- **Time saved**: 10+ minutes manual entry → < 30 seconds
- **Accuracy**: 90%+ on well-formatted payment plans
- **User adoption**: High usage in quote creation workflow

