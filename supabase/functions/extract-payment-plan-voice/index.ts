import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

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

IMPORTANT: You are having a VOICE CONVERSATION. Keep your responses SHORT, CONVERSATIONAL, and NATURAL for spoken dialogue. Do not use markdown, bullet points, or long explanations.

Your role:
1. LISTEN to the user's voice transcription or text about a payment plan
2. EXTRACT as much structured data as possible
3. ASK CLARIFYING QUESTIONS if critical information is missing (one question at a time)
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
When you need more information, call the ask_clarification function with a SHORT, SPOKEN question.

=== PAYMENT STRUCTURE RULES ===
- All percentages MUST sum to 100%
- "On Booking" / "Downpayment" = type "time", triggerValue 0
- "In X months" = type "time", triggerValue X
- "X% completion" = type "construction", triggerValue X
- "On Handover" / "Completion" = type "handover"
- "X months after handover" with handover at month H = type "post-handover", triggerValue H + X

=== CONVERSATIONAL STYLE ===
- Be friendly and speak naturally
- Keep responses to 1-2 sentences MAX
- Ask ONE question at a time
- Confirm details briefly when the user provides them`;

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
          warnings: { type: "array", items: { type: "string" } },
          confirmationMessage: { 
            type: "string",
            description: "A SHORT spoken confirmation message to tell the user (1-2 sentences max)"
          }
        },
        required: ["paymentStructure", "installments", "overallConfidence", "warnings", "confirmationMessage"]
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
            description: "A SHORT, SPOKEN clarifying question (1-2 sentences max, no bullet points)"
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

// Generate TTS audio using ElevenLabs
async function generateTTSAudio(text: string): Promise<string | null> {
  if (!ELEVENLABS_API_KEY) {
    console.log("No ElevenLabs API key, skipping TTS");
    return null;
  }

  try {
    // Using voice "Sarah" - professional female voice
    const voiceId = "EXAVITQu4vr4xnSDxMaL";
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errorText);
      return null;
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);
    return `data:audio/mpeg;base64,${base64Audio}`;
  } catch (error) {
    console.error("Error generating TTS:", error);
    return null;
  }
}

// Transcribe audio using Gemini's native audio understanding
async function transcribeAudio(audioBase64: string, audioFormat: string): Promise<string> {
  console.log("Transcribing audio with Gemini...");
  console.log("Audio format:", audioFormat);
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please transcribe this audio exactly as spoken. Only return the transcription, nothing else. If the audio is in Spanish, transcribe in Spanish. If in English, transcribe in English."
            },
            {
              type: "input_audio",
              input_audio: {
                data: audioBase64,
                format: audioFormat
              }
            }
          ]
        }
      ]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Transcription error:", response.status, errorText);
    throw new Error(`Failed to transcribe audio: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const transcription = result.choices?.[0]?.message?.content || "";
  console.log("Transcription result:", transcription);
  return transcription;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { audio, audioMimeType, textMessage, bookingDate, conversationHistory } = await req.json();
    
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
    
    let userTranscription = "";
    
    // Handle audio input - transcribe first, then process
    if (audio && typeof audio === 'string') {
      console.log("Processing audio input...");
      console.log("Audio string length:", audio.length);
      console.log("Audio starts with:", audio.substring(0, 50));
      
      let mimeType = typeof audioMimeType === "string" && audioMimeType.length > 0
        ? audioMimeType
        : "audio/webm";
      let base64Data = "";
      
      // Try to extract MIME type and base64 data from data URI
      if (audio.startsWith("data:")) {
        // Handle data URI format: data:audio/webm;base64,XXXX
        const semicolonIndex = audio.indexOf(";");
        const commaIndex = audio.indexOf(",");
        
        if (semicolonIndex > 5 && commaIndex > semicolonIndex) {
          mimeType = audio.substring(5, semicolonIndex); // Extract MIME type after "data:"
          base64Data = audio.substring(commaIndex + 1); // Extract base64 after comma
          console.log("Extracted MIME type:", mimeType);
          console.log("Base64 data length:", base64Data.length);
        } else {
          console.error("Unexpected data URI format");
          throw new Error("Invalid audio format - could not parse data URI");
        }
      } else {
        // Raw base64 (preferred from client). Use provided mimeType if available.
        console.log("Audio appears to be raw base64");
        console.log("Client-provided MIME type:", mimeType);
        base64Data = audio;
      }
      
      // Note: very short recordings can still be valid, but usually indicate a failure to record.
      if (!base64Data || base64Data.length < 50) {
        console.error("Base64 data too short:", base64Data.length);
        throw new Error("Invalid audio format - please ensure audio is recorded correctly");
      }
      
      // Determine audio format for Gemini
      let audioFormat = "wav";
      if (mimeType.includes("webm")) {
        audioFormat = "webm";
      } else if (mimeType.includes("mp4") || mimeType.includes("m4a")) {
        audioFormat = "mp4";
      } else if (mimeType.includes("mpeg") || mimeType.includes("mp3")) {
        audioFormat = "mp3";
      } else if (mimeType.includes("ogg")) {
        audioFormat = "ogg";
      }
      
      console.log("Using audio format for Gemini:", audioFormat);
      
      // Transcribe the audio first
      try {
        userTranscription = await transcribeAudio(base64Data, audioFormat);
        console.log("Transcription successful:", userTranscription.substring(0, 100));
      } catch (transcribeError) {
        console.error("Transcription failed:", transcribeError);
        // Fallback: try to process without transcription
        userTranscription = "[Audio message - transcription unavailable]";
      }
      
      // Add the transcription as a text message
      messages.push({
        role: "user",
        content: `${userTranscription} ${bookingContext}\n\nBased on this information, if you have enough to create a complete payment plan (price, payment breakdown with percentages adding to 100%, and timing), call extract_payment_plan. Otherwise, call ask_clarification with a SHORT spoken question.`
      });
    } else if (textMessage) {
      // Handle text follow-up
      console.log("Processing text message:", textMessage.substring(0, 100));
      userTranscription = textMessage;
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
        
        // Generate TTS for confirmation
        const confirmationText = args.confirmationMessage || 
          `Got it! I've extracted a ${paymentSplit || 'payment'} plan with ${installments.length} installments.`;
        const audioResponse = await generateTTSAudio(confirmationText);
        
        return new Response(JSON.stringify({
          success: true,
          data: extractedPlan,
          responseText: confirmationText,
          responseAudio: audioResponse,
          userTranscription
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (functionName === 'ask_clarification') {
        console.log("Needs clarification:", args.question);
        
        // Generate TTS for the question
        const audioResponse = await generateTTSAudio(args.question);
        
        return new Response(JSON.stringify({
          success: true,
          needsClarification: true,
          question: args.question,
          missingFields: args.missingFields,
          responseAudio: audioResponse,
          userTranscription
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    // If no tool call, the model provided a text response - treat as clarification
    const textContent = choice.message?.content || '';
    if (textContent) {
      // Generate TTS for the response
      const audioResponse = await generateTTSAudio(textContent);
      
      return new Response(JSON.stringify({
        success: true,
        needsClarification: true,
        question: textContent,
        responseAudio: audioResponse,
        userTranscription
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
