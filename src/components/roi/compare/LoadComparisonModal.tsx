import { useState } from 'react';
import { FolderOpen, Trash2, Clock, LayoutGrid, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSavedComparisons, SavedComparison } from '@/hooks/useSavedComparisons';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface LoadComparisonModalProps {
  open: boolean;
  onClose: () => void;
  onLoad: (comparison: SavedComparison) => void;
}

export const LoadComparisonModal = ({
  open,
  onClose,
  onLoad,
}: LoadComparisonModalProps) => {
  const { comparisons, loading, deleteComparison } = useSavedComparisons();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingId) return;
    
    setIsDeleting(true);
    const { error } = await deleteComparison(deletingId);
    
    if (error) {
      toast({ title: 'Failed to delete comparison', variant: 'destructive' });
    } else {
      toast({ title: 'Comparison deleted' });
    }
    
    setIsDeleting(false);
    setDeletingId(null);
  };

  const handleLoad = (comparison: SavedComparison) => {
    onLoad(comparison);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="bg-theme-card border-theme-border text-theme-text max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-theme-accent" />
              Load Saved Comparison
            </DialogTitle>
            <DialogDescription className="text-theme-text-muted">
              Select a saved comparison to load.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-theme-accent" />
              </div>
            ) : comparisons.length === 0 ? (
              <div className="text-center py-8">
                <LayoutGrid className="w-12 h-12 text-theme-text-muted mx-auto mb-3" />
                <p className="text-theme-text-muted">No saved comparisons yet</p>
                <p className="text-sm text-theme-text-muted mt-1">
                  Save a comparison to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {comparisons.map((comparison) => (
                  <div
                    key={comparison.id}
                    className="p-4 bg-theme-bg rounded-lg border border-theme-border hover:border-theme-accent/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => handleLoad(comparison)}
                        className="flex-1 text-left"
                      >
                        <h4 className="font-medium text-theme-text group-hover:text-theme-accent transition-colors">
                          {comparison.title}
                        </h4>
                        {comparison.description && (
                          <p className="text-sm text-theme-text-muted mt-1 line-clamp-2">
                            {comparison.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-theme-text-muted">
                          <span className="flex items-center gap-1">
                            <LayoutGrid className="w-3 h-3" />
                            {comparison.quote_ids.length} quotes
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(comparison.updated_at), { addSuffix: true })}
                          </span>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(comparison.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text">Delete comparison?</AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-theme-border text-theme-text">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
