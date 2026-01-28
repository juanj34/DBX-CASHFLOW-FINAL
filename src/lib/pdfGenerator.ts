/**
 * PDF Generator - Creates professional investment snapshots using jsPDF
 * 
 * This module generates clean, styled PDF documents entirely client-side
 * using jsPDF's built-in methods for precise control over layout and styling.
 */

import { jsPDF } from 'jspdf';
import { OIInputs, OICalculations } from '@/components/roi/useOICalculations';
import { MortgageInputs, MortgageAnalysis } from '@/components/roi/useMortgageCalculations';
import { Currency, formatCurrency, formatDualCurrency } from '@/components/roi/currencyUtils';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';
import { monthToConstruction, calculateExitScenario } from '@/components/roi/constructionProgress';

export interface PDFExportData {
  inputs: OIInputs;
  calculations: OICalculations;
  clientInfo: ClientUnitData;
  mortgageInputs: MortgageInputs;
  mortgageAnalysis: MortgageAnalysis;
  exitScenarios: number[];
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
  projectName?: string;
}

// Colors (matching theme)
const COLORS = {
  primary: '#D4AF37', // Gold accent
  background: '#0a0a0a',
  card: '#141414',
  border: '#262626',
  text: '#ffffff',
  textMuted: '#a1a1aa',
  green: '#4ade80',
  cyan: '#22d3ee',
  purple: '#a855f7',
  orange: '#fb923c',
  red: '#f87171',
};

// Translations
const TRANSLATIONS = {
  en: {
    investmentSnapshot: 'Investment Snapshot',
    propertyPrice: 'Property Price',
    pricePerSqft: 'Price/sqft',
    client: 'Client',
    paymentBreakdown: 'Payment Breakdown',
    theEntry: 'The Entry',
    theJourney: 'The Journey',
    handover: 'Handover',
    postHandover: 'Post-Handover',
    totalEntry: 'Total Entry',
    downpayment: 'Downpayment',
    dldFee: 'DLD Fee (4%)',
    oqoodAdmin: 'Oqood/Admin',
    exitScenarios: 'Exit Scenarios',
    months: 'months',
    built: 'Built',
    profit: 'Profit',
    capitalInvested: 'Capital Invested',
    totalROE: 'Total ROE',
    rentalIncome: 'Rental Income',
    grossYield: 'Gross Yield',
    netAnnualRent: 'Net Annual Rent',
    monthlyRent: 'Monthly Rent',
    serviceCharges: 'Service Charges',
    mortgageAnalysis: 'Mortgage Analysis',
    loanAmount: 'Loan Amount',
    monthlyPayment: 'Monthly Payment',
    interestRate: 'Interest Rate',
    loanTerm: 'Loan Term',
    years: 'years',
    postHandoverCoverage: 'Post-Handover Coverage',
    tenantCovers: 'Tenant Covers',
    youPay: 'You Pay',
    totalInvestment: 'Total Investment',
    wealthProjection: 'Wealth Projection',
    year: 'Year',
    propertyValue: 'Property Value',
    appreciation: 'Appreciation',
    generatedOn: 'Generated on',
    page: 'Page',
    constructionPhase: 'Construction Phase',
    growthPhase: 'Growth Phase',
    maturePhase: 'Mature Phase',
  },
  es: {
    investmentSnapshot: 'Resumen de Inversión',
    propertyPrice: 'Precio de Propiedad',
    pricePerSqft: 'Precio/sqft',
    client: 'Cliente',
    paymentBreakdown: 'Desglose de Pagos',
    theEntry: 'La Entrada',
    theJourney: 'El Camino',
    handover: 'Entrega',
    postHandover: 'Post-Entrega',
    totalEntry: 'Total Entrada',
    downpayment: 'Enganche',
    dldFee: 'DLD (4%)',
    oqoodAdmin: 'Oqood/Admin',
    exitScenarios: 'Escenarios de Salida',
    months: 'meses',
    built: 'Construido',
    profit: 'Ganancia',
    capitalInvested: 'Capital Invertido',
    totalROE: 'ROE Total',
    rentalIncome: 'Ingresos por Renta',
    grossYield: 'Rendimiento Bruto',
    netAnnualRent: 'Renta Anual Neta',
    monthlyRent: 'Renta Mensual',
    serviceCharges: 'Cargos de Servicio',
    mortgageAnalysis: 'Análisis de Hipoteca',
    loanAmount: 'Monto del Préstamo',
    monthlyPayment: 'Pago Mensual',
    interestRate: 'Tasa de Interés',
    loanTerm: 'Plazo del Préstamo',
    years: 'años',
    postHandoverCoverage: 'Cobertura Post-Entrega',
    tenantCovers: 'El Inquilino Cubre',
    youPay: 'Tú Pagas',
    totalInvestment: 'Inversión Total',
    wealthProjection: 'Proyección de Patrimonio',
    year: 'Año',
    propertyValue: 'Valor de Propiedad',
    appreciation: 'Apreciación',
    generatedOn: 'Generado el',
    page: 'Página',
    constructionPhase: 'Fase de Construcción',
    growthPhase: 'Fase de Crecimiento',
    maturePhase: 'Fase Madura',
  },
};

