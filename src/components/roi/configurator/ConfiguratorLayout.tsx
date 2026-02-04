import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, PanelRightClose, PanelRight, Sparkles, FileText, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OIInputs } from "../useOICalculations";
import { Currency } from "../currencyUtils";
import { MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from "../useMortgageCalculations";
import { ConfiguratorSection, DEFAULT_OI_INPUTS, NEW_QUOTE_OI_INPUTS, SAMPLE_CLIENT_INFO, SAMPLE_MORTGAGE_INPUTS } from "./types";
import { toast } from "sonner";
import { ConfiguratorPreview } from "./ConfiguratorPreview";
import { LocationSection } from "./LocationSection";
import { PropertySection } from "./PropertySection";
import { PaymentSection } from "./PaymentSection";
import { AppreciationSection } from "./AppreciationSection";
import { RentalSection } from "./RentalSection";
import { ExitSection } from "./ExitSection";
import { ClientUnitData } from "../ClientUnitInfo";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DEFAULT_CLIENT_INFO: ClientUnitData = { 
  developer: '', 
  projectName: '', 
  clients: [], 
  brokerName: '', 
  unit: '', 
  unitSizeSqf: 0, 
  unitSizeM2: 0, 
  unitType: '' 
};

interface ConfiguratorLayoutProps {
  inputs: OIInputs;
  setInputs: React.Dispatch<React.SetStateAction<OIInputs>>;
  currency: Currency;
  onClose: () => void;
  mortgageInputs: MortgageInputs;
  setMortgageInputs: React.Dispatch<React.SetStateAction<MortgageInputs>>;
  clientInfo?: ClientUnitData;
  setClientInfo?: React.Dispatch<React.SetStateAction<ClientUnitData>>;
  quoteId?: string;
  isNewQuote?: boolean;
  // Image props
  floorPlanUrl?: string | null;
  buildingRenderUrl?: string | null;
  heroImageUrl?: string | null;
  showLogoOverlay?: boolean;
  onFloorPlanChange?: (url: string | null) => void;
  onBuildingRenderChange?: (url: string | null) => void;
  onHeroImageChange?: (url: string | null) => void;
  onShowLogoOverlayChange?: (show: boolean) => void;
}

// New 6-step sections
const SECTIONS: ConfiguratorSection[] = ['location', 'property', 'payment', 'appreciation', 'rental', 'exit'];

const SECTION_LABELS: Record<ConfiguratorSection, string> = {
  location: 'Location',
  property: 'Property',
  payment: 'Payment',
  appreciation: 'Growth',
  rental: 'Rental',
  exit: 'Exit',
};

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
const CONFIGURATOR_STATE_KEY = 'cashflow-configurator-state-v2';

interface ConfiguratorState {
  activeSection: ConfiguratorSection;
  visitedSections: ConfiguratorSection[];
}

const loadConfiguratorState = (): ConfiguratorState | null => {
  try {
    const saved = localStorage.getItem(CONFIGURATOR_STATE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      if (state.activeSection && !SECTIONS.includes(state.activeSection)) {
        localStorage.removeItem(CONFIGURATOR_STATE_KEY);
        return null;
      }
      if (state.visitedSections) {
        state.visitedSections = state.visitedSections.filter(
          (s: string) => SECTIONS.includes(s as ConfiguratorSection)
        );
      }
      return state;
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
  setMortgageInputs,
  clientInfo: externalClientInfo,
  setClientInfo: externalSetClientInfo,
  quoteId,
  isNewQuote,
  floorPlanUrl: externalFloorPlanUrl,
  buildingRenderUrl: externalBuildingRenderUrl,
  heroImageUrl: externalHeroImageUrl,
  showLogoOverlay: externalShowLogoOverlay,
  onFloorPlanChange,
  onBuildingRenderChange,
  onHeroImageChange,
  onShowLogoOverlayChange,
}: ConfiguratorLayoutProps) => {
  // Only load saved state if we have an existing quote (not new)
  const savedState = useMemo(() => {
    // Never load saved state for new quotes
    if (isNewQuote) return null;
    // Only load if we have a real quote with data
    if (!quoteId) return null;
    return loadConfiguratorState();
  }, [quoteId, isNewQuote]);
  
  const [internalClientInfo, setInternalClientInfo] = useState<ClientUnitData>(DEFAULT_CLIENT_INFO);
  const clientInfo = externalClientInfo || internalClientInfo;
  const setClientInfo = externalSetClientInfo || setInternalClientInfo;
  
  const [internalFloorPlanUrl, setInternalFloorPlanUrl] = useState<string | null>(null);
  const [internalBuildingRenderUrl, setInternalBuildingRenderUrl] = useState<string | null>(null);
  const [internalHeroImageUrl, setInternalHeroImageUrl] = useState<string | null>(null);
  const [internalShowLogoOverlay, setInternalShowLogoOverlay] = useState(true);
  
  const floorPlanUrl = externalFloorPlanUrl !== undefined ? externalFloorPlanUrl : internalFloorPlanUrl;
  const buildingRenderUrl = externalBuildingRenderUrl !== undefined ? externalBuildingRenderUrl : internalBuildingRenderUrl;
  const heroImageUrl = externalHeroImageUrl !== undefined ? externalHeroImageUrl : internalHeroImageUrl;
  const showLogoOverlay = externalShowLogoOverlay !== undefined ? externalShowLogoOverlay : internalShowLogoOverlay;
  
  const setFloorPlanUrl = onFloorPlanChange || setInternalFloorPlanUrl;
  const setBuildingRenderUrl = onBuildingRenderChange || setInternalBuildingRenderUrl;
  const setHeroImageUrl = onHeroImageChange || setInternalHeroImageUrl;
  const setShowLogoOverlay = onShowLogoOverlayChange || setInternalShowLogoOverlay;
  
  const [activeSection, setActiveSection] = useState<ConfiguratorSection>(
    savedState?.activeSection || 'location'
  );
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [visitedSections, setVisitedSections] = useState<Set<ConfiguratorSection>>(() => {
    const saved = savedState?.visitedSections || [];
    const startSection = savedState?.activeSection || 'location';
    return new Set([...saved, startSection]);
  });
  
  // Clear state and reset to step 1 for new quotes
  useEffect(() => {
    if (isNewQuote) {
      localStorage.removeItem(CONFIGURATOR_STATE_KEY);
      setActiveSection('location');
      setVisitedSections(new Set(['location']));
    }
  }, [isNewQuote]);
  
  useEffect(() => {
    if (!quoteId) {
      localStorage.removeItem(CONFIGURATOR_STATE_KEY);
    }
  }, [quoteId]);
  
  const previousSectionRef = useRef<ConfiguratorSection>(activeSection);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputsRef = useRef<string>(JSON.stringify(inputs));
  
  const [showCelebration, setShowCelebration] = useState(false);
  const hasShownCelebrationRef = useRef(false);
  const [showSampleFlash, setShowSampleFlash] = useState(false);

  useEffect(() => {
    saveConfiguratorState({
      activeSection,
      visitedSections: Array.from(visitedSections),
    });
  }, [activeSection, visitedSections]);

  const isSectionComplete = useCallback((section: ConfiguratorSection): boolean => {
    if (!visitedSections.has(section)) return false;
    
    const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
    const hasPostHandoverPlan = inputs.hasPostHandoverPlan ?? false;

    let totalPayment: number;
    if (hasPostHandoverPlan) {
      totalPayment = inputs.downpaymentPercent + additionalPaymentsTotal;
    } else {
      const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;
      totalPayment = preHandoverTotal + (100 - inputs.preHandoverPercent);
    }
    const isPaymentValid = Math.abs(totalPayment - 100) < 0.5;
    
    switch (section) {
      case 'location':
        return Boolean(clientInfo.zoneId);
      case 'property':
        return inputs.basePrice > 0;
      case 'payment':
        return inputs.preHandoverPercent > 0 && inputs.downpaymentPercent > 0 && isPaymentValid;
      case 'appreciation':
        return inputs.constructionAppreciation > 0 || inputs.growthAppreciation > 0 || inputs.matureAppreciation > 0;
      case 'rental':
        return inputs.rentalYieldPercent > 0;
      case 'exit':
        return true; // Optional - complete when visited
      default:
        return false;
    }
  }, [visitedSections, inputs, clientInfo.zoneId]);

  const completedSectionsCount = useMemo(() => {
    return SECTIONS.filter(section => isSectionComplete(section)).length;
  }, [isSectionComplete]);

  const progressPercent = Math.round((completedSectionsCount / SECTIONS.length) * 100);

  useEffect(() => {
    const currentInputs = JSON.stringify(inputs);
    if (currentInputs !== lastInputsRef.current) {
      lastInputsRef.current = currentInputs;
      setSaveStatus('saving');
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('saved');
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

  const currentIndex = SECTIONS.indexOf(activeSection);
  const canGoBack = currentIndex > 0;
  const isLastSection = currentIndex === SECTIONS.length - 1;
  const stepProgressPercent = (currentIndex / (SECTIONS.length - 1)) * 100;

  const canProceedFromCurrentSection = useMemo(() => {
    const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
    const hasPostHandoverPlan = inputs.hasPostHandoverPlan ?? false;

    let totalPayment: number;
    if (hasPostHandoverPlan) {
      totalPayment = inputs.downpaymentPercent + additionalPaymentsTotal;
    } else {
      const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;
      totalPayment = preHandoverTotal + (100 - inputs.preHandoverPercent);
    }
    const isPaymentValid = Math.abs(totalPayment - 100) < 0.5;
    
    switch (activeSection) {
      case 'location':
        return Boolean(clientInfo.zoneId);
      case 'property':
        return inputs.basePrice > 0;
      case 'payment':
        return inputs.preHandoverPercent > 0 && inputs.downpaymentPercent > 0 && isPaymentValid;
      case 'appreciation':
        return inputs.constructionAppreciation > 0 || inputs.growthAppreciation > 0 || inputs.matureAppreciation > 0;
      case 'rental':
        return inputs.rentalYieldPercent > 0;
      case 'exit':
        return true;
      default:
        return true;
    }
  }, [activeSection, inputs, clientInfo.zoneId]);

  const canGoForward = currentIndex < SECTIONS.length - 1 && canProceedFromCurrentSection;

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
    
    setVisitedSections(prev => {
      const newSet = new Set(prev);
      newSet.add(newSection);
      return newSet;
    });

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key >= '1' && e.key <= '6') {
        const index = parseInt(e.key) - 1;
        if (index < SECTIONS.length) {
          navigateToSection(SECTIONS[index]);
        }
      }
      if (e.key === 'ArrowRight' && canGoForward) {
        goToNextSection();
      }
      if (e.key === 'ArrowLeft' && canGoBack) {
        goToPreviousSection();
      }
      if (e.key.toLowerCase() === 'p') {
        togglePreview();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, canGoForward, goToNextSection, goToPreviousSection, navigateToSection, togglePreview, onClose]);

  const handleReset = () => {
    setInputs(NEW_QUOTE_OI_INPUTS);
    setVisitedSections(new Set());
  };

  const handleLoadSample = () => {
    const sampleInputs = {
      ...DEFAULT_OI_INPUTS,
      basePrice: DEFAULT_OI_INPUTS.basePrice || 2000000,
    };
    setInputs(sampleInputs);
    
    const sampleClientInfo = {
      ...SAMPLE_CLIENT_INFO,
      developer: SAMPLE_CLIENT_INFO.developer || 'Sample Developer',
      projectName: SAMPLE_CLIENT_INFO.projectName || 'Sample Project',
    };
    setClientInfo(sampleClientInfo);
    
    setMortgageInputs(SAMPLE_MORTGAGE_INPUTS);
    setVisitedSections(new Set(SECTIONS));
    
    setShowSampleFlash(true);
    setTimeout(() => setShowSampleFlash(false), 1500);
    
    toast.success('Sample data loaded! Your quote will auto-save shortly.');
  };

  const getAnimationClass = () => {
    if (!animationDirection) return '';
    return animationDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left';
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'location':
        return (
          <LocationSection
            clientInfo={clientInfo}
            onClientInfoChange={setClientInfo}
            inputs={inputs}
            setInputs={setInputs}
            floorPlanUrl={floorPlanUrl}
            buildingRenderUrl={buildingRenderUrl}
            heroImageUrl={heroImageUrl}
            onFloorPlanChange={setFloorPlanUrl}
            onBuildingRenderChange={setBuildingRenderUrl}
            onHeroImageChange={setHeroImageUrl}
          />
        );
      case 'property':
        return (
          <PropertySection 
            inputs={inputs} 
            setInputs={setInputs} 
            currency={currency}
          />
        );
      case 'payment':
        return (
          <PaymentSection 
            inputs={inputs} 
            setInputs={setInputs} 
            currency={currency}
          />
        );
      case 'appreciation':
        return (
          <AppreciationSection 
            inputs={inputs} 
            setInputs={setInputs} 
            currency={currency}
          />
        );
      case 'rental':
        return (
          <RentalSection 
            inputs={inputs} 
            setInputs={setInputs} 
            currency={currency}
          />
        );
      case 'exit':
        return (
          <ExitSection
            inputs={inputs}
            setInputs={setInputs}
            currency={currency}
            mortgageInputs={mortgageInputs}
            setMortgageInputs={setMortgageInputs}
          />
        );
      default:
        return null;
    }
  };

  const handleApplyAndClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <div className="flex flex-col h-full bg-theme-card relative overflow-hidden">
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
            <div className="bg-theme-bg-alt/90 backdrop-blur-sm rounded-2xl px-8 py-6 border border-theme-accent/30">
              <Sparkles className="w-12 h-12 text-theme-accent mx-auto mb-3 animate-pulse" />
              <h3 className="text-xl font-bold text-theme-text mb-1">All Set!</h3>
              <p className="text-theme-text-muted text-sm">Your investment is fully configured</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-bg-alt">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-theme-accent/20 rounded-lg">
            <SlidersHorizontal className="w-5 h-5 text-theme-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-theme-text">Investment Builder</h2>
            <p className="text-xs text-theme-text-muted">Step {currentIndex + 1} of {SECTIONS.length}: {SECTION_LABELS[activeSection]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePreview}
            className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt"
            title={isPreviewCollapsed ? "Show preview (P)" : "Hide preview (P)"}
          >
            {isPreviewCollapsed ? (
              <PanelRight className="w-4 h-4" />
            ) : (
              <PanelRightClose className="w-4 h-4" />
            )}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadSample}
                className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt"
              >
                <FileText className="w-4 h-4 mr-1" />
                Sample
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium mb-1">Load demo scenario:</p>
              <ul className="text-xs space-y-0.5 text-muted-foreground">
                <li>• AED 800,000 property</li>
                <li>• 20/80 payment split</li>
                <li>• 8.5% rental yield</li>
                <li>• 12% construction / 8% growth appreciation</li>
              </ul>
            </TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Middle Section */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Content Area */}
        <div 
          ref={contentScrollRef} 
          className={`flex-1 min-h-0 overflow-y-auto p-6 scroll-smooth transition-all duration-300 ${
            showSampleFlash ? 'bg-theme-accent/5 ring-2 ring-theme-accent/30 ring-inset' : ''
          }`}
        >
          <div 
            key={animationKey}
            className={`max-w-3xl mx-auto ${getAnimationClass()} ${showSampleFlash ? 'animate-pulse' : ''}`}
          >
            {renderSection()}
          </div>
        </div>

        {/* Preview Panel */}
        <div 
          className={`shrink-0 border-l border-theme-border bg-theme-bg overflow-y-auto transition-all duration-300 ease-in-out ${
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

      {/* Footer Navigation - Enhanced with progress bar */}
      <div className="shrink-0 border-t border-theme-border bg-theme-bg-alt">
        {/* Progress bar */}
        <div className="h-1 bg-theme-bg">
          <div 
            className="h-full bg-theme-accent transition-all duration-300"
            style={{ width: `${stepProgressPercent}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Back button */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousSection}
              disabled={!canGoBack}
              className="border-theme-border !bg-transparent text-theme-text-muted hover:bg-theme-card-alt hover:text-theme-text disabled:opacity-30 gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            
            {/* Hotkey hints */}
            <div className="hidden md:flex items-center gap-2 text-[10px] text-theme-text-muted/60">
              <span className="flex items-center gap-0.5">
                <kbd className="px-1 py-0.5 bg-theme-bg-alt/50 rounded border border-theme-border/50 text-[9px]">←</kbd>
                <kbd className="px-1 py-0.5 bg-theme-bg-alt/50 rounded border border-theme-border/50 text-[9px]">→</kbd>
              </span>
              <span className="flex items-center gap-0.5">
                <kbd className="px-1 py-0.5 bg-theme-bg-alt/50 rounded border border-theme-border/50 text-[9px]">1</kbd>
                <span>-</span>
                <kbd className="px-1 py-0.5 bg-theme-bg-alt/50 rounded border border-theme-border/50 text-[9px]">6</kbd>
              </span>
            </div>
          </div>

          {/* Center: Step indicators */}
          <div className="flex items-center gap-1.5">
            {SECTIONS.map((section, index) => {
              const isActive = section === activeSection;
              const isPast = index < currentIndex;
              
              return (
                <Tooltip key={section}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigateToSection(section)}
                      className="group"
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200",
                        isActive 
                          ? "bg-theme-accent text-theme-bg scale-110 ring-2 ring-theme-accent/30" 
                          : isPast
                            ? "bg-theme-accent/20 text-theme-accent"
                            : "bg-theme-bg-alt border border-theme-border text-theme-text-muted group-hover:border-theme-accent group-hover:text-theme-text"
                      )}>
                        {index + 1}
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {SECTION_LABELS[section]}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Right: Next/Apply button */}
          <div className="flex items-center gap-3">
            {isLastSection ? (
              <Button
                size="sm"
                onClick={handleApplyAndClose}
                className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90 font-semibold gap-1"
              >
                Apply & Close
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={goToNextSection}
                disabled={!canGoForward}
                className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90 font-semibold disabled:opacity-30 disabled:cursor-not-allowed gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
