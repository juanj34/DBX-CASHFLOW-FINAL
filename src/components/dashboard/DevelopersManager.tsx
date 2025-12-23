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
import DeveloperForm from "./DeveloperForm";
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

const DevelopersManager = () => {
  const { toast } = useToast();
  const [developers, setDevelopers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingDeveloper, setEditingDeveloper] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchDevelopers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("developers")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error loading developers",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setDevelopers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase.from("developers").delete().eq("id", deleteId);

    if (error) {
      toast({
        title: "Error deleting developer",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Developer deleted" });
      fetchDevelopers();
    }
    setDeleteId(null);
  };

  const filteredDevelopers = developers.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Developers</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Developer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search developers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Founded</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Units Sold</TableHead>
              <TableHead>On-Time %</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredDevelopers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No developers found
                </TableCell>
              </TableRow>
            ) : (
              filteredDevelopers.map((dev) => (
                <TableRow key={dev.id}>
                  <TableCell>
                    {dev.logo_url ? (
                      <img
                        src={dev.logo_url}
                        alt={dev.name}
                        className="w-10 h-10 object-contain rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                        N/A
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{dev.name}</TableCell>
                  <TableCell>{dev.founded_year || "-"}</TableCell>
                  <TableCell>{dev.projects_launched || "-"}</TableCell>
                  <TableCell>{dev.units_sold?.toLocaleString() || "-"}</TableCell>
                  <TableCell>
                    {dev.on_time_delivery_rate ? `${dev.on_time_delivery_rate}%` : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingDeveloper(dev);
                          setShowForm(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(dev.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showForm && (
        <DeveloperForm
          developer={editingDeveloper}
          onClose={() => {
            setShowForm(false);
            setEditingDeveloper(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingDeveloper(null);
            fetchDevelopers();
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Developer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this developer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DevelopersManager;
