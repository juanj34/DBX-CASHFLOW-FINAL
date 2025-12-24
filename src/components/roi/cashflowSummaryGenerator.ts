import { OIInputs, OICalculations, quarterToMonth } from "./useOICalculations";
import { ClientUnitData } from "./ClientUnitInfo";
import { MortgageAnalysis, MortgageInputs } from "./useMortgageCalculations";
import { formatCurrency, Currency } from "./currencyUtils";

type Language = 'en' | 'es';

interface SummaryData {
  inputs: OIInputs;
  clientInfo: ClientUnitData;
  calculations: OICalculations;
  mortgageAnalysis?: MortgageAnalysis;
  mortgageInputs?: MortgageInputs;
  exitScenarios?: number[];
  currency: Currency;
  rate: number;
  language: Language;
  includeExitScenarios?: boolean;
  includeRentalPotential?: boolean;
}

// Structured data for visual rendering
export interface StructuredSummaryData {
  property: {
    projectName: string;
    developer: string;
    unit: string;
    unitType: string;
    sizeSqft: number;
    price: number;
    pricePerSqft: number;
  };
  paymentStructure: {
    preHandoverPercent: number;
    handoverPercent: number;
    preHandoverAmount: number;
    handoverAmount: number;
  };
  timeline: {
    bookingDate: string;
    handoverDate: string;
    constructionMonths: number;
  };
  todaysCommitment: {
    downpayment: number;
    downpaymentPercent: number;
    dldFee: number;
    oqoodFee: number;
    total: number;
  };
  construction: {
    paymentsCount: number;
    totalAmount: number;
  };
  handover: {
    percent: number;
    amount: number;
  };
  rental?: {
    yieldPercent: number;
    grossAnnual: number;
    netAnnual: number;
    yearsToPayOff: number;
    effectiveYield: number;
  };
  exitScenarios?: Array<{
    month: number;
    value: number;
    profit: number;
    roe: number;
  }>;
  mortgage?: {
    financingPercent: number;
    loanAmount: number;
    monthlyPayment: number;
    monthlyRent: number;
    gap: number;
    isPositive: boolean;
  };
}

interface GeneratedSummary {
  fullText: string;
  sections: {
    propertyOverview: string;
    paymentStructure: string;
    timeline: string;
    todaysCommitment: string;
    duringConstruction: string;
    atHandover: string;
    rentalPotential?: string;
    exitScenarios?: string;
    mortgageImpact?: string;
  };
  structuredData: StructuredSummaryData;
}

