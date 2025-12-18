import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Currency, CURRENCY_CONFIG } from '@/components/roi/currencyUtils';
import { OIInputs, OIExitScenario } from '@/components/roi/useOICalculations';
import { ClientUnitData } from '@/components/roi/ClientUnitInfo';

interface PDFExportData {
  inputs: OIInputs;
  clientInfo: ClientUnitData;
  calculations: {
    totalMonths: number;
    basePrice: number;
    totalEntryCosts: number;
    yearlyProjections: Array<{
      year: number;
      propertyValue: number;
      annualRent: number | null;
      isHandover: boolean;
    }>;
  };
  exitScenarios: number[];
  advisorName?: string;
  currency: Currency;
  rate: number;
  chartElement?: HTMLElement | null;
}

// Format currency for PDF (simple format without Intl)
const formatPDFCurrency = (value: number, currency: Currency, rate: number): string => {
  const converted = currency === 'AED' ? value : value * rate;
  const config = CURRENCY_CONFIG[currency];
  const formatted = Math.round(converted).toLocaleString();
  return `${config.symbol} ${formatted}`;
};

// Calculate exit scenario metrics
const calculateExitMetrics = (
  exitMonth: number,
  inputs: OIInputs,
  basePrice: number,
  totalMonths: number,
  totalEntryCosts: number
) => {
  const { appreciationRate, downpaymentPercent, preHandoverPercent, additionalPayments, minimumExitThreshold } = inputs;

  // Calculate appreciation
  const yearsHeld = exitMonth / 12;
  const exitPrice = basePrice * Math.pow(1 + appreciationRate / 100, yearsHeld);
  const profit = exitPrice - basePrice;

  // Calculate equity at exit
  let equityPercent = downpaymentPercent;
  additionalPayments.forEach(p => {
    if (p.type === 'time' && p.triggerValue <= exitMonth) {
      equityPercent += p.paymentPercent;
    } else if (p.type === 'construction') {
      const constructionAtMonth = (exitMonth / totalMonths) * 100;
      if (p.triggerValue <= constructionAtMonth) {
        equityPercent += p.paymentPercent;
      }
    }
  });

  // Apply minimum threshold
  equityPercent = Math.max(equityPercent, minimumExitThreshold);
  const equityDeployed = basePrice * equityPercent / 100;
  const totalCapital = equityDeployed + totalEntryCosts;
  const trueROE = (profit / totalCapital) * 100;

  return {
    exitMonth,
    constructionPercent: Math.round((exitMonth / totalMonths) * 100),
    exitPrice,
    profit,
    equityDeployed,
    totalCapital,
    trueROE,
  };
};

