import { useState } from "react";
import { ChevronDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnionSectionProps {
  icon: LucideIcon;
  title: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const OnionSection = ({
  icon: Icon,
  title,
  summary,
  children,
  defaultOpen = false,
  className,
}: OnionSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("border-t border-theme-border", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 group"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-theme-accent flex-shrink-0" />
          <span className="text-sm font-semibold text-theme-text">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-theme-text-muted transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Summary — visible when collapsed */}
      {!isOpen && summary && (
        <div className="pb-4 -mt-2 pl-7">
          <div className="text-xs text-theme-text-muted leading-relaxed">
            {summary}
          </div>
        </div>
      )}

      {/* Expanded content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[5000px] opacity-100 pb-6" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  );
};
