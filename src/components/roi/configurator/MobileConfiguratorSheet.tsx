import { useState, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, RotateCcw, Wallet, FileText } from "lucide-react";

// Haptic feedback utility for tactile response on mobile devices
const triggerHapticFeedback = (pattern: number | number[] = 10) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { OIInputs } from "../useOICalculations";
import { Currency, formatCurrency } from "../currencyUtils";
import { MortgageInputs, DEFAULT_MORTGAGE_INPUTS } from "../useMortgageCalculations";
import { ConfiguratorSection, DEFAULT_OI_INPUTS, NEW_QUOTE_OI_INPUTS, SAMPLE_CLIENT_INFO, SAMPLE_MORTGAGE_INPUTS } from "./types";
import { ClientSection } from "./ClientSection";
import { InvestmentSection } from "./InvestmentSection";
import { ReturnsSection } from "./ReturnsSection";
import { ExtrasSection } from "./ExtrasSection";
import { ClientUnitData } from "../ClientUnitInfo";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MobileConfiguratorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputs: OIInputs;
  setInputs: React.Dispatch<React.SetStateAction<OIInputs>>;
  currency: Currency;
  mortgageInputs: MortgageInputs;
  setMortgageInputs: React.Dispatch<React.SetStateAction<MortgageInputs>>;
  clientInfo?: ClientUnitData;
  setClientInfo?: React.Dispatch<React.SetStateAction<ClientUnitData>>;
  quoteId?: string;
}

const SECTIONS: ConfiguratorSection[] = ['project', 'investment', 'returns', 'extras'];

const SECTION_LABELS: Record<ConfiguratorSection, string> = {
  project: 'Project',
  investment: 'Investment',
  returns: 'Returns',
  extras: 'More',
};