export const generateCashflowPDF = async (data: PDFExportData): Promise<void> => {
  const { inputs, clientInfo, calculations, exitScenarios, advisorName, currency, rate, chartElement } = data;
  const { basePrice, totalMonths, totalEntryCosts, yearlyProjections } = calculations;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Colors
  const accentColor: [number, number, number] = [204, 255, 0]; // #CCFF00
  const darkBg: [number, number, number] = [15, 23, 42]; // #0f172a
  const cardBg: [number, number, number] = [26, 31, 46]; // #1a1f2e
  const textWhite: [number, number, number] = [255, 255, 255];
  const textGray: [number, number, number] = [156, 163, 175];

  // Helper function to add new page if needed
  const checkNewPage = (height: number) => {
    if (yPos + height > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // ========== HEADER ==========
  pdf.setFillColor(...darkBg);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  pdf.setTextColor(...accentColor);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CASHFLOW STATEMENT', margin, 18);
  
  pdf.setTextColor(...textGray);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  pdf.text(`Prepared by: ${advisorName || 'Advisor'}`, margin, 28);
  pdf.text(dateStr, pageWidth - margin - pdf.getTextWidth(dateStr), 28);

  yPos = 45;

  // ========== CLIENT & PROPERTY INFO ==========
  pdf.setFillColor(...cardBg);
  pdf.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'F');
  
  pdf.setTextColor(...accentColor);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CLIENT & PROPERTY INFORMATION', margin + 5, yPos + 8);
  
  pdf.setTextColor(...textWhite);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  const col1X = margin + 5;
  const col2X = margin + contentWidth / 2;
  
  // Column 1
  pdf.text(`Developer: ${clientInfo.developer || '—'}`, col1X, yPos + 16);
  pdf.text(`Project: ${clientInfo.projectName || '—'}`, col1X, yPos + 23);
  const clientNames = clientInfo.clients?.map(c => c.name).join(', ') || '—';
  pdf.text(`Client: ${clientNames}`, col1X, yPos + 30);
  
  // Column 2
  pdf.text(`Unit: ${clientInfo.unit || '—'}`, col2X, yPos + 16);
  const sizeStr = clientInfo.unitSizeSqf ? `${clientInfo.unitSizeSqf} sqf / ${clientInfo.unitSizeM2} m²` : '—';
  pdf.text(`Size: ${sizeStr}`, col2X, yPos + 23);
  pdf.text(`Type: ${clientInfo.unitType || '—'}`, col2X, yPos + 30);

  yPos += 42;

  // ========== INVESTMENT SNAPSHOT ==========
  pdf.setFillColor(...cardBg);
  pdf.roundedRect(margin, yPos, contentWidth, 40, 3, 3, 'F');
  
  pdf.setTextColor(...accentColor);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVESTMENT SNAPSHOT', margin + 5, yPos + 8);
  
  pdf.setTextColor(...textWhite);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  const handoverPercent = 100 - inputs.preHandoverPercent;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Row 1
  pdf.text(`Property Price: ${formatPDFCurrency(basePrice, currency, rate)}`, col1X, yPos + 16);
  pdf.text(`Payment Plan: ${inputs.preHandoverPercent}/${handoverPercent}`, col2X, yPos + 16);
  
  // Row 2
  pdf.text(`Construction Period: ${totalMonths} months`, col1X, yPos + 23);
  const timelineStr = `${monthNames[inputs.bookingMonth - 1]} ${inputs.bookingYear} → Q${inputs.handoverQuarter} ${inputs.handoverYear}`;
  pdf.text(`Timeline: ${timelineStr}`, col2X, yPos + 23);
  
  // Row 3
  const dldFee = basePrice * 0.04;
  const downpaymentAmount = basePrice * inputs.downpaymentPercent / 100;
  const amountAtBooking = downpaymentAmount + dldFee + inputs.oqoodFee;
  pdf.text(`Amount at Booking: ${formatPDFCurrency(amountAtBooking, currency, rate)}`, col1X, yPos + 30);
  
  pdf.setTextColor(...textGray);
  pdf.text(`Entry Costs (DLD + Oqood): ${formatPDFCurrency(totalEntryCosts, currency, rate)}`, col2X, yPos + 30);

  yPos += 47;

  // ========== PAYMENT BREAKDOWN ==========
  pdf.setFillColor(...cardBg);
  pdf.roundedRect(margin, yPos, contentWidth, 55, 3, 3, 'F');
  
  pdf.setTextColor(...accentColor);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYMENT BREAKDOWN', margin + 5, yPos + 8);
  
  pdf.setTextColor(...textWhite);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  // At Booking
  pdf.setFont('helvetica', 'bold');
  pdf.text('AT BOOKING', col1X, yPos + 16);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`• EOI / Booking Fee: ${formatPDFCurrency(inputs.eoiFee, currency, rate)}`, col1X, yPos + 22);
  const restDownpayment = downpaymentAmount - inputs.eoiFee;
  pdf.text(`• Rest of Downpayment: ${formatPDFCurrency(restDownpayment, currency, rate)}`, col1X, yPos + 28);
  pdf.text(`• DLD Fee (4%): ${formatPDFCurrency(dldFee, currency, rate)}`, col1X, yPos + 34);
  pdf.text(`• Oqood Fee: ${formatPDFCurrency(inputs.oqoodFee, currency, rate)}`, col1X, yPos + 40);
  
  // Summary
  pdf.setFont('helvetica', 'bold');
  pdf.text('SUMMARY', col2X, yPos + 16);
  pdf.setFont('helvetica', 'normal');
  
  const additionalTotal = inputs.additionalPayments.reduce((sum, p) => sum + (basePrice * p.paymentPercent / 100), 0);
  const preHandoverTotal = downpaymentAmount + additionalTotal;
  const handoverAmount = basePrice * handoverPercent / 100;
  const totalDisburse = basePrice + totalEntryCosts;
  
  pdf.text(`Pre-Handover (${inputs.preHandoverPercent}%): ${formatPDFCurrency(preHandoverTotal, currency, rate)}`, col2X, yPos + 22);
  pdf.text(`At Handover (${handoverPercent}%): ${formatPDFCurrency(handoverAmount, currency, rate)}`, col2X, yPos + 28);
  pdf.setTextColor(...accentColor);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Total to Disburse: ${formatPDFCurrency(totalDisburse, currency, rate)}`, col2X, yPos + 40);

  yPos += 62;

  // ========== GROWTH CURVE (Chart capture) ==========
  if (chartElement) {
    checkNewPage(85);
    
    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#0f172a',
        scale: 2,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      
      pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, Math.min(imgHeight, 75));
      yPos += Math.min(imgHeight, 75) + 7;
    } catch (error) {
      console.error('Error capturing chart:', error);
    }
  }

  // ========== EXIT SCENARIOS ==========
  checkNewPage(45);
  
  pdf.setFillColor(...cardBg);
  pdf.roundedRect(margin, yPos, contentWidth, 40, 3, 3, 'F');
  
  pdf.setTextColor(...accentColor);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EXIT SCENARIOS', margin + 5, yPos + 8);
  
  // Exit scenario cards
  const cardWidth = (contentWidth - 20) / 3;
  const scenarios = exitScenarios.slice(0, 3).map(month => 
    calculateExitMetrics(month, inputs, basePrice, totalMonths, totalEntryCosts)
  );
  
  scenarios.forEach((scenario, idx) => {
    const cardX = margin + 5 + idx * (cardWidth + 5);
    
    pdf.setFillColor(30, 35, 50);
    pdf.roundedRect(cardX, yPos + 12, cardWidth, 24, 2, 2, 'F');
    
    pdf.setTextColor(...textWhite);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`EXIT #${idx + 1}`, cardX + 3, yPos + 18);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...textGray);
    pdf.text(`${scenario.exitMonth} months | ${scenario.constructionPercent}%`, cardX + 3, yPos + 23);
    
    pdf.setTextColor(...accentColor);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`ROE: ${scenario.trueROE.toFixed(1)}%`, cardX + 3, yPos + 31);
  });

  yPos += 47;

  // ========== 10-YEAR PROJECTION TABLE ==========
  checkNewPage(70);
  
  pdf.setTextColor(...accentColor);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('10-YEAR PROJECTION', margin, yPos + 5);
  
  yPos += 10;
  
  // Table header
  pdf.setFillColor(...cardBg);
  pdf.rect(margin, yPos, contentWidth, 7, 'F');
  
  pdf.setTextColor(...textGray);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Year', margin + 5, yPos + 5);
  pdf.text('Property Value', margin + 45, yPos + 5);
  pdf.text('Annual Rent', margin + 100, yPos + 5);
  pdf.text('Status', margin + 145, yPos + 5);
  
  yPos += 8;
  
  // Table rows
  yearlyProjections.slice(0, 10).forEach((proj, idx) => {
    if (checkNewPage(7)) {
      // Re-add table header on new page
      pdf.setFillColor(...cardBg);
      pdf.rect(margin, yPos, contentWidth, 7, 'F');
      pdf.setTextColor(...textGray);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Year', margin + 5, yPos + 5);
      pdf.text('Property Value', margin + 45, yPos + 5);
      pdf.text('Annual Rent', margin + 100, yPos + 5);
      pdf.text('Status', margin + 145, yPos + 5);
      yPos += 8;
    }
    
    const isEven = idx % 2 === 0;
    if (isEven) {
      pdf.setFillColor(20, 25, 38);
      pdf.rect(margin, yPos, contentWidth, 6, 'F');
    }
    
    pdf.setTextColor(...textWhite);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    pdf.text(proj.year.toString(), margin + 5, yPos + 4.5);
    pdf.text(formatPDFCurrency(proj.propertyValue, currency, rate), margin + 45, yPos + 4.5);
    pdf.text(proj.annualRent ? formatPDFCurrency(proj.annualRent, currency, rate) : '—', margin + 100, yPos + 4.5);
    
    // Status
    let status = 'Operational';
    if (proj.isHandover) {
      status = 'Handover';
      pdf.setTextColor(...accentColor);
    } else if (!proj.annualRent) {
      status = 'Construction';
      pdf.setTextColor(...textGray);
    }
    pdf.text(status, margin + 145, yPos + 4.5);
    pdf.setTextColor(...textWhite);
    
    yPos += 6;
  });

  // ========== FOOTER ==========
  yPos = pageHeight - 15;
  pdf.setDrawColor(42, 49, 66);
  pdf.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
  
  pdf.setTextColor(...textGray);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Powered by Lovable', margin, yPos);
  pdf.text(`Generated on ${dateStr}`, pageWidth - margin - pdf.getTextWidth(`Generated on ${dateStr}`), yPos);

  // Generate filename and download
  const clientName = clientInfo.clients?.[0]?.name?.replace(/\s+/g, '_') || 'Client';
  const projectName = clientInfo.projectName?.replace(/\s+/g, '_') || 'Project';
  const dateCode = new Date().toISOString().split('T')[0];
  const filename = `Cashflow_${clientName}_${projectName}_${dateCode}.pdf`;
  
  pdf.save(filename);
};
