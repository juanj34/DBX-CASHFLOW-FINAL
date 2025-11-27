import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { Loader2 } from "lucide-react";

export const MapContainer = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapStyle, setMapStyle] = useState<"satellite" | "streets">("streets");
  const { data: mapboxToken, isLoading } = useMapboxToken();

  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    // Initialize map with token from edge function
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [55.2708, 25.2048], // Dubai coordinates
      zoom: 11,
      pitch: 45,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right"
    );

    // Add 3D buildings
    map.current.on("load", () => {
      if (!map.current) return;

      const layers = map.current.getStyle().layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === "symbol" && layer.layout?.["text-field"]
      )?.id;

      map.current.addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.6,
          },
        },
        labelLayerId
      );
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Map style toggle */}
      <div className="absolute top-4 left-4 glass-panel rounded-lg p-1 flex gap-1">
        <button
          onClick={() => {
            setMapStyle("streets");
            map.current?.setStyle("mapbox://styles/mapbox/light-v11");
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-smooth ${
            mapStyle === "streets"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Streets
        </button>
        <button
          onClick={() => {
            setMapStyle("satellite");
            map.current?.setStyle("mapbox://styles/mapbox/satellite-streets-v12");
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-smooth ${
            mapStyle === "satellite"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Satellite
        </button>
      </div>
    </div>
  );
};