const translations = {
  // Property Overview
  propertyOverviewTitle: { en: '📍 Property Overview', es: '📍 Resumen de la Propiedad' },
  propertyBy: { en: 'by', es: 'por' },
  unitDetails: { en: 'Unit', es: 'Unidad' },
  purchasePriceLabel: { en: 'Purchase Price', es: 'Precio de Compra' },
  pricePerSqft: { en: 'per sqft', es: 'por sqft' },
  
  // Payment Structure
  paymentStructureTitle: { en: '💳 Payment Structure', es: '💳 Estructura de Pago' },
  paymentPlanIntro: { en: 'This property follows a', es: 'Esta propiedad sigue un plan de pago' },
  paymentPlanSplit: { en: 'payment plan', es: '' },
  preHandoverExplain: { en: 'of the price is paid before handover', es: 'del precio se paga antes de la entrega' },
  handoverExplain: { en: 'is paid at handover', es: 'se paga en la entrega' },
  
  // Timeline
  timelineTitle: { en: '📅 Timeline', es: '📅 Cronograma' },
  bookingDateLabel: { en: 'Booking Date', es: 'Fecha de Reserva' },
  handoverDateLabel: { en: 'Expected Handover', es: 'Entrega Esperada' },
  constructionPeriodLabel: { en: 'Construction Period', es: 'Período de Construcción' },
  monthsLabel: { en: 'months', es: 'meses' },
  
  // Today's Commitment
  todaysCommitmentTitle: { en: '💰 Today\'s Commitment', es: '💰 Compromiso de Hoy' },
  toSecureProperty: { en: 'To secure this property today, you need', es: 'Para asegurar esta propiedad hoy, necesita' },
  downpaymentIncluding: { en: 'Downpayment (including EOI)', es: 'Enganche (incluyendo EOI)' },
  dldFeeLabel: { en: 'DLD Fee (4%)', es: 'Tarifa DLD (4%)' },
  oqoodFeeLabel: { en: 'Oqood Fee', es: 'Tarifa Oqood' },
  totalTodayLabel: { en: 'Total Today', es: 'Total Hoy' },
  
  // During Construction
  duringConstructionTitle: { en: '🏗️ During Construction', es: '🏗️ Durante la Construcción' },
  constructionPaymentsIntro: { en: 'During the construction period, you will make', es: 'Durante el período de construcción, realizará' },
  additionalPaymentsLabel: { en: 'additional payments totaling', es: 'pagos adicionales totalizando' },
  noAdditionalPayments: { en: 'No additional payments during construction', es: 'Sin pagos adicionales durante la construcción' },
  
  // At Handover
  atHandoverTitle: { en: '🔑 At Handover', es: '🔑 En la Entrega' },
  finalPaymentIntro: { en: 'At handover, you will pay the remaining', es: 'En la entrega, pagará el restante' },
  whichEquals: { en: 'which equals', es: 'lo cual equivale a' },
  
  // Rental Potential
  rentalPotentialTitle: { en: '📈 Rental Potential', es: '📈 Potencial de Renta' },
  afterHandoverRent: { en: 'After handover, based on the projected rental yield of', es: 'Después de la entrega, basado en el rendimiento de renta proyectado de' },
  estimatedAnnualRent: { en: 'Estimated gross annual rent', es: 'Renta anual bruta estimada' },
  netRentAfterCharges: { en: 'Net rent after service charges', es: 'Renta neta después de cargos de servicio' },
  yearsToPayOffProperty: { en: 'Years to pay off property with rent', es: 'Años para pagar la propiedad con renta' },
  yieldOnTotalInvestment: { en: 'Effective yield on total investment', es: 'Rendimiento efectivo sobre inversión total' },
  
  // Exit Scenarios
  exitScenariosTitle: { en: '🚪 Exit Options', es: '🚪 Opciones de Salida' },
  exitScenariosIntro: { en: 'If you decide to sell during construction, here are potential exit points', es: 'Si decide vender durante la construcción, estas son las opciones de salida' },
  atMonth: { en: 'At month', es: 'En el mes' },
  estimatedValue: { en: 'Estimated value', es: 'Valor estimado' },
  potentialProfit: { en: 'Potential profit', es: 'Ganancia potencial' },
  returnOnEquity: { en: 'Return on equity', es: 'Retorno sobre capital' },
  
  // Mortgage Impact
  mortgageImpactTitle: { en: '🏦 Mortgage Analysis', es: '🏦 Análisis de Hipoteca' },
  withMortgage: { en: 'With a mortgage covering', es: 'Con una hipoteca que cubre' },
  ofPropertyValue: { en: 'of the property value', es: 'del valor de la propiedad' },
  monthlyPayment: { en: 'Monthly mortgage payment', es: 'Pago mensual de hipoteca' },
  monthlyRent: { en: 'Estimated monthly rent', es: 'Renta mensual estimada' },
  gapOrSurplus: { en: 'Monthly gap/surplus', es: 'Diferencia mensual' },
};

const t = (key: keyof typeof translations, lang: Language): string => {
  return translations[key]?.[lang] || key;
};

const getMonthName = (month: number, lang: Language): string => {
  const monthNames = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  };
  return monthNames[lang][month - 1] || '';
};

const getQuarterName = (quarter: number): string => {
  return `Q${quarter}`;
};

