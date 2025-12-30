import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusNotificationRequest {
  brokerEmail: string;
  brokerName: string;
  clientName: string;
  projectName: string;
  dealValue: number;
  commission: number;
  newStatus: string;
  clientEmail?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Dubai Invest Pro <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      brokerEmail,
      brokerName,
      clientName,
      projectName,
      dealValue,
      commission,
      newStatus,
      clientEmail,
    }: StatusNotificationRequest = await req.json();

    console.log("Sending status notification:", { brokerEmail, projectName, newStatus });

    if (newStatus === "sold") {
      // Send congratulations email to broker
      const brokerEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f1419; color: #ffffff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .emoji { font-size: 48px; margin-bottom: 20px; }
            .title { font-size: 28px; font-weight: bold; color: #CCFF00; margin: 0; }
            .subtitle { font-size: 16px; color: #9ca3af; margin-top: 10px; }
            .card { background-color: #1a1f2e; border-radius: 16px; padding: 24px; margin: 20px 0; border: 1px solid #2a3142; }
            .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #2a3142; }
            .row:last-child { border-bottom: none; }
            .label { color: #9ca3af; font-size: 14px; }
            .value { color: #ffffff; font-weight: 600; font-size: 14px; }
            .commission { color: #22c55e; font-size: 24px; font-weight: bold; text-align: center; padding: 20px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">🎉</div>
              <h1 class="title">Congratulations, ${brokerName || 'Advisor'}!</h1>
              <p class="subtitle">Your deal has been successfully closed</p>
            </div>
            
            <div class="card">
              <div class="row">
                <span class="label">Project</span>
                <span class="value">${projectName || 'N/A'}</span>
              </div>
              <div class="row">
                <span class="label">Client</span>
                <span class="value">${clientName || 'N/A'}</span>
              </div>
              <div class="row">
                <span class="label">Deal Value</span>
                <span class="value">${formatCurrency(dealValue || 0)}</span>
              </div>
            </div>
            
            <div class="card">
              <p style="text-align: center; color: #9ca3af; margin: 0 0 10px 0;">Commission Earned</p>
              <p class="commission">${formatCurrency(commission || 0)}</p>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from Dubai Invest Pro.</p>
              <p>© ${new Date().getFullYear()} Dubai Invest Pro. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const brokerEmailResponse = await sendEmail(
        brokerEmail,
        `🎉 Deal Closed: ${projectName}`,
        brokerEmailHtml
      );

      console.log("Broker email sent:", brokerEmailResponse);

      // Optionally send email to client
      if (clientEmail) {
        const clientEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f1419; color: #ffffff; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .emoji { font-size: 48px; margin-bottom: 20px; }
              .title { font-size: 28px; font-weight: bold; color: #CCFF00; margin: 0; }
              .subtitle { font-size: 16px; color: #9ca3af; margin-top: 10px; }
              .card { background-color: #1a1f2e; border-radius: 16px; padding: 24px; margin: 20px 0; border: 1px solid #2a3142; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 40px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="emoji">🏠</div>
                <h1 class="title">Congratulations, ${clientName}!</h1>
                <p class="subtitle">Your investment in ${projectName} has been confirmed</p>
              </div>
              
              <div class="card">
                <p style="color: #9ca3af; line-height: 1.6;">
                  Thank you for trusting us with your investment journey. Your advisor ${brokerName || 'will'} will be in touch with the next steps.
                </p>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} Dubai Invest Pro. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const clientEmailResponse = await sendEmail(
          clientEmail,
          `Your Investment in ${projectName} is Confirmed!`,
          clientEmailHtml
        );

        console.log("Client email sent:", clientEmailResponse);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Notification sent successfully" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // For other status changes, just log
    console.log(`Status changed to ${newStatus} for ${projectName}`);
    
    return new Response(
      JSON.stringify({ success: true, message: "Status logged" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-status-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
