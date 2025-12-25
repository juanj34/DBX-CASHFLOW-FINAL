import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, RotateCcw, PanelRightClose, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OIInputs } from "../useOICalculations";
import { Currency } from "../currencyUtils";
import { ConfiguratorSection, DEFAULT_OI_INPUTS } from "./types";
import { ConfiguratorSidebar } from "./ConfiguratorSidebar";
import { ConfiguratorPreview } from "./ConfiguratorPreview";
import { PropertySection } from "./PropertySection";
import { PaymentSection } from "./PaymentSection";
import { ValueSection } from "./ValueSection";
import { IncomeSection } from "./IncomeSection";
import { AppreciationSection } from "./AppreciationSection";

interface ConfiguratorLayoutProps {
  inputs: OIInputs;
  setInputs: React.Dispatch<React.SetStateAction<OIInputs>>;
  currency: Currency;
  onClose: () => void;
}

const SECTIONS: ConfiguratorSection[] = ['property', 'payment', 'value', 'income', 'appreciation'];

export const ConfiguratorLayout = ({ 
  inputs, 
  setInputs, 
  currency, 
  onClose 
}: ConfiguratorLayoutProps) => {
  const [activeSection, setActiveSection] = useState<ConfiguratorSection>('property');
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const previousSectionRef = useRef<ConfiguratorSection>(activeSection);

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
      case 'income':
        return <IncomeSection inputs={inputs} setInputs={setInputs} currency={currency} />;
      case 'appreciation':
        return <AppreciationSection inputs={inputs} setInputs={setInputs} currency={currency} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1f2e]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3142] bg-[#0d1117]">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Investment Configurator</h2>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span className="px-2 py-0.5 bg-[#1a1f2e] rounded">1-5</span>
            <span>sections</span>
            <span className="px-2 py-0.5 bg-[#1a1f2e] rounded ml-2">←/→</span>
            <span>navigate</span>
            <span className="px-2 py-0.5 bg-[#1a1f2e] rounded ml-2">P</span>
            <span>preview</span>
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

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <ConfiguratorSidebar
          activeSection={activeSection}
          onSectionChange={navigateToSection}
          inputs={inputs}
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div 
              key={animationKey}
              className={`max-w-3xl ${getAnimationClass()}`}
            >
              {renderSection()}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a3142] bg-[#0d1117]">
            <Button
              variant="outline"
              onClick={goToPreviousSection}
              disabled={!canGoBack}
              className="border-[#2a3142] text-gray-300 hover:bg-[#2a3142] hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-1.5">
              {SECTIONS.map((section, index) => (
                <button
                  key={section}
                  onClick={() => navigateToSection(section)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    section === activeSection 
                      ? 'bg-[#CCFF00] w-6' 
                      : index < currentIndex
                        ? 'bg-green-500'
                        : 'bg-[#2a3142]'
                  }`}
                />
              ))}
            </div>

            {isLastSection ? (
              <Button
                onClick={onClose}
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

        {/* Preview Panel - Collapsible */}
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
    </div>
  );
};