export const generateCashflowSummary = (data: SummaryData): GeneratedSummary => {
  const { 
    inputs, 
    clientInfo, 
    calculations, 
    mortgageAnalysis, 
    mortgageInputs, 
    exitScenarios, 
    currency, 
    rate, 
    language,
    includeExitScenarios = true,
    includeRentalPotential = true,
  } = data;
  const lang = language;
  
  const fmt = (amount: number) => formatCurrency(amount, currency, rate);
  const isMortgageEnabled = mortgageInputs?.enabled ?? false;
  
  // Calculate key values
  const downpaymentAmount = inputs.basePrice * inputs.downpaymentPercent / 100;
  const dldFee = inputs.basePrice * 0.04;
  const handoverPercent = 100 - inputs.preHandoverPercent;
  const handoverAmount = inputs.basePrice * handoverPercent / 100;
  const preHandoverAmount = inputs.basePrice * inputs.preHandoverPercent / 100;
  const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, p) => sum + (inputs.basePrice * p.paymentPercent / 100), 0);
  const totalToday = downpaymentAmount + dldFee + inputs.oqoodFee;
  
  const bookingDateStr = `${getMonthName(inputs.bookingMonth, lang)} ${inputs.bookingYear}`;
  const handoverDateStr = `${getQuarterName(inputs.handoverQuarter)} ${inputs.handoverYear}`;
  
  // Build structured data
  const structuredData: StructuredSummaryData = {
    property: {
      projectName: clientInfo.projectName,
      developer: clientInfo.developer,
      unit: clientInfo.unit,
      unitType: clientInfo.unitType || '',
      sizeSqft: clientInfo.unitSizeSqf,
      price: inputs.basePrice,
      pricePerSqft: clientInfo.unitSizeSqf > 0 ? inputs.basePrice / clientInfo.unitSizeSqf : 0,
    },
    paymentStructure: {
      preHandoverPercent: inputs.preHandoverPercent,
      handoverPercent,
      preHandoverAmount,
      handoverAmount,
    },
    timeline: {
      bookingDate: bookingDateStr,
      handoverDate: handoverDateStr,
      constructionMonths: calculations.totalMonths,
    },
    todaysCommitment: {
      downpayment: downpaymentAmount,
      downpaymentPercent: inputs.downpaymentPercent,
      dldFee,
      oqoodFee: inputs.oqoodFee,
      total: totalToday,
    },
    construction: {
      paymentsCount: inputs.additionalPayments.length,
      totalAmount: additionalPaymentsTotal,
    },
    handover: {
      percent: handoverPercent,
      amount: handoverAmount,
    },
  };

  // Add rental data if included
  if (includeRentalPotential) {
    structuredData.rental = {
      yieldPercent: inputs.rentalYieldPercent,
      grossAnnual: calculations.holdAnalysis.annualRent,
      netAnnual: calculations.holdAnalysis.netAnnualRent,
      yearsToPayOff: calculations.holdAnalysis.yearsToPayOff,
      effectiveYield: calculations.holdAnalysis.rentalYieldOnInvestment,
    };
  }

  // Add exit scenarios if included
  if (includeExitScenarios && exitScenarios && exitScenarios.length > 0) {
    structuredData.exitScenarios = exitScenarios.slice(0, 3).map(month => {
      const scenario = calculations.scenarios.find(s => s.exitMonths === month);
      return {
        month,
        value: scenario?.exitPrice || 0,
        profit: scenario?.profit || 0,
        roe: scenario?.trueROE || 0,
      };
    }).filter(s => s.value > 0);
  }

  // Add mortgage data if enabled
  if (isMortgageEnabled && mortgageAnalysis && mortgageInputs) {
    const monthlyRent = calculations.holdAnalysis.netAnnualRent / 12;
    const rentVsPayment = monthlyRent - mortgageAnalysis.monthlyPayment;
    
    structuredData.mortgage = {
      financingPercent: mortgageInputs.financingPercent,
      loanAmount: mortgageAnalysis.loanAmount,
      monthlyPayment: mortgageAnalysis.monthlyPayment,
      monthlyRent,
      gap: Math.abs(rentVsPayment),
      isPositive: rentVsPayment >= 0,
    };
  }

  // Sections for text output
  const propertyOverview = `${t('propertyOverviewTitle', lang)}
${clientInfo.projectName} ${t('propertyBy', lang)} ${clientInfo.developer}
${t('unitDetails', lang)}: ${clientInfo.unit} (${clientInfo.unitType || ''}) - ${clientInfo.unitSizeSqf} sqft
${t('purchasePriceLabel', lang)}: ${fmt(inputs.basePrice)}${clientInfo.unitSizeSqf > 0 ? ` (${fmt(inputs.basePrice / clientInfo.unitSizeSqf)} ${t('pricePerSqft', lang)})` : ''}`;

  const paymentStructure = `${t('paymentStructureTitle', lang)}
${t('paymentPlanIntro', lang)} ${inputs.preHandoverPercent}/${handoverPercent} ${t('paymentPlanSplit', lang)}
• ${inputs.preHandoverPercent}% ${t('preHandoverExplain', lang)}
• ${handoverPercent}% ${t('handoverExplain', lang)}`;

  const timeline = `${t('timelineTitle', lang)}
• ${t('bookingDateLabel', lang)}: ${bookingDateStr}
• ${t('handoverDateLabel', lang)}: ${handoverDateStr}
• ${t('constructionPeriodLabel', lang)}: ${calculations.totalMonths} ${t('monthsLabel', lang)}`;

  const todaysCommitment = `${t('todaysCommitmentTitle', lang)}
${t('toSecureProperty', lang)}:
• ${t('downpaymentIncluding', lang)}: ${fmt(downpaymentAmount)} (${inputs.downpaymentPercent}%)
• ${t('dldFeeLabel', lang)}: ${fmt(dldFee)}
• ${t('oqoodFeeLabel', lang)}: ${fmt(inputs.oqoodFee)}
━━━━━━━━━━━━━━━━━━━━
${t('totalTodayLabel', lang)}: ${fmt(totalToday)}`;

  const duringConstruction = inputs.additionalPayments.length > 0
    ? `${t('duringConstructionTitle', lang)}
${t('constructionPaymentsIntro', lang)} ${inputs.additionalPayments.length} ${t('additionalPaymentsLabel', lang)} ${fmt(additionalPaymentsTotal)}`
    : `${t('duringConstructionTitle', lang)}
${t('noAdditionalPayments', lang)}`;

  const atHandover = `${t('atHandoverTitle', lang)}
${t('finalPaymentIntro', lang)} ${handoverPercent}%, ${t('whichEquals', lang)} ${fmt(handoverAmount)}`;

  // Optional: Rental Potential (conditionally included)
  let rentalPotential: string | undefined;
  if (includeRentalPotential) {
    rentalPotential = `${t('rentalPotentialTitle', lang)}
${t('afterHandoverRent', lang)} ${inputs.rentalYieldPercent}%:
• ${t('estimatedAnnualRent', lang)}: ${fmt(calculations.holdAnalysis.annualRent)}
• ${t('netRentAfterCharges', lang)}: ${fmt(calculations.holdAnalysis.netAnnualRent)}
• ${t('yearsToPayOffProperty', lang)}: ${calculations.holdAnalysis.yearsToPayOff.toFixed(1)}
• ${t('yieldOnTotalInvestment', lang)}: ${calculations.holdAnalysis.rentalYieldOnInvestment.toFixed(1)}%`;
  }

  // Optional: Exit Scenarios (conditionally included)
  let exitScenariosSection: string | undefined;
  if (includeExitScenarios && exitScenarios && exitScenarios.length > 0) {
    const scenarioLines = exitScenarios.slice(0, 3).map(month => {
      const scenario = calculations.scenarios.find(s => s.exitMonths === month);
      if (!scenario) return '';
      return `• ${t('atMonth', lang)} ${month}: ${t('estimatedValue', lang)} ${fmt(scenario.exitPrice)} | ${t('potentialProfit', lang)} ${fmt(scenario.profit)} | ${t('returnOnEquity', lang)} ${scenario.trueROE.toFixed(1)}%`;
    }).filter(Boolean).join('\n');
    
    if (scenarioLines) {
      exitScenariosSection = `${t('exitScenariosTitle', lang)}
${t('exitScenariosIntro', lang)}:
${scenarioLines}`;
    }
  }

  // Optional: Mortgage Impact
  let mortgageImpactSection: string | undefined;
  if (isMortgageEnabled && mortgageAnalysis && mortgageInputs) {
    const monthlyRent = calculations.holdAnalysis.netAnnualRent / 12;
    const rentVsPayment = monthlyRent - mortgageAnalysis.monthlyPayment;
    const gapLabel = rentVsPayment >= 0 
      ? (lang === 'en' ? 'Surplus' : 'Excedente')
      : (lang === 'en' ? 'Gap' : 'Diferencia');
    
    mortgageImpactSection = `${t('mortgageImpactTitle', lang)}
${t('withMortgage', lang)} ${mortgageInputs.financingPercent}% ${t('ofPropertyValue', lang)}:
• ${t('monthlyPayment', lang)}: ${fmt(mortgageAnalysis.monthlyPayment)}
• ${t('monthlyRent', lang)}: ${fmt(monthlyRent)}
• ${gapLabel}: ${fmt(Math.abs(rentVsPayment))}${rentVsPayment >= 0 ? ' ✅' : ' ⚠️'}`;
  }

  // Combine all sections
  const sections = {
    propertyOverview,
    paymentStructure,
    timeline,
    todaysCommitment,
    duringConstruction,
    atHandover,
    rentalPotential,
    exitScenarios: exitScenariosSection,
    mortgageImpact: mortgageImpactSection,
  };

  const allSections = [
    propertyOverview,
    paymentStructure,
    timeline,
    todaysCommitment,
    duringConstruction,
    atHandover,
    rentalPotential,
    exitScenariosSection,
    mortgageImpactSection,
  ].filter(Boolean);

  const fullText = allSections.join('\n\n');

  return {
    fullText,
    sections,
    structuredData,
  };
};