// Mini preview strip component with mortgage toggle
const MiniPreviewStrip = ({ 
  inputs, 
  currency, 
  mortgageEnabled, 
  onToggleMortgage 
}: { 
  inputs: OIInputs; 
  currency: Currency; 
  mortgageEnabled: boolean;
  onToggleMortgage: () => void;
}) => {
  const paymentSplit = `${inputs.preHandoverPercent}/${100 - inputs.preHandoverPercent}`;
  
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-theme-bg-alt rounded-lg border border-theme-border">
      <div className="flex items-center gap-1.5 min-w-0">
        <Wallet className="w-3.5 h-3.5 text-theme-accent flex-shrink-0" />
        <span className="text-[10px] text-theme-text-muted truncate">
          {formatCurrency(inputs.basePrice, currency)} • {paymentSplit}
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
  mortgageInputs,
  setMortgageInputs,
  clientInfo,
  setClientInfo,
  quoteId,
}: MobileConfiguratorSheetProps) => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<ConfiguratorSection>('project');
  const [visitedSections, setVisitedSections] = useState<Set<ConfiguratorSection>>(new Set());
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [showSampleFlash, setShowSampleFlash] = useState(false);
  
  // Image upload state
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null);
  const [buildingRenderUrl, setBuildingRenderUrl] = useState<string | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [showLogoOverlay, setShowLogoOverlay] = useState(false);
  
  // Internal client info state if not provided externally
  const [internalClientInfo, setInternalClientInfo] = useState<ClientUnitData>({
    clientName: '',
    clientCountry: '',
    projectName: '',
    developer: '',
    brokerName: '',
    unit: '',
    unitType: '',
    unitSizeSqf: 0,
    unitSizeM2: 0,
    clients: [],
    clientShares: [],
    splitEnabled: false,
  });
  
  const effectiveClientInfo = clientInfo || internalClientInfo;
  const effectiveSetClientInfo = setClientInfo || setInternalClientInfo;
  
  // Swipe gesture state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const minSwipeDistance = 50;

  const currentIndex = SECTIONS.indexOf(activeSection);
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < SECTIONS.length - 1;
  const isLastSection = currentIndex === SECTIONS.length - 1;

  // Image upload handlers
  const handleFloorPlanUpload = async (file: File | null) => {
    if (!file) {
      setFloorPlanUrl(null);
      return;
    }
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${quoteId || 'temp'}/floor-plan-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('quote-images')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('quote-images')
        .getPublicUrl(data.path);
      
      setFloorPlanUrl(urlData.publicUrl);
      toast.success('Floor plan uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload floor plan');
    }
  };

  const handleBuildingRenderUpload = async (file: File | null) => {
    if (!file) {
      setBuildingRenderUrl(null);
      return;
    }
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${quoteId || 'temp'}/building-render-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('quote-images')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('quote-images')
        .getPublicUrl(data.path);
      
      setBuildingRenderUrl(urlData.publicUrl);
      toast.success('Building render uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload building render');
    }
  };

  const handleHeroImageUpload = async (file: File | null) => {
    if (!file) {
      setHeroImageUrl(null);
      return;
    }
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${quoteId || 'temp'}/hero-image-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('quote-images')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('quote-images')
        .getPublicUrl(data.path);
      
      setHeroImageUrl(urlData.publicUrl);
      toast.success('Hero image uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload hero image');
    }
  };

  const isSectionComplete = useCallback((section: ConfiguratorSection): boolean => {
    // Must be visited first AND have actual data
    if (!visitedSections.has(section)) return false;
    
    // Calculate payment validity
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
      case 'project':
        return Boolean(inputs.zoneId) || inputs.basePrice > 0;
      case 'investment':
        return inputs.basePrice > 0 && isPaymentValid;
      case 'returns':
        return inputs.constructionAppreciation > 0 || inputs.growthAppreciation > 0 || inputs.matureAppreciation > 0;
      case 'extras':
        // Optional - complete when visited
        return true;
      default:
        return false;
    }
  }, [visitedSections, inputs]);

  const completedCount = SECTIONS.filter(s => isSectionComplete(s)).length;
  const progressPercent = Math.round((completedCount / SECTIONS.length) * 100);

  const navigateToSection = useCallback((newSection: ConfiguratorSection, direction?: 'left' | 'right') => {
    const newIndex = SECTIONS.indexOf(newSection);
    const oldIndex = SECTIONS.indexOf(activeSection);
    
    if (!direction) {
      direction = newIndex > oldIndex ? 'right' : 'left';
    }
    
    setAnimationDirection(direction);
    setActiveSection(newSection);
    
    // Mark section as visited
    setVisitedSections(prev => {
      const newSet = new Set(prev);
      newSet.add(newSection);
      return newSet;
    });
    
    triggerHapticFeedback();
  }, [activeSection]);

  const goToNextSection = useCallback(() => {
    if (canGoForward) {
      navigateToSection(SECTIONS[currentIndex + 1], 'right');
    }
  }, [canGoForward, currentIndex, navigateToSection]);

  const goToPreviousSection = useCallback(() => {
    if (canGoBack) {
      navigateToSection(SECTIONS[currentIndex - 1], 'left');
    }
  }, [canGoBack, currentIndex, navigateToSection]);

  // Swipe handling
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
      goToNextSection();
    }
    if (isRightSwipe && canGoBack) {
      goToPreviousSection();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleLoadSample = () => {
    setInputs({
      ...DEFAULT_OI_INPUTS,
      basePrice: DEFAULT_OI_INPUTS.basePrice || 2000000,
    });
    
    if (effectiveSetClientInfo) {
      effectiveSetClientInfo({
        ...SAMPLE_CLIENT_INFO,
        developer: SAMPLE_CLIENT_INFO.developer || 'Sample Developer',
        projectName: SAMPLE_CLIENT_INFO.projectName || 'Sample Project',
      });
    }
    
    setMortgageInputs(SAMPLE_MORTGAGE_INPUTS);
    setVisitedSections(new Set(SECTIONS));
    
    setShowSampleFlash(true);
    setTimeout(() => setShowSampleFlash(false), 1500);
    
    toast.success('Sample data loaded!');
  };

  const handleReset = () => {
    setInputs(NEW_QUOTE_OI_INPUTS);
    setVisitedSections(new Set());
    toast.info('Configuration reset');
  };

  const getAnimationClass = () => {
    if (!animationDirection) return '';
    return animationDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left';
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'project':
        return (
          <ClientSection
            clientInfo={effectiveClientInfo}
            onClientInfoChange={effectiveSetClientInfo}
            quoteId={quoteId}
            inputs={inputs}
            setInputs={setInputs}
          />
        );
      case 'investment':
        return (
          <InvestmentSection 
            inputs={inputs} 
            setInputs={setInputs} 
            currency={currency}
          />
        );
      case 'returns':
        return (
          <ReturnsSection 
            inputs={inputs} 
            setInputs={setInputs} 
            currency={currency}
          />
        );
      case 'extras':
        return (
          <ExtrasSection
            inputs={inputs}
            setInputs={setInputs}
            currency={currency}
            mortgageInputs={mortgageInputs}
            setMortgageInputs={setMortgageInputs}
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-theme-card border-t border-theme-border max-h-[90vh]">
        {/* Header */}
        <DrawerHeader className="border-b border-theme-border pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold text-theme-text">
              {t('investmentConfigurator') || 'Investment Configurator'}
            </DrawerTitle>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadSample}
                    className="h-8 w-8 p-0 text-theme-text-muted hover:text-theme-text"
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Load sample data</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 w-8 p-0 text-theme-text-muted hover:text-theme-text"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset</TooltipContent>
              </Tooltip>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 text-theme-text-muted hover:text-theme-text"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2">
            {SECTIONS.map((section, index) => {
              const isActive = section === activeSection;
              const isPast = index < currentIndex;
              
              return (
                <button
                  key={section}
                  onClick={() => navigateToSection(section)}
                  className="group"
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200",
                    isActive 
                      ? "bg-theme-accent text-theme-bg scale-110 ring-2 ring-theme-accent/30" 
                      : isPast
                        ? "bg-theme-accent/20 text-theme-accent"
                        : "bg-theme-bg-alt border border-theme-border text-theme-text-muted"
                  )}>
                    {index + 1}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Mini preview */}
          <MiniPreviewStrip 
            inputs={inputs} 
            currency={currency}
            mortgageEnabled={mortgageInputs.enabled}
            onToggleMortgage={() => setMortgageInputs(prev => ({ ...prev, enabled: !prev.enabled }))}
          />
        </DrawerHeader>
        
        {/* Content */}
        <div 
          ref={contentRef}
          className={cn(
            "flex-1 overflow-y-auto p-4",
            showSampleFlash && "bg-theme-accent/5"
          )}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className={getAnimationClass()}>
            {renderSection()}
          </div>
        </div>
        
        {/* Footer */}
        <DrawerFooter className="border-t border-theme-border pt-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousSection}
              disabled={!canGoBack}
              className="border-theme-border text-theme-text-muted disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            
            <span className="text-xs text-theme-text-muted">
              {currentIndex + 1} / {SECTIONS.length}
            </span>
            
            {isLastSection ? (
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90 font-semibold"
              >
                Apply & Close
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={goToNextSection}
                className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90 font-semibold"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
