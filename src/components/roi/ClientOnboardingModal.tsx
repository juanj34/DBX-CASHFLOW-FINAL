import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, CreditCard, Home, TrendingUp, MessageCircle, ChevronRight, ChevronLeft, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "hasSeenClientOnboarding";

interface ClientOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advisorName?: string;
  onContactAdvisor?: () => void;
}

const steps = [
  { icon: Rocket, colorClass: "text-[#CCFF00]", bgClass: "bg-[#CCFF00]/20" },
  { icon: CreditCard, colorClass: "text-blue-400", bgClass: "bg-blue-500/20" },
  { icon: Home, colorClass: "text-purple-400", bgClass: "bg-purple-500/20" },
  { icon: TrendingUp, colorClass: "text-green-400", bgClass: "bg-green-500/20" },
  { icon: MessageCircle, colorClass: "text-amber-400", bgClass: "bg-amber-500/20" },
];

export const ClientOnboardingModal = ({ 
  open, 
  onOpenChange, 
  advisorName,
  onContactAdvisor 
}: ClientOnboardingModalProps) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onOpenChange(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem(STORAGE_KEY, "true");
      onOpenChange(false);
      if (onContactAdvisor) {
        onContactAdvisor();
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const StepIcon = steps[currentStep].icon;

  // Dynamic step 5 description with advisor name
  const getStep5Desc = () => {
    const baseText = t('clientOnboardingStep5Desc');
    if (advisorName) {
      return baseText.replace('{advisor}', advisorName);
    }
    return baseText.replace('{advisor}', t('wealthAdvisor'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white max-w-md p-0 overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with icon */}
        <div className="pt-8 pb-4 px-6 text-center">
          <div className={`inline-flex p-4 rounded-2xl ${steps[currentStep].bgClass} mb-4`}>
            <StepIcon className={`w-10 h-10 ${steps[currentStep].colorClass}`} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {currentStep === 0 && t('clientOnboardingStep1Title')}
            {currentStep === 1 && t('clientOnboardingStep2Title')}
            {currentStep === 2 && t('clientOnboardingStep3Title')}
            {currentStep === 3 && t('clientOnboardingStep4Title')}
            {currentStep === 4 && t('clientOnboardingStep5Title')}
          </h2>
          <p className="text-gray-400">
            {currentStep === 0 && t('clientOnboardingStep1Desc')}
            {currentStep === 1 && t('clientOnboardingStep2Desc')}
            {currentStep === 2 && t('clientOnboardingStep3Desc')}
            {currentStep === 3 && t('clientOnboardingStep4Desc')}
            {currentStep === 4 && getStep5Desc()}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? "bg-[#CCFF00] w-6"
                  : index < currentStep
                  ? "bg-[#CCFF00]/50"
                  : "bg-[#2a3142]"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-4">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1 border-[#2a3142] text-gray-300 hover:bg-[#2a3142]"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('back') || 'Back'}
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={`flex-1 font-semibold ${
                currentStep === steps.length - 1
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
              }`}
            >
              {currentStep < steps.length - 1 ? (
                <>
                  {t('next') || 'Next'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {t('contactAdvisor')}
                </>
              )}
            </Button>
          </div>

          {/* Don't show again checkbox */}
          <label className="flex items-center justify-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-[#2a3142] bg-[#0d1117] text-[#CCFF00]"
            />
            {t('dontShowAgain')}
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const useClientOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenOnboarding) {
      // Delay slightly to let the page load first
      const timer = setTimeout(() => setShowOnboarding(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  return { showOnboarding, setShowOnboarding };
};
