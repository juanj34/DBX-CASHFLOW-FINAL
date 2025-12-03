import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAPBOX_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const systemPrompt = `You are an AI assistant for a Dubai real estate map application. Help admins add projects and hotspots.

CAPABILITIES:
1. Analyze brochures/images to extract project details
2. Parse text descriptions for project/hotspot information  
3. Use knowledge of Dubai real estate to fill in details
4. Geocode locations to get coordinates

INPUT HANDLING:
- IMAGES: Extract project name, developer, prices, unit types, amenities, location, delivery dates
- TEXT: Parse for explicit details (these override image data)
- BOTH: Combine all sources, text takes priority

REQUIRED FIELDS:
- Projects: name, location (for geocoding)
- Hotspots: title, category, location

ALWAYS:
- Extract maximum data automatically
- Only ask clarification for missing required fields
- Use tool calling to return structured data
- Be concise in responses
- For locations, try to extract area/district name in Dubai

KNOWN DUBAI DEVELOPERS: Emaar, DAMAC, Sobha, Nakheel, Meraas, Dubai Properties, Azizi, Omniyat, Select Group, Ellington, Binghatti, Danube

HOTSPOT CATEGORIES: landmark, transportation, attraction, project, other

CONSTRUCTION STATUS OPTIONS: off_plan, under_construction, ready`;

const tools = [
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a new real estate project with extracted data",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name" },
          location: { type: "string", description: "Location/area in Dubai for geocoding" },
          description: { type: "string", description: "Project description" },
          developer: { type: "string", description: "Developer name" },
          starting_price: { type: "number", description: "Starting price in AED" },
          price_per_sqft: { type: "number", description: "Price per square foot in AED" },
          unit_types: { type: "array", items: { type: "string" }, description: "Types of units (Studio, 1BR, 2BR, etc)" },
          areas_from: { type: "number", description: "Minimum area in sq.ft" },
          launch_date: { type: "string", description: "Launch date (YYYY-MM-DD format)" },
          delivery_date: { type: "string", description: "Expected delivery date (YYYY-MM-DD format)" },
          construction_status: { type: "string", enum: ["off_plan", "under_construction", "ready"], description: "Current construction status" },
        },
        required: ["name", "location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_hotspot",
      description: "Create a new hotspot/point of interest",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Hotspot name" },
          location: { type: "string", description: "Location in Dubai for geocoding" },
          category: { type: "string", enum: ["landmark", "transportation", "attraction", "project", "other"], description: "Hotspot category" },
          description: { type: "string", description: "Description of the hotspot" },
        },
        required: ["title", "location", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_clarification",
      description: "Ask the user for missing required information",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string", description: "The question to ask the user" },
          missing_fields: { type: "array", items: { type: "string" }, description: "List of missing required fields" },
        },
        required: ["question", "missing_fields"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_coordinates",
      description: "Request manual coordinates when geocoding fails",
      parameters: {
        type: "object",
        properties: {
          location_attempted: { type: "string", description: "The location that failed to geocode" },
          suggestions: { type: "array", items: { type: "string" }, description: "Alternative location names to try" },
        },
        required: ["location_attempted"],
      },
    },
  },
];

