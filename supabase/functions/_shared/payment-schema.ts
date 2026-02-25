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
      description: "Total property price (number only, no commas). Default currency is AED.",
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
      enum: ["studio", "1br", "2br", "3br", "4br", "penthouse", "townhouse", "villa"],
      description: "Unit type",
    },
    sizeSqFt: { type: "NUMBER", description: "Unit size in square feet" },
    downpaymentPercent: {
      type: "NUMBER",
      description: "Percentage paid on booking / as downpayment (Month 0). Combine EOI + downpayment balance into one number.",
    },
    handoverMonthFromBooking: {
      type: "INTEGER",
      description: "Month number from booking when handover/completion occurs. Calculate from last pre-handover payment + 1, or from explicit date.",
    },
    handoverMonth: {
      type: "INTEGER",
      description: "Calendar month of handover (1-12). Only set if an explicit date is shown.",
    },
    handoverYear: {
      type: "INTEGER",
      description: "Calendar year of handover. Only set if an explicit date is shown.",
    },
    hasPostHandover: {
      type: "BOOLEAN",
      description: "true if ANY payments exist AFTER the handover date.",
    },
    onHandoverPercent: {
      type: "NUMBER",
      description: "Percentage due ON handover/completion (the 'Final Payment'). For standard plans without post-handover, this is 100 minus sum of all pre-handover payments.",
    },
    postHandoverPercent: {
      type: "NUMBER",
      description: "Total percentage due AFTER handover (sum of all post-handover installments). 0 if no post-handover.",
    },
    milestones: {
      type: "ARRAY",
      description: "ALL payment milestones EXCLUDING the downpayment (Month 0) and the on-handover payment. Include pre-handover installments AND post-handover installments.",
      items: {
        type: "OBJECT",
        properties: {
          type: {
            type: "STRING",
            enum: ["time", "construction", "post-handover"],
            description: "time = months from booking; construction = % completion milestone; post-handover = months after handover (relative, e.g. 1 = first month after handover).",
          },
          triggerValue: {
            type: "NUMBER",
            description: "For time: months from booking (1, 2, 3...). For construction: completion % (30, 50, 70...). For post-handover: months AFTER handover (1, 2, 3...).",
          },
          paymentPercent: { type: "NUMBER", description: "Payment percentage for this milestone." },
          label: { type: "STRING", description: "Original label from document (e.g. '30% Complete', 'Month 6')." },
          isHandover: {
            type: "BOOLEAN",
            description: "true ONLY for the completion/handover milestone in standard plans (where hasPostHandover is false). For post-handover plans, the handover payment is NOT in milestones.",
          },
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
  required: ["downpaymentPercent", "hasPostHandover", "milestones", "confidence", "warnings"],
};

// ── System prompt ───────────────────────────────────────────────────────────

export const uploadSystemPrompt = `You are a Dubai real estate payment plan analyzer. Extract structured payment data from marketing materials with HIGH PRECISION.

CRITICAL RULES:
1. All payment percentages (downpaymentPercent + onHandoverPercent + postHandoverPercent + all milestone paymentPercents) MUST sum to exactly 100%.
2. The downpaymentPercent is the FIRST payment (On Booking / Down Payment) at Month 0. Combine EOI + balance into one number. Output it ONLY as downpaymentPercent, NOT also in milestones.
3. For milestones, use ONLY pre-handover payments (type "time" or "construction") and post-handover payments (type "post-handover"). The handover payment itself goes in onHandoverPercent, NOT in milestones — UNLESS hasPostHandover is false and you want to mark it with isHandover=true in milestones.
4. For standard plans (no post-handover): include the handover/completion payment in milestones with isHandover=true. Set onHandoverPercent to that same value. hasPostHandover=false.
5. For post-handover plans: the on-handover percent goes in onHandoverPercent only (NOT milestones). Post-handover installments go in milestones with type "post-handover" and triggerValue = months AFTER handover (1, 2, 3...).

DATE NORMALIZATION (all to months from booking):
- "In X months" / "Month X" → triggerValue = X
- "X days after booking" → triggerValue = round(X/30)
- Calendar dates: calculate (targetYear-bookingYear)*12 + (targetMonth-bookingMonth)
- "Q3 2027" → mid-quarter month, calculate offset from booking

HANDOVER DETECTION:
- Find the last pre-handover payment month; handover = that + 1
- Keywords: "At the Handover", "On Completion", "Final Payment", "Handover Payment"
- If no explicit label, look for a percentage spike significantly larger than surrounding payments

CONSTRUCTION MILESTONES:
- "30% complete" → type "construction", triggerValue 30
- "Foundation" ≈ 10, "Superstructure" ≈ 50, "Topping out" ≈ 70

UNIT TYPES: Studio→studio, 1BR→1br, 2BR→2br, 3BR→3br, 4BR→4br, Penthouse→penthouse, Townhouse→townhouse, Villa→villa

CURRENCY: Default AED for Dubai. Look for AED, $, €, £ symbols.

POST-HANDOVER triggerValue: Use months AFTER handover (relative), e.g. "4th month after completion" → triggerValue=4.`;
