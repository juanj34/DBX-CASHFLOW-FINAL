import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProjectionDisclaimerProps {
  variant?: 'compact' | 'full';
}

export const ProjectionDisclaimer = ({ variant = 'compact' }: ProjectionDisclaimerProps) => {
  const { t } = useLanguage();
  
  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200/80">
          {t('projectionDisclaimerCompact')}
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-amber-300">
            {t('projectionDisclaimerTitle')}
          </p>
          <p className="text-xs text-amber-200/70">
            {t('projectionDisclaimerFull')}
          </p>
        </div>
      </div>
    </div>
  );
};
