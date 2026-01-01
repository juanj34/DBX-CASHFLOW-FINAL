import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, LucideIcon, Building2, Home, Ruler, ChevronDown } from "lucide-react";
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
  const [isReferenceExpanded, setIsReferenceExpanded] = useState(false);
  
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

  // Compact summary for mobile collapsed state
  const compactSummary = projectName || (unitNumber ? `#${unitNumber}` : formattedUnitType) || '';

  return (
    <div className="sticky top-0 z-20 bg-theme-bg/95 backdrop-blur-sm border-b border-theme-border py-2 px-3">
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          disabled={!canGoPrev}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0",
            canGoPrev 
              ? "bg-theme-card hover:bg-theme-card-alt text-white" 
              : "bg-theme-card/30 text-theme-text-muted cursor-not-allowed"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Project Reference Badge - Desktop inline */}
        {hasReference && (
          <>
            {/* Mobile: Compact collapsible */}
            <button
              onClick={() => setIsReferenceExpanded(!isReferenceExpanded)}
              className="sm:hidden inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-theme-card/60 border border-theme-border/50 shrink-0"
            >
              <Building2 className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] font-medium text-white truncate max-w-[80px]">{compactSummary}</span>
              <ChevronDown className={cn(
                "w-3 h-3 text-theme-text-muted transition-transform duration-200",
                isReferenceExpanded && "rotate-180"
              )} />
            </button>

            {/* Mobile: Expanded dropdown */}
            <div className={cn(
              "sm:hidden absolute left-3 right-3 top-[44px] bg-theme-card/95 backdrop-blur-sm border border-theme-border/50 rounded-lg p-2.5 shadow-lg transition-all duration-200 z-30",
              isReferenceExpanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
            )}>
              <div className="flex flex-col gap-1.5">
                {projectName && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="text-[10px] font-semibold text-white">{projectName}</span>
                  </div>
                )}
                {(unitNumber || formattedUnitType) && (
                  <div className="flex items-center gap-1.5">
                    <Home className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] text-white/90">
                      {unitNumber && <span className="font-medium">#{unitNumber}</span>}
                      {unitNumber && formattedUnitType && <span className="text-theme-text-muted mx-1">•</span>}
                      {formattedUnitType && <span className="text-theme-text-muted">{formattedUnitType}</span>}
                    </span>
                  </div>
                )}
                {unitSizeSqft && (
                  <div className="flex items-center gap-1.5">
                    <Ruler className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="text-[10px] text-theme-text-muted">
                      {unitSizeSqft.toLocaleString()} sqft
                      {unitSizeM2 && <span className="text-white/50 ml-1">({unitSizeM2} m²)</span>}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop: Compact inline badge */}
            <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-theme-card/60 border border-theme-border/50 shrink-0">
              {projectName && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-semibold text-white">{projectName}</span>
                </div>
              )}
              {projectName && (unitNumber || unitType) && (
                <div className="w-px h-2.5 bg-theme-border" />
              )}
              {(unitNumber || formattedUnitType) && (
                <span className="text-[10px] text-white/80">
                  {unitNumber && <span className="font-medium">#{unitNumber}</span>}
                  {unitNumber && formattedUnitType && <span className="text-theme-text-muted mx-0.5">•</span>}
                  {formattedUnitType}
                </span>
              )}
              {(unitNumber || unitType) && unitSizeSqft && (
                <div className="w-px h-2.5 bg-theme-border" />
              )}
              {unitSizeSqft && (
                <span className="text-[10px] text-theme-text-muted">
                  {unitSizeSqft.toLocaleString()} sqft
                </span>
              )}
            </div>
          </>
        )}

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
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap",
                  isActive 
                    ? "bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-white border border-cyan-500/30" 
                    : isPast
                      ? "bg-theme-card/50 text-emerald-400 hover:bg-theme-card-alt/50"
                      : "bg-theme-card/30 text-theme-text-muted hover:bg-theme-card-alt/50 hover:text-white"
                )}
              >
                <Icon className={cn(
                  "w-3.5 h-3.5 shrink-0",
                  isActive ? "text-cyan-400" : isPast ? "text-emerald-400" : ""
                )} />
                <span className="text-[10px] font-medium hidden sm:block">
                  {t(section.labelKey) || section.fallbackLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step Counter - Inline */}
        <span className="text-[10px] text-theme-text-muted font-mono shrink-0">
          {currentIndex + 1}/{visibleSections.length}
        </span>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0",
            canGoNext 
              ? "bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white" 
              : "bg-theme-card/30 text-theme-text-muted cursor-not-allowed"
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Thin Progress Bar */}
      <div className="mt-1.5 h-0.5 bg-theme-card/50 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
