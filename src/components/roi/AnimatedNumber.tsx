import { useEffect, useRef, useState } from 'react';
import { Currency } from './currencyUtils';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (value: number) => string;
  className?: string;
}

export const AnimatedNumber = ({ 
  value, 
  duration = 400, 
  formatFn = (v) => v.toFixed(1),
  className = ''
}: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const animationRef = useRef<number>();

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return <span className={className}>{formatFn(displayValue)}</span>;
};

// Currency-specific animated number
interface AnimatedCurrencyProps {
  value: number;
  currency: Currency;
  rate: number;
  duration?: number;
  className?: string;
}

export const AnimatedCurrency = ({ 
  value, 
  currency, 
  rate, 
  duration = 400,
  className = ''
}: AnimatedCurrencyProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const animationRef = useRef<number>();

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formatValue = (v: number) => {
    const converted = currency === 'AED' ? v : v / rate;
    const symbol = currency === 'AED' ? 'AED' : currency === 'USD' ? '$' : currency;
    
    if (Math.abs(converted) >= 1000000) {
      return `${symbol} ${(converted / 1000000).toFixed(2)}M`;
    }
    if (Math.abs(converted) >= 1000) {
      return `${symbol} ${Math.round(converted).toLocaleString()}`;
    }
    return `${symbol} ${Math.round(converted).toLocaleString()}`;
  };

  return <span className={className}>{formatValue(displayValue)}</span>;
};
