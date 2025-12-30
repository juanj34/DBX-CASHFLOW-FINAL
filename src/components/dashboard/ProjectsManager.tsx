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
import ProjectForm from "./ProjectForm";
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
import { useLanguage } from "@/contexts/LanguageContext";

const ProjectsManager = () => {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [deletingProject, setDeletingProject] = useState<any>(null);
  const { toast } = useToast();

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: t('errorFetchingProjects'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProjects(data || []);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async () => {
    if (!deletingProject) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", deletingProject.id);

    if (error) {
      toast({
        title: t('errorDeletingProject'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('projectDeleted'),
        description: t('projectDeletedSuccess'),
      });
      fetchProjects();
    }
    setDeletingProject(null);
  };

  const filteredProjects = projects.filter((project) =>
    project.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold text-theme-text">{t('projectsManagement')}</h2>
        <Button onClick={() => setShowForm(true)} className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          {t('addProject')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-theme-text-muted" />
        <Input
          placeholder={t('searchProjects')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted"
        />
      </div>

      <div className="rounded-lg border border-theme-border bg-theme-card overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow className="border-theme-border hover:bg-theme-card-alt">
              <TableHead className="text-theme-text">{t('projectName')}</TableHead>
              <TableHead className="text-theme-text">{t('developer')}</TableHead>
              <TableHead className="text-theme-text">{t('startingPrice')}</TableHead>
              <TableHead className="text-theme-text">{t('status')}</TableHead>
              <TableHead className="text-right text-theme-text">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-theme-text-muted">
                  {t('noProjectsFound')}
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project.id} className="border-theme-border hover:bg-theme-card-alt">
                  <TableCell className="font-medium text-theme-text">{project.name || t('unnamedProject')}</TableCell>
                  <TableCell className="text-theme-text">{project.developer || "—"}</TableCell>
                  <TableCell className="text-theme-text">
                    {project.starting_price
                      ? `AED ${parseFloat(project.starting_price).toLocaleString()}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {project.construction_status && (
                      <Badge variant="outline" className="border-theme-border text-theme-text">{project.construction_status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingProject(project);
                        setShowForm(true);
                      }}
                      className="hover:bg-theme-card-alt"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingProject(project)}
                      className="hover:bg-theme-card-alt"
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
        <ProjectForm
          project={editingProject}
          onClose={() => {
            setShowForm(false);
            setEditingProject(null);
          }}
          onSaved={() => {
            fetchProjects();
            setShowForm(false);
            setEditingProject(null);
          }}
        />
      )}

      <AlertDialog open={!!deletingProject} onOpenChange={() => setDeletingProject(null)}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text">{t('deleteProject')}</AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              {t('deleteProjectConfirm')} {t('actionCannotBeUndone')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-theme-card border-theme-border text-theme-text hover:bg-theme-card-alt">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectsManager;
