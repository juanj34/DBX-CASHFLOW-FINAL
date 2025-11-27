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
        description: "The zone has been successfully deleted.",
      });
      fetchZones();
    }
    setDeletingZone(null);
  };

  const filteredZones = zones.filter((zone) =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold">Zones Management</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Zone
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search zones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Population</TableHead>
              <TableHead>Occupancy Rate</TableHead>
              <TableHead>Absorption Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredZones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No zones found. Create your first zone to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredZones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.name}</TableCell>
                  <TableCell>{zone.population?.toLocaleString() || "—"}</TableCell>
                  <TableCell>{zone.occupancy_rate ? `${zone.occupancy_rate}%` : "—"}</TableCell>
                  <TableCell>{zone.absorption_rate ? `${zone.absorption_rate}%` : "—"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Zone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingZone?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ZonesManager;
