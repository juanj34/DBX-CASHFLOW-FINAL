import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QuoteEmailRequest {
  clientName: string;
  clientEmail: string;
  projectName: string;
  unitType: string;
  quoteUrl: string;
  advisorName: string;
  advisorEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-quote-email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      clientName, 
      clientEmail, 
      projectName, 
      unitType, 
      quoteUrl, 
      advisorName,
      advisorEmail 
    }: QuoteEmailRequest = await req.json();

    console.log(`Sending quote email to ${clientEmail} for project ${projectName}`);

    const emailResponse = await resend.emails.send({
      from: "InvestDubai <onboarding@resend.dev>",
      to: [clientEmail],
      subject: `Your Investment Analysis for ${projectName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #1a1f2e 0%, #2a3142 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #CCFF00; margin: 0; font-size: 28px; font-weight: bold;">InvestDubai</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">Investment Analysis Platform</p>
              </td>
            </tr>
            
            <!-- Main Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="color: #1a1f2e; margin: 0 0 20px 0; font-size: 24px;">Hello ${clientName},</h2>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Your personalized investment analysis for <strong style="color: #1a1f2e;">${projectName}</strong> is ready!
                </p>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                  <tr>
                    <td style="padding: 20px;">
                      <p style="color: #1a1f2e; font-size: 14px; margin: 0 0 10px 0;"><strong>Project:</strong> ${projectName}</p>
                      <p style="color: #1a1f2e; font-size: 14px; margin: 0 0 10px 0;"><strong>Unit Type:</strong> ${unitType}</p>
                      <p style="color: #1a1f2e; font-size: 14px; margin: 0;"><strong>Your Advisor:</strong> ${advisorName}</p>
                    </td>
                  </tr>
                </table>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                  This comprehensive analysis includes projected returns, payment schedules, and exit strategies tailored to your investment goals.
                </p>
                
                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align: center;">
                      <a href="${quoteUrl}" style="display: inline-block; background-color: #CCFF00; color: #1a1f2e; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        View Your Analysis
                      </a>
                    </td>
                  </tr>
                </table>
                
                <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${quoteUrl}" style="color: #CCFF00; word-break: break-all;">${quoteUrl}</a>
                </p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #1a1f2e; padding: 30px; text-align: center;">
                <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact your advisor: ${advisorEmail || advisorName}
                </p>
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

    console.log("Quote email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-quote-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
