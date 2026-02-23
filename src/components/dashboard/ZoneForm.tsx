import { useState, useEffect, useRef } from "react";
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
import { Loader2, Upload, X } from "lucide-react";
import { optimizeImage, ZONE_IMAGE_CONFIG } from "@/lib/imageUtils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ZoneFormProps {
  zone?: any;
  onClose: () => void;
  onSaved: () => void;
}

const ZoneForm = ({ zone, onClose, onSaved }: ZoneFormProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
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
        title: t('errorUploadingImage'),
        description: t('couldNotUploadImage'),
        variant: "destructive",
      });
      return formData.image_url || null;
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: t('validationError'),
        description: t('zoneNameRequired'),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const imageUrl = await uploadImage();

    const zoneData: Record<string, any> = {
      name: formData.name,
      tagline: formData.tagline || null,
      description: formData.description || null,
      color: formData.color,
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
        title: t('errorSavingZone'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('zoneSaved'),
        description: `${t('theZone')} "${formData.name}" ${t('hasBeenSuccessfully')} ${zone ? t('updated') : t('created')}.`,
      });
      onSaved();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-theme-card border-theme-border">
        <DialogHeader>
          <DialogTitle className="text-theme-text">{zone ? t('editZone') : t('createNewZone')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-theme-border pb-2 text-theme-text">{t('basicInformation')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-theme-text">{t('zoneName')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('zoneNamePlaceholder')}
                  className="bg-theme-bg border-theme-border text-theme-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color" className="text-theme-text">{t('polygonColor')}</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="bg-theme-bg border-theme-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline" className="text-theme-text">{t('tagline')}</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder={t('taglinePlaceholder')}
                className="bg-theme-bg border-theme-border text-theme-text"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-theme-text">{t('zoneImage')}</Label>
              <div className="flex items-start gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-48 h-28 object-cover rounded-lg border border-theme-border" 
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
                    className="w-48 h-28 border-2 border-dashed border-theme-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-theme-accent/50 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-theme-text-muted mb-1" />
                    <span className="text-xs text-theme-text-muted">{t('clickOrPaste')}</span>
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
            <h3 className="font-semibold text-lg border-b border-theme-border pb-2 text-theme-text">{t('investmentProfile')}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="concept" className="text-theme-text">{t('concept')}</Label>
              <Textarea
                id="concept"
                value={formData.concept}
                onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                placeholder={t('conceptPlaceholder')}
                rows={2}
                className="bg-theme-bg border-theme-border text-theme-text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_types" className="text-theme-text">{t('propertyTypes')}</Label>
              <Textarea
                id="property_types"
                value={formData.property_types}
                onChange={(e) => setFormData({ ...formData, property_types: e.target.value })}
                placeholder={t('propertyTypesPlaceholder')}
                rows={2}
                className="bg-theme-bg border-theme-border text-theme-text"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="investment_focus" className="text-theme-text">{t('investmentFocus')}</Label>
                <Input
                  id="investment_focus"
                  value={formData.investment_focus}
                  onChange={(e) => setFormData({ ...formData, investment_focus: e.target.value })}
                  placeholder={t('investmentFocusPlaceholder')}
                  className="bg-theme-bg border-theme-border text-theme-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="main_developer" className="text-theme-text">{t('mainDeveloper')}</Label>
                <Input
                  id="main_developer"
                  value={formData.main_developer}
                  onChange={(e) => setFormData({ ...formData, main_developer: e.target.value })}
                  placeholder={t('mainDeveloperPlaceholder')}
                  className="bg-theme-bg border-theme-border text-theme-text"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Maturity Level */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-theme-border pb-2 text-theme-text">{t('maturityLevel')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maturity_level" className="text-theme-text">{t('maturityLevel')}: {formData.maturity_level}%</Label>
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
                <Label htmlFor="maturity_label" className="text-theme-text">{t('maturityLabel')}</Label>
                <Input
                  id="maturity_label"
                  value={formData.maturity_label}
                  onChange={(e) => setFormData({ ...formData, maturity_label: e.target.value })}
                  placeholder={t('maturityLabelPlaceholder')}
                  className="bg-theme-bg border-theme-border text-theme-text"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Prices */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-theme-border pb-2 text-theme-text">{t('prices')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_range_min" className="text-theme-text">{t('minPrice')} (AED/sqft)</Label>
                <Input
                  id="price_range_min"
                  type="number"
                  value={formData.price_range_min}
                  onChange={(e) => setFormData({ ...formData, price_range_min: e.target.value })}
                  placeholder="e.g. 2200"
                  className="bg-theme-bg border-theme-border text-theme-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_range_max" className="text-theme-text">{t('maxPrice')} (AED/sqft)</Label>
                <Input
                  id="price_range_max"
                  type="number"
                  value={formData.price_range_max}
                  onChange={(e) => setFormData({ ...formData, price_range_max: e.target.value })}
                  placeholder="e.g. 4500"
                  className="bg-theme-bg border-theme-border text-theme-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticket_1br_min" className="text-theme-text">{t('ticket1brMin')} (AED)</Label>
                <Input
                  id="ticket_1br_min"
                  type="number"
                  value={formData.ticket_1br_min}
                  onChange={(e) => setFormData({ ...formData, ticket_1br_min: e.target.value })}
                  placeholder="e.g. 2000000"
                  className="bg-theme-bg border-theme-border text-theme-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket_1br_max" className="text-theme-text">{t('ticket1brMax')} (AED)</Label>
                <Input
                  id="ticket_1br_max"
                  type="number"
                  value={formData.ticket_1br_max}
                  onChange={(e) => setFormData({ ...formData, ticket_1br_max: e.target.value })}
                  placeholder="e.g. 3500000"
                  className="bg-theme-bg border-theme-border text-theme-text"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving} className="border-theme-border text-theme-text hover:bg-theme-card-alt">
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {zone ? t('updateZone') : t('createZone')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ZoneForm;
