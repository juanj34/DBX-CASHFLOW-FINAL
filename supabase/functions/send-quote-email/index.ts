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
      advisorEmail,
    }: QuoteEmailRequest = await req.json();

    console.log(`Sending quote email to ${clientEmail} for project ${projectName}`);

    const emailResponse = await resend.emails.send({
      from: "Dubai Invest Pro <onboarding@resend.dev>",
      to: [clientEmail],
      subject: `Investment Analysis — ${projectName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f0eb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #1C1917 0%, #292524 100%); padding: 48px 40px; text-align: center; border-radius: 12px 12px 0 0;">
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="width: 44px; height: 44px; background: linear-gradient(135deg, #C9A04A, #B3893A); border-radius: 10px; text-align: center; vertical-align: middle;">
                      <span style="color: #ffffff; font-size: 20px; font-weight: bold; line-height: 44px;">D</span>
                    </td>
                    <td style="padding-left: 14px;">
                      <span style="color: #F5F0EB; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">Dubai Invest Pro</span>
                    </td>
                  </tr>
                </table>
                <p style="color: #A8A29E; margin: 14px 0 0 0; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;">Investment Analysis</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="background-color: #ffffff; padding: 44px 40px;">
                <h2 style="color: #1C1917; margin: 0 0 8px 0; font-size: 22px; font-weight: 600;">Hello ${clientName},</h2>
                <p style="color: #78716C; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
                  Your investment analysis for <strong style="color: #1C1917;">${projectName}</strong> is ready for review.
                </p>

                <!-- Details Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 20px; background-color: #FAFAF9; border-left: 3px solid #C9A04A; border-radius: 6px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 8px;">
                            <span style="color: #A8A29E; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Project</span><br>
                            <span style="color: #1C1917; font-size: 14px; font-weight: 500;">${projectName}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: 8px;">
                            <span style="color: #A8A29E; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Unit Type</span><br>
                            <span style="color: #1C1917; font-size: 14px; font-weight: 500;">${unitType}</span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <span style="color: #A8A29E; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Prepared by</span><br>
                            <span style="color: #1C1917; font-size: 14px; font-weight: 500;">${advisorName}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="color: #78716C; font-size: 14px; line-height: 1.7; margin: 0 0 28px 0;">
                  This analysis includes projected returns, payment schedules, and exit strategies tailored to your investment profile.
                </p>

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align: center;">
                      <a href="${quoteUrl}" style="display: inline-block; background: linear-gradient(135deg, #C9A04A, #B3893A); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 14px; letter-spacing: 0.3px;">
                        View Your Analysis
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="color: #A8A29E; font-size: 12px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                  If the button doesn't work, copy this link:<br>
                  <a href="${quoteUrl}" style="color: #C9A04A; word-break: break-all; font-size: 11px;">${quoteUrl}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #1C1917; padding: 28px 40px; text-align: center; border-radius: 0 0 12px 12px;">
                ${advisorEmail ? `<p style="color: #A8A29E; font-size: 13px; margin: 0 0 8px 0;">Questions? Contact ${advisorName}: <a href="mailto:${advisorEmail}" style="color: #C9A04A; text-decoration: none;">${advisorEmail}</a></p>` : `<p style="color: #A8A29E; font-size: 13px; margin: 0 0 8px 0;">Questions? Contact your advisor: ${advisorName}</p>`}
                <p style="color: #78716C; font-size: 11px; margin: 0;">
                  &copy; ${new Date().getFullYear()} Dubai Invest Pro. All rights reserved.
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
