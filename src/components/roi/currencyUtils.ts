export type Currency = 'AED' | 'USD';

export const DEFAULT_RATE = 3.67;

export const formatCurrency = (value: number, currency: Currency, rate: number = DEFAULT_RATE) => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value / rate);
  }
  return new Intl.NumberFormat('en-AE', { 
    style: 'currency', 
    currency: 'AED',
    maximumFractionDigits: 0 
  }).format(value);
};

export const formatCurrencyShort = (value: number, currency: Currency, rate: number = DEFAULT_RATE) => {
  const converted = currency === 'USD' ? value / rate : value;
  const symbol = currency === 'USD' ? '$' : '';
  
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
