import { useState } from "react";
import { Sparkles, Image, Landmark, ChevronDown, ChevronUp } from "lucide-react";
import { ValueSection } from "./ValueSection";
import { ImagesSection } from "./ImagesSection";
import { MortgageSection } from "./MortgageSection";
import { ConfiguratorSectionProps } from "./types";
import { MortgageInputs } from "../useMortgageCalculations";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  iconColor?: string;
  badge?: string;
}

const CollapsibleCard = ({ title, subtitle, icon, isOpen, onToggle, children, iconColor = "text-theme-accent", badge }: CollapsibleCardProps) => (
  <div className="border border-theme-border rounded-xl overflow-hidden bg-theme-card">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 hover:bg-theme-bg-alt/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg bg-theme-accent/10",
          iconColor.includes("purple") && "bg-purple-500/10",
          iconColor.includes("amber") && "bg-amber-500/10"
        )}>
          {icon}
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-theme-text">{title}</h4>
            {badge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-theme-text-muted/20 text-theme-text-muted">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-theme-text-muted">{subtitle}</p>}
        </div>
      </div>
      {isOpen ? (
        <ChevronUp className="w-4 h-4 text-theme-text-muted" />
      ) : (
        <ChevronDown className="w-4 h-4 text-theme-text-muted" />
      )}
    </button>
    <div className={cn(
      "overflow-hidden transition-all duration-300",
      isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
    )}>
      <div className="p-4 pt-2 border-t border-theme-border">
        {children}
      </div>
    </div>
  </div>
);

interface ExtrasSectionProps extends ConfiguratorSectionProps {
  mortgageInputs: MortgageInputs;
  setMortgageInputs: React.Dispatch<React.SetStateAction<MortgageInputs>>;
  // Image props
  floorPlanUrl?: string | null;
  buildingRenderUrl?: string | null;
  heroImageUrl?: string | null;
  showLogoOverlay?: boolean;
  onFloorPlanChange?: (file: File | null) => void;
  onBuildingRenderChange?: (file: File | null) => void;
  onHeroImageChange?: (file: File | null) => void;
  onShowLogoOverlayChange?: (show: boolean) => void;
}

export const ExtrasSection = ({ 
  inputs, 
  setInputs, 
  currency,
  mortgageInputs,
  setMortgageInputs,
  floorPlanUrl,
  buildingRenderUrl,
  heroImageUrl,
  showLogoOverlay,
  onFloorPlanChange,
  onBuildingRenderChange,
  onHeroImageChange,
  onShowLogoOverlayChange,
}: ExtrasSectionProps) => {
  // All sections collapsed by default since they're optional
  const [valueOpen, setValueOpen] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [mortgageOpen, setMortgageOpen] = useState(false);

  // Count value differentiators
  const diffCount = inputs.valueDifferentiators?.length || 0;
  // Count uploaded images
  const imageCount = [floorPlanUrl, buildingRenderUrl, heroImageUrl].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-theme-text mb-1">More Options</h3>
        <p className="text-sm text-theme-text-muted">Optional: value differentiators, images, and financing</p>
      </div>

      <CollapsibleCard
        title="Value Differentiators"
        subtitle="Features that boost appreciation"
        icon={<Sparkles className="w-4 h-4 text-theme-accent" />}
        isOpen={valueOpen}
        onToggle={() => setValueOpen(!valueOpen)}
        badge={diffCount > 0 ? `${diffCount} selected` : "optional"}
      >
        <ValueSection inputs={inputs} setInputs={setInputs} currency={currency} />
      </CollapsibleCard>

      <CollapsibleCard
        title="Property Images"
        subtitle="Hero, floor plan, building render"
        icon={<Image className="w-4 h-4 text-purple-400" />}
        isOpen={imagesOpen}
        onToggle={() => setImagesOpen(!imagesOpen)}
        iconColor="text-purple-400"
        badge={imageCount > 0 ? `${imageCount} uploaded` : "optional"}
      >
        <ImagesSection
          floorPlanUrl={floorPlanUrl}
          buildingRenderUrl={buildingRenderUrl}
          heroImageUrl={heroImageUrl}
          onFloorPlanChange={onFloorPlanChange}
          onBuildingRenderChange={onBuildingRenderChange}
          onHeroImageChange={onHeroImageChange}
          showLogoOverlay={showLogoOverlay}
          onShowLogoOverlayChange={onShowLogoOverlayChange}
        />
      </CollapsibleCard>

      <CollapsibleCard
        title="Mortgage Calculator"
        subtitle="Post-handover financing options"
        icon={<Landmark className="w-4 h-4 text-amber-400" />}
        isOpen={mortgageOpen}
        onToggle={() => setMortgageOpen(!mortgageOpen)}
        iconColor="text-amber-400"
        badge={mortgageInputs.enabled ? "enabled" : "optional"}
      >
        <MortgageSection 
          inputs={inputs} 
          setInputs={setInputs} 
          currency={currency} 
          mortgageInputs={mortgageInputs}
          setMortgageInputs={setMortgageInputs}
        />
      </CollapsibleCard>

      {/* Tip */}
      <div className="text-xs text-theme-text-muted px-1">
        <p>💡 These sections are optional. Expand them to add more details to your investment analysis.</p>
      </div>
    </div>
  );
};
