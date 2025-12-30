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
import { useLanguage } from "@/contexts/LanguageContext";

const DevelopersManager = () => {
  const { t } = useLanguage();
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
        title: t('errorLoadingDevelopers'),
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
        title: t('errorDeletingDeveloper'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: t('developerDeleted') });
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
        <h2 className="text-2xl font-semibold text-theme-text">{t('developersManagement')}</h2>
        <Button onClick={() => setShowForm(true)} className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          {t('addDeveloper')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-text-muted" />
        <Input
          placeholder={t('searchDevelopers')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted"
        />
      </div>

      <div className="border border-theme-border rounded-lg overflow-x-auto bg-theme-card">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="border-theme-border hover:bg-theme-card-alt">
              <TableHead className="w-16 text-theme-text">{t('logo')}</TableHead>
              <TableHead className="text-theme-text">{t('name')}</TableHead>
              <TableHead className="text-theme-text">{t('founded')}</TableHead>
              <TableHead className="text-theme-text">{t('projects')}</TableHead>
              <TableHead className="text-theme-text">{t('unitsSold')}</TableHead>
              <TableHead className="text-theme-text">{t('onTimePercent')}</TableHead>
              <TableHead className="w-24 text-theme-text">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-theme-text-muted">
                  {t('loading')}...
                </TableCell>
              </TableRow>
            ) : filteredDevelopers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-theme-text-muted">
                  {t('noDevelopersFound')}
                </TableCell>
              </TableRow>
            ) : (
              filteredDevelopers.map((dev) => (
                <TableRow key={dev.id} className="border-theme-border hover:bg-theme-card-alt">
                  <TableCell>
                    {dev.logo_url ? (
                      <img
                        src={dev.logo_url}
                        alt={dev.name}
                        className="w-10 h-10 object-contain rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs text-theme-text-muted">
                        N/A
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-theme-text">{dev.name}</TableCell>
                  <TableCell className="text-theme-text">{dev.founded_year || "-"}</TableCell>
                  <TableCell className="text-theme-text">{dev.projects_launched || "-"}</TableCell>
                  <TableCell className="text-theme-text">{dev.units_sold?.toLocaleString() || "-"}</TableCell>
                  <TableCell className="text-theme-text">
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
                        className="hover:bg-theme-card-alt"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(dev.id)}
                        className="hover:bg-theme-card-alt text-destructive"
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
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text">{t('deleteDeveloper')}</AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              {t('deleteDeveloperConfirm')} {t('actionCannotBeUndone')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-theme-card border-theme-border text-theme-text hover:bg-theme-card-alt">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DevelopersManager;
