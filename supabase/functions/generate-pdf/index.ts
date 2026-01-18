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

// Dual currency format - AED primary with reference currency below
const formatDualCurrency = (value: number, currency: string, rate: number): string => {
  const aedFormatted = formatCurrency(value, 'AED', 1);
  if (currency === 'AED') return aedFormatted;
  const refFormatted = formatCurrency(value, currency, rate);
  return `${aedFormatted}<br><span style="font-size:10px;color:#94a3b8">${refFormatted}</span>`;
};

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

// S-curve segments for Dubai construction progress
// Converts timeline percentage to construction completion percentage
const timelineToConstruction = (timelinePercent: number): number => {
  const segments: [number, number][] = [
    [0, 0],
    [25, 18],
    [42, 35],
    [50, 40],
    [58, 50],
    [67, 65],
    [75, 75],
    [89, 90],
    [100, 100],
  ];
  
  // Clamp input
  const clamped = Math.max(0, Math.min(100, timelinePercent));
  
  // Find the segment we're in
  for (let i = 0; i < segments.length - 1; i++) {
    const [t1, c1] = segments[i];
    const [t2, c2] = segments[i + 1];
    if (clamped >= t1 && clamped <= t2) {
      // Linear interpolation within segment
      const progress = (clamped - t1) / (t2 - t1);
      return c1 + progress * (c2 - c1);
    }
  }
  return 100;
};

// Phase-based exit price calculation (Construction → Growth → Mature)
const calculateExitPrice = (
  months: number,
  basePrice: number,
  totalMonths: number,
  constructionAppreciation: number,
  growthAppreciation: number,
  matureAppreciation: number,
  growthPeriodYears: number
): number => {
  let currentValue = basePrice;
  
  // Phase 1: Construction period
  const constructionMonths = Math.min(months, totalMonths);
  if (constructionMonths > 0) {
    const monthlyRate = Math.pow(1 + constructionAppreciation / 100, 1/12) - 1;
    currentValue *= Math.pow(1 + monthlyRate, constructionMonths);
  }
  
  if (months <= totalMonths) return currentValue;
  
  // Phase 2: Growth period (first X years after handover)
  const postHandoverMonths = months - totalMonths;
  const growthMonthsMax = growthPeriodYears * 12;
  const growthMonths = Math.min(postHandoverMonths, growthMonthsMax);
  if (growthMonths > 0) {
    const monthlyRate = Math.pow(1 + growthAppreciation / 100, 1/12) - 1;
    currentValue *= Math.pow(1 + monthlyRate, growthMonths);
  }
  
  // Phase 3: Mature period (after growth period)
  const matureMonths = Math.max(0, postHandoverMonths - growthMonthsMax);
  if (matureMonths > 0) {
    const monthlyRate = Math.pow(1 + matureAppreciation / 100, 1/12) - 1;
    currentValue *= Math.pow(1 + monthlyRate, matureMonths);
  }
  
  return currentValue;
};

