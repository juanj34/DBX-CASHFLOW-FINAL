/**
 * Shared payment plan extraction schema for Gemini structured output.
 * The schema fields map directly to OIInputs configurator fields.
 */

// ── Gemini responseSchema for upload (single-shot extraction) ────────────────

export const uploadResponseSchema = {
  type: "OBJECT",
  properties: {
    purchasePrice: {
      type: "NUMBER",
      description: "Total property purchase price (number only, no commas). Default currency is AED.",
    },
    currency: {
      type: "STRING",
      enum: ["AED", "USD", "EUR", "GBP"],
      description: "Currency detected. Default AED for Dubai properties.",
    },
    developer: { type: "STRING", description: "Developer name (Emaar, Damac, Sobha, etc.)" },
    projectName: { type: "STRING", description: "Project or community name" },
    unitNumber: { type: "STRING", description: "Unit/apartment number" },
    unitType: {
      type: "STRING",
      enum: ["studio", "1br", "2br", "3br", "4br", "penthouse", "townhouse", "villa", "commercial"],
      description: "Unit type classification",
    },
    sizeSqFt: { type: "NUMBER", description: "Unit size in square feet" },
    downpaymentPercent: {
      type: "NUMBER",
      description: "Percentage paid on booking / as downpayment (Month 0). Combine EOI + downpayment balance into one number.",
    },
    onHandoverPercent: {
      type: "NUMBER",
      description: "Percentage due ON handover/completion day. For standard plans this is the remaining balance (100 - downpayment - installments). For post-handover plans this is the explicit handover payment.",
    },
    handoverMonthFromBooking: {
      type: "INTEGER",
      description: "Month number from booking when handover/completion occurs. REQUIRED — calculate from the last pre-handover payment timing, or from an explicit completion date.",
    },
    handoverMonth: {
      type: "INTEGER",
      description: "Calendar month of expected handover (1-12). Extract from 'Expected Completion Q3 2028' → month 7, or 'December 2027' → month 12.",
    },
    handoverYear: {
      type: "INTEGER",
      description: "Calendar year of expected handover. Extract from 'Expected Completion Q3 2028' → year 2028.",
    },
    hasPostHandover: {
      type: "BOOLEAN",
      description: "true ONLY if payments exist AFTER the handover date (post-completion installments).",
    },
    postHandoverPercent: {
      type: "NUMBER",
      description: "Total percentage due AFTER handover (sum of all post-handover installments). 0 if no post-handover.",
    },
    milestones: {
      type: "ARRAY",
      description: "ONLY intermediate installments — pre-handover and post-handover. NEVER include the downpayment (Month 0) or the handover payment here. Those go in downpaymentPercent and onHandoverPercent respectively.",
      items: {
        type: "OBJECT",
        properties: {
          type: {
            type: "STRING",
            enum: ["time", "construction", "post-handover"],
            description: "time = months from booking; construction = % completion milestone; post-handover = months after handover.",
          },
          triggerValue: {
            type: "NUMBER",
            description: "For time: months from booking (1, 2, 3...). For construction: completion % (30, 50, 70...). For post-handover: months AFTER handover (1, 2, 3...).",
          },
          paymentPercent: { type: "NUMBER", description: "Payment percentage for this milestone." },
          label: { type: "STRING", description: "Original label from document (e.g. '30% Complete', 'Month 6', '60 days after booking')." },
        },
        required: ["type", "triggerValue", "paymentPercent"],
      },
    },
    confidence: {
      type: "INTEGER",
      description: "Overall extraction confidence 0-100. 90+ for clear text, 70-89 for partial, below 70 for inferred.",
    },
    warnings: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Warnings about extraction quality or missing data.",
    },
  },
  required: ["downpaymentPercent", "onHandoverPercent", "hasPostHandover", "milestones", "confidence", "warnings"],
};

// ── System prompt ───────────────────────────────────────────────────────────

export const uploadSystemPrompt = `You are a Dubai real estate payment plan analyzer. Extract structured payment data from brochures and marketing materials with HIGH PRECISION.

PAYMENT STRUCTURE — THREE BUCKETS (must sum to 100%):
1. downpaymentPercent — the FIRST payment on booking (Month 0). Combine EOI + SPA balance into one number.
2. milestones[] — ONLY intermediate installments between booking and handover (pre-handover), plus any post-handover installments. NEVER put the downpayment or handover payment here.
3. onHandoverPercent — the payment due ON handover/completion day. For standard plans: 100 - downpayment - sum(milestones). For post-handover plans: the explicit handover-day payment.

VALIDATION: downpaymentPercent + sum(milestones paymentPercent) + onHandoverPercent = 100%. Always verify this.

CRITICAL RULES:
1. All percentages are of PURCHASE PRICE only — never of "Total Equity Required", "Total Investment", or amounts that include DLD/oqood/admin fees.
2. If the document shows explicit percentages (e.g. "2.5%", "20%", "70%"), use those exact values.
3. The downpayment is ONLY in downpaymentPercent. The handover payment is ONLY in onHandoverPercent. Milestones contain ONLY the installments in between.
4. For standard plans (no post-handover): hasPostHandover=false, onHandoverPercent = remaining balance after downpayment + installments.
5. For post-handover plans: hasPostHandover=true, include post-handover installments in milestones with type "post-handover" and triggerValue = months AFTER handover (1, 2, 3...).

HANDOVER DATE — ALWAYS EXTRACT:
- Look for: "Expected Completion", "Handover Date", "Estimated Completion", "Target Delivery"
- "Q1 2028" → handoverMonth=2, handoverYear=2028
- "Q2 2028" → handoverMonth=5, handoverYear=2028
- "Q3 2028" → handoverMonth=8, handoverYear=2028
- "Q4 2028" → handoverMonth=11, handoverYear=2028
- "December 2027" → handoverMonth=12, handoverYear=2027
- Also calculate handoverMonthFromBooking = (handoverYear - bookingYear) * 12 + (handoverMonth - bookingMonth)
- If no explicit date: estimate from last pre-handover milestone timing + a few months

DATE NORMALIZATION (all to months from booking):
- "In X months" / "Month X" → triggerValue = X
- "X days after booking" → triggerValue = round(X/30)
- Calendar dates: calculate (targetYear-bookingYear)*12 + (targetMonth-bookingMonth)

CONSTRUCTION MILESTONES:
- "30% complete" → type "construction", triggerValue 30
- "Foundation" ≈ 10, "Superstructure" ≈ 50, "Topping out" ≈ 70

UNIT TYPES: Studio→studio, 1BR→1br, 2BR→2br, 3BR→3br, 4BR→4br, Penthouse→penthouse, Townhouse→townhouse, Villa→villa, Commercial/Office/Retail→commercial

CURRENCY: Default AED for Dubai. Look for AED, $, €, £ symbols.`;
