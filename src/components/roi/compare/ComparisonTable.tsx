import { useState, useEffect, useMemo } from 'react';
import { GripVertical } from 'lucide-react';
import { QuoteWithCalculations, ComparisonQuote } from '@/hooks/useQuotesComparison';
import { formatCurrency, Currency } from '@/components/roi/currencyUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getQuoteDisplayName } from './utils';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ComparisonTableProps {
  quotesWithCalcs: QuoteWithCalculations[];
  onReorder?: (newOrder: string[]) => void;
  currency?: Currency;
  exchangeRate?: number;
}

// Theme-aware colors for quotes
const getQuoteColors = (isLightTheme: boolean) => 
  isLightTheme 
    ? ['#B8860B', '#1e40af', '#7c3aed', '#c2410c', '#0f766e', '#be185d']
    : ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500', '#FF6B6B', '#4ECDC4'];

// Sortable header cell component
const SortableHeaderCell = ({ 
  quote, 
  color,
  children,
}: { 
  quote: ComparisonQuote; 
  color: string;
  children: React.ReactNode;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: quote.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 text-left align-top border-b border-theme-border relative group min-w-[140px]",
        isDragging && "opacity-50 z-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 left-1 p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hover:bg-theme-bg-alt"
      >
        <GripVertical className="w-3 h-3 text-theme-text-muted" />
      </div>
      <div className="pl-5">
        {children}
      </div>
    </th>
  );
};

// Get zone name from quote inputs
const getZoneName = (quote: ComparisonQuote) => {
  const inputs = quote.inputs as any;
  const clientInfo = inputs._clientInfo;
  return clientInfo?.zoneName || null;
};

// Calculate time to completion
const getTimeToCompletion = (inputs: any) => {
  const now = new Date();
  const handoverMonth = ((inputs.handoverQuarter || 4) - 1) * 3 + 1;
  const handoverDate = new Date(inputs.handoverYear || new Date().getFullYear() + 2, handoverMonth, 1);
  const diffMonths = Math.max(0, (handoverDate.getFullYear() - now.getFullYear()) * 12 + 
    (handoverDate.getMonth() - now.getMonth()));
  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  if (years > 0 && months > 0) return `${years}y ${months}m`;
  if (years > 0) return `${years}y`;
  if (months > 0) return `${months}m`;
  return 'Now';
};

// Format handover date as "Q# YYYY"
const formatHandoverDate = (inputs: any) => {
  const q = inputs.handoverQuarter || 4;
  const y = inputs.handoverYear || new Date().getFullYear() + 2;
  return `Q${q} ${y}`;
};

// Calculate rent coverage for post-handover plans
const getRentCoverage = (item: QuoteWithCalculations) => {
  const inputs = item.quote.inputs;
  if (!inputs.hasPostHandoverPlan) return null;
  
  const postPercent = inputs.postHandoverPercent || 0;
  if (postPercent <= 0) return null;
  
  const postTotal = inputs.basePrice * (postPercent / 100);
  
  // Get post-handover payments to calculate duration
  const postPayments = inputs.postHandoverPayments?.length > 0 
    ? inputs.postHandoverPayments 
    : (inputs.additionalPayments || []).filter((p: any) => p.type === 'post-handover');
  
  if (postPayments.length === 0) return null;
  
  // Calculate duration in months based on payment schedule
  let durationMonths = 24; // Default 2 years
  if (postPayments.length > 0) {
    // Use triggerValue for months-after-handover type payments
    const lastPayment = postPayments[postPayments.length - 1];
    if (lastPayment?.triggerValue && lastPayment.type === 'post-handover') {
      durationMonths = lastPayment.triggerValue;
    } else {
      // Estimate based on number of payments (assuming quarterly)
      durationMonths = postPayments.length * 3;
    }
  }
  durationMonths = Math.max(12, durationMonths); // At least 1 year
  
  const monthlyPayment = postTotal / durationMonths;
  
  // Monthly rent from calculations
  const monthlyRent = (item.calculations.holdAnalysis?.netAnnualRent || 0) / 12;
  
  const cashflow = monthlyRent - monthlyPayment;
  const coveragePercent = monthlyPayment > 0 ? Math.min(100, (monthlyRent / monthlyPayment) * 100) : 0;
  
  return { 
    cashflow, 
    coveragePercent, 
    isPositive: cashflow >= 0 
  };
};

