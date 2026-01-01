import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

interface InfoTooltipProps {
  translationKey: string;
  className?: string;
}

export const InfoTooltip = ({ translationKey, className = "" }: InfoTooltipProps) => {
  const { t } = useLanguage();
  const tooltipText = t(translationKey);

  // Don't render if no translation exists
  if (tooltipText === translationKey) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-full p-0.5 text-theme-text-muted hover:text-theme-accent hover:bg-theme-accent/10 transition-colors ${className}`}
            onClick={(e) => e.preventDefault()}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs bg-theme-card border-theme-border text-theme-text text-xs leading-relaxed z-50"
        >
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
