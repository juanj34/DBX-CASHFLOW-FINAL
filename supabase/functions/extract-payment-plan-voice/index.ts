import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

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

const systemPrompt = `You are a Dubai real estate payment plan assistant. You help users describe their payment plans verbally and extract structured data from their descriptions.

Your role:
1. LISTEN to the user's voice transcription or text about a payment plan
2. EXTRACT as much structured data as possible
3. ASK CLARIFYING QUESTIONS if critical information is missing
4. CONFIRM and OUTPUT the structured payment plan when you have enough information

=== REQUIRED INFORMATION ===
To create a complete payment plan, you need:
1. Property price (total amount)
2. Payment split or breakdown (how much upfront, during construction, on handover, post-handover)
3. Payment timing (months from booking, construction milestones, post-handover schedule)

=== CLARIFICATION TRIGGERS ===
Ask clarifying questions if:
- Total price is unclear or missing
- Payment percentages don't add up to 100%
- Timing is vague (e.g., "later" instead of specific months)
- Post-handover terms are mentioned but not detailed

=== RESPONSE FORMAT ===
When you have enough information, call the extract_payment_plan function.
When you need more information, call the ask_clarification function.

=== PAYMENT STRUCTURE RULES ===
- All percentages MUST sum to 100%
- "On Booking" / "Downpayment" = type "time", triggerValue 0
- "In X months" = type "time", triggerValue X
- "X% completion" = type "construction", triggerValue X
- "On Handover" / "Completion" = type "handover"
- "X months after handover" with handover at month H = type "post-handover", triggerValue H + X

=== CONVERSATIONAL STYLE ===
- Be friendly and helpful
- Ask ONE question at a time
- Confirm details when the user provides them
- Guide them through any missing information`;

const tools = [
  {
    type: "function",
    function: {
      name: "extract_payment_plan",
      description: "Extract and return the complete payment plan when you have gathered enough information",
      parameters: {
        type: "object",
        properties: {
          property: {
            type: "object",
            properties: {
              developer: { type: "string" },
              projectName: { type: "string" },
              unitNumber: { type: "string" },
              unitType: { 
                type: "string", 
                enum: ["studio", "1br", "2br", "3br", "4br", "penthouse", "townhouse", "villa"]
              },
              unitSizeSqft: { type: "number" },
              basePrice: { type: "number" },
              currency: { type: "string", enum: ["AED", "USD", "EUR", "GBP"] }
            }
          },
          paymentStructure: {
            type: "object",
            properties: {
              paymentSplit: { type: "string" },
              hasPostHandover: { type: "boolean" },
              handoverMonthFromBooking: { type: "number" },
              handoverQuarter: { type: "number", enum: [1, 2, 3, 4] },
              handoverYear: { type: "number" },
              onHandoverPercent: { type: "number" },
              postHandoverPercent: { type: "number" }
            },
            required: ["hasPostHandover"]
          },
          installments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["time", "construction", "handover", "post-handover"] },
                triggerValue: { type: "number" },
                paymentPercent: { type: "number" },
                label: { type: "string" },
                confidence: { type: "number" }
              },
              required: ["type", "triggerValue", "paymentPercent", "confidence"]
            }
          },
          overallConfidence: { type: "number" },
          warnings: { type: "array", items: { type: "string" } }
        },
        required: ["paymentStructure", "installments", "overallConfidence", "warnings"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ask_clarification",
      description: "Ask the user a clarifying question when information is missing or unclear",
      parameters: {
        type: "object",
        properties: {
          question: { 
            type: "string",
            description: "The clarifying question to ask the user"
          },
          missingFields: {
            type: "array",
            items: { type: "string" },
            description: "List of fields that are still missing"
          }
        },
        required: ["question"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { audio, textMessage, bookingDate, conversationHistory } = await req.json();
    
    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];
    
    // Add conversation history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    
    // Add booking context
    const bookingContext = bookingDate?.month && bookingDate?.year 
      ? `(Reference: Booking date is ${bookingDate.month}/${bookingDate.year})`
      : '';
    
    // Handle audio input - Gemini supports audio natively
    if (audio && typeof audio === 'string') {
      console.log("Processing audio input...");
      
      // Extract MIME type and base64 data
      const matches = audio.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error("Invalid audio format");
      }
      
      const mimeType = matches[1];
      const base64Data = matches[2];
      
      // Build multimodal content with audio
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Please listen to this voice note describing a payment plan and extract the information. ${bookingContext}\n\nIf you have enough information to create a complete payment plan (price, payment breakdown with percentages adding to 100%, and timing), call extract_payment_plan. Otherwise, call ask_clarification with a specific question about what's missing.`
          },
          {
            type: "input_audio",
            input_audio: {
              data: base64Data,
              format: mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'wav'
            }
          }
        ]
      });
    } else if (textMessage) {
      // Handle text follow-up
      console.log("Processing text message:", textMessage.substring(0, 100));
      messages.push({
        role: "user",
        content: `${textMessage} ${bookingContext}\n\nBased on our conversation, if you now have enough information to create a complete payment plan, call extract_payment_plan. Otherwise, call ask_clarification.`
      });
    } else {
      throw new Error("No audio or text message provided");
    }
    
    console.log(`Calling Lovable AI with ${messages.length} messages`);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools,
        tool_choice: "auto"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Rate limit exceeded. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "AI credits exhausted. Please add credits to continue." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const result = await response.json();
    console.log("AI response received:", JSON.stringify(result).substring(0, 500));
    
    const choice = result.choices?.[0];
    if (!choice) {
      throw new Error("No response from AI");
    }
    
    // Check for tool calls
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function?.name;
      const args = JSON.parse(toolCall.function?.arguments || '{}');
      
      if (functionName === 'extract_payment_plan') {
        console.log("Extraction successful:", JSON.stringify(args).substring(0, 300));
        
        // Add IDs to installments
        const installments = (args.installments || []).map((inst: any, index: number) => ({
          ...inst,
          id: `voice-${Date.now()}-${index}`
        }));
        
        // Calculate payment split if not provided
        let paymentSplit = args.paymentStructure?.paymentSplit;
        if (!paymentSplit && installments.length > 0) {
          const preHandover = installments
            .filter((i: any) => i.type !== 'post-handover' && i.type !== 'handover')
            .reduce((sum: number, i: any) => sum + (i.paymentPercent || 0), 0);
          const onAndAfter = 100 - preHandover;
          paymentSplit = `${Math.round(preHandover)}/${Math.round(onAndAfter)}`;
        }
        
        const extractedPlan: ExtractedPaymentPlan = {
          property: args.property,
          paymentStructure: {
            ...args.paymentStructure,
            paymentSplit,
            hasPostHandover: args.paymentStructure?.hasPostHandover ?? false
          },
          installments,
          overallConfidence: args.overallConfidence || 80,
          warnings: args.warnings || []
        };
        
        return new Response(JSON.stringify({
          success: true,
          data: extractedPlan
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (functionName === 'ask_clarification') {
        console.log("Needs clarification:", args.question);
        return new Response(JSON.stringify({
          success: true,
          needsClarification: true,
          question: args.question,
          missingFields: args.missingFields
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    // If no tool call, the model provided a text response - treat as clarification
    const textContent = choice.message?.content || '';
    if (textContent) {
      return new Response(JSON.stringify({
        success: true,
        needsClarification: true,
        question: textContent
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    throw new Error("Unexpected AI response format");

  } catch (error) {
    console.error("Error in voice extraction:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
