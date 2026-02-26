import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://dubai-invest-pro.vercel.app";

interface WelcomeEmailRequest {
  userName: string;
  userEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-welcome-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, userEmail }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${userEmail}`);

    const emailResponse = await resend.emails.send({
      from: "Dubai Invest Pro <onboarding@resend.dev>",
      to: [userEmail],
      subject: "Welcome to Dubai Invest Pro",
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
                <p style="color: #A8A29E; margin: 14px 0 0 0; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;">Investment Strategy Platform</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="background-color: #ffffff; padding: 44px 40px;">
                <h2 style="color: #1C1917; margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Welcome, ${userName || "Investor"}.</h2>
                <p style="color: #78716C; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
                  Your account is ready. You now have access to professional-grade tools for Dubai real estate investment analysis.
                </p>

                <!-- Feature Cards -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 16px 18px; background-color: #FAFAF9; border-left: 3px solid #C9A04A; border-radius: 6px;">
                      <strong style="color: #1C1917; font-size: 14px;">Cashflow Generator</strong>
                      <p style="color: #78716C; font-size: 13px; margin: 4px 0 0 0; line-height: 1.5;">Create detailed investment projections with payment schedules, appreciation modeling, and exit analysis.</p>
                    </td>
                  </tr>
                  <tr><td style="height: 8px;"></td></tr>
                  <tr>
                    <td style="padding: 16px 18px; background-color: #FAFAF9; border-left: 3px solid #C9A04A; border-radius: 6px;">
                      <strong style="color: #1C1917; font-size: 14px;">Client Sharing</strong>
                      <p style="color: #78716C; font-size: 13px; margin: 4px 0 0 0; line-height: 1.5;">Generate branded investment reports and share them with clients via secure links.</p>
                    </td>
                  </tr>
                  <tr><td style="height: 8px;"></td></tr>
                  <tr>
                    <td style="padding: 16px 18px; background-color: #FAFAF9; border-left: 3px solid #C9A04A; border-radius: 6px;">
                      <strong style="color: #1C1917; font-size: 14px;">AI Payment Plan Extraction</strong>
                      <p style="color: #78716C; font-size: 13px; margin: 4px 0 0 0; line-height: 1.5;">Upload developer payment plans and let AI extract the details automatically.</p>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align: center; padding-top: 8px;">
                      <a href="${SITE_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #C9A04A, #B3893A); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 14px; letter-spacing: 0.3px;">
                        Go to Dashboard
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #1C1917; padding: 28px 40px; text-align: center; border-radius: 0 0 12px 12px;">
                <p style="color: #78716C; font-size: 11px; margin: 0; line-height: 1.6;">
                  &copy; ${new Date().getFullYear()} Dubai Invest Pro. All rights reserved.<br>
                  Professional tools for Dubai real estate investment analysis.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