type TranslationKey = keyof typeof TRANSLATIONS.en;

// Helper to format currency for PDF
const fmt = (value: number, currency: Currency, rate: number): string => {
  const aed = formatCurrency(value, 'AED', 1);
  if (currency === 'AED') return aed;
  const converted = formatCurrency(value, currency, rate);
  return `${aed} (${converted})`;
};

// Helper to format short currency
const fmtShort = (value: number): string => {
  if (value >= 1000000) return `AED ${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `AED ${(value / 1000).toFixed(0)}K`;
  return `AED ${value.toFixed(0)}`;
};

// Month to date string
const monthToDateStr = (months: number, bookingMonth: number, bookingYear: number): string => {
  const totalMonthsFromJan = bookingMonth + months;
  const yearOffset = Math.floor((totalMonthsFromJan - 1) / 12);
  const month = ((totalMonthsFromJan - 1) % 12) + 1;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1]} ${bookingYear + yearOffset}`;
};

export const generateSnapshotPDF = async (data: PDFExportData): Promise<Blob> => {
  const { inputs, calculations, clientInfo, mortgageInputs, mortgageAnalysis, exitScenarios, currency, rate, language } = data;
  const t = (key: TranslationKey) => TRANSLATIONS[language][key];

  // Create A4 landscape PDF
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  
  // Base calculations
  const basePrice = inputs.basePrice || calculations.basePrice;
  const pricePerSqft = clientInfo.unitSizeSqf > 0 ? basePrice / clientInfo.unitSizeSqf : 0;
  const downpaymentAmount = basePrice * (inputs.downpaymentPercent / 100);
  const dldFee = basePrice * 0.04;
  const entryTotal = downpaymentAmount + dldFee + inputs.oqoodFee;
  
  // Rental calculations
  const grossAnnualRent = basePrice * (inputs.rentalYieldPercent / 100);
  const annualServiceCharges = (clientInfo.unitSizeSqf || 0) * (inputs.serviceChargePerSqft || 18);
  const netAnnualRent = grossAnnualRent - annualServiceCharges;
  const monthlyRent = netAnnualRent / 12;

  // Helper functions for drawing
  let currentY = margin;

  const setFont = (style: 'normal' | 'bold', size: number) => {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', style);
  };

  const drawText = (text: string, x: number, y: number, options?: { align?: 'left' | 'center' | 'right'; color?: string; maxWidth?: number }) => {
    pdf.setTextColor(options?.color || COLORS.text);
    pdf.text(text, x, y, { align: options?.align || 'left', maxWidth: options?.maxWidth });
  };

  const drawRect = (x: number, y: number, w: number, h: number, options?: { fill?: string; stroke?: string; radius?: number }) => {
    if (options?.fill) {
      pdf.setFillColor(options.fill);
      if (options?.radius) {
        pdf.roundedRect(x, y, w, h, options.radius, options.radius, 'F');
      } else {
        pdf.rect(x, y, w, h, 'F');
      }
    }
    if (options?.stroke) {
      pdf.setDrawColor(options.stroke);
      pdf.setLineWidth(0.2);
      if (options?.radius) {
        pdf.roundedRect(x, y, w, h, options.radius, options.radius, 'S');
      } else {
        pdf.rect(x, y, w, h, 'S');
      }
    }
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, color?: string) => {
    pdf.setDrawColor(color || COLORS.border);
    pdf.setLineWidth(0.2);
    pdf.line(x1, y1, x2, y2);
  };

  // ===== PAGE 1: HEADER & OVERVIEW =====
  
  // Background
  drawRect(0, 0, pageWidth, pageHeight, { fill: COLORS.background });

  // Header Bar
  drawRect(margin, margin, contentWidth, 18, { fill: COLORS.card, radius: 3 });
  drawLine(margin, margin + 18, margin + contentWidth, margin + 18, COLORS.border);

  // Title and Project Name
  setFont('bold', 14);
  drawText(clientInfo.projectName || t('investmentSnapshot'), margin + 5, margin + 7, { color: COLORS.text });
  
  if (clientInfo.developer) {
    setFont('normal', 9);
    drawText(`by ${clientInfo.developer}`, margin + 5, margin + 13, { color: COLORS.textMuted });
  }

  // Price in header
  setFont('bold', 14);
  const priceText = fmt(basePrice, currency, rate);
  drawText(priceText, pageWidth - margin - 5, margin + 7, { align: 'right', color: COLORS.primary });
  
  setFont('normal', 8);
  drawText(`${fmtShort(pricePerSqft)}/sqft • ${clientInfo.unitSizeSqf?.toLocaleString() || 0} sqft`, pageWidth - margin - 5, margin + 13, { align: 'right', color: COLORS.textMuted });

  // Client and date on right side of header
  if (clientInfo.clientName) {
    setFont('normal', 8);
    const dateStr = new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    drawText(`${t('client')}: ${clientInfo.clientName} • ${dateStr}`, pageWidth / 2, margin + 10, { align: 'center', color: COLORS.textMuted });
  }

  currentY = margin + 25;

  // ===== MAIN CONTENT GRID (3 columns) =====
  const colWidth = (contentWidth - 8) / 3;
  const col1X = margin;
  const col2X = margin + colWidth + 4;
  const col3X = margin + (colWidth + 4) * 2;

  // ===== COLUMN 1: PAYMENT BREAKDOWN =====
  let col1Y = currentY;
  
  // Payment Breakdown Card
  drawRect(col1X, col1Y, colWidth, 85, { fill: COLORS.card, radius: 3 });
  drawLine(col1X, col1Y, col1X + colWidth, col1Y, COLORS.border);
  
  // Card Header
  setFont('bold', 9);
  drawText(t('paymentBreakdown').toUpperCase(), col1X + 4, col1Y + 6, { color: COLORS.text });
  drawLine(col1X, col1Y + 10, col1X + colWidth, col1Y + 10, COLORS.border);
  
  col1Y += 14;
  
  // The Entry section
  setFont('bold', 7);
  drawText(t('theEntry').toUpperCase(), col1X + 4, col1Y, { color: COLORS.primary });
  col1Y += 5;

  // Payment rows helper
  const drawPaymentRow = (label: string, value: number, y: number, options?: { bold?: boolean; color?: string }) => {
    setFont(options?.bold ? 'bold' : 'normal', 7);
    drawText(label, col1X + 4, y, { color: COLORS.textMuted });
    drawText(fmt(value, currency, rate), col1X + colWidth - 4, y, { align: 'right', color: options?.color || COLORS.text });
    return y + 5;
  };

  col1Y = drawPaymentRow(t('downpayment') + ` (${inputs.downpaymentPercent}%)`, downpaymentAmount, col1Y);
  col1Y = drawPaymentRow(t('dldFee'), dldFee, col1Y);
  col1Y = drawPaymentRow(t('oqoodAdmin'), inputs.oqoodFee, col1Y);
  
  drawLine(col1X + 4, col1Y, col1X + colWidth - 4, col1Y, COLORS.border);
  col1Y += 3;
  col1Y = drawPaymentRow(t('totalEntry'), entryTotal, col1Y, { bold: true, color: COLORS.primary });
  
  // Journey section
  col1Y += 3;
  setFont('bold', 7);
  drawText(t('theJourney').toUpperCase() + ` (${calculations.totalMonths}mo)`, col1X + 4, col1Y, { color: COLORS.cyan });
  col1Y += 5;

  // Show first few payments
  const additionalPayments = inputs.additionalPayments || [];
  const displayPayments = additionalPayments.slice(0, 4);
  
  displayPayments.forEach((payment) => {
    const amount = basePrice * (payment.paymentPercent / 100);
    const label = payment.type === 'time' 
      ? `Month ${payment.triggerValue}` 
      : `${payment.triggerValue}% Built`;
    col1Y = drawPaymentRow(label, amount, col1Y);
  });

  if (additionalPayments.length > 4) {
    setFont('normal', 6);
    drawText(`+${additionalPayments.length - 4} more installments...`, col1X + 4, col1Y, { color: COLORS.textMuted });
    col1Y += 5;
  }

  // Handover section
  col1Y += 2;
  const handoverPercent = inputs.hasPostHandoverPlan 
    ? (inputs.onHandoverPercent || 0)
    : (100 - inputs.preHandoverPercent);
  const handoverAmount = basePrice * (handoverPercent / 100);
  
  if (handoverPercent > 0) {
    setFont('bold', 7);
    drawText(`${t('handover').toUpperCase()} (${handoverPercent}%)`, col1X + 4, col1Y, { color: COLORS.green });
    col1Y += 5;
    col1Y = drawPaymentRow('Final Payment', handoverAmount, col1Y, { color: COLORS.green });
  }

  // ===== COLUMN 2: EXIT SCENARIOS =====
  let col2Y = currentY;
  
  if (inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0) {
    drawRect(col2X, col2Y, colWidth, 85, { fill: COLORS.card, radius: 3 });
    
    setFont('bold', 9);
    drawText(t('exitScenarios').toUpperCase(), col2X + 4, col2Y + 6, { color: COLORS.text });
    drawLine(col2X, col2Y + 10, col2X + colWidth, col2Y + 10, COLORS.border);
    
    col2Y += 16;

    exitScenarios.slice(0, 5).forEach((exitMonths, index) => {
      const scenarioResult = calculateExitScenario(
        exitMonths,
        basePrice,
        calculations.totalMonths,
        inputs,
        calculations.totalEntryCosts
      );
      
      const constructionPct = Math.min(100, monthToConstruction(exitMonths, calculations.totalMonths));
      const dateStr = monthToDateStr(exitMonths, inputs.bookingMonth, inputs.bookingYear);
      
      // Scenario row
      drawRect(col2X + 3, col2Y - 3, colWidth - 6, 12, { fill: COLORS.background, radius: 2 });
      
      // Exit number badge
      setFont('bold', 6);
      drawText(`#${index + 1}`, col2X + 5, col2Y + 1, { color: COLORS.primary });
      
      // Months and date
      setFont('normal', 7);
      drawText(`${exitMonths}m (${dateStr})`, col2X + 14, col2Y + 1, { color: COLORS.text });
      
      // Construction %
      drawText(`${constructionPct.toFixed(0)}% ${t('built')}`, col2X + 45, col2Y + 1, { color: COLORS.orange });
      
      // Profit and ROE
      const profitColor = scenarioResult.trueProfit >= 0 ? COLORS.green : COLORS.red;
      setFont('bold', 7);
      drawText(`${scenarioResult.trueProfit >= 0 ? '+' : ''}${fmtShort(scenarioResult.trueProfit)}`, col2X + colWidth - 25, col2Y + 1, { color: profitColor });
      drawText(`${scenarioResult.trueROE?.toFixed(0) || 0}%`, col2X + colWidth - 5, col2Y + 1, { align: 'right', color: profitColor });
      
      col2Y += 14;
    });
  }

  // ===== COLUMN 3: RENTAL + MORTGAGE =====
  let col3Y = currentY;

  // Rental Income Card
  if (inputs.rentalYieldPercent > 0) {
    drawRect(col3X, col3Y, colWidth, 40, { fill: COLORS.card, radius: 3 });
    
    setFont('bold', 9);
    drawText(t('rentalIncome').toUpperCase(), col3X + 4, col3Y + 6, { color: COLORS.text });
    drawLine(col3X, col3Y + 10, col3X + colWidth, col3Y + 10, COLORS.border);
    
    col3Y += 16;
    
    const drawRentRow = (label: string, value: string, y: number, options?: { color?: string }) => {
      setFont('normal', 7);
      drawText(label, col3X + 4, y, { color: COLORS.textMuted });
      drawText(value, col3X + colWidth - 4, y, { align: 'right', color: options?.color || COLORS.text });
      return y + 5;
    };
    
    col3Y = drawRentRow(t('grossYield'), `${inputs.rentalYieldPercent.toFixed(1)}%`, col3Y, { color: COLORS.green });
    col3Y = drawRentRow(t('netAnnualRent'), fmt(netAnnualRent, currency, rate), col3Y);
    col3Y = drawRentRow(t('monthlyRent'), fmt(monthlyRent, currency, rate), col3Y, { color: COLORS.green });
    
    col3Y += 8;
  }

  // Mortgage Analysis Card
  if (mortgageInputs.enabled) {
    drawRect(col3X, col3Y, colWidth, 40, { fill: COLORS.card, radius: 3 });
    
    setFont('bold', 9);
    drawText(t('mortgageAnalysis').toUpperCase(), col3X + 4, col3Y + 6, { color: COLORS.text });
    drawLine(col3X, col3Y + 10, col3X + colWidth, col3Y + 10, COLORS.border);
    
    col3Y += 16;
    
    const drawMortgageRow = (label: string, value: string, y: number, options?: { color?: string }) => {
      setFont('normal', 7);
      drawText(label, col3X + 4, y, { color: COLORS.textMuted });
      drawText(value, col3X + colWidth - 4, y, { align: 'right', color: options?.color || COLORS.text });
      return y + 5;
    };
    
    col3Y = drawMortgageRow(t('loanAmount'), fmt(mortgageAnalysis.loanAmount, currency, rate), col3Y);
    col3Y = drawMortgageRow(t('monthlyPayment'), fmt(mortgageAnalysis.monthlyPayment, currency, rate), col3Y, { color: COLORS.primary });
    col3Y = drawMortgageRow(t('interestRate'), `${mortgageInputs.interestRate}%`, col3Y);
    col3Y = drawMortgageRow(t('loanTerm'), `${mortgageInputs.loanTermYears} ${t('years')}`, col3Y);
  }

  // ===== WEALTH PROJECTION (Bottom Section) =====
  const projectionY = pageHeight - margin - 35;
  
  drawRect(margin, projectionY, contentWidth, 30, { fill: COLORS.card, radius: 3 });
  
  setFont('bold', 9);
  drawText(t('wealthProjection').toUpperCase(), margin + 4, projectionY + 6, { color: COLORS.text });
  drawLine(margin, projectionY + 10, margin + contentWidth, projectionY + 10, COLORS.border);

  // Calculate wealth projection for 7 years
  const projectionStartY = projectionY + 16;
  const yearWidth = contentWidth / 8;
  
  // Headers
  setFont('bold', 6);
  drawText(t('year'), margin + 4, projectionStartY, { color: COLORS.textMuted });
  
  // Calculate values for each year
  for (let year = 1; year <= 7; year++) {
    const x = margin + yearWidth * year;
    
    // Determine phase and appreciation
    const constructionYears = Math.ceil(calculations.totalMonths / 12);
    let cumulativeAppreciation = 0;
    
    for (let y = 1; y <= year; y++) {
      if (y <= constructionYears) {
        cumulativeAppreciation += inputs.constructionAppreciation;
      } else if (y <= constructionYears + inputs.growthPeriodYears) {
        cumulativeAppreciation += inputs.growthAppreciation;
      } else {
        cumulativeAppreciation += inputs.matureAppreciation;
      }
    }
    
    const projectedValue = basePrice * (1 + cumulativeAppreciation / 100);
    
    // Year header
    setFont('bold', 7);
    drawText(`Y${year}`, x + 2, projectionStartY, { color: COLORS.text });
    
    // Value
    setFont('normal', 6);
    drawText(fmtShort(projectedValue), x + 2, projectionStartY + 6, { color: COLORS.green });
    
    // Phase indicator
    let phaseColor = COLORS.orange;
    let phaseLabel = '';
    if (year <= constructionYears) {
      phaseColor = COLORS.orange;
      phaseLabel = '🏗️';
    } else if (year <= constructionYears + inputs.growthPeriodYears) {
      phaseColor = COLORS.green;
      phaseLabel = '📈';
    } else {
      phaseColor = COLORS.cyan;
      phaseLabel = '✨';
    }
    drawText(phaseLabel, x + 2, projectionStartY + 12, { color: phaseColor });
  }

  // Footer
  setFont('normal', 6);
  const footerText = `${t('generatedOn')} ${new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  drawText(footerText, pageWidth / 2, pageHeight - 5, { align: 'center', color: COLORS.textMuted });

  // Return as blob
  return pdf.output('blob');
};

export const downloadSnapshotPDF = async (data: PDFExportData): Promise<{ success: boolean; error?: string }> => {
  try {
    const blob = await generateSnapshotPDF(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.projectName || data.clientInfo.projectName || 'investment'}-snapshot.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
