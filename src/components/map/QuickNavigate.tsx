import { useState } from "react";
import { Compass, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dubaiLocations, DubaiLocation } from "@/data/dubaiLocations";
import mapboxgl from "mapbox-gl";

interface QuickNavigateProps {
  map: mapboxgl.Map | null;
}

export const QuickNavigate = ({ map }: QuickNavigateProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const teleportTo = (location: DubaiLocation) => {
    if (!map || isAnimating) return;

    setIsAnimating(true);
    setActiveLocation(location.id);

    const currentZoom = map.getZoom();
    const currentCenter = map.getCenter();
    
    // Calculate distance to determine zoom out amount
    const dx = location.coordinates[0] - currentCenter.lng;
    const dy = location.coordinates[1] - currentCenter.lat;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Dynamic zoom out based on distance (more distance = more zoom out)
    const zoomOutAmount = Math.min(4, Math.max(2, distance * 20));
    const minZoom = Math.max(8, currentZoom - zoomOutAmount);

    // Step 1: Zoom out smoothly
    map.easeTo({
      zoom: minZoom,
      pitch: 0,
      duration: 600,
      easing: (t) => 1 - Math.pow(1 - t, 3), // Ease out cubic
    });

    // Step 2: Fly to destination after zoom out completes
    setTimeout(() => {
      map.flyTo({
        center: location.coordinates,
        zoom: location.zoom,
        pitch: location.pitch || 45,
        bearing: location.bearing || 0,
        duration: 2200,
        essential: true,
        curve: 1.5,
        easing: (t) => {
          // Custom easing: slow start, fast middle, slow end
          return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
        },
      });

      // Reset animating state after flight completes
      setTimeout(() => {
        setIsAnimating(false);
      }, 2200);
    }, 600);
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[1060] flex items-center gap-2">
      {/* Expanded Panel */}
      <div
        className={`
          bg-background/95 backdrop-blur-md rounded-xl shadow-xl border border-border/50
          transition-all duration-300 ease-out overflow-hidden
          ${isExpanded ? "w-48 opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-4 pointer-events-none"}
        `}
      >
        <div className="p-2">
          <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
            Quick Navigate
          </div>
          <div className="max-h-[60vh] overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
            {dubaiLocations.map((location) => (
              <button
                key={location.id}
                onClick={() => teleportTo(location)}
                disabled={isAnimating}
                className={`
                  w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                  transition-all duration-200 text-left group
                  ${activeLocation === location.id 
                    ? "bg-primary/15 text-primary" 
                    : "hover:bg-muted/80 text-foreground"
                  }
                  ${isAnimating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <span className="text-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                  {location.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {location.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {location.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          h-11 w-11 rounded-xl shadow-lg border-border/50
          bg-background/95 backdrop-blur-md
          transition-all duration-300
          ${isExpanded ? "rotate-0" : ""}
          ${isAnimating ? "animate-pulse" : ""}
        `}
      >
        {isExpanded ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <Compass className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};
