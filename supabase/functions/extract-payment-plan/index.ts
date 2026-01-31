import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface ExtractedInstallment {
  type: 'time' | 'construction' | 'handover' | 'post-handover';
  triggerValue: number;
  paymentPercent: number;
  label?: string;
  confidence: number;
}

interface ExtractedPaymentPlan {
  property?: {
    developer?: string;
    projectName?: string;
    unitNumber?: string;
    unitType?: string;
    unitSizeSqft?: number;
    basePrice?: number;
    currency?: 'AED' | 'USD' | 'EUR' | 'GBP';
  };
  paymentStructure: {
    paymentSplit?: string;
    hasPostHandover: boolean;
    handoverQuarter?: number;
    handoverYear?: number;
    handoverMonthFromBooking?: number;
    onHandoverPercent?: number;
    postHandoverPercent?: number;
  };
  installments: ExtractedInstallment[];
  overallConfidence: number;
  warnings: string[];
}

const systemPrompt = `You are a Dubai real estate payment plan analyzer. Extract structured payment data from marketing materials with HIGH PRECISION.

EXTRACTION PRIORITIES (in order):
1. Property info (developer, project name, unit details, price, currency) - ALWAYS extract if visible
2. Payment percentages (MUST sum to 100%)
3. Payment triggers (month number, construction milestone, or post-handover timing)
4. Handover timing (detect from last pre-handover payment month OR explicit date)

CURRENCY DETECTION:
- Default to AED (Dubai Dirhams) if no currency is explicitly shown
- Look for: "AED", "درهم", "$", "USD", "€", "EUR", "£", "GBP"
- Price formats: "2,500,000 AED", "AED 2.5M", "2.5 Million", etc.

=== HANDOVER MONTH DETECTION - HIGHEST PRIORITY ===
- Find the LAST pre-handover payment's month = handoverMonthFromBooking
- Example: "In 24 months", "In 25 months", "In 26 months" then "Completion" → handoverMonthFromBooking = 26
- If explicit date shown (e.g., "Q3 2027" with booking Jan 2025), calculate months from booking
- This is MORE RELIABLE than trying to extract explicit quarter/year
- ALWAYS set handoverMonthFromBooking when you can detect the handover timing

=== DATE FORMAT NORMALIZATION - ALL to absolute months from booking ===
1. "In X months" / "Month X" / "After X months" → triggerValue = X
2. "X days after booking" → triggerValue = Math.round(X / 30)
3. "60 days" → 2 months, "90 days" → 3 months, "120 days" → 4 months
4. "February 2026" with booking Jan 2025 → Calculate: (2026-2025)*12 + (2-1) = 13
5. "Q3 2027" → Mid-quarter month (Aug = month 8), calculate offset from booking
6. If no booking context provided, assume current date as booking reference

=== CONSTRUCTION MILESTONE DETECTION - CRITICAL ===
- Keywords: "% complete", "completion", "built", "structure", "foundation", "roof", "topping"
- "On 30% completion" → type: "construction", triggerValue: 30
- "At foundation" → type: "construction", triggerValue: 10 (estimate)
- "Topping out" / "Structure complete" → type: "construction", triggerValue: 70
- "Superstructure" → type: "construction", triggerValue: 50
- Construction milestones are ALWAYS pre-handover
- These will be converted to estimated dates using S-curve construction model

=== POST-HANDOVER ABSOLUTE TRIGGER VALUES - CRITICAL ===
- For "4th Month after Completion" with handoverMonthFromBooking = 26:
  - triggerValue = 26 + 4 = 30 (ABSOLUTE from booking)
- For "2 years post-handover" with handover at month 26:
  - triggerValue = 26 + 24 = 50
- For "1st month after handover" with handover at month 26:
  - triggerValue = 27
- ALL post-handover installments must use ABSOLUTE months from booking
- The receiving system determines post-handover status by comparing dates

=== SPLIT SEMANTICS - TWO MODES ===
1. STANDARD PLANS: "30/70" = 30% during construction, 70% lump sum ON handover
   - hasPostHandover = false
   - All payments before handover total 30%
   - Handover payment is 70%

2. POST-HANDOVER PLANS: "30/70" = 30% during construction, 70% ON + AFTER handover combined
   - hasPostHandover = true
   - The 70% includes BOTH the completion payment AND all post-handover installments
   - Example: 30% construction + 10% on handover + 60% over 60 months after = 30/70 post-handover plan

=== INSTALLMENT OUTPUT FORMAT ===
- type "time" + triggerValue 0 = On Booking / Downpayment
- type "time" + triggerValue > 0 = Monthly installments (use ABSOLUTE months from booking for ALL)
- type "construction" = Milestone-based payments (triggerValue = completion percentage like 30, 50, 70)
- type "handover" = Payment due ON handover date (use triggerValue = handoverMonthFromBooking)
- type "post-handover" = ANY payment AFTER handover (triggerValue = ABSOLUTE months from booking)

=== IMPORTANT RULES ===
- All percentages MUST add up to exactly 100%
- First payment is typically "On Booking" or "Down Payment" at Month 0
- If you see "X% monthly for Y months", expand to individual monthly payments
- Handover payment is usually the largest single payment (often 40-60%) UNLESS it's a post-handover plan
- In post-handover plans, handover payment may be 0% or small with remaining balance spread across post-handover installments
- Confidence score: 90+ for clear text, 70-89 for partially visible, below 70 for inferred data

UNIT TYPE MAPPING:
- "Studio", "ST" → "studio"
- "1BR", "1 Bed", "1 Bedroom" → "1br"
- "2BR", "2 Bed", "2 Bedroom" → "2br"
- "3BR", "3 Bed", "3 Bedroom" → "3br"
- "4BR", "4 Bed", "4 Bedroom", "4+" → "4br"
- "Penthouse", "PH" → "penthouse"
- "Townhouse", "TH" → "townhouse"
- "Villa" → "villa"`;

