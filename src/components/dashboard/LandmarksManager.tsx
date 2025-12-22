import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LandmarkForm from "./LandmarkForm";

interface Landmark {
  id: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
}

const LandmarksManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingLandmark, setEditingLandmark] = useState<Landmark | null>(null);
  const [deletingLandmark, setDeletingLandmark] = useState<Landmark | null>(null);

  const { data: landmarks, isLoading } = useQuery({
    queryKey: ["landmarks-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landmarks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleDeleteClick = (landmark: Landmark) => {
    setDeletingLandmark(landmark);
  };

  const confirmDelete = async () => {
    if (!deletingLandmark) return;

    const { error } = await supabase.from("landmarks").delete().eq("id", deletingLandmark.id);

    if (error) {
      toast({
        title: "Error deleting landmark",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Landmark deleted",
        description: `"${deletingLandmark.title}" has been deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ["landmarks-admin"] });
      queryClient.invalidateQueries({ queryKey: ["landmarks"] });
    }
    setDeletingLandmark(null);
  };

  const filteredLandmarks = landmarks?.filter((landmark) =>
    landmark.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLandmark(null);
  };

  const handleFormSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["landmarks-admin"] });
    queryClient.invalidateQueries({ queryKey: ["landmarks"] });
    handleFormClose();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Landmarks</h2>
          <p className="text-muted-foreground">
            Manage photo points for large area views
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Landmark
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search landmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading landmarks...
                </TableCell>
              </TableRow>
            ) : filteredLandmarks?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No landmarks found
                </TableCell>
              </TableRow>
            ) : (
              filteredLandmarks?.map((landmark) => (
                <TableRow key={landmark.id}>
                  <TableCell>
                    {landmark.image_url ? (
                      <img
                        src={landmark.image_url}
                        alt={landmark.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Image className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{landmark.title}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {landmark.description || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {Number(landmark.latitude).toFixed(4)}, {Number(landmark.longitude).toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingLandmark(landmark);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(landmark)}
                      >
                        <Trash2 className="h-4 w-4" />
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
        <LandmarkForm
          landmark={editingLandmark}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingLandmark} onOpenChange={() => setDeletingLandmark(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Landmark</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingLandmark?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LandmarksManager;