export const ComparisonTable = ({ 
  quotesWithCalcs, 
  onReorder,
  currency = 'AED', 
  exchangeRate = 1 
}: ComparisonTableProps) => {
  const { theme } = useTheme();
  const isLightTheme = theme === 'consultant';
  const colors = getQuoteColors(isLightTheme);
  const { t } = useLanguage();
  const fmt = (v: number) => formatCurrency(v, currency, exchangeRate);

  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  // Sync order with incoming quotes
  useEffect(() => {
    setOrderedIds(quotesWithCalcs.map(q => q.quote.id));
  }, [quotesWithCalcs.map(q => q.quote.id).join(',')]);

  const orderedQuotes = useMemo(() => {
    return orderedIds
      .map(id => quotesWithCalcs.find(q => q.quote.id === id))
      .filter((q): q is QuoteWithCalculations => q !== undefined);
  }, [orderedIds, quotesWithCalcs]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = orderedIds.findIndex(id => id === active.id);
      const newIndex = orderedIds.findIndex(id => id === over.id);
      const newOrder = arrayMove(orderedIds, oldIndex, newIndex);
      setOrderedIds(newOrder);
      onReorder?.(newOrder);
    }
  };

  // Data row component
  const DataRow = ({ 
    label, 
    values, 
    highlight = false,
  }: { 
    label: string; 
    values: { value: React.ReactNode; color?: string }[];
    highlight?: boolean;
  }) => (
    <tr className={cn(
      "border-b border-theme-border",
      highlight && "bg-theme-card-alt/30"
    )}>
      <td className="p-3 text-sm text-theme-text-muted whitespace-nowrap">{label}</td>
      {values.map((item, idx) => (
        <td key={idx} className="p-3 text-sm font-medium text-theme-text">
          {item.value}
        </td>
      ))}
    </tr>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto rounded-xl border border-theme-border">
        <table className="w-full">
          <SortableContext
            items={orderedIds}
            strategy={horizontalListSortingStrategy}
          >
            <thead className="bg-theme-card">
              <tr>
                <th className="p-3 text-left text-sm text-theme-text-muted border-b border-theme-border min-w-[140px]">
                  {t('metric') || 'Metric'}
                </th>
                {orderedQuotes.map((item, idx) => (
                  <SortableHeaderCell 
                    key={item.quote.id} 
                    quote={item.quote}
                    color={colors[idx % colors.length]}
                  >
                    <div 
                      className="font-semibold text-base truncate"
                      style={{ color: colors[idx % colors.length] }}
                    >
                      {getQuoteDisplayName(item.quote.title, item.quote.projectName)}
                    </div>
                    {item.quote.developer && (
                      <div className="text-xs text-theme-text-muted mt-0.5 truncate">
                        {item.quote.developer}
                      </div>
                    )}
                    {getZoneName(item.quote) && (
                      <div className="text-xs text-theme-text-muted/70 truncate">
                        {getZoneName(item.quote)}
                      </div>
                    )}
                  </SortableHeaderCell>
                ))}
              </tr>
            </thead>
          </SortableContext>
          
          <tbody>
            {/* Property Value */}
            <DataRow
              label={t('propertyValue') || 'Property Value'}
              values={orderedQuotes.map(q => ({ 
                value: fmt(q.quote.inputs.basePrice) 
              }))}
            />
            
            {/* Price per sqft */}
            <DataRow
              label={t('pricePerSqft') || 'Price/sqft'}
              values={orderedQuotes.map(q => {
                const size = q.quote.unitSizeSqf || q.quote.inputs.unitSizeSqf || 0;
                const pricePerSqft = size > 0 ? q.quote.inputs.basePrice / size : null;
                return { value: pricePerSqft ? fmt(pricePerSqft) : '—' };
              })}
            />
            
            {/* Area */}
            <DataRow
              label={t('area') || 'Area'}
              values={orderedQuotes.map(q => {
                const size = q.quote.unitSizeSqf || q.quote.inputs.unitSizeSqf || 0;
                return { value: size > 0 ? `${size.toLocaleString()} sqft` : '—' };
              })}
            />
            
            {/* Rental Income with yield % */}
            <DataRow
              label={t('rentalIncome') || 'Rental Income'}
              values={orderedQuotes.map(q => {
                const grossAnnualRent = q.quote.inputs.basePrice * (q.quote.inputs.rentalYieldPercent / 100);
                const yieldPct = q.quote.inputs.rentalYieldPercent;
                if (grossAnnualRent <= 0) return { value: '—' };
                return { 
                  value: (
                    <span>
                      {fmt(grossAnnualRent)}
                      <span className="text-xs text-theme-text-muted ml-1">({yieldPct}%)</span>
                    </span>
                  )
                };
              })}
            />
            
            {/* Handover */}
            <DataRow
              label={t('handoverDate') || 'Handover'}
              values={orderedQuotes.map(q => ({ 
                value: (
                  <span>
                    {formatHandoverDate(q.quote.inputs)}
                    <span className="text-xs text-theme-text-muted ml-1">
                      ({getTimeToCompletion(q.quote.inputs)})
                    </span>
                  </span>
                )
              }))}
            />
            
            {/* Pre-Handover Spend */}
            <DataRow
              label={t('preHandoverSpend') || 'Pre-Handover'}
              values={orderedQuotes.map(q => {
                const preAmount = q.quote.inputs.basePrice * (q.quote.inputs.preHandoverPercent / 100);
                const entryCosts = q.calculations.totalEntryCosts || 0;
                return { value: fmt(preAmount + entryCosts) };
              })}
            />
            
            {/* Post-Handover Spend */}
            <DataRow
              label={t('postHandoverSpend') || 'Post-Handover'}
              values={orderedQuotes.map(q => {
                if (!q.quote.inputs.hasPostHandoverPlan) return { value: '—' };
                const postAmount = q.quote.inputs.basePrice * ((q.quote.inputs.postHandoverPercent || 0) / 100);
                return { value: postAmount > 0 ? fmt(postAmount) : '—' };
              })}
            />
            
            {/* Rent Coverage */}
            <DataRow
              label={t('rentCoverage') || 'Rent Coverage'}
              highlight
              values={orderedQuotes.map((q, idx) => {
                const coverage = getRentCoverage(q);
                if (!coverage) return { value: '—' };
                
                const { cashflow, coveragePercent, isPositive } = coverage;
                const prefix = isPositive ? '+' : '';
                const colorClass = isPositive ? 'text-theme-positive' : 'text-destructive';
                
                return { 
                  value: (
                    <span className={colorClass}>
                      {prefix}{fmt(Math.abs(cashflow))}/mo
                      <span className="text-xs opacity-70 ml-1">({Math.round(coveragePercent)}%)</span>
                    </span>
                  )
                };
              })}
            />
          </tbody>
        </table>
      </div>
    </DndContext>
  );
};

export default ComparisonTable;
