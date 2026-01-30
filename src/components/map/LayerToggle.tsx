import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Layers, ChevronDown, ChevronUp, MapIcon, Train, MapPin, Building2, Camera } from "lucide-react";

interface LayerToggleProps {
  zonesVisible: boolean;
  hotspotsVisible: boolean;
  projectsVisible: boolean;
  metroLinesVisible: boolean;
  landmarksVisible?: boolean;
  onZonesToggle: (visible: boolean) => void;
  onHotspotsToggle: (visible: boolean) => void;
  onProjectsToggle: (visible: boolean) => void;
  onMetroLinesToggle: (visible: boolean) => void;
  onLandmarksToggle?: (visible: boolean) => void;
}

export const LayerToggle = ({
  zonesVisible,
  hotspotsVisible,
  projectsVisible,
  metroLinesVisible,
  landmarksVisible = true,
  onZonesToggle,
  onHotspotsToggle,
  onProjectsToggle,
  onMetroLinesToggle,
  onLandmarksToggle,
}: LayerToggleProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-theme-card/95 border border-theme-border backdrop-blur-xl rounded-lg overflow-hidden w-48">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-theme-card-alt/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-theme-text-muted" />
          <span className="text-sm font-medium text-theme-text">Map Layers</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-theme-text-muted" />
        ) : (
          <ChevronUp className="w-4 h-4 text-theme-text-muted" />
        )}
      </button>

      {/* Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-theme-text-muted" />
              <Label htmlFor="zones-toggle" className="text-sm text-theme-text">Zones</Label>
            </div>
            <Switch
              id="zones-toggle"
              checked={zonesVisible}
              onCheckedChange={onZonesToggle}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Train className="w-4 h-4 text-theme-text-muted" />
                <Label htmlFor="metro-toggle" className="text-sm text-theme-text">Metro Lines</Label>
              </div>
              <Switch
                id="metro-toggle"
                checked={metroLinesVisible}
                onCheckedChange={onMetroLinesToggle}
              />
            </div>
            {/* Metro Lines Legend */}
            {metroLinesVisible && (
                <div className="ml-6 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-[#EF4444]" />
                  <span className="text-theme-text-muted">Red</span>
                  <div className="w-6 h-0.5 bg-[#22C55E]" />
                  <span className="text-theme-text-muted">Green</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-[#3B82F6]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #3B82F6 0px, #3B82F6 4px, transparent 4px, transparent 6px)' }} />
                  <span className="text-theme-text-muted">Blue (2029)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-[#F59E0B]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #F59E0B 0px, #F59E0B 2px, transparent 2px, transparent 4px)' }} />
                  <span className="text-theme-text-muted">Gold</span>
                  <div className="w-6 h-0.5 bg-[#8B5CF6]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #8B5CF6 0px, #8B5CF6 2px, transparent 2px, transparent 4px)' }} />
                  <span className="text-theme-text-muted">Purple</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-theme-text-muted" />
              <Label htmlFor="hotspots-toggle" className="text-sm text-theme-text">Hotspots</Label>
            </div>
            <Switch
              id="hotspots-toggle"
              checked={hotspotsVisible}
              onCheckedChange={onHotspotsToggle}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-theme-text-muted" />
              <Label htmlFor="projects-toggle" className="text-sm text-theme-text">Projects</Label>
            </div>
            <Switch
              id="projects-toggle"
              checked={projectsVisible}
              onCheckedChange={onProjectsToggle}
            />
          </div>

          {onLandmarksToggle && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-theme-text-muted" />
                <Label htmlFor="landmarks-toggle" className="text-sm text-theme-text">Landmarks</Label>
              </div>
              <Switch
                id="landmarks-toggle"
                checked={landmarksVisible}
                onCheckedChange={onLandmarksToggle}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
