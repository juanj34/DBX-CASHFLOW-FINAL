import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationMiniMapProps {
  latitude: number;
  longitude: number;
  locationName?: string;
  markerColor?: string;
  height?: string;
  className?: string;
}

export const LocationMiniMap = ({
  latitude,
  longitude,
  locationName,
  markerColor = "#CCFF00",
  height = "h-36",
  className,
}: LocationMiniMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  const { data: token, isLoading, error } = useMapboxToken();

  useEffect(() => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [longitude, latitude],
      zoom: 14,
      interactive: false,
      attributionControl: false,
    });

    // Create custom marker element
    const markerEl = document.createElement("div");
    markerEl.className = "location-marker";
    markerEl.innerHTML = `
      <div style="
        width: 24px;
        height: 24px;
        background: ${markerColor};
        border-radius: 50%;
        border: 3px solid rgba(0,0,0,0.3);
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: rgba(0,0,0,0.5);
          border-radius: 50%;
        "></div>
      </div>
    `;

    marker.current = new mapboxgl.Marker({ element: markerEl })
      .setLngLat([longitude, latitude])
      .addTo(map.current);

    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, [token, latitude, longitude, markerColor]);

  if (isLoading) {
    return (
      <div className={cn("rounded-xl overflow-hidden", height, className)}>
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className={cn(
        "rounded-xl overflow-hidden bg-theme-card border border-theme-border flex items-center justify-center",
        height,
        className
      )}>
        <p className="text-xs text-theme-text-muted">Map unavailable</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div 
        className={cn(
          "rounded-xl overflow-hidden border border-theme-border relative",
          height
        )}
      >
        <div ref={mapContainer} className="absolute inset-0" />
      </div>
      {locationName && (
        <div className="flex items-center gap-1.5 text-xs text-theme-text-muted">
          <MapPin className="w-3 h-3" />
          <span>{locationName}</span>
        </div>
      )}
    </div>
  );
};
