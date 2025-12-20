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
            className={`inline-flex items-center justify-center rounded-full p-0.5 text-gray-500 hover:text-[#CCFF00] transition-colors ${className}`}
            onClick={(e) => e.preventDefault()}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs bg-[#1a1f2e] border-[#2a3142] text-gray-300 text-xs leading-relaxed"
        >
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
