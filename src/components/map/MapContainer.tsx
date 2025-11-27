import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useZones, useHotspots, useProjects } from "@/hooks/useMapData";
import { Loader2 } from "lucide-react";
import { ZoneInfoCard } from "./ZoneInfoCard";
import { HotspotInfoCard } from "./HotspotInfoCard";
import { ProjectInfoCard } from "./ProjectInfoCard";
import { LayerToggle } from "./LayerToggle";

export const MapContainer = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapStyle, setMapStyle] = useState<"satellite" | "streets">("streets");
  const [zonesVisible, setZonesVisible] = useState(true);
  const [hotspotsVisible, setHotspotsVisible] = useState(true);
  const [projectsVisible, setProjectsVisible] = useState(true);
  const [categoryVisibility, setCategoryVisibility] = useState<Record<string, boolean>>({
    landmark: true,
    metro: true,
    attraction: true,
    restaurant: true,
    shopping: true,
    hotel: true,
  });
  
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  const { data: mapboxToken, isLoading: tokenLoading } = useMapboxToken();
  const { data: zones, isLoading: zonesLoading } = useZones();
  const { data: hotspots, isLoading: hotspotsLoading } = useHotspots();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [55.2708, 25.2048],
      zoom: 11,
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right"
    );

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

  // Add zones to map
  useEffect(() => {
    if (!map.current || !zones || zonesLoading) return;

    zones.forEach((zone) => {
      const sourceId = `zone-${zone.id}`;
      const fillLayerId = `zone-fill-${zone.id}`;
      const outlineLayerId = `zone-outline-${zone.id}`;

      if (map.current!.getSource(sourceId)) {
        map.current!.removeLayer(fillLayerId);
        map.current!.removeLayer(outlineLayerId);
        map.current!.removeSource(sourceId);
      }

      map.current!.addSource(sourceId, {
        type: "geojson",
        data: zone.polygon as any,
      });

      map.current!.addLayer({
        id: fillLayerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": zone.color,
          "fill-opacity": zonesVisible ? 0.3 : 0,
        },
      });

      map.current!.addLayer({
        id: outlineLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": zone.color,
          "line-width": 2,
          "line-opacity": zonesVisible ? 0.8 : 0,
        },
      });

      map.current!.on("click", fillLayerId, () => {
        setSelectedZone(zone);
        setSelectedHotspot(null);
        setSelectedProject(null);
      });

      map.current!.on("mouseenter", fillLayerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
      });

      map.current!.on("mouseleave", fillLayerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
      });
    });
  }, [zones, zonesLoading, zonesVisible]);

  // Toggle zones visibility
  useEffect(() => {
    if (!map.current || !zones) return;

    zones.forEach((zone) => {
      const fillLayerId = `zone-fill-${zone.id}`;
      const outlineLayerId = `zone-outline-${zone.id}`;

      if (map.current!.getLayer(fillLayerId)) {
        map.current!.setPaintProperty(fillLayerId, "fill-opacity", zonesVisible ? 0.3 : 0);
      }
      if (map.current!.getLayer(outlineLayerId)) {
        map.current!.setPaintProperty(outlineLayerId, "line-opacity", zonesVisible ? 0.8 : 0);
      }
    });
  }, [zonesVisible, zones]);

  // Add hotspots to map
  useEffect(() => {
    if (!map.current || !hotspots || hotspotsLoading) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!hotspotsVisible) return;

    // Filter hotspots by visible categories
    const visibleHotspots = hotspots.filter(
      (hotspot) => categoryVisibility[hotspot.category]
    );

    visibleHotspots.forEach((hotspot) => {
      const el = document.createElement("div");
      el.className = "hotspot-marker";
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = getCategoryColor(hotspot.category);
      el.style.border = "2px solid white";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([Number(hotspot.longitude), Number(hotspot.latitude)])
        .addTo(map.current!);

      el.addEventListener("click", () => {
        setSelectedHotspot(hotspot);
        setSelectedZone(null);
        setSelectedProject(null);
      });

      markersRef.current.push(marker);
    });
  }, [hotspots, hotspotsLoading, hotspotsVisible, categoryVisibility]);

  // Add projects to map
  useEffect(() => {
    if (!map.current || !projects || projectsLoading) return;

    if (!projectsVisible) return;

    projects.forEach((project) => {
      if (!project.latitude || !project.longitude) return;

      const el = document.createElement("div");
      el.className = "project-marker";
      el.style.width = "36px";
      el.style.height = "36px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#10B981";
      el.style.border = "3px solid white";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.innerHTML = "🏢";
      el.style.fontSize = "16px";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([Number(project.longitude), Number(project.latitude)])
        .addTo(map.current!);

      el.addEventListener("click", () => {
        setSelectedProject(project);
        setSelectedZone(null);
        setSelectedHotspot(null);
      });

      markersRef.current.push(marker);
    });
  }, [projects, projectsLoading, projectsVisible]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      landmark: "#2563EB",
      metro: "#9333EA",
      attraction: "#EC4899",
      restaurant: "#F97316",
      shopping: "#10B981",
      hotel: "#6366F1",
    };
    return colors[category] || "#6B7280";
  };

  if (tokenLoading || zonesLoading || hotspotsLoading || projectsLoading) {
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

      {/* Layer toggle */}
      <LayerToggle
        zonesVisible={zonesVisible}
        hotspotsVisible={hotspotsVisible}
        projectsVisible={projectsVisible}
        categoryVisibility={categoryVisibility}
        onZonesToggle={setZonesVisible}
        onHotspotsToggle={setHotspotsVisible}
        onProjectsToggle={setProjectsVisible}
        onCategoryToggle={(category, visible) => 
          setCategoryVisibility((prev) => ({ ...prev, [category]: visible }))
        }
      />

      {/* Info cards */}
      {selectedZone && (
        <ZoneInfoCard zone={selectedZone} onClose={() => setSelectedZone(null)} />
      )}
      {selectedHotspot && (
        <HotspotInfoCard hotspot={selectedHotspot} onClose={() => setSelectedHotspot(null)} />
      )}
      {selectedProject && (
        <ProjectInfoCard project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </div>
  );
};
