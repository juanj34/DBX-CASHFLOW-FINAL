import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Local type definitions to avoid circular dependencies
type Currency = 'AED' | 'USD' | 'EUR' | 'GBP' | 'COP';

interface PaymentMilestone {
  id: string;
  type: 'time' | 'construction';
  triggerValue: number;
  paymentPercent: number;
  label?: string;
}

interface OIInputs {
  basePrice: number;
  rentalYieldPercent: number;
  appreciationRate: number;
  bookingMonth: number;
  bookingYear: number;
  handoverQuarter: number;
  handoverYear: number;
  downpaymentPercent: number;
  preHandoverPercent: number;
  additionalPayments: PaymentMilestone[];
  eoiFee: number;
  oqoodFee: number;
  minimumExitThreshold: number;
}

interface Client {
  id: string;
  name: string;
  country: string;
}

interface ClientUnitData {
  developer: string;
  projectName?: string;
  clients: Client[];
  clientName?: string;
  clientCountry?: string;
  brokerName: string;
  unit: string;
  unitSizeSqf: number;
  unitSizeM2: number;
  unitType: string;
}

interface ExitScenario {
  exitMonths: number;
  exitPrice: number;
  amountPaidSoFar: number;
  entryCosts: number;
  totalCapitalDeployed: number;
  trueProfit: number;
  trueROE: number;
}

interface YearlyProjection {
  year: number;
  calendarYear: number;
  propertyValue: number;
  annualRent: number | null;
  isConstruction: boolean;
  isHandover: boolean;
}

export interface PDFExportParams {
  inputs: OIInputs;
  clientInfo: ClientUnitData;
  calculations: {
    totalMonths: number;
    basePrice: number;
    totalEntryCosts: number;
    yearlyProjections: YearlyProjection[];
  };
  exitScenarios: ExitScenario[];
  advisorName?: string;
  currency: Currency;
  rate: number;
  chartElement: HTMLElement | null;
}

const DLD_FEE_PERCENT = 4;

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  AED: 'AED',
  USD: '$',
  EUR: '€',
  GBP: '£',
  COP: 'COP',
};

function formatValue(value: number, currency: Currency, rate: number): string {
  const converted = currency === 'AED' ? value : value * rate;
  const symbol = CURRENCY_SYMBOLS[currency];
  
  if (converted >= 1000000) {
    return `${symbol} ${(converted / 1000000).toFixed(2)}M`;
  }
  if (converted >= 1000) {
    return `${symbol} ${(converted / 1000).toFixed(0)}K`;
  }
  return `${symbol} ${converted.toFixed(0)}`;
}

