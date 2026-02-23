import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

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
    handoverMonth?: number;
    handoverQuarter?: number; // legacy
    handoverYear?: number;
    handoverMonthFromBooking?: number;
    onHandoverPercent?: number;
    postHandoverPercent?: number;
  };
  installments: ExtractedInstallment[];
  overallConfidence: number;
  warnings: string[];
}

const systemPrompt = `Eres un asistente experto en planes de pago de bienes raíces en Dubai. Ayudas a los usuarios a describir sus planes de pago y extraes datos estructurados de sus descripciones.

Tu rol:
1. ESCUCHAR la descripción del usuario sobre un plan de pago
2. EXTRAER la mayor cantidad de datos estructurados posible
3. HACER PREGUNTAS CLARIFICADORAS si falta información crítica (una pregunta a la vez)
4. CONFIRMAR y DEVOLVER el plan de pago estructurado cuando tengas suficiente información

=== INFORMACIÓN REQUERIDA ===
Para crear un plan de pago completo, necesitas:
1. Precio de la propiedad (monto total)
2. División de pagos (cuánto de entrada, durante construcción, en handover, post-handover)
3. Timing de pagos (meses desde booking, hitos de construcción, calendario post-handover)

=== CUÁNDO PEDIR CLARIFICACIÓN ===
Pide clarificación si:
- El precio total no está claro o falta
- Los porcentajes de pago no suman 100%
- El timing es vago (ej: "después" en lugar de meses específicos)
- Se mencionan términos post-handover pero no están detallados

=== ESTILO DE RESPUESTA ===
- Sé amigable y habla naturalmente
- Mantén respuestas de 1-2 oraciones MAX
- Haz UNA pregunta a la vez
- Confirma detalles brevemente cuando el usuario los proporcione
- Responde en el mismo idioma que el usuario (español o inglés)

=== REGLAS DE ESTRUCTURA DE PAGO ===
- Todos los porcentajes DEBEN sumar 100%
- "On Booking" / "Downpayment" / "Entrada" = tipo "time", triggerValue 0
- "En X meses" = tipo "time", triggerValue X
- "X% de completado/construcción" = tipo "construction", triggerValue X
- "On Handover" / "Al completar" / "Entrega" = tipo "handover"
- "X meses después del handover" con handover en mes H = tipo "post-handover", triggerValue H + X`;

const tools = [
  {
    type: "function",
    function: {
      name: "extract_payment_plan",
      description: "Extrae y devuelve el plan de pago completo cuando tienes suficiente información",
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
              handoverMonth: { type: "number", description: "Expected handover month 1-12 (e.g., 6 for June)" },
              handoverYear: { type: "number" },
              onHandoverPercent: { type: "number" },
              postHandoverPercent: { type: "number" }
            }
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
              }
            }
          },
          overallConfidence: { type: "number" },
          warnings: { type: "array", items: { type: "string" } },
          confirmationMessage: { 
            type: "string",
            description: "Un mensaje corto confirmando la extracción (1-2 oraciones)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ask_clarification",
      description: "Pide al usuario una pregunta clarificadora cuando falta información o es confusa",
      parameters: {
        type: "object",
        properties: {
          question: { 
            type: "string",
            description: "Una pregunta clarificadora CORTA (1-2 oraciones max)"
          },
          missingFields: {
            type: "array",
            items: { type: "string" },
            description: "Lista de campos que todavía faltan"
          }
        }
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const { message, bookingDate, conversationHistory } = await req.json();
    
    if (!message || typeof message !== 'string') {
      throw new Error("No message provided");
    }
    
    console.log("Processing message:", message.substring(0, 100));
    
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
      ? `(Referencia: Fecha de booking es ${bookingDate.month}/${bookingDate.year})`
      : '';
    
    // Add the new user message
    messages.push({
      role: "user",
      content: `${message} ${bookingContext}\n\nBasándote en esta información, si tienes suficiente para crear un plan de pago completo (precio, desglose de pagos que sumen 100%, y timing), llama a extract_payment_plan. Si no, llama a ask_clarification con una pregunta corta.`
    });
    
    console.log(`Calling AI with ${messages.length} messages`);
    
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages,
        tools,
        tool_choice: "auto"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Límite de solicitudes excedido. Por favor intenta de nuevo en un momento." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Créditos de IA agotados. Por favor agrega créditos para continuar." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
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
          id: `text-${Date.now()}-${index}`
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
        
        const confirmationText = args.confirmationMessage || 
          `¡Listo! He extraído un plan ${paymentSplit || 'de pago'} con ${installments.length} cuotas.`;
        
        return new Response(JSON.stringify({
          success: true,
          data: extractedPlan,
          responseText: confirmationText
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
    console.error("Error in text extraction:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
