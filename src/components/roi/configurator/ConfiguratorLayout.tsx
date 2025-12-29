import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, RotateCcw, PanelRightClose, PanelRight, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OIInputs } from "../useOICalculations";
import { Currency } from "../currencyUtils";
import { MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from "../useMortgageCalculations";
import { ConfiguratorSection, DEFAULT_OI_INPUTS } from "./types";
import { ConfiguratorSidebar } from "./ConfiguratorSidebar";
import { ConfiguratorPreview } from "./ConfiguratorPreview";
import { PropertySection } from "./PropertySection";
import { PaymentSection } from "./PaymentSection";
import { ValueSection } from "./ValueSection";
import { AppreciationSection } from "./AppreciationSection";
import { ExitsSection } from "./ExitsSection";
import { RentSection } from "./RentSection";
import { MortgageSection } from "./MortgageSection";

interface ConfiguratorLayoutProps {
  inputs: OIInputs;
  setInputs: React.Dispatch<React.SetStateAction<OIInputs>>;
  currency: Currency;
  onClose: () => void;
  mortgageInputs: MortgageInputs;
  setMortgageInputs: React.Dispatch<React.SetStateAction<MortgageInputs>>;
}

const SECTIONS: ConfiguratorSection[] = ['property', 'payment', 'value', 'appreciation', 'exits', 'rent', 'mortgage'];

// Confetti particle component
const ConfettiParticle = ({ delay, color }: { delay: number; color: string }) => (
  <div
    className="absolute w-2 h-2 rounded-full animate-confetti"
    style={{
      backgroundColor: color,
      left: `${Math.random() * 100}%`,
      animationDelay: `${delay}ms`,
    }}
  />
);

// Storage key for configurator state
const CONFIGURATOR_STATE_KEY = 'cashflow-configurator-state';

interface ConfiguratorState {
  activeSection: ConfiguratorSection;
  visitedSections: ConfiguratorSection[];
}

const loadConfiguratorState = (): ConfiguratorState | null => {
  try {
    const saved = localStorage.getItem(CONFIGURATOR_STATE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading configurator state:', e);
  }
  return null;
};

const saveConfiguratorState = (state: ConfiguratorState) => {
  try {
    localStorage.setItem(CONFIGURATOR_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving configurator state:', e);
  }
};

export const ConfiguratorLayout = ({ 
  inputs, 
  setInputs, 
  currency, 
  onClose,
  mortgageInputs,
  setMortgageInputs
}: ConfiguratorLayoutProps) => {
  // Load initial state from localStorage
  const savedState = loadConfiguratorState();
  
  const [activeSection, setActiveSection] = useState<ConfiguratorSection>(
    savedState?.activeSection || 'property'
  );
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [visitedSections, setVisitedSections] = useState<Set<ConfiguratorSection>>(
    new Set(savedState?.visitedSections || ['property'])
  );
  const previousSectionRef = useRef<ConfiguratorSection>(activeSection);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-save indicator states
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputsRef = useRef<string>(JSON.stringify(inputs));
  
  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const hasShownCelebrationRef = useRef(false);

  // Persist configurator state to localStorage
  useEffect(() => {
    saveConfiguratorState({
      activeSection,
      visitedSections: Array.from(visitedSections),
    });
  }, [activeSection, visitedSections]);

  // Check if a specific section is complete (visited + valid data)
  const isSectionComplete = useCallback((section: ConfiguratorSection): boolean => {
    if (!visitedSections.has(section)) return false;
    
    switch (section) {
      case 'property':
        return inputs.basePrice > 0;
      case 'payment':
        return inputs.downpaymentPercent > 0 && inputs.preHandoverPercent >= 0;
      case 'value':
        return true; // differentiators are optional
      case 'appreciation':
        return inputs.constructionAppreciation > 0 || inputs.growthAppreciation > 0 || inputs.matureAppreciation > 0;
      case 'exits':
        return true; // exits are optional
      case 'rent':
        return inputs.rentalYieldPercent > 0;
      case 'mortgage':
        return true; // mortgage is optional
      default:
        return false;
    }
  }, [visitedSections, inputs]);

  // Calculate completed sections count
  const completedSectionsCount = useMemo(() => {
    return SECTIONS.filter(section => isSectionComplete(section)).length;
  }, [isSectionComplete]);

  // Progress based on COMPLETED sections, not just visited
  const progressPercent = Math.round((completedSectionsCount / SECTIONS.length) * 100);

  // Auto-save effect - detect input changes
  useEffect(() => {
    const currentInputs = JSON.stringify(inputs);
    if (currentInputs !== lastInputsRef.current) {
      lastInputsRef.current = currentInputs;
      setSaveStatus('saving');
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Simulate save delay (inputs are already being saved by parent)
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('saved');
        // Reset to idle after showing "saved"
        saveTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      }, 500);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [inputs]);

  // Celebration removed from progressPercent - will trigger on Apply & Close instead

  const currentIndex = SECTIONS.indexOf(activeSection);
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < SECTIONS.length - 1;
  const isLastSection = currentIndex === SECTIONS.length - 1;

  const navigateToSection = useCallback((newSection: ConfiguratorSection) => {
    const newIndex = SECTIONS.indexOf(newSection);
    const oldIndex = SECTIONS.indexOf(previousSectionRef.current);
    
    if (newIndex > oldIndex) {
      setAnimationDirection('right');
    } else if (newIndex < oldIndex) {
      setAnimationDirection('left');
    } else {
      setAnimationDirection(null);
    }
    
    previousSectionRef.current = newSection;
    setAnimationKey(prev => prev + 1);
    setActiveSection(newSection);
    
    // Mark section as visited
    setVisitedSections(prev => {
      const newSet = new Set(prev);
      newSet.add(newSection);
      return newSet;
    });

    // Smooth scroll to top of content area
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToNextSection = useCallback(() => {
    if (canGoForward) {
      navigateToSection(SECTIONS[currentIndex + 1]);
    }
  }, [canGoForward, currentIndex, navigateToSection]);

  const goToPreviousSection = useCallback(() => {
    if (canGoBack) {
      navigateToSection(SECTIONS[currentIndex - 1]);
    }
  }, [canGoBack, currentIndex, navigateToSection]);

  const togglePreview = useCallback(() => {
    setIsPreviewCollapsed(prev => !prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Number keys 1-5 for section navigation
      if (e.key >= '1' && e.key <= '5') {
        const index = parseInt(e.key) - 1;
        if (index < SECTIONS.length) {
          navigateToSection(SECTIONS[index]);
        }
      }
      // Arrow keys for next/prev
      if (e.key === 'ArrowRight' && canGoForward) {
        goToNextSection();
      }
      if (e.key === 'ArrowLeft' && canGoBack) {
        goToPreviousSection();
      }
      // P key to toggle preview
      if (e.key.toLowerCase() === 'p') {
        togglePreview();
      }
      // Escape to close
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, canGoForward, goToNextSection, goToPreviousSection, navigateToSection, togglePreview, onClose]);

  const handleReset = () => {
    setInputs(DEFAULT_OI_INPUTS);
  };

  const getAnimationClass = () => {
    if (!animationDirection) return '';
    return animationDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left';
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'property':
        return <PropertySection inputs={inputs} setInputs={setInputs} currency={currency} />;
      case 'payment':
        return <PaymentSection inputs={inputs} setInputs={setInputs} currency={currency} />;
      case 'value':
        return <ValueSection inputs={inputs} setInputs={setInputs} currency={currency} />;
      case 'appreciation':
        return <AppreciationSection inputs={inputs} setInputs={setInputs} currency={currency} />;
      case 'exits':
        return <ExitsSection inputs={inputs} setInputs={setInputs} currency={currency} />;
      case 'rent':
        return <RentSection inputs={inputs} setInputs={setInputs} currency={currency} />;
      case 'mortgage':
        return <MortgageSection inputs={inputs} setInputs={setInputs} currency={currency} mortgageInputs={mortgageInputs} setMortgageInputs={setMortgageInputs} />;
      default:
        return null;
    }
  };

  // Handle Apply & Close with celebration
  const handleApplyAndClose = useCallback(() => {
    if (!hasShownCelebrationRef.current) {
      hasShownCelebrationRef.current = true;
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        onClose();
      }, 2500);
    } else {
      onClose();
    }
  }, [onClose]);

  return (
    <div className="flex flex-col h-full bg-[#1a1f2e] relative overflow-hidden">
      {/* Celebration confetti overlay */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <ConfettiParticle 
              key={i} 
              delay={i * 50} 
              color={['#CCFF00', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899'][i % 5]} 
            />
          ))}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center animate-scale-in">
            <div className="bg-[#0d1117]/90 backdrop-blur-sm rounded-2xl px-8 py-6 border border-[#CCFF00]/30">
              <Sparkles className="w-12 h-12 text-[#CCFF00] mx-auto mb-3 animate-pulse" />
              <h3 className="text-xl font-bold text-white mb-1">All Set!</h3>
              <p className="text-gray-400 text-sm">Your investment is fully configured</p>
            </div>
          </div>
        </div>
      )}

      {/* Header - Fixed */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#2a3142] bg-[#0d1117]">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Investment Configurator</h2>
          
          {/* Auto-save indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
                <span className="text-gray-400">Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check className="w-3 h-3 text-green-400" />
                <span className="text-green-400">Saved</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePreview}
            className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
            title={isPreviewCollapsed ? "Show preview (P)" : "Hide preview (P)"}
          >
            {isPreviewCollapsed ? (
              <PanelRight className="w-4 h-4" />
            ) : (
              <PanelRightClose className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Middle Section - Flex row with scroll */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar - Fixed width, own scroll */}
        <div className="shrink-0 overflow-y-auto">
          <ConfiguratorSidebar
            activeSection={activeSection}
            onSectionChange={navigateToSection}
            inputs={inputs}
            visitedSections={visitedSections}
          />
        </div>

        {/* Content Area - Scrollable */}
        <div ref={contentScrollRef} className="flex-1 min-h-0 overflow-y-auto p-6 scroll-smooth">
          <div 
            key={animationKey}
            className={`max-w-3xl ${getAnimationClass()}`}
          >
            {renderSection()}
          </div>
        </div>

        {/* Preview Panel - Collapsible, own scroll */}
        <div 
          className={`shrink-0 border-l border-[#2a3142] bg-[#0d1117] overflow-y-auto transition-all duration-300 ease-in-out ${
            isPreviewCollapsed ? 'w-14 p-2' : 'w-64 p-4'
          }`}
        >
          <ConfiguratorPreview 
            inputs={inputs} 
            currency={currency} 
            isCollapsed={isPreviewCollapsed}
            onToggleCollapse={togglePreview}
          />
        </div>
      </div>

      {/* Footer Navigation - Fixed at bottom, OUTSIDE scroll */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-[#2a3142] bg-[#0d1117]">
        <Button
          variant="outline"
          onClick={goToPreviousSection}
          disabled={!canGoBack}
          className="border-[#2a3142] !bg-transparent text-gray-300 hover:bg-[#2a3142] hover:text-white disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        {/* Progress bar with milestone markers */}
        <div className="flex flex-col items-center gap-2">
          {/* Animated progress bar */}
          <div className="relative w-48 h-1.5 bg-[#2a3142] rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#CCFF00] to-green-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Milestone markers */}
            {SECTIONS.map((section, index) => {
              const position = ((index + 1) / SECTIONS.length) * 100;
              const isComplete = isSectionComplete(section);
              return (
                <div
                  key={section}
                  className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
                    isComplete 
                      ? 'bg-[#CCFF00] border-[#CCFF00] scale-110' 
                      : 'bg-[#1a1f2e] border-[#3a4152]'
                  }`}
                  style={{ left: `calc(${position}% - 5px)` }}
                />
              );
            })}
          </div>
          
          {/* Section dots with completion checkmarks */}
          <div className="flex items-center gap-2">
            {SECTIONS.map((section) => {
              const isComplete = isSectionComplete(section);
              const isActive = section === activeSection;
              return (
                <button
                  key={section}
                  onClick={() => navigateToSection(section)}
                  className={`relative flex items-center justify-center transition-all duration-200 ${
                    isActive 
                      ? 'w-6 h-6 rounded-full bg-[#CCFF00]/20 border-2 border-[#CCFF00]' 
                      : 'w-5 h-5 rounded-full hover:scale-110'
                  } ${
                    !isActive && isComplete 
                      ? 'bg-green-500/20 border-2 border-green-500' 
                      : !isActive ? 'bg-[#2a3142] border-2 border-transparent' : ''
                  }`}
                >
                  {isComplete && !isActive && (
                    <Check className="w-3 h-3 text-green-400" />
                  )}
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-[#CCFF00]" />
                  )}
                </button>
              );
            })}
            <span className="text-xs font-medium text-gray-400 ml-1">
              {progressPercent}%
            </span>
          </div>
        </div>

        {isLastSection ? (
          <Button
            onClick={handleApplyAndClose}
            className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold"
          >
            Apply & Close
          </Button>
        ) : (
          <Button
            onClick={goToNextSection}
            disabled={!canGoForward}
            className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold disabled:opacity-30"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};
