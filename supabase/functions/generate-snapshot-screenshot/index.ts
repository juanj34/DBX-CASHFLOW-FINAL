import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  shareToken: string;
  format: 'png' | 'pdf';
  view?: 'cashflow' | 'legacy'; // cashflow = main view (snapshot), legacy = old vertical
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN');

    if (!browserlessToken) {
      console.error('BROWSERLESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Screenshot service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await supabase.auth.getClaims(token);
    
    if (authError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { shareToken, format = 'png', view = 'cashflow' } = body;

    if (!shareToken) {
      return new Response(
        JSON.stringify({ error: 'shareToken is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating ${format} for ${view} view with shareToken: ${shareToken}`);

    // Build the URL to screenshot based on view type
    // 'cashflow' is now the main view using the /view/ route (formerly snapshot)
    // 'legacy' uses the old /cashflow/ route for backward compatibility
    const targetUrl = view === 'legacy'
      ? `https://dbxprime.lovable.app/cashflow/${shareToken}/print`
      : `https://dbxprime.lovable.app/view/${shareToken}/print`;
    
    // Selector to wait for based on view type
    const waitSelector = view === 'legacy' ? '.cashflow-print-content' : '.snapshot-print-content';

    // Browserless API endpoint
    const browserlessUrl = format === 'pdf' 
      ? `https://chrome.browserless.io/pdf?token=${browserlessToken}`
      : `https://chrome.browserless.io/screenshot?token=${browserlessToken}`;

    // Build request payload
    const browserlessPayload: any = {
      url: targetUrl,
      gotoOptions: {
        waitUntil: 'networkidle0',
        timeout: 30000,
      },
      waitForSelector: {
        selector: waitSelector,
        timeout: 20000,
      },
      waitForTimeout: 2000, // Extra wait for animations/images
    };

    if (format === 'pdf') {
      browserlessPayload.options = {
        format: 'A3',
        printBackground: true,
        landscape: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      };
    } else {
      // PNG screenshot
      browserlessPayload.options = {
        fullPage: true,
        type: 'png',
      };
      browserlessPayload.viewport = {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2, // 3840px effective width
      };
    }

    console.log('Calling Browserless API...');

    // Call Browserless
    const browserlessResponse = await fetch(browserlessUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(browserlessPayload),
    });

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error('Browserless error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate screenshot', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the binary data
    const screenshotBuffer = await browserlessResponse.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(screenshotBuffer)));

    console.log(`Successfully generated ${format}, size: ${screenshotBuffer.byteLength} bytes`);

    return new Response(
      JSON.stringify({ 
        data: base64,
        format,
        size: screenshotBuffer.byteLength,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-snapshot-screenshot:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
