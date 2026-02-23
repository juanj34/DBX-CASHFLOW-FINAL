import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userName: string;
  userEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-welcome-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, userEmail }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${userEmail}`);

    const emailResponse = await resend.emails.send({
      from: "InvestDubai <onboarding@resend.dev>",
      to: [userEmail],
      subject: "Welcome to InvestDubai - Your Investment Journey Begins!",
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

            <!-- Welcome Message -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="color: #1a1f2e; margin: 0 0 20px 0; font-size: 24px;">Welcome, ${userName || 'Investor'}!</h2>

                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Thank you for joining InvestDubai. You now have access to our comprehensive real estate investment analysis tools.
                </p>

                <h3 style="color: #1a1f2e; margin: 20px 0 15px 0; font-size: 18px;">What you can do:</h3>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                      <table>
                        <tr>
                          <td style="vertical-align: top; padding-right: 15px;">
                            <span style="display: inline-block; width: 40px; height: 40px; background-color: #CCFF00; border-radius: 50%; text-align: center; line-height: 40px; font-size: 20px;">📊</span>
                          </td>
                          <td>
                            <strong style="color: #1a1f2e; font-size: 16px;">Cashflow Generator</strong>
                            <p style="color: #666666; font-size: 14px; margin: 5px 0 0 0;">Create detailed investment projections and ROI analysis</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr><td style="height: 10px;"></td></tr>
                  <tr>
                    <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
                      <table>
                        <tr>
                          <td style="vertical-align: top; padding-right: 15px;">
                            <span style="display: inline-block; width: 40px; height: 40px; background-color: #CCFF00; border-radius: 50%; text-align: center; line-height: 40px; font-size: 20px;">📈</span>
                          </td>
                          <td>
                            <strong style="color: #1a1f2e; font-size: 16px;">Investment Analysis</strong>
                            <p style="color: #666666; font-size: 14px; margin: 5px 0 0 0;">Deep-dive into ROI, exits, mortgage coverage, and scenario modeling</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr><td style="height: 10px;"></td></tr>
                  <tr>
                    <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
                      <table>
                        <tr>
                          <td style="vertical-align: top; padding-right: 15px;">
                            <span style="display: inline-block; width: 40px; height: 40px; background-color: #CCFF00; border-radius: 50%; text-align: center; line-height: 40px; font-size: 20px;">⚖️</span>
                          </td>
                          <td>
                            <strong style="color: #1a1f2e; font-size: 16px;">Quote Comparison</strong>
                            <p style="color: #666666; font-size: 14px; margin: 5px 0 0 0;">Compare multiple investments side by side</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 30px 0;">
                  Ready to start analyzing your first investment?
                </p>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align: center;">
                      <a href="https://wfihvfnanvkvezdrnrgp.lovableproject.com/home" style="display: inline-block; background-color: #CCFF00; color: #1a1f2e; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Go to Dashboard
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #1a1f2e; padding: 30px; text-align: center;">
                <p style="color: #888888; font-size: 12px; margin: 0;">
                  &copy; ${new Date().getFullYear()} InvestDubai. All rights reserved.
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
