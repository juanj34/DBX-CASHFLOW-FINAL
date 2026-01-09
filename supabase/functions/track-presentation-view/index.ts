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
    const { presentationId, sessionId } = await req.json();

    if (!presentationId || !sessionId) {
      console.error('Missing required parameters:', { presentationId, sessionId });
      return new Response(
        JSON.stringify({ error: 'Missing presentationId or sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tracking presentation view:', { presentationId, sessionId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client info from request headers
    const userAgent = req.headers.get('user-agent') || null;
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;

    // Try to get geo info from CF headers if available
    const country = req.headers.get('cf-ipcountry') || null;
    const city = req.headers.get('cf-ipcity') || null;
    const region = req.headers.get('cf-region') || null;
    const timezone = req.headers.get('cf-timezone') || null;

    // Create a new view record
    const { data: viewData, error: viewError } = await supabase
      .from('presentation_views')
      .insert({
        presentation_id: presentationId,
        session_id: sessionId,
        started_at: new Date().toISOString(),
        user_agent: userAgent,
        ip_address: ipAddress,
        country: country,
        city: city,
        region: region,
        timezone: timezone,
      })
      .select('id')
      .single();

    if (viewError) {
      console.error('Error creating view record:', viewError);
      // Don't fail the request, just log the error
    } else {
      console.log('Created view record:', viewData?.id);
    }

    // Update the presentation view count and timestamps
    const { data: presentation, error: fetchError } = await supabase
      .from('presentations')
      .select('view_count, first_viewed_at')
      .eq('id', presentationId)
      .single();

    if (fetchError) {
      console.error('Error fetching presentation:', fetchError);
    } else {
      const updateData: Record<string, any> = {
        view_count: (presentation.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString(),
      };

      // Set first_viewed_at if not already set
      if (!presentation.first_viewed_at) {
        updateData.first_viewed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('presentations')
        .update(updateData)
        .eq('id', presentationId);

      if (updateError) {
        console.error('Error updating presentation:', updateError);
      } else {
        console.log('Updated presentation view count');
      }
    }

    return new Response(
      JSON.stringify({ success: true, sessionId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in track-presentation-view:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});