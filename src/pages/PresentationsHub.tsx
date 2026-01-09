import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, Presentation, MoreVertical, Copy, Trash2, Share2, Eye, Calendar, ArrowLeft, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePresentations, CreatePresentationInput } from "@/hooks/usePresentations";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { TopNavBar } from "@/components/roi/dashboard/TopNavBar";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PresentationsHub = () => {
  useDocumentTitle("Presentations");
  const navigate = useNavigate();
  const { presentations, loading, createPresentation, deletePresentation, duplicatePresentation, generateShareToken } = usePresentations();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPresentation, setNewPresentation] = useState<CreatePresentationInput>({ title: "" });

  const handleCreate = async () => {
    if (!newPresentation.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    const created = await createPresentation(newPresentation);
    if (created) {
      setCreateDialogOpen(false);
      setNewPresentation({ title: "" });
      navigate(`/presentations/${created.id}`);
    }
  };

  const handleShare = async (id: string) => {
    const token = await generateShareToken(id);
    if (token) {
      const url = `${window.location.origin}/present/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard");
    }
  };

  const handleCopyExistingLink = async (shareToken: string) => {
    const url = `${window.location.origin}/present/${shareToken}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Top Navigation */}
      <div className="sticky top-0 z-40 px-4 py-3 bg-theme-bg/80 backdrop-blur-xl border-b border-theme-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <TopNavBar />
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Presentation
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
            <Presentation className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-theme-text">Presentations</h1>
            <p className="text-sm text-theme-text-muted">Create and manage client presentations</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-theme-card animate-pulse rounded-xl" />
            ))}
          </div>
        ) : presentations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
              <Presentation className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-theme-text mb-2">No presentations yet</h2>
            <p className="text-theme-text-muted mb-6 max-w-md mx-auto">
              Create your first presentation to bundle quotes and comparisons for client meetings.
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Presentation
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presentations.map((presentation) => (
              <Card
                key={presentation.id}
                className="bg-theme-card border-theme-border hover:border-theme-accent/30 transition-all group cursor-pointer"
                onClick={() => navigate(`/presentations/${presentation.id}`)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-theme-text truncate group-hover:text-theme-accent transition-colors">
                        {presentation.title}
                      </h3>
                      {presentation.description && (
                        <p className="text-sm text-theme-text-muted mt-1 line-clamp-2">
                          {presentation.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-theme-text-muted hover:text-theme-text">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-theme-card border-theme-border">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            if (presentation.share_token) {
                              handleCopyExistingLink(presentation.share_token);
                            } else {
                              handleShare(presentation.id);
                            }
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          {presentation.share_token ? "Copy Link" : "Generate Share Link"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicatePresentation(presentation.id);
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-theme-border" />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this presentation?")) {
                              deletePresentation(presentation.id);
                            }
                          }}
                          className="text-red-400 focus:text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-theme-text-muted">
                    <div className="flex items-center gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>{presentation.items.length} items</span>
                    </div>
                    {presentation.view_count > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{presentation.view_count} views</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(new Date(presentation.updated_at), "MMM d")}</span>
                    </div>
                  </div>

                  {/* Shared badge */}
                  {presentation.is_public && (
                    <div className="mt-3 pt-3 border-t border-theme-border">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">
                        <Share2 className="w-3 h-3" />
                        Shared
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-theme-card border-theme-border text-theme-text">
          <DialogHeader>
            <DialogTitle>Create Presentation</DialogTitle>
            <DialogDescription className="text-theme-text-muted">
              Create a new presentation to bundle quotes and comparisons.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Q1 Investment Options for John"
                value={newPresentation.title}
                onChange={(e) => setNewPresentation(prev => ({ ...prev, title: e.target.value }))}
                className="bg-theme-bg border-theme-border text-theme-text"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this presentation..."
                value={newPresentation.description || ""}
                onChange={(e) => setNewPresentation(prev => ({ ...prev, description: e.target.value }))}
                className="bg-theme-bg border-theme-border text-theme-text resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-theme-border text-theme-text">
              Cancel
            </Button>
            <Button onClick={handleCreate} className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90">
              Create Presentation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PresentationsHub;
