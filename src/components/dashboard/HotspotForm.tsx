import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Link as LinkIcon } from "lucide-react";

interface HotspotFormProps {
  hotspot?: any;
  onClose: () => void;
  onSaved: () => void;
}

const HotspotForm = ({ hotspot, onClose, onSaved }: HotspotFormProps) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: hotspot?.title || "",
    description: hotspot?.description || "",
    category: hotspot?.category || "landmark",
    latitude: hotspot?.latitude?.toString() || "",
    longitude: hotspot?.longitude?.toString() || "",
    imageUrl: hotspot?.photos?.[0] || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(hotspot?.photos?.[0] || "");

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
        description: "Please enter latitude and longitude coordinates",
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
      photos: formData.imageUrl ? [formData.imageUrl] : null,
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
                  <SelectItem value="landmark">🏛️ Landmark</SelectItem>
                  <SelectItem value="district">🏙️ District</SelectItem>
                  <SelectItem value="masterplan">🗺️ Masterplan</SelectItem>
                  <SelectItem value="residential">🏠 Residential</SelectItem>
                  <SelectItem value="waterfront">🌊 Waterfront / Marina</SelectItem>
                  <SelectItem value="retail">🛍️ Retail / Commerce</SelectItem>
                  <SelectItem value="leisure">⭐ Leisure / Lifestyle</SelectItem>
                  <SelectItem value="golf">⛳ Golf Community</SelectItem>
                  <SelectItem value="infrastructure">✈️ Infrastructure</SelectItem>
                  <SelectItem value="heritage">🧭 Heritage</SelectItem>
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

          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>Image (Optional)</Label>
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
                  onChange={async (e) => {
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
                      .from("hotspot-images")
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
                      .from("hotspot-images")
                      .getPublicUrl(fileName);

                    setFormData((prev) => ({ ...prev, imageUrl: urlData.publicUrl }));
                    setImagePreview(urlData.publicUrl);
                    setUploading(false);

                    toast({
                      title: "Image uploaded",
                      description: "Image has been uploaded successfully",
                    });
                  }}
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
                  value={formData.imageUrl}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, imageUrl: e.target.value }));
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                />
              </TabsContent>
            </Tabs>

            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg border"
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
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="25.2048"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="55.2708"
              />
            </div>
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
