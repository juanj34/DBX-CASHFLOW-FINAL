import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Layers, ChevronDown, ChevronUp } from "lucide-react";

interface LayerToggleProps {
  zonesVisible: boolean;
  hotspotsVisible: boolean;
  projectsVisible: boolean;
  metroLinesVisible: boolean;
  onZonesToggle: (visible: boolean) => void;
  onHotspotsToggle: (visible: boolean) => void;
  onProjectsToggle: (visible: boolean) => void;
  onMetroLinesToggle: (visible: boolean) => void;
}

export const LayerToggle = ({
  zonesVisible,
  hotspotsVisible,
  projectsVisible,
  metroLinesVisible,
  onZonesToggle,
  onHotspotsToggle,
  onProjectsToggle,
  onMetroLinesToggle,
}: LayerToggleProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 glass-panel rounded-lg overflow-hidden w-48">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-smooth"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span className="text-sm font-medium">Map Layers</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
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
            <Label htmlFor="zones-toggle" className="text-sm">Zones</Label>
            <Switch
              id="zones-toggle"
              checked={zonesVisible}
              onCheckedChange={onZonesToggle}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="metro-toggle" className="text-sm">Metro Lines</Label>
            <Switch
              id="metro-toggle"
              checked={metroLinesVisible}
              onCheckedChange={onMetroLinesToggle}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="hotspots-toggle" className="text-sm">Hotspots</Label>
            <Switch
              id="hotspots-toggle"
              checked={hotspotsVisible}
              onCheckedChange={onHotspotsToggle}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="projects-toggle" className="text-sm">Projects</Label>
            <Switch
              id="projects-toggle"
              checked={projectsVisible}
              onCheckedChange={onProjectsToggle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
