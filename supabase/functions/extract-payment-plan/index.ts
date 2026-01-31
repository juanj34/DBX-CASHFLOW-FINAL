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
3. Payment triggers (month number or construction milestone)
4. Dates (handover quarter/year)

CURRENCY DETECTION:
- Default to AED (Dubai Dirhams) if no currency is explicitly shown
- Look for: "AED", "درهم", "$", "USD", "€", "EUR", "£", "GBP"
- Price formats: "2,500,000 AED", "AED 2.5M", "2.5 Million", etc.

PAYMENT FORMATS TO RECOGNIZE:
1. TIME-BASED: "Month 1", "Month 6", "12 months", "6 months post-booking", "On Booking", "Booking", "Down Payment"
2. CONSTRUCTION-BASED: "On completion of 30%", "At 50% construction", "Ground floor", "Foundation Complete"
3. HANDOVER-BASED: "On handover", "At completion", "Key handover", "On Completion", "Upon Handover"
4. POST-HANDOVER: "48 months post-handover", "2 years after completion", "5 years post-delivery", "post completion", "after handover"

MULTI-PAGE HANDLING:
- When given multiple images, treat them as pages of the SAME document
- Look for continuation patterns (page numbers, "continued...")
- Combine information from all pages into a single coherent output
- If data appears on multiple pages, prefer the most detailed version

SPLIT DETECTION AND CALCULATION:
- Look for explicit patterns: "40/60", "50:50", "30-70", "During Construction/On Handover"
- If no explicit split, CALCULATE from the data:
  - Pre-handover total = booking + all installments BEFORE handover
  - Post-handover total = all installments AFTER handover
  - The split is: preHandoverTotal / postHandoverTotal (e.g., "30/70")
- Common Dubai splits: 20/80, 30/70, 40/60, 50/50, 60/40, 80/20

POST-HANDOVER DETECTION - CRITICAL:
- Keywords: "post-handover", "after completion", "after delivery", "post-possession", "post completion"
- Set hasPostHandover = TRUE if ANY payments are scheduled AFTER handover/completion date
- Mark ALL payments after handover as type "post-handover"
- Calculate postHandoverPercent = sum of all post-handover installment percentages
- If document shows installments continuing for years after handover (e.g., "3 years post-handover"), this IS a post-handover plan

INSTALLMENT CATEGORIZATION:
- type "time" + triggerValue 0 = On Booking / Downpayment
- type "time" + triggerValue > 0 = Monthly installments during construction
- type "construction" = Milestone-based payments (e.g., "30% complete")
- type "handover" = Payment due ON handover date (use triggerValue 0)
- type "post-handover" = ANY payment AFTER handover (use triggerValue = months AFTER handover)

IMPORTANT RULES:
- All percentages MUST add up to exactly 100%
- First payment is typically "On Booking" or "Down Payment" at Month 0
- If you see "X% monthly for Y months", expand to individual monthly payments
- Handover payment is usually the largest single payment (often 40-60%) UNLESS it's a post-handover plan
- In post-handover plans, handover payment may be 0% with remaining balance spread across post-handover installments
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
              description: "Whether there are payments scheduled after handover/completion" 
            },
            handoverQuarter: { 
              type: "number", 
              enum: [1, 2, 3, 4],
              description: "Expected handover quarter (Q1=1, Q2=2, Q3=3, Q4=4)" 
            },
            handoverYear: { 
              type: "number", 
              description: "Expected handover year (e.g., 2027)" 
            },
            onHandoverPercent: {
              type: "number",
              description: "Percentage due on handover (if explicitly stated)"
            },
            postHandoverPercent: {
              type: "number",
              description: "Total percentage due after handover (if post-handover plan exists)"
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
                description: "Type of trigger: time (months from booking), construction (% complete), handover (on completion), post-handover (after handover)"
              },
              triggerValue: { 
                type: "number", 
                description: "For time: months from booking (0 = on booking). For construction: completion percentage. For handover/post-handover: months after handover (0 = on handover)"
              },
              paymentPercent: { 
                type: "number", 
                description: "Payment percentage (e.g., 10 for 10%)" 
              },
              label: { 
                type: "string", 
                description: "Original label from document (e.g., 'On Booking', '30% Complete', 'On Handover')" 
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
    
    // Add instruction text first
    contentParts.push({
      type: "text",
      text: `Analyze the following ${images.length > 1 ? 'pages of a ' : ''}payment plan document and extract all payment information.
      
${images.length > 1 ? 'These images are pages from the SAME document - combine all information.' : ''}

Context:
- Booking/reference date: ${bookingDate?.month || 'Not specified'}/${bookingDate?.year || 'Not specified'}
- This is likely a Dubai real estate payment plan

Extract ALL payment milestones ensuring they sum to exactly 100%. Call the extract_payment_plan function with your findings.`
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
      // The Lovable AI Gateway only supports image_url content type
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

    console.log("Extraction successful:", {
      installmentsCount: extractedData.installments.length,
      totalPercent,
      confidence: extractedData.overallConfidence,
      hasPostHandover: extractedData.paymentStructure.hasPostHandover
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
