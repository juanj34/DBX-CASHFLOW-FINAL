import { useEffect, useRef } from "react";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import mapboxgl from "mapbox-gl";

interface SearchBarProps {
  map: mapboxgl.Map | null;
  mapboxToken: string;
}

export const SearchBar = ({ map, mapboxToken }: SearchBarProps) => {
  const geocoderContainer = useRef<HTMLDivElement>(null);
  const geocoderRef = useRef<MapboxGeocoder | null>(null);

  useEffect(() => {
    if (!geocoderContainer.current || !map || !mapboxToken || geocoderRef.current) return;

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxToken,
      mapboxgl: mapboxgl,
      placeholder: "Search location...",
      proximity: { longitude: 55.2708, latitude: 25.2048 }, // Dubai as center
      bbox: [54.5, 24.5, 56.5, 26.0], // Bounding box for Dubai/UAE
      countries: "ae", // Prioritize UAE
      language: "en",
      marker: false, // No marker because we have our own markers
    });

    // Add to custom container (not as map control)
    geocoderContainer.current.appendChild(geocoder.onAdd(map));
    geocoderRef.current = geocoder;

    // Handle result selection
    geocoder.on("result", (e) => {
      const { center, bbox } = e.result;
      
      if (bbox) {
        // If there's a bounding box, fit to show the complete area
        map.fitBounds(bbox, {
          padding: 50,
          duration: 2000,
        });
      } else {
        // Otherwise, flyTo center with zoom
        map.flyTo({
          center: center,
          zoom: 15,
          duration: 2000,
          essential: true,
        });
      }
    });

    return () => {
      if (geocoderRef.current) {
        geocoderRef.current.onRemove();
        geocoderRef.current = null;
      }
    };
  }, [map, mapboxToken]);

  return (
    <div 
      ref={geocoderContainer} 
      className="mapboxgl-ctrl-geocoder-wrapper"
    />
  );
};

