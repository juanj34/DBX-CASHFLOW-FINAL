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
  months: { en: 'months', es: 'meses' },
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
  cashflowStatement: { en: 'Cashflow Statement', es: 'Estado de Flujo de Caja' },
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
