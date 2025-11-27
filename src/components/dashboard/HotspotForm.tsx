import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMapboxToken } from "@/hooks/useMapboxToken";
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
import mapboxgl from "mapbox-gl";
import { Loader2 } from "lucide-react";

interface HotspotFormProps {
  hotspot?: any;
  onClose: () => void;
  onSaved: () => void;
}

const HotspotForm = ({ hotspot, onClose, onSaved }: HotspotFormProps) => {
  const { data: token, isLoading } = useMapboxToken();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  const [formData, setFormData] = useState({
    title: hotspot?.title || "",
    description: hotspot?.description || "",
    category: hotspot?.category || "landmark",
    latitude: hotspot?.latitude?.toString() || "",
    longitude: hotspot?.longitude?.toString() || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;

    const initialLng = formData.longitude ? parseFloat(formData.longitude) : 55.2708;
    const initialLat = formData.latitude ? parseFloat(formData.latitude) : 25.2048;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [initialLng, initialLat],
      zoom: 12,
    });

    marker.current = new mapboxgl.Marker({ draggable: true })
      .setLngLat([initialLng, initialLat])
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
      marker.current!.setLngLat(e.lngLat);
      setFormData((prev) => ({
        ...prev,
        latitude: e.lngLat.lat.toFixed(6),
        longitude: e.lngLat.lng.toFixed(6),
      }));
    });

    return () => {
      map.current?.remove();
    };
  }, [token]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation error",
        description: "Hotspot title is required",
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

    const hotspotData = {
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
    };

    let error;
    if (hotspot) {
      ({ error } = await supabase.from("hotspots").update(hotspotData).eq("id", hotspot.id));
    } else {
      ({ error } = await supabase.from("hotspots").insert(hotspotData));
    }

    setSaving(false);

    if (error) {
      toast({
        title: "Error saving hotspot",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Hotspot saved",
        description: `Hotspot "${formData.title}" has been successfully ${hotspot ? "updated" : "created"}.`,
      });
      onSaved();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{hotspot ? "Edit Hotspot" : "Create New Hotspot"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Hotspot Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Burj Khalifa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landmark">Landmark</SelectItem>
                  <SelectItem value="metro">Metro</SelectItem>
                  <SelectItem value="attraction">Attraction</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter hotspot description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                value={formData.latitude}
                onChange={(e) => {
                  setFormData({ ...formData, latitude: e.target.value });
                  if (marker.current && e.target.value && formData.longitude) {
                    marker.current.setLngLat([
                      parseFloat(formData.longitude),
                      parseFloat(e.target.value),
                    ]);
                  }
                }}
                placeholder="25.2048"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                value={formData.longitude}
                onChange={(e) => {
                  setFormData({ ...formData, longitude: e.target.value });
                  if (marker.current && formData.latitude && e.target.value) {
                    marker.current.setLngLat([
                      parseFloat(e.target.value),
                      parseFloat(formData.latitude),
                    ]);
                  }
                }}
                placeholder="55.2708"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Location on Map *</Label>
            <p className="text-sm text-muted-foreground">
              Click on the map or drag the marker to set the location
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
              {hotspot ? "Update Hotspot" : "Create Hotspot"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HotspotForm;
