import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Currency formatting
const formatCurrency = (value: number, currency: string, rate: number): string => {
  const converted = currency === 'AED' ? value : value * rate;
  const configs: Record<string, { symbol: string; locale: string }> = {
    AED: { symbol: 'AED', locale: 'en-AE' },
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' },
    GBP: { symbol: '£', locale: 'en-GB' },
    COP: { symbol: 'COP', locale: 'es-CO' },
  };
  const config = configs[currency] || configs.AED;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency === 'COP' ? 'COP' : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(converted);
};

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inputs, clientInfo, calculations, exitScenarios, advisorName, currency, rate } = await req.json();
    
    console.log('Generating PDF for:', clientInfo?.projectName || 'Unknown Project');

    // Calculate exit scenario data
    const totalMonths = calculations?.totalMonths || 36;
    const basePrice = inputs?.basePrice || 0;
    const appreciationRate = inputs?.appreciationRate || 8;
    const dldFeePercent = inputs?.dldFeePercent || 4;
    const oqoodFee = inputs?.oqoodFee || 5000;
    const downpaymentPercent = inputs?.downpaymentPercent || 20;
    const eoiFee = inputs?.eoiFee || 50000;
    const minimumExitThreshold = inputs?.minimumExitThreshold || 30;
    const additionalPayments = inputs?.additionalPayments || [];

    // Calculate entry costs
    const dldFee = basePrice * (dldFeePercent / 100);
    const totalEntryCosts = dldFee + oqoodFee;

    // Calculate equity at exit
    const calculateEquityAtExit = (exitMonth: number): number => {
      const downpayment = basePrice * (downpaymentPercent / 100);
      let additionalTotal = 0;
      
      for (const payment of additionalPayments) {
        if (payment.type === 'time' && exitMonth >= payment.triggerValue) {
          additionalTotal += basePrice * (payment.paymentPercent / 100);
        } else if (payment.type === 'construction') {
          const constructionAtExit = (exitMonth / totalMonths) * 100;
          if (constructionAtExit >= payment.triggerValue) {
            additionalTotal += basePrice * (payment.paymentPercent / 100);
          }
        }
      }
      
      const plannedEquity = downpayment + additionalTotal;
      const minimumEquity = basePrice * (minimumExitThreshold / 100);
      return Math.max(plannedEquity, minimumEquity);
    };

    // Calculate exit price at month
    const calculateExitPrice = (month: number): number => {
      const years = month / 12;
      return basePrice * Math.pow(1 + appreciationRate / 100, years);
    };

    // Generate exit scenarios data
    const exitScenariosData = (exitScenarios || [18, 24, 30]).map((month: number) => {
      const equity = calculateEquityAtExit(month);
      const exitPrice = calculateExitPrice(month);
      const profit = exitPrice - basePrice;
      const totalCapital = equity + totalEntryCosts;
      const trueProfit = profit;
      const trueROE = (trueProfit / totalCapital) * 100;
      const constructionPercent = Math.min(100, (month / totalMonths) * 100);
      
      return {
        month,
        constructionPercent,
        equity,
        exitPrice,
        profit,
        totalCapital,
        trueProfit,
        trueROE,
      };
    });

    // Generate 10-year projections
    const yearlyProjections = calculations?.yearlyProjections || [];

    // Build HTML for PDF
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Helvetica Neue', Arial, sans-serif; 
      background: #0f172a; 
      color: #e2e8f0;
      padding: 40px;
      font-size: 12px;
      line-height: 1.5;
    }
    .header { 
      text-align: center; 
      margin-bottom: 30px;
      border-bottom: 2px solid #CCFF00;
      padding-bottom: 20px;
    }
    .header h1 { 
      font-size: 28px; 
      font-weight: 700;
      color: #CCFF00;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    .header .subtitle { 
      color: #94a3b8; 
      font-size: 14px;
    }
    .section { 
      margin-bottom: 25px;
      background: #1e293b;
      border-radius: 8px;
      padding: 20px;
    }
    .section-title { 
      font-size: 16px; 
      font-weight: 600;
      color: #CCFF00;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .info-grid { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .info-item { }
    .info-label { 
      color: #64748b; 
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value { 
      color: #f1f5f9;
      font-size: 14px;
      font-weight: 500;
    }
    .exit-cards { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .exit-card { 
      background: #0f172a;
      border-radius: 8px;
      padding: 15px;
      border: 1px solid #334155;
    }
    .exit-card-title { 
      font-size: 14px;
      font-weight: 600;
      color: #CCFF00;
      margin-bottom: 10px;
    }
    .exit-metric { margin-bottom: 8px; }
    .exit-metric-label { 
      color: #64748b;
      font-size: 10px;
    }
    .exit-metric-value { 
      color: #f1f5f9;
      font-size: 13px;
      font-weight: 500;
    }
    .roe-value { 
      color: #CCFF00;
      font-size: 18px;
      font-weight: 700;
    }
    table { 
      width: 100%; 
      border-collapse: collapse;
    }
    th { 
      background: #0f172a;
      color: #94a3b8;
      font-size: 10px;
      text-transform: uppercase;
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #334155;
    }
    td { 
      padding: 10px;
      border-bottom: 1px solid #1e293b;
      color: #e2e8f0;
    }
    tr:nth-child(even) { background: #0f172a; }
    .highlight-row { background: rgba(204, 255, 0, 0.1) !important; }
    .footer { 
      margin-top: 30px;
      text-align: center;
      color: #64748b;
      font-size: 10px;
    }
    .payment-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; }
    .payment-label { color: #94a3b8; }
    .payment-value { color: #f1f5f9; font-weight: 500; }
    .payment-total { color: #CCFF00; font-weight: 700; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CASHFLOW STATEMENT</h1>
    <div class="subtitle">
      Prepared by ${advisorName || 'Investment Advisor'} • ${currentDate}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Client & Property Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Developer</div>
        <div class="info-value">${clientInfo?.developer || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Project</div>
        <div class="info-value">${clientInfo?.projectName || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Client</div>
        <div class="info-value">${clientInfo?.clientName || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Unit</div>
        <div class="info-value">${clientInfo?.unit || '-'} ${clientInfo?.unitType ? `(${clientInfo.unitType})` : ''}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Size</div>
        <div class="info-value">${clientInfo?.unitSizeSqf ? `${clientInfo.unitSizeSqf} sqf` : '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Country</div>
        <div class="info-value">${clientInfo?.clientCountry || '-'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Investment Snapshot</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Base Property Price</div>
        <div class="info-value">${formatCurrency(basePrice, currency, rate)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">DLD Fee (${dldFeePercent}%)</div>
        <div class="info-value">${formatCurrency(dldFee, currency, rate)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Oqood Fee</div>
        <div class="info-value">${formatCurrency(oqoodFee, currency, rate)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Total Entry Costs</div>
        <div class="info-value">${formatCurrency(totalEntryCosts, currency, rate)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Appreciation Rate</div>
        <div class="info-value">${appreciationRate}% CAGR</div>
      </div>
      <div class="info-item">
        <div class="info-label">Construction Period</div>
        <div class="info-value">${totalMonths} months</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Payment Breakdown</div>
    <div class="payment-row">
      <span class="payment-label">EOI / Booking Fee</span>
      <span class="payment-value">${formatCurrency(eoiFee, currency, rate)}</span>
    </div>
    <div class="payment-row">
      <span class="payment-label">Downpayment (${downpaymentPercent}%)</span>
      <span class="payment-value">${formatCurrency(basePrice * (downpaymentPercent / 100) - eoiFee, currency, rate)}</span>
    </div>
    <div class="payment-row">
      <span class="payment-label">DLD Fee</span>
      <span class="payment-value">${formatCurrency(dldFee, currency, rate)}</span>
    </div>
    <div class="payment-row">
      <span class="payment-label">Oqood Fee</span>
      <span class="payment-value">${formatCurrency(oqoodFee, currency, rate)}</span>
    </div>
    ${additionalPayments.map((p: any) => `
    <div class="payment-row">
      <span class="payment-label">${p.label || (p.type === 'time' ? `Month ${p.triggerValue}` : `At ${p.triggerValue}% construction`)}</span>
      <span class="payment-value">${formatCurrency(basePrice * (p.paymentPercent / 100), currency, rate)}</span>
    </div>
    `).join('')}
    <div class="payment-row" style="border-top: 2px solid #CCFF00; margin-top: 10px; padding-top: 15px;">
      <span class="payment-label">At Handover (remaining)</span>
      <span class="payment-value">${formatCurrency(basePrice * ((100 - downpaymentPercent - additionalPayments.reduce((sum: number, p: any) => sum + p.paymentPercent, 0)) / 100), currency, rate)}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Exit Scenarios</div>
    <div class="exit-cards">
      ${exitScenariosData.map((scenario: any, i: number) => `
      <div class="exit-card">
        <div class="exit-card-title">Exit ${i + 1} — Month ${scenario.month}</div>
        <div class="exit-metric">
          <div class="exit-metric-label">Construction</div>
          <div class="exit-metric-value">${formatPercent(scenario.constructionPercent)}</div>
        </div>
        <div class="exit-metric">
          <div class="exit-metric-label">Capital Deployed</div>
          <div class="exit-metric-value">${formatCurrency(scenario.totalCapital, currency, rate)}</div>
        </div>
        <div class="exit-metric">
          <div class="exit-metric-label">Exit Price</div>
          <div class="exit-metric-value">${formatCurrency(scenario.exitPrice, currency, rate)}</div>
        </div>
        <div class="exit-metric">
          <div class="exit-metric-label">Profit</div>
          <div class="exit-metric-value">${formatCurrency(scenario.profit, currency, rate)}</div>
        </div>
        <div class="exit-metric">
          <div class="exit-metric-label">True ROE</div>
          <div class="roe-value">${formatPercent(scenario.trueROE)}</div>
        </div>
      </div>
      `).join('')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">10-Year Projection</div>
    <table>
      <thead>
        <tr>
          <th>Year</th>
          <th>Property Value</th>
          <th>Annual Rent</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${yearlyProjections.slice(0, 10).map((proj: any) => `
        <tr class="${proj.isHandover ? 'highlight-row' : ''}">
          <td>${proj.year}</td>
          <td>${formatCurrency(proj.propertyValue, currency, rate)}</td>
          <td>${proj.annualRent ? formatCurrency(proj.annualRent, currency, rate) : '—'}</td>
          <td>${proj.isConstruction ? '🏗️ Construction' : proj.isHandover ? '🏠 Handover' : '✅ Operational'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    This document is for informational purposes only and does not constitute financial advice.<br>
    Generated on ${currentDate}
  </div>
</body>
</html>
`;

    // Return HTML with content-disposition to trigger download
    // The frontend will convert this to PDF using browser print or handle it
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error: unknown) {
    console.error('Error generating PDF:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
