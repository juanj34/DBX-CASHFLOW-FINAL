import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, ChevronDown, ChevronUp } from "lucide-react";

interface LayerToggleProps {
  zonesVisible: boolean;
  hotspotsVisible: boolean;
  projectsVisible: boolean;
  metroLinesVisible: boolean;
  buildings3DVisible: boolean;
  lightPreset: 'dawn' | 'day' | 'dusk' | 'night';
  mapStyle: 'satellite' | 'streets';
  categoryVisibility: Record<string, boolean>;
  onZonesToggle: (visible: boolean) => void;
  onHotspotsToggle: (visible: boolean) => void;
  onProjectsToggle: (visible: boolean) => void;
  onMetroLinesToggle: (visible: boolean) => void;
  onBuildings3DToggle: (visible: boolean) => void;
  onLightPresetChange: (preset: 'dawn' | 'day' | 'dusk' | 'night') => void;
  onCategoryToggle: (category: string, visible: boolean) => void;
}

export const LayerToggle = ({
  zonesVisible,
  hotspotsVisible,
  projectsVisible,
  metroLinesVisible,
  buildings3DVisible,
  lightPreset,
  mapStyle,
  categoryVisibility,
  onZonesToggle,
  onHotspotsToggle,
  onProjectsToggle,
  onMetroLinesToggle,
  onBuildings3DToggle,
  onLightPresetChange,
  onCategoryToggle,
}: LayerToggleProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const categories = [
    { id: "landmark", label: "Landmarks", color: "#2563EB" },
    { id: "metro", label: "Metro", color: "#9333EA" },
    { id: "attraction", label: "Attractions", color: "#EC4899" },
    { id: "restaurant", label: "Restaurants", color: "#F97316" },
    { id: "shopping", label: "Shopping", color: "#10B981" },
    { id: "hotel", label: "Hotels", color: "#6366F1" },
  ];

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
            <Label htmlFor="buildings-toggle" className="text-sm">3D Buildings</Label>
            <Switch
              id="buildings-toggle"
              checked={buildings3DVisible}
              onCheckedChange={onBuildings3DToggle}
            />
          </div>

          {/* Light Preset selector - only for Streets/Standard style */}
          {mapStyle === "streets" && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
              <Label htmlFor="light-preset" className="text-sm">Lighting</Label>
              <Select value={lightPreset} onValueChange={onLightPresetChange}>
                <SelectTrigger id="light-preset" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dawn">🌅 Dawn</SelectItem>
                  <SelectItem value="day">☀️ Day</SelectItem>
                  <SelectItem value="dusk">🌇 Dusk</SelectItem>
                  <SelectItem value="night">🌙 Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="metro-toggle" className="text-sm font-medium">Metro Lines</Label>
              <Switch
                id="metro-toggle"
                checked={metroLinesVisible}
                onCheckedChange={onMetroLinesToggle}
              />
            </div>
            
            {metroLinesVisible && (
              <div className="pl-2 space-y-1 border-l-2 border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 rounded-full" style={{ backgroundColor: "#EF4444" }} />
                  <span className="text-xs text-muted-foreground">Red Line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 rounded-full" style={{ backgroundColor: "#22C55E" }} />
                  <span className="text-xs text-muted-foreground">Green Line</span>
                </div>
              </div>
            )}
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
      </div>
    </div>
  );
};
