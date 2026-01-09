import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { presentationId, sessionId, durationSeconds } = await req.json();

    if (!presentationId || !sessionId || durationSeconds === undefined) {
      console.error('Missing required parameters:', { presentationId, sessionId, durationSeconds });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Updating presentation view duration:', { presentationId, sessionId, durationSeconds });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update the view record with duration
    const { error: updateError } = await supabase
      .from('presentation_views')
      .update({
        duration_seconds: durationSeconds,
        ended_at: new Date().toISOString(),
      })
      .eq('presentation_id', presentationId)
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('Error updating view duration:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update duration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Updated view duration successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-presentation-view-duration:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});