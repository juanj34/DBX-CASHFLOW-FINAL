import { Currency, CURRENCY_CONFIG, formatCurrency } from '../currencyUtils';

interface DualCurrencyValueProps {
  value: number;
  currency: Currency;
  rate: number;
  className?: string;
  negative?: boolean;
  highlight?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showBothAlways?: boolean;
}

export const DualCurrencyValue = ({
  value,
  currency,
  rate,
  className = '',
  negative = false,
  highlight = false,
  size = 'md',
  showBothAlways = true,
}: DualCurrencyValueProps) => {
  const displayValue = negative ? -Math.abs(value) : value;
  
  const aedFormatted = formatCurrency(Math.abs(value), 'AED', 1);
  const convertedFormatted = currency !== 'AED' 
    ? formatCurrency(Math.abs(value), currency, rate)
    : null;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-semibold',
  };

  const baseClasses = `${sizeClasses[size]} ${className}`;
  const valueClasses = negative 
    ? 'text-red-500' 
    : highlight 
      ? 'text-primary font-semibold' 
      : 'text-foreground';

  return (
    <div className={`flex flex-col items-end ${baseClasses}`}>
      <span className={valueClasses}>
        {negative && '('}{aedFormatted}{negative && ')'}
      </span>
      {showBothAlways && convertedFormatted && (
        <span className="text-muted-foreground text-xs">
          {negative && '('}{convertedFormatted}{negative && ')'}
        </span>
      )}
    </div>
  );
};
