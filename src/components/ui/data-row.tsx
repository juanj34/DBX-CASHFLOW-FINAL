import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/roi/InfoTooltip";

interface DataRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tooltipKey?: string;
  highlight?: boolean;
  variant?: 'default' | 'accent' | 'positive' | 'negative' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * DataRow - A responsive label/value pair component
 * 
 * On tablet screens, limits width to prevent excessive stretching.
 * On desktop, designed to work within grid layouts.
 */
export const DataRow = ({
  label,
  value,
  icon,
  tooltipKey,
  highlight = false,
  variant = 'default',
  size = 'md',
  className,
}: DataRowProps) => {
  const getValueColor = () => {
    switch (variant) {
      case 'accent':
        return 'text-theme-accent';
      case 'positive':
        return 'text-emerald-400';
      case 'negative':
        return 'text-red-400';
      case 'muted':
        return 'text-theme-text-muted';
      default:
        return highlight ? 'text-theme-accent' : 'text-theme-text';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return { label: 'text-xs', value: 'text-xs' };
      case 'lg':
        return { label: 'text-sm', value: 'text-base' };
      default:
        return { label: 'text-sm', value: 'text-sm' };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div 
      className={cn(
        "flex items-center justify-between gap-4",
        // Constrain width on tablet to prevent extreme stretching
        "xl:max-w-none max-w-xl",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="text-theme-text-muted flex-shrink-0">{icon}</span>}
        <span className={cn("text-theme-text-muted", sizeClasses.label)}>{label}</span>
        {tooltipKey && <InfoTooltip translationKey={tooltipKey} />}
      </div>
      <span 
        className={cn(
          "font-mono font-bold flex-shrink-0",
          sizeClasses.value,
          getValueColor()
        )}
      >
        {value}
      </span>
    </div>
  );
};

interface DataGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * DataGrid - A responsive container for DataRow components
 * 
 * On mobile/tablet: Single column
 * On desktop: Two columns for better space utilization
 */
export const DataGrid = ({ children, className }: DataGridProps) => {
  return (
    <div 
      className={cn(
        "grid gap-3",
        // Single column on mobile/tablet, 2 columns on desktop
        "grid-cols-1 xl:grid-cols-2 xl:gap-x-8",
        className
      )}
    >
      {children}
    </div>
  );
};
