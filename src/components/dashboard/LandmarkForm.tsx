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
import { Loader2, Upload, Link as LinkIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LandmarkFormProps {
  landmark?: any;
  onClose: () => void;
  onSaved: () => void;
}

const LandmarkForm = ({ landmark, onClose, onSaved }: LandmarkFormProps) => {
  const { data: token, isLoading } = useMapboxToken();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  const [formData, setFormData] = useState({
    title: landmark?.title || "",
    description: landmark?.description || "",
    image_url: landmark?.image_url || "",
    latitude: landmark?.latitude?.toString() || "",
    longitude: landmark?.longitude?.toString() || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(landmark?.image_url || "");

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("landmark-images")
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("landmark-images")
      .getPublicUrl(fileName);

    setFormData((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    setImagePreview(urlData.publicUrl);
    setUploading(false);

    toast({
      title: "Image uploaded",
      description: "Image has been uploaded successfully",
    });
  };

  const handleUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, image_url: url }));
    setImagePreview(url);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation error",
        description: "Landmark title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.image_url.trim()) {
      toast({
        title: "Validation error",
        description: "Image is required for landmarks",
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

    const landmarkData = {
      title: formData.title,
      description: formData.description || null,
      image_url: formData.image_url,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
    };

    let error;
    if (landmark) {
      ({ error } = await supabase.from("landmarks").update(landmarkData).eq("id", landmark.id));
    } else {
      ({ error } = await supabase.from("landmarks").insert(landmarkData));
    }

    setSaving(false);

    if (error) {
      toast({
        title: "Error saving landmark",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Landmark saved",
        description: `Landmark "${formData.title}" has been successfully ${landmark ? "updated" : "created"}.`,
      });
      onSaved();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{landmark ? "Edit Landmark" : "Create New Landmark"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Downtown Dubai Panorama"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the view..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Image * (Required)</Label>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="url">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  URL
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </TabsContent>
              <TabsContent value="url" className="space-y-2">
                <Input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </TabsContent>
            </Tabs>

            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                  onError={() => setImagePreview("")}
                />
              </div>
            )}
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
              className="h-64 rounded-lg border"
              style={{ display: isLoading ? "none" : "block" }}
            />
            {isLoading && (
              <div className="h-64 rounded-lg border flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {landmark ? "Update Landmark" : "Create Landmark"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LandmarkForm;
