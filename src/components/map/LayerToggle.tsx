import { Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface LayerToggleProps {
  zonesVisible: boolean;
  hotspotsVisible: boolean;
  projectsVisible: boolean;
  onZonesToggle: (visible: boolean) => void;
  onHotspotsToggle: (visible: boolean) => void;
  onProjectsToggle: (visible: boolean) => void;
}

export const LayerToggle = ({
  zonesVisible,
  hotspotsVisible,
  projectsVisible,
  onZonesToggle,
  onHotspotsToggle,
  onProjectsToggle,
}: LayerToggleProps) => {
  return (
    <div className="absolute bottom-4 left-4 glass-panel rounded-lg p-4 space-y-3 w-48">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4" />
        <span className="text-sm font-medium">Map Layers</span>
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="zones-toggle" className="text-sm">Zones</Label>
        <Switch
          id="zones-toggle"
          checked={zonesVisible}
          onCheckedChange={onZonesToggle}
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
  );
};
