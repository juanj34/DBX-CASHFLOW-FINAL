import { useQuery } from '@tanstack/react-query';
import { Currency } from '@/components/roi/currencyUtils';

// Fallback rates (AED to target currency)
const FALLBACK_RATES: Record<Currency, number> = {
  AED: 1,
  USD: 0.272,      // 1 AED ≈ 0.27 USD
  EUR: 0.25,       // 1 AED ≈ 0.25 EUR
  GBP: 0.21,       // 1 AED ≈ 0.21 GBP
  COP: 1150,       // 1 AED ≈ 1150 COP
};

export const useExchangeRate = (targetCurrency: Currency = 'USD') => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['exchangeRate', 'AED', targetCurrency],
    queryFn: async () => {
      if (targetCurrency === 'AED') return 1;
      
      // frankfurter.app doesn't support AED or COP, so we use USD as base
      // and calculate the cross rate
      try {
        // For COP, use fixed rate as frankfurter doesn't support it
        if (targetCurrency === 'COP') {
          const usdToAed = 3.67;
          const usdToCop = 4200; // Approximate USD to COP
          return usdToCop / usdToAed; // AED to COP
        }
        
        // Get USD to target currency rate
        const res = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${targetCurrency}`);
        if (!res.ok) throw new Error('Failed to fetch exchange rate');
        const data = await res.json();
        const usdToTarget = data.rates[targetCurrency];
        
        // Convert: AED to USD (1/3.67) then USD to target
        const aedToUsd = 1 / 3.67;
        return aedToUsd * usdToTarget;
      } catch {
        return FALLBACK_RATES[targetCurrency];
      }
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache 24h
    retry: 2,
  });

  return {
    rate: data ?? FALLBACK_RATES[targetCurrency],
    isLive: !!data && !isError && targetCurrency !== 'COP',
    isLoading,
  };
};
