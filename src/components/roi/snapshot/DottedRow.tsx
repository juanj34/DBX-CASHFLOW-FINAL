import { cn } from '@/lib/utils';

interface DottedRowProps {
  label: string;
  value: string;
  secondaryValue?: string | null;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  bold?: boolean;
  indent?: boolean;
}

export const DottedRow = ({
  label,
  value,
  secondaryValue,
  className,
  labelClassName,
  valueClassName,
  bold = false,
  indent = false,
}: DottedRowProps) => {
  return (
    <div className={cn('flex items-baseline gap-1', className)}>
      <span 
        className={cn(
          'text-muted-foreground whitespace-nowrap text-sm',
          indent && 'pl-3',
          bold && 'font-medium text-foreground',
          labelClassName
        )}
      >
        {label}
      </span>
      <span className="flex-1 border-b border-dotted border-border/50 mx-1 min-w-4" />
      <span 
        className={cn(
          'font-mono tabular-nums text-foreground whitespace-nowrap text-sm',
          bold && 'font-semibold',
          valueClassName
        )}
      >
        {value}
        {secondaryValue && (
          <span className="text-muted-foreground text-xs ml-1">
            ({secondaryValue})
          </span>
        )}
      </span>
    </div>
  );
};