async function geocodeLocation(location: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!MAPBOX_TOKEN) {
    console.error("MAPBOX_ACCESS_TOKEN not configured");
    return null;
  }

  try {
    // Add Dubai context to improve results
    const searchQuery = location.toLowerCase().includes("dubai") ? location : `${location}, Dubai, UAE`;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=1&bbox=54.9,24.7,56.5,25.6`;
    
    console.log("Geocoding:", searchQuery);
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      console.log("Geocoded to:", { latitude, longitude });
      return { latitude, longitude };
    }
    
    console.log("No geocoding results for:", location);
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, images, action, data } = await req.json();
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Handle confirmation action
    if (action === "confirm") {
      console.log("Confirming data insertion:", data);
      
      if (data.type === "project") {
        const { error } = await supabase.from("projects").insert({
          name: data.name,
          latitude: data.latitude,
          longitude: data.longitude,
          description: data.description,
          developer: data.developer,
          starting_price: data.starting_price,
          price_per_sqft: data.price_per_sqft,
          unit_types: data.unit_types,
          areas_from: data.areas_from,
          launch_date: data.launch_date,
          delivery_date: data.delivery_date,
          construction_status: data.construction_status,
        });
        
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: `Proyecto "${data.name}" creado exitosamente.` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (data.type === "hotspot") {
        const { error } = await supabase.from("hotspots").insert({
          title: data.title,
          latitude: data.latitude,
          longitude: data.longitude,
          category: data.category,
          description: data.description,
          visible: true,
        });
        
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: `Hotspot "${data.title}" creado exitosamente.` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle manual coordinates
    if (action === "set_coordinates") {
      return new Response(
        JSON.stringify({ 
          ...data, 
          latitude: data.latitude, 
          longitude: data.longitude,
          needsConfirmation: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build messages for AI
    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    for (const msg of messages) {
      if (msg.role === "user") {
        // Check if message has images
        if (msg.images && msg.images.length > 0) {
          const content: any[] = [{ type: "text", text: msg.content || "Analiza estas imágenes y extrae la información del proyecto o hotspot." }];
          for (const img of msg.images) {
            content.push({
              type: "image_url",
              image_url: { url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}` }
            });
          }
          aiMessages.push({ role: "user", content });
        } else {
          aiMessages.push({ role: "user", content: msg.content });
        }
      } else {
        aiMessages.push({ role: "assistant", content: msg.content });
      }
    }

    // Add current images if any
    if (images && images.length > 0) {
      const lastUserMsg = aiMessages[aiMessages.length - 1];
      if (lastUserMsg.role === "user" && typeof lastUserMsg.content === "string") {
        const content: any[] = [{ type: "text", text: lastUserMsg.content }];
        for (const img of images) {
          content.push({
            type: "image_url",
            image_url: { url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}` }
          });
        }
        aiMessages[aiMessages.length - 1] = { role: "user", content };
      }
    }

    console.log("Calling Lovable AI with", aiMessages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse, null, 2));
    
    const choice = aiResponse.choices[0];
    const message = choice.message;

    // Check for tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log("Tool call:", functionName, args);

      if (functionName === "create_project") {
        // Geocode the location
        const coords = await geocodeLocation(args.location);
        
        if (!coords) {
          return new Response(
            JSON.stringify({
              type: "request_coordinates",
              message: `No pude encontrar las coordenadas para "${args.location}". ¿Podrías proporcionar una ubicación más específica o las coordenadas manualmente?`,
              data: { ...args, type: "project" },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            type: "preview",
            itemType: "project",
            data: {
              type: "project",
              ...args,
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
            message: `He extraído la información del proyecto "${args.name}". Revisa los datos y confirma para guardarlo.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (functionName === "create_hotspot") {
        const coords = await geocodeLocation(args.location);
        
        if (!coords) {
          return new Response(
            JSON.stringify({
              type: "request_coordinates",
              message: `No pude encontrar las coordenadas para "${args.location}". ¿Podrías proporcionar una ubicación más específica o las coordenadas manualmente?`,
              data: { ...args, type: "hotspot" },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            type: "preview",
            itemType: "hotspot",
            data: {
              type: "hotspot",
              ...args,
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
            message: `He extraído la información del hotspot "${args.title}". Revisa los datos y confirma para guardarlo.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (functionName === "ask_clarification") {
        return new Response(
          JSON.stringify({
            type: "clarification",
            message: args.question,
            missingFields: args.missing_fields,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (functionName === "request_coordinates") {
        return new Response(
          JSON.stringify({
            type: "request_coordinates",
            message: `No pude geocodificar "${args.location_attempted}". ${args.suggestions ? `Prueba con: ${args.suggestions.join(", ")}` : "Por favor proporciona las coordenadas manualmente o una ubicación más específica."}`,
            data: args,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Regular text response
    return new Response(
      JSON.stringify({
        type: "message",
        message: message.content || "No pude procesar tu solicitud. ¿Podrías proporcionar más detalles?",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