export async function generateCashflowPDF({
  inputs,
  clientInfo,
  calculations,
  exitScenarios,
  advisorName,
  currency,
  rate,
  chartElement,
}: PDFExportParams): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const fmt = (value: number) => formatValue(value, currency, rate);

  const checkNewPage = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  const clients = clientInfo.clients?.length > 0 
    ? clientInfo.clients 
    : clientInfo.clientName 
      ? [{ id: '1', name: clientInfo.clientName, country: clientInfo.clientCountry || '' }]
      : [];
  const clientNames = clients.map(c => c.name).join(', ') || 'N/A';

  // ========== HEADER ==========
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  pdf.setTextColor(204, 255, 0);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CASHFLOW STATEMENT', margin, 18);
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Advisor: ${advisorName || clientInfo.brokerName || 'N/A'}`, margin, 28);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, 28);
  
  y = 45;

  // ========== CLIENT & PROPERTY INFO ==========
  pdf.setFillColor(26, 31, 46);
  pdf.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
  
  pdf.setTextColor(156, 163, 175);
  pdf.setFontSize(8);
  pdf.text('CLIENT', margin + 5, y + 8);
  pdf.text('PROJECT', margin + 55, y + 8);
  pdf.text('DEVELOPER', margin + 105, y + 8);
  pdf.text('UNIT', margin + 155, y + 8);
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(clientNames, margin + 5, y + 16);
  pdf.text(clientInfo.projectName || 'N/A', margin + 55, y + 16);
  pdf.text(clientInfo.developer || 'N/A', margin + 105, y + 16);
  pdf.text(clientInfo.unit || 'N/A', margin + 155, y + 16);
  
  pdf.setTextColor(156, 163, 175);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  const unitTypeLabel = clientInfo.unitType || 'N/A';
  const sizeText = clientInfo.unitSizeSqf ? `${clientInfo.unitSizeSqf} sqf / ${clientInfo.unitSizeM2} m²` : 'N/A';
  pdf.text(`${unitTypeLabel} • ${sizeText}`, margin + 5, y + 28);
  
  y += 45;

  // ========== INVESTMENT SNAPSHOT ==========
  checkNewPage(50);
  pdf.setTextColor(204, 255, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVESTMENT SNAPSHOT', margin, y);
  y += 8;
  
  pdf.setFillColor(26, 31, 46);
  pdf.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
  
  const dldFee = inputs.basePrice * DLD_FEE_PERCENT / 100;
  const totalEntryCosts = dldFee + inputs.oqoodFee;
  const handoverPercent = 100 - inputs.preHandoverPercent;
  const bookingDateStr = `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][inputs.bookingMonth - 1]} ${inputs.bookingYear}`;
  const handoverDateStr = `Q${inputs.handoverQuarter} ${inputs.handoverYear}`;
  
  const colWidth = contentWidth / 4;
  
  pdf.setTextColor(156, 163, 175);
  pdf.setFontSize(8);
  pdf.text('PROPERTY PRICE', margin + 5, y + 8);
  pdf.text('PAYMENT PLAN', margin + 5 + colWidth, y + 8);
  pdf.text('TIMELINE', margin + 5 + colWidth * 2, y + 8);
  pdf.text('ENTRY COSTS', margin + 5 + colWidth * 3, y + 8);
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(fmt(inputs.basePrice), margin + 5, y + 18);
  pdf.text(`${inputs.preHandoverPercent}/${handoverPercent}`, margin + 5 + colWidth, y + 18);
  pdf.text(`${calculations.totalMonths} months`, margin + 5 + colWidth * 2, y + 18);
  pdf.text(fmt(totalEntryCosts), margin + 5 + colWidth * 3, y + 18);
  
  pdf.setTextColor(156, 163, 175);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`CAGR: ${inputs.appreciationRate}%`, margin + 5, y + 26);
  pdf.text(`${inputs.preHandoverPercent}% pre-handover`, margin + 5 + colWidth, y + 26);
  pdf.text(`${bookingDateStr} → ${handoverDateStr}`, margin + 5 + colWidth * 2, y + 26);
  pdf.text(`DLD ${DLD_FEE_PERCENT}% + Oqood`, margin + 5 + colWidth * 3, y + 26);
  
  y += 45;

  // ========== PAYMENT BREAKDOWN ==========
  checkNewPage(80);
  pdf.setTextColor(204, 255, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYMENT BREAKDOWN', margin, y);
  y += 8;
  
  pdf.setFillColor(26, 31, 46);
  const paymentBoxHeight = 60 + (inputs.additionalPayments.length * 8);
  pdf.roundedRect(margin, y, contentWidth, paymentBoxHeight, 3, 3, 'F');
  
  const downpaymentAmount = inputs.basePrice * inputs.downpaymentPercent / 100;
  const remainingDownpayment = downpaymentAmount - inputs.eoiFee;
  const handoverAmount = inputs.basePrice * handoverPercent / 100;
  
  pdf.setTextColor(156, 163, 175);
  pdf.setFontSize(9);
  pdf.text('AT BOOKING', margin + 5, y + 10);
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  let paymentY = y + 18;
  pdf.text(`EOI Fee: ${fmt(inputs.eoiFee)}`, margin + 8, paymentY);
  paymentY += 6;
  pdf.text(`Downpayment (${inputs.downpaymentPercent}% - EOI): ${fmt(remainingDownpayment)}`, margin + 8, paymentY);
  paymentY += 6;
  pdf.text(`DLD Fee (${DLD_FEE_PERCENT}%): ${fmt(dldFee)}`, margin + 8, paymentY);
  paymentY += 6;
  pdf.text(`Oqood Fee: ${fmt(inputs.oqoodFee)}`, margin + 8, paymentY);
  paymentY += 10;
  
  if (inputs.additionalPayments.length > 0) {
    pdf.setTextColor(156, 163, 175);
    pdf.text('DURING CONSTRUCTION', margin + 5, paymentY);
    paymentY += 8;
    pdf.setTextColor(255, 255, 255);
    inputs.additionalPayments.forEach(payment => {
      const amount = inputs.basePrice * payment.paymentPercent / 100;
      const trigger = payment.type === 'time' 
        ? `Month ${payment.triggerValue}` 
        : `${payment.triggerValue}% construction`;
      pdf.text(`${payment.paymentPercent}% (${trigger}): ${fmt(amount)}`, margin + 8, paymentY);
      paymentY += 6;
    });
    paymentY += 4;
  }
  
  pdf.setTextColor(156, 163, 175);
  pdf.text('AT HANDOVER', margin + 5, paymentY);
  paymentY += 8;
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Final Payment (${handoverPercent}%): ${fmt(handoverAmount)}`, margin + 8, paymentY);
  
  y += paymentBoxHeight + 10;

  // ========== GROWTH CURVE (Chart capture) ==========
  if (chartElement) {
    checkNewPage(90);
    pdf.setTextColor(204, 255, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GROWTH PROJECTION', margin, y);
    y += 5;
    
    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#0f172a',
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      
      checkNewPage(imgHeight + 10);
      pdf.addImage(imgData, 'PNG', margin, y, imgWidth, Math.min(imgHeight, 80));
      y += Math.min(imgHeight, 80) + 10;
    } catch (error) {
      console.error('Failed to capture chart:', error);
      y += 10;
    }
  }

  // ========== EXIT SCENARIOS ==========
  checkNewPage(60);
  pdf.setTextColor(204, 255, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EXIT SCENARIOS', margin, y);
  y += 8;
  
  const scenarioWidth = (contentWidth - 10) / 3;
  exitScenarios.slice(0, 3).forEach((scenario, index) => {
    const x = margin + index * (scenarioWidth + 5);
    pdf.setFillColor(26, 31, 46);
    pdf.roundedRect(x, y, scenarioWidth, 50, 3, 3, 'F');
    
    pdf.setTextColor(204, 255, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`EXIT ${index + 1}`, x + 5, y + 10);
    
    pdf.setTextColor(156, 163, 175);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${scenario.exitMonths} months`, x + 5, y + 18);
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.text(`Exit Price: ${fmt(scenario.exitPrice)}`, x + 5, y + 28);
    pdf.text(`Capital: ${fmt(scenario.totalCapitalDeployed)}`, x + 5, y + 36);
    
    pdf.setTextColor(204, 255, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`ROE: ${scenario.trueROE.toFixed(1)}%`, x + 5, y + 46);
  });
  
  y += 60;

  // ========== 10-YEAR PROJECTION TABLE ==========
  checkNewPage(100);
  pdf.setTextColor(204, 255, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('10-YEAR PROJECTION', margin, y);
  y += 8;
  
  pdf.setFillColor(26, 31, 46);
  pdf.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
  
  const col1 = margin + 5;
  const col2 = margin + 35;
  const col3 = margin + 85;
  const col4 = margin + 135;
  
  pdf.setTextColor(156, 163, 175);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('YEAR', col1, y + 7);
  pdf.text('PROPERTY VALUE', col2, y + 7);
  pdf.text('ANNUAL RENT', col3, y + 7);
  pdf.text('STATUS', col4, y + 7);
  
  y += 12;
  
  calculations.yearlyProjections.slice(0, 10).forEach((proj, index) => {
    const rowY = y + index * 8;
    if (rowY > pageHeight - margin - 20) {
      pdf.addPage();
      y = margin;
      return;
    }
    
    if (proj.isHandover) {
      pdf.setFillColor(204, 255, 0);
      pdf.setDrawColor(204, 255, 0);
      pdf.roundedRect(margin, rowY - 4, contentWidth, 8, 1, 1, 'F');
      pdf.setTextColor(15, 23, 42);
    } else {
      pdf.setTextColor(255, 255, 255);
    }
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${proj.calendarYear}`, col1, rowY);
    pdf.text(fmt(proj.propertyValue), col2, rowY);
    pdf.text(proj.annualRent ? fmt(proj.annualRent) : '—', col3, rowY);
    
    const status = proj.isHandover ? 'HANDOVER' : proj.isConstruction ? 'Construction' : 'Operational';
    pdf.text(status, col4, rowY);
  });
  
  y += calculations.yearlyProjections.slice(0, 10).length * 8 + 15;

  // ========== FOOTER ==========
  checkNewPage(20);
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text('This document is for informational purposes only and does not constitute financial advice.', margin, pageHeight - 15);
  pdf.text('Powered by Cashflow Statement Generator', margin, pageHeight - 10);

  // Save PDF
  const clientNameForFile = clients[0]?.name?.replace(/\s+/g, '_') || 'Client';
  const projectNameForFile = clientInfo.projectName?.replace(/\s+/g, '_') || 'Project';
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Cashflow_${clientNameForFile}_${projectNameForFile}_${dateStr}.pdf`;
  
  pdf.save(filename);
}
