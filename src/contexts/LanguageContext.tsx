import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es';

interface Translations {
  [key: string]: {
    en: string;
    es: string;
  };
}

const translations: Translations = {
  // Header
  opportunityInvestorAnalysis: { en: 'Opportunity Investor Analysis', es: 'Análisis de Inversionista de Oportunidad' },
  exitScenariosPaymentBreakdown: { en: 'Exit scenarios & payment breakdown', es: 'Escenarios de salida y desglose de pagos' },
  
  // Client Info
  clientUnitInfo: { en: 'Client & Unit Information', es: 'Información del Cliente y Unidad' },
  clientDetails: { en: 'Client Details', es: 'Datos del Cliente' },
  developer: { en: 'Developer', es: 'Desarrollador' },
  clientName: { en: 'Client Name', es: 'Nombre del Cliente' },
  client: { en: 'Client', es: 'Cliente' },
  clientCountry: { en: 'Client Country', es: 'País del Cliente' },
  country: { en: 'Country', es: 'País' },
  advisorName: { en: 'Advisor Name', es: 'Nombre del Asesor' },
  advisor: { en: 'Advisor', es: 'Asesor' },
  unit: { en: 'Unit', es: 'Unidad' },
  unitSize: { en: 'Unit Size (sqf)', es: 'Tamaño (sqf)' },
  unitSizeSqf: { en: 'Size (sqf)', es: 'Tamaño (sqf)' },
  unitSizeM2: { en: 'Size (m²)', es: 'Tamaño (m²)' },
  size: { en: 'Size', es: 'Tamaño' },
  unitType: { en: 'Unit Type', es: 'Tipo de Unidad' },
  purchasePrice: { en: 'Purchase Price', es: 'Precio de Compra' },
  clickToAddClientInfo: { en: 'Click to add client & unit information', es: 'Clic para agregar información del cliente y unidad' },
  save: { en: 'Save', es: 'Guardar' },
  zone: { en: 'Zone', es: 'Zona' },
  selectZone: { en: 'Select zone...', es: 'Seleccionar zona...' },
  noZones: { en: 'No zones available', es: 'No hay zonas disponibles' },
  searchQuotes: { en: 'Search quotes...', es: 'Buscar cotizaciones...' },
  pricePerSqft: { en: 'Price/sqft', es: 'Precio/sqft' },
  
  // Month names for configurator
  january: { en: 'January', es: 'Enero' },
  february: { en: 'February', es: 'Febrero' },
  march: { en: 'March', es: 'Marzo' },
  april: { en: 'April', es: 'Abril' },
  may: { en: 'May', es: 'Mayo' },
  june: { en: 'June', es: 'Junio' },
  july: { en: 'July', es: 'Julio' },
  august: { en: 'August', es: 'Agosto' },
  september: { en: 'September', es: 'Septiembre' },
  october: { en: 'October', es: 'Octubre' },
  november: { en: 'November', es: 'Noviembre' },
  december: { en: 'December', es: 'Diciembre' },
  
  // Configurator sections (additional translations)
  bookingDateOI: { en: 'Booking Date (OI Entry)', es: 'Fecha de Reserva (Entrada OI)' },
  handoverDateLabel: { en: 'Handover Date', es: 'Fecha de Entrega' },
  paymentPlanLabel: { en: 'Payment Plan', es: 'Plan de Pago' },
  downpaymentLabel: { en: 'DOWNPAYMENT (Booking - Month 0)', es: 'ENGANCHE (Reserva - Mes 0)' },
  autoGeneratePayments: { en: 'Auto-Generate Payments', es: 'Generar Pagos Automáticamente' },
  numberOfPayments: { en: 'Number of Payments', es: 'Número de Pagos' },
  intervalMonths: { en: 'Interval (months)', es: 'Intervalo (meses)' },
  generatePayments: { en: 'Generate Payments', es: 'Generar Pagos' },
  additionalPayments: { en: 'Additional Payments (Pre-Handover)', es: 'Pagos Adicionales (Pre-Entrega)' },
  handoverPaymentLabel: { en: 'HANDOVER (100% Construction)', es: 'ENTREGA (100% Construcción)' },
  minimumExitThresholdLabel: { en: 'Minimum Exit Threshold', es: 'Umbral Mínimo de Salida' },
  rentalStrategy: { en: 'Rental Strategy', es: 'Estrategia de Renta' },
  longTermRentalLabel: { en: 'Long-Term Rental', es: 'Renta a Largo Plazo' },
  rentalYieldPercent: { en: 'Rental Yield %', es: 'Rendimiento de Renta %' },
  estimatedAnnualRentLabel: { en: 'Est. Annual Rent', es: 'Renta Anual Est.' },
  compareWithAirbnb: { en: 'Compare with Airbnb', es: 'Comparar con Airbnb' },
  zoneAppreciation: { en: 'Zone & Appreciation', es: 'Zona y Apreciación' },
  appreciationSettings: { en: 'Appreciation Settings', es: 'Configuración de Apreciación' },
  useZoneDefaults: { en: 'Use zone defaults', es: 'Usar valores de zona' },
  customAppreciation: { en: 'Custom appreciation', es: 'Apreciación personalizada' },
  resetToDefaults: { en: 'Reset to Defaults', es: 'Restablecer Valores' },
  handoverMustBeAfterBooking: { en: 'Handover date must be after booking date', es: 'Fecha de entrega debe ser después de la fecha de reserva' },
  eoiPartOfThis: { en: 'EOI is part of this', es: 'EOI es parte de esto' },
  remainingLabel: { en: 'remaining', es: 'restante' },
  exceededLabel: { en: 'exceeded', es: 'excedido' },
  distributed: { en: 'Distributed', es: 'Distribuido' },
  addPaymentBtn: { en: 'Add Payment', es: 'Agregar Pago' },
  timeLabel: { en: 'Time', es: 'Tiempo' },
  constructionLabelShort: { en: 'Const.', es: 'Const.' },
  automatic: { en: 'Automatic', es: 'Automático' },
  
  // Unit Types
  studio: { en: 'Studio', es: 'Estudio' },
  oneBed: { en: '1 Bedroom', es: '1 Habitación' },
  twoBed: { en: '2 Bedrooms', es: '2 Habitaciones' },
  threeBed: { en: '3 Bedrooms', es: '3 Habitaciones' },
  fourBed: { en: '4 Bedrooms', es: '4 Habitaciones' },
  penthouse: { en: 'Penthouse', es: 'Penthouse' },
  
  // Investment Summary
  investmentSummary: { en: 'Investment Summary', es: 'Resumen de Inversión' },
  basePropertyPrice: { en: 'Base Property Price', es: 'Precio Base de Propiedad' },
  paymentPlan: { en: 'Payment Plan', es: 'Plan de Pago' },
  downpayment: { en: 'Downpayment', es: 'Enganche' },
  additional: { en: 'additional', es: 'adicionales' },
  constructionPeriod: { en: 'Construction Period', es: 'Período de Construcción' },
  appreciationRate: { en: 'Appreciation Rate (CAGR)', es: 'Tasa de Apreciación (CAGR)' },
  rentalYield: { en: 'Rental Yield', es: 'Rendimiento de Renta' },
  minimumExitThreshold: { en: 'Min Exit Threshold', es: 'Umbral Mín de Salida' },
  totalEntryCosts: { en: 'Total Entry Costs', es: 'Costos Totales de Entrada' },
  bestROE: { en: 'Best ROE', es: 'Mejor ROE' },
  profit: { en: 'Profit', es: 'Ganancia' },
  capital: { en: 'Capital', es: 'Capital' },
  atHandover: { en: 'At Handover', es: 'En Entrega' },
  
  // Hold Analysis
  ifYouHoldAfterHandover: { en: 'If You HOLD After Handover', es: 'Si MANTIENE Después de Entrega' },
  totalCapitalInvested: { en: 'Total Capital Invested', es: 'Capital Total Invertido' },
  valueAtHandover: { en: 'Value at Handover', es: 'Valor en Entrega' },
  annualRentEst: { en: 'Annual Rent (Est.)', es: 'Renta Anual (Est.)' },
  rentalYieldOnInvestment: { en: 'Rental Yield on Investment', es: 'Rendimiento de Renta sobre Inversión' },
  yearsToBreakEven: { en: 'Years to Break Even', es: 'Años para Recuperar' },
  holdingMeansFullPayment: { en: 'Holding means full property payment + rental income', es: 'Mantener significa pago completo + ingresos de renta' },
  
  // Navigation
  fullROICalculator: { en: 'Full ROI Calculator (OI → SI → HO)', es: 'Calculadora ROI Completa (OI → SI → HO)' },
  
  // Modal
  configure: { en: 'Configure', es: 'Configurar' },
  oiInvestmentParameters: { en: 'OI Investment Parameters', es: 'Parámetros de Inversión OI' },
  bookingDate: { en: 'Booking Date (OI Entry)', es: 'Fecha de Reserva (Entrada OI)' },
  handoverDate: { en: 'Handover Date', es: 'Fecha de Entrega' },
  entryCostsAtBooking: { en: 'Entry Costs (At Booking)', es: 'Costos de Entrada (En Reserva)' },
  eoiBookingFee: { en: 'EOI / Booking Fee', es: 'EOI / Cuota de Reserva' },
  dldFeeFixed: { en: 'DLD Fee (fixed)', es: 'Tarifa DLD (fija)' },
  oqoodFee: { en: 'Oqood Fee', es: 'Tarifa Oqood' },
  minExitThresholdDesc: { en: '% of price developer requires paid before allowing resale', es: '% del precio que el developer exige haber pagado para permitir reventa' },
  preHandoverSplit: { en: 'Pre-Handover / Handover Split', es: 'División Pre-Entrega / Entrega' },
  eoiIsPartOfThis: { en: 'EOI is part of this', es: 'EOI es parte de esto' },
  addPayment: { en: 'Add Payment', es: 'Agregar Pago' },
  timeBasedMonth: { en: 'Time-based (Month)', es: 'Basado en Tiempo (Mes)' },
  constructionBased: { en: 'Construction %', es: 'Construcción %' },
  handoverPaymentAuto: { en: 'Handover Payment (Automatic)', es: 'Pago de Entrega (Automático)' },
  atHandoverDate: { en: 'At handover date', es: 'En fecha de entrega' },
  financialMetrics: { en: 'Financial Metrics', es: 'Métricas Financieras' },
  applyParameters: { en: 'Apply Parameters', es: 'Aplicar Parámetros' },
  
  // Validation
  preHandoverMustEqual: { en: 'Pre-handover payments must equal', es: 'Pagos pre-entrega deben ser igual a' },
  youNeedToAdd: { en: 'You need to add', es: 'Necesita agregar' },
  moreViaAdditional: { en: 'more via additional payments', es: 'más vía pagos adicionales' },
  validPreHandover: { en: 'Valid pre-handover distribution', es: 'Distribución pre-entrega válida' },
  
  // Select placeholders
  selectCountry: { en: 'Select country', es: 'Seleccionar país' },
  selectType: { en: 'Select type', es: 'Seleccionar tipo' },
  
  // New fields
  projectName: { en: 'Project Name', es: 'Nombre del Proyecto' },
  accountSettings: { en: 'Account Settings', es: 'Configuración de Cuenta' },
  myQuotes: { en: 'My Quotes', es: 'Mis Cotizaciones' },
  newQuote: { en: 'New Quote', es: 'Nueva Cotización' },
  wealthAdvisor: { en: 'Wealth Advisor', es: 'Asesor de Patrimonio' },
  clients: { en: 'Clients', es: 'Clientes' },
  addClient: { en: 'Add Client', es: 'Agregar Cliente' },
  cashflowStatement: { en: 'Cashflow Generator', es: 'Generador de Cashflow' },
  investmentSnapshot: { en: 'Investment Snapshot', es: 'Resumen de Inversión' },
  amountUntilSPA: { en: 'At Booking (SPA)', es: 'En Reserva (SPA)' },
  amountDuringConstruction: { en: 'During Construction', es: 'Durante Construcción' },
  amountAtHandover: { en: 'At Handover', es: 'En Entrega' },
  yearsToPayOff: { en: 'Years to Pay Off', es: 'Años para Recuperar' },
  longTermRental: { en: 'Long-Term Rental', es: 'Renta a Largo Plazo' },
  basedOnNetRentalIncome: { en: 'Based on net rental income', es: 'Basado en renta neta' },
  
  // Rent Snapshot
  rentSnapshot: { en: 'Rent Snapshot', es: 'Resumen de Renta' },
  estimatedAnnualRent: { en: 'Est. Annual Rent (Y1)', es: 'Renta Anual Est. (A1)' },
  rentGrowth: { en: 'Rent Growth', es: 'Crecimiento Renta' },
  serviceCharges: { en: 'Service Charges', es: 'Cargos de Servicio' },
  netAnnualRent: { en: 'Net Annual Rent', es: 'Renta Anual Neta' },
  airbnbComparison: { en: 'Airbnb Comparison', es: 'Comparación Airbnb' },
  averageDailyRate: { en: 'Average Daily Rate', es: 'Tarifa Diaria Promedio' },
  occupancy: { en: 'Occupancy', es: 'Ocupación' },
  adrGrowth: { en: 'ADR Growth', es: 'Crecimiento ADR' },
  grossAnnual: { en: 'Gross Annual', es: 'Bruto Anual' },
  operatingExpenses: { en: 'Operating Expenses', es: 'Gastos Operativos' },
  managementFee: { en: 'Management Fee', es: 'Comisión de Gestión' },
  netAnnual: { en: 'Net Annual', es: 'Neto Anual' },
  longTermOnly: { en: 'Long-Term Only', es: 'Solo Largo Plazo' },
  ltPlusAirbnb: { en: 'LT + Airbnb', es: 'LP + Airbnb' },
  incomeComparison: { en: 'Income Comparison', es: 'Comparación de Ingresos' },
  longTerm: { en: 'Long-Term', es: 'Largo Plazo' },
  vsLongTerm: { en: 'vs Long-Term', es: 'vs Largo Plazo' },
  year: { en: 'year', es: 'año' },
  totalExpenses: { en: 'Total Expenses', es: 'Gastos Totales' },
  grossAnnualRent: { en: 'Gross Annual Rent', es: 'Renta Bruta Anual' },
  grossYield: { en: 'Gross Yield', es: 'Rendimiento Bruto' },
  netYieldAfterCharges: { en: 'Net Yield (after charges)', es: 'Rendimiento Neto (después de cargos)' },
  basedOnPropertyValueAtHandover: { en: 'Based on property value at handover', es: 'Basado en valor de propiedad en entrega' },
  basedOnPurchasePrice: { en: 'Based on purchase price', es: 'Basado en precio de compra' },
  
  // Section Headers
  exitStrategyAnalysis: { en: 'Exit Strategy Analysis', es: 'Análisis de Estrategia de Salida' },
  whenToSell: { en: 'When to sell for maximum returns', es: 'Cuándo vender para máximos retornos' },
  holdStrategyAnalysis: { en: 'Hold Strategy Analysis', es: 'Análisis de Estrategia de Retención' },
  holdStrategySubtitle: { en: 'Long-term rental projections and wealth accumulation', es: 'Proyecciones de renta a largo plazo y acumulación de riqueza' },
  longTermHoldAnalysis: { en: 'Long-Term Hold Analysis', es: 'Análisis de Retención a Largo Plazo' },
  tenYearProjection: { en: '10-year rental income projection', es: 'Proyección de ingresos por renta a 10 años' },
  
  // Cumulative Chart
  cumulativeNetIncome: { en: 'Cumulative Net Income', es: 'Ingreso Neto Acumulado' },
  underConstruction: { en: 'Under Construction', es: 'En Construcción' },
  breakEven: { en: 'Break-Even', es: 'Punto de Equilibrio' },
  
  // Wealth Summary
  wealthCreated10Years: { en: 'Wealth Created (10 Years)', es: 'Riqueza Generada (10 Años)' },
  propertyValueYear10: { en: 'Property Value (Y10)', es: 'Valor de Propiedad (A10)' },
  cumulativeRentLT: { en: 'Cumulative Rent (LT)', es: 'Renta Acumulada (LP)' },
  cumulativeRentAirbnb: { en: 'Cumulative Rent (Airbnb)', es: 'Renta Acumulada (Airbnb)' },
  initialInvestment: { en: 'Initial Investment', es: 'Inversión Inicial' },
  netWealthLT: { en: 'Net Wealth (Long-Term)', es: 'Riqueza Neta (Largo Plazo)' },
  netWealthAirbnb: { en: 'Net Wealth (Airbnb)', es: 'Riqueza Neta (Airbnb)' },
  
  // Visibility Controls
  share: { en: 'Share', es: 'Compartir' },
  customizeClientView: { en: 'Customize Client View', es: 'Personalizar Vista del Cliente' },
  selectSectionsToShow: { en: 'Select which sections to show in the shared link', es: 'Selecciona qué secciones mostrar en el enlace compartido' },
  generateLink: { en: 'Generate Link', es: 'Generar Enlace' },
  linkCopied: { en: 'Link copied to clipboard!', es: '¡Enlace copiado al portapapeles!' },
  exportPDF: { en: 'Export PDF', es: 'Exportar PDF' },
  pdfExported: { en: 'PDF generated successfully!', es: '¡PDF generado con éxito!' },
  paymentBreakdown: { en: 'Payment Breakdown', es: 'Desglose de Pagos' },
  quotes: { en: 'Quotes', es: 'Cotizaciones' },
  viewAllQuotes: { en: 'View All Quotes', es: 'Ver Todas las Cotizaciones' },
  profileSettings: { en: 'Profile Settings', es: 'Configuración de Perfil' },
  settings: { en: 'Settings', es: 'Configuración' },
  
  // New translations for Load Quote, Language/Currency, Contact
  loadQuote: { en: 'Load Quote', es: 'Cargar Cotización' },
  selectQuote: { en: 'Select a quote to load', es: 'Selecciona una cotización para cargar' },
  noQuotesFound: { en: 'No quotes found', es: 'No se encontraron cotizaciones' },
  draft: { en: 'Draft', es: 'Borrador' },
  currency: { en: 'Currency', es: 'Moneda' },
  language: { en: 'Language', es: 'Idioma' },
  emailAdvisor: { en: 'Email Advisor', es: 'Enviar Correo' },
  messageOnWhatsApp: { en: 'Message on WhatsApp', es: 'Mensaje por WhatsApp' },
  businessEmail: { en: 'Business Email', es: 'Correo Empresarial' },
  whatsappNumber: { en: 'WhatsApp Number', es: 'Número de WhatsApp' },
  
  // Account Settings
  fullName: { en: 'Full Name', es: 'Nombre Completo' },
  saveChanges: { en: 'Save Changes', es: 'Guardar Cambios' },
  signOut: { en: 'Sign Out', es: 'Cerrar Sesión' },
  
  // Pro-rata month indicator
  months: { en: 'months', es: 'meses' },
  mo: { en: 'mo', es: 'mes' },
  
  // Payment Breakdown Section
  paymentBreakdownTitle: { en: 'PAYMENT BREAKDOWN', es: 'DESGLOSE DE PAGOS' },
  paymentStructure: { en: 'payment structure', es: 'estructura de pago' },
  atBooking: { en: 'AT BOOKING', es: 'EN RESERVA' },
  restOfDownpayment: { en: 'Rest of Downpayment', es: 'Resto de Enganche' },
  dldFeePercent: { en: 'DLD Fee (4%)', es: 'Tarifa DLD (4%)' },
  totalToday: { en: 'Total Today', es: 'Total Hoy' },
  duringConstruction: { en: 'DURING CONSTRUCTION', es: 'DURANTE CONSTRUCCIÓN' },
  constructionPercent: { en: 'const.', es: 'const.' },
  monthLabel: { en: 'Month', es: 'Mes' },
  subtotalInstallments: { en: 'Subtotal Installments', es: 'Subtotal Cuotas' },
  plusInstallments: { en: '+ Installments', es: '+ Cuotas' },
  totalPreHandover: { en: 'TOTAL PRE-HANDOVER', es: 'TOTAL PRE-ENTREGA' },
  atHandoverLabel: { en: 'AT HANDOVER', es: 'EN ENTREGA' },
  finalPayment: { en: 'Final Payment', es: 'Pago Final' },
  propertyPayments: { en: 'Property Payments', es: 'Pagos de Propiedad' },
  entryCostsDldOqood: { en: 'Entry Costs (DLD + Oqood)', es: 'Costos de Entrada (DLD + Oqood)' },
  totalToDisburse: { en: 'TOTAL TO DISBURSE', es: 'TOTAL A DESEMBOLSAR' },
  
  // OI Yearly Projection Table
  tenYearHoldSimulation: { en: '10-Year Hold Simulation', es: 'Simulación de Retención a 10 Años' },
  propertyValueRentalYield: { en: 'Property value, rental income & yield compression', es: 'Valor de propiedad, ingresos por renta y compresión de rendimiento' },
  yearColumn: { en: 'Year', es: 'Año' },
  phase: { en: 'Phase', es: 'Fase' },
  value: { en: 'Value', es: 'Valor' },
  netRent: { en: 'Net Rent', es: 'Renta Neta' },
  airbnbNet: { en: 'Airbnb Net', es: 'Neto Airbnb' },
  status: { en: 'Status', es: 'Estado' },
  difference: { en: 'Difference', es: 'Diferencia' },
  airbnbWins: { en: 'Airbnb wins', es: 'Airbnb gana' },
  longTermWins: { en: 'Long-Term wins', es: 'Largo Plazo gana' },
  longTermTenYear: { en: 'Long-Term (10Y)', es: 'Largo Plazo (10A)' },
  airbnbTenYear: { en: 'Airbnb (10Y)', es: 'Airbnb (10A)' },
  build: { en: 'Build', es: 'Construcción' },
  handover: { en: 'Handover', es: 'Entrega' },
  growth: { en: 'Growth', es: 'Crecimiento' },
  mature: { en: 'Mature', es: 'Maduro' },
  totalNetIncome10Y: { en: 'Total Net Income (10Y)', es: 'Ingreso Neto Total (10A)' },
  ltLabel: { en: 'LT:', es: 'LP:' },
  airbnbLabel: { en: 'Airbnb:', es: 'Airbnb:' },
  
  // Exit Scenarios Cards
  exitScenarios: { en: 'Exit Scenarios', es: 'Escenarios de Salida' },
  scenario: { en: 'scenario', es: 'escenario' },
  scenarios: { en: 'scenarios', es: 'escenarios' },
  clickToEdit: { en: 'Click to edit', es: 'Clic para editar' },
  addExit: { en: 'Add Exit', es: 'Agregar Salida' },
  exitNumber: { en: 'Exit #', es: 'Salida #' },
  construction: { en: 'construction', es: 'construcción' },
  exitAfter: { en: 'Exit after:', es: 'Salir después de:' },
  original: { en: 'Original', es: 'Original' },
  payments: { en: 'Payments', es: 'Pagos' },
  plusEntryCosts: { en: '+ Entry Costs', es: '+ Costos de Entrada' },
  totalCapitalEquals: { en: '= Total Capital', es: '= Capital Total' },
  exitPrice: { en: 'Exit Price', es: 'Precio de Salida' },
  roe: { en: 'ROE', es: 'ROE' },
  annualized: { en: 'annualized', es: 'anualizado' },
  
  // Error messages
  quoteNotFound: { en: 'Quote Not Found', es: 'Cotización No Encontrada' },
  quoteNotFoundDesc: { en: 'This quote may have been deleted or the link is invalid.', es: 'Esta cotización puede haber sido eliminada o el enlace es inválido.' },
  invalidShareLink: { en: 'Invalid share link', es: 'Enlace compartido inválido' },
  quoteDeletedOrNotFound: { en: 'Quote not found or has been deleted', es: 'Cotización no encontrada o fue eliminada' },
  
  // Disclaimer
  disclaimerText: { en: 'This cashflow statement is for informational purposes only and does not constitute financial advice.', es: 'Este estado de flujo de efectivo es solo para fines informativos y no constituye asesoramiento financiero.' },
  
  // Payment Split By Person
  paymentSplitByPerson: { en: 'PAYMENT SPLIT BY PERSON', es: 'DIVISIÓN DE PAGOS POR PERSONA' },
  individualContributionBreakdown: { en: 'Individual contribution breakdown', es: 'Desglose de contribución individual' },
  shareLabel: { en: 'share', es: 'participación' },
  totalContribution: { en: 'Total contribution', es: 'Contribución total' },
  todayTotal: { en: 'Today Total', es: 'Total Hoy' },
  installmentsTotal: { en: 'Installments Total', es: 'Total Cuotas' },
  dldFee: { en: 'DLD Fee', es: 'Tarifa DLD' },
  atBookingLabel: { en: 'At Booking', es: 'En Reserva' },
  atHandoverUpper: { en: 'AT HANDOVER', es: 'EN ENTREGA' },
  duringConstructionLabel: { en: 'During Construction', es: 'Durante Construcción' },
  totalContributionUpper: { en: 'TOTAL CONTRIBUTION', es: 'CONTRIBUCIÓN TOTAL' },
  preHandoverTotal: { en: 'PRE-HANDOVER TOTAL', es: 'TOTAL PRE-ENTREGA' },
  amountNeededToResell: { en: 'Amount needed to resell', es: 'Monto para revender' },
  
  // Tooltip translations - Property & Dates
  tooltipBasePrice: { en: 'The purchase price before any fees or additional costs', es: 'El precio de compra antes de tarifas o costos adicionales' },
  tooltipBookingDate: { en: 'When you sign the SPA and make initial payments', es: 'Cuando firma el SPA y realiza los pagos iniciales' },
  tooltipHandoverDate: { en: 'Estimated date when keys are delivered and property is ready', es: 'Fecha estimada cuando se entregan las llaves' },
  
  // Tooltip translations - Entry Costs
  tooltipEoiFee: { en: 'Expression of Interest - refundable deposit deducted from downpayment', es: 'Expresión de Interés - depósito reembolsable descontado del enganche' },
  tooltipDldFee: { en: 'Dubai Land Department transfer fee - fixed at 4% of property price', es: 'Tarifa del Departamento de Tierras de Dubai - fija al 4% del precio' },
  tooltipOqoodFee: { en: 'Registration fee for off-plan properties in RERA', es: 'Tarifa de registro para propiedades en planos en RERA' },
  
  // Tooltip translations - Payment Plan
  tooltipPreHandover: { en: 'Total percentage to be paid before receiving keys', es: 'Porcentaje total a pagar antes de recibir las llaves' },
  tooltipDownpayment: { en: 'Initial payment made at booking, includes EOI', es: 'Pago inicial realizado en la reserva, incluye EOI' },
  tooltipMinExitThreshold: { en: 'Minimum % of property price that must be paid before the developer allows resale', es: '% mínimo del precio que debe pagarse antes de que el desarrollador permita reventa' },
  
  // Tooltip translations - Appreciation & Zone
  tooltipZoneMaturity: { en: 'Market maturity affects growth rates. Emerging areas have higher growth potential, established areas offer stability', es: 'La madurez del mercado afecta las tasas de crecimiento. Áreas emergentes tienen mayor potencial, áreas establecidas ofrecen estabilidad' },
  tooltipConstructionAppreciation: { en: 'Annual price growth during the construction/build phase (off-plan premium)', es: 'Crecimiento anual del precio durante la construcción (prima de pre-venta)' },
  tooltipGrowthAppreciation: { en: 'Annual appreciation rate during the initial years after handover', es: 'Tasa de apreciación anual durante los primeros años después de la entrega' },
  tooltipMatureAppreciation: { en: 'Long-term stable appreciation rate once the area is fully developed', es: 'Tasa de apreciación estable a largo plazo cuando el área está desarrollada' },
  tooltipGrowthYears: { en: 'Number of years the area continues high growth after handover before stabilizing', es: 'Número de años de alto crecimiento después de la entrega antes de estabilizarse' },
  
  // Tooltip translations - Rental Settings
  tooltipRentalYield: { en: 'Annual rental income as a percentage of property value (net after vacancy)', es: 'Ingreso anual por renta como porcentaje del valor de la propiedad (neto)' },
  tooltipServiceCharge: { en: 'Annual maintenance and management fee charged per square foot', es: 'Tarifa anual de mantenimiento por pie cuadrado' },
  tooltipRentGrowth: { en: 'Expected annual increase in long-term rental rates', es: 'Aumento anual esperado en tarifas de renta a largo plazo' },
  tooltipAdrGrowth: { en: 'Expected annual increase in Airbnb average daily rate', es: 'Aumento anual esperado en tarifa diaria promedio de Airbnb' },
  
  // Tooltip translations - Exit Scenarios
  tooltipRoe: { en: 'Return on Equity = Profit ÷ Total Capital Deployed. Shows efficiency of your invested money', es: 'Retorno sobre Capital = Ganancia ÷ Capital Total. Muestra eficiencia de tu inversión' },
  tooltipExitPrice: { en: 'Property value at exit, calculated using phased appreciation rates based on zone maturity', es: 'Valor de la propiedad al salir, calculado usando tasas de apreciación por fases' },
  tooltipEntryCosts: { en: 'Total upfront costs: EOI + DLD (4%) + OQOOD + any other transaction fees', es: 'Costos totales iniciales: EOI + DLD (4%) + OQOOD + otras tarifas de transacción' },
  tooltipAnnualizedRoe: { en: 'ROE adjusted to an annual rate for fair comparison across different exit timelines', es: 'ROE ajustado a tasa anual para comparación justa entre diferentes plazos de salida' },
  tooltipTotalCapital: { en: 'Total money deployed = Property payments made + Entry costs', es: 'Dinero total desplegado = Pagos de propiedad + Costos de entrada' },
  
  // Advisor Onboarding translations
  onboardingWelcome: { en: 'Welcome to the Cashflow Generator', es: 'Bienvenido al Generador de Cashflow' },
  onboardingStep1Title: { en: 'Configure Your Property', es: 'Configura Tu Propiedad' },
  onboardingStep1Desc: { en: 'Set the base price, booking date, and expected handover date', es: 'Establece el precio base, fecha de reserva y fecha de entrega' },
  onboardingStep2Title: { en: 'Set Up Payment Plan', es: 'Configura el Plan de Pago' },
  onboardingStep2Desc: { en: 'Define downpayment, milestone payments, and handover percentage', es: 'Define enganche, pagos de hitos y porcentaje de entrega' },
  onboardingStep3Title: { en: 'Customize Appreciation', es: 'Personaliza la Apreciación' },
  onboardingStep3Desc: { en: 'Select a zone or manually set appreciation rates for each phase', es: 'Selecciona una zona o establece manualmente las tasas de apreciación' },
  onboardingStep4Title: { en: 'Explore Exit Strategies', es: 'Explora Estrategias de Salida' },
  onboardingStep4Desc: { en: 'Analyze different exit timelines and save your quote', es: 'Analiza diferentes plazos de salida y guarda tu cotización' },
  
  // Client Onboarding translations
  clientOnboardingWelcome: { en: 'Your Investment Analysis', es: 'Tu Análisis de Inversión' },
  clientOnboardingStep1Title: { en: 'Your Investment Analysis', es: 'Tu Análisis de Inversión' },
  clientOnboardingStep1Desc: { en: 'This is a personalized cashflow projection for your property investment', es: 'Esta es una proyección de flujo de caja personalizada para tu inversión inmobiliaria' },
  clientOnboardingStep2Title: { en: 'Payment Timeline', es: 'Cronograma de Pagos' },
  clientOnboardingStep2Desc: { en: 'See when and how much you will pay during construction and at handover', es: 'Ve cuándo y cuánto pagarás durante la construcción y en la entrega' },
  clientOnboardingStep3Title: { en: 'Hold & Rent Strategy', es: 'Estrategia de Retención y Renta' },
  clientOnboardingStep3Desc: { en: 'Explore rental income potential if you keep the property long-term', es: 'Explora el potencial de ingresos por renta si mantienes la propiedad a largo plazo' },
  clientOnboardingStep4Title: { en: 'Exit Opportunities', es: 'Oportunidades de Salida' },
  clientOnboardingStep4Desc: { en: 'Analyze the best time to sell and maximize your returns', es: 'Analiza el mejor momento para vender y maximiza tus retornos' },
  clientOnboardingStep5Title: { en: 'Ready to Invest?', es: '¿Listo para Invertir?' },
  clientOnboardingStep5Desc: { en: 'Contact {advisor} to discuss next steps', es: 'Contacta a {advisor} para discutir los próximos pasos' },
  
  // General onboarding/help labels
  getStarted: { en: 'Get Started', es: 'Comenzar' },
  skipOnboarding: { en: 'Skip', es: 'Omitir' },
  dontShowAgain: { en: "Don't show again", es: 'No mostrar de nuevo' },
  needHelp: { en: 'Need Help?', es: '¿Necesita Ayuda?' },
  helpResources: { en: 'Help Resources', es: 'Recursos de Ayuda' },
  quickStartGuide: { en: 'Quick Start Guide', es: 'Guía de Inicio Rápido' },
  back: { en: 'Back', es: 'Atrás' },
  next: { en: 'Next', es: 'Siguiente' },
  contactAdvisor: { en: 'Contact Advisor', es: 'Contactar Asesor' },
  showGuide: { en: 'Show Guide', es: 'Mostrar Guía' },
  
  // Client View - Additional Tooltips
  tooltipGrossRent: { en: 'Annual rental income before deducting any expenses like service charges', es: 'Ingreso anual por renta antes de descontar gastos como cargos de servicio' },
  tooltipNetRent: { en: 'Rental income after deducting service charges and maintenance costs', es: 'Ingreso por renta después de descontar cargos de servicio y mantenimiento' },
  tooltipYearsToPayOff: { en: 'Number of years of net rental income needed to recover your total investment', es: 'Años de ingreso neto por renta necesarios para recuperar tu inversión total' },
  tooltipPropertyValue10Y: { en: 'Projected property value after 10 years of appreciation', es: 'Valor proyectado de la propiedad después de 10 años de apreciación' },
  tooltipCumulativeRent: { en: 'Total net rental income accumulated over the entire holding period', es: 'Ingreso neto total por renta acumulado durante todo el período de retención' },
  tooltipNetWealth: { en: 'Property value + Total rental income - Initial investment = Your total wealth created', es: 'Valor de propiedad + Ingresos por renta - Inversión inicial = Riqueza total creada' },
  tooltipPaymentPlan: { en: 'Split between pre-handover and handover payments (e.g., 30/70 means 30% before keys, 70% at handover)', es: 'División entre pagos pre-entrega y entrega (ej., 30/70 significa 30% antes de llaves, 70% en entrega)' },
  tooltipFinalPayment: { en: 'The remaining balance due when you receive the keys to your property', es: 'El saldo restante a pagar cuando reciba las llaves de su propiedad' },
  tooltipGrossYield: { en: 'Annual rent as a percentage of property price, before expenses', es: 'Renta anual como porcentaje del precio de la propiedad, antes de gastos' },
  tooltipNetYield: { en: 'Annual rent as a percentage of property price, after deducting expenses', es: 'Renta anual como porcentaje del precio de la propiedad, después de descontar gastos' },
  tooltipConstructionPeriod: { en: 'Time from booking to receiving the keys (handover)', es: 'Tiempo desde la reserva hasta recibir las llaves (entrega)' },
  
  // Appreciation Presets
  appreciationPresets: { en: 'Appreciation Presets', es: 'Preajustes de Apreciación' },
  loadPreset: { en: 'Load Preset', es: 'Cargar Preajuste' },
  saveAsPreset: { en: 'Save as Preset', es: 'Guardar como Preajuste' },
  presetName: { en: 'Preset Name', es: 'Nombre del Preajuste' },
  deletePreset: { en: 'Delete Preset', es: 'Eliminar Preajuste' },
  noPresets: { en: 'No saved presets', es: 'Sin preajustes guardados' },
  selectPreset: { en: 'Select a preset...', es: 'Selecciona un preajuste...' },
  
  // Mortgage Calculator
  mortgage: { en: 'Mortgage', es: 'Hipoteca' },
  mortgageCalculator: { en: 'Mortgage Calculator', es: 'Calculadora de Hipoteca' },
  mortgageBreakdown: { en: 'Mortgage Breakdown', es: 'Desglose de Hipoteca' },
  enableMortgage: { en: 'Enable Mortgage', es: 'Habilitar Hipoteca' },
  enableMortgageDesc: { en: 'Add mortgage financing to your cashflow analysis', es: 'Agregar financiamiento hipotecario a tu análisis de flujo de caja' },
  financingPercent: { en: 'Financing Percentage', es: 'Porcentaje de Financiamiento' },
  financing: { en: 'Financing', es: 'Financiamiento' },
  loanTerm: { en: 'Loan Term', es: 'Plazo del Préstamo' },
  interestRate: { en: 'Interest Rate', es: 'Tasa de Interés' },
  years: { en: 'years', es: 'años' },
  mortgageFees: { en: 'Mortgage Fees', es: 'Gastos de Hipoteca' },
  processingFee: { en: 'Processing Fee', es: 'Comisión de Procesamiento' },
  valuationFee: { en: 'Valuation Fee', es: 'Comisión de Valuación' },
  mortgageRegistration: { en: 'Mortgage Registration', es: 'Registro de Hipoteca' },
  insurance: { en: 'Insurance', es: 'Seguro' },
  lifeInsurance: { en: 'Life Insurance', es: 'Seguro de Vida' },
  propertyInsurance: { en: 'Property Insurance', es: 'Seguro de Propiedad' },
  annual: { en: 'annual', es: 'anual' },
  gapRequired: { en: 'Gap Required', es: 'Brecha Requerida' },
  gapExplanation: { en: 'Your payment plan needs additional equity to qualify for this mortgage', es: 'Tu plan de pago necesita capital adicional para calificar para esta hipoteca' },
  gapToCover: { en: 'Gap to Cover', es: 'Brecha a Cubrir' },
  gapAmount: { en: 'Gap Amount', es: 'Monto de la Brecha' },
  loanSummary: { en: 'Loan Summary', es: 'Resumen del Préstamo' },
  loanAmount: { en: 'Loan Amount', es: 'Monto del Préstamo' },
  monthlyPayment: { en: 'Monthly Payment', es: 'Pago Mensual' },
  equityRequired: { en: 'Equity Required', es: 'Capital Requerido' },
  totalInterest: { en: 'Total Interest', es: 'Interés Total' },
  upfrontFees: { en: 'Upfront Fees', es: 'Gastos Iniciales' },
  total: { en: 'Total', es: 'Total' },
  totalAnnual: { en: 'Total Annual', es: 'Total Anual' },
  overTerm: { en: 'Over Term', es: 'Durante el Plazo' },
  yr: { en: 'yr', es: 'año' },
  totalCostSummary: { en: 'Total Cost Summary', es: 'Resumen de Costo Total' },
  totalLoanPayments: { en: 'Total Loan Payments', es: 'Pagos Totales del Préstamo' },
  totalInterestAndFees: { en: 'Total Interest & Fees', es: 'Total de Intereses y Gastos' },
  grandTotal: { en: 'Grand Total', es: 'Gran Total' },
  grandTotalExplanation: { en: 'Total cost including gap payment, loan payments, fees and insurance over the loan term', es: 'Costo total incluyendo pago de brecha, pagos del préstamo, gastos y seguros durante el plazo' },
  gapPayment: { en: 'Gap Payment', es: 'Pago de Brecha' },
  interestAndFees: { en: 'Interest & Fees', es: 'Intereses y Gastos' },
  rentVsMortgage: { en: 'Rent vs Mortgage Coverage', es: 'Renta vs Cobertura de Hipoteca' },
  monthlyRent: { en: 'Monthly Rent', es: 'Renta Mensual' },
  netMonthlyRent: { en: 'Net Monthly Rent', es: 'Renta Mensual Neta' },
  monthlyMortgageTotal: { en: 'Monthly Mortgage (+ Insurance)', es: 'Hipoteca Mensual (+ Seguro)' },
  monthlyCashflow: { en: 'Monthly Cashflow', es: 'Flujo de Caja Mensual' },
  airbnbNetMonthly: { en: 'Airbnb Net Monthly', es: 'Airbnb Neto Mensual' },
  airbnbCashflow: { en: 'Airbnb Cashflow', es: 'Flujo de Caja Airbnb' },
  mortgageAnalysis: { en: 'Mortgage Analysis', es: 'Análisis Hipotecario' },
  mortgageAnalysisSubtitle: { en: 'Loan structure, fees, and impact on cashflow', es: 'Estructura del préstamo, gastos e impacto en flujo de caja' },
  gapPaymentRequired: { en: 'Gap Payment Required', es: 'Pago de Brecha Requerido' },
  gapPaymentDesc: { en: 'Your pre-handover payments do not cover the required equity. Additional payment needed before handover.', es: 'Tus pagos pre-entrega no cubren el capital requerido. Se necesita pago adicional antes de la entrega.' },
  preHandoverPayments: { en: 'Pre-Handover Payments', es: 'Pagos Pre-Entrega' },
  gapPaymentBeforeHandover: { en: 'Gap Payment (Before Handover)', es: 'Pago de Brecha (Antes de Entrega)' },
  mortgageAtHandover: { en: 'Mortgage at Handover', es: 'Hipoteca en Entrega' },
  totalBeforeHandover: { en: 'Total Before Handover', es: 'Total Antes de Entrega' },
  netAfterMortgage: { en: 'Net After Mortgage', es: 'Neto Después de Hipoteca' },
  cashflow: { en: 'Cashflow', es: 'Flujo de Caja' },
  included: { en: 'included', es: 'incluido' },
  covers: { en: 'Covers', es: 'Cubre' },
  ofMortgage: { en: 'of mortgage', es: 'de hipoteca' },
  
  // Coverage Breakdown Popup & Tooltips
  longTermNetRentTooltip: { en: 'Gross monthly rent minus service charges', es: 'Renta bruta mensual menos cargos de servicio' },
  airbnbNetRentTooltip: { en: 'Gross Airbnb income minus operating expenses, management fees, and service charges', es: 'Ingreso bruto de Airbnb menos gastos operativos, comisiones de gestión y cargos de servicio' },
  coverageBreakdown: { en: 'Coverage Breakdown', es: 'Desglose de Cobertura' },
  grossMonthlyRent: { en: 'Gross Monthly Rent', es: 'Renta Mensual Bruta' },
  mortgagePayment: { en: 'Mortgage Payment', es: 'Pago de Hipoteca' },
  totalMortgage: { en: 'Total Mortgage', es: 'Total Hipoteca' },
  finalCashflow: { en: 'Final Cashflow', es: 'Flujo de Caja Final' },
  mortgageCovered: { en: 'of mortgage covered', es: 'de hipoteca cubierta' },
  clickForDetails: { en: 'Click for details', es: 'Clic para detalles' },
  
  // Year Comparison
  rentGrowthImpact: { en: 'Rent Growth Impact', es: 'Impacto del Crecimiento de Renta' },
  coverage: { en: 'coverage', es: 'cobertura' },
  rentIncrease: { en: 'Rent increase', es: 'Aumento de renta' },
  over5Years: { en: 'over 5 years', es: 'en 5 años' },
  year1: { en: 'Year 1', es: 'Año 1' },
  year5: { en: 'Year 5', es: 'Año 5' },
  
  // Monthly/Annual Toggle
  monthlyShort: { en: 'Mo', es: 'Mes' },
  annualShort: { en: 'Yr', es: 'Año' },
  
  // Validation messages
  completeClientInfo: { en: 'Complete Client Information', es: 'Completa la Información del Cliente' },
  completeClientInfoDesc: { en: 'Add developer, project, unit details and unit size to continue', es: 'Agrega desarrollador, proyecto, detalles de unidad y tamaño para continuar' },
  configurePropertyFinancials: { en: 'Configure Property Financials', es: 'Configura los Datos Financieros' },
  configurePropertyFinancialsDesc: { en: 'Set the base price and payment plan to generate projections', es: 'Establece el precio base y plan de pagos para generar proyecciones' },
  
  // Version History
  versionHistory: { en: 'Version History', es: 'Historial de Versiones' },
  restore: { en: 'Restore', es: 'Restaurar' },
  latestVersion: { en: 'Latest', es: 'Última' },
  noVersions: { en: 'No previous versions', es: 'Sin versiones anteriores' },
  versionsCreatedOnSave: { en: 'Versions are created each time you save', es: 'Las versiones se crean cada vez que guardas' },
  confirmRestore: { en: 'Restore this version?', es: '¿Restaurar esta versión?' },
  confirmRestoreDesc: { en: 'This will replace the current quote with the selected version. A new version will be saved with the current state before restoring.', es: 'Esto reemplazará la cotización actual con la versión seleccionada. Se guardará una nueva versión con el estado actual antes de restaurar.' },
  cancel: { en: 'Cancel', es: 'Cancelar' },
  versionRestored: { en: 'Version restored successfully', es: 'Versión restaurada exitosamente' },
  
  // Landing Page
  landingSignIn: { en: 'Sign In', es: 'Iniciar Sesión' },
  landingGetStarted: { en: 'Get Started', es: 'Comenzar' },
  landingMenu: { en: 'Menu', es: 'Menú' },
  landingPoweredByAI: { en: 'Powered by AI Intelligence', es: 'Impulsado por Inteligencia Artificial' },
  landingHeroTitle1: { en: 'The Future of', es: 'El Futuro de la' },
  landingHeroTitle2: { en: 'Real Estate Investment', es: 'Inversión Inmobiliaria' },
  landingHeroTitle3: { en: 'in Dubai', es: 'en Dubai' },
  landingHeroDescription: { 
    en: 'Next-generation investment analysis tools. Interactive maps, AI-powered ROI calculators, and professional cashflow generator — all in one platform.', 
    es: 'Herramientas de análisis de inversión de próxima generación. Mapas interactivos, calculadoras ROI con IA, y generador de cashflow profesional — todo en una plataforma.' 
  },
  landingAccessPlatform: { en: 'Access Platform', es: 'Acceder a la Plataforma' },
  landingViewDemo: { en: 'View Demo', es: 'Ver Demo' },
  landingProjectsMapped: { en: 'Projects Mapped', es: 'Proyectos Mapeados' },
  landingInvestmentZones: { en: 'Investment Zones', es: 'Zonas de Inversión' },
  landingSmartAnalysis: { en: 'Smart Analysis', es: 'Análisis Inteligente' },
  landingProfessionalTools: { en: 'Professional Tools', es: 'Herramientas Profesionales' },
  landingProfessionalToolsDesc: { en: 'Everything you need to make informed investment decisions in Dubai real estate market', es: 'Todo lo que necesitas para tomar decisiones de inversión informadas en el mercado inmobiliario de Dubai' },
  landingInteractiveMap: { en: 'Interactive Map', es: 'Mapa Interactivo' },
  landingInteractiveMapDesc: { 
    en: 'Explore investment zones, off-plan projects, landmarks and hotspots in real-time with smart data layers.', 
    es: 'Explora zonas de inversión, proyectos off-plan, landmarks y hotspots en tiempo real con capas de datos inteligentes.' 
  },
  landingExploreMap: { en: 'Explore Map', es: 'Explorar Mapa' },
  landingRoiCalculator: { en: 'ROI Calculator', es: 'Calculadora ROI' },
  landingRoiCalculatorDesc: { 
    en: 'Compare OI, SI and HO investment profiles with precise projections and detailed exit scenarios.', 
    es: 'Compara perfiles de inversión OI, SI y HO con proyecciones precisas y escenarios de salida detallados.' 
  },
  landingCalculateRoi: { en: 'Calculate ROI', es: 'Calcular ROI' },
  landingCashflowGenerator: { en: 'Cashflow Generator', es: 'Generador de Cashflow' },
  landingCashflowGeneratorDesc: { 
    en: 'Create professional reports with payment breakdowns and custom quotes for your clients.', 
    es: 'Crea reportes profesionales con desglose de pagos y cotizaciones personalizadas para tus clientes.' 
  },
  landingCreateQuote: { en: 'Create Quote', es: 'Crear Cotización' },
  landingProjectedRoi: { en: 'Projected ROI', es: 'ROI Proyectado' },
  landingAnnualYield: { en: 'Annual Yield', es: 'Yield Anual' },
  landingAccuracy: { en: 'Accuracy', es: 'Precisión' },
  landingCtaTitle: { en: 'Ready to Transform Your Investment Strategy?', es: '¿Listo para Transformar tu Estrategia de Inversión?' },
  landingCtaDescription: { en: 'Join professionals using Dubai Invest Pro to make smarter investment decisions.', es: 'Únete a los profesionales que usan Dubai Invest Pro para tomar decisiones de inversión más inteligentes.' },
  landingCtaButton: { en: 'Start Now — It\'s Free', es: 'Comenzar Ahora — Es Gratis' },
  landingRightsReserved: { en: 'All rights reserved.', es: 'Todos los derechos reservados.' },
  landingPrivacy: { en: 'Privacy', es: 'Privacidad' },
  landingTerms: { en: 'Terms', es: 'Términos' },
  landingContact: { en: 'Contact', es: 'Contacto' },
  
  // Login Page
  loginTitle: { en: 'Dubai Investment Hub', es: 'Dubai Investment Hub' },
  loginSubtitle: { en: 'Advisory Platform', es: 'Plataforma de Asesoría' },
  loginSignIn: { en: 'Sign in', es: 'Iniciar sesión' },
  loginSignUp: { en: 'Sign up', es: 'Registrarse' },
  
  // Home Page
  homeWelcome: { en: 'Welcome', es: 'Bienvenido' },
  homeSubtitle: { en: 'Your investment advisory dashboard', es: 'Tu panel de asesoría de inversiones' },
  homeInvestorType: { en: 'Investor Type', es: 'Tipo de Inversionista' },
  homeInvestorTypeDesc: { en: 'Compare OI, SI, HO investment profiles and analyze returns', es: 'Compara perfiles de inversión OI, SI, HO y analiza retornos' },
  homeCashflowGenerator: { en: 'Cashflow Generator', es: 'Generador de Cashflow' },
  homeCashflowGeneratorDesc: { en: 'Exit scenarios, payment breakdowns & client quotes', es: 'Escenarios de salida, desglose de pagos y cotizaciones' },
  homeInvestmentMap: { en: 'Investment Map', es: 'Mapa de Inversión' },
  homeInvestmentMapDesc: { en: 'Dubai zones, projects, hotspots & live presentations', es: 'Zonas de Dubai, proyectos, hotspots y presentaciones en vivo' },
  homeMyGenerators: { en: 'My Generators', es: 'Mis Generadores' },
  homeConfiguration: { en: 'Configuration', es: 'Configuración' },
  homeAccountSettings: { en: 'Account Settings', es: 'Configuración de Cuenta' },
  homeRecentGenerators: { en: 'Recent Cashflow Generators', es: 'Generadores de Cashflow Recientes' },
  homeViewAll: { en: 'View All', es: 'Ver Todos' },
  homeUnnamedClient: { en: 'Unnamed Client', es: 'Cliente sin Nombre' },
  homeNoProject: { en: 'No project', es: 'Sin proyecto' },
  
  // Account Settings Page
  accountSettingsTitle: { en: 'Account Settings', es: 'Configuración de Cuenta' },
  accountEmail: { en: 'Email', es: 'Correo Electrónico' },
  accountEmailCannotChange: { en: 'Email cannot be changed', es: 'El correo no puede ser cambiado' },
  accountFullName: { en: 'Full Name', es: 'Nombre Completo' },
  accountEnterFullName: { en: 'Enter your full name', es: 'Ingresa tu nombre completo' },
  accountBusinessEmail: { en: 'Business Email', es: 'Correo Empresarial' },
  accountBusinessEmailDesc: { en: 'Clients can contact you via this email', es: 'Los clientes pueden contactarte por este correo' },
  accountWhatsApp: { en: 'WhatsApp Number', es: 'Número de WhatsApp' },
  accountWhatsAppDesc: { en: 'Clients can message you on WhatsApp', es: 'Los clientes pueden enviarte mensajes por WhatsApp' },
  accountClickToUpload: { en: 'Click camera to upload photo', es: 'Clic en cámara para subir foto' },
  accountSaving: { en: 'Saving...', es: 'Guardando...' },
  accountSaveChanges: { en: 'Save Changes', es: 'Guardar Cambios' },
  accountViewGenerators: { en: 'View My Cashflow Generators', es: 'Ver Mis Generadores de Cashflow' },
  accountAdminDashboard: { en: 'Admin Dashboard', es: 'Panel de Administración' },
  
  // Quotes Dashboard Page
  quotesTitle: { en: 'My Cashflow Generators', es: 'Mis Generadores de Cashflow' },
  quotesSaved: { en: 'quotes saved', es: 'cotizaciones guardadas' },
  quotesNewQuote: { en: 'New Quote', es: 'Nueva Cotización' },
  quotesNoQuotes: { en: 'No quotes yet', es: 'Sin cotizaciones aún' },
  quotesNoQuotesDesc: { en: 'Create your first cashflow generator to get started', es: 'Crea tu primer generador de cashflow para comenzar' },
  quotesCreateQuote: { en: 'Create Quote', es: 'Crear Cotización' },
  quotesUntitled: { en: 'Untitled Quote', es: 'Cotización Sin Título' },
  quotesClient: { en: 'Client', es: 'Cliente' },
  quotesProject: { en: 'Project', es: 'Proyecto' },
  quotesDeveloper: { en: 'Developer', es: 'Desarrollador' },
  quotesDeleteTitle: { en: 'Delete Quote', es: 'Eliminar Cotización' },
  quotesDeleteDesc: { en: 'Are you sure you want to delete "{title}"? This action cannot be undone.', es: '¿Estás seguro de que deseas eliminar "{title}"? Esta acción no se puede deshacer.' },
  quotesCancel: { en: 'Cancel', es: 'Cancelar' },
  quotesDelete: { en: 'Delete', es: 'Eliminar' },
  
  // 404 Page
  notFound404: { en: '404', es: '404' },
  notFoundTitle: { en: 'Oops! Page not found', es: '¡Ups! Página no encontrada' },
  notFoundReturn: { en: 'Return to Home', es: 'Volver al Inicio' },
  
  // ROI Calculator Page
  roiInvestorType: { en: 'Investor Type', es: 'Tipo de Inversionista' },
  roiCompareProfiles: { en: 'Compare OI, SI, HO investment profiles', es: 'Compara perfiles de inversión OI, SI, HO' },
  roiDetailedComparison: { en: 'Detailed Comparison', es: 'Comparación Detallada' },
  roiMetric: { en: 'Metric', es: 'Métrica' },
  roiEntryPrice: { en: 'Entry Price', es: 'Precio de Entrada' },
  roiExitPrice: { en: 'Exit Price', es: 'Precio de Salida' },
  roiEquityInvested: { en: 'Equity Invested', es: 'Capital Invertido' },
  roiProjectedProfit: { en: 'Projected Profit', es: 'Ganancia Proyectada' },
  roiRentalYield: { en: 'Rental Yield', es: 'Rendimiento de Renta' },
  roiYearsToPay: { en: 'Years to Pay', es: 'Años para Recuperar' },
  
  // ROI Input Modal translations
  configureInvestment: { en: 'Configure Investment', es: 'Configurar Inversión' },
  investmentParameters: { en: 'Investment Parameters', es: 'Parámetros de Inversión' },
  oiHoldingPeriod: { en: 'OI Holding Period (months)', es: 'Período de Tenencia OI (meses)' },
  resaleThresholdOIEquity: { en: 'Resale Threshold % (OI Equity)', es: 'Umbral de Reventa % (Capital OI)' },
  appreciationRateCAGR: { en: 'Appreciation Rate (CAGR) %', es: 'Tasa de Apreciación (CAGR) %' },
  oiSellsToSI: { en: 'OI sells to SI after', es: 'OI vende a SI después de' },
  oiDeploysToResell: { en: 'OI deploys {amount} to resell', es: 'OI despliega {amount} para revender' },
  
  // Month names (short)
  monthJan: { en: 'Jan', es: 'Ene' },
  monthFeb: { en: 'Feb', es: 'Feb' },
  monthMar: { en: 'Mar', es: 'Mar' },
  monthApr: { en: 'Apr', es: 'Abr' },
  monthMay: { en: 'May', es: 'May' },
  monthJun: { en: 'Jun', es: 'Jun' },
  monthJul: { en: 'Jul', es: 'Jul' },
  monthAug: { en: 'Aug', es: 'Ago' },
  monthSep: { en: 'Sep', es: 'Sep' },
  monthOct: { en: 'Oct', es: 'Oct' },
  monthNov: { en: 'Nov', es: 'Nov' },
  monthDec: { en: 'Dec', es: 'Dic' },
  
  // OI Input Modal additional translations
  oiInvestmentParametersTitle: { en: 'OI Investment Parameters', es: 'Parámetros de Inversión OI' },
  entryCostsAtBookingLabel: { en: 'Entry Costs (At Booking)', es: 'Costos de Entrada (En Reserva)' },
  dldFeeLabelFixed: { en: 'DLD Fee (fixed)', es: 'Tarifa DLD (fija)' },
  minExitThresholdDescLabel: { en: '% of price developer requires paid before allowing resale', es: '% del precio que el developer exige haber pagado para permitir reventa' },
  preHandoverSplitLabel: { en: 'Pre-Handover / Handover Split', es: 'División Pre-Entrega / Entrega' },
  timeBasedMonthLabel: { en: 'Time-based (Month)', es: 'Basado en Tiempo (Mes)' },
  constructionBasedLabel: { en: 'Construction %', es: 'Construcción %' },
  handoverPaymentAutoLabel: { en: 'Handover Payment (Automatic)', es: 'Pago de Entrega (Automático)' },
  atHandoverDateLabel: { en: 'At handover date', es: 'En fecha de entrega' },
  monthLabelPlaceholder: { en: 'Month', es: 'Mes' },
  yearLabelPlaceholder: { en: 'Year', es: 'Año' },
  quarterLabelPlaceholder: { en: 'Quarter', es: 'Trimestre' },
  
  // Client Unit Modal translations
  splitPaymentsBetweenClients: { en: 'Split payments between clients', es: 'Dividir pagos entre clientes' },
  assignContributionPercentage: { en: 'Assign contribution percentage to each client', es: 'Asignar porcentaje de contribución a cada cliente' },
  mustEqual100: { en: 'Must equal 100%', es: 'Debe sumar 100%' },
  distributeEqually: { en: 'Distribute equally', es: 'Distribuir equitativamente' },
  totalLabel: { en: 'Total', es: 'Total' },
  
  // Cashflow Summary Card translations
  summaryTitle: { en: 'Investment Summary', es: 'Resumen de Inversión' },
  summarySubtitle: { en: 'Complete overview for client sharing', es: 'Resumen completo para compartir con el cliente' },
  copyToClipboard: { en: 'Copy', es: 'Copiar' },
  copiedToClipboard: { en: 'Copied!', es: '¡Copiado!' },
  copied: { en: 'Copied', es: 'Copiado' },
  editSummary: { en: 'Edit', es: 'Editar' },
  doneEditing: { en: 'Done', es: 'Listo' },
  resetSummary: { en: 'Reset', es: 'Restablecer' },
  edited: { en: 'Edited', es: 'Editado' },
  clickToCollapse: { en: 'Click to collapse', es: 'Clic para colapsar' },
  clickToExpand: { en: 'Click to expand', es: 'Clic para expandir' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
