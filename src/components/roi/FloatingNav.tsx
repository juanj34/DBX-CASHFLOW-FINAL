import { useState, useEffect, useCallback } from "react";
import { Building2, CreditCard, Home, TrendingUp, Landmark, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface Section {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface FloatingNavProps {
  sections: Section[];
}

export const FloatingNav = ({ sections }: FloatingNavProps) => {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '');
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useLanguage();

  // Track scroll position and update active section
  const handleScroll = useCallback(() => {
    const scrollPosition = window.scrollY + 150;
    
    for (let i = sections.length - 1; i >= 0; i--) {
      const element = document.getElementById(sections[i].id);
      if (element) {
        const { offsetTop } = element;
        if (scrollPosition >= offsetTop) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    }
  }, [sections]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (sections.length === 0) return null;

  return (
    <div 
      className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden xl:block print:hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn(
        "bg-theme-card/95 backdrop-blur-sm border border-theme-border rounded-xl shadow-lg transition-all duration-300",
        isHovered ? "w-44" : "w-12"
      )}>
        <nav className="p-2 space-y-1">
          {sections.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            
            return (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={cn(
                  "w-full flex items-center rounded-lg text-sm font-medium transition-all",
                  isHovered ? "gap-3 px-3 py-2" : "justify-center p-2",
                  isActive
                    ? "bg-theme-accent/15 text-theme-accent"
                    : "text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50"
                )}
                title={!isHovered ? label : undefined}
              >
                <Icon className={cn(
                  "flex-shrink-0",
                  isActive ? "w-4 h-4" : "w-4 h-4"
                )} />
                {isHovered && <span className="truncate text-xs">{label}</span>}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// Pre-configured sections for the OI Calculator
export const useFloatingNavSections = (enabledSections?: { exitStrategy?: boolean; longTermHold?: boolean }, mortgageEnabled?: boolean) => {
  const { t } = useLanguage();
  
  const sections: Section[] = [
    { id: 'property-section', label: t('tabProperty'), icon: Building2 },
    { id: 'payments-section', label: t('tabPayments'), icon: CreditCard },
  ];
  
  if (enabledSections?.longTermHold !== false) {
    sections.push({ id: 'hold-section', label: t('tabHold'), icon: Home });
  }
  
  if (enabledSections?.exitStrategy !== false) {
    sections.push({ id: 'exit-section', label: t('tabExit'), icon: TrendingUp });
  }
  
  if (mortgageEnabled) {
    sections.push({ id: 'mortgage-section', label: t('tabMortgage'), icon: Landmark });
  }
  
  sections.push({ id: 'summary-section', label: t('tabSummary'), icon: FileText });
  
  return sections;
};
