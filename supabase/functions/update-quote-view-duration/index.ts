import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UpdateDurationRequest {
  sessionId: string;
  durationSeconds: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("update-quote-view-duration function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, durationSeconds }: UpdateDurationRequest = await req.json();

    if (!sessionId) {
      console.error("Missing sessionId");
      return new Response(
        JSON.stringify({ success: false, error: "Missing sessionId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (typeof durationSeconds !== "number" || durationSeconds < 0) {
      console.error("Invalid durationSeconds:", durationSeconds);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid durationSeconds" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Updating duration for session ${sessionId}: ${durationSeconds}s`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // Update the view session with end time and duration
    const { error: updateError, data: updatedView } = await supabase
      .from("quote_views")
      .update({
        ended_at: now,
        duration_seconds: Math.round(durationSeconds),
      })
      .eq("session_id", sessionId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating view duration:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!updatedView) {
      console.log("No view session found for sessionId:", sessionId);
      // Not an error - the session might have expired or been cleaned up
      return new Response(
        JSON.stringify({ success: true, updated: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Updated view duration for session ${sessionId}`);

    return new Response(
      JSON.stringify({ success: true, updated: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in update-quote-view-duration function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);