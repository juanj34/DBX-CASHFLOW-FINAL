import { useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Loader2, Upload, X, Star, TrendingUp, DollarSign, Paintbrush, Repeat, Wrench, Award } from "lucide-react";
import { optimizeImage, LOGO_CONFIG } from "@/lib/imageUtils";
import { calculateTrustScore, getTierInfo } from "@/components/roi/developerTrustScore";
import { TierBadge } from "@/components/roi/TierBadge";

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
    short_bio: developer?.short_bio || "",
    founded_year: developer?.founded_year || "",
    headquarters: developer?.headquarters || "",
    website: developer?.website || "",
    projects_launched: developer?.projects_launched || "",
    units_sold: developer?.units_sold || "",
    occupancy_rate: developer?.occupancy_rate || "",
    on_time_delivery_rate: developer?.on_time_delivery_rate || "",
    total_valuation: developer?.total_valuation || "",
    flagship_project: developer?.flagship_project || "",
    rating_quality: developer?.rating_quality || 5,
    rating_track_record: developer?.rating_track_record || 5,
    rating_sales: developer?.rating_sales || 5,
    rating_design: developer?.rating_design || 5,
    rating_flip_potential: developer?.rating_flip_potential || 5,
    score_maintenance: developer?.score_maintenance || 5,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(developer?.logo_url || null);
  const [saving, setSaving] = useState(false);

  // Calculate Trust Score in real-time
  const trustScorePreview = useMemo(() => {
    return calculateTrustScore({
      rating_track_record: formData.rating_track_record,
      rating_quality: formData.rating_quality,
      rating_flip_potential: formData.rating_flip_potential,
      score_maintenance: formData.score_maintenance,
    });
  }, [formData.rating_track_record, formData.rating_quality, formData.rating_flip_potential, formData.score_maintenance]);

  const tierPreview = useMemo(() => getTierInfo(trustScorePreview), [trustScorePreview]);

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
        short_bio: formData.short_bio || null,
        logo_url: logoUrl,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        headquarters: formData.headquarters || null,
        website: formData.website || null,
        projects_launched: formData.projects_launched ? parseInt(formData.projects_launched) : null,
        units_sold: formData.units_sold ? parseInt(formData.units_sold) : null,
        occupancy_rate: formData.occupancy_rate ? parseFloat(formData.occupancy_rate) : null,
        on_time_delivery_rate: formData.on_time_delivery_rate ? parseFloat(formData.on_time_delivery_rate) : null,
        total_valuation: formData.total_valuation ? parseFloat(formData.total_valuation) : null,
        flagship_project: formData.flagship_project || null,
        rating_quality: formData.rating_quality || 5,
        rating_track_record: formData.rating_track_record || 5,
        rating_sales: formData.rating_sales || 5,
        rating_design: formData.rating_design || 5,
        rating_flip_potential: formData.rating_flip_potential || 5,
        score_maintenance: formData.score_maintenance || 5,
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
          {/* Trust Score Preview */}
          <div 
            className="flex items-center justify-between p-4 rounded-xl border"
            style={{ 
              backgroundColor: tierPreview.bgColor,
              borderColor: `${tierPreview.color}40`
            }}
          >
            <div className="flex items-center gap-3">
              <TierBadge score={trustScorePreview} variant="default" />
              <span className="text-sm text-muted-foreground">Trust Score Preview</span>
            </div>
            <span 
              className="text-3xl font-bold"
              style={{ color: tierPreview.color }}
            >
              {trustScorePreview.toFixed(1)}
            </span>
          </div>

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

          {/* Flagship Project */}
          <div className="space-y-2">
            <Label htmlFor="flagship_project" className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Flagship Project
            </Label>
            <Input
              id="flagship_project"
              value={formData.flagship_project}
              onChange={(e) => setFormData({ ...formData, flagship_project: e.target.value })}
              placeholder="e.g., Burj Khalifa, Downtown Dubai"
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

          {/* Total Valuation */}
          <div className="space-y-2">
            <Label htmlFor="total_valuation">Total Valuation (Billion AED)</Label>
            <Input
              id="total_valuation"
              type="number"
              step="0.1"
              value={formData.total_valuation}
              onChange={(e) => setFormData({ ...formData, total_valuation: e.target.value })}
              placeholder="e.g., 12.5"
            />
          </div>

          {/* Short Bio */}
          <div className="space-y-2">
            <Label htmlFor="short_bio">Short Bio</Label>
            <Input
              id="short_bio"
              value={formData.short_bio}
              onChange={(e) => setFormData({ ...formData, short_bio: e.target.value })}
              placeholder="e.g., UAE's largest developer since 1997"
            />
          </div>

          {/* Trust Score Ratings Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Trust Score Pillars (0-10)
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              These 4 ratings determine the Trust Score: Track Record (40%) + Quality (25%) + ROI Potential (25%) + Maintenance (10%)
            </p>
            
            <div className="grid grid-cols-1 gap-4 bg-muted/30 rounded-lg p-4">
              {/* Track Record Rating - 40% */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    Track Record <span className="text-xs text-muted-foreground">(40%)</span>
                  </Label>
                  <span className="text-sm font-medium text-primary">{formData.rating_track_record}/10</span>
                </div>
                <Slider
                  value={[formData.rating_track_record]}
                  onValueChange={(v) => setFormData({ ...formData, rating_track_record: v[0] })}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Quality Rating - 25% */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-blue-400" />
                    Build Quality <span className="text-xs text-muted-foreground">(25%)</span>
                  </Label>
                  <span className="text-sm font-medium text-primary">{formData.rating_quality}/10</span>
                </div>
                <Slider
                  value={[formData.rating_quality]}
                  onValueChange={(v) => setFormData({ ...formData, rating_quality: v[0] })}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Flip Potential Rating - 25% */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Repeat className="h-3.5 w-3.5 text-cyan-400" />
                    ROI Potential <span className="text-xs text-muted-foreground">(25%)</span>
                  </Label>
                  <span className="text-sm font-medium text-primary">{formData.rating_flip_potential}/10</span>
                </div>
                <Slider
                  value={[formData.rating_flip_potential]}
                  onValueChange={(v) => setFormData({ ...formData, rating_flip_potential: v[0] })}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Maintenance Rating - 10% */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 text-orange-400" />
                    Maintenance & Management <span className="text-xs text-muted-foreground">(10%)</span>
                  </Label>
                  <span className="text-sm font-medium text-primary">{formData.score_maintenance}/10</span>
                </div>
                <Slider
                  value={[formData.score_maintenance]}
                  onValueChange={(v) => setFormData({ ...formData, score_maintenance: v[0] })}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Additional Ratings Section (not part of Trust Score) */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              Additional Metrics (0-10)
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Sales Rating */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-green-400" />
                    Sales Performance
                  </Label>
                  <span className="text-sm font-medium text-primary">{formData.rating_sales}/10</span>
                </div>
                <Slider
                  value={[formData.rating_sales]}
                  onValueChange={(v) => setFormData({ ...formData, rating_sales: v[0] })}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Design Rating */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Paintbrush className="h-3.5 w-3.5 text-purple-400" />
                    Design
                  </Label>
                  <span className="text-sm font-medium text-primary">{formData.rating_design}/10</span>
                </div>
                <Slider
                  value={[formData.rating_design]}
                  onValueChange={(v) => setFormData({ ...formData, rating_design: v[0] })}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>
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