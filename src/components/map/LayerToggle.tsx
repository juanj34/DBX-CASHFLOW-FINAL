import { Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface LayerToggleProps {
  zonesVisible: boolean;
  hotspotsVisible: boolean;
  projectsVisible: boolean;
  categoryVisibility: Record<string, boolean>;
  onZonesToggle: (visible: boolean) => void;
  onHotspotsToggle: (visible: boolean) => void;
  onProjectsToggle: (visible: boolean) => void;
  onCategoryToggle: (category: string, visible: boolean) => void;
}

export const LayerToggle = ({
  zonesVisible,
  hotspotsVisible,
  projectsVisible,
  categoryVisibility,
  onZonesToggle,
  onHotspotsToggle,
  onProjectsToggle,
  onCategoryToggle,
}: LayerToggleProps) => {
  const categories = [
    { id: "landmark", label: "Landmarks", color: "#2563EB" },
    { id: "metro", label: "Metro", color: "#9333EA" },
    { id: "attraction", label: "Attractions", color: "#EC4899" },
    { id: "restaurant", label: "Restaurants", color: "#F97316" },
    { id: "shopping", label: "Shopping", color: "#10B981" },
    { id: "hotel", label: "Hotels", color: "#6366F1" },
  ];
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
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="hotspots-toggle" className="text-sm font-medium">Hotspots</Label>
          <Switch
            id="hotspots-toggle"
            checked={hotspotsVisible}
            onCheckedChange={onHotspotsToggle}
          />
        </div>
        
        {hotspotsVisible && (
          <div className="pl-2 space-y-2 border-l-2 border-border/50">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <Label htmlFor={`${category.id}-toggle`} className="text-xs">
                    {category.label}
                  </Label>
                </div>
                <Switch
                  id={`${category.id}-toggle`}
                  checked={categoryVisibility[category.id]}
                  onCheckedChange={(checked) => onCategoryToggle(category.id, checked)}
                />
              </div>
            ))}
          </div>
        )}
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
