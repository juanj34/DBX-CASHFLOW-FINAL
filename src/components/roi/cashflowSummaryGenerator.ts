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
  includeMortgage?: boolean;
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
    installments: Array<{
      label: string;
      percent: number;
      amount: number;
      timing: string;
    }>;
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
    payments: Array<{
      percent: number;
      amount: number;
      timing: string;
    }>;
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
    includeMortgage = true,
  } = data;
  const lang = language;
  
  const fmt = (amount: number) => formatCurrency(amount, currency, rate);
  const isMortgageEnabled = mortgageInputs?.enabled ?? false;
  const shouldShowMortgage = isMortgageEnabled && includeMortgage;
  
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
  
  // Build installments breakdown
  const installments: Array<{ label: string; percent: number; amount: number; timing: string }> = [
    {
      label: lang === 'en' ? 'Downpayment at booking' : 'Enganche en reserva',
      percent: inputs.downpaymentPercent,
      amount: downpaymentAmount,
      timing: bookingDateStr
    }
  ];
  
  // Add additional payments
  inputs.additionalPayments.forEach((payment, idx) => {
    const paymentAmount = inputs.basePrice * payment.paymentPercent / 100;
    const timing = payment.type === 'construction'
      ? `${payment.triggerValue}% ${lang === 'en' ? 'construction' : 'construcción'}`
      : `${lang === 'en' ? 'Month' : 'Mes'} ${payment.triggerValue}`;
    installments.push({
      label: `${lang === 'en' ? 'Installment' : 'Cuota'} ${idx + 1}`,
      percent: payment.paymentPercent,
      amount: paymentAmount,
      timing
    });
  });
  
  // Add handover
  installments.push({
    label: lang === 'en' ? 'Final payment at handover' : 'Pago final en entrega',
    percent: handoverPercent,
    amount: handoverAmount,
    timing: handoverDateStr
  });

  // Build construction payments breakdown
  const constructionPayments = inputs.additionalPayments.map((payment, idx) => {
    const paymentAmount = inputs.basePrice * payment.paymentPercent / 100;
    const timing = payment.type === 'construction'
      ? `${payment.triggerValue}% ${lang === 'en' ? 'construction' : 'construcción'}`
      : `${lang === 'en' ? 'Month' : 'Mes'} ${payment.triggerValue}`;
    return {
      percent: payment.paymentPercent,
      amount: paymentAmount,
      timing
    };
  });
  
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
      installments,
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
      payments: constructionPayments,
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

  // Add mortgage data if enabled AND included
  if (shouldShowMortgage && mortgageAnalysis && mortgageInputs) {
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

  // ========================================
  // CONVERSATIONAL TEXT SECTIONS
  // ========================================
  
  const propertyOverview = lang === 'en' 
    ? `📍 PROPERTY OVERVIEW
We're looking at ${clientInfo.projectName} by ${clientInfo.developer} – a ${clientInfo.unitType || 'unit'} of ${clientInfo.unitSizeSqf.toLocaleString()} sqft priced at ${fmt(inputs.basePrice)}${clientInfo.unitSizeSqf > 0 ? ` (${fmt(inputs.basePrice / clientInfo.unitSizeSqf)} per sqft)` : ''}.`
    : `📍 RESUMEN DE LA PROPIEDAD
Estamos viendo ${clientInfo.projectName} de ${clientInfo.developer} – un ${clientInfo.unitType || 'unidad'} de ${clientInfo.unitSizeSqf.toLocaleString()} sqft con precio de ${fmt(inputs.basePrice)}${clientInfo.unitSizeSqf > 0 ? ` (${fmt(inputs.basePrice / clientInfo.unitSizeSqf)} por sqft)` : ''}.`;

  // Build payment plan with percentages
  const paymentPlanDetails = installments.map(inst => 
    `• ${inst.percent}% – ${inst.label}: ${fmt(inst.amount)} (${inst.timing})`
  ).join('\n');
  
  const paymentStructure = lang === 'en'
    ? `💳 PAYMENT PLAN
This property follows a ${inputs.preHandoverPercent}/${handoverPercent} payment structure. Here's how it breaks down:
${paymentPlanDetails}`
    : `💳 PLAN DE PAGO
Esta propiedad sigue una estructura de pago ${inputs.preHandoverPercent}/${handoverPercent}. Así se desglosa:
${paymentPlanDetails}`;

  const timeline = lang === 'en'
    ? `📅 TIMELINE
From booking in ${bookingDateStr} to handover in ${handoverDateStr}, that's approximately ${calculations.totalMonths} months of construction.`
    : `📅 CRONOGRAMA
Desde la reserva en ${bookingDateStr} hasta la entrega en ${handoverDateStr}, son aproximadamente ${calculations.totalMonths} meses de construcción.`;

  const todaysCommitment = lang === 'en'
    ? `💰 TODAY'S COMMITMENT
To secure this property today, you'll need ${fmt(totalToday)} which includes:
• Downpayment (${inputs.downpaymentPercent}%): ${fmt(downpaymentAmount)}
• DLD Fee (4%): ${fmt(dldFee)}
• Oqood Fee: ${fmt(inputs.oqoodFee)}`
    : `💰 COMPROMISO DE HOY
Para asegurar esta propiedad hoy, necesitará ${fmt(totalToday)} que incluye:
• Enganche (${inputs.downpaymentPercent}%): ${fmt(downpaymentAmount)}
• Tarifa DLD (4%): ${fmt(dldFee)}
• Tarifa Oqood: ${fmt(inputs.oqoodFee)}`;

  let duringConstruction: string;
  if (inputs.additionalPayments.length > 0) {
    const paymentDetails = constructionPayments.map((p, idx) => 
      `• ${p.percent}% – ${fmt(p.amount)} at ${p.timing}`
    ).join('\n');
    duringConstruction = lang === 'en'
      ? `🏗️ DURING CONSTRUCTION
During the ${calculations.totalMonths}-month construction period, you'll make ${inputs.additionalPayments.length} additional payment(s) totaling ${fmt(additionalPaymentsTotal)}:
${paymentDetails}`
      : `🏗️ DURANTE LA CONSTRUCCIÓN
Durante el período de construcción de ${calculations.totalMonths} meses, realizará ${inputs.additionalPayments.length} pago(s) adicional(es) totalizando ${fmt(additionalPaymentsTotal)}:
${paymentDetails}`;
  } else {
    duringConstruction = lang === 'en'
      ? `🏗️ DURING CONSTRUCTION
Good news – there are no additional payments required during the construction period.`
      : `🏗️ DURANTE LA CONSTRUCCIÓN
Buenas noticias – no se requieren pagos adicionales durante el período de construcción.`;
  }

  const atHandover = lang === 'en'
    ? `🔑 AT HANDOVER
At handover, you'll pay the remaining ${handoverPercent}% which equals ${fmt(handoverAmount)}.`
    : `🔑 EN LA ENTREGA
En la entrega, pagará el ${handoverPercent}% restante que equivale a ${fmt(handoverAmount)}.`;

  // Optional: Rental Potential (conditionally included)
  let rentalPotential: string | undefined;
  if (includeRentalPotential) {
    const monthlyNet = calculations.holdAnalysis.netAnnualRent / 12;
    rentalPotential = lang === 'en'
      ? `📈 RENTAL POTENTIAL
After handover, based on an initial rental yield of ${inputs.rentalYieldPercent}%:
• Gross annual rent: ${fmt(calculations.holdAnalysis.annualRent)}
• Net after service charges: ${fmt(calculations.holdAnalysis.netAnnualRent)} (${fmt(monthlyNet)}/month)
• This means the property pays for itself in approximately ${calculations.holdAnalysis.yearsToPayOff.toFixed(1)} years
• Effective yield on total investment: ${calculations.holdAnalysis.rentalYieldOnInvestment.toFixed(1)}%`
      : `📈 POTENCIAL DE RENTA
Después de la entrega, basado en un rendimiento de renta inicial del ${inputs.rentalYieldPercent}%:
• Renta anual bruta: ${fmt(calculations.holdAnalysis.annualRent)}
• Neto después de cargos de servicio: ${fmt(calculations.holdAnalysis.netAnnualRent)} (${fmt(monthlyNet)}/mes)
• Esto significa que la propiedad se paga sola en aproximadamente ${calculations.holdAnalysis.yearsToPayOff.toFixed(1)} años
• Rendimiento efectivo sobre inversión total: ${calculations.holdAnalysis.rentalYieldOnInvestment.toFixed(1)}%`;
  }

  // Optional: Exit Scenarios (conditionally included)
  let exitScenariosSection: string | undefined;
  if (includeExitScenarios && exitScenarios && exitScenarios.length > 0) {
    const scenarioLines = exitScenarios.slice(0, 3).map(month => {
      const scenario = calculations.scenarios.find(s => s.exitMonths === month);
      if (!scenario) return '';
      return lang === 'en'
        ? `• At month ${month}: Property valued at ${fmt(scenario.exitPrice)}, profit of ${fmt(scenario.profit)} (ROE: ${scenario.trueROE.toFixed(1)}%)`
        : `• En el mes ${month}: Propiedad valuada en ${fmt(scenario.exitPrice)}, ganancia de ${fmt(scenario.profit)} (ROE: ${scenario.trueROE.toFixed(1)}%)`;
    }).filter(Boolean).join('\n');
    
    if (scenarioLines) {
      exitScenariosSection = lang === 'en'
        ? `🚪 EXIT OPTIONS
If you decide to sell during construction, here are the potential exit points:
${scenarioLines}`
        : `🚪 OPCIONES DE SALIDA
Si decide vender durante la construcción, estas son las opciones de salida potenciales:
${scenarioLines}`;
    }
  }

  // Optional: Mortgage Impact
  let mortgageImpactSection: string | undefined;
  if (shouldShowMortgage && mortgageAnalysis && mortgageInputs) {
    const monthlyRent = calculations.holdAnalysis.netAnnualRent / 12;
    const rentVsPayment = monthlyRent - mortgageAnalysis.monthlyPayment;
    const isPositive = rentVsPayment >= 0;
    
    const outcome = isPositive
      ? (lang === 'en' 
          ? `Rent covers the mortgage with ${fmt(Math.abs(rentVsPayment))} monthly surplus ✅` 
          : `La renta cubre la hipoteca con ${fmt(Math.abs(rentVsPayment))} de excedente mensual ✅`)
      : (lang === 'en'
          ? `Monthly gap of ${fmt(Math.abs(rentVsPayment))} to cover ⚠️`
          : `Diferencia mensual de ${fmt(Math.abs(rentVsPayment))} por cubrir ⚠️`);
    
    mortgageImpactSection = lang === 'en'
      ? `🏦 MORTGAGE ANALYSIS
With ${mortgageInputs.financingPercent}% financing (loan amount: ${fmt(mortgageAnalysis.loanAmount)}):
• Monthly mortgage payment: ${fmt(mortgageAnalysis.monthlyPayment)}
• Expected monthly rent: ${fmt(monthlyRent)}
• ${outcome}`
      : `🏦 ANÁLISIS DE HIPOTECA
Con ${mortgageInputs.financingPercent}% de financiamiento (monto del préstamo: ${fmt(mortgageAnalysis.loanAmount)}):
• Pago mensual de hipoteca: ${fmt(mortgageAnalysis.monthlyPayment)}
• Renta mensual esperada: ${fmt(monthlyRent)}
• ${outcome}`;
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
