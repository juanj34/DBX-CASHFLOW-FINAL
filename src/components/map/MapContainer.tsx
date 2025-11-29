import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useZones, useHotspots, useProjects } from "@/hooks/useMapData";
import { Loader2, Presentation } from "lucide-react";
import { ZoneInfoCard } from "./ZoneInfoCard";
import { HotspotInfoCard } from "./HotspotInfoCard";
import { ProjectInfoCard } from "./ProjectInfoCard";
import { LayerToggle } from "./LayerToggle";
import { dubaiMetroLines } from "@/data/dubaiMetroLines";
import { DrawingCanvas } from "./DrawingCanvas";
import { DrawingToolbar } from "./DrawingToolbar";
import { SearchBar } from "./SearchBar";
import { DrawingTool } from "@/types/drawing";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const MapContainer = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<"satellite" | "streets">("streets");
  const [zonesVisible, setZonesVisible] = useState(true);
  const [hotspotsVisible, setHotspotsVisible] = useState(true);
  const [projectsVisible, setProjectsVisible] = useState(true);
  const [metroVisible, setMetroVisible] = useState(true);
  const [buildings3DVisible, setBuildings3DVisible] = useState(true);
  const [lightPreset, setLightPreset] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day');
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
  
  // Drawing state
  const [presentationMode, setPresentationMode] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawingTool>('freehand');
  const [activeColor, setActiveColor] = useState('#EF4444');
  const [brushSize, setBrushSize] = useState(3);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [redoTrigger, setRedoTrigger] = useState(0);
  const [screenshotTrigger, setScreenshotTrigger] = useState(0);
  
  
  const { data: mapboxToken, isLoading: tokenLoading } = useMapboxToken();
  const { data: zones, isLoading: zonesLoading } = useZones();
  const { data: hotspots, isLoading: hotspotsLoading } = useHotspots();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  // Handle ESC key to exit presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && presentationMode) {
        setPresentationMode(false);
        toast("Presentation mode disabled");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentationMode]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/standard",
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
      // Configure lighting for Mapbox Standard style
      if (map.current?.getStyle()?.name?.includes('Standard')) {
        map.current.setConfigProperty('basemap', 'lightPreset', lightPreset);
      }
      setMapLoaded(true);
    });

    // Handle style changes
    map.current.on("style.load", () => {
      // Configure lighting for Mapbox Standard style
      if (map.current?.getStyle()?.name?.includes('Standard')) {
        map.current.setConfigProperty('basemap', 'lightPreset', lightPreset);
      }
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Function to add zones to map
  const addZonesToMap = () => {
    if (!map.current || !zones || zonesLoading || !mapLoaded) return;

    zones.forEach((zone) => {
      const sourceId = `zone-${zone.id}`;
      const fillLayerId = `zone-fill-${zone.id}`;
      const outlineLayerId = `zone-outline-${zone.id}`;

      // Remove existing layers if they exist
      if (map.current!.getSource(sourceId)) {
        if (map.current!.getLayer(fillLayerId)) {
          map.current!.removeLayer(fillLayerId);
        }
        if (map.current!.getLayer(outlineLayerId)) {
          map.current!.removeLayer(outlineLayerId);
        }
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
  };

  // Function to add metro lines to map
  const addMetroLinesToMap = () => {
    if (!map.current || !mapLoaded) return;

    dubaiMetroLines.forEach((line) => {
      const sourceId = `metro-${line.id}`;
      const layerId = `metro-line-${line.id}`;

      // Remove existing layers if they exist
      if (map.current!.getSource(sourceId)) {
        if (map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId);
        }
        map.current!.removeSource(sourceId);
      }

      map.current!.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: line.coordinates,
          },
        },
      });

      map.current!.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": line.color,
          "line-width": 4,
          "line-opacity": metroVisible ? 1 : 0,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
      });
    });
  };

  // Add zones to map when data and map are ready
  useEffect(() => {
    addZonesToMap();
  }, [zones, zonesLoading, mapLoaded, zonesVisible]);

  // Add metro lines to map when ready
  useEffect(() => {
    addMetroLinesToMap();
  }, [mapLoaded, metroVisible]);

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

  // Toggle metro lines visibility
  useEffect(() => {
    if (!map.current) return;

    dubaiMetroLines.forEach((line) => {
      const layerId = `metro-line-${line.id}`;
      
      if (map.current!.getLayer(layerId)) {
        map.current!.setPaintProperty(layerId, "line-opacity", metroVisible ? 1 : 0);
      }
    });
  }, [metroVisible]);

  // Toggle 3D buildings visibility (for Standard style, use show-place-labels config)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // For Standard style, control 3D buildings via config
    if (map.current?.getStyle()?.name?.includes('Standard')) {
      map.current.setConfigProperty('basemap', 'show3dObjects', buildings3DVisible);
    } else if (map.current.getLayer("3d-buildings")) {
      // Fallback for satellite style with custom 3D layer
      map.current.setLayoutProperty(
        "3d-buildings",
        "visibility",
        buildings3DVisible ? "visible" : "none"
      );
    }
  }, [buildings3DVisible, mapLoaded]);

  // Update light preset
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    if (map.current?.getStyle()?.name?.includes('Standard')) {
      map.current.setConfigProperty('basemap', 'lightPreset', lightPreset);
    }
  }, [lightPreset, mapLoaded]);

  // Add hotspots to map
  useEffect(() => {
    if (!map.current || !hotspots || hotspotsLoading || !mapLoaded) return;

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
  }, [hotspots, hotspotsLoading, hotspotsVisible, categoryVisibility, mapLoaded]);

  // Add projects to map
  useEffect(() => {
    if (!map.current || !projects || projectsLoading || !mapLoaded) return;

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
  }, [projects, projectsLoading, projectsVisible, mapLoaded]);

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

  const handleMapContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // No cerrar si el clic fue en un marker (hotspot o proyecto)
    if (target.classList.contains('hotspot-marker') || 
        target.classList.contains('project-marker') ||
        target.closest('.hotspot-marker') ||
        target.closest('.project-marker')) {
      return;
    }
    
    // No cerrar si el clic fue en una tarjeta de info
    if (target.closest('[data-info-card]')) {
      return;
    }
    
    // No cerrar si el clic fue en un control del mapa
    if (target.closest('.mapboxgl-ctrl') ||
        target.closest('.glass-panel') ||
        target.closest('button')) {
      return;
    }
    
    // Cerrar todas las tarjetas
    setSelectedZone(null);
    setSelectedHotspot(null);
    setSelectedProject(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden" onClick={handleMapContainerClick}>
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Map controls row */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        {/* Map style toggle */}
        <div className="glass-panel rounded-lg p-1 flex gap-1">
          <button
            onClick={() => {
              setMapStyle("streets");
              setMapLoaded(false);
              map.current?.setStyle("mapbox://styles/mapbox/standard");
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
              setMapLoaded(false);
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
        
        {/* Search bar */}
        {mapLoaded && mapboxToken && (
          <SearchBar map={map.current} mapboxToken={mapboxToken} />
        )}
      </div>

      {/* Layer toggle */}
      <LayerToggle
        zonesVisible={zonesVisible}
        hotspotsVisible={hotspotsVisible}
        projectsVisible={projectsVisible}
        metroLinesVisible={metroVisible}
        buildings3DVisible={buildings3DVisible}
        lightPreset={lightPreset}
        mapStyle={mapStyle}
        categoryVisibility={categoryVisibility}
        onZonesToggle={setZonesVisible}
        onHotspotsToggle={setHotspotsVisible}
        onProjectsToggle={setProjectsVisible}
        onMetroLinesToggle={setMetroVisible}
        onBuildings3DToggle={setBuildings3DVisible}
        onLightPresetChange={setLightPreset}
        onCategoryToggle={(category, visible) => 
          setCategoryVisibility((prev) => ({ ...prev, [category]: visible }))
        }
      />

      {/* Presentation mode toggle */}
      <div className="fixed bottom-6 right-6 z-[999]">
        <Button
          variant={presentationMode ? "default" : "outline"}
          size="icon"
          onClick={() => {
            setPresentationMode(!presentationMode);
            toast(presentationMode ? "Presentation mode disabled" : "Presentation mode enabled - Press ESC to exit");
          }}
          className="glass-panel border-border/40 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Presentation className="w-4 h-4" />
        </Button>
      </div>

      {/* Drawing overlay */}
      {presentationMode && (
        <>
          <DrawingCanvas
            activeTool={activeTool}
            activeColor={activeColor}
            brushSize={brushSize}
            onHistoryChange={(canUndo, canRedo) => {
              setCanUndo(canUndo);
              setCanRedo(canRedo);
            }}
            onClear={() => {}}
            clearTrigger={clearTrigger}
            undoTrigger={undoTrigger}
            redoTrigger={redoTrigger}
            screenshotTrigger={screenshotTrigger}
            onScreenshotReady={(dataUrl) => {
              const link = document.createElement('a');
              link.download = `map-screenshot-${Date.now()}.png`;
              link.href = dataUrl;
              link.click();
              toast.success("Screenshot exported!");
            }}
          />
          <DrawingToolbar
            activeTool={activeTool}
            activeColor={activeColor}
            brushSize={brushSize}
            canUndo={canUndo}
            canRedo={canRedo}
            onToolChange={setActiveTool}
            onColorChange={setActiveColor}
            onBrushSizeChange={setBrushSize}
            onUndo={() => setUndoTrigger(prev => prev + 1)}
            onRedo={() => setRedoTrigger(prev => prev + 1)}
            onClear={() => {
              setClearTrigger(prev => prev + 1);
              toast("Drawing cleared");
            }}
            onScreenshot={() => setScreenshotTrigger(prev => prev + 1)}
            onClose={() => {
              setPresentationMode(false);
              toast("Presentation mode disabled");
            }}
          />
        </>
      )}

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
