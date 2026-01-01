import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, LucideIcon, Building2, Home, Ruler } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type StorySection = 'showcase' | 'entry' | 'income' | 'exit' | 'leverage';

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
  projectName?: string;
  unitType?: string;
  unitNumber?: string;
  unitSizeSqft?: number;
}

export const StoryNavigation = ({
  sections,
  activeSection,
  onSectionChange,
  projectName,
  unitType,
  unitNumber,
  unitSizeSqft,
}: StoryNavigationProps) => {
  const { t } = useLanguage();
  
  // Convert sqft to m²
  const unitSizeM2 = unitSizeSqft ? Math.round(unitSizeSqft * 0.092903) : null;
  
  // Capitalize first letter of unit type
  const formattedUnitType = unitType ? unitType.charAt(0).toUpperCase() + unitType.slice(1) : null;
  
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

  // Check if we have any reference info to show
  const hasReference = projectName || unitType || unitNumber || unitSizeSqft;

  return (
    <div className="sticky top-0 z-20 bg-theme-bg/95 backdrop-blur-sm border-b border-theme-border py-3 px-4">
      {/* Project Reference - Compact info bar */}
      {hasReference && (
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-1.5 rounded-lg bg-theme-card/60 border border-theme-border/50 flex-wrap justify-center">
            {/* Project Name */}
            {projectName && (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-xs font-semibold text-white truncate max-w-[140px] sm:max-w-none">{projectName}</span>
              </div>
            )}
            
            {/* Separator */}
            {projectName && (unitNumber || unitType) && (
              <div className="w-px h-3 bg-theme-border hidden sm:block" />
            )}
            
            {/* Unit Number & Type */}
            {(unitNumber || formattedUnitType) && (
              <div className="flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs text-white/90">
                  {unitNumber && <span className="font-medium">#{unitNumber}</span>}
                  {unitNumber && formattedUnitType && <span className="text-theme-text-muted mx-1">•</span>}
                  {formattedUnitType && <span className="text-theme-text-muted">{formattedUnitType}</span>}
                </span>
              </div>
            )}
            
            {/* Separator */}
            {(unitNumber || unitType) && unitSizeSqft && (
              <div className="w-px h-3 bg-theme-border hidden sm:block" />
            )}
            
            {/* Size */}
            {unitSizeSqft && (
              <div className="flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs text-theme-text-muted">
                  {unitSizeSqft.toLocaleString()} sqft
                  {unitSizeM2 && <span className="text-white/50 ml-1">({unitSizeM2} m²)</span>}
                </span>
              </div>
            )}
            
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          disabled={!canGoPrev}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0",
            canGoPrev 
              ? "bg-theme-card hover:bg-theme-card-alt text-white" 
              : "bg-theme-card/30 text-theme-text-muted cursor-not-allowed"
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
                      ? "bg-theme-card/50 text-emerald-400 hover:bg-theme-card-alt/50"
                      : "bg-theme-card/30 text-theme-text-muted hover:bg-theme-card-alt/50 hover:text-white"
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
              : "bg-theme-card/30 text-theme-text-muted cursor-not-allowed"
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-2 h-1 bg-theme-card rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Counter */}
      <div className="flex justify-center mt-2">
        <span className="text-[10px] text-theme-text-muted">
          {currentIndex + 1} / {visibleSections.length}
        </span>
      </div>
    </div>
  );
};
