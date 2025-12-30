import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ZoneForm from "./ZoneForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

const ZonesManager = () => {
  const [zones, setZones] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [deletingZone, setDeletingZone] = useState<any>(null);
  const { toast } = useToast();

  const fetchZones = async () => {
    const { data, error } = await supabase
      .from("zones")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching zones",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setZones(data || []);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleDelete = async () => {
    if (!deletingZone) return;

    const { error } = await supabase
      .from("zones")
      .delete()
      .eq("id", deletingZone.id);

    if (error) {
      toast({
        title: "Error deleting zone",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Zone deleted",
        description: "The zone has been deleted successfully.",
      });
      fetchZones();
    }
    setDeletingZone(null);
  };

  const filteredZones = zones.filter((zone) =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    zone.tagline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    zone.main_developer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPriceRange = (min?: number, max?: number) => {
    if (!min && !max) return "—";
    return `${min?.toLocaleString() || "?"} – ${max?.toLocaleString() || "?"} AED/sqft`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold text-theme-text">Zones Management</h2>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Zone
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-theme-text-muted" />
        <Input
          placeholder="Search zones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted"
        />
      </div>

      <div className="rounded-lg border border-theme-border bg-theme-card overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="border-theme-border hover:bg-theme-card-alt">
              <TableHead className="text-theme-text-muted">Name</TableHead>
              <TableHead className="text-theme-text-muted">Tagline</TableHead>
              <TableHead className="text-theme-text-muted">Maturity</TableHead>
              <TableHead className="text-theme-text-muted">Price Range</TableHead>
              <TableHead className="text-theme-text-muted">Developer</TableHead>
              <TableHead className="text-right text-theme-text-muted">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredZones.length === 0 ? (
              <TableRow className="border-theme-border hover:bg-theme-card-alt">
                <TableCell colSpan={6} className="text-center text-theme-text-muted">
                  No zones found. Create your first zone to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredZones.map((zone) => (
                <TableRow key={zone.id} className="border-theme-border hover:bg-theme-card-alt">
                  <TableCell className="font-medium text-theme-text">{zone.name}</TableCell>
                  <TableCell className="text-theme-text-muted text-sm max-w-[150px] truncate">
                    {zone.tagline || "—"}
                  </TableCell>
                  <TableCell>
                    {zone.maturity_level ? (
                      <div className="flex items-center gap-2">
                        <Progress value={zone.maturity_level} className="h-2 w-16" />
                        <span className="text-sm text-theme-text">{zone.maturity_level}%</span>
                      </div>
                    ) : (
                      <span className="text-theme-text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-theme-text">
                    {formatPriceRange(zone.price_range_min, zone.price_range_max)}
                  </TableCell>
                  <TableCell className="text-theme-text">{zone.main_developer || "—"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card-alt"
                      onClick={() => {
                        setEditingZone(zone);
                        setShowForm(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-theme-text-muted hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingZone(zone)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showForm && (
        <ZoneForm
          zone={editingZone}
          onClose={() => {
            setShowForm(false);
            setEditingZone(null);
          }}
          onSaved={() => {
            fetchZones();
            setShowForm(false);
            setEditingZone(null);
          }}
        />
      )}

      <AlertDialog open={!!deletingZone} onOpenChange={() => setDeletingZone(null)}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text">Delete Zone</AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              Are you sure you want to delete "{deletingZone?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-theme-card-alt border-theme-border text-theme-text hover:bg-theme-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ZonesManager;