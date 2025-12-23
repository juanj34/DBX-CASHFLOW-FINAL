import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { Loader2, Upload, X } from "lucide-react";
import { optimizeImage, ZONE_IMAGE_CONFIG } from "@/lib/imageUtils";

interface ZoneFormProps {
  zone?: any;
  onClose: () => void;
  onSaved: () => void;
}

const ZoneForm = ({ zone, onClose, onSaved }: ZoneFormProps) => {
  const { data: token, isLoading } = useMapboxToken();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: zone?.name || "",
    tagline: zone?.tagline || "",
    description: zone?.description || "",
    color: zone?.color || "#2563EB",
    image_url: zone?.image_url || "",
    // Investment Profile
    concept: zone?.concept || "",
    property_types: zone?.property_types || "",
    investment_focus: zone?.investment_focus || "",
    main_developer: zone?.main_developer || "",
    // Maturity
    maturity_level: zone?.maturity_level || 50,
    maturity_label: zone?.maturity_label || "",
    // Prices
    price_range_min: zone?.price_range_min || "",
    price_range_max: zone?.price_range_max || "",
    ticket_1br_min: zone?.ticket_1br_min || "",
    ticket_1br_max: zone?.ticket_1br_max || "",
    // Legacy fields
    population: zone?.population || "",
    occupancy_rate: zone?.occupancy_rate || "",
    absorption_rate: zone?.absorption_rate || "",
  });
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(zone?.image_url || null);

  // Paste handler for Ctrl+V
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            break;
          }
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(() => {
    if (!token || !mapContainer.current) return;

    // Clean up existing map when zone changes or on remount
    if (map.current) {
      map.current.remove();
      map.current = null;
      draw.current = null;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [55.2708, 25.2048], // Dubai
      zoom: 11,
    });

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      // Start in simple_select mode if editing existing polygon
      defaultMode: zone?.polygon ? "simple_select" : "draw_polygon",
    });

    map.current.addControl(draw.current);

    // Wait for map to fully load before adding polygon
    map.current.on('load', () => {
      if (zone?.polygon && draw.current && map.current) {
        draw.current.add({
          type: "Feature",
          geometry: zone.polygon,
          properties: {},
        });
        
        // Center map on existing polygon
        try {
          const bounds = new mapboxgl.LngLatBounds();
          const coords = zone.polygon.coordinates[0] as [number, number][];
          coords.forEach((coord) => bounds.extend(coord));
          map.current.fitBounds(bounds, { padding: 50 });
        } catch (e) {
          console.error("Error fitting bounds:", e);
        }
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
      draw.current = null;
    };
  }, [token, zone?.id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null;
    
    try {
      const optimized = await optimizeImage(imageFile, ZONE_IMAGE_CONFIG);
      const fileName = `${Date.now()}-${formData.name.replace(/\s+/g, "-").toLowerCase()}.webp`;
      
      const { error: uploadError } = await supabase.storage
        .from("zone-images")
        .upload(fileName, optimized, { contentType: "image/webp" });
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage.from("zone-images").getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error subiendo imagen",
        description: "No se pudo subir la imagen. Intenta de nuevo.",
        variant: "destructive",
      });
      return formData.image_url || null;
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error de validación",
        description: "El nombre de la zona es requerido",
        variant: "destructive",
      });
      return;
    }

    if (!draw.current) {
      toast({
        title: "Error de validación",
        description: "Por favor dibuja un polígono en el mapa",
        variant: "destructive",
      });
      return;
    }

    const data = draw.current.getAll();
    if (data.features.length === 0) {
      toast({
        title: "Error de validación",
        description: "Por favor dibuja un polígono en el mapa",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const polygon = data.features[0].geometry;
    const imageUrl = await uploadImage();

    const zoneData = {
      name: formData.name,
      tagline: formData.tagline || null,
      description: formData.description || null,
      color: formData.color,
      polygon,
      image_url: imageUrl,
      // Investment Profile
      concept: formData.concept || null,
      property_types: formData.property_types || null,
      investment_focus: formData.investment_focus || null,
      main_developer: formData.main_developer || null,
      // Maturity
      maturity_level: formData.maturity_level || null,
      maturity_label: formData.maturity_label || null,
      // Prices
      price_range_min: formData.price_range_min ? parseFloat(formData.price_range_min) : null,
      price_range_max: formData.price_range_max ? parseFloat(formData.price_range_max) : null,
      ticket_1br_min: formData.ticket_1br_min ? parseFloat(formData.ticket_1br_min) : null,
      ticket_1br_max: formData.ticket_1br_max ? parseFloat(formData.ticket_1br_max) : null,
      // Legacy fields
      population: formData.population ? parseInt(formData.population) : null,
      occupancy_rate: formData.occupancy_rate ? parseFloat(formData.occupancy_rate) : null,
      absorption_rate: formData.absorption_rate ? parseFloat(formData.absorption_rate) : null,
    };

    let error;
    if (zone) {
      ({ error } = await supabase.from("zones").update(zoneData).eq("id", zone.id));
    } else {
      ({ error } = await supabase.from("zones").insert(zoneData));
    }

    setSaving(false);

    if (error) {
      toast({
        title: "Error guardando zona",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Zona guardada",
        description: `La zona "${formData.name}" ha sido ${zone ? "actualizada" : "creada"} exitosamente.`,
      });
      onSaved();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{zone ? "Editar Zona" : "Crear Nueva Zona"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Información Básica</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Zona *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ej: Downtown Dubai"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color del Polígono</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder='ej: "El Centro del Mundo"'
              />
            </div>

            <div className="space-y-2">
              <Label>Imagen de la Zona (800×450px recomendado)</Label>
              <div className="flex items-start gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-48 h-28 object-cover rounded-lg border" 
                    />
                    <button 
                      type="button"
                      onClick={removeImage} 
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-48 h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Click o Ctrl+V</span>
                  </div>
                )}
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageSelect} 
                  className="hidden" 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Investment Profile */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Perfil de Inversión</h3>
            
            <div className="space-y-2">
              <Label htmlFor="concept">Concepto</Label>
              <Textarea
                id="concept"
                value={formData.concept}
                onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                placeholder="ej: El kilómetro cuadrado más prestigioso y turístico."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_types">Tipos de Propiedad</Label>
              <Textarea
                id="property_types"
                value={formData.property_types}
                onChange={(e) => setFormData({ ...formData, property_types: e.target.value })}
                placeholder="ej: Torres Residenciales, Penthouses, Villas, Townhouses..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="investment_focus">Enfoque de Inversión</Label>
                <Input
                  id="investment_focus"
                  value={formData.investment_focus}
                  onChange={(e) => setFormData({ ...formData, investment_focus: e.target.value })}
                  placeholder="ej: Airbnb + Preservación de Capital"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="main_developer">Desarrollador Principal</Label>
                <Input
                  id="main_developer"
                  value={formData.main_developer}
                  onChange={(e) => setFormData({ ...formData, main_developer: e.target.value })}
                  placeholder="ej: Emaar"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Maturity Level */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Nivel de Madurez</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maturity_level">Nivel de Madurez: {formData.maturity_level}%</Label>
                <Slider
                  value={[formData.maturity_level]}
                  onValueChange={(value) => setFormData({ ...formData, maturity_level: value[0] })}
                  min={0}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maturity_label">Etiqueta de Madurez</Label>
                <Input
                  id="maturity_label"
                  value={formData.maturity_label}
                  onChange={(e) => setFormData({ ...formData, maturity_label: e.target.value })}
                  placeholder="ej: Saturado / Escasez"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Prices */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Precios</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_range_min">Precio Mínimo (AED/sqft)</Label>
                <Input
                  id="price_range_min"
                  type="number"
                  value={formData.price_range_min}
                  onChange={(e) => setFormData({ ...formData, price_range_min: e.target.value })}
                  placeholder="ej: 2200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_range_max">Precio Máximo (AED/sqft)</Label>
                <Input
                  id="price_range_max"
                  type="number"
                  value={formData.price_range_max}
                  onChange={(e) => setFormData({ ...formData, price_range_max: e.target.value })}
                  placeholder="ej: 4500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticket_1br_min">Ticket 1BR Mínimo (AED)</Label>
                <Input
                  id="ticket_1br_min"
                  type="number"
                  value={formData.ticket_1br_min}
                  onChange={(e) => setFormData({ ...formData, ticket_1br_min: e.target.value })}
                  placeholder="ej: 2000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket_1br_max">Ticket 1BR Máximo (AED)</Label>
                <Input
                  id="ticket_1br_max"
                  type="number"
                  value={formData.ticket_1br_max}
                  onChange={(e) => setFormData({ ...formData, ticket_1br_max: e.target.value })}
                  placeholder="ej: 3500000"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Map */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Polígono de la Zona</h3>
            
            <p className="text-sm text-muted-foreground">
              Usa la herramienta de polígono para dibujar el límite de la zona en el mapa
            </p>
            <div
              ref={mapContainer}
              className="h-96 rounded-lg border"
              style={{ display: isLoading ? "none" : "block" }}
            />
            {isLoading && (
              <div className="h-96 rounded-lg border flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {zone ? "Actualizar Zona" : "Crear Zona"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ZoneForm;