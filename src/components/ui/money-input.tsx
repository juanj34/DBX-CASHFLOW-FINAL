import React, { useState, useCallback } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  prefix?: string;
}

const formatWithCommas = (n: number) =>
  n ? new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(n) : '';

const parseNumber = (s: string) => {
  const raw = s.replace(/[^0-9.]/g, '');
  return Number(raw) || 0;
};

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  className,
  placeholder = '0',
  prefix = 'AED',
}) => {
  const [focused, setFocused] = useState(false);
  const [rawValue, setRawValue] = useState('');

  const handleFocus = useCallback(() => {
    setFocused(true);
    setRawValue(value ? String(value) : '');
  }, [value]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    const parsed = parseNumber(rawValue);
    onChange(parsed);
  }, [rawValue, onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRawValue(e.target.value);
  }, []);

  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-theme-text-muted font-mono pointer-events-none">
        {prefix}
      </span>
      <Input
        type="text"
        inputMode="decimal"
        value={focused ? rawValue : formatWithCommas(value)}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn('font-mono pl-9', className)}
      />
    </div>
  );
};
