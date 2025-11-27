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
import { Loader2 } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/useMapboxToken";

interface ProjectFormProps {
  project?: any;
  onClose: () => void;
  onSaved: () => void;
}

const ProjectForm = ({ project, onClose, onSaved }: ProjectFormProps) => {
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { data: mapboxToken } = useMapboxToken();

  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    latitude: project?.latitude || "25.2048",
    longitude: project?.longitude || "55.2708",
    developer: project?.developer || "",
    starting_price: project?.starting_price || "",
    price_per_sqft: project?.price_per_sqft || "",
    areas_from: project?.areas_from || "",
    unit_types: project?.unit_types?.join(", ") || "",
    launch_date: project?.launch_date || "",
    delivery_date: project?.delivery_date || "",
    construction_status: project?.construction_status || "planning",
  });
  const [saving, setSaving] = useState(false);

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

    const projectData = {
      name: formData.name,
      description: formData.description || null,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      developer: formData.developer || null,
      starting_price: formData.starting_price ? parseFloat(formData.starting_price) : null,
      price_per_sqft: formData.price_per_sqft ? parseFloat(formData.price_per_sqft) : null,
      areas_from: formData.areas_from ? parseInt(formData.areas_from) : null,
      unit_types: formData.unit_types
        ? formData.unit_types.split(",").map((t) => t.trim())
        : null,
      launch_date: formData.launch_date || null,
      delivery_date: formData.delivery_date || null,
      construction_status: formData.construction_status,
      hotspot_id: project?.hotspot_id || null,
    };

    let error;
    if (project) {
      ({ error } = await supabase.from("projects").update(projectData).eq("id", project.id));
    } else {
      ({ error } = await supabase.from("projects").insert(projectData));
    }

    setSaving(false);

    if (error) {
      toast({
        title: "Error saving project",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Project saved",
        description: `Project has been successfully ${project ? "updated" : "created"}.`,
      });
      onSaved();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create New Project"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="developer">Developer</Label>
            <Input
              id="developer"
              value={formData.developer}
              onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
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

            <div className="space-y-2">
              <Label htmlFor="unit_types">Unit Types (comma-separated)</Label>
              <Input
                id="unit_types"
                value={formData.unit_types}
                onChange={(e) => setFormData({ ...formData, unit_types: e.target.value })}
                placeholder="e.g., Studio, 1BR, 2BR"
              />
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
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="under_construction">Under Construction</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="ready_to_move">Ready to Move</SelectItem>
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
