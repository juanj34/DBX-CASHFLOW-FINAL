export type Currency = 'AED' | 'USD' | 'EUR' | 'GBP' | 'COP';

export const CURRENCY_CONFIG: Record<Currency, { symbol: string; locale: string; flag: string; name: string }> = {
  AED: { symbol: 'AED', locale: 'en-AE', flag: '🇦🇪', name: 'Dirham' },
  USD: { symbol: '$', locale: 'en-US', flag: '🇺🇸', name: 'US Dollar' },
  EUR: { symbol: '€', locale: 'de-DE', flag: '🇪🇺', name: 'Euro' },
  GBP: { symbol: '£', locale: 'en-GB', flag: '🇬🇧', name: 'British Pound' },
  COP: { symbol: 'COP', locale: 'es-CO', flag: '🇨🇴', name: 'Peso Colombiano' },
};

export const DEFAULT_RATE = 1; // Rate is now relative to AED

export const formatCurrency = (value: number, currency: Currency, rate: number = 1) => {
  const config = CURRENCY_CONFIG[currency];
  const converted = currency === 'AED' ? value : value * rate;
  
  return new Intl.NumberFormat(config.locale, { 
    style: 'currency', 
    currency: currency,
    maximumFractionDigits: 0 
  }).format(converted);
};

export const formatCurrencyShort = (value: number, currency: Currency, rate: number = 1) => {
  const converted = currency === 'AED' ? value : value * rate;
  const config = CURRENCY_CONFIG[currency];
  const symbol = currency === 'AED' ? '' : config.symbol;
  
  if (converted >= 1000000) {
    return `${symbol}${(converted / 1000000).toFixed(1)}M`;
  }
  return `${symbol}${(converted / 1000).toFixed(0)}K`;
};

export const parseCurrencyInput = (value: string): number => {
  // Remove currency symbols, commas, and spaces
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};