const extractionTool = {
  type: "function",
  function: {
    name: "extract_payment_plan",
    description: "Extract structured payment plan data from analyzed images. All payment percentages MUST sum to exactly 100%.",
    parameters: {
      type: "object",
      properties: {
        property: {
          type: "object",
          description: "Property information if visible in the document - ALWAYS extract these if visible",
          properties: {
            developer: { type: "string", description: "Developer name (e.g., Emaar, Damac, Sobha, Meraas, Dubai Properties)" },
            projectName: { type: "string", description: "Project or community name" },
            unitNumber: { type: "string", description: "Unit/apartment number" },
            unitType: { 
              type: "string", 
              enum: ["studio", "1br", "2br", "3br", "4br", "penthouse", "townhouse", "villa"],
              description: "Type of unit" 
            },
            unitSizeSqft: { type: "number", description: "Unit size in square feet" },
            basePrice: { type: "number", description: "Total property price (without commas, just the number)" },
            currency: {
              type: "string",
              enum: ["AED", "USD", "EUR", "GBP"],
              description: "Currency detected in the document. Default to AED for Dubai properties."
            }
          }
        },
        paymentStructure: {
          type: "object",
          description: "Overall payment structure information",
          properties: {
            paymentSplit: { 
              type: "string", 
              description: "Payment split like '40/60' or '50/50' (during construction/on handover)" 
            },
            hasPostHandover: { 
              type: "boolean", 
              description: "Whether there are payments scheduled after handover/completion. Set TRUE if any installments exist AFTER the handover date." 
            },
            handoverMonthFromBooking: {
              type: "number",
              description: "Month number from booking when handover occurs. Calculate from the LAST pre-handover payment's month number (e.g., 'In 26 months' = 26), or from explicit completion date relative to booking."
            },
            handoverQuarter: { 
              type: "number", 
              enum: [1, 2, 3, 4],
              description: "Expected handover quarter (Q1=1, Q2=2, Q3=3, Q4=4) - extract if explicitly stated" 
            },
            handoverYear: { 
              type: "number", 
              description: "Expected handover year (e.g., 2027) - extract if explicitly stated" 
            },
            onHandoverPercent: {
              type: "number",
              description: "Percentage due on handover (if explicitly stated, or 0 if post-handover plan with no completion payment)"
            },
            postHandoverPercent: {
              type: "number",
              description: "Total percentage due after handover (sum of all post-handover installments)"
            }
          }
        },
        installments: {
          type: "array",
          description: "List of all payment installments. MUST sum to 100%",
          items: {
            type: "object",
            properties: {
              type: { 
                type: "string", 
                enum: ["time", "construction", "handover", "post-handover"],
                description: "time = months from booking (ABSOLUTE), construction = % complete milestone, handover = on completion, post-handover = after handover (use ABSOLUTE months from booking, NOT relative)"
              },
              triggerValue: { 
                type: "number", 
                description: "For time: ABSOLUTE months from booking (0 = on booking). For construction: completion percentage (e.g., 30, 50, 70). For handover: use handoverMonthFromBooking. For post-handover: ABSOLUTE months from booking (e.g., if handover at month 26, '4th after' = 30)"
              },
              paymentPercent: { 
                type: "number", 
                description: "Payment percentage (e.g., 10 for 10%)" 
              },
              label: { 
                type: "string", 
                description: "Original label from document (e.g., 'On Booking', '30% Complete', 'On Handover', '4th Month after Completion')" 
              },
              confidence: { 
                type: "number", 
                description: "Confidence score 0-100. Use 90+ for clearly visible, 70-89 for partial, below 70 for inferred" 
              }
            },
            required: ["type", "triggerValue", "paymentPercent", "confidence"]
          }
        },
        overallConfidence: { 
          type: "number", 
          description: "Overall extraction confidence 0-100" 
        },
        warnings: { 
          type: "array", 
          items: { type: "string" },
          description: "Any warnings about extraction quality or missing data"
        }
      },
      required: ["paymentStructure", "installments", "overallConfidence", "warnings"]
    }
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { images, bookingDate } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("No images provided. Please upload at least one image or PDF.");
    }

    console.log(`Processing ${images.length} image(s) for payment plan extraction`);
    console.log(`Booking date context:`, bookingDate);

    // Build the content array with all images
    const contentParts: any[] = [];
    
    // Add instruction text first with detailed booking context
    const bookingContext = bookingDate?.month && bookingDate?.year 
      ? `Booking/reference date: ${bookingDate.month}/${bookingDate.year} (Month ${bookingDate.month}, Year ${bookingDate.year})`
      : 'Booking date: Not specified - use document date or assume current month';
    
    contentParts.push({
      type: "text",
      text: `Analyze the following ${images.length > 1 ? 'pages of a ' : ''}payment plan document and extract all payment information.
      
${images.length > 1 ? 'These images are pages from the SAME document - combine all information.' : ''}

Context:
- ${bookingContext}
- This is likely a Dubai real estate payment plan

CRITICAL INSTRUCTIONS:
1. Find the LAST pre-handover payment month and set it as handoverMonthFromBooking
2. Convert ALL dates (days, calendar dates, quarters) to ABSOLUTE months from booking
3. For post-handover payments, calculate ABSOLUTE months from booking (handoverMonth + relative months)
4. For construction milestones (30% complete, foundation, etc.), use type: "construction" with triggerValue as percentage
5. Ensure all percentages sum to exactly 100%

Call the extract_payment_plan function with your findings.`
    });

    // Add each image
    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      
      // Handle both data URLs and raw base64
      let mediaType = "image/jpeg";
      let base64Data = imageData;
      
      if (imageData.startsWith("data:")) {
        const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mediaType = matches[1];
          base64Data = matches[2];
        }
      }
      
      // Use image_url format for ALL files (images AND PDFs)
      contentParts.push({
        type: "image_url",
        image_url: {
          url: imageData.startsWith("data:") ? imageData : `data:${mediaType};base64,${base64Data}`
        }
      });
    }

    // Call Lovable AI Gateway with Gemini 3 Flash Preview
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contentParts }
        ],
        tools: [extractionTool],
        tool_choice: { type: "function", function: { name: "extract_payment_plan" } },
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Rate limit exceeded. Please try again in a moment." 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "AI credits exhausted. Please add more credits to continue." 
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response received:", JSON.stringify(aiResponse).slice(0, 500));

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "extract_payment_plan") {
      throw new Error("AI did not return structured extraction data");
    }

    let extractedData: ExtractedPaymentPlan;
    try {
      extractedData = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("Failed to parse AI response:", toolCall.function.arguments);
      throw new Error("Failed to parse extraction results");
    }

    // Validate that percentages sum to 100
    const totalPercent = extractedData.installments.reduce(
      (sum, inst) => sum + inst.paymentPercent, 
      0
    );
    
    if (Math.abs(totalPercent - 100) > 1) {
      extractedData.warnings = extractedData.warnings || [];
      extractedData.warnings.push(`Extracted percentages sum to ${totalPercent.toFixed(1)}%, not 100%. Manual adjustment may be needed.`);
      extractedData.overallConfidence = Math.min(extractedData.overallConfidence, 70);
    }

    // Add unique IDs to installments
    extractedData.installments = extractedData.installments.map((inst, idx) => ({
      ...inst,
      id: `extracted-${Date.now()}-${idx}`,
      isPostHandover: inst.type === 'post-handover'
    }));

    // Log extraction details for debugging
    console.log("Extraction successful:", {
      installmentsCount: extractedData.installments.length,
      totalPercent,
      confidence: extractedData.overallConfidence,
      hasPostHandover: extractedData.paymentStructure.hasPostHandover,
      handoverMonthFromBooking: extractedData.paymentStructure.handoverMonthFromBooking,
      constructionInstallments: extractedData.installments.filter(i => i.type === 'construction').length,
      postHandoverInstallments: extractedData.installments.filter(i => i.type === 'post-handover').length,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Payment plan extraction error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
