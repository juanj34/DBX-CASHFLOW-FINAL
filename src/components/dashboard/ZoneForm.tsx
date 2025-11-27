import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2 } from "lucide-react";

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

  const [formData, setFormData] = useState({
    name: zone?.name || "",
    description: zone?.description || "",
    color: zone?.color || "#2563EB",
    population: zone?.population || "",
    occupancy_rate: zone?.occupancy_rate || "",
    absorption_rate: zone?.absorption_rate || "",
    image_url: zone?.image_url || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !mapContainer.current || map.current) return;

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
      defaultMode: "draw_polygon",
    });

    map.current.addControl(draw.current);

    // Load existing polygon if editing
    if (zone?.polygon) {
      draw.current.add({
        type: "Feature",
        geometry: zone.polygon,
        properties: {},
      });
    }

    return () => {
      map.current?.remove();
    };
  }, [token, zone]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation error",
        description: "Zone name is required",
        variant: "destructive",
      });
      return;
    }

    if (!draw.current) {
      toast({
        title: "Validation error",
        description: "Please draw a polygon on the map",
        variant: "destructive",
      });
      return;
    }

    const data = draw.current.getAll();
    if (data.features.length === 0) {
      toast({
        title: "Validation error",
        description: "Please draw a polygon on the map",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const polygon = data.features[0].geometry;

    const zoneData = {
      name: formData.name,
      description: formData.description || null,
      color: formData.color,
      polygon,
      population: formData.population ? parseInt(formData.population) : null,
      occupancy_rate: formData.occupancy_rate ? parseFloat(formData.occupancy_rate) : null,
      absorption_rate: formData.absorption_rate ? parseFloat(formData.absorption_rate) : null,
      image_url: formData.image_url || null,
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
        title: "Error saving zone",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Zone saved",
        description: `Zone "${formData.name}" has been successfully ${zone ? "updated" : "created"}.`,
      });
      onSaved();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{zone ? "Edit Zone" : "Create New Zone"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Zone Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Downtown Dubai"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter zone description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="population">Population</Label>
              <Input
                id="population"
                type="number"
                value={formData.population}
                onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                placeholder="e.g., 50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupancy_rate">Occupancy Rate (%)</Label>
              <Input
                id="occupancy_rate"
                type="number"
                step="0.1"
                value={formData.occupancy_rate}
                onChange={(e) => setFormData({ ...formData, occupancy_rate: e.target.value })}
                placeholder="e.g., 85.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="absorption_rate">Absorption Rate (%)</Label>
              <Input
                id="absorption_rate"
                type="number"
                step="0.1"
                value={formData.absorption_rate}
                onChange={(e) => setFormData({ ...formData, absorption_rate: e.target.value })}
                placeholder="e.g., 92.3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label>Draw Zone Polygon *</Label>
            <p className="text-sm text-muted-foreground">
              Use the polygon tool to draw the zone boundary on the map
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
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {zone ? "Update Zone" : "Create Zone"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ZoneForm;
