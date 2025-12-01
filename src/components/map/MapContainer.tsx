import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useZones, useHotspots, useProjects } from "@/hooks/useMapData";
import { Loader2, Presentation, Building2, X, LogOut, MapPinned, Route } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

interface MapContainerProps {
  userRole: string | null;
}

export const MapContainer = ({ userRole }: MapContainerProps) => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const hotspotMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const projectMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const justClickedFeatureRef = useRef(false);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<"satellite" | "streets">("streets");
  const [zonesVisible, setZonesVisible] = useState(true);
  const [hotspotsVisible, setHotspotsVisible] = useState(true);
  const [projectsVisible, setProjectsVisible] = useState(true);
  const [metroVisible, setMetroVisible] = useState(true);
  const [buildings3DVisible, setBuildings3DVisible] = useState(() => {
    const saved = localStorage.getItem('map-buildings3d-visible');
    return saved !== null ? saved === 'true' : true;
  });
  const [placesVisible, setPlacesVisible] = useState(() => {
    const saved = localStorage.getItem('map-places-visible');
    return saved !== null ? saved === 'true' : true;
  });
  const [roadsVisible, setRoadsVisible] = useState(() => {
    const saved = localStorage.getItem('map-roads-visible');
    return saved !== null ? saved === 'true' : true;
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

  // Freeze/unfreeze map based on presentation mode
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    if (presentationMode) {
      // Disable all map interactions
      map.current.dragPan.disable();
      map.current.scrollZoom.disable();
      map.current.boxZoom.disable();
      map.current.keyboard.disable();
      map.current.doubleClickZoom.disable();
      map.current.touchZoomRotate.disable();
    } else {
      // Re-enable all map interactions
      map.current.dragPan.enable();
      map.current.scrollZoom.enable();
      map.current.boxZoom.enable();
      map.current.keyboard.enable();
      map.current.doubleClickZoom.enable();
      map.current.touchZoomRotate.enable();
    }
  }, [presentationMode, mapLoaded]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('map-buildings3d-visible', String(buildings3DVisible));
  }, [buildings3DVisible]);

  useEffect(() => {
    localStorage.setItem('map-places-visible', String(placesVisible));
  }, [placesVisible]);

  useEffect(() => {
    localStorage.setItem('map-roads-visible', String(roadsVisible));
  }, [roadsVisible]);

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
      setMapLoaded(true);
    });

    // Handle style changes
    map.current.on("style.load", () => {
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
        justClickedFeatureRef.current = true;
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

  // Toggle 3D buildings visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const updateBuildings = () => {
      if (!map.current) return;
      
      if (mapStyle === 'streets') {
        // Standard style - usar setConfigProperty
        try {
          map.current.setConfigProperty('basemap', 'show3dObjects', buildings3DVisible);
        } catch (e) {
          console.warn('Could not set 3D buildings config:', e);
        }
      } else {
        // Satellite-streets - usar layer de extrusión manual
        const layerId = '3d-buildings-layer';
        
        if (buildings3DVisible) {
          // Agregar layer si no existe
          if (!map.current.getLayer(layerId)) {
            map.current.addLayer({
              'id': layerId,
              'source': 'composite',
              'source-layer': 'building',
              'filter': ['==', 'extrude', 'true'],
              'type': 'fill-extrusion',
              'minzoom': 15,
              'paint': {
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'min_height'],
                'fill-extrusion-opacity': 0.6
              }
            });
          } else {
            map.current.setLayoutProperty(layerId, 'visibility', 'visible');
          }
        } else {
          // Ocultar layer si existe
          if (map.current.getLayer(layerId)) {
            map.current.setLayoutProperty(layerId, 'visibility', 'none');
          }
        }
      }
    };

    if (map.current.isStyleLoaded()) {
      updateBuildings();
    } else {
      map.current.once('style.load', updateBuildings);
    }
  }, [buildings3DVisible, mapLoaded, mapStyle]);

  // Toggle places/POI labels visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const togglePlaces = () => {
      if (!map.current) return;
      
      if (mapStyle === 'streets') {
        try {
          map.current.setConfigProperty('basemap', 'showPlaceLabels', placesVisible);
          map.current.setConfigProperty('basemap', 'showPointOfInterestLabels', placesVisible);
        } catch (e) {
          console.warn('Could not toggle places:', e);
        }
      } else {
        // Satellite - iterar sobre layers
        const style = map.current.getStyle();
        if (!style?.layers) return;
        
        style.layers.forEach(layer => {
          if (layer.type === 'symbol' && 
              (layer.id.includes('poi') || layer.id.includes('place') || 
               (layer.id.includes('label') && !layer.id.includes('road')))) {
            try {
              map.current!.setLayoutProperty(layer.id, 'visibility', placesVisible ? 'visible' : 'none');
            } catch (e) {}
          }
        });
      }
    };

    if (map.current.isStyleLoaded()) {
      togglePlaces();
    } else {
      map.current.once('style.load', togglePlaces);
    }
  }, [placesVisible, mapLoaded, mapStyle]);

  // Toggle road labels visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const toggleRoads = () => {
      if (!map.current) return;
      
      if (mapStyle === 'streets') {
        try {
          map.current.setConfigProperty('basemap', 'showRoadLabels', roadsVisible);
          map.current.setConfigProperty('basemap', 'showTransitLabels', roadsVisible);
        } catch (e) {
          console.warn('Could not toggle roads:', e);
        }
      } else {
        // Satellite - iterar sobre layers de road
        const style = map.current.getStyle();
        if (!style?.layers) return;
        
        style.layers.forEach(layer => {
          if (layer.type === 'symbol' && layer.id.includes('road')) {
            try {
              map.current!.setLayoutProperty(layer.id, 'visibility', roadsVisible ? 'visible' : 'none');
            } catch (e) {}
          }
        });
      }
    };

    if (map.current.isStyleLoaded()) {
      toggleRoads();
    } else {
      map.current.once('style.load', toggleRoads);
    }
  }, [roadsVisible, mapLoaded, mapStyle]);

  // Add hotspots to map
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing hotspot markers
    hotspotMarkersRef.current.forEach((marker) => marker.remove());
    hotspotMarkersRef.current = [];

    if (!hotspotsVisible || !hotspots || hotspotsLoading) return;

    hotspots.forEach((hotspot) => {
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

      hotspotMarkersRef.current.push(marker);
    });
  }, [hotspots, hotspotsLoading, hotspotsVisible, mapLoaded]);

  // Add projects to map
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing project markers
    projectMarkersRef.current.forEach((marker) => marker.remove());
    projectMarkersRef.current = [];

    if (!projectsVisible || !projects || projectsLoading) return;

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

      projectMarkersRef.current.push(marker);
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
    // Si acabamos de hacer clic en un feature de Mapbox, ignorar
    if (justClickedFeatureRef.current) {
      justClickedFeatureRef.current = false;
      return;
    }
    
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
      <div className="absolute top-4 left-4 flex items-center gap-3 z-[1060]">
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

      {/* Container for Map Layers and Quick Controls - aligned at bottom */}
      <div className="absolute bottom-4 left-4 flex flex-row items-end gap-3 z-[1060]">
        {/* Layer toggle panel */}
        <LayerToggle
          zonesVisible={zonesVisible}
          hotspotsVisible={hotspotsVisible}
          projectsVisible={projectsVisible}
          metroLinesVisible={metroVisible}
          onZonesToggle={setZonesVisible}
          onHotspotsToggle={setHotspotsVisible}
          onProjectsToggle={setProjectsVisible}
          onMetroLinesToggle={setMetroVisible}
        />

        {/* Quick controls - same height as LayerToggle header */}
        <div className="flex flex-row gap-2 glass-panel rounded-lg p-2">
        {/* 3D Buildings toggle button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setBuildings3DVisible(!buildings3DVisible)}
          className={`glass-panel bg-white hover:bg-gray-50 ${!buildings3DVisible ? 'opacity-40' : ''}`}
          title={buildings3DVisible ? "Hide 3D Buildings" : "Show 3D Buildings"}
        >
          <div className="relative">
            <Building2 className="w-4 h-4 text-gray-800" />
            {!buildings3DVisible && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-0.5 bg-red-500 rotate-45 rounded-full" />
              </div>
            )}
          </div>
        </Button>
        
        {/* Places/POI toggle button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPlacesVisible(!placesVisible)}
          className={`glass-panel bg-white hover:bg-gray-50 ${!placesVisible ? 'opacity-40' : ''}`}
          title={placesVisible ? "Hide Places & Labels" : "Show Places & Labels"}
        >
          <div className="relative">
            <MapPinned className="w-4 h-4 text-gray-800" />
            {!placesVisible && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-0.5 bg-red-500 rotate-45 rounded-full" />
              </div>
            )}
          </div>
        </Button>
        
        {/* Roads toggle button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setRoadsVisible(!roadsVisible)}
          className={`glass-panel bg-white hover:bg-gray-50 ${!roadsVisible ? 'opacity-40' : ''}`}
          title={roadsVisible ? "Hide Road Labels" : "Show Road Labels"}
        >
          <div className="relative">
            <Route className="w-4 h-4 text-gray-800" />
            {!roadsVisible && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-0.5 bg-red-500 rotate-45 rounded-full" />
              </div>
            )}
          </div>
        </Button>
        </div>
      </div>

      {/* Simple Logout button - bottom right */}
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          await supabase.auth.signOut();
          navigate("/login");
        }}
        className="absolute bottom-4 right-4 z-[1060] glass-panel gap-2"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </Button>

      {/* Drawing canvas - full screen overlay when presentation mode is active */}
      {presentationMode && (
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
      )}

      {/* Presentation toolbar - right side panel */}
      <div className="fixed top-0 right-0 bottom-0 z-[1100] flex items-center">
        {/* Toggle button - higher z-index so it's always clickable */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setPresentationMode(!presentationMode);
            toast(presentationMode ? "Presentation mode disabled" : "Presentation mode enabled - Press ESC to exit");
          }}
          className="glass-panel -mr-1 z-[1200]"
        >
          {presentationMode ? <X className="w-4 h-4" /> : <Presentation className="w-4 h-4" />}
        </Button>
        
        {/* Toolbar panel - only visible when presentation mode is on */}
        {presentationMode && (
          <div className="h-full glass-panel border-l border-border/40 p-2 flex flex-col items-center justify-center overflow-y-auto">
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
            />
          </div>
        )}
      </div>

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
