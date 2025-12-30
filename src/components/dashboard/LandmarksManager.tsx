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
import { useLanguage } from "@/contexts/LanguageContext";

interface Landmark {
  id: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
}

const LandmarksManager = () => {
  const { t } = useLanguage();
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
        title: t('errorDeletingLandmark'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('landmarkDeleted'),
        description: `"${deletingLandmark.title}" ${t('hasBeenDeleted')}.`,
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
          <h2 className="text-2xl font-bold tracking-tight text-theme-text">{t('landmarksManagement')}</h2>
          <p className="text-theme-text-muted">
            {t('landmarksDescription')}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          {t('addLandmark')}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-text-muted" />
          <Input
            placeholder={t('searchLandmarks')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted"
          />
        </div>
      </div>

      <div className="border border-theme-border rounded-lg overflow-x-auto bg-theme-card">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow className="border-theme-border hover:bg-theme-card-alt">
              <TableHead className="w-16 text-theme-text">{t('image')}</TableHead>
              <TableHead className="text-theme-text">{t('title')}</TableHead>
              <TableHead className="text-theme-text">{t('description')}</TableHead>
              <TableHead className="text-theme-text">{t('location')}</TableHead>
              <TableHead className="w-24 text-theme-text">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-theme-text-muted">
                  {t('loadingLandmarks')}...
                </TableCell>
              </TableRow>
            ) : filteredLandmarks?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-theme-text-muted">
                  {t('noLandmarksFound')}
                </TableCell>
              </TableRow>
            ) : (
              filteredLandmarks?.map((landmark) => (
                <TableRow key={landmark.id} className="border-theme-border hover:bg-theme-card-alt">
                  <TableCell>
                    {landmark.image_url ? (
                      <img
                        src={landmark.image_url}
                        alt={landmark.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Image className="h-5 w-5 text-theme-text-muted" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-theme-text">{landmark.title}</TableCell>
                  <TableCell className="max-w-xs truncate text-theme-text">
                    {landmark.description || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-theme-text-muted">
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
                        className="hover:bg-theme-card-alt"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(landmark)}
                        className="hover:bg-theme-card-alt"
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

      <AlertDialog open={!!deletingLandmark} onOpenChange={() => setDeletingLandmark(null)}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text">{t('deleteLandmark')}</AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              {t('deleteLandmarkConfirm')} "{deletingLandmark?.title}"? {t('actionCannotBeUndone')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-theme-card border-theme-border text-theme-text hover:bg-theme-card-alt">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LandmarksManager;
