import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuoteData {
  id: string;
  title: string;
  projectName?: string;
  developer?: string;
  inputs: any;
  metrics: {
    basePrice: number;
    totalInvestment: number;
    annualRent: number;
    netAnnualRent: number;
    rentalYield: number;
    roiAtExit: number;
    annualizedROE: number;
    constructionMonths: number;
    propertyValueAtHandover: number;
  };
}

interface ExportRequest {
  title: string;
  advisorName: string;
  advisorEmail?: string;
  advisorPhone?: string;
  quotes: QuoteData[];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ExportRequest = await req.json();
    console.log('Generating comparison PDF for:', data.title, 'with', data.quotes.length, 'quotes');

    const quoteCards = data.quotes.map((q, i) => {
      const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500'];
      const color = colors[i % colors.length];
      
      return `
        <div style="background: #1a1f2e; border-radius: 12px; padding: 20px; border-top: 3px solid ${color};">
          <h3 style="margin: 0 0 8px 0; color: white; font-size: 16px;">${q.title}</h3>
          ${q.projectName ? `<p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 13px;">${q.projectName}</p>` : ''}
          ${q.developer ? `<p style="margin: 0 0 16px 0; color: #6b7280; font-size: 12px;">by ${q.developer}</p>` : ''}
          
          <div style="display: grid; gap: 12px;">
            <div style="background: #0f1318; padding: 12px; border-radius: 8px;">
              <span style="color: #6b7280; font-size: 11px; text-transform: uppercase;">Base Price</span>
              <p style="margin: 4px 0 0; color: white; font-size: 18px; font-weight: bold;">${formatCurrency(q.metrics.basePrice)}</p>
            </div>
            <div style="background: #0f1318; padding: 12px; border-radius: 8px;">
              <span style="color: #6b7280; font-size: 11px; text-transform: uppercase;">Annual Rent</span>
              <p style="margin: 4px 0 0; color: #22c55e; font-size: 16px; font-weight: bold;">${formatCurrency(q.metrics.annualRent)}</p>
            </div>
            <div style="background: #0f1318; padding: 12px; border-radius: 8px;">
              <span style="color: #6b7280; font-size: 11px; text-transform: uppercase;">Rental Yield</span>
              <p style="margin: 4px 0 0; color: ${color}; font-size: 16px; font-weight: bold;">${formatPercent(q.metrics.rentalYield)}</p>
            </div>
            <div style="background: #0f1318; padding: 12px; border-radius: 8px;">
              <span style="color: #6b7280; font-size: 11px; text-transform: uppercase;">ROI at Exit</span>
              <p style="margin: 4px 0 0; color: #22c55e; font-size: 16px; font-weight: bold;">${formatPercent(q.metrics.roiAtExit)}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Metrics comparison table
    const metricsRows = [
      { label: 'Base Price', key: 'basePrice', format: formatCurrency },
      { label: 'Total Investment', key: 'totalInvestment', format: formatCurrency },
      { label: 'Annual Rent', key: 'annualRent', format: formatCurrency },
      { label: 'Net Annual Rent', key: 'netAnnualRent', format: formatCurrency },
      { label: 'Rental Yield', key: 'rentalYield', format: formatPercent },
      { label: 'ROI at Exit', key: 'roiAtExit', format: formatPercent },
      { label: 'Annualized ROE', key: 'annualizedROE', format: formatPercent },
      { label: 'Value at Handover', key: 'propertyValueAtHandover', format: formatCurrency },
    ];

    const tableHeaders = data.quotes.map((q, i) => {
      const colors = ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500'];
      return `<th style="padding: 12px 16px; text-align: right; color: ${colors[i % colors.length]}; font-weight: 600; font-size: 13px;">${q.title}</th>`;
    }).join('');

    const tableRows = metricsRows.map(row => {
      const cells = data.quotes.map((q: QuoteData) => {
        const value = q.metrics[row.key as keyof typeof q.metrics];
        return `<td style="padding: 12px 16px; text-align: right; color: white; font-size: 14px;">${row.format(value as number)}</td>`;
      }).join('');
      
      return `
        <tr style="border-bottom: 1px solid #2a3142;">
          <td style="padding: 12px 16px; color: #9ca3af; font-size: 13px;">${row.label}</td>
          ${cells}
        </tr>
      `;
    }).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f1318;
      color: white;
      padding: 40px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 1px solid #2a3142; padding-bottom: 24px;">
    <div>
      <h1 style="font-size: 28px; color: #CCFF00; margin-bottom: 8px;">📊 ${data.title}</h1>
      <p style="color: #9ca3af; font-size: 14px;">Investment Comparison Report • Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>
    <div style="text-align: right;">
      <p style="color: white; font-weight: 600; font-size: 14px;">${data.advisorName}</p>
      ${data.advisorEmail ? `<p style="color: #9ca3af; font-size: 13px;">${data.advisorEmail}</p>` : ''}
      ${data.advisorPhone ? `<p style="color: #9ca3af; font-size: 13px;">${data.advisorPhone}</p>` : ''}
    </div>
  </div>

  <!-- Property Cards -->
  <h2 style="font-size: 18px; color: white; margin-bottom: 16px;">Properties Compared</h2>
  <div style="display: grid; grid-template-columns: repeat(${Math.min(data.quotes.length, 4)}, 1fr); gap: 16px; margin-bottom: 40px;">
    ${quoteCards}
  </div>

  <!-- Metrics Comparison Table -->
  <h2 style="font-size: 18px; color: white; margin-bottom: 16px;">Key Metrics Comparison</h2>
  <div style="background: #1a1f2e; border-radius: 12px; overflow: hidden; margin-bottom: 40px;">
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #0f1318; border-bottom: 1px solid #2a3142;">
          <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase;">Metric</th>
          ${tableHeaders}
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div style="text-align: center; color: #6b7280; font-size: 12px; padding-top: 24px; border-top: 1px solid #2a3142;">
    <p>This comparison report is for informational purposes only. Past performance does not guarantee future results.</p>
    <p style="margin-top: 8px;">Generated by Dubai Invest Pro</p>
  </div>

  <!-- Print Button -->
  <div class="no-print" style="position: fixed; bottom: 20px; right: 20px;">
    <button onclick="window.print()" style="background: #CCFF00; color: black; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>
    `;

    console.log('Successfully generated comparison PDF HTML');
    
    return new Response(html, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html; charset=utf-8' 
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating comparison PDF:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
