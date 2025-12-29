import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export const CollapsibleSection = ({
  title,
  subtitle,
  icon,
  defaultOpen = true,
  children,
  className,
  headerAction,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("mb-6", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-theme-card border border-theme-border rounded-xl hover:bg-theme-card/80 transition-colors group"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 bg-theme-accent/10 rounded-lg">
              {icon}
            </div>
          )}
          <div className="text-left">
            <h3 className="text-sm sm:text-base font-semibold text-theme-text">{title}</h3>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:inline">
            {isOpen ? 'Click to collapse' : 'Click to expand'}
          </span>
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-theme-text-muted group-hover:text-theme-text transition-colors" />
          ) : (
            <ChevronRight className="w-5 h-5 text-theme-text-muted group-hover:text-theme-text transition-colors" />
          )}
        </div>
      </button>
      
      <div
        className={cn(
          "collapsible-content overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[5000px] opacity-100 mt-4" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  );
};
