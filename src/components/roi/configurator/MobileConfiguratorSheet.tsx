import { useState, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Check, RotateCcw, TrendingUp, Home, Wallet } from "lucide-react";

// Haptic feedback utility for tactile response on mobile devices
const triggerHapticFeedback = (pattern: number | number[] = 10) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { OIInputs } from "../useOICalculations";
import { Currency, formatCurrency } from "../currencyUtils";
import { ConfiguratorSection, DEFAULT_OI_INPUTS } from "./types";
import { PropertySection } from "./PropertySection";
import { PaymentSection } from "./PaymentSection";
import { ValueSection } from "./ValueSection";
import { IncomeSection } from "./IncomeSection";
import { AppreciationSection } from "./AppreciationSection";
import { useLanguage } from "@/contexts/LanguageContext";

interface MobileConfiguratorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputs: OIInputs;
  setInputs: React.Dispatch<React.SetStateAction<OIInputs>>;
  currency: Currency;
}

const SECTIONS: ConfiguratorSection[] = ['property', 'payment', 'value', 'income', 'appreciation'];

const SECTION_LABELS: Record<ConfiguratorSection, string> = {
  property: 'Property',
  payment: 'Payment',
  value: 'Value',
  income: 'Income',
  appreciation: 'Growth',
};

// Mini preview strip component
const MiniPreviewStrip = ({ inputs, currency }: { inputs: OIInputs; currency: Currency }) => {
  const paymentSplit = `${inputs.preHandoverPercent}/${100 - inputs.preHandoverPercent}`;
  
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#0d1117] rounded-lg border border-[#2a3142]">
      <div className="flex items-center gap-1.5 min-w-0">
        <Wallet className="w-3.5 h-3.5 text-[#CCFF00] flex-shrink-0" />
        <span className="text-[10px] text-theme-text-muted truncate">
          {formatCurrency(inputs.basePrice, currency)}
        </span>
      </div>
      <div className="w-px h-4 bg-[#2a3142]" />
      <div className="flex items-center gap-1.5 min-w-0">
        <Home className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
        <span className="text-[10px] text-theme-text-muted truncate">
          {paymentSplit}
        </span>
      </div>
      <div className="w-px h-4 bg-[#2a3142]" />
      <div className="flex items-center gap-1.5 min-w-0">
        <TrendingUp className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
        <span className="text-[10px] text-theme-text-muted truncate">
          {inputs.rentalYieldPercent}% yield
        </span>
      </div>
    </div>
  );
};

