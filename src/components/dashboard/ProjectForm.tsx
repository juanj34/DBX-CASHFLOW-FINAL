import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, X, Home, Building2, Store } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { optimizeImage, PROJECT_IMAGE_CONFIG } from "@/lib/imageUtils";

interface ProjectFormProps {
  project?: any;
  onClose: () => void;
  onSaved: () => void;
}

// Unit type options
const UNIT_TYPE_OPTIONS = [
  { value: "studio", label: "Studio", category: "residential" },
  { value: "1br", label: "1BR", category: "residential" },
  { value: "2br", label: "2BR", category: "residential" },
  { value: "3br", label: "3BR", category: "residential" },
  { value: "4br", label: "4BR+", category: "residential" },
  { value: "penthouse", label: "Penthouse", category: "residential" },
  { value: "villa", label: "Villa", category: "special" },
  { value: "townhouse", label: "Townhouse", category: "special" },
  { value: "commercial", label: "Commercial", category: "special" },
];

const ProjectForm = ({ project, onClose, onSaved }: ProjectFormProps) => {
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: mapboxToken } = useMapboxToken();

  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    latitude: project?.latitude || "25.2048",
    longitude: project?.longitude || "55.2708",
    developer_id: project?.developer_id || "",
    developer: project?.developer || "",
    starting_price: project?.starting_price || "",
    price_per_sqft: project?.price_per_sqft || "",
    areas_from: project?.areas_from || "",
    unit_types: project?.unit_types || [],
    launch_date: project?.launch_date || "",
    delivery_date: project?.delivery_date || "",
    construction_status: project?.construction_status || "off_plan",
  });
  
  // Helper to check if unit type is selected
  const isUnitTypeSelected = (type: string) => {
    return Array.isArray(formData.unit_types) && formData.unit_types.includes(type);
  };
  
  // Toggle unit type selection
  const toggleUnitType = (type: string) => {
    const currentTypes = Array.isArray(formData.unit_types) ? formData.unit_types : [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    setFormData({ ...formData, unit_types: newTypes });
  };
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(project?.image_url || null);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch developers for dropdown
  useEffect(() => {
    const fetchDevelopers = async () => {
      const { data } = await supabase.from("developers").select("id, name, logo_url").order("name");
      setDevelopers(data || []);
    };
    fetchDevelopers();
  }, []);

  // Paste handler for images
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
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
      zoom: 12,
    });

    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: "#10B981",
    })
      .setLngLat([parseFloat(formData.longitude), parseFloat(formData.latitude)])
      .addTo(map.current);

    marker.current.on("dragend", () => {
      const lngLat = marker.current!.getLngLat();
      setFormData((prev) => ({
        ...prev,
        latitude: lngLat.lat.toFixed(6),
        longitude: lngLat.lng.toFixed(6),
      }));
    });

    map.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      marker.current?.setLngLat([lng, lat]);
      setFormData((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (marker.current && map.current) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        marker.current.setLngLat([lng, lat]);
        map.current.setCenter([lng, lat]);
      }
    }
  }, [formData.latitude, formData.longitude]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(project?.image_url || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return project?.image_url || null;

    try {
      const optimized = await optimizeImage(imageFile, PROJECT_IMAGE_CONFIG);
      const fileName = `${Date.now()}-${formData.name.replace(/\s+/g, "-").toLowerCase()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(fileName, optimized, { contentType: "image/webp" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("project-images")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        title: "Validation error",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      toast({
        title: "Validation error",
        description: "Please select a location on the map",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const imageUrl = await uploadImage();

      const projectData = {
        name: formData.name,
        description: formData.description || null,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        developer_id: formData.developer_id || null,
        developer: formData.developer || null,
        image_url: imageUrl,
        starting_price: formData.starting_price ? parseFloat(formData.starting_price) : null,
        price_per_sqft: formData.price_per_sqft ? parseFloat(formData.price_per_sqft) : null,
        areas_from: formData.areas_from ? parseInt(formData.areas_from) : null,
        unit_types: Array.isArray(formData.unit_types) && formData.unit_types.length > 0 
          ? formData.unit_types 
          : null,
        launch_date: formData.launch_date || null,
        delivery_date: formData.delivery_date || null,
        construction_status: formData.construction_status as any,
        hotspot_id: project?.hotspot_id || null,
      };

      let error;
      if (project) {
        ({ error } = await supabase.from("projects").update(projectData).eq("id", project.id));
      } else {
        ({ error } = await supabase.from("projects").insert(projectData));
      }

      if (error) throw error;

      toast({
        title: "Project saved",
        description: `Project has been successfully ${project ? "updated" : "created"}.`,
      });
      onSaved();
    } catch (error: any) {
      toast({
        title: "Error saving project",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create New Project"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Image */}
          <div className="space-y-2">
            <Label>Project Image (800x450px recomendado, 16:9)</Label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Project preview"
                    className="w-48 h-28 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
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

          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Creek Harbour Tower"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the project..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Location *</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="25.2048"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="55.2708"
                />
              </div>
            </div>
            <div
              ref={mapContainer}
              className="w-full h-[300px] rounded-lg border"
            />
            <p className="text-sm text-muted-foreground">
              Click on the map or drag the marker to set the project location
            </p>
          </div>

          {/* Developer Selection */}
          <div className="space-y-2">
            <Label htmlFor="developer_id">Developer</Label>
            <Select
              value={formData.developer_id}
              onValueChange={(value) => {
                const dev = developers.find(d => d.id === value);
                setFormData({ 
                  ...formData, 
                  developer_id: value,
                  developer: dev?.name || ""
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a developer" />
              </SelectTrigger>
              <SelectContent>
                {developers.map((dev) => (
                  <SelectItem key={dev.id} value={dev.id}>
                    <div className="flex items-center gap-2">
                      {dev.logo_url && (
                        <img src={dev.logo_url} alt="" className="w-5 h-5 object-contain" />
                      )}
                      {dev.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Or enter manually:
            </p>
            <Input
              id="developer"
              value={formData.developer}
              onChange={(e) => setFormData({ ...formData, developer: e.target.value, developer_id: "" })}
              placeholder="e.g., Emaar Properties"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starting_price">Starting Price (AED)</Label>
              <Input
                id="starting_price"
                type="number"
                value={formData.starting_price}
                onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                placeholder="e.g., 1500000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_per_sqft">Price per Sq.Ft (AED)</Label>
              <Input
                id="price_per_sqft"
                type="number"
                value={formData.price_per_sqft}
                onChange={(e) => setFormData({ ...formData, price_per_sqft: e.target.value })}
                placeholder="e.g., 2500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="areas_from">Areas From (sq.ft)</Label>
              <Input
                id="areas_from"
                type="number"
                value={formData.areas_from}
                onChange={(e) => setFormData({ ...formData, areas_from: e.target.value })}
                placeholder="e.g., 800"
              />
            </div>

          </div>

          {/* Unit Types Section */}
          <div className="space-y-3">
            <Label>Unit Types</Label>
            
            {/* Residential Types */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Home className="h-3.5 w-3.5" />
                <span>Residential</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {UNIT_TYPE_OPTIONS.filter(t => t.category === "residential").map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${
                      isUnitTypeSelected(type.value)
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-background border-border hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      checked={isUnitTypeSelected(type.value)}
                      onCheckedChange={() => toggleUnitType(type.value)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Special Types (Villa, Townhouse, Commercial) */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Building2 className="h-3.5 w-3.5" />
                <span>Special Unit Types</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {UNIT_TYPE_OPTIONS.filter(t => t.category === "special").map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${
                      isUnitTypeSelected(type.value)
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-background border-border hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      checked={isUnitTypeSelected(type.value)}
                      onCheckedChange={() => toggleUnitType(type.value)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="launch_date">Launch Date</Label>
              <Input
                id="launch_date"
                type="date"
                value={formData.launch_date}
                onChange={(e) => setFormData({ ...formData, launch_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date">Delivery Date</Label>
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="construction_status">Construction Status</Label>
            <Select
              value={formData.construction_status}
              onValueChange={(value) =>
                setFormData({ ...formData, construction_status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off_plan">Off Plan</SelectItem>
                <SelectItem value="under_construction">Under Construction</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {project ? "Update Project" : "Create Project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;
