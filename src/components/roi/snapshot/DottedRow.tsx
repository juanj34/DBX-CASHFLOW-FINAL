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
          'text-theme-text-muted whitespace-nowrap text-sm',
          indent && 'pl-3',
          bold && 'font-medium text-theme-text',
          labelClassName
        )}
      >
        {label}
      </span>
      <span className="flex-1 border-b border-dotted border-theme-border/50 mx-1 min-w-4" />
      <span 
        className={cn(
          'font-mono tabular-nums text-theme-text text-sm min-w-0',
          bold && 'font-semibold',
          valueClassName
        )}
      >
        <span className="truncate">{value}</span>
        {secondaryValue && (
          <span className="text-theme-text-muted text-xs ml-1 truncate">
            ({secondaryValue})
          </span>
        )}
      </span>
    </div>
  );
};