export const MobileConfiguratorSheet = ({
  open,
  onOpenChange,
  inputs,
  setInputs,
  currency,
}: MobileConfiguratorSheetProps) => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<ConfiguratorSection>('property');
  const [visitedSections, setVisitedSections] = useState<Set<ConfiguratorSection>>(new Set(['property']));
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  
  // Swipe gesture state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const minSwipeDistance = 50;

  const currentIndex = SECTIONS.indexOf(activeSection);
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < SECTIONS.length - 1;
  const isLastSection = currentIndex === SECTIONS.length - 1;

  const isSectionComplete = useCallback((section: ConfiguratorSection): boolean => {
    if (!visitedSections.has(section)) return false;
    
    switch (section) {
      case 'property':
        return inputs.basePrice > 0;
      case 'payment':
        return inputs.downpaymentPercent > 0 && inputs.preHandoverPercent >= 0;
      case 'value':
        return true;
      case 'income':
        return inputs.rentalYieldPercent > 0;
      case 'appreciation':
        return inputs.constructionAppreciation > 0 || inputs.growthAppreciation > 0 || inputs.matureAppreciation > 0;
      default:
        return false;
    }
  }, [visitedSections, inputs]);

  const completedCount = SECTIONS.filter(s => isSectionComplete(s)).length;
  const progressPercent = Math.round((completedCount / SECTIONS.length) * 100);

  const navigateToSection = useCallback((newSection: ConfiguratorSection, direction?: 'left' | 'right') => {
    const newIndex = SECTIONS.indexOf(newSection);
    const oldIndex = SECTIONS.indexOf(activeSection);
    
    if (direction) {
      setAnimationDirection(direction);
    } else if (newIndex > oldIndex) {
      setAnimationDirection('right');
    } else if (newIndex < oldIndex) {
      setAnimationDirection('left');
    }
    
    // Trigger haptic feedback on section navigation
    triggerHapticFeedback(15);
    
    setActiveSection(newSection);
    setVisitedSections(prev => new Set(prev).add(newSection));
    
    // Reset animation after transition
    setTimeout(() => setAnimationDirection(null), 300);
  }, [activeSection]);

  const goToNextSection = useCallback(() => {
    if (canGoForward) {
      triggerHapticFeedback(10);
      navigateToSection(SECTIONS[currentIndex + 1], 'right');
    }
  }, [canGoForward, currentIndex, navigateToSection]);

  const goToPreviousSection = useCallback(() => {
    if (canGoBack) {
      triggerHapticFeedback(10);
      navigateToSection(SECTIONS[currentIndex - 1], 'left');
    }
  }, [canGoBack, currentIndex, navigateToSection]);

  // Touch handlers for swipe gestures
  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && canGoForward) {
      // Haptic feedback on successful swipe
      triggerHapticFeedback(10);
      goToNextSection();
    } else if (isRightSwipe && canGoBack) {
      // Haptic feedback on successful swipe
      triggerHapticFeedback(10);
      goToPreviousSection();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleReset = () => {
    setInputs(DEFAULT_OI_INPUTS);
  };

  const handleClose = () => {
    onOpenChange(false);
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[#1a1f2e] border-t border-[#2a3142] max-h-[90vh]">
        {/* Header */}
        <DrawerHeader className="border-b border-[#2a3142] pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold text-white">
              {t('investmentConfigurator') || 'Investment Configurator'}
            </DrawerTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-gray-400 hover:text-white hover:bg-[#2a3142] h-8 px-2"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-gray-400 hover:text-white hover:bg-[#2a3142] h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mini Preview Strip */}
          <MiniPreviewStrip inputs={inputs} currency={currency} />

          {/* Section Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {SECTIONS.map((section, index) => {
              const isActive = section === activeSection;
              const isComplete = isSectionComplete(section);
              
              return (
                <button
                  key={section}
                  onClick={() => navigateToSection(section)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#CCFF00] text-black'
                      : isComplete
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-[#2a3142] text-gray-400'
                  }`}
                >
                  {isComplete && !isActive && <Check className="w-3 h-3" />}
                  <span>{index + 1}. {SECTION_LABELS[section]}</span>
                </button>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span className="flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" />
                <span>{t('swipeToNavigate') || 'Swipe to navigate'}</span>
                <ChevronRight className="w-3 h-3" />
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1 bg-[#2a3142] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#CCFF00] to-green-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </DrawerHeader>

        {/* Content - Scrollable with swipe gestures */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto p-4 max-h-[50vh]"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className={`transition-transform duration-300 ${getAnimationClass()}`}>
            {renderSection()}
          </div>
        </div>

        {/* Footer Navigation */}
        <DrawerFooter className="border-t border-[#2a3142] pt-3 pb-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={goToPreviousSection}
              disabled={!canGoBack}
              className="flex-1 border-[#2a3142] bg-transparent text-gray-300 hover:bg-[#2a3142] hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('previous') || 'Previous'}
            </Button>

            {isLastSection ? (
              <Button
                onClick={handleClose}
                className="flex-1 bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold"
              >
                {t('applyClose') || 'Apply & Close'}
              </Button>
            ) : (
              <Button
                onClick={goToNextSection}
                disabled={!canGoForward}
                className="flex-1 bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold disabled:opacity-30"
              >
                {t('next') || 'Next'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
