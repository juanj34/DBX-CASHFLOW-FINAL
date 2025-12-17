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
        title: "Zona eliminada",
        description: "La zona ha sido eliminada exitosamente.",
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
        <h2 className="text-3xl font-semibold">Gestión de Zonas</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Zona
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar zonas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tagline</TableHead>
              <TableHead>Madurez</TableHead>
              <TableHead>Rango de Precios</TableHead>
              <TableHead>Desarrollador</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredZones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No se encontraron zonas. Crea tu primera zona para comenzar.
                </TableCell>
              </TableRow>
            ) : (
              filteredZones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
                    {zone.tagline || "—"}
                  </TableCell>
                  <TableCell>
                    {zone.maturity_level ? (
                      <div className="flex items-center gap-2">
                        <Progress value={zone.maturity_level} className="h-2 w-16" />
                        <span className="text-sm">{zone.maturity_level}%</span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatPriceRange(zone.price_range_min, zone.price_range_max)}
                  </TableCell>
                  <TableCell>{zone.main_developer || "—"}</TableCell>
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
            <AlertDialogTitle>Eliminar Zona</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{deletingZone?.name}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ZonesManager;