import { Calculator, X } from 'lucide-react';
import { Currency, formatDualCurrency } from '../currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentSelectionBarProps {
  selectedAmounts: number[];
  currency: Currency;
  rate: number;
  onClear: () => void;
}

export const PaymentSelectionBar = ({
  selectedAmounts,
  currency,
  rate,
  onClear,
}: PaymentSelectionBarProps) => {
  const { t } = useLanguage();
  
  if (selectedAmounts.length === 0) return null;
  
  const total = selectedAmounts.reduce((sum, amount) => sum + amount, 0);
  const average = total / selectedAmounts.length;
  
  const formatValue = (value: number) => {
    const dual = formatDualCurrency(value, currency, rate);
    return currency === 'AED' 
      ? dual.primary 
      : `${dual.primary} (${dual.secondary})`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-theme-card/95 backdrop-blur-md border border-theme-accent/30 rounded-full px-4 py-2 shadow-xl shadow-black/20"
      >
        <div className="flex items-center gap-4 text-xs">
          {/* Selected count */}
          <div className="flex items-center gap-1.5 text-theme-accent">
            <Calculator className="w-3.5 h-3.5" />
            <span className="font-medium">{selectedAmounts.length} selected</span>
          </div>
          
          <div className="w-px h-4 bg-theme-border" />
          
          {/* Sum */}
          <div className="flex items-center gap-1.5">
            <span className="text-theme-text-muted">Σ</span>
            <span className="font-mono font-semibold text-theme-text">{formatValue(total)}</span>
          </div>
          
          <div className="w-px h-4 bg-theme-border" />
          
          {/* Average */}
          <div className="flex items-center gap-1.5">
            <span className="text-theme-text-muted">x̄</span>
            <span className="font-mono text-theme-text-muted">{formatValue(average)}</span>
          </div>
          
          {/* Clear button */}
          <button
            onClick={onClear}
            className="ml-1 p-1 rounded-full hover:bg-theme-border/50 text-theme-text-muted hover:text-theme-text transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
