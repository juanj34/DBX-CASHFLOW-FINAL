import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TrendingUp, Home, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface EnabledSections {
  exitStrategy: boolean;
  longTermHold: boolean;
}

interface EnabledSectionsToggleProps {
  enabledSections: EnabledSections;
  onChange: (sections: EnabledSections) => void;
}

export const EnabledSectionsToggle = ({ enabledSections, onChange }: EnabledSectionsToggleProps) => {
  const { t } = useLanguage();

  const handleToggle = (key: keyof EnabledSections) => {
    onChange({ ...enabledSections, [key]: !enabledSections[key] });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-300">
          {t('enabledAnalysisSections') || 'Enabled Analysis Sections'}
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-xs">
              <p>{t('enabledSectionsTooltip') || 'Disabled sections will not appear in your view or the shared client view.'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Exit Strategy Toggle */}
        <div 
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            enabledSections.exitStrategy 
              ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30' 
              : 'bg-[#0f172a] border-[#2a3142]'
          }`}
          onClick={() => handleToggle('exitStrategy')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 ${enabledSections.exitStrategy ? 'text-[#CCFF00]' : 'text-gray-500'}`} />
              <span className={`text-sm font-medium ${enabledSections.exitStrategy ? 'text-white' : 'text-gray-500'}`}>
                {t('exitStrategy') || 'Exit Strategy'}
              </span>
            </div>
            <Switch
              checked={enabledSections.exitStrategy}
              onCheckedChange={() => handleToggle('exitStrategy')}
              className="data-[state=checked]:bg-[#CCFF00]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <p className="text-[10px] text-gray-500">
            {t('exitStrategyDesc') || 'When to sell for maximum returns'}
          </p>
        </div>

        {/* Long-Term Hold Toggle */}
        <div 
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            enabledSections.longTermHold 
              ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30' 
              : 'bg-[#0f172a] border-[#2a3142]'
          }`}
          onClick={() => handleToggle('longTermHold')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Home className={`w-4 h-4 ${enabledSections.longTermHold ? 'text-[#CCFF00]' : 'text-gray-500'}`} />
              <span className={`text-sm font-medium ${enabledSections.longTermHold ? 'text-white' : 'text-gray-500'}`}>
                {t('longTermHold') || 'Long-Term Hold'}
              </span>
            </div>
            <Switch
              checked={enabledSections.longTermHold}
              onCheckedChange={() => handleToggle('longTermHold')}
              className="data-[state=checked]:bg-[#CCFF00]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <p className="text-[10px] text-gray-500">
            {t('longTermHoldDesc') || 'Rental projections & wealth'}
          </p>
        </div>
      </div>
    </div>
  );
};

export const DEFAULT_ENABLED_SECTIONS: EnabledSections = {
  exitStrategy: true,
  longTermHold: true,
};