interface Visibility {
  investmentSnapshot: boolean;
  rentSnapshot: boolean;
  paymentBreakdown: boolean;
  exitStrategy: boolean;
  longTermHold: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inputs, clientInfo, calculations, exitScenarios, advisorName, currency, rate, visibility } = await req.json();
    
    // Default visibility - show all
    const vis: Visibility = visibility || {
      investmentSnapshot: true,
      rentSnapshot: true,
      paymentBreakdown: true,
      exitStrategy: true,
      longTermHold: true,
    };
    
    console.log('Generating PDF for:', clientInfo?.projectName || 'Unknown Project', 'Visibility:', vis);

    const totalMonths = calculations?.totalMonths || 36;
    const basePrice = inputs?.basePrice || 0;
    
    // Phase-based appreciation rates
    const constructionAppreciation = inputs?.constructionAppreciation || 12;
    const growthAppreciation = inputs?.growthAppreciation || 8;
    const matureAppreciation = inputs?.matureAppreciation || 4;
    const growthPeriodYears = inputs?.growthPeriodYears || 5;
    
    const dldFeePercent = 4;
    const oqoodFee = inputs?.oqoodFee || 5000;
    const downpaymentPercent = inputs?.downpaymentPercent || 20;
    const eoiFee = inputs?.eoiFee || 50000;
    const preHandoverPercent = inputs?.preHandoverPercent || 20;
    const additionalPayments = inputs?.additionalPayments || [];
    const rentalYieldPercent = inputs?.rentalYieldPercent || 8.5;
    const serviceChargePerSqft = inputs?.serviceChargePerSqft || 18;
    const unitSizeSqf = inputs?.unitSizeSqf || clientInfo?.unitSizeSqf || 0;
    
    // Exit costs
    const exitAgentCommissionEnabled = inputs?.exitAgentCommissionEnabled ?? true;
    const exitAgentCommissionPercent = inputs?.exitAgentCommissionPercent || 2;
    const exitNocFee = inputs?.exitNocFee || 5000;
    
    // Minimum exit threshold
    const minimumExitThreshold = inputs?.minimumExitThreshold || 30;

    const dldFee = basePrice * (dldFeePercent / 100);
    const totalEntryCosts = dldFee + oqoodFee;
    const handoverPercent = 100 - preHandoverPercent;

    // Rent calculations
    const estimatedAnnualRent = basePrice * (rentalYieldPercent / 100);
    const annualServiceCharges = unitSizeSqf * serviceChargePerSqft;
    const netAnnualRent = estimatedAnnualRent - annualServiceCharges;
    const yearsToPayOff = netAnnualRent > 0 ? basePrice / netAnnualRent : 999;

    // Exit scenario calculations with S-curve and threshold logic
    const calculateEquityAtExit = (exitMonth: number): { equity: number; advancedPayments: number } => {
      const exitTimelinePercent = (exitMonth / totalMonths) * 100;
      const exitConstructionPercent = timelineToConstruction(exitTimelinePercent);
      
      // Start with downpayment
      let planEquity = basePrice * (downpaymentPercent / 100);
      
      // Add additional payments based on their triggers
      for (const payment of additionalPayments) {
        let triggered = false;
        if (payment.type === 'time') {
          triggered = exitMonth >= payment.triggerValue;
        } else if (payment.type === 'construction') {
          triggered = exitConstructionPercent >= payment.triggerValue;
        }
        if (triggered) {
          planEquity += basePrice * (payment.paymentPercent / 100);
        }
      }
      
      // Handover payment (only if past handover)
      if (exitMonth >= totalMonths) {
        planEquity += basePrice * (handoverPercent / 100);
      }
      
      // Apply minimum threshold
      const thresholdEquity = basePrice * (minimumExitThreshold / 100);
      const advancedPayments = Math.max(0, thresholdEquity - planEquity);
      const finalEquity = Math.max(planEquity, thresholdEquity);
      
      return { equity: finalEquity, advancedPayments };
    };

    const exitScenariosData = (exitScenarios || [18, 24, 30]).map((month: number) => {
      const { equity, advancedPayments } = calculateEquityAtExit(month);
      const exitPrice = calculateExitPrice(
        month,
        basePrice,
        totalMonths,
        constructionAppreciation,
        growthAppreciation,
        matureAppreciation,
        growthPeriodYears
      );
      
      // Calculate construction progress using S-curve
      const timelinePercent = (month / totalMonths) * 100;
      const constructionPercent = Math.min(100, timelineToConstruction(timelinePercent));
      
      // Calculate exit costs
      const agentCommission = exitAgentCommissionEnabled ? exitPrice * (exitAgentCommissionPercent / 100) : 0;
      const exitCosts = agentCommission + exitNocFee;
      
      // Profit calculations
      const grossProfit = exitPrice - basePrice;
      const netProfit = grossProfit - totalEntryCosts - exitCosts;
      const totalCapital = equity + totalEntryCosts;
      
      // True ROE and Annualized ROE
      const trueROE = totalCapital > 0 ? (netProfit / totalCapital) * 100 : 0;
      const annualizedROE = month > 0 ? (trueROE / (month / 12)) : 0;
      
      return { 
        month, 
        constructionPercent, 
        equity, 
        advancedPayments,
        exitPrice, 
        grossProfit,
        exitCosts,
        netProfit,
        totalCapital, 
        trueROE,
        annualizedROE
      };
    });

    const yearlyProjections = calculations?.yearlyProjections || [];
    const lastProjection = yearlyProjections[yearlyProjections.length - 1] || {};
    
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const clientName = clientInfo?.clients?.[0]?.name || clientInfo?.clientName || '-';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a !important; color: #e2e8f0; padding: 40px; font-size: 12px; line-height: 1.5; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #CCFF00; padding-bottom: 20px; background-color: #0f172a !important; }
    .header h1 { font-size: 28px; font-weight: 700; color: #CCFF00 !important; letter-spacing: 2px; margin-bottom: 8px; }
    .header .subtitle { color: #94a3b8 !important; font-size: 14px; }
    .section { margin-bottom: 25px; background-color: #1e293b !important; border-radius: 8px; padding: 20px; page-break-inside: avoid; }
    .section-title { font-size: 16px; font-weight: 600; color: #CCFF00 !important; margin-bottom: 15px; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
    .info-label { color: #64748b !important; font-size: 10px; letter-spacing: 0.5px; }
    .info-value { color: #f1f5f9 !important; font-size: 14px; font-weight: 500; }
    .exit-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
    .exit-card { background-color: #0f172a !important; border-radius: 8px; padding: 15px; border: 1px solid #334155; }
    .exit-card-title { font-size: 14px; font-weight: 600; color: #CCFF00 !important; margin-bottom: 10px; }
    .exit-metric { margin-bottom: 8px; }
    .exit-metric-label { color: #64748b !important; font-size: 10px; }
    .exit-metric-value { color: #f1f5f9 !important; font-size: 13px; font-weight: 500; }
    .roe-value { color: #CCFF00 !important; font-size: 18px; font-weight: 700; }
    .roe-label { color: #64748b !important; font-size: 10px; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    th { background-color: #0f172a !important; color: #94a3b8 !important; font-size: 10px; padding: 10px; text-align: left; border-bottom: 1px solid #334155; }
    td { padding: 10px; border-bottom: 1px solid #1e293b; color: #e2e8f0 !important; background-color: #1e293b !important; }
    tr:nth-child(even) td { background-color: #0f172a !important; }
    .highlight-row td { background-color: rgba(204, 255, 0, 0.15) !important; }
    .footer { margin-top: 30px; text-align: center; color: #64748b !important; font-size: 10px; background-color: #0f172a !important; }
    .payment-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; }
    .payment-label { color: #94a3b8 !important; }
    .payment-value { color: #f1f5f9 !important; font-weight: 500; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .rent-item { display: flex; justify-content: space-between; padding: 6px 0; }
    .rent-label { color: #94a3b8 !important; font-size: 11px; }
    .rent-value { color: #f1f5f9 !important; font-weight: 500; }
    .rent-highlight { color: #22d3ee !important; }
    .payoff-bar { height: 6px; background-color: #334155 !important; border-radius: 3px; margin: 5px 0; }
    .payoff-fill { height: 100%; border-radius: 3px; background-color: #22c55e !important; }
    .wealth-card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important; border: 1px solid #CCFF00; border-radius: 8px; padding: 20px; margin-top: 20px; }
    .wealth-title { color: #CCFF00 !important; font-size: 14px; font-weight: 600; margin-bottom: 15px; }
    .wealth-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; }
    .wealth-total { font-size: 18px; color: #22d3ee !important; font-weight: 700; }
    .appreciation-rates { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #334155; }
    .appreciation-item { text-align: center; }
    .appreciation-label { color: #64748b !important; font-size: 9px; }
    .appreciation-value { color: #CCFF00 !important; font-size: 12px; font-weight: 600; }
    .dual-currency { line-height: 1.3; }
    .exit-costs-note { color: #94a3b8 !important; font-size: 9px; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #334155; }
    @media print { 
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      html, body { background-color: #0f172a !important; }
      body { padding: 20px; } 
      .section { page-break-inside: avoid; } 
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Cashflow Generator</h1>
    <div class="subtitle">Prepared by ${advisorName || 'Investment Advisor'} • ${currentDate}</div>
  </div>

  <div class="section">
    <div class="section-title">Client & Property Information</div>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Developer</div><div class="info-value">${clientInfo?.developer || '-'}</div></div>
      <div class="info-item"><div class="info-label">Project</div><div class="info-value">${clientInfo?.projectName || '-'}</div></div>
      <div class="info-item"><div class="info-label">Client</div><div class="info-value">${clientName}</div></div>
      <div class="info-item"><div class="info-label">Unit</div><div class="info-value">${clientInfo?.unit || '-'} ${clientInfo?.unitType ? `(${clientInfo.unitType})` : ''}</div></div>
      <div class="info-item"><div class="info-label">Size</div><div class="info-value">${clientInfo?.unitSizeSqf ? `${clientInfo.unitSizeSqf} sqf` : '-'}</div></div>
      <div class="info-item"><div class="info-label">Price</div><div class="info-value dual-currency">${formatDualCurrency(basePrice, currency, rate)}</div></div>
    </div>
  </div>

  ${vis.investmentSnapshot || vis.rentSnapshot ? `
  <div class="two-col">
    ${vis.investmentSnapshot ? `
    <div class="section">
      <div class="section-title">Investment Snapshot</div>
      <div class="rent-item"><span class="rent-label">Base Price</span><span class="rent-value dual-currency">${formatDualCurrency(basePrice, currency, rate)}</span></div>
      <div class="rent-item"><span class="rent-label">Payment Plan</span><span class="rent-value" style="color:#CCFF00">${preHandoverPercent}/${handoverPercent}</span></div>
      <div class="rent-item"><span class="rent-label">Construction</span><span class="rent-value">${totalMonths} months</span></div>
      <div class="rent-item"><span class="rent-label">At Booking (SPA)</span><span class="rent-value dual-currency">${formatDualCurrency(basePrice * downpaymentPercent / 100 + dldFee + oqoodFee, currency, rate)}</span></div>
      <div class="rent-item"><span class="rent-label">At Handover</span><span class="rent-value dual-currency" style="color:#22d3ee">${formatDualCurrency(basePrice * handoverPercent / 100, currency, rate)}</span></div>
      <div class="rent-item"><span class="rent-label">Entry Costs</span><span class="rent-value" style="color:#f87171">-${formatCurrency(totalEntryCosts, 'AED', 1)}</span></div>
      
      <div class="appreciation-rates">
        <div class="appreciation-item">
          <div class="appreciation-label">Construction</div>
          <div class="appreciation-value">${constructionAppreciation}%/y</div>
        </div>
        <div class="appreciation-item">
          <div class="appreciation-label">Growth (${growthPeriodYears}y)</div>
          <div class="appreciation-value">${growthAppreciation}%/y</div>
        </div>
        <div class="appreciation-item">
          <div class="appreciation-label">Mature</div>
          <div class="appreciation-value">${matureAppreciation}%/y</div>
        </div>
      </div>
    </div>
    ` : ''}
    ${vis.rentSnapshot ? `
    <div class="section">
      <div class="section-title">Rent Snapshot</div>
      <div class="rent-item"><span class="rent-label">Rental Yield</span><span class="rent-value" style="color:#CCFF00">${rentalYieldPercent}%</span></div>
      <div class="rent-item"><span class="rent-label">Est. Annual Rent</span><span class="rent-value dual-currency">${formatDualCurrency(estimatedAnnualRent, currency, rate)}</span></div>
      <div class="rent-item"><span class="rent-label">Service Charges</span><span class="rent-value" style="color:#f87171">-${formatCurrency(annualServiceCharges, 'AED', 1)}</span></div>
      <div class="rent-item"><span class="rent-label">Net Annual Rent</span><span class="rent-value dual-currency rent-highlight">${formatDualCurrency(netAnnualRent, currency, rate)}</span></div>
      <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #334155;">
        <div class="rent-item"><span class="rent-label">Years to Pay Off</span><span class="rent-value" style="color:#22c55e">${yearsToPayOff < 999 ? yearsToPayOff.toFixed(1) + 'y' : '-'}</span></div>
        <div class="payoff-bar"><div class="payoff-fill" style="width: ${Math.min(100, (15 / yearsToPayOff) * 100)}%"></div></div>
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${vis.paymentBreakdown ? `
  <div class="section">
    <div class="section-title">Payment Breakdown</div>
    <div class="payment-row"><span class="payment-label">EOI / Booking Fee</span><span class="payment-value dual-currency">${formatDualCurrency(eoiFee, currency, rate)}</span></div>
    <div class="payment-row"><span class="payment-label">Downpayment (${downpaymentPercent}%)</span><span class="payment-value dual-currency">${formatDualCurrency(basePrice * (downpaymentPercent / 100) - eoiFee, currency, rate)}</span></div>
    <div class="payment-row"><span class="payment-label">DLD Fee (4%)</span><span class="payment-value">${formatCurrency(dldFee, 'AED', 1)}</span></div>
    <div class="payment-row"><span class="payment-label">Oqood Fee</span><span class="payment-value">${formatCurrency(oqoodFee, 'AED', 1)}</span></div>
    ${additionalPayments.map((p: any) => `<div class="payment-row"><span class="payment-label">${p.label || (p.type === 'time' ? `Month ${p.triggerValue}` : `At ${p.triggerValue}% construction`)}</span><span class="payment-value dual-currency">${formatDualCurrency(basePrice * (p.paymentPercent / 100), currency, rate)}</span></div>`).join('')}
    <div class="payment-row" style="border-top: 2px solid #CCFF00; margin-top: 10px; padding-top: 15px;">
      <span class="payment-label">At Handover (${handoverPercent}%)</span><span class="payment-value dual-currency" style="color:#22d3ee">${formatDualCurrency(basePrice * handoverPercent / 100, currency, rate)}</span>
    </div>
  </div>
  ` : ''}

  ${vis.exitStrategy ? `
  <div class="section">
    <div class="section-title">Exit Strategy Analysis</div>
    <div class="exit-cards">
      ${exitScenariosData.map((scenario: any, i: number) => `
      <div class="exit-card">
        <div class="exit-card-title">Exit ${i + 1} — Month ${scenario.month}</div>
        <div class="exit-metric"><div class="exit-metric-label">Construction</div><div class="exit-metric-value">${formatPercent(scenario.constructionPercent)}</div></div>
        <div class="exit-metric"><div class="exit-metric-label">Capital Deployed</div><div class="exit-metric-value dual-currency">${formatDualCurrency(scenario.totalCapital, currency, rate)}</div></div>
        <div class="exit-metric"><div class="exit-metric-label">Exit Price</div><div class="exit-metric-value dual-currency">${formatDualCurrency(scenario.exitPrice, currency, rate)}</div></div>
        <div class="exit-metric"><div class="exit-metric-label">Net Profit</div><div class="exit-metric-value" style="color:#22c55e">${formatCurrency(scenario.netProfit, 'AED', 1)}</div></div>
        <div class="exit-metric" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #334155;">
          <div class="exit-metric-label">ROE / Year</div>
          <div class="roe-value">${formatPercent(scenario.annualizedROE)}</div>
        </div>
        ${scenario.advancedPayments > 0 ? `<div style="color:#fbbf24;font-size:9px;margin-top:5px;">⚠️ Advance: ${formatCurrency(scenario.advancedPayments, 'AED', 1)}</div>` : ''}
      </div>
      `).join('')}
    </div>
    <div class="exit-costs-note">
      Exit costs: ${exitAgentCommissionEnabled ? `Agent ${exitAgentCommissionPercent}%` : 'No agent'} + NOC ${formatCurrency(exitNocFee, 'AED', 1)} | Min. exit threshold: ${minimumExitThreshold}%
    </div>
  </div>
  ` : ''}

  ${vis.longTermHold ? `
  <div class="section">
    <div class="section-title">Long-Term Hold Analysis</div>
    
    <!-- Disclaimer -->
    <div style="padding: 12px; background-color: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px; margin-bottom: 15px;">
      <div style="display: flex; align-items: flex-start; gap: 10px;">
        <span style="color: #fbbf24; font-size: 16px;">⚠️</span>
        <div>
          <p style="color: #fcd34d; font-size: 11px; font-weight: 500; margin-bottom: 4px;">Hypothetical Projection</p>
          <p style="color: rgba(253, 230, 138, 0.7); font-size: 10px; line-height: 1.4;">
            These projections use phase-based appreciation: ${constructionAppreciation}% during construction, ${growthAppreciation}% for ${growthPeriodYears} years post-handover, then ${matureAppreciation}% in mature phase. Actual results may differ.
          </p>
        </div>
      </div>
    </div>
    
    <table>
      <thead><tr><th>Year</th><th>Property Value</th><th>Annual Rent</th><th>Cumulative Income</th><th>Status</th></tr></thead>
      <tbody>
        ${yearlyProjections.slice(0, 7).map((proj: any) => `
        <tr class="${proj.isHandover ? 'highlight-row' : ''}">
          <td>${proj.year}</td>
          <td class="dual-currency">${formatDualCurrency(proj.propertyValue, currency, rate)}</td>
          <td>${proj.annualRent ? formatCurrency(proj.annualRent, 'AED', 1) : '—'}</td>
          <td>${proj.cumulativeNetIncome ? formatCurrency(proj.cumulativeNetIncome, 'AED', 1) : '—'}</td>
          <td>${proj.isConstruction ? '🏗️ Construction' : proj.isHandover ? '🏠 Handover' : '✅ Operational'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="wealth-card">
      <div class="wealth-title">💎 Wealth Created (7 Years)</div>
      <div class="wealth-row"><span class="rent-label">Property Value (Y7)</span><span class="rent-value dual-currency">${formatDualCurrency(yearlyProjections[6]?.propertyValue || lastProjection.propertyValue || 0, currency, rate)}</span></div>
      <div class="wealth-row"><span class="rent-label">Cumulative Rent Income</span><span class="rent-value" style="color:#22d3ee">+${formatCurrency(yearlyProjections[6]?.cumulativeNetIncome || lastProjection.cumulativeNetIncome || 0, 'AED', 1)}</span></div>
      <div class="wealth-row"><span class="rent-label">Initial Investment</span><span class="rent-value" style="color:#f87171">-${formatCurrency(basePrice + totalEntryCosts, 'AED', 1)}</span></div>
      <div class="wealth-row" style="border-top: 2px solid #CCFF00; margin-top: 10px; padding-top: 10px;">
        <span class="rent-label">Net Wealth Created</span>
        <span class="wealth-total">${formatCurrency((yearlyProjections[6]?.propertyValue || lastProjection.propertyValue || 0) + (yearlyProjections[6]?.cumulativeNetIncome || lastProjection.cumulativeNetIncome || 0) - basePrice - totalEntryCosts, 'AED', 1)}</span>
      </div>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    This document is for informational purposes only and does not constitute financial advice.<br>
    Generated on ${currentDate}
  </div>
</body>
</html>
`;

    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error: unknown) {
    console.error('PDF generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
