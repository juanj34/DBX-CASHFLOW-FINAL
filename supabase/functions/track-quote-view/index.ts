import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

interface TrackViewRequest {
  shareToken: string;
}

interface GeoLocation {
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
}

// Get client IP from request headers
function getClientIP(req: Request): string | null {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  
  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }
  
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  return null;
}

// Get geolocation data from IP using free ip-api.com service
async function getGeoLocation(ip: string): Promise<GeoLocation | null> {
  try {
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
      console.log("Skipping geolocation for private IP:", ip);
      return null;
    }
    
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,timezone`);
    const data = await response.json();
    
    if (data.status === "success") {
      return {
        city: data.city,
        region: data.regionName,
        country: data.country,
        countryCode: data.countryCode,
        timezone: data.timezone,
      };
    }
    
    console.log("Geolocation lookup failed:", data);
    return null;
  } catch (error) {
    console.error("Error fetching geolocation:", error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("track-quote-view function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shareToken }: TrackViewRequest = await req.json();

    if (!shareToken) {
      console.error("Missing shareToken");
      return new Response(
        JSON.stringify({ success: false, error: "Missing shareToken" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Tracking view for shareToken: ${shareToken}`);

    const clientIP = getClientIP(req);
    const userAgent = req.headers.get("user-agent") || null;
    console.log("Client IP:", clientIP);
    
    let geoLocation: GeoLocation | null = null;
    if (clientIP) {
      geoLocation = await getGeoLocation(clientIP);
      console.log("Geolocation:", geoLocation);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the quote and broker profile
    const { data: quote, error: fetchError } = await supabase
      .from("cashflow_quotes")
      .select(`
        id,
        view_count,
        first_viewed_at,
        client_name,
        project_name,
        broker_id,
        profiles:broker_id (
          email,
          full_name,
          business_email
        )
      `)
      .eq("share_token", shareToken)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching quote:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!quote) {
      console.error("Quote not found for shareToken:", shareToken);
      return new Response(
        JSON.stringify({ success: false, error: "Quote not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const isFirstView = !quote.first_viewed_at;
    const newViewCount = (quote.view_count || 0) + 1;
    const now = new Date().toISOString();

    // Generate session ID for this view
    const sessionId = crypto.randomUUID();

    // Create a new view session record
    const { error: viewInsertError } = await supabase
      .from("quote_views")
      .insert({
        quote_id: quote.id,
        session_id: sessionId,
        started_at: now,
        city: geoLocation?.city || null,
        region: geoLocation?.region || null,
        country: geoLocation?.country || null,
        country_code: geoLocation?.countryCode || null,
        timezone: geoLocation?.timezone || null,
        ip_address: clientIP || null,
        user_agent: userAgent,
      });

    if (viewInsertError) {
      console.error("Error inserting view session:", viewInsertError);
      // Continue - don't fail the whole request if view tracking fails
    } else {
      console.log("Created view session:", sessionId);
    }

    // Update view count, first_viewed_at, and last_viewed_at
    const updateData: { view_count: number; first_viewed_at?: string; last_viewed_at: string } = {
      view_count: newViewCount,
      last_viewed_at: now,
    };

    if (isFirstView) {
      updateData.first_viewed_at = now;
    }

    const { error: updateError } = await supabase
      .from("cashflow_quotes")
      .update(updateData)
      .eq("id", quote.id);

    if (updateError) {
      console.error("Error updating view count:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`View count updated to ${newViewCount} for quote ${quote.id}`);

    // Send email notification on first view
    if (isFirstView && quote.profiles) {
      const brokerProfile = quote.profiles as unknown as { email: string; full_name: string | null; business_email: string | null };
      const brokerEmail = brokerProfile?.business_email || brokerProfile?.email;
      
      if (brokerEmail) {
        console.log(`Sending first view notification to broker: ${brokerEmail}`);
        try {
          let locationString = "Unknown location";
          let locationFlag = "🌍";
          
          if (geoLocation) {
            const parts = [];
            if (geoLocation.city) parts.push(geoLocation.city);
            if (geoLocation.region && geoLocation.region !== geoLocation.city) parts.push(geoLocation.region);
            if (geoLocation.country) parts.push(geoLocation.country);
            
            if (parts.length > 0) {
              locationString = parts.join(", ");
            }
            
            if (geoLocation.countryCode) {
              const codePoints = geoLocation.countryCode
                .toUpperCase()
                .split("")
                .map(char => 127397 + char.charCodeAt(0));
              locationFlag = String.fromCodePoint(...codePoints);
            }
          }
          
          await resend.emails.send({
            from: "InvestDubai <onboarding@resend.dev>",
            to: [brokerEmail],
            subject: `👀 ${quote.client_name || "Your client"} just viewed their quote`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #1a1f2e 0%, #2a3142 100%); padding: 30px; text-align: center;">
                      <h1 style="color: #CCFF00; margin: 0; font-size: 24px; font-weight: bold;">🎉 Your client is interested!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px;">
                      <h2 style="color: #1a1f2e; margin: 0 0 15px 0; font-size: 20px;">
                        Hi ${brokerProfile.full_name || "there"},
                      </h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Great news! <strong style="color: #1a1f2e;">${quote.client_name || "Your client"}</strong> 
                        just opened the investment analysis you shared for 
                        <strong style="color: #1a1f2e;">${quote.project_name || "the property"}</strong>.
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #1a1f2e; font-size: 14px; margin: 0 0 8px 0;">
                              <strong>📅 Viewed at:</strong> ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                            <p style="color: #1a1f2e; font-size: 14px; margin: 0 0 8px 0;">
                              <strong>${locationFlag} Location:</strong> ${locationString}
                            </p>
                            ${geoLocation?.timezone ? `
                            <p style="color: #1a1f2e; font-size: 14px; margin: 0 0 8px 0;">
                              <strong>🕐 Client timezone:</strong> ${geoLocation.timezone}
                            </p>
                            ` : ''}
                            <p style="color: #1a1f2e; font-size: 14px; margin: 0;">
                              <strong>📊 Project:</strong> ${quote.project_name || "Not specified"}
                            </p>
                          </td>
                        </tr>
                      </table>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                        This is a great time to follow up! Consider reaching out via WhatsApp or email to answer any questions they might have.
                      </p>
                      <p style="color: #888888; font-size: 13px; line-height: 1.5; margin: 0;">
                        💡 <em>Tip: Knowing your client's location can help you time your follow-up calls for when they're most available.</em>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #1a1f2e; padding: 20px; text-align: center;">
                      <p style="color: #888888; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} InvestDubai. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
          });
          
          console.log("First view notification email sent successfully");
        } catch (emailError) {
          console.error("Error sending first view notification email:", emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        view_count: newViewCount, 
        first_viewed_at: isFirstView ? now : quote.first_viewed_at,
        is_first_view: isFirstView,
        session_id: sessionId,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in track-quote-view function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);