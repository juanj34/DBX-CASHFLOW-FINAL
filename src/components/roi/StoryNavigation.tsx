import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type StorySection = 'entry' | 'income' | 'wealth' | 'exit' | 'leverage';

export interface StorySectionConfig {
  id: StorySection;
  labelKey: string;
  fallbackLabel: string;
  icon: LucideIcon;
  show?: boolean;
}

interface StoryNavigationProps {
  sections: StorySectionConfig[];
  activeSection: StorySection;
  onSectionChange: (section: StorySection) => void;
}

export const StoryNavigation = ({
  sections,
  activeSection,
  onSectionChange,
}: StoryNavigationProps) => {
  const { t } = useLanguage();
  
  const visibleSections = sections.filter(s => s.show !== false);
  const currentIndex = visibleSections.findIndex(s => s.id === activeSection);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < visibleSections.length - 1;

  const handlePrev = () => {
    if (canGoPrev) {
      onSectionChange(visibleSections[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onSectionChange(visibleSections[currentIndex + 1].id);
    }
  };

  // Progress percentage
  const progressPercent = ((currentIndex + 1) / visibleSections.length) * 100;

  return (
    <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 py-3 px-4">
      <div className="flex items-center justify-between gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          disabled={!canGoPrev}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0",
            canGoPrev 
              ? "bg-slate-800 hover:bg-slate-700 text-white" 
              : "bg-slate-800/30 text-slate-600 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 justify-center">
          {visibleSections.map((section, index) => {
            const isActive = section.id === activeSection;
            const isPast = index < currentIndex;
            const Icon = section.icon;
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap",
                  isActive 
                    ? "bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-white border border-cyan-500/30" 
                    : isPast
                      ? "bg-slate-800/50 text-emerald-400 hover:bg-slate-700/50"
                      : "bg-slate-800/30 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-cyan-400" : isPast ? "text-emerald-400" : ""
                )} />
                <span className="text-xs font-medium hidden sm:block">
                  {t(section.labelKey) || section.fallbackLabel}
                </span>
                {/* Step indicator for mobile */}
                <span className="text-[10px] font-mono sm:hidden">
                  {index + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0",
            canGoNext 
              ? "bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white" 
              : "bg-slate-800/30 text-slate-600 cursor-not-allowed"
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Counter */}
      <div className="flex justify-center mt-2">
        <span className="text-[10px] text-slate-500">
          {currentIndex + 1} / {visibleSections.length}
        </span>
      </div>
    </div>
  );
};
