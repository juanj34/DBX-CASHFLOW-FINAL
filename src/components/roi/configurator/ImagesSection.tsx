import { Image } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ImageUploadCard } from "./ImageUploadCard";

interface ImagesSectionProps {
  floorPlanUrl?: string | null;
  buildingRenderUrl?: string | null;
  heroImageUrl?: string | null;
  onFloorPlanChange?: (file: File | null) => void;
  onBuildingRenderChange?: (file: File | null) => void;
  onHeroImageChange?: (file: File | null) => void;
  showLogoOverlay?: boolean;
  onShowLogoOverlayChange?: (show: boolean) => void;
}

export const ImagesSection = ({
  floorPlanUrl,
  buildingRenderUrl,
  heroImageUrl,
  onFloorPlanChange,
  onBuildingRenderChange,
  onHeroImageChange,
  showLogoOverlay = true,
  onShowLogoOverlayChange,
}: ImagesSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Image className="w-5 h-5 text-purple-400" />
          Property Media
        </h3>
        <p className="text-sm text-theme-text-muted">Add visuals to enhance your investment presentation (optional)</p>
      </div>

      {/* Hero Image - Full Width */}
      {onHeroImageChange && (
        <ImageUploadCard
          label="Project Hero"
          sublabel="16:9 showcase background"
          imageUrl={heroImageUrl || null}
          onImageChange={onHeroImageChange}
          onRemove={() => onHeroImageChange(null)}
          aspectRatio="16/9"
          placeholder="Drag, paste (Ctrl+V), or click"
        />
      )}
      
      <div className="grid grid-cols-2 gap-4">
        {/* Floor Plan */}
        {onFloorPlanChange && (
          <ImageUploadCard
            label="Floor Plan"
            sublabel="Upload unit floor plan"
            imageUrl={floorPlanUrl || null}
            onImageChange={onFloorPlanChange}
            onRemove={() => onFloorPlanChange(null)}
            aspectRatio="4/3"
            placeholder="Drag, paste (Ctrl+V), or click"
          />
        )}

        {/* Building Render */}
        {onBuildingRenderChange && (
          <ImageUploadCard
            label="Building Render"
            sublabel="Upload project render"
            imageUrl={buildingRenderUrl || null}
            onImageChange={onBuildingRenderChange}
            onRemove={() => onBuildingRenderChange(null)}
            aspectRatio="16/9"
            placeholder="Drag, paste (Ctrl+V), or click"
          />
        )}
      </div>

      {/* Logo Overlay Toggle */}
      {buildingRenderUrl && onShowLogoOverlayChange && (
        <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#2a3142]">
          <div>
            <p className="text-sm font-medium text-white">Show Developer Logo</p>
            <p className="text-xs text-gray-500">Overlay developer logo on render</p>
          </div>
          <Switch
            checked={showLogoOverlay}
            onCheckedChange={onShowLogoOverlayChange}
            className="data-[state=checked]:bg-[#CCFF00]"
          />
        </div>
      )}

      {/* Info note */}
      <div className="text-xs text-theme-text-muted px-1">
        <p>📸 Images are optional but enhance your presentation. You can add them anytime.</p>
      </div>
    </div>
  );
};
