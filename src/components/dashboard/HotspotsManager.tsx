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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import HotspotForm from "./HotspotForm";
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
import { Badge } from "@/components/ui/badge";

const HotspotsManager = () => {
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingHotspot, setEditingHotspot] = useState<any>(null);
  const [deletingHotspot, setDeletingHotspot] = useState<any>(null);
  const { toast } = useToast();

  const fetchHotspots = async () => {
    const { data, error } = await supabase
      .from("hotspots")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching hotspots",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setHotspots(data || []);
    }
  };

  useEffect(() => {
    fetchHotspots();
  }, []);

  const handleDelete = async () => {
    if (!deletingHotspot) return;

    const { error } = await supabase
      .from("hotspots")
      .delete()
      .eq("id", deletingHotspot.id);

    if (error) {
      toast({
        title: "Error deleting hotspot",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Hotspot deleted",
        description: "The hotspot has been successfully deleted.",
      });
      fetchHotspots();
    }
    setDeletingHotspot(null);
  };

  const filteredHotspots = hotspots.filter((hotspot) => {
    const matchesSearch = hotspot.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || hotspot.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      landmark: "bg-blue-500",
      metro: "bg-purple-500",
      attraction: "bg-pink-500",
      project: "bg-emerald-500",
    };
    return colors[category] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold">Hotspots Management</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Hotspot
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hotspots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="landmark">Landmark</SelectItem>
            <SelectItem value="metro">Metro</SelectItem>
            <SelectItem value="attraction">Attraction</SelectItem>
            <SelectItem value="project">Project</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHotspots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No hotspots found. Create your first hotspot to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredHotspots.map((hotspot) => (
                <TableRow key={hotspot.id}>
                  <TableCell className="font-medium">{hotspot.title}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(hotspot.category)}>
                      {hotspot.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingHotspot(hotspot);
                        setShowForm(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingHotspot(hotspot)}
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
        <HotspotForm
          hotspot={editingHotspot}
          onClose={() => {
            setShowForm(false);
            setEditingHotspot(null);
          }}
          onSaved={() => {
            fetchHotspots();
            setShowForm(false);
            setEditingHotspot(null);
          }}
        />
      )}

      <AlertDialog open={!!deletingHotspot} onOpenChange={() => setDeletingHotspot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hotspot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingHotspot?.title}"? This action cannot be undone.
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

export default HotspotsManager;
