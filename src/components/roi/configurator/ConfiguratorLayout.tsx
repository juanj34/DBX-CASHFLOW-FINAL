import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, PanelRightClose, PanelRight, Check, Loader2, Sparkles, FileText, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OIInputs } from "../useOICalculations";
import { Currency } from "../currencyUtils";
import { MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from "../useMortgageCalculations";
import { ConfiguratorSection, DEFAULT_OI_INPUTS, NEW_QUOTE_OI_INPUTS, SAMPLE_CLIENT_INFO, SAMPLE_MORTGAGE_INPUTS } from "./types";
import { toast } from "sonner";
import { ConfiguratorPreview } from "./ConfiguratorPreview";
import { ClientSection } from "./ClientSection";
import { PropertySection } from "./PropertySection";
import { PaymentSection } from "./PaymentSection";
import { ValueSection } from "./ValueSection";
import { AppreciationSection } from "./AppreciationSection";
import { ExitsSection } from "./ExitsSection";
import { RentSection } from "./RentSection";
import { MortgageSection } from "./MortgageSection";
import { ImagesSection } from "./ImagesSection";
import { ClientUnitData } from "../ClientUnitInfo";
import { supabase } from "@/integrations/supabase/client";
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

const SECTIONS: ConfiguratorSection[] = ['client', 'property', 'images', 'payment', 'value', 'appreciation', 'exits', 'rent', 'mortgage'];

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
  setMortgageInputs,
  clientInfo: externalClientInfo,
  setClientInfo: externalSetClientInfo,
  quoteId,
  floorPlanUrl: externalFloorPlanUrl,
  buildingRenderUrl: externalBuildingRenderUrl,
  heroImageUrl: externalHeroImageUrl,
  showLogoOverlay: externalShowLogoOverlay,
  onFloorPlanChange,
  onBuildingRenderChange,
  onHeroImageChange,
  onShowLogoOverlayChange,
}: ConfiguratorLayoutProps) => {
  // Only load saved state if we have a quoteId (editing existing quote)
  // For new quotes (no quoteId), always start fresh
  const savedState = quoteId ? loadConfiguratorState() : null;
  
  // Internal client info state (used if external not provided)
  const [internalClientInfo, setInternalClientInfo] = useState<ClientUnitData>(DEFAULT_CLIENT_INFO);
  const clientInfo = externalClientInfo || internalClientInfo;
  const setClientInfo = externalSetClientInfo || setInternalClientInfo;
  
  // Image state - use external if provided, otherwise internal
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
    savedState?.activeSection || 'client'  // Start from client section
  );
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [visitedSections, setVisitedSections] = useState<Set<ConfiguratorSection>>(
    new Set(savedState?.visitedSections || [])
  );
  
  // Clear localStorage when starting a new quote (no quoteId)
  useEffect(() => {
    if (!quoteId) {
      localStorage.removeItem(CONFIGURATOR_STATE_KEY);
    }
  }, [quoteId]);
  const previousSectionRef = useRef<ConfiguratorSection>(activeSection);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-save indicator states
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputsRef = useRef<string>(JSON.stringify(inputs));
  
  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const hasShownCelebrationRef = useRef(false);
  
  // Sample data flash animation
  const [showSampleFlash, setShowSampleFlash] = useState(false);

  // Persist configurator state to localStorage
  useEffect(() => {
    saveConfiguratorState({
      activeSection,
      visitedSections: Array.from(visitedSections),
    });
  }, [activeSection, visitedSections]);

  // Check if a specific section is complete (based on actual data AND visited)
  const isSectionComplete = useCallback((section: ConfiguratorSection): boolean => {
    // ALL sections must be visited first to be complete
    if (!visitedSections.has(section)) return false;
    
    // Calculate payment validation
    const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
    const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;
    const totalPayment = preHandoverTotal + (100 - inputs.preHandoverPercent);
    const isPaymentValid = Math.abs(totalPayment - 100) < 0.01;
    
    switch (section) {
      case 'client':
        // Client is complete when there's a zone selected (stored in clientInfo)
        return Boolean(clientInfo.zoneId);
      case 'property':
        return inputs.basePrice > 0;
      case 'images':
        // Media is optional - always complete when visited
        return true;
      case 'payment':
        // Must have valid payment plan adding up to 100%
        return inputs.preHandoverPercent > 0 && inputs.downpaymentPercent > 0 && isPaymentValid;
      case 'value':
        // Value is optional - complete when visited
        return true;
      case 'appreciation':
        return inputs.constructionAppreciation > 0 || inputs.growthAppreciation > 0 || inputs.matureAppreciation > 0;
      case 'exits':
        return inputs._exitScenarios && inputs._exitScenarios.length > 0;
      case 'rent':
        return inputs.rentalYieldPercent > 0;
      case 'mortgage':
        // Mortgage is optional - complete when visited
        return true;
      default:
        return false;
    }
  }, [visitedSections, inputs, clientInfo.zoneId]);

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
  const isLastSection = currentIndex === SECTIONS.length - 1;
  
  // Progress for the visual bar - based on current section index position
  // First step (index 0) = 0%, last step (index 8) = 100%
  const stepProgressPercent = (currentIndex / (SECTIONS.length - 1)) * 100;

  // Validation for current section
  const canProceedFromCurrentSection = useMemo(() => {
    // Calculate payment validation
    const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
    const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;
    const totalPayment = preHandoverTotal + (100 - inputs.preHandoverPercent);
    const isPaymentValid = Math.abs(totalPayment - 100) < 0.01;
    
    switch (activeSection) {
      case 'client':
        // Client section requires zone selection (stored in clientInfo, not inputs)
        return Boolean(clientInfo.zoneId);
      case 'property':
        return inputs.basePrice > 0;
      case 'payment':
        return inputs.preHandoverPercent > 0 && inputs.downpaymentPercent > 0 && isPaymentValid;
      case 'appreciation':
        return inputs.constructionAppreciation > 0 || inputs.growthAppreciation > 0 || inputs.matureAppreciation > 0;
      case 'rent':
        return inputs.rentalYieldPercent > 0;
      case 'exits':
        // Allow proceeding if exits are disabled OR if there are exit scenarios
        return !inputs.enabledSections?.exitStrategy || (inputs._exitScenarios && inputs._exitScenarios.length > 0);
      // Optional sections
      case 'value':
      case 'mortgage':
      case 'images':
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
      
      // Number keys 1-9 for section navigation
      if (e.key >= '1' && e.key <= '9') {
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
    setInputs(NEW_QUOTE_OI_INPUTS);
    setVisitedSections(new Set());
  };

  const handleLoadSample = () => {
    // Set all OI inputs with sample data
    setInputs(DEFAULT_OI_INPUTS);
    
    // Set client info with sample data
    setClientInfo(SAMPLE_CLIENT_INFO);
    
    // Set mortgage inputs with sample data
    setMortgageInputs(SAMPLE_MORTGAGE_INPUTS);
    
    // Mark all sections as visited
    setVisitedSections(new Set(SECTIONS));
    
    // Trigger flash animation
    setShowSampleFlash(true);
    setTimeout(() => setShowSampleFlash(false), 1500);
    
    // Show toast notification
    toast.success('Sample data loaded! Explore all sections to see how the tool works.');
  };

  const getAnimationClass = () => {
    if (!animationDirection) return '';
    return animationDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left';
  };

  // Image upload handlers
  const handleFloorPlanUpload = async (file: File | null) => {
    if (!file) {
      setFloorPlanUrl(null);
      return;
    }
    
    try {
      const fileName = `floor-plan-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('quote-images')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('quote-images')
        .getPublicUrl(data.path);
      
      setFloorPlanUrl(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading floor plan:', error);
    }
  };

  const handleBuildingRenderUpload = async (file: File | null) => {
    if (!file) {
      setBuildingRenderUrl(null);
      return;
    }
    
    try {
      const fileName = `building-render-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('quote-images')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('quote-images')
        .getPublicUrl(data.path);
      
      setBuildingRenderUrl(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading building render:', error);
    }
  };

  const handleHeroImageUpload = async (file: File | null) => {
    if (!file) {
      setHeroImageUrl(null);
      return;
    }
    
    try {
      const fileName = `hero-image-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('quote-images')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('quote-images')
        .getPublicUrl(data.path);
      
      setHeroImageUrl(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading hero image:', error);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'client':
        return (
          <ClientSection
            clientInfo={clientInfo}
            onClientInfoChange={setClientInfo}
            quoteId={quoteId}
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
      case 'images':
        return (
          <ImagesSection
            floorPlanUrl={floorPlanUrl}
            buildingRenderUrl={buildingRenderUrl}
            heroImageUrl={heroImageUrl}
            onFloorPlanChange={handleFloorPlanUpload}
            onBuildingRenderChange={handleBuildingRenderUpload}
            onHeroImageChange={handleHeroImageUpload}
            showLogoOverlay={showLogoOverlay}
            onShowLogoOverlayChange={setShowLogoOverlay}
          />
        );
      default:
        return null;
    }
  };

  // Handle Apply & Close
  const handleApplyAndClose = useCallback(() => {
    // Close immediately (no delay) so the modal always dismisses reliably.
    onClose();
  }, [onClose]);

  return (
    <div className="flex flex-col h-full bg-theme-card relative overflow-hidden">
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
            <div className="bg-theme-bg-alt/90 backdrop-blur-sm rounded-2xl px-8 py-6 border border-theme-accent/30">
              <Sparkles className="w-12 h-12 text-theme-accent mx-auto mb-3 animate-pulse" />
              <h3 className="text-xl font-bold text-theme-text mb-1">All Set!</h3>
              <p className="text-theme-text-muted text-sm">Your investment is fully configured</p>
            </div>
          </div>
        </div>
      )}

      {/* Header - Fixed */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-bg-alt">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-theme-accent/20 rounded-lg">
            <SlidersHorizontal className="w-5 h-5 text-theme-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-theme-text">Investment Builder</h2>
            <p className="text-xs text-theme-text-muted">Configure your property investment</p>
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
            className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Middle Section - Content only, no sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Content Area - Scrollable */}
        <div 
          ref={contentScrollRef} 
          className={`flex-1 min-h-0 overflow-y-auto p-6 scroll-smooth transition-all duration-300 ${
            showSampleFlash ? 'bg-[#CCFF00]/5 ring-2 ring-[#CCFF00]/30 ring-inset' : ''
          }`}
        >
          <div 
            key={animationKey}
            className={`max-w-3xl mx-auto ${getAnimationClass()} ${showSampleFlash ? 'animate-pulse' : ''}`}
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

      {/* Footer Navigation with Step Progress */}
      <div className="shrink-0 border-t border-theme-border bg-theme-bg-alt">
        {/* Progress Steps */}
        <div className="px-6 py-3 border-b border-theme-border/50">
          <div className="flex items-start justify-between relative">
            {/* Progress line behind steps */}
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-theme-border" />
            <div 
              className="absolute top-3 left-0 h-0.5 bg-gradient-to-r from-theme-accent to-green-400 transition-all duration-500 ease-out"
              style={{ width: `${stepProgressPercent}%` }}
            >
              {/* Glowing end marker */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-theme-accent shadow-[0_0_8px_2px_rgba(var(--accent-rgb),0.6)]" />
            </div>
            
            {/* Step indicators */}
            {SECTIONS.map((section, index) => {
              const isComplete = isSectionComplete(section);
              const isActive = section === activeSection;
              const stepLabels: Record<ConfiguratorSection, string> = {
                client: 'Client',
                property: 'Property',
                images: 'Media',
                payment: 'Payment',
                value: 'Value',
                appreciation: 'Growth',
                exits: 'Exits',
                rent: 'Rent',
                mortgage: 'Mortgage',
              };
              
              return (
                <button
                  key={section}
                  onClick={() => navigateToSection(section)}
                  className="flex flex-col items-center gap-1.5 relative z-10 group"
                >
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200
                    ${isActive 
                      ? 'bg-theme-accent text-theme-bg ring-4 ring-theme-accent/20 scale-110' 
                      : isComplete 
                        ? 'bg-green-500 text-white' 
                        : 'bg-theme-card border-2 border-theme-border-alt text-theme-text-muted group-hover:border-theme-text-muted'
                    }
                  `}>
                    {isComplete && !isActive ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium transition-colors ${
                    isActive 
                      ? 'text-theme-accent' 
                      : isComplete 
                        ? 'text-green-400' 
                        : 'text-theme-text-muted group-hover:text-theme-text'
                  }`}>
                    {stepLabels[section]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex items-center justify-between px-6 py-3">
          <Button
            variant="outline"
            onClick={goToPreviousSection}
            disabled={!canGoBack}
            className="border-theme-border !bg-transparent text-theme-text-muted hover:bg-theme-card-alt hover:text-theme-text disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <span className="text-xs font-medium text-theme-text-muted">
            Step {currentIndex + 1} of {SECTIONS.length} • {progressPercent}% complete
          </span>

          {isLastSection ? (
            <Button
              onClick={handleApplyAndClose}
              className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90 font-semibold"
            >
              Apply & Close
            </Button>
          ) : (
            <div className="flex flex-col items-end gap-1">
              {!canProceedFromCurrentSection && activeSection === 'payment' && (
                <span className="text-xs text-amber-400">Payment plan must equal 100%</span>
              )}
              <Button
                onClick={goToNextSection}
                disabled={!canGoForward}
                className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90 font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
