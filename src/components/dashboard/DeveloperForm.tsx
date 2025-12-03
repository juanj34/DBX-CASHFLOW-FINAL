import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Loader2, Upload, X } from "lucide-react";
import { optimizeImage, LOGO_CONFIG } from "@/lib/imageUtils";

interface DeveloperFormProps {
  developer?: any;
  onClose: () => void;
  onSaved: () => void;
}

const DeveloperForm = ({ developer, onClose, onSaved }: DeveloperFormProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: developer?.name || "",
    description: developer?.description || "",
    founded_year: developer?.founded_year || "",
    headquarters: developer?.headquarters || "",
    website: developer?.website || "",
    projects_launched: developer?.projects_launched || "",
    units_sold: developer?.units_sold || "",
    occupancy_rate: developer?.occupancy_rate || "",
    on_time_delivery_rate: developer?.on_time_delivery_rate || "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(developer?.logo_url || null);
  const [saving, setSaving] = useState(false);

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(developer?.logo_url || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return developer?.logo_url || null;

    try {
      const optimized = await optimizeImage(logoFile, LOGO_CONFIG);
      const fileName = `${Date.now()}-${formData.name.replace(/\s+/g, "-").toLowerCase()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("developer-logos")
        .upload(fileName, optimized, { contentType: "image/webp" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("developer-logos")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Logo upload error:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        title: "Validation error",
        description: "Please enter a developer name",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const logoUrl = await uploadLogo();

      const developerData = {
        name: formData.name,
        description: formData.description || null,
        logo_url: logoUrl,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        headquarters: formData.headquarters || null,
        website: formData.website || null,
        projects_launched: formData.projects_launched ? parseInt(formData.projects_launched) : null,
        units_sold: formData.units_sold ? parseInt(formData.units_sold) : null,
        occupancy_rate: formData.occupancy_rate ? parseFloat(formData.occupancy_rate) : null,
        on_time_delivery_rate: formData.on_time_delivery_rate ? parseFloat(formData.on_time_delivery_rate) : null,
      };

      let error;
      if (developer) {
        ({ error } = await supabase.from("developers").update(developerData).eq("id", developer.id));
      } else {
        ({ error } = await supabase.from("developers").insert(developerData));
      }

      if (error) throw error;

      toast({
        title: "Developer saved",
        description: `Developer has been successfully ${developer ? "updated" : "created"}.`,
      });
      onSaved();
    } catch (error: any) {
      toast({
        title: "Error saving developer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{developer ? "Edit Developer" : "Create New Developer"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo (200x200px recomendado)</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-20 h-20 object-contain rounded-lg border bg-muted"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Click para subir o Ctrl+V para pegar
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Developer Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Emaar Properties"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the developer..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="founded_year">Founded Year</Label>
              <Input
                id="founded_year"
                type="number"
                value={formData.founded_year}
                onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                placeholder="e.g., 1997"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headquarters">Headquarters</Label>
              <Input
                id="headquarters"
                value={formData.headquarters}
                onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                placeholder="e.g., Dubai, UAE"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="e.g., https://www.emaar.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projects_launched">Projects Launched</Label>
              <Input
                id="projects_launched"
                type="number"
                value={formData.projects_launched}
                onChange={(e) => setFormData({ ...formData, projects_launched: e.target.value })}
                placeholder="e.g., 60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="units_sold">Units Sold</Label>
              <Input
                id="units_sold"
                type="number"
                value={formData.units_sold}
                onChange={(e) => setFormData({ ...formData, units_sold: e.target.value })}
                placeholder="e.g., 50000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occupancy_rate">Occupancy Rate (%)</Label>
              <Input
                id="occupancy_rate"
                type="number"
                step="0.1"
                value={formData.occupancy_rate}
                onChange={(e) => setFormData({ ...formData, occupancy_rate: e.target.value })}
                placeholder="e.g., 95.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="on_time_delivery_rate">On-Time Delivery Rate (%)</Label>
              <Input
                id="on_time_delivery_rate"
                type="number"
                step="0.1"
                value={formData.on_time_delivery_rate}
                onChange={(e) => setFormData({ ...formData, on_time_delivery_rate: e.target.value })}
                placeholder="e.g., 98.0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {developer ? "Update Developer" : "Create Developer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeveloperForm;
