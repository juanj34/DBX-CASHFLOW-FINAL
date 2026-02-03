import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface ExtractedInstallment {
  id?: string;
  type: 'time' | 'construction' | 'handover' | 'post-handover';
  triggerValue: number;
  paymentPercent: number;
  label?: string;
  confidence: number;
  isPostHandover?: boolean;
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

=== CRITICAL REQUIRED OUTPUTS ===
These fields MUST always be set:
1. hasPostHandover - MUST be true if ANY payments exist after handover, false otherwise
2. handoverMonthFromBooking - MUST be set to the month number when handover occurs
   - Calculate from the LAST "In X months" payment before post-handover section
   - Example: If payments go "In 24 months", "In 25 months", "In 26 months" then "Completion", set handoverMonthFromBooking = 27
   - The "Completion" payment is the HANDOVER, so handover month = last pre-handover month + 1

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
- Find the LAST pre-handover payment's month number
- The "Completion" or "On Handover" or "At the Handover" payment is ONE MONTH AFTER the last pre-handover
- Example: "In 24 months", "In 25 months", "In 26 months" then "Completion" → handoverMonthFromBooking = 27
- If explicit date shown (e.g., "30-Dec-2026" with booking Jan 2026), calculate months from booking:
  - Example: Booking "29-Jan-2026", Handover "30-Dec-2026" = 11 months from booking
- ALWAYS set handoverMonthFromBooking when you can detect the handover timing

=== HANDOVER PAYMENT DETECTION KEYWORDS ===
Look for these patterns to identify the handover/completion payment:
- "At the Handover" / "On Handover" / "Upon Handover"
- "Completion" / "On Completion" / "At Completion" 
- "Final Payment" / "Balance Payment"
- "Handover Payment"
This payment should have type: "handover" and be included in the installments array

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
- For "4th Month after Completion" with handoverMonthFromBooking = 27:
  - triggerValue = 27 + 4 = 31 (ABSOLUTE from booking)
- For "2 years post-handover" with handover at month 27:
  - triggerValue = 27 + 24 = 51
- For "1st month after handover" with handover at month 27:
  - triggerValue = 28
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
- type "time" + triggerValue 0 = On Booking / Downpayment (ONLY output this ONCE for the initial payment)
- type "time" + triggerValue > 0 = Monthly installments starting from Month 1 onwards
- type "construction" = Milestone-based payments (triggerValue = completion percentage like 30, 50, 70)
- type "handover" = Payment due ON handover date (use triggerValue = handoverMonthFromBooking)
- type "post-handover" = ANY payment AFTER handover (triggerValue = ABSOLUTE months from booking)

=== CRITICAL: AVOID DUPLICATE DOWNPAYMENT ===
- The "On Booking" / "Downpayment" / "Booking Fee" is output ONCE with triggerValue = 0
- DO NOT output it again as Month 1 or any other installment
- Subsequent installments should be at Month 1, Month 2, etc. OR at construction milestones
- If you see "20% on booking + monthly installments", output ONE installment at Month 0 for 20%, then separate installments for Month 1, 2, 3...

=== IMPORTANT RULES ===
- All percentages MUST add up to exactly 100%
- First payment is typically "On Booking" or "Down Payment" at Month 0 - DO NOT DUPLICATE IT
- If you see "X% monthly for Y months", expand to individual monthly payments starting from Month 1 (not Month 0)
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
          description: "Overall payment structure information - hasPostHandover MUST always be set",
          properties: {
            paymentSplit: { 
              type: "string", 
              description: "Payment split like '40/60' or '50/50' (during construction/on handover)" 
            },
            hasPostHandover: { 
              type: "boolean", 
              description: "CRITICAL REQUIRED FIELD: Whether there are payments scheduled after handover/completion. MUST be set to TRUE if any installments exist AFTER the handover date, FALSE otherwise. Never leave undefined." 
            },
            handoverMonthFromBooking: {
              type: "number",
              description: "CRITICAL: Month number from booking when handover occurs. For 'Completion' after 'In 26 months', set to 27 (completion is NEXT month). Always calculate this from the payment schedule."
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
              description: "Percentage due on handover (the 'Completion' payment percentage)"
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
                description: "For time: ABSOLUTE months from booking (0 = on booking). For construction: completion percentage (e.g., 30, 50, 70). For handover: use handoverMonthFromBooking. For post-handover: ABSOLUTE months from booking (e.g., if handover at month 27, '4th after' = 31)"
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

    console.log(`Processing ${images.length} file(s) for payment plan extraction`);
    console.log(`Image data types:`, images.map((img: any, i: number) => ({ 
      index: i, 
      type: typeof img, 
      isString: typeof img === 'string',
      length: typeof img === 'string' ? img.length : 0,
      startsWithData: typeof img === 'string' ? img.startsWith('data:') : false
    })));
    console.log(`Booking date context:`, bookingDate);

    // Build the content array with all images
    const contentParts: any[] = [];
    let excelTextContext = "";
    const imageContents: any[] = [];
    
    // Process each file - separate Excel from images/PDFs
    for (let i = 0; i < images.length; i++) {
      const fileData = images[i];
      
      // Skip null/undefined/empty entries
      if (!fileData || typeof fileData !== 'string') {
        console.warn(`Skipping invalid file at index ${i}: ${typeof fileData}`);
        continue;
      }
      
      // Check if it's an Excel file (by MIME type in data URL)
      if (fileData.startsWith("data:application/vnd.") && 
          (fileData.includes("spreadsheet") || fileData.includes("excel") || fileData.includes("ms-excel"))) {
        
        try {
          console.log(`Processing Excel file ${i + 1}...`);
          
          // Extract base64 data
          const base64Match = fileData.match(/^data:[^;]+;base64,(.+)$/);
          if (base64Match) {
            const base64Data = base64Match[1];
            const binaryString = atob(base64Data);
            const binaryData = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              binaryData[j] = binaryString.charCodeAt(j);
            }
            
            // Parse with SheetJS
            const workbook = XLSX.read(binaryData, { type: "array" });
            
            // Convert all sheets to text/CSV
            for (const sheetName of workbook.SheetNames) {
              const sheet = workbook.Sheets[sheetName];
              const csv = XLSX.utils.sheet_to_csv(sheet);
              excelTextContext += `\n=== Sheet: ${sheetName} ===\n${csv}\n`;
            }
            
            console.log(`Excel parsed successfully: ${workbook.SheetNames.length} sheet(s)`);
          }
        } catch (excelError) {
          console.error("Excel parsing error:", excelError);
          throw new Error("Failed to parse Excel file. Please ensure it's a valid .xlsx or .xls file.");
        }
        
        continue; // Don't add Excel to image content
      }
      
      // Handle images and PDFs
      let mediaType = "image/jpeg";
      let base64Data = fileData;
      
      if (fileData.startsWith("data:")) {
        const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mediaType = matches[1];
          base64Data = matches[2];
        }
      }
      
      // Use image_url format for images and PDFs
      imageContents.push({
        type: "image_url",
        image_url: {
          url: fileData.startsWith("data:") ? fileData : `data:${mediaType};base64,${base64Data}`
        }
      });
    }
    
    // Add instruction text first with detailed booking context
    const bookingContext = bookingDate?.month && bookingDate?.year 
      ? `Booking/reference date: ${bookingDate.month}/${bookingDate.year} (Month ${bookingDate.month}, Year ${bookingDate.year})`
      : 'Booking date: Not specified - use document date or assume current month';
    
    let instructionText = `Analyze the following payment plan document and extract all payment information.
      
${images.length > 1 ? 'These files are from the SAME document - combine all information.' : ''}

Context:
- ${bookingContext}
- This is likely a Dubai real estate payment plan

CRITICAL INSTRUCTIONS:
1. Find the LAST pre-handover payment month and calculate handoverMonthFromBooking = lastPreHandoverMonth + 1
   - Example: If last pre-handover is "In 26 months", then handoverMonthFromBooking = 27
2. Convert ALL dates (days, calendar dates, quarters) to ABSOLUTE months from booking
3. For post-handover payments, calculate ABSOLUTE months from booking (handoverMonth + relative months)
   - Example: "4th Month after Completion" with handover at month 27 = triggerValue 31 (27 + 4)
4. For construction milestones (30% complete, foundation, etc.), use type: "construction" with triggerValue as percentage
5. Include the "Completion" payment with type: "handover" - DO NOT skip it
6. Ensure all percentages sum to exactly 100%
7. Set hasPostHandover = true if there are any payments after the Completion payment`;

    // Add Excel data as text context if we have any
    if (excelTextContext) {
      instructionText += `\n\n=== EXCEL PAYMENT SCHEDULE DATA ===\n${excelTextContext}\n=== END EXCEL DATA ===`;
      console.log(`Added Excel text context (${excelTextContext.length} chars)`);
    }

    instructionText += `\n\nCall the extract_payment_plan function with your findings.`;
    
    contentParts.push({
      type: "text",
      text: instructionText
    });

    // Add all image content parts
    for (const imgContent of imageContents) {
      contentParts.push(imgContent);
    }
    
    // Ensure we have something to analyze
    if (imageContents.length === 0 && !excelTextContext) {
      throw new Error("No valid content to analyze. Please upload images, PDFs, or Excel files.");
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

    // Check if the AI gateway returned an error object instead of valid data
    if (aiResponse.error) {
      console.error("AI Gateway returned error:", aiResponse.error);
      
      const errorMessage = aiResponse.error.message === "Internal Server Error"
        ? "The AI service encountered an issue processing your file. Please try with a smaller image or a different file format."
        : aiResponse.error.message || "AI processing failed";
      
      throw new Error(errorMessage);
    }

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "extract_payment_plan") {
      console.error("Unexpected AI response structure:", JSON.stringify(aiResponse).slice(0, 1000));
      throw new Error("AI did not return structured extraction data. Please try again or use a clearer image.");
    }

    let extractedData: ExtractedPaymentPlan;
    try {
      extractedData = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("Failed to parse AI response:", toolCall.function.arguments);
      throw new Error("Failed to parse extraction results");
    }

    // === POST-PROCESSING: Fallback logic for missing critical fields ===
    
    // Fallback 1: Calculate handoverMonthFromBooking from installments if not extracted
    if (!extractedData.paymentStructure.handoverMonthFromBooking) {
      console.log("handoverMonthFromBooking not extracted, calculating from installments...");
      
      // Find handover-type installment first
      const handoverInst = extractedData.installments.find(i => i.type === 'handover');
      if (handoverInst && handoverInst.triggerValue > 0) {
        extractedData.paymentStructure.handoverMonthFromBooking = handoverInst.triggerValue;
        console.log(`Set handoverMonthFromBooking from handover installment: ${handoverInst.triggerValue}`);
      } else {
        // Find the boundary between pre-handover (time) and post-handover installments
        const postHandoverInsts = extractedData.installments.filter(i => i.type === 'post-handover');
        const timeInsts = extractedData.installments.filter(i => i.type === 'time');
        
        if (postHandoverInsts.length > 0) {
          // The lowest post-handover trigger value
          const firstPostHO = Math.min(...postHandoverInsts.map(i => i.triggerValue));
          // Last pre-handover would be just before the first post-handover
          const lastPreHO = timeInsts
            .filter(i => i.triggerValue < firstPostHO)
            .sort((a, b) => b.triggerValue - a.triggerValue)[0];
          
          if (lastPreHO) {
            // Handover is one month after the last pre-handover installment
            extractedData.paymentStructure.handoverMonthFromBooking = lastPreHO.triggerValue + 1;
            console.log(`Calculated handoverMonthFromBooking from boundary: ${lastPreHO.triggerValue + 1}`);
          }
        } else if (timeInsts.length > 0) {
          // No post-handover, use the last time installment + 1
          const lastTime = timeInsts.sort((a, b) => b.triggerValue - a.triggerValue)[0];
          extractedData.paymentStructure.handoverMonthFromBooking = lastTime.triggerValue + 1;
          console.log(`Set handoverMonthFromBooking from last time installment: ${lastTime.triggerValue + 1}`);
        }
      }
    }
    
    // Fallback 2: Set hasPostHandover based on installment types
    if (extractedData.paymentStructure.hasPostHandover === undefined) {
      extractedData.paymentStructure.hasPostHandover = 
        extractedData.installments.some(i => i.type === 'post-handover');
      console.log(`Set hasPostHandover from installments: ${extractedData.paymentStructure.hasPostHandover}`);
    }
    
    // Fallback 3: Calculate postHandoverPercent if not set but we have post-handover installments
    if (!extractedData.paymentStructure.postHandoverPercent) {
      const postHOTotal = extractedData.installments
        .filter(i => i.type === 'post-handover')
        .reduce((sum, i) => sum + i.paymentPercent, 0);
      if (postHOTotal > 0) {
        extractedData.paymentStructure.postHandoverPercent = postHOTotal;
        console.log(`Calculated postHandoverPercent: ${postHOTotal}`);
      }
    }
    
    // Fallback 4: Calculate onHandoverPercent from handover installment if not set
    if (!extractedData.paymentStructure.onHandoverPercent) {
      const handoverInst = extractedData.installments.find(i => i.type === 'handover');
      if (handoverInst) {
        extractedData.paymentStructure.onHandoverPercent = handoverInst.paymentPercent;
        console.log(`Set onHandoverPercent from handover installment: ${handoverInst.paymentPercent}`);
      }
    }
    
    // Fallback 5: Calculate paymentSplit from installments if not extracted
    // This ensures the split is always available for the client to set preHandoverPercent
    if (!extractedData.paymentStructure.paymentSplit) {
      // Pre-handover = all "time" + "construction" installments (before handover)
      const preHandoverTotal = extractedData.installments
        .filter(i => i.type === 'time' || i.type === 'construction')
        .reduce((sum, i) => sum + i.paymentPercent, 0);
      
      // Post-handover includes handover payment + any post-handover installments
      const postHandoverTotal = 100 - preHandoverTotal;
      
      if (preHandoverTotal > 0 && postHandoverTotal > 0) {
        extractedData.paymentStructure.paymentSplit = 
          `${Math.round(preHandoverTotal)}/${Math.round(postHandoverTotal)}`;
        console.log(`Calculated paymentSplit from installments: ${extractedData.paymentStructure.paymentSplit}`);
      }
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
      onHandoverPercent: extractedData.paymentStructure.onHandoverPercent,
      postHandoverPercent: extractedData.paymentStructure.postHandoverPercent,
      constructionInstallments: extractedData.installments.filter(i => i.type === 'construction').length,
      handoverInstallments: extractedData.installments.filter(i => i.type === 'handover').length,
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
