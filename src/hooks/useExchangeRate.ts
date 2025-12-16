import { useQuery } from '@tanstack/react-query';

const FALLBACK_RATE = 3.67;

export const useExchangeRate = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['exchangeRate', 'USD', 'AED'],
    queryFn: async () => {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=AED');
      if (!res.ok) throw new Error('Failed to fetch exchange rate');
      const data = await res.json();
      return data.rates.AED as number;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache 24h
    retry: 2,
  });

  return {
    rate: data ?? FALLBACK_RATE,
    isLive: !!data && !isError,
    isLoading,
  };
};
