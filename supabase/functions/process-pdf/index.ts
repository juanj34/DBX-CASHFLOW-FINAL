import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64 } = await req.json();
    
    if (!pdfBase64) {
      throw new Error("No PDF data provided");
    }

    // For now, we'll return the PDF as-is since Gemini can process PDFs directly
    // In a more complex implementation, we could use pdf.js to extract pages as images
    
    console.log("Processing PDF, size:", pdfBase64.length);
    
    // Return the PDF data - Gemini 2.5 Flash can handle PDFs directly
    return new Response(
      JSON.stringify({ 
        success: true,
        // Return as single "page" for now - Gemini handles the PDF internally
        images: [`data:application/pdf;base64,${pdfBase64}`]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("PDF processing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
