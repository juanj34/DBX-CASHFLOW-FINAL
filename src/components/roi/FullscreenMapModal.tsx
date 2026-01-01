import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, X, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FullscreenMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number;
  longitude: number;
  projectName?: string;
  zoneName?: string;
}

export const FullscreenMapModal = ({
  open,
  onOpenChange,
  latitude,
  longitude,
  projectName,
  zoneName,
}: FullscreenMapModalProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const { data: token, isLoading: tokenLoading } = useMapboxToken();

  // Fetch nearby landmarks/hotspots
  const { data: nearbyHotspots } = useQuery({
    queryKey: ['nearby-hotspots', latitude, longitude],
    queryFn: async () => {
      const { data } = await supabase
        .from('hotspots')
        .select('id, title, latitude, longitude, category')
        .eq('visible', true);
      
      if (!data) return [];
      
      // Filter hotspots within ~2km radius (rough calculation)
      const radius = 0.02; // ~2km in degrees
      return data.filter(h => 
        Math.abs(h.latitude - latitude) < radius && 
        Math.abs(h.longitude - longitude) < radius
      ).slice(0, 10);
    },
    enabled: open && !!latitude && !!longitude,
  });

  useEffect(() => {
    if (!open || !mapContainer.current || !token) return;

    // Small delay to ensure container is rendered
    const timer = setTimeout(() => {
      if (!mapContainer.current) return;

      mapboxgl.accessToken = token;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [longitude, latitude],
        zoom: 14,
        attributionControl: false,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        "top-right"
      );

      // Add project marker
      const projectMarkerEl = document.createElement("div");
      projectMarkerEl.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background: #CCFF00;
          border-radius: 50%;
          border: 4px solid rgba(0,0,0,0.3);
          box-shadow: 0 2px 12px rgba(204,255,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: rgba(0,0,0,0.5);
            border-radius: 50%;
          "></div>
        </div>
      `;

      new mapboxgl.Marker({ element: projectMarkerEl })
        .setLngLat([longitude, latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div style="padding: 8px; font-family: system-ui;">
              <strong>${projectName || 'Project Location'}</strong>
              ${zoneName ? `<br/><span style="color: #666;">${zoneName}</span>` : ''}
            </div>`
          )
        )
        .addTo(map.current);

      map.current.on('load', () => {
        setMapReady(true);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      map.current?.remove();
      map.current = null;
      setMapReady(false);
    };
  }, [open, token, latitude, longitude, projectName, zoneName]);

  // Add nearby hotspot markers when data is ready
  useEffect(() => {
    if (!mapReady || !map.current || !nearbyHotspots?.length) return;

    nearbyHotspots.forEach((hotspot) => {
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          background: rgba(255,255,255,0.9);
          border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.2);
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        "></div>
      `;

      new mapboxgl.Marker({ element: el })
        .setLngLat([hotspot.longitude, hotspot.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 15 }).setHTML(
            `<div style="padding: 6px; font-family: system-ui;">
              <strong>${hotspot.title}</strong>
              <br/><span style="color: #666; font-size: 12px;">${hotspot.category}</span>
            </div>`
          )
        )
        .addTo(map.current!);
    });
  }, [mapReady, nearbyHotspots]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[80vh] p-0 overflow-hidden bg-theme-bg border-theme-border">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <MapPin className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">{projectName || 'Project Location'}</h3>
                {zoneName && (
                  <p className="text-sm text-white/70">{zoneName}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Map Container */}
        <div className="w-full h-full relative">
          {tokenLoading && (
            <Skeleton className="absolute inset-0" />
          )}
          <div ref={mapContainer} className="absolute inset-0" />
        </div>

        {/* Legend */}
        {nearbyHotspots && nearbyHotspots.length > 0 && (
          <div className="absolute bottom-4 left-4 z-10 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
            <p className="font-medium mb-2 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Nearby Points of Interest
            </p>
            <div className="space-y-1">
              {nearbyHotspots.slice(0, 5).map((h) => (
                <p key={h.id} className="text-white/80 text-xs">• {h.title}</p>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
