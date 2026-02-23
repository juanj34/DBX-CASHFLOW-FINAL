import { X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComparisonQuote } from '@/hooks/useQuotesComparison';
import { formatCurrency } from '@/components/roi/currencyUtils';
import { useTheme } from '@/contexts/ThemeContext';
import { getQuoteDisplayName } from './utils';
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
import { cn } from '@/lib/utils';

interface CompareHeaderProps {
  quotes: ComparisonQuote[];
  onRemove: (id: string) => void;
  onReorder?: (newOrder: string[]) => void;
}

// Theme-aware colors for quotes
const getQuoteColors = (isLightTheme: boolean) => 
  isLightTheme 
    ? ['#B8860B', '#1e40af', '#7c3aed', '#c2410c', '#0f766e', '#be185d']
    : ['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500', '#FF6B6B', '#4ECDC4'];

// Calculate property value at year N with phased appreciation
const calculateFutureValue = (
  basePrice: number,
  constructionMonths: number,
  constructionAppreciation: number,
  growthAppreciation: number,
  matureAppreciation: number,
  growthPeriodYears: number,
  targetYears: number
): number => {
  const totalMonths = targetYears * 12;
  let value = basePrice;
  
  for (let month = 1; month <= totalMonths; month++) {
    let annualRate: number;
    
    if (month <= constructionMonths) {
      annualRate = constructionAppreciation;
    } else {
      const monthsAfterHandover = month - constructionMonths;
      const yearsAfterHandover = monthsAfterHandover / 12;
      
      if (yearsAfterHandover <= growthPeriodYears) {
        annualRate = growthAppreciation;
      } else {
        annualRate = matureAppreciation;
      }
    }
    
    const monthlyRate = annualRate / 100 / 12;
    value *= (1 + monthlyRate);
  }
  
  return value;
};

// Sortable Card Component
const SortableQuoteCard = ({ 
  quote, 
  index, 
  color, 
  isLightTheme,
  onRemove 
}: { 
  quote: ComparisonQuote; 
  index: number; 
  color: string;
  isLightTheme: boolean;
  onRemove: (id: string) => void;
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
    borderTopColor: color,
    borderTopWidth: '3px',
  };

  const inputs = quote.inputs;
  const basePrice = inputs.basePrice || 0;
  const unitSize = quote.unitSizeSqf || inputs.unitSizeSqf || 0;
  const pricePerSqft = unitSize > 0 ? basePrice / unitSize : 0;
  
  // Calculate rental income
  const grossAnnualRent = basePrice * (inputs.rentalYieldPercent || 0) / 100;
  const annualServiceCharge = unitSize * (inputs.serviceChargePerSqft || 18);
  const netAnnualRent = grossAnnualRent - annualServiceCharge;
  const monthlyRent = netAnnualRent / 12;
  
  // Calculate monthly burn during pre-handover
  const bookingDate = new Date(inputs.bookingYear, (inputs.bookingMonth || 1) - 1, 1);
  const hMonth = inputs.handoverMonth || 12;
  const handoverDate = new Date(inputs.handoverYear || inputs.bookingYear + 2, hMonth - 1, 1);
  const constructionMonths = Math.max(1, Math.round((handoverDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  
  // Entry costs
  const dldFee = basePrice * 0.04;
  const oqoodFee = inputs.oqoodFee || 5000;
  const downpayment = basePrice * (inputs.downpaymentPercent || 20) / 100;
  const entryCosts = downpayment + dldFee + oqoodFee;
  
  // Pre-handover installments total
  const additionalTotal = (inputs.additionalPayments || []).reduce(
    (sum: number, m: any) => sum + (basePrice * (m.paymentPercent || 0) / 100), 
    0
  );
  
  const totalPreHandover = entryCosts + additionalTotal;
  const monthlyBurn = constructionMonths > 0 ? totalPreHandover / constructionMonths : 0;
  
  // Calculate 5-year property value
  const value5Years = calculateFutureValue(
    basePrice,
    constructionMonths,
    inputs.constructionAppreciation || 12,
    inputs.growthAppreciation || 8,
    inputs.matureAppreciation || 4,
    inputs.growthPeriodYears || 3,
    5
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-theme-card border border-theme-border rounded-xl relative group transition-all",
        isDragging && "opacity-50 shadow-2xl z-50 scale-105"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1.5 rounded-md cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hover:bg-theme-bg-alt"
      >
        <GripVertical className="w-4 h-4 text-theme-text-muted" />
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(quote.id)}
        className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt"
      >
        <X className="w-4 h-4" />
      </Button>

      <div className="p-4 pt-8 space-y-3">
        {/* Project Name - Primary Display */}
        <div className="pb-2 border-b border-theme-border">
          <h3 
            className="font-semibold text-lg truncate"
            style={{ color }}
          >
            {getQuoteDisplayName(quote.title, quote.projectName)}
          </h3>
          {quote.developer && (
            <p className="text-xs text-theme-text-muted mt-0.5">
              by {quote.developer}
            </p>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="space-y-2">
          {/* Base Price */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-theme-text-muted">Base Price</span>
            <span className="text-sm font-semibold text-theme-text">
              {formatCurrency(basePrice, 'AED', 1)}
            </span>
          </div>
          
          {/* Size */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-theme-text-muted">Size</span>
            <span className="text-sm font-medium text-theme-text">
              {unitSize > 0 ? `${unitSize.toLocaleString()} sqft` : '—'}
            </span>
          </div>
          
          {/* Price/sqft */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-theme-text-muted">Price/sqft</span>
            <span className="text-sm font-medium text-theme-text">
              {pricePerSqft > 0 ? formatCurrency(pricePerSqft, 'AED', 1) : '—'}
            </span>
          </div>

          <div className="border-t border-theme-border my-2" />
          
          {/* Monthly Rent */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-theme-text-muted">Monthly Rent (Net)</span>
            <span className="text-sm font-medium text-theme-positive">
              {monthlyRent > 0 ? formatCurrency(monthlyRent, 'AED', 1) : '—'}
            </span>
          </div>
          
          {/* Monthly Burn */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-theme-text-muted">Burn (Pre-Handover)</span>
            <span className="text-sm font-medium text-theme-text">
              ~{formatCurrency(monthlyBurn, 'AED', 1)}/mo
            </span>
          </div>

          <div className="border-t border-theme-border my-2" />
          
          {/* 5-Year Value */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-theme-text-muted">Value (Year 5)</span>
            <span className="text-sm font-bold" style={{ color }}>
              {formatCurrency(value5Years, 'AED', 1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CompareHeader = ({ quotes, onRemove, onReorder }: CompareHeaderProps) => {
  const { theme } = useTheme();
  const isLightTheme = theme === 'consultant';
  const colors = getQuoteColors(isLightTheme);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = quotes.findIndex(q => q.id === active.id);
      const newIndex = quotes.findIndex(q => q.id === over.id);
      
      if (onReorder) {
        const newOrder = arrayMove(quotes.map(q => q.id), oldIndex, newIndex);
        onReorder(newOrder);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={quotes.map(q => q.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div 
          className="grid gap-4" 
          style={{ gridTemplateColumns: `repeat(${quotes.length}, minmax(220px, 1fr))` }}
        >
          {quotes.map((quote, index) => (
            <SortableQuoteCard
              key={quote.id}
              quote={quote}
              index={index}
              color={colors[index % colors.length]}
              isLightTheme={isLightTheme}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};