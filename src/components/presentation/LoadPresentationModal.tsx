import { useState } from "react";
import { FolderOpen, Trash2, Presentation, Calendar, Layers, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePresentations, Presentation as PresentationType } from "@/hooks/usePresentations";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface LoadPresentationModalProps {
  open: boolean;
  onClose: () => void;
  onLoad: (presentation: PresentationType) => void;
  currentPresentationId?: string;
}

export const LoadPresentationModal = ({ 
  open, 
  onClose, 
  onLoad,
  currentPresentationId 
}: LoadPresentationModalProps) => {
  const { presentations, loading, deletePresentation } = usePresentations();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    const success = await deletePresentation(deletingId);
    setIsDeleting(false);
    setDeletingId(null);
    
    if (success) {
      toast.success("Presentation deleted");
    } else {
      toast.error("Failed to delete presentation");
    }
  };

  const handleLoad = (presentation: PresentationType) => {
    onLoad(presentation);
    onClose();
  };

  const otherPresentations = presentations.filter(p => p.id !== currentPresentationId);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="bg-theme-card border-theme-border text-theme-text sm:max-w-md max-h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b border-theme-border">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-purple-400" />
              </div>
              Load Presentation
            </DialogTitle>
            <DialogDescription className="text-theme-text-muted">
              Select a presentation to open
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[400px]">
            <div className="p-4 space-y-2">
              {loading ? (
                <div className="text-center py-8 text-theme-text-muted">
                  Loading presentations...
                </div>
              ) : otherPresentations.length === 0 ? (
                <div className="text-center py-8 text-theme-text-muted">
                  <Presentation className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No other presentations</p>
                </div>
              ) : (
                otherPresentations.map(presentation => {
                  const quoteCount = presentation.items.filter(i => i.type === 'quote').length;
                  const compareCount = presentation.items.filter(i => i.type === 'comparison' || i.type === 'inline_comparison').length;
                  
                  return (
                    <div
                      key={presentation.id}
                      className="group p-3 rounded-lg border border-theme-border hover:border-theme-accent/30 transition-all cursor-pointer"
                      onClick={() => handleLoad(presentation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                            <Presentation className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-theme-text truncate group-hover:text-theme-accent transition-colors">
                              {presentation.title}
                            </p>
                            {presentation.description && (
                              <p className="text-xs text-theme-text-muted truncate mt-0.5">
                                {presentation.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(presentation.id);
                          }}
                          className="p-1.5 text-theme-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 pl-11 text-xs text-theme-text-muted">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {quoteCount + compareCount} items
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(presentation.updated_at), "MMM d")}
                        </span>
                        {presentation.is_public && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Share2 className="w-3 h-3" />
                            Shared
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-theme-border">
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-theme-text-muted hover:text-theme-text"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text">Delete Presentation?</AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              This action cannot be undone. This will permanently delete the presentation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-theme-border text-theme-text hover:bg-theme-bg">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
