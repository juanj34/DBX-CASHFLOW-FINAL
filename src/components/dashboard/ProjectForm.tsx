import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import HotspotForm from "./HotspotForm";

interface ProjectFormProps {
  project?: any;
  onClose: () => void;
  onSaved: () => void;
}

const ProjectForm = ({ project, onClose, onSaved }: ProjectFormProps) => {
  const { toast } = useToast();
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [showHotspotForm, setShowHotspotForm] = useState(false);
  const [formData, setFormData] = useState({
    hotspot_id: project?.hotspot_id || "",
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
    fetchHotspots();
  }, []);

  const fetchHotspots = async () => {
    const { data } = await supabase
      .from("hotspots")
      .select("*")
      .eq("category", "project")
      .order("title");
    setHotspots(data || []);
  };

  const handleSave = async () => {
    if (!formData.hotspot_id) {
      toast({
        title: "Validation error",
        description: "Please select or create a hotspot for this project",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const projectData = {
      hotspot_id: formData.hotspot_id,
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
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{project ? "Edit Project" : "Create New Project"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hotspot_id">Project Hotspot *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.hotspot_id}
                  onValueChange={(value) => setFormData({ ...formData, hotspot_id: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select existing hotspot" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotspots.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setShowHotspotForm(true)}>
                  Create New
                </Button>
              </div>
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

      {showHotspotForm && (
        <HotspotForm
          onClose={() => setShowHotspotForm(false)}
          onSaved={() => {
            fetchHotspots();
            setShowHotspotForm(false);
          }}
        />
      )}
    </>
  );
};

export default ProjectForm;
