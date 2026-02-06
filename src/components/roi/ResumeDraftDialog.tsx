import { format } from 'date-fns';
import { FileEdit, Trash2, FilePlus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export interface DraftInfo {
  id: string;
  projectName?: string | null;
  developer?: string | null;
  clientName?: string | null;
  updatedAt?: string | null;
}

interface ResumeDraftDialogProps {
  open: boolean;
  draftInfo: DraftInfo | null;
  onResume: () => void;
  onStartFresh: () => void;
  isLoading?: boolean;
}

export const ResumeDraftDialog = ({
  open,
  draftInfo,
  onResume,
  onStartFresh,
  isLoading = false,
}: ResumeDraftDialogProps) => {
  const draftLabel = draftInfo?.projectName || draftInfo?.developer || draftInfo?.clientName || 'Untitled';
  const lastUpdated = draftInfo?.updatedAt 
    ? format(new Date(draftInfo.updatedAt), 'MMM d, yyyy h:mm a')
    : null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-theme-card border-theme-border max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-theme-text flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-theme-accent" />
            Resume Previous Draft?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-theme-text-muted space-y-3">
            <p>You have an unsaved draft that you can continue working on:</p>
            
            <div className="bg-theme-bg rounded-lg p-3 border border-theme-border">
              <p className="font-medium text-theme-text">{draftLabel}</p>
              {lastUpdated && (
                <p className="text-sm text-theme-text-muted mt-1">
                  Last edited: {lastUpdated}
                </p>
              )}
            </div>
            
            <p>Would you like to resume this draft or start fresh?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onStartFresh}
            disabled={isLoading}
            className="w-full sm:w-auto gap-2"
          >
            <FilePlus className="w-4 h-4" />
            Start Fresh
          </Button>
          <Button
            onClick={onResume}
            disabled={isLoading}
            className="w-full sm:w-auto gap-2 bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
          >
            <FileEdit className="w-4 h-4" />
            Resume Draft
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
